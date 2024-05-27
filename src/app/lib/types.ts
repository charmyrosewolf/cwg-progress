/** RAID types */
export type RaidInfo = {
  name: string;
  slug: string;
  encounters: Encounter[];
};

export type RAID_DIFFICULTY = 'normal' | 'heroic' | 'mythic';

export type Encounter = {
  id: number;
  name: string;
  rSlug: string; // r is for raider.io. I don't know if this slug is universal
};

/** GUILD types */
export type GuildInfo = {
  name: string;
  slug: string;
  realm: string;
  region: 'us';
};

/** Progress Report Types */
export type GuildRaidEncounter = {
  slug: string;
  name: string;
  maxDifficultyDefeated: RAID_DIFFICULTY | null;
  defeatedAt: string;
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

export type ProgressReport = {
  raid: RaidInfo;
  raidProgression: GuildRaidProgress[]; // each guilds progress for this raid
};
