/**
 * Community Strategy
 *
 * A community (CWG) isn't a real guild, so Raider.io can't rank it. Everything
 * here is built from Warcraft Logs fight data instead.
 */

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
  GuildInfo,
  GuildRaidEncounter,
  GuildRaidProgress,
  GuildRaidProgressStatistics,
  RAID_DIFFICULTY,
  RaidInfo,
  REPORT_LIMIT,
  Statistic,
  WlogFlattenedFight
} from '@/lib/types';
import {
  GuildReportStrategy,
  SummaryResult,
  createEventsByGuild
} from './guild-report-strategy';

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
function getMaxDifficultyKill({
  nBoss,
  hBoss,
  mBoss
}: Pick<EncounterPulls, 'nBoss' | 'hBoss' | 'mBoss'>): {
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

type CommunityKillCounts = {
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
function countKillsByDifficulty(
  raid: RaidInfo,
  fights: WlogFlattenedFight[]
): CommunityKillCounts {
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

// ─── WCL data fetching ──────────────────────────────────────

/**
 * Fetches this season's fights for the community from WCL, keeping only
 * the encounters that belong to the given raid.
 */
export async function fetchWlogFights(
  raid: RaidInfo,
  guild: GuildInfo
): Promise<WlogFlattenedFight[] | null> {
  const seasonStartDate = await getSeasonStartDate();
  const seasonEndDate = await getSeasonEndDate();

  const queryVars: BossDataQueryVars = {
    name: guild.name,
    server: guild.realm.toLowerCase().replaceAll("'", ''),
    region: guild.region,
    startTime: new Date(seasonStartDate).getTime(),
    endTime: seasonEndDate ? new Date(seasonEndDate).getTime() : undefined,
    reportLimit: REPORT_LIMIT
  };

  const queryResults = await postQuery(
    WLOGS_FIGHT_QUERY,
    queryVars,
    `FAILED TO FETCH FIGHTS FOR ${queryVars.name}`
  );

  // postQuery resolves to null when WCL rejects the request (auth, rate limit)
  const data: WlogReport[] = queryResults?.data?.reportData?.reports?.data;

  if (!data) return null;

  const encounterIds = raid.encounters.map(({ id }) => id);

  return data.length
    ? flattenWLOGReportFights(data).filter(({ encounterID }) =>
        encounterID ? encounterIds.includes(encounterID) : false
      )
    : [];
}

// ─── Report building ────────────────────────────────────────

/**
 * Builds the per-encounter view: kills, plus the best pull on the highest
 * difficulty attempted.
 *
 * Exported for testing — CommunityStrategy is the production entry point.
 */
export function buildRaidEncounters(
  raid: RaidInfo,
  fights: WlogFlattenedFight[],
  bestPullMap: FightMap
): GuildRaidEncounter[] {
  const encounters = buildEncountersWithKills(raid, fights);

  return encounters.map((re) => {
    const encounterID = re.encounterID;
    let maxDifficultyAttempted = null;
    let lowestBossPercentage = null;

    const bestPull = bestPullMap.get(encounterID) as WlogFlattenedFight;

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
}

/**
 * Builds the summary-table statistics: kill counts per difficulty and the
 * boss the community is currently working on. Returns null when there are
 * no kills at all, which keeps the community out of the summary table.
 *
 * Exported for testing — CommunityStrategy is the production entry point.
 */
export function buildProgressStatistics(
  raid: RaidInfo,
  fights: WlogFlattenedFight[],
  guild: GuildInfo
): GuildRaidProgressStatistics | null {
  if (!fights) return null;

  fights.sort(sortByBestPulls);

  const { normalKills, heroicKills, mythicKills, allBossesInOrder } =
    countKillsByDifficulty(raid, fights);

  const hasAnyKills = normalKills || heroicKills || mythicKills;

  // don't continue if the community doesn't have any kills
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

  const overallSummary: Statistic = summaries.findLast(
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
    guild,
    overallSummary,
    totalBosses,
    summaries,
    currentProgression
  };
}

// ─── CommunityStrategy ──────────────────────────────────────

export class CommunityStrategy implements GuildReportStrategy {
  async buildProgress(
    raid: RaidInfo,
    guild: GuildInfo
  ): Promise<GuildRaidProgress | null> {
    const fights = await fetchWlogFights(raid, guild);

    if (!fights?.length) return null;

    fights.sort(sortByBestPulls);

    const { normalKills, heroicKills, mythicKills } = countKillsByDifficulty(
      raid,
      fights
    );

    const fightMap: FightMap = getWlogFightMap(fights);
    const bestPullMap: FightMap = sortFightMapByBestPulls(fightMap);
    const raidEncounters = buildRaidEncounters(raid, fights, bestPullMap);

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

    return { guild, raidEncounters, overallSummary };
  }

  async buildSummary(
    raid: RaidInfo,
    guild: GuildInfo
  ): Promise<SummaryResult> {
    const fights = await fetchWlogFights(raid, guild);

    if (!fights) return { stats: null, events: [] };

    const stats = buildProgressStatistics(raid, fights, guild);

    const fightMap: FightMap = getWlogFightMap(fights);
    const bestPullMap: FightMap = sortFightMapByBestPulls(fightMap);
    const encounters = buildRaidEncounters(raid, fights, bestPullMap);

    const events = createEventsByGuild(guild, raid, encounters);

    return { stats, events };
  }
}
