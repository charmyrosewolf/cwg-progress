/**
 * Guild Strategy
 *
 * A real guild is ranked by Raider.io, so its kills and best pulls come from
 * the pre-built ReportBuilder; Warcraft Logs only supplies the report links.
 */

import { ReportBuilder } from '@/lib/reports/report-builder';
import {
  createStatistics,
  GuildInfo,
  GuildRaidEncounter,
  GuildRaidEncountersInfo,
  GuildRaidProgress,
  GuildRaidProgressStatistics,
  RaidInfo,
  RaidProgressEvent,
  Statistic
} from '@/lib/types';
import {
  GuildReportStrategy,
  SummaryResult,
  createEventsByGuild
} from './guild-report-strategy';

// ─── Internal helpers ───────────────────────────────────────

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

/**
 * Pulls everything the two report shapes need out of the ReportBuilder in one
 * pass. Returns null when the guild has no rankings, or rankings with no kills
 * — either way it stays out of the report.
 *
 * Exported for testing — GuildStrategy is the production entry point.
 */
export function processGuild(
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

  const overallSummary = summaries.findLast((s) => s.bossesKilled) as Statistic;

  guild.profileUrl = progressionForGuild.profileUrl;

  const currentProgression =
    builder.toStringCurrentProgressionBossByRId(guild.rId) ?? '';

  const bestPulls = progressionForGuild.bestPulls;

  const events = bestPulls ? createEventsByGuild(guild, raid, bestPulls) : [];

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

// ─── GuildStrategy ──────────────────────────────────────────

export class GuildStrategy implements GuildReportStrategy {
  constructor(private builder: ReportBuilder) {}

  async buildProgress(
    raid: RaidInfo,
    guild: GuildInfo
  ): Promise<GuildRaidProgress | null> {
    const processed = processGuild(raid, this.builder, guild);
    if (!processed) return null;

    return {
      guild: processed.guild,
      raidEncounters: processed.bestPulls,
      overallSummary: processed.overallSummary
    };
  }

  async buildSummary(
    raid: RaidInfo,
    guild: GuildInfo
  ): Promise<SummaryResult> {
    const processed = processGuild(raid, this.builder, guild);
    if (!processed) return { stats: null, events: [] };

    const stats: GuildRaidProgressStatistics = {
      guild: processed.guild,
      overallSummary: processed.overallSummary,
      totalBosses: processed.totalBosses,
      summaries: processed.summaries,
      currentProgression: processed.currentProgression
    };

    return { stats, events: processed.events };
  }
}
