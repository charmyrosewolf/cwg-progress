import { type Mock } from 'vitest';
import { fetchSeasonData } from '../raid-data.service';
import {
  fetchRaidingStaticData,
  fetchLatestRIOExpansionId
} from '@/lib/api/raiderio.api';
import { fetchWCLExpansionZones } from '@/lib/api/wlogs.api';
import {
  createRIORaid,
  createRIORaidTier2,
  createRIOEncounter
} from './fixtures/rio-fixtures';
import { createWCLZone, createWCLEncounter } from './fixtures/wcl-fixtures';

// Mock API modules
vi.mock('@/lib/api/raiderio.api', () => ({
  fetchRaidingStaticData: vi.fn(),
  fetchLatestRIOExpansionId: vi.fn()
}));

vi.mock('@/lib/api/wlogs.api', () => ({
  fetchWCLExpansionZones: vi.fn()
}));

const mockRIOStaticData = fetchRaidingStaticData as Mock;
const mockRIOExpansionId = fetchLatestRIOExpansionId as Mock;
const mockWCLZones = fetchWCLExpansionZones as Mock;

// Suppress console.warn/log noise during tests
beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

// ─── Happy Path ──────────────────────────────────────────────

describe('fetchSeasonData - happy path', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
  });

  it('returns raids with cross-referenced encounter IDs when both APIs succeed', async () => {
    mockRIOExpansionId.mockResolvedValue(10);

    mockRIOStaticData.mockResolvedValue([createRIORaid()]);
    mockWCLZones.mockResolvedValue([createWCLZone()]);

    const result = await fetchSeasonData();

    expect(result.raids).toHaveLength(1);
    expect(result.raids[0].name).toBe("Nerub'ar Palace");
    expect(result.raids[0].encounters).toHaveLength(8);

    // Every encounter should have a real WCL ID (not 0)
    result.raids[0].encounters.forEach((enc) => {
      expect(enc.id).toBeGreaterThan(0);
      expect(enc.rSlug).toBeTruthy();
    });
  });

  it('sets seasonStartDate from the first raid and seasonEndDate to 0 for ongoing raids', async () => {
    mockRIOExpansionId.mockResolvedValue(10);

    mockRIOStaticData.mockResolvedValue([createRIORaid()]);
    mockWCLZones.mockResolvedValue([createWCLZone()]);

    const result = await fetchSeasonData();

    expect(result.seasonStartDate).toBe('2024-09-10T15:00:00.000Z');
    // Empty string ends.us is falsy, so || 0 kicks in
    expect(result.seasonEndDate).toBe(0);
  });

  it('calls APIs with the correct expansion IDs', async () => {
    mockRIOExpansionId.mockResolvedValue(10);

    mockRIOStaticData.mockResolvedValue([createRIORaid()]);
    mockWCLZones.mockResolvedValue([createWCLZone()]);

    await fetchSeasonData();

    expect(mockRIOStaticData).toHaveBeenCalledWith(10);
    // WCL expansion ID is derived from RIO: 10 - 4 = 6
    expect(mockWCLZones).toHaveBeenCalledWith(6);
  });
});

// ─── New Raid Tier (Mid-Expansion) ──────────────────────────

describe('fetchSeasonData - new raid tier', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-07-15T12:00:00.000Z'));
  });

  it('includes both raids when both are currently active', async () => {
    const raid1 = createRIORaid(); // starts 2024-09-10, no end
    const raid2 = createRIORaidTier2(); // starts 2025-06-01, no end

    mockRIOExpansionId.mockResolvedValue(10);

    mockRIOStaticData.mockResolvedValue([raid1, raid2]);
    mockWCLZones.mockResolvedValue([
      createWCLZone(),
      createWCLZone({
        id: 99,
        name: 'Blackrock Depths Redux',
        encounters: [
          createWCLEncounter({ id: 5001, name: 'Boss A' }),
          createWCLEncounter({ id: 5002, name: 'Boss B' })
        ]
      })
    ]);

    const result = await fetchSeasonData();

    expect(result.raids).toHaveLength(2);
    expect(result.raids[0].slug).toBe('nerubar-palace');
    expect(result.raids[1].slug).toBe('blackrock-depths-redux');
  });

  it('excludes old raid when it has ended', async () => {
    const endedRaid = createRIORaid({
      ends: {
        us: '2025-06-01T00:00:00.000Z',
        eu: '2025-06-01T00:00:00.000Z'
      }
    });
    const newRaid = createRIORaidTier2();

    mockRIOExpansionId.mockResolvedValue(10);

    mockRIOStaticData.mockResolvedValue([endedRaid, newRaid]);
    mockWCLZones.mockResolvedValue([
      createWCLZone({
        id: 99,
        name: 'Blackrock Depths Redux',
        encounters: [
          createWCLEncounter({ id: 5001, name: 'Boss A' }),
          createWCLEncounter({ id: 5002, name: 'Boss B' })
        ]
      })
    ]);

    const result = await fetchSeasonData();

    expect(result.raids).toHaveLength(1);
    expect(result.raids[0].slug).toBe('blackrock-depths-redux');
  });
});

// ─── Season Transition ──────────────────────────────────────

describe('fetchSeasonData - season transition', () => {
  it('falls back to all raids when time is before any raid has started', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-08-01T12:00:00.000Z')); // before raid starts

    mockRIOExpansionId.mockResolvedValue(10);

    mockRIOStaticData.mockResolvedValue([createRIORaid()]); // starts 2024-09-10
    mockWCLZones.mockResolvedValue([createWCLZone()]);

    const result = await fetchSeasonData();

    // No current raids → falls back to all raids
    expect(result.raids).toHaveLength(1);
    expect(result.raids[0].name).toBe("Nerub'ar Palace");
  });
});

// ─── WCL Unavailable ────────────────────────────────────────

describe('fetchSeasonData - WCL unavailable', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
  });

  it('works with RIO-only data when WCL zone fetch fails', async () => {
    mockRIOExpansionId.mockResolvedValue(10);

    mockRIOStaticData.mockResolvedValue([createRIORaid()]);
    mockWCLZones.mockRejectedValue(new Error('WCL zones unavailable'));

    const result = await fetchSeasonData();

    expect(result.raids).toHaveLength(1);
    result.raids[0].encounters.forEach((enc) => {
      expect(enc.id).toBe(0);
    });
  });

  it('works when WCL returns empty zones array', async () => {
    mockRIOExpansionId.mockResolvedValue(10);

    mockRIOStaticData.mockResolvedValue([createRIORaid()]);
    mockWCLZones.mockResolvedValue([]);

    const result = await fetchSeasonData();

    expect(result.raids).toHaveLength(1);
    result.raids[0].encounters.forEach((enc) => {
      expect(enc.id).toBe(0);
    });
  });
});

// ─── Fuzzy Encounter Matching ───────────────────────────────

describe('fetchSeasonData - encounter fuzzy matching', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
    mockRIOExpansionId.mockResolvedValue(10);

  });

  it('matches short RIO name to full WCL name (startsWith): "Sikran" -> "Sikran, Captain of the Sureki"', async () => {
    mockRIOStaticData.mockResolvedValue([
      createRIORaid({
        encounters: [createRIOEncounter({ slug: 'sikran', name: 'Sikran' })]
      })
    ]);
    mockWCLZones.mockResolvedValue([
      createWCLZone({
        encounters: [
          createWCLEncounter({
            id: 2898,
            name: 'Sikran, Captain of the Sureki'
          })
        ]
      })
    ]);

    const result = await fetchSeasonData();

    expect(result.raids[0].encounters[0].id).toBe(2898);
    expect(result.raids[0].encounters[0].name).toBe(
      'Sikran, Captain of the Sureki'
    );
    expect(result.raids[0].encounters[0].rSlug).toBe('sikran');
  });

  it('matches names with punctuation differences (apostrophes)', async () => {
    mockRIOStaticData.mockResolvedValue([
      createRIORaid({
        encounters: [
          createRIOEncounter({ slug: 'rashanan', name: "Rasha'nan" })
        ]
      })
    ]);
    mockWCLZones.mockResolvedValue([
      createWCLZone({
        encounters: [createWCLEncounter({ id: 2918, name: "Rasha'nan" })]
      })
    ]);

    const result = await fetchSeasonData();

    expect(result.raids[0].encounters[0].id).toBe(2918);
  });

  it('uses WCL name (more complete) when match is found', async () => {
    mockRIOStaticData.mockResolvedValue([
      createRIORaid({
        encounters: [
          createRIOEncounter({ slug: 'dimensius', name: 'Dimensius' })
        ]
      })
    ]);
    mockWCLZones.mockResolvedValue([
      createWCLZone({
        encounters: [
          createWCLEncounter({
            id: 3000,
            name: 'Dimensius, the All-Devouring'
          })
        ]
      })
    ]);

    const result = await fetchSeasonData();

    expect(result.raids[0].encounters[0].name).toBe(
      'Dimensius, the All-Devouring'
    );
    expect(result.raids[0].encounters[0].rSlug).toBe('dimensius');
  });

  it('falls back to id=0 and RIO name when no WCL match exists', async () => {
    mockRIOStaticData.mockResolvedValue([
      createRIORaid({
        encounters: [
          createRIOEncounter({
            slug: 'totally-new-boss',
            name: 'Totally New Boss'
          })
        ]
      })
    ]);
    mockWCLZones.mockResolvedValue([
      createWCLZone({
        encounters: [
          createWCLEncounter({ id: 9999, name: 'Completely Different Boss' })
        ]
      })
    ]);

    const result = await fetchSeasonData();

    expect(result.raids[0].encounters[0].id).toBe(0);
    expect(result.raids[0].encounters[0].name).toBe('Totally New Boss');
  });

  it('handles contains-match: "The Silken Court" vs "Silken Court"', async () => {
    mockRIOStaticData.mockResolvedValue([
      createRIORaid({
        encounters: [
          createRIOEncounter({ slug: 'court', name: 'The Silken Court' })
        ]
      })
    ]);
    mockWCLZones.mockResolvedValue([
      createWCLZone({
        encounters: [createWCLEncounter({ id: 2921, name: 'Silken Court' })]
      })
    ]);

    const result = await fetchSeasonData();

    expect(result.raids[0].encounters[0].id).toBe(2921);
  });
});

// ─── Zone Matching ──────────────────────────────────────────

describe('fetchSeasonData - zone matching', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));
    mockRIOExpansionId.mockResolvedValue(10);

  });

  it('falls back to id=0 encounters when WCL has no matching zone or encounters', async () => {
    mockRIOStaticData.mockResolvedValue([createRIORaid()]);
    mockWCLZones.mockResolvedValue([
      createWCLZone({
        name: 'A Completely Different Zone',
        encounters: [
          createWCLEncounter({ id: 9001, name: 'Some Other Boss' }),
          createWCLEncounter({ id: 9002, name: 'Yet Another Boss' })
        ]
      })
    ]);

    const result = await fetchSeasonData();

    result.raids[0].encounters.forEach((enc) => {
      expect(enc.id).toBe(0);
    });
  });

  it('still resolves encounters when the zone name differs but the bosses match', async () => {
    mockRIOStaticData.mockResolvedValue([createRIORaid()]);
    mockWCLZones.mockResolvedValue([
      createWCLZone({ name: 'A Completely Different Zone' })
    ]);

    const result = await fetchSeasonData();

    // Encounter names are the reliable signal — a renamed zone shouldn't
    // cost us every encounter ID in the raid.
    result.raids[0].encounters.forEach((enc) => {
      expect(enc.id).toBeGreaterThan(0);
    });
  });
});

// ─── New Expansion ──────────────────────────────────────────

describe('fetchSeasonData - new expansion', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2027-01-15T12:00:00.000Z'));
  });

  it('derives WCL expansion ID from RIO using offset', async () => {
    mockRIOExpansionId.mockResolvedValue(11);
    mockRIOStaticData.mockResolvedValue([
      createRIORaid({
        slug: 'new-expansion-raid',
        name: 'New Expansion Raid',
        starts: {
          us: '2027-01-01T15:00:00.000Z',
          eu: '2027-01-02T15:00:00.000Z'
        },
        encounters: [createRIOEncounter({ slug: 'new-boss', name: 'New Boss' })]
      })
    ]);
    mockWCLZones.mockResolvedValue([
      createWCLZone({
        id: 100,
        name: 'New Expansion Raid',
        encounters: [createWCLEncounter({ id: 6001, name: 'New Boss' })]
      })
    ]);

    const result = await fetchSeasonData();

    expect(mockRIOStaticData).toHaveBeenCalledWith(11);
    // WCL expansion ID derived: 11 - 4 = 7
    expect(mockWCLZones).toHaveBeenCalledWith(7);
    expect(result.raids).toHaveLength(1);
    expect(result.raids[0].encounters[0].id).toBe(6001);
  });
});

// ─── All Raids Ended (Fallback) ─────────────────────────────

describe('fetchSeasonData - no current raids fallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-01T12:00:00.000Z'));
  });

  it('falls back to the most recent raid when all raids have ended', async () => {
    const olderRaid = createRIORaid({
      slug: 'old-raid',
      name: 'Old Raid',
      starts: {
        us: '2024-01-01T00:00:00.000Z',
        eu: '2024-01-01T00:00:00.000Z'
      },
      ends: {
        us: '2025-01-01T00:00:00.000Z',
        eu: '2025-01-01T00:00:00.000Z'
      }
    });
    const newerRaid = createRIORaid({
      slug: 'newer-raid',
      name: 'Newer Raid',
      starts: {
        us: '2025-06-01T00:00:00.000Z',
        eu: '2025-06-01T00:00:00.000Z'
      },
      ends: {
        us: '2026-01-01T00:00:00.000Z',
        eu: '2026-01-01T00:00:00.000Z'
      }
    });

    mockRIOExpansionId.mockResolvedValue(10);

    mockRIOStaticData.mockResolvedValue([olderRaid, newerRaid]);
    mockWCLZones.mockResolvedValue([
      createWCLZone({ name: 'Old Raid' }),
      createWCLZone({ name: 'Newer Raid' })
    ]);

    const result = await fetchSeasonData();

    // Should only return the most recent raid, not both
    expect(result.raids).toHaveLength(1);
    expect(result.raids[0].slug).toBe('newer-raid');
  });
});

// ─── Next Raid Detection ─────────────────────────────────

describe('fetchSeasonData - next raid detection', () => {
  it('includes nextRaid when a future raid starts within 14 days in current expansion', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-05-20T12:00:00.000Z'));

    const currentRaid = createRIORaid(); // started 2024-09-10, ongoing
    const upcomingRaid = createRIORaidTier2({
      name: 'Upcoming Raid',
      short_name: 'UR',
      slug: 'upcoming-raid',
      starts: {
        us: '2025-05-28T15:00:00.000Z',
        eu: '2025-05-29T15:00:00.000Z'
      }
    });

    mockRIOExpansionId.mockResolvedValue(10);
    mockRIOStaticData
      .mockResolvedValueOnce([currentRaid, upcomingRaid]) // expansion 10
      .mockRejectedValueOnce(new Error('No expansion 11')); // expansion 11
    mockWCLZones.mockResolvedValue([createWCLZone()]);

    const result = await fetchSeasonData();

    expect(result.nextRaid).not.toBeNull();
    expect(result.nextRaid?.name).toBe('Upcoming Raid');
    expect(result.nextRaid?.shortName).toBe('UR');
    // 8 days + 3 hours → Math.ceil rounds up to 9
    expect(result.nextRaid?.daysUntilLaunch).toBe(9);
  });

  it('finds next raid from the next expansion', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-05T12:00:00.000Z'));

    // Current expansion: all raids ended
    const endedRaid = createRIORaid({
      ends: {
        us: '2026-03-02T00:00:00.000Z',
        eu: '2026-03-02T00:00:00.000Z'
      }
    });

    mockRIOExpansionId.mockResolvedValue(10);
    mockRIOStaticData
      .mockResolvedValueOnce([endedRaid]) // expansion 10
      .mockResolvedValueOnce([
        // expansion 11: next raid
        createRIORaidTier2({
          name: 'MN Tier 1',
          short_name: 'MN1',
          slug: 'mn-tier-1',
          starts: {
            us: '2026-03-17T15:00:00.000Z',
            eu: '2026-03-18T15:00:00.000Z'
          }
        })
      ]);
    mockWCLZones.mockResolvedValue([]);

    const result = await fetchSeasonData();

    expect(result.nextRaid).not.toBeNull();
    expect(result.nextRaid?.name).toBe('MN Tier 1');
    // 12 days + 3 hours → Math.ceil rounds up to 13
    expect(result.nextRaid?.daysUntilLaunch).toBe(13);
  });

  it('returns null nextRaid when no raid starts within 14 days', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));

    const currentRaid = createRIORaid(); // started 2024-09-10, ongoing
    const futureRaid = createRIORaidTier2({
      starts: {
        us: '2025-06-01T15:00:00.000Z',
        eu: '2025-06-02T15:00:00.000Z'
      }
    });

    mockRIOExpansionId.mockResolvedValue(10);
    mockRIOStaticData
      .mockResolvedValueOnce([currentRaid, futureRaid])
      .mockRejectedValueOnce(new Error('No expansion 11'));
    mockWCLZones.mockResolvedValue([createWCLZone()]);

    const result = await fetchSeasonData();

    expect(result.nextRaid).toBeNull();
  });

  it('returns null nextRaid gracefully when next expansion fetch fails', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-05T12:00:00.000Z'));

    const endedRaid = createRIORaid({
      ends: {
        us: '2026-03-02T00:00:00.000Z',
        eu: '2026-03-02T00:00:00.000Z'
      }
    });

    mockRIOExpansionId.mockResolvedValue(10);
    mockRIOStaticData
      .mockResolvedValueOnce([endedRaid]) // expansion 10
      .mockRejectedValueOnce(new Error('No expansion 11')); // expansion 11 fails
    mockWCLZones.mockResolvedValue([]);

    const result = await fetchSeasonData();

    // No future raids in current expansion, next expansion failed
    expect(result.nextRaid).toBeNull();
  });
});

// ─── Duplicate & Incomplete WCL Zones ───────────────────────

/**
 * WCL publishes a PTR/beta copy of a zone alongside the live one. Historically
 * the copy was suffixed ("(PTR)", "(Beta)") so name matching picked the live
 * zone by accident. In Midnight, zones 53 and 54 are both named
 * "The Venomous Abyss" — the frozen copy carries test encounter IDs (53470…),
 * the live one carries the IDs that appear in real logs (3470…).
 *
 * WCL also left "The Tidebound Grotto" (zone 57) with zero encounters and filed
 * its boss under the live Venomous Abyss zone instead.
 */
describe('fetchSeasonData - duplicate and incomplete WCL zones', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-26T12:00:00.000Z'));
    mockRIOExpansionId.mockResolvedValue(11);
  });

  const liveAbyssZone = () =>
    createWCLZone({
      id: 53,
      name: 'The Venomous Abyss',
      frozen: false,
      encounters: [
        createWCLEncounter({ id: 3470, name: "Nek'zali the Soulcoiler" }),
        createWCLEncounter({ id: 3429, name: 'The Coiled Altar' }),
        createWCLEncounter({ id: 3379, name: 'Nymrissa Wavecaller' })
      ]
    });

  const frozenAbyssZone = () =>
    createWCLZone({
      id: 54,
      name: 'The Venomous Abyss',
      frozen: true,
      encounters: [
        createWCLEncounter({ id: 53470, name: "Nek'zali the Soulcoiler" }),
        createWCLEncounter({ id: 53429, name: 'The Coiled Altar' })
      ]
    });

  const abyssRIORaid = () =>
    createRIORaid({
      slug: 'the-venomous-abyss',
      name: 'The Venomous Abyss',
      starts: {
        us: '2026-08-18T15:00:00.000Z',
        eu: '2026-08-19T04:00:00.000Z'
      },
      encounters: [
        createRIOEncounter({
          slug: 'nekzali-the-soulcoiler',
          name: "Nek'zali the Soulcoiler"
        }),
        createRIOEncounter({
          slug: 'the-coiled-altar',
          name: 'The Coiled Altar'
        })
      ]
    });

  const grottoRIORaid = () =>
    createRIORaid({
      slug: 'the-tidebound-grotto',
      name: 'The Tidebound Grotto',
      starts: {
        us: '2026-08-18T15:00:00.000Z',
        eu: '2026-08-19T04:00:00.000Z'
      },
      encounters: [
        createRIOEncounter({
          slug: 'nymrissa-wavecaller',
          name: 'Nymrissa Wavecaller'
        })
      ]
    });

  it('prefers the live zone over a frozen duplicate with an identical name', async () => {
    mockRIOStaticData.mockResolvedValue([abyssRIORaid()]);
    // frozen copy listed first, as WCL returns it
    mockWCLZones.mockResolvedValue([frozenAbyssZone(), liveAbyssZone()]);

    const result = await fetchSeasonData();

    expect(result.raids[0].encounters.map((e) => e.id)).toEqual([3470, 3429]);
  });

  it('falls back to another zone when the raid zone has no encounters', async () => {
    mockRIOStaticData.mockResolvedValue([grottoRIORaid()]);
    mockWCLZones.mockResolvedValue([
      createWCLZone({
        id: 57,
        name: 'The Tidebound Grotto',
        frozen: true,
        encounters: []
      }),
      liveAbyssZone()
    ]);

    const result = await fetchSeasonData();

    expect(result.raids[0].encounters[0].id).toBe(3379);
    expect(result.raids[0].encounters[0].name).toBe('Nymrissa Wavecaller');
    expect(result.raids[0].encounters[0].rSlug).toBe('nymrissa-wavecaller');
  });

  it('prefers a live zone over a frozen one when falling back across zones', async () => {
    mockRIOStaticData.mockResolvedValue([grottoRIORaid()]);
    mockWCLZones.mockResolvedValue([
      createWCLZone({
        id: 57,
        name: 'The Tidebound Grotto',
        frozen: true,
        encounters: []
      }),
      createWCLZone({
        id: 58,
        name: 'Some Test Realm Zone',
        frozen: true,
        encounters: [
          createWCLEncounter({ id: 53379, name: 'Nymrissa Wavecaller' })
        ]
      }),
      liveAbyssZone()
    ]);

    const result = await fetchSeasonData();

    expect(result.raids[0].encounters[0].id).toBe(3379);
  });

  it('does not loosely match across zones when the raid zone lacks the encounter', async () => {
    mockRIOStaticData.mockResolvedValue([
      createRIORaid({
        slug: 'the-tidebound-grotto',
        name: 'The Tidebound Grotto',
        starts: {
          us: '2026-08-18T15:00:00.000Z',
          eu: '2026-08-19T04:00:00.000Z'
        },
        encounters: [
          createRIOEncounter({
            slug: 'the-coiled-altar',
            name: 'The Coiled Altar'
          })
        ]
      })
    ]);
    mockWCLZones.mockResolvedValue([
      createWCLZone({
        id: 57,
        name: 'The Tidebound Grotto',
        frozen: true,
        encounters: []
      }),
      createWCLZone({
        id: 55,
        name: 'Mythic+ Season 2',
        frozen: false,
        encounters: [createWCLEncounter({ id: 12993, name: 'Altar' })]
      })
    ]);

    const result = await fetchSeasonData();

    expect(result.raids[0].encounters[0].id).toBe(0);
    expect(result.raids[0].encounters[0].name).toBe('The Coiled Altar');
  });
});
