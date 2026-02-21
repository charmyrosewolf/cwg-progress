import { RaiderIOStaticEncounter, RaiderIOStaticRaid } from '@/lib/types';

export function createRIOEncounter(
  overrides: Partial<RaiderIOStaticEncounter> = {}
): RaiderIOStaticEncounter {
  return {
    slug: 'sikran',
    name: 'Sikran',
    ...overrides
  };
}

export function createRIORaid(
  overrides: Partial<RaiderIOStaticRaid> = {}
): RaiderIOStaticRaid {
  return {
    slug: 'nerubar-palace',
    name: "Nerub'ar Palace",
    short_name: 'NP',
    encounters: [
      createRIOEncounter({
        slug: 'ulgrax-the-devourer',
        name: 'Ulgrax the Devourer'
      }),
      createRIOEncounter({
        slug: 'the-bloodbound-horror',
        name: 'The Bloodbound Horror'
      }),
      createRIOEncounter({ slug: 'sikran', name: 'Sikran' }),
      createRIOEncounter({ slug: 'rashanan', name: "Rasha'nan" }),
      createRIOEncounter({
        slug: 'ovinax',
        name: "Broodtwister Ovi'nax"
      }),
      createRIOEncounter({
        slug: 'nexus-princess-kyveza',
        name: "Nexus-Princess Ky'veza"
      }),
      createRIOEncounter({
        slug: 'the-silken-court',
        name: 'The Silken Court'
      }),
      createRIOEncounter({
        slug: 'queen-ansurek',
        name: 'Queen Ansurek'
      })
    ],
    starts: {
      us: '2024-09-10T15:00:00.000Z',
      eu: '2024-09-11T15:00:00.000Z'
    },
    ends: { us: '', eu: '' },
    ...overrides
  };
}

/**
 * Creates a second-tier raid for mid-expansion scenarios.
 */
export function createRIORaidTier2(
  overrides: Partial<RaiderIOStaticRaid> = {}
): RaiderIOStaticRaid {
  return createRIORaid({
    slug: 'blackrock-depths-redux',
    name: 'Blackrock Depths Redux',
    short_name: 'BDR',
    encounters: [
      createRIOEncounter({ slug: 'boss-a', name: 'Boss A' }),
      createRIOEncounter({ slug: 'boss-b', name: 'Boss B' })
    ],
    starts: {
      us: '2025-06-01T15:00:00.000Z',
      eu: '2025-06-02T15:00:00.000Z'
    },
    ends: { us: '', eu: '' },
    ...overrides
  });
}
