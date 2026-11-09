import { describe, expect, it } from 'vitest';

import {
  buildShrinkAlert,
  findMissingReports,
  mergeSnapshot,
  type ReportSnapshot
} from '../report-snapshot';
import type { GuildDiagnostic } from '../wcl-diagnostics';

const SEASON = '2026-10-01T00:00:00.000Z';
const NOW = new Date('2026-11-08T05:00:00.000Z');

function diag(overrides: Partial<GuildDiagnostic> = {}): GuildDiagnostic {
  return {
    guild: 'Test Guild',
    slug: 'test-guild',
    fetched: true,
    reportCount: 0,
    hasMorePages: false,
    reports: [],
    kills: { normal: 0, heroic: 0, mythic: 0 },
    ...overrides
  };
}

const prev: ReportSnapshot = {
  takenAt: '2026-11-07T05:00:00.000Z',
  seasonStart: SEASON,
  guilds: {
    'test-guild': [
      { code: 'aaa', start: '2026-11-01T00:00:00.000Z' },
      { code: 'bbb', start: '2026-11-03T00:00:00.000Z' },
      { code: 'ccc', start: '2026-11-05T00:00:00.000Z' }
    ],
    other: [{ code: 'zzz', start: '2026-11-02T00:00:00.000Z' }]
  }
};

describe('findMissingReports', () => {
  it('names the codes seen last time that are gone today', () => {
    const today = [
      diag({
        reportCount: 2,
        reports: [
          { code: 'aaa', start: '2026-11-01T00:00:00.000Z' },
          { code: 'ddd', start: '2026-11-07T00:00:00.000Z' }
        ]
      })
    ];

    expect(findMissingReports(prev, today, SEASON)).toEqual([
      {
        guild: 'Test Guild',
        slug: 'test-guild',
        codes: [
          { code: 'bbb', start: '2026-11-03T00:00:00.000Z' },
          { code: 'ccc', start: '2026-11-05T00:00:00.000Z' }
        ]
      }
    ]);
  });

  it('returns nothing when every previous code is still present', () => {
    const today = [
      diag({
        reportCount: 4,
        reports: [...prev.guilds['test-guild'], { code: 'ddd', start: '2026-11-07T00:00:00.000Z' }]
      })
    ];

    expect(findMissingReports(prev, today, SEASON)).toEqual([]);
  });

  it('returns nothing on the first run', () => {
    expect(findMissingReports(null, [diag()], SEASON)).toEqual([]);
  });

  it('does not compare across a season change', () => {
    const today = [diag({ reports: [] })];

    expect(findMissingReports(prev, today, '2027-01-01T00:00:00.000Z')).toEqual([]);
  });

  it('does not blame a guild whose fetch failed today', () => {
    const today = [diag({ fetched: false, reports: [] })];

    expect(findMissingReports(prev, today, SEASON)).toEqual([]);
  });

  it('ignores a guild that was not in the previous snapshot', () => {
    const today = [diag({ slug: 'newcomer', guild: 'Newcomer', reports: [] })];

    expect(findMissingReports(prev, today, SEASON)).toEqual([]);
  });
});

describe('mergeSnapshot', () => {
  it('records today codes per fetched guild with the season and time', () => {
    const today = [
      diag({ reports: [{ code: 'ddd', start: '2026-11-07T00:00:00.000Z' }] })
    ];

    expect(mergeSnapshot(prev, today, SEASON, NOW)).toEqual({
      takenAt: NOW.toISOString(),
      seasonStart: SEASON,
      guilds: {
        'test-guild': [{ code: 'ddd', start: '2026-11-07T00:00:00.000Z' }],
        other: prev.guilds.other
      }
    });
  });

  it('keeps the previous codes for a guild whose fetch failed', () => {
    const today = [diag({ fetched: false })];

    const next = mergeSnapshot(prev, today, SEASON, NOW);

    expect(next.guilds['test-guild']).toEqual(prev.guilds['test-guild']);
  });

  it('drops the previous guilds when the season changed', () => {
    const today = [diag({ reports: [{ code: 'new', start: '2027-01-02T00:00:00.000Z' }] })];

    const next = mergeSnapshot(prev, today, '2027-01-01T00:00:00.000Z', NOW);

    expect(next.guilds).toEqual({
      'test-guild': [{ code: 'new', start: '2027-01-02T00:00:00.000Z' }]
    });
  });

  it('starts from an empty snapshot when there was none', () => {
    const next = mergeSnapshot(null, [diag()], SEASON, NOW);

    expect(next).toEqual({
      takenAt: NOW.toISOString(),
      seasonStart: SEASON,
      guilds: { 'test-guild': [] }
    });
  });
});

describe('buildShrinkAlert', () => {
  it('names each guild, its missing codes and their dates', () => {
    const message = buildShrinkAlert(
      [
        {
          guild: 'Test Guild',
          slug: 'test-guild',
          codes: [
            { code: 'bbb', start: '2026-11-03T00:00:00.000Z' },
            { code: 'ccc', start: '2026-11-05T00:00:00.000Z' }
          ]
        },
        {
          guild: 'Other',
          slug: 'other',
          codes: [{ code: 'zzz', start: '2026-11-02T00:00:00.000Z' }]
        }
      ],
      NOW
    );

    expect(message).toContain(`<t:${Math.floor(NOW.getTime() / 1000)}:D>`);
    expect(message).toContain('Test Guild');
    expect(message).toContain('bbb');
    expect(message).toContain(`<t:${Date.UTC(2026, 10, 3) / 1000}:D>`);
    expect(message).toContain('ccc');
    expect(message).toContain('Other');
    expect(message).toContain('zzz');
    expect(message).toContain('https://www.warcraftlogs.com/reports/bbb');
  });
});
