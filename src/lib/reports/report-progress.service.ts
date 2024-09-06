import {
  GuildInfo,
  GuildRaidEncounter,
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

// TODO: update this each season.
import { SEASON_END_DATE, SEASON_START_DATE, GUILDS, isCWG } from '@/lib/data';

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
  guild: GuildInfo
): Promise<FightMap | null> {
  const { name, realm, region, slug } = guild;

  const queryVars: BossDataQueryVars = {
    name,
    server: realm.toLowerCase().replaceAll("'", ''),
    region: region,
    startTime: new Date(SEASON_START_DATE).getTime(),
    endTime: SEASON_END_DATE ? new Date(SEASON_END_DATE).getTime() : undefined,
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

function createEventsByGuild(
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
          lowestPercentage: 0,
          dateOccurred: new Date(e.defeatedAt)
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
export async function getReportBuilder(raid: RaidInfo): Promise<ReportBuilder> {
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

    const wlogPulls: FightMap | null = await getWlogReportFightsByGuild(guild);

    if (wlogPulls) {
      builder.setWlogFightsByGuild(Number(rId), wlogPulls);
    }
  }

  builder.build();

  return builder;
}

export async function generateProgressReport(
  raid: RaidInfo
): Promise<ProgressReport | null> {
  // raid may not exist
  if (!raid) return null;
  // Fetch progress for raid
  let raidProgression: GuildRaidProgress[] = [];
  const allEvents: RaidProgressEvent[] = [];

  const builder = await getReportBuilder(raid);

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

    const progressionForGuild = builder.getEncounterInfoByGuild(g.rId);

    // if not in list. guild is not raiding, skip them
    if (!progressionForGuild) continue;

    const normalKills =
      progressionForGuild?.normal.reduce(
        (acc, b) => ('firstDefeated' in b ? acc + 1 : acc),
        0
      ) || 0;

    const heroicKills =
      progressionForGuild?.heroic.reduce(
        (acc, b) => ('firstDefeated' in b ? acc + 1 : acc),
        0
      ) || 0;

    const mythicKills =
      progressionForGuild?.mythic.reduce(
        (acc, b) => ('firstDefeated' in b ? acc + 1 : acc),
        0
      ) || 0;

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

    g.profileUrl = progressionForGuild?.profileUrl;

    const guildProgress: GuildRaidProgress = {
      guild: g,
      raidEncounters: progressionForGuild?.bestPulls as GuildRaidEncounter[],
      overallSummary
    };

    raidProgression.push(guildProgress);

    // get recent events

    // TODO: This isn't actually needed by the /raids pages
    // but is needed for getLatestEvents. Try refactoring it out.
    if (progressionForGuild && progressionForGuild.bestPulls) {
      const events: RaidProgressEvent[] = createEventsByGuild(
        g,
        raid,
        progressionForGuild.bestPulls
      );

      allEvents.push(...events);
    }
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
  const allSummaries: GuildRaidProgressStatistics[] = [];
  const allEvents: RaidProgressEvent[] = [];

  const builder = await getReportBuilder(raid);

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

    const progressionForGuild = builder.getEncounterInfoByGuild(g.rId);

    // if not in list. guild is not raiding, skip them
    if (!progressionForGuild) continue;

    const normalKills =
      progressionForGuild?.normal.reduce(
        (acc, b) => ('firstDefeated' in b ? acc + 1 : acc),
        0
      ) || 0;

    const heroicKills =
      progressionForGuild?.heroic.reduce(
        (acc, b) => ('firstDefeated' in b ? acc + 1 : acc),
        0
      ) || 0;

    const mythicKills =
      progressionForGuild?.mythic.reduce(
        (acc, b) => ('firstDefeated' in b ? acc + 1 : acc),
        0
      ) || 0;

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

    g.profileUrl = progressionForGuild?.profileUrl;

    const currentProgression = builder.toStringCurrentProgressionBossByRId(
      g.rId
    );

    const summary = {
      guild: g,
      overallSummary,
      totalBosses,
      summaries,
      currentProgression
    } as GuildRaidProgressStatistics;

    allSummaries.push(summary);

    // TODO: events only include the "best" currently. Would like to factor
    // in previous wlog pulls so that we have that history to view
    if (progressionForGuild && progressionForGuild.bestPulls) {
      const events: RaidProgressEvent[] = createEventsByGuild(
        g,
        raid,
        progressionForGuild.bestPulls
      );

      allEvents.push(...events);
    }
  }

  const report: SummaryReport = {
    raid,
    summaries: allSummaries,
    recentEvents: allEvents,
    createdOn: new Date()
  };

  // return Object.fromEntries(raidRankingsByGuild);
  return report;
}
