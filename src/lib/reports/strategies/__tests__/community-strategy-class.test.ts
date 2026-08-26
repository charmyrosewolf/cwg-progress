/**
 * Tests for the CommunityStrategy class surface (buildProgress / buildSummary),
 * including the WCL fetch it wraps. The pure report-building helpers it calls
 * are covered separately in community-strategy.test.ts.
 */

import { type Mock } from 'vitest';
import { CommunityStrategy } from '../community-strategy';
import { postQuery } from '@/lib/api/wlogs.api';
import {
  createWlogReport,
  createReportFight
} from '@/lib/__tests__/fixtures/fight-fixtures';
import { createRaidInfo } from '@/lib/__tests__/fixtures/raid-fixtures';
import type { GuildInfo, RaidInfo } from '@/lib/types';
import type { WlogReport, WlogReportFight } from '@/lib/api/wlogs.types';

vi.mock('@/lib/api/wlogs.api', () => ({
  postQuery: vi.fn()
}));

vi.mock('@/lib/data', () => ({
  getSeasonStartDate: vi.fn().mockResolvedValue('2025-01-01T00:00:00.000Z'),
  getSeasonEndDate: vi.fn().mockResolvedValue(0),
  isCommunity: (slug: string) => slug === 'CWG'
}));

const mockPostQuery = postQuery as Mock;

const NORMAL = 3;
const HEROIC = 4;

const raid: RaidInfo = createRaidInfo(); // Sikran 2902, Silken Court 2921, Ansurek 2922

const community: GuildInfo = {
  rId: 0,
  name: 'CWG',
  slug: 'CWG',
  realm: "Eldre'Thalas",
  region: 'us',
  faction: 'alliance',
  displayName: 'CWG Community'
};

function respondWith(reports: WlogReport[]) {
  mockPostQuery.mockResolvedValue({
    data: { reportData: { reports: { data: reports } } }
  });
}

function report(fights: Partial<WlogReportFight>[]): WlogReport {
  return createWlogReport({
    fights: fights.map((f) => createReportFight(f))
  });
}

afterEach(() => {
  vi.clearAllMocks();
});

// ─── buildProgress ──────────────────────────────────────────

describe('CommunityStrategy.buildProgress', () => {
  it('returns null when WCL rejects the query', async () => {
    // postQuery resolves to null on auth failure / rate limit
    mockPostQuery.mockResolvedValue(null);

    const result = await new CommunityStrategy().buildProgress(raid, community);

    expect(result).toBeNull();
  });

  it('returns null when the community has no reports this season', async () => {
    respondWith([]);

    const result = await new CommunityStrategy().buildProgress(raid, community);

    expect(result).toBeNull();
  });

  it('returns null when no fights belong to this raid', async () => {
    // encounterID 9999 is not one of the raid's encounters
    respondWith([report([{ encounterID: 9999, kill: true }])]);

    const result = await new CommunityStrategy().buildProgress(raid, community);

    expect(result).toBeNull();
  });

  it('builds progress from WCL kills', async () => {
    respondWith([
      report([
        { id: 1, encounterID: 2902, difficulty: NORMAL, kill: true },
        { id: 2, encounterID: 2921, difficulty: NORMAL, kill: true },
        { id: 3, encounterID: 2922, difficulty: NORMAL, kill: false, bossPercentage: 18 }
      ])
    ]);

    const result = await new CommunityStrategy().buildProgress(raid, community);

    expect(result).not.toBeNull();
    expect(result!.guild.slug).toBe('CWG');
    expect(result!.raidEncounters).toHaveLength(3);
    expect(result!.overallSummary.summary).toBe('2/3 N');
  });

  it('reports the highest difficulty a boss was killed on', async () => {
    respondWith([
      report([
        { id: 1, encounterID: 2902, difficulty: NORMAL, kill: true },
        { id: 2, encounterID: 2902, difficulty: HEROIC, kill: true }
      ])
    ]);

    const result = await new CommunityStrategy().buildProgress(raid, community);

    const sikran = result!.raidEncounters.find((e) => e.slug === 'sikran');
    expect(sikran!.maxDifficultyDefeated).toBe('heroic');
  });

  it('queries WCL with the community name and a punctuation-free realm', async () => {
    respondWith([report([{ encounterID: 2902, difficulty: NORMAL, kill: true }])]);

    await new CommunityStrategy().buildProgress(raid, community);

    expect(mockPostQuery).toHaveBeenCalledTimes(1);
    expect(mockPostQuery.mock.calls[0][1]).toMatchObject({
      name: 'CWG',
      server: 'eldrethalas',
      region: 'us'
    });
  });
});

// ─── buildSummary ───────────────────────────────────────────

describe('CommunityStrategy.buildSummary', () => {
  it('returns empty stats and no events when WCL rejects the query', async () => {
    mockPostQuery.mockResolvedValue(null);

    const result = await new CommunityStrategy().buildSummary(raid, community);

    expect(result).toEqual({ stats: null, events: [] });
  });

  it('returns null stats when the community has pulls but no kills', async () => {
    respondWith([
      report([
        {
          encounterID: 2902,
          difficulty: NORMAL,
          kill: false,
          bossPercentage: 42
        }
      ])
    ]);

    const result = await new CommunityStrategy().buildSummary(raid, community);

    expect(result.stats).toBeNull();
  });

  it('returns statistics and events from a single WCL fetch', async () => {
    respondWith([
      report([
        { id: 1, encounterID: 2902, difficulty: NORMAL, kill: true },
        { id: 2, encounterID: 2921, difficulty: NORMAL, kill: true }
      ])
    ]);

    const result = await new CommunityStrategy().buildSummary(raid, community);

    expect(result.stats).not.toBeNull();
    expect(result.stats!.totalBosses).toBe(3);
    expect(result.stats!.overallSummary.summary).toBe('2/3 N');
    expect(result.events.filter((e) => e.type === 'KILL')).toHaveLength(2);

    // One fetch for both halves — the reason buildSummary returns them together
    expect(mockPostQuery).toHaveBeenCalledTimes(1);
  });

  it('names the boss the community is currently progressing on', async () => {
    respondWith([
      report([
        { id: 1, encounterID: 2902, difficulty: NORMAL, kill: true },
        {
          id: 2,
          encounterID: 2921,
          difficulty: NORMAL,
          kill: false,
          bossPercentage: 12
        }
      ])
    ]);

    const result = await new CommunityStrategy().buildSummary(raid, community);

    expect(result.stats!.currentProgression).toContain('12%');
    expect(result.stats!.currentProgression.startsWith('N ')).toBe(true);
  });

  it('attributes events to the display name when the community has one', async () => {
    respondWith([report([{ encounterID: 2902, difficulty: NORMAL, kill: true }])]);

    const result = await new CommunityStrategy().buildSummary(raid, community);

    expect(result.events[0].guildName).toBe('CWG Community');
  });
});
