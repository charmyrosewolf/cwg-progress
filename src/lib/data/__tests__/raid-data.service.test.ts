import { type Mock } from 'vitest';
import { fetchSeasonData } from '../raid-data.service';
import {
  fetchRaidingStaticData,
  fetchLatestRIOExpansionId
} from '@/lib/api/raiderio.api';
import {
  fetchWCLExpansionZones,
  fetchLatestWCLExpansionId
} from '@/lib/api/wlogs.api';
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
  fetchWCLExpansionZones: vi.fn(),
  fetchLatestWCLExpansionId: vi.fn()
}));

const mockRIOStaticData = fetchRaidingStaticData as Mock;
const mockRIOExpansionId = fetchLatestRIOExpansionId as Mock;
const mockWCLZones = fetchWCLExpansionZones as Mock;
const mockWCLExpansionId = fetchLatestWCLExpansionId as Mock;

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
    mockWCLExpansionId.mockResolvedValue(5);
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
    mockWCLExpansionId.mockResolvedValue(5);
    mockRIOStaticData.mockResolvedValue([createRIORaid()]);
    mockWCLZones.mockResolvedValue([createWCLZone()]);

    const result = await fetchSeasonData();

    expect(result.seasonStartDate).toBe('2024-09-10T15:00:00.000Z');
    // Empty string ends.us is falsy, so || 0 kicks in
    expect(result.seasonEndDate).toBe(0);
  });

  it('calls APIs with the correct expansion IDs', async () => {
    mockRIOExpansionId.mockResolvedValue(10);
    mockWCLExpansionId.mockResolvedValue(5);
    mockRIOStaticData.mockResolvedValue([createRIORaid()]);
    mockWCLZones.mockResolvedValue([createWCLZone()]);

    await fetchSeasonData();

    expect(mockRIOStaticData).toHaveBeenCalledWith(10);
    expect(mockWCLZones).toHaveBeenCalledWith(5);
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
    mockWCLExpansionId.mockResolvedValue(5);
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
    mockWCLExpansionId.mockResolvedValue(5);
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
    mockWCLExpansionId.mockResolvedValue(5);
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

  it('works with RIO-only data when WCL expansion detection fails', async () => {
    mockRIOExpansionId.mockResolvedValue(10);
    mockWCLExpansionId.mockRejectedValue(new Error('WCL API down'));
    mockRIOStaticData.mockResolvedValue([createRIORaid()]);

    const result = await fetchSeasonData();

    expect(result.raids).toHaveLength(1);
    // All encounters should have id=0 (no WCL data)
    result.raids[0].encounters.forEach((enc) => {
      expect(enc.id).toBe(0);
    });
    expect(mockWCLZones).not.toHaveBeenCalled();
  });

  it('works with RIO-only data when WCL zone fetch fails', async () => {
    mockRIOExpansionId.mockResolvedValue(10);
    mockWCLExpansionId.mockResolvedValue(5);
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
    mockWCLExpansionId.mockResolvedValue(5);
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
    mockWCLExpansionId.mockResolvedValue(5);
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
    mockWCLExpansionId.mockResolvedValue(5);
  });

  it('falls back to id=0 encounters when WCL has no matching zone', async () => {
    mockRIOStaticData.mockResolvedValue([createRIORaid()]);
    mockWCLZones.mockResolvedValue([
      createWCLZone({ name: 'A Completely Different Zone' })
    ]);

    const result = await fetchSeasonData();

    result.raids[0].encounters.forEach((enc) => {
      expect(enc.id).toBe(0);
    });
  });
});

// ─── New Expansion ──────────────────────────────────────────

describe('fetchSeasonData - new expansion', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2027-01-15T12:00:00.000Z'));
  });

  it('uses the expansion IDs returned by both detection functions', async () => {
    mockRIOExpansionId.mockResolvedValue(11);
    mockWCLExpansionId.mockResolvedValue(7);
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
    mockWCLExpansionId.mockResolvedValue(5);
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
