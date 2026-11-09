// Per-guild WCL diagnostics for the cron log: which reports WCL handed us today,
// whether a second page existed, and how many bosses it says each guild killed.

import { postQuery } from '@/lib/api/wlogs.api';
import {
  WlogReport,
  WLOGS_HEROIC_DIFFICULTY_ID,
  WLOGS_MYTHIC_DIFFICULTY_ID,
  WLOGS_NORMAL_DIFFICULTY_ID
} from '@/lib/api/wlogs.types';
import { BossDataQueryVars, GuildInfo, RaidInfo, REPORT_LIMIT } from '@/lib/types';

export type ReportRef = { code: string; start: string };

export type KillCounts = { normal: number; heroic: number; mythic: number };

/**
 * `fetched: false` means WCL gave no answer, so reportCount/kills are 0 as a
 * placeholder, not a measurement, and hasMorePages is null.
 */
export type GuildDiagnostic = {
  guild: string;
  slug: string;
  fetched: boolean;
  reportCount: number;
  hasMorePages: boolean | null;
  reports: ReportRef[];
  kills: KillCounts;
};

export type WlogReportPage =
  | { data: WlogReport[]; has_more_pages: boolean; total: number }
  | null
  | undefined;

// Same filters as WLOGS_FIGHT_QUERY, plus the paging flag, minus the pull detail.
export const WLOGS_DIAGNOSTIC_QUERY = `query ($name: String, $server: String, $region: String, $startTime: Float, $endTime: Float, $reportLimit: Int) {
  reportData {
    reports(guildName: $name, guildServerSlug: $server, guildServerRegion: $region, limit: $reportLimit, startTime: $startTime, endTime: $endTime) {
      total
      has_more_pages
      data {
        code
        startTime
        endTime
        fights {
          id
          encounterID
          difficulty
          kill
        }
      }
    }
  }
}`;

const DIFFICULTY_KEYS: Record<number, keyof KillCounts> = {
  [WLOGS_NORMAL_DIFFICULTY_ID]: 'normal',
  [WLOGS_HEROIC_DIFFICULTY_ID]: 'heroic',
  [WLOGS_MYTHIC_DIFFICULTY_ID]: 'mythic'
};

function countKills(reports: WlogReport[], raids: RaidInfo[]): KillCounts {
  const known = new Set(raids.flatMap((r) => r.encounters.map((e) => e.id)));
  const killed: Record<keyof KillCounts, Set<number>> = {
    normal: new Set(),
    heroic: new Set(),
    mythic: new Set()
  };

  for (const report of reports) {
    for (const fight of report.fights) {
      const key = DIFFICULTY_KEYS[fight.difficulty];
      if (!fight.kill || !key || fight.encounterID === undefined) continue;
      if (!known.has(fight.encounterID)) continue;
      killed[key].add(fight.encounterID);
    }
  }

  return {
    normal: killed.normal.size,
    heroic: killed.heroic.size,
    mythic: killed.mythic.size
  };
}

export function buildGuildDiagnostic(
  guild: GuildInfo,
  raids: RaidInfo[],
  page: WlogReportPage
): GuildDiagnostic {
  const base = { guild: guild.name, slug: guild.slug };

  if (!page?.data) {
    return {
      ...base,
      fetched: false,
      reportCount: 0,
      hasMorePages: null,
      reports: [],
      kills: { normal: 0, heroic: 0, mythic: 0 }
    };
  }

  return {
    ...base,
    fetched: true,
    reportCount: page.data.length,
    hasMorePages: Boolean(page.has_more_pages),
    reports: page.data.map((r) => ({
      code: r.code,
      start: new Date(r.startTime).toISOString()
    })),
    kills: countKills(page.data, raids)
  };
}

export async function collectDiagnostics(
  guilds: GuildInfo[],
  raids: RaidInfo[],
  seasonStart: string,
  seasonEnd: string | number | undefined
): Promise<GuildDiagnostic[]> {
  const active = guilds.filter((g) => !g.optOut);

  return Promise.all(
    active.map(async (guild) => {
      const vars: BossDataQueryVars = {
        name: guild.name,
        server: guild.realm.toLowerCase().replaceAll("'", ''),
        region: guild.region,
        startTime: new Date(seasonStart).getTime(),
        endTime: seasonEnd ? new Date(seasonEnd).getTime() : undefined,
        reportLimit: REPORT_LIMIT
      };

      const result = await postQuery(
        WLOGS_DIAGNOSTIC_QUERY,
        vars,
        `[diagnostics] WCL report page failed for ${guild.name}`
      );

      const page: WlogReportPage = result?.data?.reportData?.reports;

      return buildGuildDiagnostic(guild, raids, page);
    })
  );
}
