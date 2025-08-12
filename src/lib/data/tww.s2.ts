/** Liberation of Undermine **/
import { Encounter, RaidInfo } from '../types';

export const SEASON_START_DATE = '2025-03-04T15:00:00Z';
export const SEASON_END_DATE = '2025-08-04T15:00:00Z';

// TODO: move to raidinfo
const INSTANCE_ID = ''; // 2769

// ENCOUNTER_IDS
const VEXIE_ID = 3009;
const CAULDRON_OF_CARNAGE_ID = 3010;
const RIK_REVERB_ID = 3011;
const STIX_ID = 3012;
const SPROCKETMONGER_ID = 3013;
const BANDIT_ID = 3014;
const MUGZEE_ID = 3015;
const GALLYWIX_ID = 3016;

const VEXIE: Encounter = {
  id: VEXIE_ID,
  rSlug: 'vexie-and-the-geargrinders',
  name: 'Vexie and the Geargrinders'
};

const CAULDRON_OF_CARNAGE: Encounter = {
  id: CAULDRON_OF_CARNAGE_ID,
  rSlug: 'cauldron-of-carnage',
  name: 'Cauldron of Carnage'
};

const RIK_REVERB: Encounter = {
  id: RIK_REVERB_ID,
  rSlug: 'rik-reverb',
  name: 'Rik Reverb'
};

const STIX: Encounter = {
  id: STIX_ID,
  rSlug: 'stix-bunkjunker',
  name: 'Stix Bunkjunker'
};

const SPROCKETMONGER: Encounter = {
  id: SPROCKETMONGER_ID,
  rSlug: 'sprocketmonger-lockenstock',
  name: 'Sprocketmonger Lockenstock'
};

const BANDIT: Encounter = {
  id: BANDIT_ID,
  rSlug: 'onearmed-bandit',
  name: 'One-Armed Bandit'
};

const MUGZEE: Encounter = {
  id: MUGZEE_ID,
  rSlug: 'mugzee-heads-of-security',
  name: "Mug'Zee, Heads of Security"
};

const GALLYWIX: Encounter = {
  id: GALLYWIX_ID,
  rSlug: 'chrome-king-gallywix',
  name: 'Chrome King Gallywix'
};

// Encounters
export const LIBERATION_OF_UNDERMINE_ENCOUNTERS: Encounter[] = [
  VEXIE,
  CAULDRON_OF_CARNAGE,
  RIK_REVERB,
  STIX,
  SPROCKETMONGER,
  BANDIT,
  MUGZEE,
  GALLYWIX
];

export const LIBERATION_OF_UNDERMINE: RaidInfo = {
  name: 'Liberation of Undermine',
  slug: 'liberation-of-undermine',
  encounters: LIBERATION_OF_UNDERMINE_ENCOUNTERS
};

export const RAIDS = [LIBERATION_OF_UNDERMINE];
