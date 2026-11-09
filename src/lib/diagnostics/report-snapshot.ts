// Yesterday's WCL report codes per guild vs today's. A code that was there and
// is gone is the Nov 2026 "CWG row wrong" symptom, so it gets a Discord alert.

import { getUnixTimestampInSeconds } from '@/lib/utils/helper';
import { generateFightUrl } from '@/lib/api/wlogs.types';

import type { GuildDiagnostic, ReportRef } from './wcl-diagnostics';

export type ReportSnapshot = {
  takenAt: string;
  seasonStart: string;
  guilds: Record<string, ReportRef[]>;
};

export type MissingReports = { guild: string; slug: string; codes: ReportRef[] };

export function isReportSnapshot(value: unknown): value is ReportSnapshot {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.takenAt === 'string' &&
    typeof v.seasonStart === 'string' &&
    !!v.guilds &&
    typeof v.guilds === 'object'
  );
}

/** Empty when there is nothing to compare against: first run or a new season. */
export function findMissingReports(
  prev: ReportSnapshot | null,
  today: GuildDiagnostic[],
  seasonStart: string
): MissingReports[] {
  if (!prev || prev.seasonStart !== seasonStart) return [];

  const missing: MissingReports[] = [];

  for (const d of today) {
    if (!d.fetched) continue;
    const before = prev.guilds[d.slug];
    if (!before) continue;

    const seen = new Set(d.reports.map((r) => r.code));
    const gone = before.filter((r) => !seen.has(r.code));
    if (gone.length) missing.push({ guild: d.guild, slug: d.slug, codes: gone });
  }

  return missing;
}

/** Today's codes per fetched guild; a guild WCL failed on keeps yesterday's. */
export function mergeSnapshot(
  prev: ReportSnapshot | null,
  today: GuildDiagnostic[],
  seasonStart: string,
  takenAt: Date
): ReportSnapshot {
  const sameSeason = prev && prev.seasonStart === seasonStart;
  const guilds: Record<string, ReportRef[]> = sameSeason ? { ...prev.guilds } : {};

  for (const d of today) {
    if (d.fetched) {
      guilds[d.slug] = d.reports;
    } else if (!(d.slug in guilds)) {
      guilds[d.slug] = [];
    }
  }

  return { takenAt: takenAt.toISOString(), seasonStart, guilds };
}

export function buildShrinkAlert(missing: MissingReports[], takenAt: Date): string {
  let message = `# WCL report set shrank <t:${getUnixTimestampInSeconds(takenAt)}:D>\n\n`;
  message += 'Reports seen on the previous run that WCL did not return today:\n';

  for (const m of missing) {
    message += `\n## ${m.guild}\n`;
    for (const r of m.codes) {
      const ts = getUnixTimestampInSeconds(new Date(r.start));
      message += `- \`${r.code}\` from <t:${ts}:D> ${generateFightUrl(r.code, 1)}\n`;
    }
  }

  return message;
}
