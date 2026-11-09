import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/data', () => ({
  getGuilds: vi.fn(),
  getRAIDS: vi.fn(),
  getSeasonStartDate: vi.fn(),
  getSeasonEndDate: vi.fn()
}));
vi.mock('@/app/_actions/discord', () => ({ sendDiscordMessage: vi.fn() }));
vi.mock('../wcl-diagnostics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../wcl-diagnostics')>();
  return { ...actual, collectDiagnostics: vi.fn() };
});
vi.mock('../snapshot-store', () => ({ createSnapshotStore: vi.fn() }));

import { getGuilds, getRAIDS, getSeasonStartDate, getSeasonEndDate } from '@/lib/data';
import { sendDiscordMessage } from '@/app/_actions/discord';
import { collectDiagnostics, type GuildDiagnostic } from '../wcl-diagnostics';
import { createSnapshotStore, type SnapshotStore } from '../snapshot-store';
import type { ReportSnapshot } from '../report-snapshot';
import { runCronDiagnostics } from '../cron-diagnostics';
import { createRaidInfo } from '@/lib/__tests__/fixtures/raid-fixtures';

const SEASON = '2026-10-01T00:00:00.000Z';

const mockedCollect = vi.mocked(collectDiagnostics);
const mockedCreateStore = vi.mocked(createSnapshotStore);
const mockedSend = vi.mocked(sendDiscordMessage);

function diag(overrides: Partial<GuildDiagnostic> = {}): GuildDiagnostic {
  return {
    guild: 'Test Guild',
    slug: 'test-guild',
    fetched: true,
    reportCount: 1,
    hasMorePages: false,
    reports: [{ code: 'aaa', start: '2026-11-01T00:00:00.000Z' }],
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
      { code: 'bbb', start: '2026-11-03T00:00:00.000Z' }
    ]
  }
};

function fakeStore(previous: ReportSnapshot | null) {
  const store = {
    kind: 'blob' as const,
    read: vi.fn().mockResolvedValue(previous),
    write: vi.fn().mockResolvedValue(undefined)
  };
  return store as SnapshotStore & typeof store;
}

describe('runCronDiagnostics', () => {
  beforeEach(() => {
    vi.mocked(getGuilds).mockResolvedValue([]);
    vi.mocked(getRAIDS).mockResolvedValue([createRaidInfo()]);
    vi.mocked(getSeasonStartDate).mockResolvedValue(SEASON);
    vi.mocked(getSeasonEndDate).mockResolvedValue(0);
    mockedCollect.mockReset();
    mockedCreateStore.mockReset();
    mockedSend.mockReset();
    mockedSend.mockResolvedValue(new Response(null, { status: 204 }));
  });

  it('alerts Discord and saves the new snapshot when reports went missing', async () => {
    const store = fakeStore(prev);
    mockedCreateStore.mockReturnValue(store);
    mockedCollect.mockResolvedValue([diag()]);

    const result = await runCronDiagnostics();

    expect(result.diagnostics).toEqual([diag()]);
    expect(result.snapshot).toMatchObject({
      store: 'blob',
      previousTakenAt: prev.takenAt,
      alerted: true,
      saved: true,
      missing: [
        {
          slug: 'test-guild',
          codes: [{ code: 'bbb', start: '2026-11-03T00:00:00.000Z' }]
        }
      ]
    });
    expect(mockedSend).toHaveBeenCalledTimes(1);
    expect(mockedSend.mock.calls[0][0]).toContain('bbb');
    expect(store.write).toHaveBeenCalledTimes(1);
    expect(store.write.mock.calls[0][0]).toMatchObject({
      seasonStart: SEASON,
      guilds: { 'test-guild': [{ code: 'aaa', start: '2026-11-01T00:00:00.000Z' }] }
    });
  });

  it('stays quiet when nothing is missing but still saves', async () => {
    const store = fakeStore(prev);
    mockedCreateStore.mockReturnValue(store);
    mockedCollect.mockResolvedValue([diag({ reports: prev.guilds['test-guild'] })]);

    const result = await runCronDiagnostics();

    expect(result.snapshot).toMatchObject({ alerted: false, missing: [], saved: true });
    expect(mockedSend).not.toHaveBeenCalled();
    expect(store.write).toHaveBeenCalledTimes(1);
  });

  it('reports the store as unconfigured and alerts nothing without a token', async () => {
    mockedCreateStore.mockReturnValue(null);
    mockedCollect.mockResolvedValue([diag()]);

    const result = await runCronDiagnostics();

    expect(result.diagnostics).toHaveLength(1);
    expect(result.snapshot).toEqual({
      store: 'unconfigured',
      previousTakenAt: null,
      missing: [],
      alerted: false,
      saved: false
    });
    expect(mockedSend).not.toHaveBeenCalled();
  });

  it('does not alert when the webhook call fails, and says so', async () => {
    const store = fakeStore(prev);
    mockedCreateStore.mockReturnValue(store);
    mockedCollect.mockResolvedValue([diag()]);
    mockedSend.mockResolvedValue(new Response('nope', { status: 500 }));

    const result = await runCronDiagnostics();

    expect(result.snapshot?.alerted).toBe(false);
    expect(result.snapshot?.missing).toHaveLength(1);
  });

  it('passes the season window and guilds through to the collector', async () => {
    mockedCreateStore.mockReturnValue(null);
    mockedCollect.mockResolvedValue([]);
    const guilds = [
      { rId: 1, name: 'G', slug: 'g', realm: 'R', region: 'us' as const, faction: 'horde' as const }
    ];
    vi.mocked(getGuilds).mockResolvedValue(guilds);

    await runCronDiagnostics();

    expect(mockedCollect).toHaveBeenCalledWith(guilds, [createRaidInfo()], SEASON, 0);
  });
});
