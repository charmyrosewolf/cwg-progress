import { Faction, Region } from '../types';

export type Locale = 'en_US';
export type RegionName = 'United States & Oceania';
export type RegionShortName = 'US';

export type RaiderIOGuild = {
  id: number;
  name: string;
  faction: Faction;
  realm: RaiderIORealm;
  region: RaiderIoRegionInfo;
  path: string;
};

export type RaiderIoRegionInfo = {
  name: RegionName;
  slug: Region;
  shortName: RegionShortName;
};

export type RaiderIORealm = {
  id: number;
  connectedRealmID: number;
  wowRealmID: number;
  wowConnectedRealmID: number;
  name: string;
  altName: string | null;
  slug: string;
  altSlug: string;
  locale: string;
  isConnected: boolean;
  realmType: string;
};

/** Guild Ranking Types created from raiding/raid-rankings json data **/

export type RaiderIORaidDifficultyRankings = {
  raidRankings: RaiderIOGuildRaidRanking[];
};

export type RaiderIOGuildRaidRanking = {
  rank: number;
  regionRank: number;
  guild: RaiderIOGuild;
  encountersDefeated: RaiderIOEncounterDefeated[];
  encountersPulled: RaiderIOEncounterPulled[];
};

export type RaiderIOEncounterDefeated = {
  slug: string;
  lastDefeated: string;
  firstDefeated: string;
};

export type RaiderIOEncounterPulled = {
  id: number;
  slug: string;
  numPulls: number;
  pullStartedAt: string;
  bestPercent: number;
  isDefeated: boolean;
};
