/** Raider.io APIv1 */
/** https://raider.io/api# */

import { isDevelopment } from '../helper';
import { RAID_DIFFICULTY, GuildInfo } from '../types';

const GUILD_URL = 'https://raider.io/api/v1/guilds';

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

  if (!isDevelopment()) {
    options.cache = 'no-store';
  } else {
    // uncomment only to refresh cache
    // we don't want to over request third-party apis on development
    // options.next = { revalidate: 1 };
  }

  const res = await fetch(url, options);

  const data = await res.json();

  if (res.ok) {
    return data;
  } else {
    const errorMessage = `FAILED TO FETCH PROGRESSION FOR ${guild.name} ${raidSlug} ${difficulty}\nURL=${url}`;
    console.error(errorMessage, data);
    return Promise.reject(data);
  }
}
