import type { RaidInfo, Encounter } from '@/lib/types';

export function createEncounterDef(
  overrides: Partial<Encounter> = {}
): Encounter {
  return {
    id: 2902,
    name: 'Sikran',
    rSlug: 'sikran',
    ...overrides
  };
}

/**
 * Creates a 3-boss raid for testing. Encounter IDs match WCL convention.
 */
export function createRaidInfo(
  overrides: Partial<RaidInfo> = {}
): RaidInfo {
  return {
    name: "Nerub'ar Palace",
    slug: 'nerubar-palace',
    encounters: [
      createEncounterDef({ id: 2902, name: 'Sikran', rSlug: 'sikran' }),
      createEncounterDef({
        id: 2921,
        name: 'The Silken Court',
        rSlug: 'the-silken-court'
      }),
      createEncounterDef({
        id: 2922,
        name: 'Queen Ansurek',
        rSlug: 'queen-ansurek'
      })
    ],
    ...overrides
  };
}
