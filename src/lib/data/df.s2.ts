/** Aberrus, the Shadowed Crucible - 10.1.0 **/

import { Encounter, RaidInfo } from '../types';

export const SEASON_START_DATE = '2023-05-10T12:00:00.000Z';
export const SEASON_END_DATE = '2023-11-14T12:00:00.000Z';

const INSTANCE_ID = 2569;
// ENCOUNTER_IDS
const KAZZARA_THE_HELLFORGED_ID = 2688;
const THE_AMALGAMATION_CHAMBER_ID = 2687;
const THE_FORGOTTEN_EXPERIMENTS_ID = 2693;
const ASSAULT_OF_THE_ZAQALI_ID = 2682;
const RASHOK_THE_ELDER_ID = 2680;
const THE_VIGILANT_STEWARD_ZSKARN_ID = 2689;
const MAGMORAX_ID = 2683;
const ECHO_OF_NELTHARION_ID = 2684;
const SCALECOMMANDER_SARKARETH_ID = 2685;

const KAZZARA_THE_HELLFORGED: Encounter = {
  id: KAZZARA_THE_HELLFORGED_ID,
  name: 'Kazzara, the Hellforged',
  rSlug: 'kazzara-the-hellforged'
};

const THE_AMALGAMATION_CHAMBER: Encounter = {
  id: THE_AMALGAMATION_CHAMBER_ID,
  name: 'The Amalgamation Chamber',
  rSlug: 'the-amalgamation-chamber'
};

const THE_FORGOTTEN_EXPERIMENTS: Encounter = {
  id: THE_FORGOTTEN_EXPERIMENTS_ID,
  name: 'The Forgotten Experiments',
  rSlug: 'the-forgotten-experiments'
};

const ASSAULT_OF_THE_ZAQALI: Encounter = {
  id: ASSAULT_OF_THE_ZAQALI_ID,
  name: 'Assault of the Zaqali',
  rSlug: 'assault-of-the-zaqali'
};

const RASHOK_THE_ELDER: Encounter = {
  id: RASHOK_THE_ELDER_ID,
  name: 'Rashok, the Elder',
  rSlug: 'rashok-the-elder'
};

const THE_VIGILANT_STEWARD_ZSKARN: Encounter = {
  id: THE_VIGILANT_STEWARD_ZSKARN_ID,
  name: 'The Vigilant Steward, Zskarn',
  rSlug: 'the-vigilant-steward-zskarn'
};

const MAGMORAX: Encounter = {
  id: MAGMORAX_ID,
  name: 'Magmorax',
  rSlug: 'magmorax'
};

const ECHO_OF_NELTHARION: Encounter = {
  id: ECHO_OF_NELTHARION_ID,
  name: 'Echo of Neltharion',
  rSlug: 'echo-of-neltharion'
};

const SCALECOMMANDER_SARKARETH: Encounter = {
  id: SCALECOMMANDER_SARKARETH_ID,
  name: 'Scalecommander Sarkareth',
  rSlug: 'scalecommander-sarkareth'
};

// Encounters
export const ABERRUS_ENCOUNTERS: Encounter[] = [
  KAZZARA_THE_HELLFORGED,
  THE_AMALGAMATION_CHAMBER,
  THE_FORGOTTEN_EXPERIMENTS,
  ASSAULT_OF_THE_ZAQALI,
  RASHOK_THE_ELDER,
  THE_VIGILANT_STEWARD_ZSKARN,
  MAGMORAX,
  ECHO_OF_NELTHARION,
  SCALECOMMANDER_SARKARETH
];

export const ABERRUS_THE_SHADOWED_CRUCIBLE: RaidInfo = {
  name: 'Aberrus, the Shadowed Crucible',
  slug: 'aberrus-the-shadowed-crucible',
  encounters: ABERRUS_ENCOUNTERS
};

export const RAIDS = [ABERRUS_THE_SHADOWED_CRUCIBLE];
