import {
  flattenWLOGReportFights,
  shortenBossName,
  sortByBestPulls,
  getWlogFightMap,
  sortFightMapByBestPulls
} from '../helper';
import {
  createFight,
  createWlogReport,
  createReportFight
} from '@/lib/__tests__/fixtures/fight-fixtures';
import type { WlogFlattenedFight } from '@/lib/types';

// ─── flattenWLOGReportFights ────────────────────────────────

describe('flattenWLOGReportFights', () => {
  it('flattens a single report with multiple fights', () => {
    const report = createWlogReport({
      fights: [
        createReportFight({ id: 1, encounterID: 2902, name: 'Sikran' }),
        createReportFight({ id: 2, encounterID: 2921, name: 'The Silken Court' })
      ]
    });

    const result = flattenWLOGReportFights([report]);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Sikran');
    expect(result[1].name).toBe('The Silken Court');
  });

  it('computes fight startTime/endTime relative to report startTime', () => {
    const reportStart = new Date('2025-01-15T20:00:00.000Z').getTime();
    const report = createWlogReport({
      startTime: reportStart,
      fights: [
        createReportFight({ startTime: 60_000, endTime: 360_000 }) // 1min and 6min offsets
      ]
    });

    const result = flattenWLOGReportFights([report]);

    expect(result[0].startTime).toEqual(new Date(reportStart + 60_000));
    expect(result[0].endTime).toEqual(new Date(reportStart + 360_000));
  });

  it('generates correct WCL fight URL', () => {
    const report = createWlogReport({
      code: 'XyZ789',
      fights: [createReportFight({ id: 42 })]
    });

    const result = flattenWLOGReportFights([report]);

    expect(result[0].url).toBe(
      'https://www.warcraftlogs.com/reports/XyZ789#fight=42'
    );
    expect(result[0].code).toBe('XyZ789');
  });

  it('preserves report-level timestamps as reportStartTime/reportEndTime', () => {
    const reportStart = new Date('2025-01-15T20:00:00.000Z').getTime();
    const reportEnd = new Date('2025-01-15T22:00:00.000Z').getTime();

    const report = createWlogReport({
      startTime: reportStart,
      endTime: reportEnd,
      fights: [createReportFight()]
    });

    const result = flattenWLOGReportFights([report]);

    expect(result[0].reportStartTime).toEqual(new Date(reportStart));
    expect(result[0].reportEndTime).toEqual(new Date(reportEnd));
  });

  it('filters out reports with empty fights array', () => {
    const reports = [
      createWlogReport({ fights: [] }),
      createWlogReport({
        code: 'hasData',
        fights: [createReportFight()]
      })
    ];

    const result = flattenWLOGReportFights(reports);

    expect(result).toHaveLength(1);
    expect(result[0].code).toBe('hasData');
  });

  it('returns empty array for empty reports input', () => {
    const result = flattenWLOGReportFights([]);
    expect(result).toEqual([]);
  });
});

// ─── sortByBestPulls ────────────────────────────────────────

describe('sortByBestPulls', () => {
  it('sorts higher difficulty first (mythic > heroic > normal)', () => {
    const fights = [
      createFight({ difficulty: 3 }), // normal
      createFight({ difficulty: 5 }), // mythic
      createFight({ difficulty: 4 }) // heroic
    ];

    fights.sort(sortByBestPulls);

    expect(fights.map((f) => f.difficulty)).toEqual([5, 4, 3]);
  });

  it('sorts kills above non-kills at same difficulty', () => {
    const fights = [
      createFight({ difficulty: 4, kill: false }),
      createFight({ difficulty: 4, kill: true })
    ];

    fights.sort(sortByBestPulls);

    expect(fights[0].kill).toBe(true);
    expect(fights[1].kill).toBe(false);
  });

  it('sorts lower bossPercentage first among non-kills (better pull)', () => {
    const fights = [
      createFight({ difficulty: 4, kill: false, bossPercentage: 30 }),
      createFight({ difficulty: 4, kill: false, bossPercentage: 10 }),
      createFight({ difficulty: 4, kill: false, bossPercentage: 50 })
    ];

    fights.sort(sortByBestPulls);

    expect(fights.map((f) => f.bossPercentage)).toEqual([10, 30, 50]);
  });

  it('sorts by reportStartTime when all else is equal', () => {
    const older = new Date('2025-01-10T20:00:00.000Z');
    const newer = new Date('2025-01-20T20:00:00.000Z');

    const fights = [
      createFight({
        difficulty: 4,
        kill: false,
        bossPercentage: 25,
        reportStartTime: newer
      }),
      createFight({
        difficulty: 4,
        kill: false,
        bossPercentage: 25,
        reportStartTime: older
      })
    ];

    fights.sort(sortByBestPulls);

    expect(fights[0].reportStartTime).toEqual(older);
    expect(fights[1].reportStartTime).toEqual(newer);
  });

  it('applies all tiebreakers in order: difficulty → kill → boss% → date', () => {
    const fights = [
      createFight({
        difficulty: 4,
        kill: false,
        bossPercentage: 10,
        reportStartTime: new Date('2025-01-10')
      }),
      createFight({
        difficulty: 5,
        kill: false,
        bossPercentage: 50,
        reportStartTime: new Date('2025-01-10')
      }),
      createFight({
        difficulty: 4,
        kill: true,
        bossPercentage: 0,
        reportStartTime: new Date('2025-01-10')
      })
    ];

    fights.sort(sortByBestPulls);

    // mythic first (diff=5), then heroic kill (diff=4, kill=true), then heroic wipe (diff=4, kill=false)
    expect(fights[0].difficulty).toBe(5);
    expect(fights[1].kill).toBe(true);
    expect(fights[2].bossPercentage).toBe(10);
  });
});

// ─── getWlogFightMap ────────────────────────────────────────

describe('getWlogFightMap', () => {
  it('groups fights by encounterID', () => {
    const fights = [
      createFight({ encounterID: 2902, name: 'Sikran' }),
      createFight({ encounterID: 2921, name: 'The Silken Court' }),
      createFight({ encounterID: 2902, name: 'Sikran' })
    ];

    const map = getWlogFightMap(fights);

    expect(map.size).toBe(2);
    expect((map.get(2902) as WlogFlattenedFight[]).length).toBe(2);
    expect((map.get(2921) as WlogFlattenedFight[]).length).toBe(1);
  });

  it('returns single-element arrays for unique encounters', () => {
    const fights = [createFight({ encounterID: 2902 })];

    const map = getWlogFightMap(fights);

    expect((map.get(2902) as WlogFlattenedFight[]).length).toBe(1);
  });

  it('returns empty map for empty input', () => {
    const map = getWlogFightMap([]);
    expect(map.size).toBe(0);
  });
});

// ─── sortFightMapByBestPulls ────────────────────────────────

describe('sortFightMapByBestPulls', () => {
  it('keeps only the single best pull per encounter', () => {
    const fights = [
      createFight({ encounterID: 2902, bossPercentage: 50 }),
      createFight({ encounterID: 2902, bossPercentage: 10 }),
      createFight({ encounterID: 2902, bossPercentage: 30 })
    ];

    const fightMap = getWlogFightMap(fights);
    const bestPullMap = sortFightMapByBestPulls(fightMap);

    const best = bestPullMap.get(2902) as WlogFlattenedFight;
    expect(best).toBeDefined();
    expect(best.bossPercentage).toBe(10); // lowest = best
  });

  it('selects a kill over a non-kill for the same encounter', () => {
    const fights = [
      createFight({
        encounterID: 2902,
        kill: false,
        bossPercentage: 5,
        difficulty: 4
      }),
      createFight({
        encounterID: 2902,
        kill: true,
        bossPercentage: 0,
        difficulty: 4
      })
    ];

    const fightMap = getWlogFightMap(fights);
    const bestPullMap = sortFightMapByBestPulls(fightMap);

    const best = bestPullMap.get(2902) as WlogFlattenedFight;
    expect(best.kill).toBe(true);
  });

  it('keeps best pulls for multiple encounters independently', () => {
    const fights = [
      createFight({ encounterID: 2902, bossPercentage: 40 }),
      createFight({ encounterID: 2902, bossPercentage: 20 }),
      createFight({ encounterID: 2921, bossPercentage: 60 }),
      createFight({ encounterID: 2921, bossPercentage: 15 })
    ];

    const fightMap = getWlogFightMap(fights);
    const bestPullMap = sortFightMapByBestPulls(fightMap);

    expect((bestPullMap.get(2902) as WlogFlattenedFight).bossPercentage).toBe(
      20
    );
    expect((bestPullMap.get(2921) as WlogFlattenedFight).bossPercentage).toBe(
      15
    );
  });
});

// ─── shortenBossName ───────────────────────────────────────

describe('shortenBossName', () => {
  it('strips "The" prefix and returns second word', () => {
    expect(shortenBossName('The Silken Court')).toBe('Silken');
  });

  it('strips "Awakened" prefix and returns second word', () => {
    expect(shortenBossName('Awakened Patchwerk')).toBe('Patchwerk');
  });

  it('removes commas before splitting', () => {
    expect(shortenBossName('Sikran, Captain of the Sureki')).toBe('Sikran');
  });

  it('returns first word for regular names', () => {
    expect(shortenBossName('Queen Ansurek')).toBe('Queen');
  });

  it('returns the full name for single-word names', () => {
    expect(shortenBossName('Sikran')).toBe('Sikran');
  });
});
