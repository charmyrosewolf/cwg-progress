import { ReportBuilder } from '../report-builder';
import {
  createGuildRanking,
  createEncounterDefeated,
  createEncounterPulled
} from '@/lib/__tests__/fixtures/guild-fixtures';
import { createRaidInfo, createEncounterDef } from '@/lib/__tests__/fixtures/raid-fixtures';
import { createFight } from '@/lib/__tests__/fixtures/fight-fixtures';
import type { RaidInfo, WlogFlattenedFight, FightMap } from '@/lib/types';

// ─── Test setup ─────────────────────────────────────────────

const GUILD_ID = 100;
const GUILD_ID_2 = 200;

const raid: RaidInfo = createRaidInfo();

function createPopulatedBuilder(
  opts: {
    normalRankings?: ReturnType<typeof createGuildRanking>[];
    heroicRankings?: ReturnType<typeof createGuildRanking>[];
    mythicRankings?: ReturnType<typeof createGuildRanking>[];
  } = {}
) {
  const builder = new ReportBuilder(raid);
  builder.populateEncountersByDifficulty(
    opts.normalRankings ?? [],
    opts.heroicRankings ?? [],
    opts.mythicRankings ?? []
  );
  return builder;
}

// ─── populateEncountersByDifficulty + getEncounterInfoByGuild ──

describe('ReportBuilder - populateEncountersByDifficulty', () => {
  it('stores encounters from 3 difficulty rankings', () => {
    const normalRanking = createGuildRanking({
      guild: { ...createGuildRanking().guild, id: GUILD_ID },
      encountersDefeated: [
        createEncounterDefeated({ slug: 'sikran' })
      ]
    });

    const heroicRanking = createGuildRanking({
      guild: { ...createGuildRanking().guild, id: GUILD_ID },
      encountersPulled: [
        createEncounterPulled({ slug: 'sikran', bestPercent: 30 })
      ]
    });

    const builder = createPopulatedBuilder({
      normalRankings: [normalRanking],
      heroicRankings: [heroicRanking]
    });

    const info = builder.getEncounterInfoByGuild(GUILD_ID);
    expect(info).not.toBeNull();
    expect(info!.normal).toHaveLength(3); // flattened to match raid encounters
    expect(info!.heroic).toHaveLength(3);
    // mythic was not provided → stays as default empty array
    expect(info!.mythic).toHaveLength(0);
  });

  it('returns null for unknown guild rId', () => {
    const builder = createPopulatedBuilder();
    expect(builder.getEncounterInfoByGuild(999)).toBeNull();
  });

  it('stores multiple guilds independently', () => {
    const guild1 = createGuildRanking({
      guild: { ...createGuildRanking().guild, id: GUILD_ID },
      encountersDefeated: [createEncounterDefeated({ slug: 'sikran' })]
    });

    const guild2 = createGuildRanking({
      guild: { ...createGuildRanking().guild, id: GUILD_ID_2 },
      encountersDefeated: [
        createEncounterDefeated({ slug: 'queen-ansurek' })
      ]
    });

    const builder = createPopulatedBuilder({
      normalRankings: [guild1, guild2]
    });

    const info1 = builder.getEncounterInfoByGuild(GUILD_ID);
    const info2 = builder.getEncounterInfoByGuild(GUILD_ID_2);

    expect(info1).not.toBeNull();
    expect(info2).not.toBeNull();

    // Guild 1 killed Sikran (index 0)
    expect('firstDefeated' in info1!.normal[0]).toBe(true);

    // Guild 2 killed Queen Ansurek (index 2)
    expect('firstDefeated' in info2!.normal[2]).toBe(true);
  });

  it('maps encounters to match raid encounter ordering', () => {
    const ranking = createGuildRanking({
      guild: { ...createGuildRanking().guild, id: GUILD_ID },
      encountersDefeated: [
        createEncounterDefeated({ slug: 'queen-ansurek' }) // 3rd encounter in raid
      ],
      encountersPulled: [
        createEncounterPulled({ slug: 'sikran' }) // 1st encounter in raid
      ]
    });

    const builder = createPopulatedBuilder({
      normalRankings: [ranking]
    });

    const info = builder.getEncounterInfoByGuild(GUILD_ID);
    const encounters = info!.normal;

    // Index 0 = sikran (pulled)
    expect('bestPercent' in encounters[0]).toBe(true);
    // Index 1 = the-silken-court (no data → NoEncounter with numPulls: 0)
    expect((encounters[1] as { numPulls: number }).numPulls).toBe(0);
    // Index 2 = queen-ansurek (defeated)
    expect('firstDefeated' in encounters[2]).toBe(true);
  });
});

// ─── setBestPullsByGuild / build() ──────────────────────────

describe('ReportBuilder - build()', () => {
  it('populates bestPulls with GuildRaidEncounter[] matching raid encounters', () => {
    const ranking = createGuildRanking({
      guild: { ...createGuildRanking().guild, id: GUILD_ID },
      encountersDefeated: [createEncounterDefeated({ slug: 'sikran' })]
    });

    const builder = createPopulatedBuilder({ normalRankings: [ranking] });
    builder.build();

    const info = builder.getEncounterInfoByGuild(GUILD_ID);
    expect(info!.bestPulls).toHaveLength(3);
    expect(info!.bestPulls.map((p) => p.slug)).toEqual([
      'sikran',
      'the-silken-court',
      'queen-ansurek'
    ]);
  });

  it('correctly identifies maxDifficultyDefeated (mythic > heroic > normal)', () => {
    const normalRanking = createGuildRanking({
      guild: { ...createGuildRanking().guild, id: GUILD_ID },
      encountersDefeated: [createEncounterDefeated({ slug: 'sikran' })]
    });

    const heroicRanking = createGuildRanking({
      guild: { ...createGuildRanking().guild, id: GUILD_ID },
      encountersDefeated: [createEncounterDefeated({ slug: 'sikran' })]
    });

    const mythicRanking = createGuildRanking({
      guild: { ...createGuildRanking().guild, id: GUILD_ID },
      encountersDefeated: [createEncounterDefeated({ slug: 'sikran' })]
    });

    const builder = createPopulatedBuilder({
      normalRankings: [normalRanking],
      heroicRankings: [heroicRanking],
      mythicRankings: [mythicRanking]
    });
    builder.build();

    const sikran = builder.getEncounterInfoByGuild(GUILD_ID)!.bestPulls[0];
    expect(sikran.maxDifficultyDefeated).toBe('mythic');
  });

  it('correctly identifies maxDifficultyAttempted from bestPercent pulls', () => {
    const normalRanking = createGuildRanking({
      guild: { ...createGuildRanking().guild, id: GUILD_ID },
      encountersDefeated: [createEncounterDefeated({ slug: 'sikran' })]
    });

    const heroicRanking = createGuildRanking({
      guild: { ...createGuildRanking().guild, id: GUILD_ID },
      encountersPulled: [
        createEncounterPulled({ slug: 'sikran', bestPercent: 20, isDefeated: false })
      ]
    });

    const builder = createPopulatedBuilder({
      normalRankings: [normalRanking],
      heroicRankings: [heroicRanking]
    });
    builder.build();

    const sikran = builder.getEncounterInfoByGuild(GUILD_ID)!.bestPulls[0];
    expect(sikran.maxDifficultyAttempted).toBe('heroic');
    expect(sikran.lowestBossPercentage).toBe(20);
  });

  it('defeatedAt comes from RaiderIOEncounterDefeated.firstDefeated', () => {
    const ranking = createGuildRanking({
      guild: { ...createGuildRanking().guild, id: GUILD_ID },
      encountersDefeated: [
        createEncounterDefeated({
          slug: 'sikran',
          firstDefeated: '2025-02-01T15:00:00.000Z'
        })
      ]
    });

    const builder = createPopulatedBuilder({ normalRankings: [ranking] });
    builder.build();

    const sikran = builder.getEncounterInfoByGuild(GUILD_ID)!.bestPulls[0];
    expect(sikran.defeatedAt).toBe('2025-02-01T15:00:00.000Z');
  });

  it('attemptedAt comes from RaiderIOEncounterPulled.pullStartedAt', () => {
    const ranking = createGuildRanking({
      guild: { ...createGuildRanking().guild, id: GUILD_ID },
      encountersPulled: [
        createEncounterPulled({
          slug: 'sikran',
          pullStartedAt: '2025-02-10T19:30:00.000Z',
          bestPercent: 15,
          isDefeated: false
        })
      ]
    });

    const builder = createPopulatedBuilder({ heroicRankings: [ranking] });
    builder.build();

    const sikran = builder.getEncounterInfoByGuild(GUILD_ID)!.bestPulls[0];
    expect(sikran.attemptedAt).toBe('2025-02-10T19:30:00.000Z');
  });

  it('correlates WCL kill URL by matching isSameDay + difficulty + kill', () => {
    const killDate = '2025-01-15T21:00:00.000Z';

    const normalRanking = createGuildRanking({
      guild: { ...createGuildRanking().guild, id: GUILD_ID },
      encountersDefeated: [
        createEncounterDefeated({
          slug: 'sikran',
          firstDefeated: killDate
        })
      ]
    });

    const builder = createPopulatedBuilder({ normalRankings: [normalRanking] });

    // Add WCL fights with a matching kill on the same day
    const wlogFights: FightMap = new Map();
    wlogFights.set(2902, [
      createFight({
        encounterID: 2902,
        kill: true,
        difficulty: 3, // normal
        endTime: new Date(killDate),
        url: 'https://www.warcraftlogs.com/reports/xyz#fight=10'
      })
    ]);
    builder.setWlogFightsByGuild(GUILD_ID, wlogFights);

    builder.build();

    const sikran = builder.getEncounterInfoByGuild(GUILD_ID)!.bestPulls[0];
    expect(sikran.wlogKillUrl).toBe(
      'https://www.warcraftlogs.com/reports/xyz#fight=10'
    );
  });

  it('correlates WCL best pull URL by matching bossPercentage + difficulty + !kill', () => {
    const heroicRanking = createGuildRanking({
      guild: { ...createGuildRanking().guild, id: GUILD_ID },
      encountersPulled: [
        createEncounterPulled({
          slug: 'sikran',
          bestPercent: 18,
          isDefeated: false
        })
      ]
    });

    const builder = createPopulatedBuilder({ heroicRankings: [heroicRanking] });

    const wlogFights: FightMap = new Map();
    wlogFights.set(2902, [
      createFight({
        encounterID: 2902,
        kill: false,
        difficulty: 4, // heroic
        bossPercentage: 18,
        url: 'https://www.warcraftlogs.com/reports/xyz#fight=7'
      })
    ]);
    builder.setWlogFightsByGuild(GUILD_ID, wlogFights);

    builder.build();

    const sikran = builder.getEncounterInfoByGuild(GUILD_ID)!.bestPulls[0];
    expect(sikran.wlogBestPullUrl).toBe(
      'https://www.warcraftlogs.com/reports/xyz#fight=7'
    );
  });

  it('leaves wlog URLs undefined when wlogFightMap is empty', () => {
    const ranking = createGuildRanking({
      guild: { ...createGuildRanking().guild, id: GUILD_ID },
      encountersDefeated: [createEncounterDefeated({ slug: 'sikran' })]
    });

    const builder = createPopulatedBuilder({ normalRankings: [ranking] });
    // Don't set any WCL fights
    builder.build();

    const sikran = builder.getEncounterInfoByGuild(GUILD_ID)!.bestPulls[0];
    expect(sikran.wlogKillUrl).toBeUndefined();
    expect(sikran.wlogBestPullUrl).toBeUndefined();
  });
});

// ─── toStringCurrentProgressionBossByRId ────────────────────

describe('ReportBuilder - toStringCurrentProgressionBossByRId', () => {
  it('returns progression string for first unkilled boss', () => {
    const heroicRanking = createGuildRanking({
      guild: { ...createGuildRanking().guild, id: GUILD_ID },
      encountersPulled: [
        createEncounterPulled({
          slug: 'sikran',
          bestPercent: 15,
          isDefeated: false
        })
      ]
    });

    const builder = createPopulatedBuilder({ heroicRankings: [heroicRanking] });

    const result = builder.toStringCurrentProgressionBossByRId(GUILD_ID);
    expect(result).toBe('H Sikran=15%');
  });

  it('returns null when no undefeated pulls exist', () => {
    const normalRanking = createGuildRanking({
      guild: { ...createGuildRanking().guild, id: GUILD_ID },
      encountersDefeated: [
        createEncounterDefeated({ slug: 'sikran' }),
        createEncounterDefeated({ slug: 'the-silken-court' }),
        createEncounterDefeated({ slug: 'queen-ansurek' })
      ]
    });

    const builder = createPopulatedBuilder({ normalRankings: [normalRanking] });

    const result = builder.toStringCurrentProgressionBossByRId(GUILD_ID);
    expect(result).toBeNull();
  });

  it('strips "The" prefix from boss name', () => {
    const heroicRanking = createGuildRanking({
      guild: { ...createGuildRanking().guild, id: GUILD_ID },
      encountersPulled: [
        createEncounterPulled({
          slug: 'the-silken-court',
          bestPercent: 42,
          isDefeated: false
        })
      ]
    });

    const builder = createPopulatedBuilder({ heroicRankings: [heroicRanking] });

    const result = builder.toStringCurrentProgressionBossByRId(GUILD_ID);
    // "The Silken Court" → strip "The" → "Silken"
    expect(result).toBe('H Silken=42%');
  });

  it('strips commas from boss name before splitting', () => {
    const customRaid = createRaidInfo({
      encounters: [
        createEncounterDef({
          id: 2898,
          name: 'Sikran, Captain of the Sureki',
          rSlug: 'sikran-captain'
        })
      ]
    });

    const builder = new ReportBuilder(customRaid);
    const heroicRanking = createGuildRanking({
      guild: { ...createGuildRanking().guild, id: GUILD_ID },
      encountersPulled: [
        createEncounterPulled({
          slug: 'sikran-captain',
          bestPercent: 8,
          isDefeated: false
        })
      ]
    });
    builder.populateEncountersByDifficulty([], [heroicRanking], []);

    const result = builder.toStringCurrentProgressionBossByRId(GUILD_ID);
    // "Sikran, Captain of the Sureki" → remove comma → "Sikran Captain of the Sureki" → first word → "Sikran"
    expect(result).toBe('H Sikran=8%');
  });

  it('picks first undefeated encounter across N, H, M order', () => {
    // Normal has a pulled boss, heroic also has a pulled boss
    // Since encounters array is [...normal, ...heroic, ...mythic], normal comes first
    const normalRanking = createGuildRanking({
      guild: { ...createGuildRanking().guild, id: GUILD_ID },
      encountersPulled: [
        createEncounterPulled({
          slug: 'queen-ansurek',
          bestPercent: 60,
          isDefeated: false
        })
      ]
    });

    const heroicRanking = createGuildRanking({
      guild: { ...createGuildRanking().guild, id: GUILD_ID },
      encountersPulled: [
        createEncounterPulled({
          slug: 'sikran',
          bestPercent: 10,
          isDefeated: false
        })
      ]
    });

    const builder = createPopulatedBuilder({
      normalRankings: [normalRanking],
      heroicRankings: [heroicRanking]
    });

    const result = builder.toStringCurrentProgressionBossByRId(GUILD_ID);
    // Normal encounters come first → Queen Ansurek at 60%
    expect(result).toBe('N Queen=60%');
  });
});

// ─── WCL Unavailable Failsafe ───────────────────────────────

describe('ReportBuilder - WCL unavailable failsafe', () => {
  it('produces correct bestPulls from RIO-only data (no WCL set)', () => {
    const normalRanking = createGuildRanking({
      guild: { ...createGuildRanking().guild, id: GUILD_ID },
      encountersDefeated: [
        createEncounterDefeated({
          slug: 'sikran',
          firstDefeated: '2025-01-15T21:00:00.000Z'
        }),
        createEncounterDefeated({
          slug: 'the-silken-court',
          firstDefeated: '2025-01-18T20:00:00.000Z'
        })
      ],
      encountersPulled: [
        createEncounterPulled({
          slug: 'queen-ansurek',
          bestPercent: 35,
          pullStartedAt: '2025-01-20T19:30:00.000Z',
          isDefeated: false
        })
      ]
    });

    const builder = createPopulatedBuilder({ normalRankings: [normalRanking] });
    // Intentionally NOT calling setWlogFightsByGuild — simulating WCL unavailable
    builder.build();

    const info = builder.getEncounterInfoByGuild(GUILD_ID)!;
    expect(info.bestPulls).toHaveLength(3);

    // Killed bosses still have correct data
    const sikran = info.bestPulls[0];
    expect(sikran.maxDifficultyDefeated).toBe('normal');
    expect(sikran.defeatedAt).toBe('2025-01-15T21:00:00.000Z');
    expect(sikran.wlogKillUrl).toBeUndefined();

    const silken = info.bestPulls[1];
    expect(silken.maxDifficultyDefeated).toBe('normal');
    expect(silken.defeatedAt).toBe('2025-01-18T20:00:00.000Z');

    // Attempted boss still has progress data
    const ansurek = info.bestPulls[2];
    expect(ansurek.maxDifficultyDefeated).toBeNull();
    expect(ansurek.maxDifficultyAttempted).toBe('normal');
    expect(ansurek.lowestBossPercentage).toBe(35);
    expect(ansurek.attemptedAt).toBe('2025-01-20T19:30:00.000Z');
    expect(ansurek.wlogBestPullUrl).toBeUndefined();
  });

  it('works with encounter id=0 (WCL had no matching zone data)', () => {
    // When WCL is unavailable, raid encounters get id=0 from the data layer
    const raidWithNoWCLIds = createRaidInfo({
      encounters: [
        createEncounterDef({ id: 0, name: 'Sikran', rSlug: 'sikran' }),
        createEncounterDef({ id: 0, name: 'The Silken Court', rSlug: 'the-silken-court' }),
        createEncounterDef({ id: 0, name: 'Queen Ansurek', rSlug: 'queen-ansurek' })
      ]
    });

    const builder = new ReportBuilder(raidWithNoWCLIds);
    const normalRanking = createGuildRanking({
      guild: { ...createGuildRanking().guild, id: GUILD_ID },
      encountersDefeated: [
        createEncounterDefeated({
          slug: 'sikran',
          firstDefeated: '2025-01-15T21:00:00.000Z'
        })
      ]
    });

    builder.populateEncountersByDifficulty([normalRanking], [], []);
    builder.build();

    const info = builder.getEncounterInfoByGuild(GUILD_ID)!;
    expect(info.bestPulls).toHaveLength(3);

    // RIO data is intact despite id=0
    const sikran = info.bestPulls[0];
    expect(sikran.encounterID).toBe(0);
    expect(sikran.maxDifficultyDefeated).toBe('normal');
    expect(sikran.defeatedAt).toBe('2025-01-15T21:00:00.000Z');
    expect(sikran.name).toBe('Sikran');
  });

  it('progression string still works without WCL data', () => {
    const heroicRanking = createGuildRanking({
      guild: { ...createGuildRanking().guild, id: GUILD_ID },
      encountersPulled: [
        createEncounterPulled({
          slug: 'queen-ansurek',
          bestPercent: 22,
          isDefeated: false
        })
      ]
    });

    const builder = createPopulatedBuilder({ heroicRankings: [heroicRanking] });
    // No WCL data set
    builder.build();

    const result = builder.toStringCurrentProgressionBossByRId(GUILD_ID);
    expect(result).toBe('H Queen=22%');
  });
});
