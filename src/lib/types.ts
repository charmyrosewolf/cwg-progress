/** util types */

import { RaiderIOEncounterDefeated, RaiderIOEncounterPulled } from '@/lib/api';

export type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Faction = 'alliance' | 'horde';
export type Role = 'dps' | 'tank' | 'healer';
export type Region = 'us';

/** graphql queryVars  types */
export type BossDataQueryVars = {
  name: string;
  server: string;
  region: string;
  startTime: number; //  UNIX timestamp with millisecond precision
  endTime: number | undefined;
  reportLimit: number;
};

/** Key = EncounterId, Value = an array of fights for that encounter */
export type FightMap = Map<number, WlogFlattenedFight | WlogFlattenedFight[]>;

export type WlogFlattenedFight = {
  code: string;
  encounterID: number | undefined;
  url: string;
  name: string;
  startTime: Date;
  endTime: Date;
  reportStartTime: Date;
  reportEndTime: Date;
  difficulty: number;
  kill: boolean;
  bossPercentage: number;
  fightPercentage: number;
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

export const difficultiesArray: RAID_DIFFICULTY[] = [
  'normal',
  'heroic',
  'mythic'
];

export const difficultiesMap: DifficultiesMapType = {
  normal: 0,
  heroic: 1,
  mythic: 2
};

export const shortCodeDifficultiesMap: Record<
  RAID_DIFFICULTY_SHORT_CODES,
  RAID_DIFFICULTY
> = {
  N: 'normal',
  H: 'heroic',
  M: 'mythic'
};

export type Encounter = {
  id: number;
  name: string;
  rSlug: string; // r is for raider.io. I don't know if this slug is universal
};

/** GUILD types */
export type GuildInfo = {
  displayName?: string;
  profileUrl?: string;
  rId: number; // raiderIO guildId
  name: string;
  slug: string;
  realm: string;
  region: Region;
  faction: Faction;
};

/** Progress Report Types */
export type GuildRaidEncounter = {
  wlogKillUrl?: string;
  wlogBestPullUrl?: string;
  encounterID: number;
  slug: string;
  name: string;
  maxDifficultyDefeated: RAID_DIFFICULTY | null;
  defeatedAt: string;
  maxDifficultyAttempted: RAID_DIFFICULTY | null;
  lowestBossPercentage: number | null;
};

type NoEncounter = {
  slug: string;
  numPulls: 0;
};

export type RaiderIOEncounter =
  | RaiderIOEncounterPulled
  | RaiderIOEncounterDefeated
  | NoEncounter;

export type GuildRaidEncountersInfo = {
  normal: RaiderIOEncounter[];
  heroic: RaiderIOEncounter[];
  mythic: RaiderIOEncounter[];
  wlogFightMap: FightMap;
  bestPulls: GuildRaidEncounter[];
  profileUrl: string;
};

export type GuildRaidEncountersInfoMap = Map<Number, GuildRaidEncountersInfo>;

export type Statistic = {
  level: RAID_DIFFICULTY;
  bossesKilled: number;
  summary: string;
};

export const createStatistic = (
  level: RAID_DIFFICULTY,
  totalBosses: number,
  bossesKilled: number
): Statistic => {
  const symbol = level.charAt(0).toUpperCase();

  const summary = bossesKilled
    ? `${bossesKilled}/${totalBosses} ${symbol}`
    : '-';

  return {
    level: level,
    bossesKilled: bossesKilled,
    summary: summary
  };
};

export const createStatistics = (
  totalBosses: number,
  normalKills: number,
  heroicKills: number,
  mythicKills: number
): Array<Statistic> => {
  const normalSummary: Statistic = createStatistic(
    'normal',
    totalBosses,
    normalKills
  );
  const heroicSummary: Statistic = createStatistic(
    'heroic',
    totalBosses,
    heroicKills
  );

  const mythicSummary: Statistic = createStatistic(
    'mythic',
    totalBosses,
    mythicKills
  );

  return [normalSummary, heroicSummary, mythicSummary];
};

export type GuildRaidProgressStatistics = {
  guild: GuildInfo;
  overallSummary: Statistic;
  totalBosses: number;
  summaries: Array<Statistic>;
  currentProgression: string;
};

export type GuildRaidProgress = {
  guild: GuildInfo;
  raidEncounters: GuildRaidEncounter[];
  overallSummary: Statistic;
};

export type RaidProgressEventType = 'KILL' | 'BEST';

type KillEvent = {
  wlogUrl?: string;
  guildName: string;
  raidName: string;
  bossName: string;
  type: 'KILL';
  dateOccurred: Date;
};

type BestPullEvent = {
  wlogUrl?: string;
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

// Revalidation interval (in seconds) - controls page ISR and all API refresh cycles
export const REVALIDATION_TIME = 3600 * 4; // 4 hours

// CAREFUL ABOUT RAISING THIS NUMBER DUE TO RATE LIMITS
export const REPORT_LIMIT = 50;

// If needed consider adding this to reports {} and batch pulling
// "total",
// "per_page,
// "current_page,
// "from,
// "to,
// "last_page",
// "has_more_pages"
export const WLOGS_FIGHT_QUERY = `query ($name: String, $server: String, $region: String, $startTime: Float, $endTime: Float, $reportLimit: Int) {
	reportData {
		reports(guildName: $name, guildServerSlug: $server, guildServerRegion: $region, limit: $reportLimit, startTime: $startTime, endTime: $endTime) {
			data {
				code,
				startTime,
				endTime
				fights {
          id,
					encounterID,
					name,
					startTime,
					endTime,
					difficulty,
					kill,
					bossPercentage,
					fightPercentage,
				}
			}
		}
	}
}`;
