/** Manaforge Omega **/
import { Encounter, RaidInfo } from '../types';

export const SEASON_START_DATE = '2025-08-05T15:00:00Z';
export const SEASON_END_DATE = 0; // unknown, update later

// TODO: move to raidinfo
const INSTANCE_ID = 2810; // this is the map id?

// ENCOUNTER_IDS
const PLEXUS_SENTINEL_ID = 3129;
const LOOMITHAR_ID = 3131;
const SOULBINDER_NAAZINDHRI_ID = 3130;
const FORGEWEAVER_ARAZ_ID = 3132;
const THE_SOUL_HUNTERS_ID = 3122;
const FRACTILLUS_ID = 3133;
const NEXUS_KING_SALHADAAR_ID = 3134;
const DIMENSIUS_ID = 3135;

const PLEXUS_SENTINEL: Encounter = {
  id: PLEXUS_SENTINEL_ID,
  rSlug: 'plexus-sentinel',
  name: 'Plexus Sentinel'
};

const LOOMITHAR: Encounter = {
  id: LOOMITHAR_ID,
  rSlug: 'loomithar',
  name: "Loom'ithar"
};

const SOULBINDER_NAAZINDHRI: Encounter = {
  id: SOULBINDER_NAAZINDHRI_ID,
  rSlug: 'soulbinder-naazindhri',
  name: 'Soulbinder Naazindhri'
};

const FORGEWEAVER_ARAZ: Encounter = {
  id: FORGEWEAVER_ARAZ_ID,
  rSlug: 'forgeweaver-araz',
  name: 'Forgeweaver Araz'
};

// Todo: soul hunters is an optional boss. How to track?
const THE_SOUL_HUNTERS: Encounter = {
  id: THE_SOUL_HUNTERS_ID,
  rSlug: 'the-soul-hunters',
  name: 'The Soul Hunters'
};

const FRACTILLUS: Encounter = {
  id: FRACTILLUS_ID,
  rSlug: 'fractillus',
  name: 'Fractillus'
};

const NEXUS_KING_SALHADAAR: Encounter = {
  id: NEXUS_KING_SALHADAAR_ID,
  rSlug: 'nexusking-salhadaar',
  name: 'Nexus-King Salhadaar'
};

const DIMENSIUS: Encounter = {
  id: DIMENSIUS_ID,
  rSlug: 'dimensius-the-alldevouring',
  name: 'Dimensius, the All-Devouring'
};

// Encounters
export const MANAFORGE_OMEGA_ENCOUNTERS: Encounter[] = [
  PLEXUS_SENTINEL,
  LOOMITHAR,
  SOULBINDER_NAAZINDHRI,
  FORGEWEAVER_ARAZ,
  THE_SOUL_HUNTERS,
  FRACTILLUS,
  NEXUS_KING_SALHADAAR,
  DIMENSIUS
];

export const MANAFORGE_OMEGA: RaidInfo = {
  name: 'Manaforge Omega',
  slug: 'manaforge-omega',
  encounters: MANAFORGE_OMEGA_ENCOUNTERS
};

export const RAIDS = [MANAFORGE_OMEGA];
