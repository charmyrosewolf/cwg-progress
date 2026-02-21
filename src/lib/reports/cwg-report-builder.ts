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
  sortByBestPulls,
  sortFightMapByBestPulls
} from '@/lib/utils/helper';
import {
  BossDataQueryVars,
  createStatistic,
  createStatistics,
  difficultiesMap,
  WLOGS_FIGHT_QUERY,
  FightMap,
  GuildRaidEncounter,
  GuildRaidProgress,
  GuildRaidProgressStatistics,
  RaidInfo,
  REPORT_LIMIT,
  Statistic,
  WlogFlattenedFight
} from '@/lib/types';

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

  if (!flattenedEncounters || !flattenedEncounters.length) return null;

  flattenedEncounters.sort(sortByBestPulls);

  let normalBossesKilled = 0;
  let heroicBossesKilled = 0;
  let mythicBossesKilled = 0;

  const raidEncounters = raid.encounters.map(({ id, rSlug, name }) => {
    const allRaidBossPulls = flattenedEncounters.filter(
      ({ encounterID }) => id === encounterID
    );

    // get first best pull for each difficulty

    const nBoss = allRaidBossPulls.filter(
      ({ difficulty }) => difficulty === WLOGS_NORMAL_DIFFICULTY_ID
    )[0];

    const hBoss = allRaidBossPulls.filter(
      ({ difficulty }) => difficulty === WLOGS_HEROIC_DIFFICULTY_ID
    )[0];

    const mBoss = allRaidBossPulls.filter(
      ({ difficulty }) => difficulty === WLOGS_MYTHIC_DIFFICULTY_ID
    )[0];

    // update stats

    if (nBoss?.kill) {
      normalBossesKilled++;
    }

    if (hBoss?.kill) {
      heroicBossesKilled++;
    }

    if (mBoss?.kill) {
      mythicBossesKilled++;
    }

    // Get best difficulty defeated
    const difficulties = [mBoss, hBoss, nBoss];

    const maxDifficultyBossKilled = difficulties.find((boss) => boss?.kill);

    const maxDifficultyDefeated = maxDifficultyBossKilled
      ? wlogsDifficultiesMap[
          maxDifficultyBossKilled?.difficulty.toString() as WLOGS_RAID_DIFFICULTY
        ]
      : null;

    const timeDefeated = maxDifficultyBossKilled
      ? maxDifficultyBossKilled.endTime
      : null;

    return {
      encounterID: id,
      slug: rSlug,
      name: name,
      maxDifficultyDefeated,
      defeatedAt: timeDefeated?.toISOString()
    } as GuildRaidEncounter;
  });

  const fightMap: FightMap = getWlogFightMap(flattenedEncounters);
  const bestPullMap: FightMap | null = sortFightMapByBestPulls(fightMap);

  const updatedEncounters = buildCWGRaidEncounters(
    raid,
    flattenedEncounters,
    bestPullMap
  );

  let overallSummary: Statistic;
  const totalBosses = raidEncounters.length;

  if (mythicBossesKilled) {
    overallSummary = createStatistic('mythic', totalBosses, mythicBossesKilled);
  } else if (heroicBossesKilled) {
    overallSummary = createStatistic('heroic', totalBosses, heroicBossesKilled);
  } else {
    overallSummary = createStatistic('normal', totalBosses, normalBossesKilled);
  }

  const guildProgress: GuildRaidProgress = {
    guild: CWG,
    raidEncounters: updatedEncounters,
    overallSummary
  };

  return guildProgress;
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

  let normalBossesKilled = 0;
  let heroicBossesKilled = 0;
  let mythicBossesKilled = 0;

  const allBossesInOrder: WlogFlattenedFight[] = [];

  raid.encounters.forEach(({ id, rSlug, name }) => {
    const allRaidBossPulls = fights.filter(
      ({ encounterID }) => id === encounterID
    );

    // get first best pull for each difficulty

    const nBoss = allRaidBossPulls.filter(
      ({ difficulty }) => difficulty === WLOGS_NORMAL_DIFFICULTY_ID
    )[0];

    const hBoss = allRaidBossPulls.filter(
      ({ difficulty }) => difficulty === WLOGS_HEROIC_DIFFICULTY_ID
    )[0];

    const mBoss = allRaidBossPulls.filter(
      ({ difficulty }) => difficulty === WLOGS_MYTHIC_DIFFICULTY_ID
    )[0];

    // update stats

    if (nBoss?.kill) {
      normalBossesKilled++;
    }

    if (hBoss?.kill) {
      heroicBossesKilled++;
    }

    if (mBoss?.kill) {
      mythicBossesKilled++;
    }

    allBossesInOrder.push(...[mBoss, hBoss, nBoss]);
  });

  const hasAnyKills =
    normalBossesKilled || heroicBossesKilled || mythicBossesKilled;

  // don't continue if CWG doesn't have any kills
  if (!hasAnyKills) {
    return null;
  }

  const totalBosses = raid.encounters.length;

  const summaries = createStatistics(
    totalBosses,
    normalBossesKilled,
    heroicBossesKilled,
    mythicBossesKilled
  );

  let overallSummary: Statistic = summaries.findLast(
    (s) => s.bossesKilled
  ) as Statistic;

  const unkilledBosses = allBossesInOrder.filter((b) => b && !b.kill);
  const currentProgressionBoss: WlogFlattenedFight | null =
    unkilledBosses && unkilledBosses.length ? unkilledBosses[0] : null;

  let currentProgression = '';

  if (currentProgressionBoss) {
    const boss = raid.encounters.find(
      (e) => e.id === currentProgressionBoss?.encounterID
    );

    const splitName = boss?.name.replace(',', '').split(' ');

    let shortName = '';

    if (splitName && splitName.length) {
      // TODO: automate this?
      shortName = ['Awakened', 'The'].includes(splitName[0])
        ? splitName[1]
        : splitName[0];
    }

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
    const allRaidBossPulls = encounters.filter(
      ({ encounterID }) => id === encounterID
    );

    // get first best pull for each difficulty

    const nBoss = allRaidBossPulls.filter(
      ({ difficulty }) => difficulty === WLOGS_NORMAL_DIFFICULTY_ID
    )[0];

    const hBoss = allRaidBossPulls.filter(
      ({ difficulty }) => difficulty === WLOGS_HEROIC_DIFFICULTY_ID
    )[0];

    const mBoss = allRaidBossPulls.filter(
      ({ difficulty }) => difficulty === WLOGS_MYTHIC_DIFFICULTY_ID
    )[0];

    // Get best difficulty defeated
    const difficulties = [mBoss, hBoss, nBoss];

    const maxDifficultyBossKilled = difficulties.find((boss) => boss?.kill);

    const maxDifficultyDefeated = maxDifficultyBossKilled
      ? wlogsDifficultiesMap[
          maxDifficultyBossKilled?.difficulty.toString() as WLOGS_RAID_DIFFICULTY
        ]
      : null;

    const timeDefeated = maxDifficultyBossKilled
      ? maxDifficultyBossKilled.endTime
      : null;

    return {
      encounterID: id,
      slug: rSlug,
      name: name,
      maxDifficultyDefeated,
      defeatedAt: timeDefeated?.toISOString(),
      wlogKillUrl: maxDifficultyBossKilled?.url
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
      wlogBestPullUrl: bestPull?.url
    };
  });

  return newEncounters;
}
