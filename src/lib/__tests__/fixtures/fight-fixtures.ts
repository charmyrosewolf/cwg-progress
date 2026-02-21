import type { WlogFlattenedFight } from '@/lib/types';
import type { WlogReport, WlogReportFight } from '@/lib/api/wlogs.types';

const BASE_DATE = new Date('2025-01-15T20:00:00.000Z');

export function createFight(
  overrides: Partial<WlogFlattenedFight> = {}
): WlogFlattenedFight {
  return {
    code: 'abc123',
    encounterID: 2902,
    url: 'https://www.warcraftlogs.com/reports/abc123#fight=1',
    name: 'Sikran',
    startTime: new Date(BASE_DATE.getTime()),
    endTime: new Date(BASE_DATE.getTime() + 300_000), // 5 min fight
    reportStartTime: new Date(BASE_DATE.getTime() - 600_000),
    reportEndTime: new Date(BASE_DATE.getTime() + 3600_000),
    difficulty: 4, // heroic
    kill: false,
    bossPercentage: 25,
    fightPercentage: 75,
    ...overrides
  };
}

export function createReportFight(
  overrides: Partial<WlogReportFight> = {}
): WlogReportFight {
  return {
    id: 1,
    encounterID: 2902,
    name: 'Sikran',
    startTime: 60_000, // 1 min offset from report start
    endTime: 360_000, // 6 min offset
    difficulty: 4,
    kill: false,
    bossPercentage: 25,
    fightPercentage: 75,
    ...overrides
  };
}

export function createWlogReport(
  overrides: Partial<WlogReport> = {}
): WlogReport {
  return {
    code: 'abc123',
    startTime: BASE_DATE.getTime(), // 2025-01-15T20:00:00.000Z
    endTime: BASE_DATE.getTime() + 7200_000, // +2 hours
    fights: [createReportFight()],
    ...overrides
  };
}
