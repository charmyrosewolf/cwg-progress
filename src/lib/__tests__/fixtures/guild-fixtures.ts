import type {
  RaiderIOGuildRaidRanking,
  RaiderIOEncounterDefeated,
  RaiderIOEncounterPulled
} from '@/lib/api';

export function createEncounterDefeated(
  overrides: Partial<RaiderIOEncounterDefeated> = {}
): RaiderIOEncounterDefeated {
  return {
    slug: 'sikran',
    lastDefeated: '2025-01-15T21:00:00.000Z',
    firstDefeated: '2025-01-15T21:00:00.000Z',
    ...overrides
  };
}

export function createEncounterPulled(
  overrides: Partial<RaiderIOEncounterPulled> = {}
): RaiderIOEncounterPulled {
  return {
    id: 2902,
    slug: 'sikran',
    numPulls: 15,
    pullStartedAt: '2025-01-20T19:30:00.000Z',
    bestPercent: 25,
    isDefeated: false,
    ...overrides
  };
}

export function createGuildRanking(
  overrides: Partial<RaiderIOGuildRaidRanking> = {}
): RaiderIOGuildRaidRanking {
  return {
    rank: 1,
    regionRank: 1,
    guild: {
      id: 100,
      name: 'Test Guild',
      faction: 'alliance',
      realm: {
        id: 1,
        connectedRealmID: 1,
        wowRealmID: 1,
        wowConnectedRealmID: 1,
        name: 'Thunderhorn',
        altName: null,
        slug: 'thunderhorn',
        altSlug: 'thunderhorn',
        locale: 'en_US',
        isConnected: false,
        realmType: 'normal'
      },
      region: {
        name: 'United States & Oceania',
        slug: 'us',
        shortName: 'US'
      },
      path: '/guilds/us/thunderhorn/Test Guild'
    },
    encountersDefeated: [],
    encountersPulled: [],
    ...overrides
  };
}
