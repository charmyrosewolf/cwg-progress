/** Raider.io APIv1 */
/** https://raider.io/api# */

import { GUILDS } from '../data';
import { RAID_DIFFICULTY, GuildInfo } from '../types';
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

export async function fetchGuildProgressionByDifficulty(
  raidSlug: string,
  guild: GuildInfo,
  difficulty: RAID_DIFFICULTY
): Promise<RawData> {
  const headers = getHeaders();

  const realmSlug = guild.realm
    .toLowerCase()
    .replaceAll("'", '')
    .replaceAll(' ', '-');
  const guildName = guild.name.toLowerCase();

  const queryParams = `region=${guild.region}&realm=${realmSlug}&name=${guildName}&fields=raid_encounters:${raidSlug}:${difficulty},raid_progression,raid_rankings}`;
  const url = `${GUILD_URL}/profile?${encodeURI(queryParams)}`;

  let options: any = {
    method: 'GET',
    headers: headers
  };

  const res = await fetch(url, options);

  const data = await res.json();

  if (res.ok) {
    // TODO: maybe this can be used to track last update?
    // console.log(guild.slug);
    // const date = res.headers.get('Date');
    // const lastModified = res.headers.get('Last-Modified');

    // if (date) {
    //   console.log(new Date(date).toLocaleString());
    //   console.log(new Date(lastModified).toLocaleString());
    // }

    return data;
  } else {
    const errorMessage = `FAILED TO FETCH PROGRESSION FOR ${guild.name} ${raidSlug} ${difficulty}\nURL=${url}`;
    console.error(errorMessage, data);
    return Promise.reject(data);
  }
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

  const headers = getHeaders();

  const guildIdStrings = guildIds.toString();

  const queryParams = `region=${region}&raid=${raidSlug}&difficulty=${difficulty}&guilds=${guildIdStrings}&limit=200&page=0`;
  const url = `${RAIDING_URL}/raid-rankings?${encodeURI(queryParams)}`;

  let options: any = {
    method: 'GET',
    headers: headers
  };

  const res = await fetch(url, options);

  const data = (await res.json()) as RaiderIORaidDifficultyRankings;

  if (res.ok) {
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
