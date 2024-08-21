import * as DF_S1 from './df.s1';
import * as DF_S2 from './df.s2';
import * as DF_S3 from './df.s3';
import * as DF_S4 from './df.s4';
import * as TWW_S1 from './tww.s1';

import * as GUILD_DATA from './guilds';
import { isAfter } from 'date-fns/isAfter';

// TODO: could automate this even further by making an array of seasons
function isNewSeason() {
  return isAfter(new Date(), TWW_S1.SEASON_START_DATE);
}

const newRaid = isNewSeason();

export const GUILDS = GUILD_DATA.GUILDS;
export const isCWG = GUILD_DATA.isCWG;

// update this each season
export const RAIDS = newRaid ? TWW_S1.RAIDS : DF_S4.RAIDS;
export const SEASON_END_DATE = newRaid
  ? TWW_S1.SEASON_END_DATE
  : DF_S4.SEASON_END_DATE;
export const SEASON_START_DATE = newRaid
  ? TWW_S1.SEASON_START_DATE
  : DF_S4.SEASON_START_DATE;
