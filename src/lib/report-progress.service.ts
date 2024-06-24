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
  BossDataQueryVars,
  RaidProgressEvent
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
import { sendDiscordMessage } from '@/app/_actions/discord';
import { getHost } from './helper';
import { CWG } from './data/guilds';

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

// CAREFUL ABOUT RAISING THIS NUMBER DUE TO RATE LIMITS
const REPORT_LIMIT = 5;

const FIGHT_QUERY = `query ($name: String, $server: String, $region: String, $startTime: Float, $endTime: Float) {
	reportData {
		reports(guildName: $name, guildServerSlug: $server, guildServerRegion: $region, limit: ${REPORT_LIMIT}, startTime: $startTime, endTime: $endTime) {
			data {
				code,
				startTime,
				endTime
				fights {
					encounterID,
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
  encounterID: number | undefined;
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
  encounterID: number | undefined;
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

type FightMap = Map<number, FlattenedFightData | FlattenedFightData[]>;

async function getWlogReportFightsByGuild(
  queryVars: any
): Promise<FightMap | null> {
  const queryResults = await postQuery(
    FIGHT_QUERY,
    queryVars,
    `FAILED TO FETCH FIGHTS FOR ${queryVars.name}`
  );

  const data: PulledReportData[] = queryResults.data?.reportData?.reports?.data;

  if (!data) return null;

  const flattenedEncounters =
    data && data.length ? processWlogReports(data) : [];

  const fightMap: FightMap = flattenedEncounters.reduce(
    (acc: FightMap, fight, index) => {
      const encounterID = fight.encounterID as number;
      if (acc && acc.has(encounterID)) {
        acc.set(encounterID, [...(acc.get(encounterID) as []), fight]);
      } else {
        acc.set(encounterID, [fight]);
      }
      return acc;
    },
    new Map() as FightMap
  );

  fightMap.forEach((fights, encounterId) => {
    (fights as FlattenedFightData[]).sort(sortByBestPulls);

    let bestPull = (fights as FlattenedFightData[])[0];

    fightMap.set(encounterId, bestPull);
  });

  return fightMap;
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

  // TODO: try to send back in tuple [stats, progData]
  const raidStats = normalProgress.raid_progression[raid.slug];

  const hasAnyKills =
    raidStats.normal_bosses_killed ||
    raidStats.heroic_bosses_killed ||
    raidStats.mythic_bosses_killed;

  // don't continue if guild doesn't have any kills
  if (!hasAnyKills) {
    return null;
  }

  // raid encounters
  // For each POSSIBLE encounter, determine the highest difficulty defeated, if any
  const raidEncounters = raid.encounters.map((pe) => {
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

    return {
      encounterID: pe.id,
      slug: pe.rSlug,
      name: pe.name,
      maxDifficultyDefeated: maxDifficultyDefeated,
      defeatedAt:
        bossDefeated && bossDefeated.defeatedAt ? bossDefeated.defeatedAt : null
    } as GuildRaidEncounter;
  });

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

export function updateRaidEncountersWithWlogs(
  bestPulls: FightMap,
  encounters: GuildRaidEncounter[]
): GuildRaidEncounter[] {
  // iterate over each raid encounter
  const newEncounters: GuildRaidEncounter[] = encounters.map((re) => {
    let encounterID = re.encounterID;
    let maxDifficultyAttempted = null;
    let lowestBossPercentage = null;

    let bestPull = bestPulls.get(encounterID) as FlattenedFightData;

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
      }
    }

    return {
      ...re,
      maxDifficultyAttempted,
      lowestBossPercentage
    };
  });

  return newEncounters;
}

/* Generates a report for a raid */
export async function generateProgressReport(
  raid: RaidInfo
): Promise<ProgressReport | null> {
  // raid may not exist
  if (!raid) return null;

  // Fetch progress for raid
  let raidProgression: GuildRaidProgress[] = [];
  const recentEvents: RaidProgressEvent[] = [];


  // Fetch raid progress per guild
  for (const g of GUILDS) {
    const result = await createGuildProgressionReport(raid, g);
    if (!result) {
      continue;
    }

    const queryVars: Omit<BossDataQueryVars, 'encounterID'> = {
      name: g.name,
      server: g.realm.toLowerCase().replaceAll("'", ''),
      region: g.region,
      startTime: new Date(SEASON_START_DATE).getTime(),
      endTime: SEASON_END_DATE
        ? new Date(SEASON_START_DATE).getTime()
        : undefined
    };

    const bestPulls: FightMap | null = await getWlogReportFightsByGuild(
      queryVars
    );

    if (bestPulls) {
      const raidEncounters = updateRaidEncountersWithWlogs(
        bestPulls,
        result.raidEncounters
      );

      // todo: only collect recent kills for now, tracking new bests will be a littler trickier
      const recent: RaidProgressEvent[] = raidEncounters
        .filter((re) => re.defeatedAt)
        .map((re) => {
          return {
            guildName: g.name,
            bossName: re.name,
            dateOccurred: new Date(re.defeatedAt)
          };
        });

      recentEvents.push(...recent);

      result.raidEncounters = raidEncounters;
    }

    raidProgression.push(result);
  }

  recentEvents.sort((a, b) => (a.dateOccurred < b.dateOccurred ? 1 : -1));

  const top5Events = recentEvents.slice(0, 5);

  // TODO: fetch wlogs for CWG

  const result: ProgressReport = {
    raid,
    raidProgression: raidProgression,
    createdOn: new Date(),
    recentEvents: top5Events
  };

  return result;
}

/* Generates a reports for current season by raid name slug */
export async function generateProgressReportBySlug(
  slug: string
): Promise<ProgressReport | null> {
  console.log('\ngenerating report for:', slug);

  const raid = RAIDS.find((r) => r.slug === slug);

  // raid may not exist
  if (!raid) return null;

  const report = await generateProgressReport(raid);

  // collect events
  // todo: can we cache this date and filter what we send by what came after it?
  const last24Hours = new Date();
  console.log(last24Hours.getDate());
  last24Hours.setDate(last24Hours.getDate() - 7);
  console.log(last24Hours, report?.recentEvents[0].dateOccurred);
  const updates = report
    ? report.recentEvents.filter((e) => e.dateOccurred > last24Hours)
    : [];

  console.log(updates.length);

  if (updates.length) {
    // sendUpdate(slug, updates);
  }

  // sendUpdate(slug, updates);

  return report;
}

export async function sendUpdate(slug: string, updates: RaidProgressEvent[]) {
  const host = getHost();

  const time = new Date();

  // ADD RAID NAME to TITLE
  let message = `# Updates for ${time.toDateString()}\n\n`;

  for (const u of updates) {
    message += `${u.guildName} defeated ${
      u.bossName
    } at ${u.dateOccurred.toDateString()}\n`;
  }

  message += `\nTo see the changes go to ${host}/raid/${slug}`;

  console.log(message);

  const message2 = `Hello World! This deployment has been updated at ${time.toDateString()} ${time.toLocaleTimeString()}. To see the changes go to ${host}/raid/${slug}`;

  await sendDiscordMessage(message2);
}
