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
  RaidProgressEvent,
  WLOGS_NORMAL_DIFFICULTY_ID,
  WLOGS_HEROIC_DIFFICULTY_ID,
  WLOGS_MYTHIC_DIFFICULTY_ID
} from './types';

// TODO: update this each season.
import {
  RAIDS,
  SEASON_END_DATE,
  SEASON_START_DATE,
  GUILDS,
  isCWG
} from './data/index';

import { fetchGuildProgressionByDifficulty } from './api/raiderio.api';
import { postQuery } from './api/wlogs.api';
import { sendDiscordMessage } from '@/app/_actions/discord';
import { getHost, getUnixTimestampInSeconds, isDevelopment } from './helper';
import { CWG } from './data/guilds';
import { revalidatePath } from 'next/cache';

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

const FIGHT_QUERY = `query ($name: String, $server: String, $region: String, $startTime: Float, $endTime: Float, $reportLimit: Int) {
	reportData {
		reports(guildName: $name, guildServerSlug: $server, guildServerRegion: $region, limit: $reportLimit, startTime: $startTime, endTime: $endTime) {
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
          startTime: new Date(report.startTime + f.startTime),
          endTime: new Date(report.startTime + f.endTime)
        };
      })
    )
    .flat();
  // .sort((a, b) => (a.reportStartTime > b.reportStartTime ? 1 : -1));
}

function sortByBestPulls(a: FlattenedFightData, b: FlattenedFightData) {
  return (
    b.difficulty - a.difficulty ||
    Number(b.kill) - Number(a.kill) ||
    a.bossPercentage - b.bossPercentage ||
    (a.reportStartTime > b.reportStartTime ? 1 : -1)
  );
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

function updateRaidEncountersWithWlogs(
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

/**
 * buildCWGReport
 *
 * since CWG isn't a guild, it can't be fetched by raiderio, so
 * we have to use wlogs and build the data ourselves
 *
 * @param raid
 * @returns
 */
async function buildCWGReport(raid: RaidInfo) {
  const startTs = new Date(SEASON_START_DATE).getTime();
  const endTs = SEASON_END_DATE
    ? new Date(SEASON_END_DATE).getTime()
    : undefined;

  const queryVars: BossDataQueryVars = {
    name: CWG.name,
    server: CWG.realm.toLowerCase().replaceAll("'", ''),
    region: CWG.region,
    startTime: startTs,
    endTime: endTs,
    reportLimit: 20
  };

  const queryResults = await postQuery(
    FIGHT_QUERY,
    queryVars,
    `FAILED TO FETCH FIGHTS FOR ${queryVars.name}`
  );

  const data: PulledReportData[] = queryResults.data?.reportData?.reports?.data;

  if (!data) return null;

  const encounterIds = raid.encounters.map(({ id }) => id);

  const flattenedEncounters =
    data && data.length
      ? processWlogReports(data).filter(({ encounterID }) => {
          return encounterID ? encounterIds.includes(encounterID) : false;
        })
      : [];

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

  let overallProgressSummary = 'None';

  if (mythicBossesKilled) {
    overallProgressSummary = `${mythicBossesKilled}/${raidEncounters.length} M`;
  } else if (heroicBossesKilled) {
    overallProgressSummary = `${heroicBossesKilled}/${raidEncounters.length} H`;
  } else if (normalBossesKilled) {
    overallProgressSummary = `${normalBossesKilled}/${raidEncounters.length} N`;
  }

  const guildProgress: GuildRaidProgress = {
    guild: CWG,
    faction: CWG.faction,
    profileUrl: `https://www.warcraftlogs.com/guild/id/697334/`,
    raidEncounters: raidEncounters,
    stats: {
      summary: overallProgressSummary,
      totalBosses: raidEncounters.length,
      normalBossesKilled: normalBossesKilled,
      heroicBossesKilled: heroicBossesKilled,
      mythicBossesKilled: mythicBossesKilled
    }
  };

  return guildProgress;
}

/* Generates a report for a raid */
async function generateProgressReport(
  raid: RaidInfo
): Promise<ProgressReport | null> {
  // raid may not exist
  if (!raid) return null;

  // Fetch progress for raid
  let raidProgression: GuildRaidProgress[] = [];
  const allEvents: RaidProgressEvent[] = [];

  // Fetch raid progress per guild
  for (const g of GUILDS) {
    const result = isCWG(g.slug)
      ? await buildCWGReport(raid)
      : await createGuildProgressionReport(raid, g);

    if (!result) {
      // console.log('NO result for', g.name);
      continue;
    }

    const queryVars: BossDataQueryVars = {
      name: g.name,
      server: g.realm.toLowerCase().replaceAll("'", ''),
      region: g.region,
      startTime: new Date(SEASON_START_DATE).getTime(),
      endTime: SEASON_END_DATE
        ? new Date(SEASON_START_DATE).getTime()
        : undefined,
      reportLimit: isCWG(g.slug) ? 20 : REPORT_LIMIT
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
      const events: RaidProgressEvent[] = raidEncounters
        .filter((re) => re.defeatedAt || re.lowestBossPercentage)
        .map((re) => {
          if (re.defeatedAt) {
            return {
              guildName: g.displayName || g.name,
              raidName: raid.name,
              bossName: re.name,
              type: 'KILL',
              dateOccurred: new Date(re.defeatedAt)
            };
          } else {
            return {
              guildName: g.displayName || g.name,
              raidName: raid.name,
              bossName: re.name,
              type: 'BEST',
              lowestPercentage: 0,
              dateOccurred: new Date(re.defeatedAt)
            };
          }
        });

      allEvents.push(...events);

      result.raidEncounters = raidEncounters;
    }

    raidProgression.push(result);
  }

  allEvents.sort((a, b) => (a.dateOccurred < b.dateOccurred ? 1 : -1));

  const top5Events = allEvents.slice(0, 5);

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

  return report;
}

/* Get raid metadata */
export async function getRaidMetadata(slug: string): Promise<RaidInfo | null> {
  console.log('\ngenerating report for:', slug);

  const raid = RAIDS.find((r) => r.slug === slug);

  // raid may not exist
  if (!raid) return null;

  return raid;
}

export async function getLatestEvents({ slug }: RaidInfo) {
  let report = await generateProgressReportBySlug(slug);

  if (!report) return null;

  const daysWorthofUpdates = 1;

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - daysWorthofUpdates);

  const updates = report
    ? report.recentEvents.filter((e) => e.dateOccurred > sinceDate)
    : [];

  return updates;
}

export function buildDiscordMessage(
  recentUpdates: Array<Array<RaidProgressEvent>>,
  time: Date,
  host: string
): string {
  let message = `# Updates for <t:${getUnixTimestampInSeconds(time)}:D>\n\n`;

  for (const re of recentUpdates) {
    message += `## ${re[0].raidName}\n`;
    for (const u of re) {
      const ts = getUnixTimestampInSeconds(u.dateOccurred);

      switch (u.type) {
        case 'KILL':
          message += `${u.guildName} defeated ${u.bossName} <t:${ts}:R> at <t:${ts}:t>\n`;
          break;
        case 'BEST':
          message += `${u.guildName} achieved a new best of ${u.lowestPercentage}% on ${u.bossName} <t:${ts}:R> at <t:${ts}:t>\n`;
      }
    }
  }

  message += `\nTo see the changes go to ${host}\n`;

  return message;
}

export async function sendDiscordUpdate() {
  const host = getHost();

  const time = new Date();

  const recentUpdatesPromises = RAIDS.map(getLatestEvents);

  const recentUpdates = (await Promise.all(recentUpdatesPromises)).filter(
    (ru) => ru && ru.length
  ) as Array<Array<RaidProgressEvent>>;

  if (!recentUpdates || !recentUpdates.length) {
    return new Response('No updates were found.', {
      status: 200
    });
  }

  const message = buildDiscordMessage(recentUpdates, time, host);

  return await sendDiscordMessage(message);
}
