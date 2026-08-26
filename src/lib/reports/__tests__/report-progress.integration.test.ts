/**
 * Integration tests for the report pipeline.
 *
 * These drive `generateSummaryReport` / `generateProgressReport` end to end with
 * only the two external APIs mocked, so they cover the seam the unit tests
 * can't: strategy selection, both strategies running over one guild list, and
 * cross-guild event aggregation.
 *
 * The "community disappears when encounter IDs don't line up" cases below are
 * the regression tests for the WCL frozen-zone bug, where CWG silently vanished
 * from every table because its fights were filtered against PTR encounter IDs.
 */

import { type Mock } from 'vitest';
import {
  generateProgressReport,
  generateSummaryReport
} from '../report-progress.service';
import { fetchAllRaidRankingsByDifficulty } from '@/lib/api';
import { postQuery } from '@/lib/api/wlogs.api';
import { getGuilds } from '@/lib/data';
import {
  createGuildRanking,
  createEncounterDefeated
} from '@/lib/__tests__/fixtures/guild-fixtures';
import {
  createWlogReport,
  createReportFight
} from '@/lib/__tests__/fixtures/fight-fixtures';
import { createRaidInfo } from '@/lib/__tests__/fixtures/raid-fixtures';
import type { GuildInfo, RaidInfo } from '@/lib/types';
import type { WlogReportFight } from '@/lib/api/wlogs.types';

// Partial mock — ReportBuilder pulls constants (toWlogDifficultiesMap) from
// this barrel, so only the network-touching exports are replaced.
vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  fetchAllRaidRankingsByDifficulty: vi.fn(),
  postQuery: vi.fn().mockResolvedValue(null),
  isWCLAuthFailed: () => false
}));

vi.mock('@/lib/api/wlogs.api', () => ({
  postQuery: vi.fn()
}));

vi.mock('@/lib/data', () => ({
  getGuilds: vi.fn(),
  getSeasonStartDate: vi.fn().mockResolvedValue('2025-01-01T00:00:00.000Z'),
  getSeasonEndDate: vi.fn().mockResolvedValue(0),
  isCommunity: (slug: string) => slug === 'CWG'
}));

const mockRankings = fetchAllRaidRankingsByDifficulty as Mock;
const mockWclQuery = postQuery as Mock;
const mockGetGuilds = getGuilds as Mock;

const NORMAL = 3;

const raid: RaidInfo = createRaidInfo(); // Sikran 2902, Silken Court 2921, Ansurek 2922

const RANKED_GUILD_ID = 100;

const rankedGuild: GuildInfo = {
  rId: RANKED_GUILD_ID,
  name: 'Test Guild',
  slug: 'test-guild',
  realm: 'Thunderhorn',
  region: 'us',
  faction: 'alliance'
};

const community: GuildInfo = {
  rId: 0,
  name: 'CWG',
  slug: 'CWG',
  realm: "Eldre'Thalas",
  region: 'us',
  faction: 'alliance',
  displayName: 'CWG Community'
};

/** Raider.io says the ranked guild killed these bosses on normal. */
function rankGuildWith(defeatedSlugs: string[]) {
  const ranking = createGuildRanking({
    guild: { ...createGuildRanking().guild, id: RANKED_GUILD_ID },
    encountersDefeated: defeatedSlugs.map((slug) =>
      createEncounterDefeated({ slug })
    )
  });

  mockRankings.mockImplementation(async (_slug: string, difficulty: string) =>
    difficulty === 'normal' ? [ranking] : []
  );
}

/** WCL returns these fights for every guild queried. */
function wclReturns(fights: Partial<WlogReportFight>[]) {
  mockWclQuery.mockResolvedValue({
    data: {
      reportData: {
        reports: {
          data: [
            createWlogReport({
              fights: fights.map((f) => createReportFight(f))
            })
          ]
        }
      }
    }
  });
}

beforeEach(() => {
  mockGetGuilds.mockResolvedValue([rankedGuild, community]);
  rankGuildWith(['sikran']);
  wclReturns([{ encounterID: 2902, difficulty: NORMAL, kill: true }]);
});

afterEach(() => {
  vi.clearAllMocks();
  delete rankedGuild.profileUrl;
});

// ─── Summary report ─────────────────────────────────────────

describe('generateSummaryReport', () => {
  it('includes both the ranked guild and the community', async () => {
    const report = await generateSummaryReport(raid);

    expect(report).not.toBeNull();
    expect(report!.summaries.map((s) => s.guild.slug).sort()).toEqual([
      'CWG',
      'test-guild'
    ]);
  });

  it('builds the community from WCL and the guild from Raider.io', async () => {
    rankGuildWith(['sikran', 'the-silken-court']); // RIO: 2 kills
    wclReturns([
      // WCL: 1 kill, for the community only
      { encounterID: 2902, difficulty: NORMAL, kill: true }
    ]);

    const report = await generateSummaryReport(raid);

    const guildStats = report!.summaries.find(
      (s) => s.guild.slug === 'test-guild'
    );
    const communityStats = report!.summaries.find(
      (s) => s.guild.slug === 'CWG'
    );

    expect(guildStats!.overallSummary.summary).toBe('2/3 N');
    expect(communityStats!.overallSummary.summary).toBe('1/3 N');
  });

  it('drops the community when its fights match no encounter in the raid', async () => {
    // Exactly the frozen-zone bug: real fights, but the raid carries encounter
    // IDs that never appear in a log.
    const ptrRaid = createRaidInfo({
      encounters: raid.encounters.map((e) => ({ ...e, id: e.id + 50000 }))
    });

    const report = await generateSummaryReport(ptrRaid);

    expect(report!.summaries.map((s) => s.guild.slug)).not.toContain('CWG');
  });

  it('keeps the ranked guild even when WCL returns nothing', async () => {
    mockWclQuery.mockResolvedValue(null); // auth failure / rate limit

    const report = await generateSummaryReport(raid);

    expect(report!.summaries.map((s) => s.guild.slug)).toEqual(['test-guild']);
  });

  it('aggregates events from every guild', async () => {
    const report = await generateSummaryReport(raid);

    const names = report!.recentEvents.map((e) => e.guildName);
    expect(names).toContain('Test Guild');
    expect(names).toContain('CWG Community');
  });

  it('excludes guilds with no kills at all', async () => {
    rankGuildWith([]);
    mockWclQuery.mockResolvedValue(null);

    const report = await generateSummaryReport(raid);

    expect(report!.summaries).toEqual([]);
  });
});

// ─── Progress report ────────────────────────────────────────

describe('generateProgressReport', () => {
  it('returns null when there is no raid', async () => {
    await expect(
      generateProgressReport(null as unknown as RaidInfo)
    ).resolves.toBeNull();
  });

  it('includes both the ranked guild and the community', async () => {
    const report = await generateProgressReport(raid);

    expect(report!.raidProgression.map((p) => p.guild.slug).sort()).toEqual([
      'CWG',
      'test-guild'
    ]);
  });

  it('drops the community when its fights match no encounter in the raid', async () => {
    const ptrRaid = createRaidInfo({
      encounters: raid.encounters.map((e) => ({ ...e, id: e.id + 50000 }))
    });

    const report = await generateProgressReport(ptrRaid);

    expect(report!.raidProgression.map((p) => p.guild.slug)).not.toContain(
      'CWG'
    );
  });

  it('caps recent events at 5, most recent first', async () => {
    rankGuildWith(['sikran', 'the-silken-court', 'queen-ansurek']);
    wclReturns([
      { id: 1, encounterID: 2902, difficulty: NORMAL, kill: true },
      { id: 2, encounterID: 2921, difficulty: NORMAL, kill: true },
      { id: 3, encounterID: 2922, difficulty: NORMAL, kill: true }
    ]);

    const report = await generateProgressReport(raid);

    expect(report!.recentEvents.length).toBeLessThanOrEqual(5);

    const dates = report!.recentEvents.map((e) => e.dateOccurred.getTime());
    expect([...dates].sort((a, b) => b - a)).toEqual(dates);
  });

  it('preserves the guild-list order in the report', async () => {
    const report = await generateProgressReport(raid);

    // getGuilds returns [rankedGuild, community] — Promise.all must not reorder
    expect(report!.raidProgression.map((p) => p.guild.slug)).toEqual([
      'test-guild',
      'CWG'
    ]);
  });
});
