/**
 * Raid Data Service
 *
 * Fetches raid metadata dynamically from Raider.io and Warcraft Logs APIs,
 *
 * Raider.io provides: raid names, encounter slugs, season start/end dates
 * WCL provides: encounter IDs (numeric), frozen status (current vs past tier)
 * This service cross-references both to produce Encounter objects with both IDs.
 */

import {
  fetchRaidingStaticData,
  fetchLatestRIOExpansionId
} from '@/lib/api/raiderio.api';
import { fetchWCLExpansionZones } from '@/lib/api/wlogs.api';
import {
  Encounter,
  NextRaidInfo,
  RaidInfo,
  RaiderIOStaticRaid,
  WCLExpansionZone,
  WCLZoneEncounter
} from '@/lib/types';

/**
 * RIO and WCL use different expansion numbering schemes.
 * RIO 10 = WCL 6 ("The War Within"), RIO 11 = WCL 7 ("Midnight").
 * This offset derives the correct WCL expansion ID from the RIO expansion ID.
 */
const RIO_TO_WCL_EXPANSION_OFFSET = 4;

export type SeasonData = {
  raids: RaidInfo[];
  seasonStartDate: string;
  seasonEndDate: string | 0;
  nextRaid: NextRaidInfo | null;
};

const NEXT_RAID_THRESHOLD_DAYS = 14;

/**
 * Normalize a name for fuzzy matching.
 * Strips commas, apostrophes, hyphens, and lowercases.
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[,'''"-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Match a Raider.io encounter name to a WCL encounter by name.
 * Handles cases like "Sikran" matching "Sikran, Captain of the Sureki"
 * and "Dimensius" matching "Dimensius, the All-Devouring".
 */
function findWCLEncounterMatch(
  rioName: string,
  wclEncounters: WCLZoneEncounter[]
): WCLZoneEncounter | null {
  const normalizedRio = normalizeName(rioName);

  // 1. Exact match
  const exact = wclEncounters.find(
    (e) => normalizeName(e.name) === normalizedRio
  );
  if (exact) return exact;

  // 2. WCL name starts with Raider.io name (e.g., "sikran" matches "sikran captain of the sureki")
  const startsWith = wclEncounters.find((e) =>
    normalizeName(e.name).startsWith(normalizedRio)
  );
  if (startsWith) return startsWith;

  // 3. Raider.io name starts with WCL name
  const reverseStartsWith = wclEncounters.find((e) =>
    normalizedRio.startsWith(normalizeName(e.name))
  );
  if (reverseStartsWith) return reverseStartsWith;

  // 4. Contains match (either direction)
  const contains = wclEncounters.find(
    (e) =>
      normalizeName(e.name).includes(normalizedRio) ||
      normalizedRio.includes(normalizeName(e.name))
  );
  if (contains) return contains;

  return null;
}

/**
 * Match a Raider.io raid to a WCL zone by name.
 * Raid names are generally consistent between APIs.
 */
function findWCLZoneMatch(
  rioRaid: RaiderIOStaticRaid,
  wclZones: WCLExpansionZone[]
): WCLExpansionZone | null {
  const normalizedRio = normalizeName(rioRaid.name);

  // Exact match first
  const exact = wclZones.find((z) => normalizeName(z.name) === normalizedRio);
  if (exact) return exact;

  // Contains match
  const contains = wclZones.find(
    (z) =>
      normalizeName(z.name).includes(normalizedRio) ||
      normalizedRio.includes(normalizeName(z.name))
  );
  if (contains) return contains;

  return null;
}

/**
 * Build a RaidInfo object by cross-referencing Raider.io and WCL data.
 */
function buildRaidInfo(
  rioRaid: RaiderIOStaticRaid,
  wclZone: WCLExpansionZone | null
): RaidInfo {
  const encounters: Encounter[] = rioRaid.encounters.map((rioEnc) => {
    if (wclZone) {
      const wclMatch = findWCLEncounterMatch(rioEnc.name, wclZone.encounters);

      if (wclMatch) {
        return {
          id: wclMatch.id,
          name: wclMatch.name, // use WCL name (more complete, e.g., "Dimensius, the All-Devouring")
          rSlug: rioEnc.slug
        };
      }

      console.warn(
        `[raid-data] No WCL match for encounter "${rioEnc.name}" in raid "${rioRaid.name}"`
      );
    }

    // Fallback: no WCL data, use Raider.io data with id of 0
    // TODO: Add a visual indicator on the UI when encounters have id=0 (WCL hasn't caught up yet)
    return {
      id: 0,
      name: rioEnc.name,
      rSlug: rioEnc.slug
    };
  });

  return {
    name: rioRaid.name,
    slug: rioRaid.slug,
    encounters
  };
}

/**
 * Searches for the next upcoming raid across the current and next expansion.
 * Returns NextRaidInfo if a raid starts within NEXT_RAID_THRESHOLD_DAYS, else null.
 */
async function findNextRaid(
  currentExpansionRaids: RaiderIOStaticRaid[],
  rioExpansionId: number
): Promise<NextRaidInfo | null> {
  const now = new Date();
  const thresholdMs = NEXT_RAID_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;

  // Collect future raids from the current expansion
  let candidateRaids: RaiderIOStaticRaid[] = currentExpansionRaids.filter(
    (raid) => new Date(raid.starts.us) > now
  );

  // Also check the next expansion for upcoming raids
  try {
    const nextExpansionRaids = await fetchRaidingStaticData(
      rioExpansionId + 1
    );
    if (nextExpansionRaids?.length) {
      const futureFromNext = nextExpansionRaids.filter(
        (raid) => new Date(raid.starts.us) > now
      );
      candidateRaids = [...candidateRaids, ...futureFromNext];
    }
  } catch {
    // Next expansion doesn't exist yet — that's fine
  }

  if (!candidateRaids.length) return null;

  // Find the soonest upcoming raid
  candidateRaids.sort(
    (a, b) =>
      new Date(a.starts.us).getTime() - new Date(b.starts.us).getTime()
  );

  const soonest = candidateRaids[0];
  const startDate = new Date(soonest.starts.us);
  const diffMs = startDate.getTime() - now.getTime();

  if (diffMs > thresholdMs || diffMs <= 0) return null;

  return {
    name: soonest.name,
    shortName: soonest.short_name,
    slug: soonest.slug,
    startDateUS: soonest.starts.us,
    daysUntilLaunch: Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  };
}

/**
 * Fetches and cross-references raid data from both APIs.
 * Auto-detects the current expansion from both APIs.
 * Returns current season's raids with full encounter metadata.
 */
export async function fetchSeasonData(): Promise<SeasonData> {
  // Auto-detect current expansion from Raider.io, then derive the WCL expansion ID
  // using the known offset between their numbering schemes.
  const rioExpansionId = await fetchLatestRIOExpansionId();
  const wclExpansionId = rioExpansionId - RIO_TO_WCL_EXPANSION_OFFSET;

  console.log(
    `[raid-data] Detected expansion IDs — RIO: ${rioExpansionId}, WCL: ${wclExpansionId}`
  );

  const rioRaids = await fetchRaidingStaticData(rioExpansionId);

  // Fetch WCL zones; gracefully fall back to empty array
  let wclZones: WCLExpansionZone[] = [];
  try {
    wclZones = await fetchWCLExpansionZones(wclExpansionId);
  } catch (e) {
    console.warn(
      '[raid-data] Failed to fetch WCL zones, proceeding without WCL data'
    );
  }

  const now = new Date();

  // Filter to current raids: started but not yet ended (using US dates)
  const currentRioRaids = rioRaids.filter((raid) => {
    const startDate = new Date(raid.starts.us);
    const endDate = raid.ends.us ? new Date(raid.ends.us) : null;

    return startDate <= now && (!endDate || endDate > now);
  });

  // If no current raids found, fall back to the most recent raid by start date
  if (!currentRioRaids.length) {
    console.warn(
      '[raid-data] No current raids found from Raider.io dates, falling back to most recent raid'
    );
  }

  const raidsToUse = currentRioRaids.length
    ? currentRioRaids
    : [
        [...rioRaids].sort(
          (a, b) =>
            new Date(b.starts.us).getTime() - new Date(a.starts.us).getTime()
        )[0]
      ].filter(Boolean);

  // Build RaidInfo for each current raid
  const raids: RaidInfo[] = raidsToUse.map((rioRaid) => {
    const wclZone = findWCLZoneMatch(rioRaid, wclZones);

    if (!wclZone) {
      console.warn(`[raid-data] No WCL zone match for raid "${rioRaid.name}"`);
    }

    return buildRaidInfo(rioRaid, wclZone);
  });

  // Season dates from the first current raid
  const firstRaid = raidsToUse[0];
  const seasonStartDate = firstRaid?.starts?.us || '';
  const seasonEndDate = firstRaid?.ends?.us || 0;

  // Check for an upcoming raid within the threshold window
  const nextRaid = await findNextRaid(rioRaids, rioExpansionId);

  return {
    raids,
    seasonStartDate,
    seasonEndDate,
    nextRaid
  };
}
