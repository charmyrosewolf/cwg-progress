/** graphql queryVars  types */
export type BossDataQueryVars = {
  encounterID: number;
  name: string;
  server: string;
  region: string;
  startTime: number;
  endTime: number | undefined;
};

/** RAID types */
export type RaidInfo = {
  name: string;
  slug: string;
  encounters: Encounter[];
};

export type RAID_DIFFICULTY = 'normal' | 'heroic' | 'mythic';

export type DifficultiesMapType = {
  [Property in RAID_DIFFICULTY]: number;
};

export type WLOGS_RAID_DIFFICULTY = '3' | '4' | '5';

export type WLogsDifficultiesMapType = {
  [Property in WLOGS_RAID_DIFFICULTY]: RAID_DIFFICULTY;
};

export type Encounter = {
  id: number;
  name: string;
  rSlug: string; // r is for raider.io. I don't know if this slug is universal
};

export type Faction = 'alliance' | 'horde';
export type Region = 'us';

/** GUILD types */
export type GuildInfo = {
  name: string;
  slug: string;
  realm: string;
  region: Region;
  faction: Faction;
};

/** Progress Report Types */
export type GuildRaidEncounter = {
  encounterID: number;
  slug: string;
  name: string;
  maxDifficultyDefeated: RAID_DIFFICULTY | null;
  defeatedAt: string;
  maxDifficultyAttempted: RAID_DIFFICULTY | null;
  lowestBossPercentage: number | null;
};

export type GuildRaidProgressStats = {
  summary: string;
  totalBosses: number;
  normalBossesKilled: number;
  heroicBossesKilled: number;
  mythicBossesKilled: number;
};

export type GuildRaidProgress = {
  guild: GuildInfo;
  faction: string;
  profileUrl: string;
  raidEncounters: GuildRaidEncounter[];
  stats: GuildRaidProgressStats;
};

export type RaidProgressEvent = {
  guildName: string;
  bossName: string;
  dateOccurred: Date;
};

export type ProgressReport = {
  raid: RaidInfo;
  raidProgression: GuildRaidProgress[]; // each guilds progress for this raid
  createdOn: Date; // date report was generated
  recentEvents: RaidProgressEvent[];
};

/** constants **/

// revalidate data every 4 hours for now
export const REVALIDATION_TIME = 3600 * 4;
