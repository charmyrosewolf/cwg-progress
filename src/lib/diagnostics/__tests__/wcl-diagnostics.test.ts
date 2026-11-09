import { describe, expect, it, vi, beforeEach } from 'vitest';

import {
  buildGuildDiagnostic,
  collectDiagnostics,
  WLOGS_DIAGNOSTIC_QUERY,
  type WlogReportPage
} from '../wcl-diagnostics';
import {
  createReportFight,
  createWlogReport
} from '@/lib/__tests__/fixtures/fight-fixtures';
import { createRaidInfo } from '@/lib/__tests__/fixtures/raid-fixtures';
import type { GuildInfo } from '@/lib/types';

vi.mock('@/lib/api/wlogs.api', () => ({ postQuery: vi.fn() }));

import { postQuery } from '@/lib/api/wlogs.api';

const mockedPostQuery = vi.mocked(postQuery);

const guild: GuildInfo = {
  rId: 1,
  name: 'Test Guild',
  slug: 'test-guild',
  realm: "Eldre'Thalas",
  region: 'us',
  faction: 'alliance'
};

const raids = [createRaidInfo()];

function page(
  reports: ReturnType<typeof createWlogReport>[],
  hasMore = false
): WlogReportPage {
  return { data: reports, has_more_pages: hasMore, total: reports.length };
}

describe('buildGuildDiagnostic', () => {
  it('lists report codes with ISO start dates and the page flag', () => {
    const d = buildGuildDiagnostic(
      guild,
      raids,
      page(
        [
          createWlogReport({ code: 'aaa', startTime: Date.UTC(2026, 10, 1) }),
          createWlogReport({ code: 'bbb', startTime: Date.UTC(2026, 10, 3) })
        ],
        true
      )
    );

    expect(d.guild).toBe('Test Guild');
    expect(d.slug).toBe('test-guild');
    expect(d.fetched).toBe(true);
    expect(d.reportCount).toBe(2);
    expect(d.hasMorePages).toBe(true);
    expect(d.reports).toEqual([
      { code: 'aaa', start: '2026-11-01T00:00:00.000Z' },
      { code: 'bbb', start: '2026-11-03T00:00:00.000Z' }
    ]);
  });

  it('counts distinct killed encounters per difficulty', () => {
    const fights = [
      createReportFight({ id: 1, encounterID: 2902, difficulty: 3, kill: true }),
      createReportFight({ id: 2, encounterID: 2921, difficulty: 3, kill: true }),
      createReportFight({ id: 3, encounterID: 2902, difficulty: 4, kill: true }),
      createReportFight({ id: 4, encounterID: 2902, difficulty: 5, kill: false })
    ];

    const d = buildGuildDiagnostic(
      guild,
      raids,
      page([createWlogReport({ fights })])
    );

    expect(d.kills).toEqual({ normal: 2, heroic: 1, mythic: 0 });
  });

  it('counts a boss killed twice once, across reports', () => {
    const d = buildGuildDiagnostic(
      guild,
      raids,
      page([
        createWlogReport({
          code: 'aaa',
          fights: [
            createReportFight({ id: 1, encounterID: 2902, difficulty: 4, kill: true }),
            createReportFight({ id: 2, encounterID: 2902, difficulty: 4, kill: true })
          ]
        }),
        createWlogReport({
          code: 'bbb',
          fights: [
            createReportFight({ id: 1, encounterID: 2902, difficulty: 4, kill: true })
          ]
        })
      ])
    );

    expect(d.kills.heroic).toBe(1);
  });

  it('ignores kills of encounters outside the current raids', () => {
    const d = buildGuildDiagnostic(
      guild,
      raids,
      page([
        createWlogReport({
          fights: [
            createReportFight({ id: 1, encounterID: 1234, difficulty: 5, kill: true }),
            createReportFight({ id: 2, encounterID: undefined, difficulty: 5, kill: true })
          ]
        })
      ])
    );

    expect(d.kills.mythic).toBe(0);
  });

  it('marks a failed fetch instead of reporting zero reports as fact', () => {
    const d = buildGuildDiagnostic(guild, raids, null);

    expect(d.fetched).toBe(false);
    expect(d.reportCount).toBe(0);
    expect(d.hasMorePages).toBeNull();
    expect(d.reports).toEqual([]);
  });
});

describe('collectDiagnostics', () => {
  beforeEach(() => {
    mockedPostQuery.mockReset();
  });

  it('queries one page per guild with the same vars the reports use', async () => {
    mockedPostQuery.mockResolvedValue({
      data: { reportData: { reports: page([createWlogReport()]) } }
    });

    const result = await collectDiagnostics(
      [guild],
      raids,
      '2026-10-01T00:00:00.000Z',
      '2026-12-01T00:00:00.000Z'
    );

    expect(result).toHaveLength(1);
    expect(result[0].reportCount).toBe(1);
    expect(mockedPostQuery).toHaveBeenCalledTimes(1);
    expect(mockedPostQuery.mock.calls[0][0]).toBe(WLOGS_DIAGNOSTIC_QUERY);
    expect(mockedPostQuery.mock.calls[0][1]).toEqual({
      name: 'Test Guild',
      server: 'eldrethalas',
      region: 'us',
      startTime: Date.UTC(2026, 9, 1),
      endTime: Date.UTC(2026, 11, 1),
      reportLimit: 50
    });
  });

  it('leaves endTime undefined for an open season', async () => {
    mockedPostQuery.mockResolvedValue({
      data: { reportData: { reports: page([]) } }
    });

    await collectDiagnostics([guild], raids, '2026-10-01T00:00:00.000Z', 0);

    expect(mockedPostQuery.mock.calls[0][1]).toMatchObject({ endTime: undefined });
  });

  it('skips opted-out guilds', async () => {
    mockedPostQuery.mockResolvedValue({
      data: { reportData: { reports: page([]) } }
    });

    const result = await collectDiagnostics(
      [guild, { ...guild, slug: 'quiet', name: 'Quiet', optOut: true }],
      raids,
      '2026-10-01T00:00:00.000Z',
      undefined
    );

    expect(result.map((d) => d.slug)).toEqual(['test-guild']);
    expect(mockedPostQuery).toHaveBeenCalledTimes(1);
  });

  it('reports a guild whose query returned null as not fetched', async () => {
    mockedPostQuery.mockResolvedValue(null);

    const [d] = await collectDiagnostics(
      [guild],
      raids,
      '2026-10-01T00:00:00.000Z',
      undefined
    );

    expect(d.fetched).toBe(false);
  });

  it('asks WCL for the paging flag', () => {
    expect(WLOGS_DIAGNOSTIC_QUERY).toContain('has_more_pages');
  });
});
