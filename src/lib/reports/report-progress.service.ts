import {
  GuildInfo,
  GuildRaidProgress,
  RaidInfo,
  ProgressReport,
  BossDataQueryVars,
  RaidProgressEvent,
  GuildRaidProgressStatistics,
  SummaryReport,
  REPORT_LIMIT,
  WLOGS_FIGHT_QUERY,
  FightMap
} from '@/lib/types';

import { getGuilds, getSeasonStartDate, getSeasonEndDate } from '@/lib/data';

import {
  WlogReport,
  fetchAllRaidRankingsByDifficulty,
  postQuery,
  isWCLAuthFailed
} from '@/lib/api';

import { flattenWLOGReportFights, getWlogFightMap } from '@/lib/utils/helper';
import { ReportBuilder } from '@/lib/reports/report-builder';
import {
  createEventsByGuild,
  getStrategy
} from '@/lib/reports/strategies/guild-report-strategy';

/** How many of the most recent events a raid report carries. */
const MAX_RECENT_EVENTS = 5;

async function getWlogReportFightsByGuild(
  guild: GuildInfo,
  seasonStartDate: string,
  seasonEndDate: string | number
): Promise<FightMap | null> {
  const { name, realm, region } = guild;

  const queryVars: BossDataQueryVars = {
    name,
    server: realm.toLowerCase().replaceAll("'", ''),
    region: region,
    startTime: new Date(seasonStartDate).getTime(),
    endTime: seasonEndDate ? new Date(seasonEndDate).getTime() : undefined,
    reportLimit: REPORT_LIMIT
  };

  const queryResults = await postQuery(
    WLOGS_FIGHT_QUERY,
    queryVars,
    `FAILED TO FETCH FIGHTS FOR ${queryVars.name}`
  );

  const data: WlogReport[] = queryResults?.data?.reportData?.reports?.data;

  if (!data) return null;

  const flattenedEncounters =
    data && data.length ? flattenWLOGReportFights(data) : [];

  const fightMap = getWlogFightMap(flattenedEncounters);

  return fightMap;
}

/**
 * creates a map containing raider.io kill and best pull data
 * by guild and difficulty
 *
 * @returns {ReportBuilder} the created map of pull data
 */
export async function getReportBuilder(
  raid: RaidInfo,
  seasonStartDate: string,
  seasonEndDate: string | number
): Promise<ReportBuilder> {
  const normalGuildRankings = await fetchAllRaidRankingsByDifficulty(
    raid.slug,
    'normal'
  );

  const heroicGuildRankings = await fetchAllRaidRankingsByDifficulty(
    raid.slug,
    'heroic'
  );

  const mythicGuildRankings = await fetchAllRaidRankingsByDifficulty(
    raid.slug,
    'mythic'
  );

  // all three of these return [] if no guild data is available

  // create map
  const builder: ReportBuilder = new ReportBuilder(raid);
  builder.populateEncountersByDifficulty(
    normalGuildRankings,
    heroicGuildRankings,
    mythicGuildRankings
  );

  const guilds = await getGuilds();

  for (const rId of builder.getGuildRIds()) {
    if (isWCLAuthFailed()) {
      console.warn(
        '[wlogs] Skipping remaining guild WCL fetches: unauthenticated'
      );
      break;
    }

    const guild = guilds.find((g) => g.rId === rId) as GuildInfo;

    const wlogPulls: FightMap | null = await getWlogReportFightsByGuild(
      guild,
      seasonStartDate,
      seasonEndDate
    );

    if (wlogPulls) {
      builder.setWlogFightsByGuild(Number(rId), wlogPulls);
    }
  }

  builder.build();

  return builder;
}

/**
 * Flattens every guild's encounters into a single most-recent-first event feed.
 * Cross-guild aggregation, so it stays here rather than in a strategy.
 */
function buildRecentEvents(
  raid: RaidInfo,
  progressions: GuildRaidProgress[]
): RaidProgressEvent[] {
  const allEvents = progressions.flatMap((p) =>
    createEventsByGuild(p.guild, raid, p.raidEncounters)
  );

  allEvents.sort((a, b) => (a.dateOccurred < b.dateOccurred ? 1 : -1));

  return allEvents.slice(0, MAX_RECENT_EVENTS);
}

export async function generateProgressReport(
  raid: RaidInfo
): Promise<ProgressReport | null> {
  // raid may not exist
  if (!raid) return null;

  const seasonStartDate = await getSeasonStartDate();
  const seasonEndDate = await getSeasonEndDate();
  const guilds = await getGuilds();
  const builder = await getReportBuilder(raid, seasonStartDate, seasonEndDate);

  const results = await Promise.all(
    guilds.map((guild) => getStrategy(guild, builder).buildProgress(raid, guild))
  );

  const raidProgression = results.filter(
    (p): p is GuildRaidProgress => p !== null
  );

  return {
    raid,
    raidProgression,
    createdOn: new Date(),
    recentEvents: buildRecentEvents(raid, raidProgression)
  };
}

export async function generateSummaryReport(
  raid: RaidInfo
): Promise<SummaryReport | null> {
  const seasonStartDate = await getSeasonStartDate();
  const seasonEndDate = await getSeasonEndDate();
  const guilds = await getGuilds();
  const builder = await getReportBuilder(raid, seasonStartDate, seasonEndDate);

  const results = await Promise.all(
    guilds.map((guild) => getStrategy(guild, builder).buildSummary(raid, guild))
  );

  const summaries: GuildRaidProgressStatistics[] = results.flatMap((r) =>
    r.stats ? [r.stats] : []
  );

  const recentEvents: RaidProgressEvent[] = results.flatMap((r) => r.events);

  return {
    raid,
    summaries,
    recentEvents,
    createdOn: new Date()
  };
}
