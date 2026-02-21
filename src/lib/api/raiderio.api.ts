/** Raider.io APIv1 */
/** https://raider.io/api# */

import { GUILDS } from '../data';
import { RAID_DIFFICULTY, GuildInfo, RaiderIOStaticRaid } from '../types';
import { devCache } from '../utils/dev-cache';
import {
  RaiderIOGuildRaidRanking,
  RaiderIORaidDifficultyRankings
} from './raiderio.types';

const GUILD_URL = 'https://raider.io/api/v1/guilds';
const RAIDING_URL = 'https://raider.io/api/v1/raiding';

type RawEncounterData = {
  slug: string;
  name: string;
  defeatedAt: string; // example: "2024-05-08T01:00:37.000Z"
};

type RawRaidProgression = {
  summary: string;
  total_bosses: number;
  normal_bosses_killed: number;
  heroic_bosses_killed: number;
  mythic_bosses_killed: number;
};

// the key is the rSlug of the raid
type RawRaidProgressMap = { [key: string]: RawRaidProgression };

type RawData = {
  name: string;
  faction: string;
  region: string;
  realm: string;
  last_crawled_at: string;
  profile_url: string;
  raid_progression: RawRaidProgressMap;
  raid_encounters: RawEncounterData[];
  // TODO: raid_rankings. Is this an intermittent field?
};

function getHeaders(): Headers {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');

  return headers;
}

async function rawFetchGuildProgression(
  url: string
): Promise<{ data: any; ok: boolean }> {
  const headers = getHeaders();

  const res = await fetch(url, {
    method: 'GET',
    headers: headers
  });

  const data = await res.json();
  return { data, ok: res.ok };
}

export async function fetchGuildProgressionByDifficulty(
  raidSlug: string,
  guild: GuildInfo,
  difficulty: RAID_DIFFICULTY
): Promise<RawData> {
  const realmSlug = guild.realm
    .toLowerCase()
    .replaceAll("'", '')
    .replaceAll(' ', '-');
  const guildName = guild.name.toLowerCase();

  const queryParams = `access_key=${process.env.RAIDERIO_ACCESS_KEY}&region=${guild.region}&realm=${realmSlug}&name=${guildName}&fields=raid_encounters:${raidSlug}:${difficulty},raid_progression,raid_rankings}`;
  const url = `${GUILD_URL}/profile?${encodeURI(queryParams)}`;

  const cacheKey = `rio-prog-${guild.slug}-${raidSlug}-${difficulty}`;

  const { data, ok } = await devCache(cacheKey, () =>
    rawFetchGuildProgression(url)
  );

  if (ok) {
    return data;
  } else {
    const errorMessage = `FAILED TO FETCH PROGRESSION FOR ${guild.name} ${raidSlug} ${difficulty}\nURL=${url}`;
    console.error(errorMessage, data);
    return Promise.reject(data);
  }
}

async function rawFetchRaidRankings(
  url: string
): Promise<{ data: RaiderIORaidDifficultyRankings; ok: boolean }> {
  const headers = getHeaders();

  const res = await fetch(url, {
    method: 'GET',
    headers: headers
  });

  const data = (await res.json()) as RaiderIORaidDifficultyRankings;
  return { data, ok: res.ok };
}

async function fetchRaidRankingsByDifficulty(
  raidSlug: string,
  guildIds: number[],
  difficulty: RAID_DIFFICULTY,
  region = 'us'
): Promise<RaiderIOGuildRaidRanking[]> {
  if (guildIds.length && guildIds.length > 10) {
    console.error('Cannot fetch more than ten rankings at a time');
  }

  const guildIdStrings = guildIds.toString();

  const queryParams = `access_key=${process.env.RAIDERIO_ACCESS_KEY}&region=${region}&raid=${raidSlug}&difficulty=${difficulty}&guilds=${guildIdStrings}&limit=200&page=0`;
  const url = `${RAIDING_URL}/raid-rankings?${encodeURI(queryParams)}`;

  const cacheKey = `rio-rank-${raidSlug}-${difficulty}-${guildIdStrings.slice(0, 30)}`;

  const { data, ok } = await devCache(cacheKey, () =>
    rawFetchRaidRankings(url)
  );

  if (ok) {
    return data.raidRankings;
  } else {
    const errorMessage = `FAILED TO FETCH RAID RANKINGS FOR ${guildIdStrings} ${raidSlug} ${difficulty}\nURL=${url}`;
    console.error(errorMessage, data);
    return Promise.reject(data);
  }
}

// TODO: return object with all difficulties
export async function fetchAllRaidRankingsByDifficulty(
  raidSlug: string,
  difficulty: RAID_DIFFICULTY
): Promise<RaiderIOGuildRaidRanking[]> {
  const allIds = GUILDS.map((g) => g.rId).filter((id) => id);

  let guildIdsToProcess = allIds.splice(0, 10);

  const allRankings: RaiderIOGuildRaidRanking[] = [];

  while (guildIdsToProcess.length) {
    const rankings = await fetchRaidRankingsByDifficulty(
      raidSlug,
      guildIdsToProcess,
      difficulty
    );

    allRankings.push(...rankings);

    guildIdsToProcess = allIds.splice(0, 10);
  }

  return allRankings;
}

/**
 * Fetches static raid data for an expansion from Raider.io.
 * Returns raids with encounter slugs, names, and season start/end dates.
 */
export async function fetchRaidingStaticData(
  expansionId: number
): Promise<RaiderIOStaticRaid[]> {
  const cacheKey = `rio-static-${expansionId}`;

  const { data, ok } = await devCache(cacheKey, async () => {
    const headers = getHeaders();

    const queryParams = `access_key=${process.env.RAIDERIO_ACCESS_KEY}&expansion_id=${expansionId}`;
    const url = `${RAIDING_URL}/static-data?${encodeURI(queryParams)}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    const data = await res.json();
    return { data, ok: res.ok };
  });

  if (ok) {
    return data.raids as RaiderIOStaticRaid[];
  } else {
    const errorMessage = `FAILED TO FETCH RAIDING STATIC DATA FOR EXPANSION ${expansionId}`;
    console.error(errorMessage, data);
    return Promise.reject(data);
  }
}

const RIO_BASE_EXPANSION_ID = 10;

/**
 * Auto-detects the current Raider.io expansion ID by finding the highest
 * expansion that has at least one raid with a start date in the past.
 * Uses a quiet fetch that doesn't log errors for expected 400s.
 */
export async function fetchLatestRIOExpansionId(): Promise<number> {
  let currentId = RIO_BASE_EXPANSION_ID;
  let latestActiveId = RIO_BASE_EXPANSION_ID;
  const now = new Date();

  while (true) {
    try {
      const cacheKey = `rio-static-${currentId}`;

      const { data, ok } = await devCache(cacheKey, async () => {
        const headers = getHeaders();
        const queryParams = `access_key=${process.env.RAIDERIO_ACCESS_KEY}&expansion_id=${currentId}`;
        const url = `${RAIDING_URL}/static-data?${encodeURI(queryParams)}`;

        const res = await fetch(url, { method: 'GET', headers });
        const data = await res.json();
        return { data, ok: res.ok };
      });

      if (!ok || !data.raids?.length) {
        break; // No more expansions
      }

      // Check if any raid has started
      const hasStartedRaid = data.raids.some(
        (r: RaiderIOStaticRaid) => new Date(r.starts.us) <= now
      );

      if (hasStartedRaid) {
        latestActiveId = currentId;
      }

      currentId++;
    } catch {
      break; // Fetch error, stop searching
    }
  }

  return latestActiveId;
}
