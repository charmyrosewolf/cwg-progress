import * as GUILD_DATA from './guilds';
import { fetchSeasonData, SeasonData } from './raid-data.service';
import { RaidInfo } from '@/lib/types';

export const GUILDS = GUILD_DATA.GUILDS;
export const isCWG = GUILD_DATA.isCWG;

// Cached season data (shared within a single render pass)
let cachedSeasonData: SeasonData | null = null;

async function getSeasonData(): Promise<SeasonData> {
  if (!cachedSeasonData) {
    cachedSeasonData = await fetchSeasonData();
  }
  return cachedSeasonData;
}

export async function getRAIDS(): Promise<RaidInfo[]> {
  const data = await getSeasonData();
  return data.raids;
}

export async function getSeasonStartDate(): Promise<string> {
  const data = await getSeasonData();
  return data.seasonStartDate;
}

export async function getSeasonEndDate(): Promise<string | number> {
  const data = await getSeasonData();
  return data.seasonEndDate;
}
