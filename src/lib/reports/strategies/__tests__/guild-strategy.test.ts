import { GuildStrategy, processGuild } from '../guild-strategy';
import { ReportBuilder } from '@/lib/reports/report-builder';
import {
  createGuildRanking,
  createEncounterDefeated,
  createEncounterPulled
} from '@/lib/__tests__/fixtures/guild-fixtures';
import { createRaidInfo } from '@/lib/__tests__/fixtures/raid-fixtures';
import type { GuildInfo, RaidInfo } from '@/lib/types';

// ─── Test setup ─────────────────────────────────────────────

const GUILD_ID = 100;

const raid: RaidInfo = createRaidInfo(); // 3 bosses: Sikran, Silken Court, Ansurek

const guild: GuildInfo = {
  rId: GUILD_ID,
  name: 'Test Guild',
  slug: 'test-guild',
  realm: 'Thunderhorn',
  region: 'us',
  faction: 'alliance'
};

/**
 * Builds a real (not stubbed) ReportBuilder so these tests exercise the actual
 * seam GuildStrategy depends on.
 */
function buildBuilder(
  opts: {
    normalDefeated?: string[];
    heroicDefeated?: string[];
    normalPulled?: { slug: string; bestPercent: number }[];
  } = {}
): ReportBuilder {
  const builder = new ReportBuilder(raid);

  const normalRanking = createGuildRanking({
    guild: { ...createGuildRanking().guild, id: GUILD_ID },
    encountersDefeated: (opts.normalDefeated ?? []).map((slug) =>
      createEncounterDefeated({ slug })
    ),
    encountersPulled: (opts.normalPulled ?? []).map(({ slug, bestPercent }) =>
      createEncounterPulled({ slug, bestPercent })
    )
  });

  const heroicRanking = createGuildRanking({
    guild: { ...createGuildRanking().guild, id: GUILD_ID },
    encountersDefeated: (opts.heroicDefeated ?? []).map((slug) =>
      createEncounterDefeated({ slug })
    )
  });

  builder.populateEncountersByDifficulty([normalRanking], [heroicRanking], []);
  builder.build();

  return builder;
}

beforeEach(() => {
  // guild.profileUrl is assigned by processGuild — reset between tests
  delete guild.profileUrl;
});

// ─── processGuild ───────────────────────────────────────────

describe('processGuild', () => {
  it('returns null when the guild has no rankings at all', () => {
    const builder = buildBuilder({ normalDefeated: ['sikran'] });

    const result = processGuild(raid, builder, { ...guild, rId: 999 });

    expect(result).toBeNull();
  });

  it('returns null when the guild is ranked but has killed nothing', () => {
    const builder = buildBuilder({
      normalPulled: [{ slug: 'sikran', bestPercent: 40 }]
    });

    const result = processGuild(raid, builder, guild);

    expect(result).toBeNull();
  });

  it('counts kills per difficulty and totals the raid bosses', () => {
    const builder = buildBuilder({
      normalDefeated: ['sikran', 'the-silken-court'],
      heroicDefeated: ['sikran']
    });

    const result = processGuild(raid, builder, guild);

    expect(result).not.toBeNull();
    expect(result!.totalBosses).toBe(3);
    expect(result!.overallSummary.summary).toBe('1/3 H');
  });

  it('copies the Raider.io profile url onto the guild', () => {
    const builder = buildBuilder({ normalDefeated: ['sikran'] });

    const result = processGuild(raid, builder, guild);

    expect(result!.guild.profileUrl).toBeTruthy();
    expect(guild.profileUrl).toBe(result!.guild.profileUrl);
  });

  it('produces one KILL event per defeated boss', () => {
    const builder = buildBuilder({
      normalDefeated: ['sikran', 'queen-ansurek']
    });

    const result = processGuild(raid, builder, guild);

    const kills = result!.events.filter((e) => e.type === 'KILL');
    expect(kills).toHaveLength(2);
    expect(kills.map((e) => e.bossName).sort()).toEqual([
      'Queen Ansurek',
      'Sikran'
    ]);
  });
});

// ─── GuildStrategy.buildProgress ────────────────────────────

describe('GuildStrategy.buildProgress', () => {
  it('returns null for a guild with no kills', async () => {
    const strategy = new GuildStrategy(buildBuilder());

    await expect(strategy.buildProgress(raid, guild)).resolves.toBeNull();
  });

  it('returns the guild, its encounters and its overall summary', async () => {
    const strategy = new GuildStrategy(
      buildBuilder({ normalDefeated: ['sikran', 'the-silken-court'] })
    );

    const progress = await strategy.buildProgress(raid, guild);

    expect(progress).not.toBeNull();
    expect(progress!.guild.slug).toBe('test-guild');
    expect(progress!.raidEncounters).toHaveLength(3);
    expect(progress!.overallSummary.summary).toBe('2/3 N');
  });

  it('marks defeated encounters and leaves the rest undefeated', async () => {
    const strategy = new GuildStrategy(
      buildBuilder({ normalDefeated: ['sikran'] })
    );

    const progress = await strategy.buildProgress(raid, guild);

    const sikran = progress!.raidEncounters.find((e) => e.slug === 'sikran');
    const ansurek = progress!.raidEncounters.find(
      (e) => e.slug === 'queen-ansurek'
    );

    expect(sikran!.maxDifficultyDefeated).toBe('normal');
    expect(ansurek!.maxDifficultyDefeated).toBeNull();
  });
});

// ─── GuildStrategy.buildSummary ─────────────────────────────

describe('GuildStrategy.buildSummary', () => {
  it('returns empty stats and no events for a guild with no kills', async () => {
    const strategy = new GuildStrategy(buildBuilder());

    const result = await strategy.buildSummary(raid, guild);

    expect(result.stats).toBeNull();
    expect(result.events).toEqual([]);
  });

  it('returns per-difficulty statistics for a ranked guild', async () => {
    const strategy = new GuildStrategy(
      buildBuilder({
        normalDefeated: ['sikran', 'the-silken-court'],
        heroicDefeated: ['sikran']
      })
    );

    const result = await strategy.buildSummary(raid, guild);

    expect(result.stats).not.toBeNull();
    expect(result.stats!.guild.slug).toBe('test-guild');
    expect(result.stats!.totalBosses).toBe(3);
    expect(result.stats!.summaries).toHaveLength(3); // normal, heroic, mythic
    expect(result.stats!.overallSummary.summary).toBe('1/3 H');
  });

  it('returns the same events buildProgress would produce', async () => {
    const builder = buildBuilder({ normalDefeated: ['sikran'] });
    const strategy = new GuildStrategy(builder);

    const { events } = await strategy.buildSummary(raid, guild);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      guildName: 'Test Guild',
      raidName: "Nerub'ar Palace",
      bossName: 'Sikran',
      type: 'KILL'
    });
  });
});
