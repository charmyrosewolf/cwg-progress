/**
 * Guild Report Strategy
 *
 * Report data comes from two different places depending on what a "guild" is:
 * a real guild is ranked by Raider.io (with Warcraft Logs used to enrich it),
 * while a community is an aggregate that Raider.io has never heard of and must
 * be built from Warcraft Logs alone.
 *
 * Each shape gets a strategy implementing this interface, so the report service
 * can treat every entry in the guild list the same way.
 */

import {
  GuildInfo,
  GuildRaidEncounter,
  GuildRaidProgress,
  GuildRaidProgressStatistics,
  RaidInfo,
  RaidProgressEvent
} from '@/lib/types';
import { isCommunity } from '@/lib/data';
import { ReportBuilder } from '@/lib/reports/report-builder';
import { CommunityStrategy } from './community-strategy';
import { GuildStrategy } from './guild-strategy';

/**
 * Stats and events from a single pass over a guild's data.
 * Returned together so a strategy never has to fetch its source twice.
 */
export type SummaryResult = {
  stats: GuildRaidProgressStatistics | null;
  events: RaidProgressEvent[];
};

export interface GuildReportStrategy {
  buildProgress(
    raid: RaidInfo,
    guild: GuildInfo
  ): Promise<GuildRaidProgress | null>;

  buildSummary(raid: RaidInfo, guild: GuildInfo): Promise<SummaryResult>;
}

/**
 * Creates RaidProgressEvent[] from a guild's encounter list.
 * Lives here rather than in either strategy because both produce events and
 * the report service aggregates them — a shared home avoids a circular import.
 */
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
 * Returns the strategy that knows how to build reports for this guild.
 *
 * `builder` holds the Raider.io rankings, which are fetched once per raid and
 * shared by every guild — communities ignore it.
 */
export function getStrategy(
  guild: GuildInfo,
  builder: ReportBuilder
): GuildReportStrategy {
  return isCommunity(guild.slug)
    ? new CommunityStrategy()
    : new GuildStrategy(builder);
}
