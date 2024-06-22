import {
  RAID_DIFFICULTY,
  GuildInfo,
  GuildRaidEncounter,
  GuildRaidProgress,
  RaidInfo,
  ProgressReport,
  DifficultiesMapType,
  WLogsDifficultiesMapType,
  WLOGS_RAID_DIFFICULTY,
  BossDataQueryVars
} from './types';

// TODO: update this each season.
import {
  RAIDS,
  SEASON_END_DATE,
  SEASON_START_DATE,
  GUILDS
} from './data/index';

import { fetchGuildProgressionByDifficulty } from './api/raiderio.api';
import { postQuery } from './api/wlogs.api';

const difficultiesArray: RAID_DIFFICULTY[] = ['normal', 'heroic', 'mythic'];

const difficultiesMap: DifficultiesMapType = {
  normal: 0,
  heroic: 1,
  mythic: 2
};

const wlogsDifficultiesMap: WLogsDifficultiesMapType = {
  '3': 'normal',
  '4': 'heroic',
  '5': 'mythic'
};

const FIGHT_QUERY = `query ($name: String, $server: String, $region: String, $encounterID: Int, $startTime: Float, $endTime: Float) {
	reportData {
		reports(guildName: $name, guildServerSlug: $server, guildServerRegion: $region, limit: 5, startTime: $startTime, endTime: $endTime) {
			data {
				code,
				startTime,
				endTime
				fights(encounterID: $encounterID) {
					name,
					startTime,
					endTime,
					difficulty,
					kill,
					bossPercentage,
					fightPercentage,
				}
			}
		}
	}
}`;

// RAW DATA TYPES
type FightData = {
  name: string;
  startTime: number;
  endTime: number;
  difficulty: number;
  kill: boolean;
  bossPercentage: number;
  fightPercentage: number;
};

type PulledReportData = {
  code: string;
  startTime: number;
  endTime: number;
  fights: FightData[];
};

type FlattenedFightData = {
  code: string;
  name: string;
  startTime: Date;
  endTime: Date;
  reportStartTime: Date;
  reportEndTime: Date;
  difficulty: number;
  kill: boolean;
  bossPercentage: number;
  fightPercentage: number;
};

// TODO: Might need to change return type as data grows
function processWlogReports(reports: PulledReportData[]): FlattenedFightData[] {
  return reports
    .filter((report) => {
      return report.fights.length;
    })
    .map((report) =>
      report.fights.map((f) => {
        return {
          code: report.code,
          reportStartTime: new Date(report.startTime),
          reportEndTime: new Date(report.endTime),
          ...f,
          startTime: new Date(f.startTime),
          endTime: new Date(f.endTime)
        };
      })
    )
    .flat();
  // .sort((a, b) => (a.reportStartTime > b.reportStartTime ? 1 : -1));
}

export function sortByBestPulls(a: FlattenedFightData, b: FlattenedFightData) {
  return (
    b.difficulty - a.difficulty ||
    Number(b.kill) - Number(a.kill) ||
    a.bossPercentage - b.bossPercentage
  );
}

async function getBestPullData(
  queryVars: BossDataQueryVars
): Promise<FlattenedFightData | null> {
  const queryResults = await postQuery(
    FIGHT_QUERY,
    queryVars,
    `FAILED TO FETCH ENCOUNTER ${queryVars.encounterID} FOR ${queryVars.name}`
  );

  // console.log(queryVars);

  const data: PulledReportData[] = queryResults.data?.reportData?.reports?.data;

  if (!data) return null;

  const flattenedEncounters =
    data && data.length ? processWlogReports(data) : [];

  flattenedEncounters.sort(sortByBestPulls);

  let bestPull = flattenedEncounters.length ? flattenedEncounters[0] : null;

  return bestPull;
}

async function createGuildProgressionReport(
  raid: RaidInfo,
  guild: GuildInfo
): Promise<GuildRaidProgress | null> {
  const normalProgress = await fetchGuildProgressionByDifficulty(
    raid.slug,
    guild,
    'normal'
  );

  const heroicProgress = await fetchGuildProgressionByDifficulty(
    raid.slug,
    guild,
    'heroic'
  );

  const mythicProgress = await fetchGuildProgressionByDifficulty(
    raid.slug,
    guild,
    'mythic'
  );

  const realmSlug = guild.realm.toLowerCase().replaceAll("'", '');
  const raidStats = normalProgress.raid_progression[raid.slug];

  const hasAnyKills =
    raidStats.normal_bosses_killed ||
    raidStats.heroic_bosses_killed ||
    raidStats.mythic_bosses_killed;

  // don't continue if guild doesn't have any kills
  if (!hasAnyKills) {
    return null;
  }

  const queryVars: BossDataQueryVars = {
    encounterID: 0,
    name: guild.name,
    server: realmSlug,
    region: guild.region,
    startTime: new Date(SEASON_START_DATE).getTime(),
    endTime: SEASON_END_DATE ? new Date(SEASON_START_DATE).getTime() : undefined
  };

  // For each POSSIBLE encounter, determine the highest difficulty defeated, if any
  const raidEncountersPromises = raid.encounters.map(async (pe) => {
    const findByBossName = (e: any) => e.name === pe.name;

    const nBoss = normalProgress.raid_encounters?.find(findByBossName);
    const hBoss = heroicProgress.raid_encounters?.find(findByBossName);
    const mBoss = mythicProgress.raid_encounters?.find(findByBossName);

    const difficulties = [nBoss, hBoss, mBoss];

    const maxIndexDefeated = difficulties.findLastIndex(
      (boss) => boss?.defeatedAt
    );

    const maxDifficultyDefeated =
      maxIndexDefeated >= 0 ? difficultiesArray[maxIndexDefeated] : null;

    const bossDefeated = difficulties[maxIndexDefeated];

    // TODO: here would be the opportunity to fetch best pull info if maxDifficultyDefeated = null
    //   and add more properties to GuildRaidEncounter type

    // warcraft logs best pull?

    let maxDifficultyAttempted = null;
    let lowestBossPercentage = null;

    queryVars.encounterID = pe.id;
    const bestPull = await getBestPullData(queryVars);

    // console.log(maxDifficultyDefeated);
    // console.log('best pull', bestPull);

    if (bestPull) {
      const diff = `${bestPull.difficulty}` as WLOGS_RAID_DIFFICULTY;

      const attempted = wlogsDifficultiesMap[diff];

      if (
        maxDifficultyDefeated &&
        difficultiesMap[attempted] >= difficultiesMap[maxDifficultyDefeated]
      ) {
        maxDifficultyAttempted = attempted;
        lowestBossPercentage = bestPull.bossPercentage;
      } else {
        // wlogs has an inconsistency -- guild is likely not uploading reports
      }
    }

    return {
      slug: pe.rSlug,
      name: pe.name,
      maxDifficultyDefeated: maxDifficultyDefeated,
      defeatedAt:
        bossDefeated && bossDefeated.defeatedAt
          ? bossDefeated.defeatedAt
          : null,
      maxDifficultyAttempted,
      lowestBossPercentage
    } as GuildRaidEncounter;
  });

  const raidEncounters = await Promise.all(raidEncountersPromises);

  const guildProgress: GuildRaidProgress = {
    guild: guild,
    faction: normalProgress.faction,
    profileUrl: normalProgress.profile_url,
    raidEncounters: raidEncounters,
    stats: {
      summary: raidStats.summary,
      totalBosses: raidStats.total_bosses,
      normalBossesKilled: raidStats.normal_bosses_killed,
      heroicBossesKilled: raidStats.heroic_bosses_killed,
      mythicBossesKilled: raidStats.mythic_bosses_killed
    }
  };

  return guildProgress;
}

/* Generates a report for a raid */
export async function generateProgressReport(
  raid: RaidInfo
): Promise<ProgressReport | null> {
  // raid may not exist
  if (!raid) return null;

  // Fetch progress for raid
  let raidProgression: GuildRaidProgress[] = [];

  // Fetch raid progress per guild
  for (const g of GUILDS) {
    const result = await createGuildProgressionReport(raid, g);
    if (result) {
      raidProgression.push(result);
    }
  }

  const result: ProgressReport = {
    raid,
    raidProgression: raidProgression
  };

  return result;
}

/* Generates all reports for current season */
export async function generateProgressReports(): Promise<ProgressReport[]> {
  const results: ProgressReport[] = [];

  // Fetch progress per raid
  for (const r of RAIDS) {
    let raidProgression: GuildRaidProgress[] = [];

    // Fetch raid progress per guild
    for (const g of GUILDS) {
      const result = await createGuildProgressionReport(r, g);
      if (result) {
        raidProgression.push(result);
      }
    }

    results.push({
      raid: r,
      raidProgression: raidProgression
    } as ProgressReport);
  }

  return results;
}

/* Generates a reports for current season by raid name slug */
export async function generateProgressReportBySlug(
  slug: string
): Promise<ProgressReport | null> {
  const raid = RAIDS.find((r) => r.slug === slug);

  // raid may not exist
  if (!raid) return null;

  return generateProgressReport(raid);
}