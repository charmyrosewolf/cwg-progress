/** util types */

export type KeysOfUnion<T> = T extends T ? keyof T : never;

/** graphql queryVars  types */
export type BossDataQueryVars = {
  name: string;
  server: string;
  region: string;
  startTime: number; //  UNIX timestamp with millisecond precision
  endTime: number | undefined;
  reportLimit: number;
};

/** RAID types */
export type RaidInfo = {
  name: string;
  slug: string;
  encounters: Encounter[];
};

export type RAID_DIFFICULTY = 'normal' | 'heroic' | 'mythic';
export type RAID_DIFFICULTY_SHORT_CODES = 'N' | 'H' | 'M';

export type DifficultiesMapType = {
  [Property in RAID_DIFFICULTY]: number;
};

export const WLOGS_NORMAL_DIFFICULTY_ID = 3;
export const WLOGS_HEROIC_DIFFICULTY_ID = 4;
export const WLOGS_MYTHIC_DIFFICULTY_ID = 5;

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
  displayName?: string;
  profileUrl?: string;
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

export type Statistic = {
  level: RAID_DIFFICULTY;
  bossesKilled: number;
  summary: string;
};

export type GuildRaidProgressStatistics = {
  guild: GuildInfo;
  overallSummary: Statistic;
  totalBosses: number;
  summaries: Array<Statistic>;
};

export type GuildRaidProgress = {
  guild: GuildInfo;
  raidEncounters: GuildRaidEncounter[];
  overallSummary: Statistic;
};

export type RaidProgressEventType = 'KILL' | 'BEST';

type KillEvent = {
  guildName: string;
  raidName: string;
  bossName: string;
  type: 'KILL';
  dateOccurred: Date;
};

type BestPullEvent = {
  guildName: string;
  raidName: string;
  bossName: string;
  lowestPercentage: number;
  type: 'BEST';
  dateOccurred: Date;
};

export type RaidProgressEvent = KillEvent | BestPullEvent;

export type SummaryReport = {
  raid: RaidInfo;
  summaries: GuildRaidProgressStatistics[];
  createdOn: Date; // date report was generated
  recentEvents: RaidProgressEvent[];
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
