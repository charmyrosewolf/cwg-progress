/**
 * Guild Data Service
 *
 * Fetches guild configuration from a published Google Sheets CSV.
 * Uses Next.js ISR (stale-while-revalidate) in production and
 * devCache in development to protect API rate limits.
 *
 * GOOGLE_SHEETS_GUILDS_CSV_URL env var is required.
 */

import { GuildInfo, Faction, Region } from '@/lib/types';
import { devCache } from '@/lib/utils/dev-cache';

const CWG_SLUG = 'CWG';

// ─── CSV Parsing ────────────────────────────────────────────

/**
 * Expected CSV columns:
 * rId, name, slug, realm, region, faction, displayName, profileUrl, optOut
 */
const EXPECTED_HEADERS = [
  'rId',
  'name',
  'slug',
  'realm',
  'region',
  'faction',
  'displayName',
  'profileUrl',
  'optOut'
];

/**
 * Parses a CSV string into GuildInfo[].
 * Expects headers in the first row matching EXPECTED_HEADERS.
 * Simple split-based parsing — no external library needed since
 * guild data has no nested commas or quoted fields.
 */
export function parseGuildsCsv(csv: string): GuildInfo[] {
  const lines = csv.trim().split('\n');

  if (lines.length < 2) {
    console.warn('[guild-data] CSV has no data rows');
    return [];
  }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

  // Build a column index map for flexible column ordering
  const colIndex: Record<string, number> = {};
  for (const expected of EXPECTED_HEADERS) {
    const idx = headers.indexOf(expected.toLowerCase());
    if (idx !== -1) {
      colIndex[expected] = idx;
    }
  }

  // Require at minimum: rId, name, slug, realm, region, faction
  const requiredCols = ['rId', 'name', 'slug', 'realm', 'region', 'faction'];
  const missingCols = requiredCols.filter((c) => colIndex[c] === undefined);
  if (missingCols.length) {
    console.warn(
      `[guild-data] CSV missing required columns: ${missingCols.join(', ')}`
    );
    return [];
  }

  const guilds: GuildInfo[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(',').map((c) => c.trim());

    const rIdStr = cols[colIndex['rId']] || '';
    const rId = parseInt(rIdStr, 10);

    if (isNaN(rId)) {
      console.warn(`[guild-data] Skipping row ${i + 1}: invalid rId "${rIdStr}"`);
      continue;
    }

    const name = cols[colIndex['name']] || '';
    const slug = cols[colIndex['slug']] || '';
    const realm = cols[colIndex['realm']] || '';
    const region = (cols[colIndex['region']] || 'us') as Region;
    const faction = (cols[colIndex['faction']] || 'alliance') as Faction;

    const displayName =
      colIndex['displayName'] !== undefined
        ? cols[colIndex['displayName']] || undefined
        : undefined;

    const profileUrl =
      colIndex['profileUrl'] !== undefined
        ? cols[colIndex['profileUrl']] || undefined
        : undefined;

    const optOutStr =
      colIndex['optOut'] !== undefined
        ? (cols[colIndex['optOut']] || '').toLowerCase()
        : '';
    const optOut = optOutStr === 'true' || optOutStr === '1' || optOutStr === 'yes';

    if (!name || !slug) {
      console.warn(`[guild-data] Skipping row ${i + 1}: missing name or slug`);
      continue;
    }

    const guild: GuildInfo = {
      rId,
      name,
      slug,
      realm,
      region,
      faction,
      ...(displayName ? { displayName } : {}),
      ...(profileUrl ? { profileUrl } : {}),
      ...(optOut ? { optOut } : {})
    };

    guilds.push(guild);
  }

  return guilds;
}

// ─── Fetching ───────────────────────────────────────────────

async function fetchGuildsFromSheets(): Promise<{
  data: GuildInfo[];
  ok: boolean;
}> {
  const url = process.env.GOOGLE_SHEETS_GUILDS_CSV_URL;

  if (!url) {
    throw new Error(
      '[guild-data] GOOGLE_SHEETS_GUILDS_CSV_URL is not set'
    );
  }

  const res = await fetch(url);

  if (!res.ok) {
    console.error(
      `[guild-data] Sheets fetch failed with status ${res.status}`
    );
    return { data: [], ok: false };
  }

  const csv = await res.text();
  const guilds = parseGuildsCsv(csv);

  if (!guilds.length) {
    console.warn('[guild-data] Parsed 0 guilds from CSV');
    return { data: [], ok: false };
  }

  console.log(`[guild-data] Loaded ${guilds.length} guilds from Google Sheets`);
  return { data: guilds, ok: true };
}

// ─── Cached access ──────────────────────────────────────────

// In-memory cache for render-pass deduplication
let cachedGuilds: GuildInfo[] | null = null;

/**
 * Returns the active guild list, filtered to exclude opted-out guilds.
 * Uses devCache in development, ISR in production.
 */
export async function getGuilds(): Promise<GuildInfo[]> {
  if (cachedGuilds) {
    return cachedGuilds;
  }

  const { data, ok } = await devCache('guilds-csv', fetchGuildsFromSheets);

  if (!ok || !data.length) {
    throw new Error(
      '[guild-data] No guild data available. Ensure GOOGLE_SHEETS_GUILDS_CSV_URL is set and the sheet is published.'
    );
  }

  // Filter out opted-out guilds
  cachedGuilds = data.filter((g) => !g.optOut);

  return cachedGuilds;
}

/**
 * Returns the CWG guild info from the guild list.
 */
export async function getCWGGuild(): Promise<GuildInfo> {
  const guilds = await getGuilds();
  const cwg = guilds.find((g) => g.slug === CWG_SLUG);

  if (!cwg) {
    throw new Error('[guild-data] CWG guild not found in guild list');
  }

  return cwg;
}

/**
 * Checks if a guild slug belongs to the CWG community guild.
 */
export function isCWG(guildSlug: string): boolean {
  return guildSlug === CWG_SLUG;
}

/**
 * Clears the cached guild data.
 * Useful for testing or forcing a re-fetch.
 */
export function clearGuildCache(): void {
  cachedGuilds = null;
}
