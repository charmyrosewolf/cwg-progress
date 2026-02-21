import { postQuery } from '@/lib/api/wlogs.api';
import {
  WlogReport,
  WLOGS_HEROIC_DIFFICULTY_ID,
  WLOGS_MYTHIC_DIFFICULTY_ID,
  WLOGS_NORMAL_DIFFICULTY_ID,
  WLOGS_RAID_DIFFICULTY,
  wlogsDifficultiesMap
} from '@/lib/api/wlogs.types';
import { getSeasonStartDate, getSeasonEndDate } from '@/lib/data';
import { CWG } from '@/lib/data/guilds';
import {
  flattenWLOGReportFights,
  getWlogFightMap,
  shortenBossName,
  sortByBestPulls,
  sortFightMapByBestPulls
} from '@/lib/utils/helper';
import {
  BossDataQueryVars,
  createStatistics,
  difficultiesMap,
  WLOGS_FIGHT_QUERY,
  FightMap,
  GuildRaidEncounter,
  GuildRaidProgress,
  GuildRaidProgressStatistics,
  RAID_DIFFICULTY,
  RaidInfo,
  REPORT_LIMIT,
  Statistic,
  WlogFlattenedFight
} from '@/lib/types';

// ─── Shared helpers ─────────────────────────────────────────

type EncounterPulls = {
  nBoss: WlogFlattenedFight | undefined;
  hBoss: WlogFlattenedFight | undefined;
  mBoss: WlogFlattenedFight | undefined;
  allPulls: WlogFlattenedFight[];
};

/**
 * Given a sorted list of fights, extracts the best pull per difficulty
 * for a single encounter. Fights must already be sorted by sortByBestPulls
 * so .find() returns the best pull for each difficulty.
 */
function getPullsByDifficulty(
  fights: WlogFlattenedFight[],
  encounterID: number
): EncounterPulls {
  const allPulls = fights.filter((f) => f.encounterID === encounterID);
  return {
    nBoss: allPulls.find((f) => f.difficulty === WLOGS_NORMAL_DIFFICULTY_ID),
    hBoss: allPulls.find((f) => f.difficulty === WLOGS_HEROIC_DIFFICULTY_ID),
    mBoss: allPulls.find((f) => f.difficulty === WLOGS_MYTHIC_DIFFICULTY_ID),
    allPulls
  };
}

/**
 * Finds the highest-difficulty kill among normal/heroic/mythic boss pulls.
 * Returns null if no kills exist.
 */
function getMaxDifficultyKill(
  { nBoss, hBoss, mBoss }: Pick<EncounterPulls, 'nBoss' | 'hBoss' | 'mBoss'>
): {
  killedBoss: WlogFlattenedFight;
  maxDifficultyDefeated: RAID_DIFFICULTY;
} | null {
  const killedBoss = [mBoss, hBoss, nBoss].find((b) => b?.kill);
  if (!killedBoss) return null;
  return {
    killedBoss,
    maxDifficultyDefeated:
      wlogsDifficultiesMap[
        killedBoss.difficulty.toString() as WLOGS_RAID_DIFFICULTY
      ]
  };
}

type CWGKillCounts = {
  normalKills: number;
  heroicKills: number;
  mythicKills: number;
  /** Best pulls per encounter in M, H, N order — used for progression detection */
  allBossesInOrder: (WlogFlattenedFight | undefined)[];
};

/**
 * Counts kills per difficulty from WCL fight data.
 * Also collects all best pulls in M → H → N order per encounter
 * for downstream progression detection.
 */
function countCWGKillsByDifficulty(
  raid: RaidInfo,
  fights: WlogFlattenedFight[]
): CWGKillCounts {
  let normalKills = 0;
  let heroicKills = 0;
  let mythicKills = 0;
  const allBossesInOrder: (WlogFlattenedFight | undefined)[] = [];

  for (const { id } of raid.encounters) {
    const { nBoss, hBoss, mBoss } = getPullsByDifficulty(fights, id);
    if (nBoss?.kill) normalKills++;
    if (hBoss?.kill) heroicKills++;
    if (mBoss?.kill) mythicKills++;
    allBossesInOrder.push(mBoss, hBoss, nBoss);
  }

  return { normalKills, heroicKills, mythicKills, allBossesInOrder };
}

/**
 * buildCWGProgressReport
 *
 * since CWG isn't a guild, it can't be fetched by raiderio, so
 * we have to use wlogs and build the data ourselves
 *
 * @param raid
 * @returns
 */
export async function buildCWGProgressReport(
  raid: RaidInfo
): Promise<GuildRaidProgress | null> {
  const flattenedEncounters = await getCWGWlogReportFights(raid);

  if (!flattenedEncounters?.length) return null;

  flattenedEncounters.sort(sortByBestPulls);

  const { normalKills, heroicKills, mythicKills } =
    countCWGKillsByDifficulty(raid, flattenedEncounters);

  // Build encounters with kill + best pull data
  const fightMap: FightMap = getWlogFightMap(flattenedEncounters);
  const bestPullMap: FightMap | null = sortFightMapByBestPulls(fightMap);
  const raidEncounters = buildCWGRaidEncounters(
    raid,
    flattenedEncounters,
    bestPullMap
  );

  const totalBosses = raid.encounters.length;
  const summaries = createStatistics(
    totalBosses,
    normalKills,
    heroicKills,
    mythicKills
  );
  const overallSummary = summaries.findLast(
    (s) => s.bossesKilled
  ) as Statistic;

  return { guild: CWG, raidEncounters, overallSummary };
}

/** New Stuff */

export async function getCWGWlogReportFights(
  raid: RaidInfo
): Promise<WlogFlattenedFight[] | null> {
  const seasonStartDate = await getSeasonStartDate();
  const seasonEndDate = await getSeasonEndDate();

  const startTs = new Date(seasonStartDate).getTime();
  const endTs = seasonEndDate ? new Date(seasonEndDate).getTime() : undefined;

  const queryVars: BossDataQueryVars = {
    name: CWG.name,
    server: CWG.realm.toLowerCase().replaceAll("'", ''),
    region: CWG.region,
    startTime: startTs,
    endTime: endTs,
    reportLimit: REPORT_LIMIT
  };

  const queryResults = await postQuery(
    WLOGS_FIGHT_QUERY,
    queryVars,
    `FAILED TO FETCH FIGHTS FOR ${queryVars.name}`
  );

  const data: WlogReport[] = queryResults.data?.reportData?.reports?.data;

  if (!data) return null;

  const encounterIds = raid.encounters.map(({ id }) => id);

  const flattenedEncounters =
    data && data.length
      ? flattenWLOGReportFights(data).filter(({ encounterID }) => {
          return encounterID ? encounterIds.includes(encounterID) : false;
        })
      : [];

  return flattenedEncounters;
}

/**
 * buildCWGSummaryReport
 *
 * since CWG isn't a guild, it can't be fetched by raiderio, so
 * we have to use wlogs and build the data ourselves
 *
 * @param raid
 * @returns
 */
export function buildCWGProgressStatistics(
  raid: RaidInfo,
  fights: WlogFlattenedFight[]
): GuildRaidProgressStatistics | null {
  if (!fights) return null;

  fights.sort(sortByBestPulls);

  const { normalKills, heroicKills, mythicKills, allBossesInOrder } =
    countCWGKillsByDifficulty(raid, fights);

  const hasAnyKills = normalKills || heroicKills || mythicKills;

  // don't continue if CWG doesn't have any kills
  if (!hasAnyKills) {
    return null;
  }

  const totalBosses = raid.encounters.length;

  const summaries = createStatistics(
    totalBosses,
    normalKills,
    heroicKills,
    mythicKills
  );

  let overallSummary: Statistic = summaries.findLast(
    (s) => s.bossesKilled
  ) as Statistic;

  const unkilledBosses = allBossesInOrder.filter(
    (b): b is WlogFlattenedFight => !!b && !b.kill
  );
  const currentProgressionBoss: WlogFlattenedFight | null =
    unkilledBosses.length ? unkilledBosses[0] : null;

  let currentProgression = '';

  if (currentProgressionBoss) {
    const boss = raid.encounters.find(
      (e) => e.id === currentProgressionBoss?.encounterID
    );

    const shortName = boss ? shortenBossName(boss.name) : '';

    const diff =
      wlogsDifficultiesMap[
        currentProgressionBoss.difficulty.toString() as WLOGS_RAID_DIFFICULTY
      ][0].toUpperCase();

    currentProgression = `${diff} ${shortName}=${currentProgressionBoss.bossPercentage}%`;
  }

  return {
    guild: CWG,
    overallSummary,
    totalBosses,
    summaries,
    currentProgression
  };
}

function buildEncountersWithKills(
  raid: RaidInfo,
  encounters: WlogFlattenedFight[]
): GuildRaidEncounter[] {
  encounters.sort(sortByBestPulls);

  return raid.encounters.map(({ id, rSlug, name }) => {
    const pulls = getPullsByDifficulty(encounters, id);
    const killInfo = getMaxDifficultyKill(pulls);

    return {
      encounterID: id,
      slug: rSlug,
      name,
      maxDifficultyDefeated: killInfo?.maxDifficultyDefeated ?? null,
      defeatedAt: killInfo?.killedBoss.endTime?.toISOString() ?? '',
      wlogKillUrl: killInfo?.killedBoss.url
    } as GuildRaidEncounter;
  });
}

/**
 * buildCWGRaidEncounters

 *
 * @param raid
 * @returns
 */
export function buildCWGRaidEncounters(
  raid: RaidInfo,
  fights: WlogFlattenedFight[],
  bestPullMap: FightMap
): GuildRaidEncounter[] {
  const encounters = buildEncountersWithKills(raid, fights);

  const newEncounters: GuildRaidEncounter[] = encounters.map((re) => {
    let encounterID = re.encounterID;
    let maxDifficultyAttempted = null;
    let lowestBossPercentage = null;

    let bestPull = bestPullMap.get(encounterID) as WlogFlattenedFight;

    if (bestPull) {
      const diff = `${bestPull.difficulty}` as WLOGS_RAID_DIFFICULTY;

      const attempted = wlogsDifficultiesMap[diff];

      if (
        re.maxDifficultyDefeated &&
        difficultiesMap[attempted] >= difficultiesMap[re.maxDifficultyDefeated]
      ) {
        maxDifficultyAttempted = attempted;
        lowestBossPercentage = bestPull.bossPercentage;
      } else {
        // wlogs has an inconsistency -- guild is likely not uploading reports
        // TODO: default to raider.io data
      }
    }

    return {
      ...re,
      maxDifficultyAttempted,
      lowestBossPercentage,
      attemptedAt: bestPull?.startTime?.toISOString() ?? null,
      wlogBestPullUrl: bestPull?.url
    };
  });

  return newEncounters;
}
