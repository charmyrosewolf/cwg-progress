import * as DF_S1 from './df.s1';
import * as DF_S2 from './df.s2';
import * as DF_S3 from './df.s3';
import * as DF_S4 from './df.s4';
import * as TWW_S1 from './tww.s1';
import * as TWW_S2 from './tww.s2';

import * as GUILD_DATA from './guilds';
import { isAfter } from 'date-fns/isAfter';

const lastSeason = TWW_S1;
const newSeason = TWW_S2;

// TODO: could automate this even further by making an array of seasons
function isNewSeason() {
  return isAfter(new Date(), newSeason.SEASON_START_DATE);
}

const newRaid = isNewSeason();

export const GUILDS = GUILD_DATA.GUILDS;
export const isCWG = GUILD_DATA.isCWG;

// update this each season
export const RAIDS = newRaid ? newSeason.RAIDS : lastSeason.RAIDS;
export const SEASON_END_DATE = newRaid
  ? newSeason.SEASON_END_DATE
  : lastSeason.SEASON_END_DATE;
export const SEASON_START_DATE = newRaid
  ? newSeason.SEASON_START_DATE
  : lastSeason.SEASON_START_DATE;
