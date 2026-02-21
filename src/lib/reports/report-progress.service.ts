import {
  GuildInfo,
  GuildRaidEncounter,
  GuildRaidEncountersInfo,
  GuildRaidProgress,
  RaidInfo,
  ProgressReport,
  BossDataQueryVars,
  RaidProgressEvent,
  GuildRaidProgressStatistics,
  SummaryReport,
  Statistic,
  REPORT_LIMIT,
  WLOGS_FIGHT_QUERY,
  createStatistics,
  FightMap
} from '@/lib/types';

import {
  GUILDS,
  isCWG,
  getSeasonStartDate,
  getSeasonEndDate
} from '@/lib/data';

import {
  WlogReport,
  fetchAllRaidRankingsByDifficulty,
  postQuery
} from '@/lib/api';

import {
  flattenWLOGReportFights,
  getWlogFightMap,
  sortFightMapByBestPulls
} from '@/lib/utils/helper';
import {
  buildCWGProgressReport,
  buildCWGProgressStatistics,
  buildCWGRaidEncounters,
  getCWGWlogReportFights
} from '@/lib/reports/cwg-report-builder';
import { ReportBuilder } from '@/lib/reports/report-builder';

async function getWlogReportFightsByGuild(
  guild: GuildInfo,
  seasonStartDate: string,
  seasonEndDate: string | number
): Promise<FightMap | null> {
  const { name, realm, region, slug } = guild;

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

  const data: WlogReport[] = queryResults.data?.reportData?.reports?.data;

  if (!data) return null;

  const flattenedEncounters =
    data && data.length ? flattenWLOGReportFights(data) : [];

  const fightMap = getWlogFightMap(flattenedEncounters);

  return fightMap;
}

export function createEventsByGuild(
  guild: GuildInfo,
  raid: RaidInfo,
  encounters: GuildRaidEncounter[]
): RaidProgressEvent[] {
  const guildName = guild.displayName || guild.name;

  return encounters
    .filter((e) => e.defeatedAt || e.lowestBossPercentage)
    .map((e) => {
      if (e.defeatedAt) {
        return {
          guildName,
          raidName: raid.name,
          bossName: e.name,
          type: 'KILL',
          dateOccurred: new Date(e.defeatedAt)
        };
      } else {
        return {
          guildName,
          raidName: raid.name,
          bossName: e.name,
          type: 'BEST',
          lowestPercentage: e.lowestBossPercentage || 0,
          dateOccurred: e.attemptedAt ? new Date(e.attemptedAt) : new Date()
        };
      }
    });
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

  for (const rId of builder.getGuildRIds()) {
    const guild = GUILDS.find((g) => g.rId === rId) as GuildInfo;

    // console.log(`pulling wlogs for ${guild?.name}`);

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

// ─── Shared helpers for report generation ───────────────────

function countKillsByDifficulty(progressionForGuild: GuildRaidEncountersInfo): {
  normalKills: number;
  heroicKills: number;
  mythicKills: number;
} {
  const normalKills =
    progressionForGuild.normal.reduce(
      (acc, b) => ('firstDefeated' in b ? acc + 1 : acc),
      0
    ) || 0;

  const heroicKills =
    progressionForGuild.heroic.reduce(
      (acc, b) => ('firstDefeated' in b ? acc + 1 : acc),
      0
    ) || 0;

  const mythicKills =
    progressionForGuild.mythic.reduce(
      (acc, b) => ('firstDefeated' in b ? acc + 1 : acc),
      0
    ) || 0;

  return { normalKills, heroicKills, mythicKills };
}

type ProcessedGuildData = {
  guild: GuildInfo;
  overallSummary: Statistic;
  totalBosses: number;
  summaries: Statistic[];
  bestPulls: GuildRaidEncounter[];
  currentProgression: string;
  events: RaidProgressEvent[];
};

function processRegularGuild(
  raid: RaidInfo,
  builder: ReportBuilder,
  guild: GuildInfo
): ProcessedGuildData | null {
  const progressionForGuild = builder.getEncounterInfoByGuild(guild.rId);
  if (!progressionForGuild) return null;

  const { normalKills, heroicKills, mythicKills } =
    countKillsByDifficulty(progressionForGuild);

  if (!normalKills && !heroicKills && !mythicKills) return null;

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

  guild.profileUrl = progressionForGuild.profileUrl;

  const currentProgression =
    builder.toStringCurrentProgressionBossByRId(guild.rId) ?? '';

  const bestPulls = progressionForGuild.bestPulls;

  const events = bestPulls
    ? createEventsByGuild(guild, raid, bestPulls)
    : [];

  return {
    guild,
    overallSummary,
    totalBosses,
    summaries,
    bestPulls,
    currentProgression,
    events
  };
}

export async function generateProgressReport(
  raid: RaidInfo
): Promise<ProgressReport | null> {
  // raid may not exist
  if (!raid) return null;

  const seasonStartDate = await getSeasonStartDate();
  const seasonEndDate = await getSeasonEndDate();

  // Fetch progress for raid
  let raidProgression: GuildRaidProgress[] = [];
  const allEvents: RaidProgressEvent[] = [];

  const builder = await getReportBuilder(raid, seasonStartDate, seasonEndDate);

  for (const g of GUILDS) {
    // if cwg build custom rankings
    if (isCWG(g.slug)) {
      const cwgProgression = await buildCWGProgressReport(raid);

      if (!cwgProgression) {
        continue;
      }

      // TODO: add events and stuff here

      const events: RaidProgressEvent[] = createEventsByGuild(
        g,
        raid,
        cwgProgression.raidEncounters
      );

      allEvents.push(...events);

      raidProgression.push(cwgProgression);

      continue;
    }

    const processed = processRegularGuild(raid, builder, g);
    if (!processed) continue;

    raidProgression.push({
      guild: processed.guild,
      raidEncounters: processed.bestPulls as GuildRaidEncounter[],
      overallSummary: processed.overallSummary
    });

    allEvents.push(...processed.events);
  }

  allEvents.sort((a, b) => (a.dateOccurred < b.dateOccurred ? 1 : -1));

  const top5Events = allEvents.slice(0, 5);

  const report: ProgressReport = {
    raid,
    raidProgression: raidProgression,
    createdOn: new Date(),
    recentEvents: top5Events
  };

  return report;
}

export async function generateSummaryReport(
  raid: RaidInfo
): Promise<SummaryReport | null> {
  const seasonStartDate = await getSeasonStartDate();
  const seasonEndDate = await getSeasonEndDate();

  const allSummaries: GuildRaidProgressStatistics[] = [];
  const allEvents: RaidProgressEvent[] = [];

  const builder = await getReportBuilder(raid, seasonStartDate, seasonEndDate);

  for (const g of GUILDS) {
    // if cwg build custom rankings
    if (isCWG(g.slug)) {
      const cwgFights = await getCWGWlogReportFights(raid);

      if (!cwgFights) {
        continue;
      }

      const cwgStats = buildCWGProgressStatistics(raid, cwgFights);

      if (cwgStats) {
        allSummaries.push(cwgStats);
      }

      const fightMap: FightMap = getWlogFightMap(cwgFights);
      const bestPullMap: FightMap | null = sortFightMapByBestPulls(fightMap);

      const cwgEncounters = buildCWGRaidEncounters(
        raid,
        cwgFights,
        bestPullMap
      );

      if (cwgEncounters) {
        const events: RaidProgressEvent[] = createEventsByGuild(
          g,
          raid,
          cwgEncounters
        );

        allEvents.push(...events);
      }

      continue;
    }

    const processed = processRegularGuild(raid, builder, g);
    if (!processed) continue;

    allSummaries.push({
      guild: processed.guild,
      overallSummary: processed.overallSummary,
      totalBosses: processed.totalBosses,
      summaries: processed.summaries,
      currentProgression: processed.currentProgression
    } as GuildRaidProgressStatistics);

    allEvents.push(...processed.events);
  }

  const report: SummaryReport = {
    raid,
    summaries: allSummaries,
    recentEvents: allEvents,
    createdOn: new Date()
  };

  return report;
}
