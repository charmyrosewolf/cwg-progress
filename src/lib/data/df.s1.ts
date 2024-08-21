/** Vault of the Incarnates	10.0.0  */
import { Encounter, RaidInfo } from '../types';

export const SEASON_START_DATE = '2022-12-13T15:00:00Z';
export const SEASON_END_DATE = '2023-05-09T15:00:00Z';

const INSTANCE_ID = 2522;

// ENCOUNTER_IDS
const ERANOG_ID = 2587;
const TERROS_ID = 2639;
const THE_PRIMAL_COUNCIL_ID = 2590;
const SENNARTH_THE_COLD_BREATH_ID = 2592;
const KUROG_GRIMTOTEM_ID = 2605;
const DATHEA_ASCENDED_ID = 2635;
const BROODKEEPER_DIURNA_ID = 2614;
const RASZAGETH_THE_STORM_EATER_ID = 2607;

const ERANOG: Encounter = {
  id: ERANOG_ID,
  name: 'Eranog',
  rSlug: 'eranog'
};

const TERROS: Encounter = {
  id: TERROS_ID,
  name: 'Terros',
  rSlug: 'terros'
};

const THE_PRIMAL_COUNCIL: Encounter = {
  id: THE_PRIMAL_COUNCIL_ID,
  name: 'The Primal Council',
  rSlug: 'the-primal-council'
};

const SENNARTH_THE_COLD_BREATH: Encounter = {
  id: SENNARTH_THE_COLD_BREATH_ID,
  name: 'Sennarth, The Cold Breath',
  rSlug: 'sennarth-the-cold-breath'
};

const KUROG_GRIMTOTEM: Encounter = {
  id: KUROG_GRIMTOTEM_ID,
  name: 'Kurog Grimtotem',
  rSlug: 'kurog-grimtotem'
};

const DATHEA_ASCENDED: Encounter = {
  id: DATHEA_ASCENDED_ID,
  name: 'Dathea, Ascended',
  rSlug: 'dathea-ascended'
};

const BROODKEEPER_DIURNA: Encounter = {
  id: BROODKEEPER_DIURNA_ID,
  name: 'Broodkeeper Diurna',
  rSlug: 'broodkeeper-diurna'
};

const RASZAGETH_THE_STORM_EATER: Encounter = {
  id: RASZAGETH_THE_STORM_EATER_ID,
  name: 'Raszageth the Storm-Eater',
  rSlug: 'raszageth-the-storm-eater'
};

// Encounters
export const VAULT_OF_THE_INCARNATES_ENCOUNTERS: Encounter[] = [
  ERANOG,
  TERROS,
  THE_PRIMAL_COUNCIL,
  SENNARTH_THE_COLD_BREATH,
  KUROG_GRIMTOTEM,
  DATHEA_ASCENDED,
  BROODKEEPER_DIURNA,
  RASZAGETH_THE_STORM_EATER
];

export const VAULT_OF_THE_INCARNATES: RaidInfo = {
  name: 'Vault of the Incarnates',
  slug: 'vault-of-the-incarnates',
  encounters: VAULT_OF_THE_INCARNATES_ENCOUNTERS
};

export const RAIDS = [VAULT_OF_THE_INCARNATES];
