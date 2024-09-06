import { RAID_DIFFICULTY } from '../types';

export type WlogReport = {
  code: string; // this is the report code # in the report url
  startTime: number;
  endTime: number;
  fights: WlogReportFight[];
};

export type WlogReportFight = {
  id: number; // this is the fight # in the report url
  encounterID: number | undefined;
  name: string;
  startTime: number;
  endTime: number;
  difficulty: number;
  kill: boolean;
  bossPercentage: number;
  fightPercentage: number;
};

export const generateFightUrl = (reportCode: string, fightId: number) => {
  return `https://www.warcraftlogs.com/reports/${reportCode}#fight=${fightId}`;
};

export type WLogsDifficultiesMapType = {
  [Property in WLOGS_RAID_DIFFICULTY]: RAID_DIFFICULTY;
};

export type ToWLogsDifficultiesMapType = {
  [Property in RAID_DIFFICULTY]: WLOGS_RAID_DIFFICULTY;
};

export type WLOGS_RAID_DIFFICULTY = '3' | '4' | '5';

export const wlogsDifficultiesMap: WLogsDifficultiesMapType = {
  '3': 'normal',
  '4': 'heroic',
  '5': 'mythic'
};

export const toWlogDifficultiesMap: ToWLogsDifficultiesMapType = {
  normal: '3',
  heroic: '4',
  mythic: '5'
};

export const WLOGS_NORMAL_DIFFICULTY_ID = 3;
export const WLOGS_HEROIC_DIFFICULTY_ID = 4;
export const WLOGS_MYTHIC_DIFFICULTY_ID = 5;
