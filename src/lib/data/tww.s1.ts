/** Nerub-ar Palace **/
import { Encounter, RaidInfo } from '../types';

export const SEASON_START_DATE = '2024-09-10T15:00:00Z';
export const SEASON_END_DATE = '2025-03-04T14:00:00Z';

// TODO: move to raidinfo
const INSTANCE_ID = '';

// ENCOUNTER_IDS
const ULGRAX_THE_DEVOURER_ID = 2902;
const THE_BLOODBOUND_HORROR_ID = 2917;
const SIKRAN_ID = 2898;
const RASHANAN_ID = 2918;
const BROODTWISTER_OVINAX_ID = 2919;
const NEXUS_PRINCESS_KYVEZA_ID = 2920;
const THE_SILKEN_COURT_ID = 2921;
const QUEEN_ANSUREK_ID = 2922;

const ULGRAX_THE_DEVOURER: Encounter = {
  id: ULGRAX_THE_DEVOURER_ID,
  rSlug: 'ulgrax-the-devourer',
  name: 'Ulgrax the Devourer'
};

const THE_BLOODBOUND_HORROR: Encounter = {
  id: THE_BLOODBOUND_HORROR_ID,
  rSlug: 'the-bloodbound-horror',
  name: 'The Bloodbound Horror'
};

const SIKRAN: Encounter = {
  id: SIKRAN_ID,
  rSlug: 'sikran',
  name: 'Sikran'
};

const RASHANAN: Encounter = {
  id: RASHANAN_ID,
  rSlug: 'rashanan',
  name: "Rasha'nan"
};

const BROODTWISTER_OVINAX: Encounter = {
  id: BROODTWISTER_OVINAX_ID,
  rSlug: 'broodtwister-ovinax',
  name: "Broodtwister Ovi'nax"
};

const NEXUS_PRINCESS_KYVEZA: Encounter = {
  id: NEXUS_PRINCESS_KYVEZA_ID,
  rSlug: 'nexus-princess-kyveza',
  name: "Nexus-Princess Ky'veza"
};

const THE_SILKEN_COURT: Encounter = {
  id: THE_SILKEN_COURT_ID,
  rSlug: 'the-silken-court',
  name: 'The Silken Court'
};

const QUEEN_ANSUREK: Encounter = {
  id: QUEEN_ANSUREK_ID,
  rSlug: 'queen-ansurek',
  name: 'Queen Ansurek'
};

// Encounters
export const NERUBAR_PALACE_ENCOUNTERS: Encounter[] = [
  ULGRAX_THE_DEVOURER,
  THE_BLOODBOUND_HORROR,
  SIKRAN,
  RASHANAN,
  BROODTWISTER_OVINAX,
  NEXUS_PRINCESS_KYVEZA,
  THE_SILKEN_COURT,
  QUEEN_ANSUREK
];

export const NERUBAR_PALACE: RaidInfo = {
  name: 'Nerub-ar Palace',
  slug: 'nerubar-palace',
  encounters: NERUBAR_PALACE_ENCOUNTERS
};

export const RAIDS = [NERUBAR_PALACE];
