import { WCLExpansionZone, WCLZoneEncounter } from '@/lib/types';

export function createWCLEncounter(
  overrides: Partial<WCLZoneEncounter> = {}
): WCLZoneEncounter {
  return {
    id: 2902,
    name: 'Sikran, Captain of the Sureki',
    ...overrides
  };
}

export function createWCLZone(
  overrides: Partial<WCLExpansionZone> = {}
): WCLExpansionZone {
  return {
    id: 38,
    name: "Nerub'ar Palace",
    frozen: false,
    encounters: [
      createWCLEncounter({ id: 2902, name: 'Ulgrax the Devourer' }),
      createWCLEncounter({ id: 2917, name: 'The Bloodbound Horror' }),
      createWCLEncounter({
        id: 2898,
        name: 'Sikran, Captain of the Sureki'
      }),
      createWCLEncounter({ id: 2918, name: "Rasha'nan" }),
      createWCLEncounter({ id: 2919, name: "Broodtwister Ovi'nax" }),
      createWCLEncounter({ id: 2920, name: "Nexus-Princess Ky'veza" }),
      createWCLEncounter({ id: 2921, name: 'The Silken Court' }),
      createWCLEncounter({ id: 2922, name: 'Queen Ansurek' })
    ],
    ...overrides
  };
}
