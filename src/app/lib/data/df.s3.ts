/** Amirdrassil, The Dream's Hope **/
import { Encounter, RaidInfo } from '../types';

// ENCOUNTER_IDS
const GNARLROOT_ID = 2820;
const IGIRA_THE_CRUEL_ID = 2709;
const COUNCIL_OF_DREAMS_ID = 2728;
const NYUME_ID = 2708;
const VOLCOROSS_ID = 2737;
const LARODAR_ID = 2731;
const TINDRAL_SAGESWIFT_ID = 2786;
const SMOLDERON_ID = 2824;
const FYRAKK_ID = 2677;

const GNARLROOT: Encounter = {
  id: GNARLROOT_ID,
  name: 'Gnarlroot',
  rSlug: 'gnarlroot'
};

const IGIRA_THE_CRUEL: Encounter = {
  id: IGIRA_THE_CRUEL_ID,
  name: 'Igira the Cruel',
  rSlug: 'igira-the-cruel'
};

const COUNCIL_OF_DREAMS: Encounter = {
  id: COUNCIL_OF_DREAMS_ID,
  name: 'Council of Dreams',
  rSlug: 'council-of-dreams'
};

const NYMUE_WEAVER_OF_THE_CYCLE: Encounter = {
  id: NYUME_ID,
  name: 'Nymue, Weaver of the Cycle',
  rSlug: 'nymue-weaver-of-the-cycle'
};

const VOLCOROSS: Encounter = {
  id: VOLCOROSS_ID,
  name: 'Volcoross',
  rSlug: 'volcoross'
};

const LARODAR_KEEPER_OF_THE_FLAME: Encounter = {
  id: LARODAR_ID,
  name: 'Larodar, Keeper of the Flame',
  rSlug: 'larodar-keeper-of-the-flame'
};

const SMOLDERON: Encounter = {
  id: SMOLDERON_ID,
  name: 'Smolderon',
  rSlug: 'smolderon'
};

const TINDRAL_SAGESWIFT_SEER_OF_THE_FLAME: Encounter = {
  id: TINDRAL_SAGESWIFT_ID,
  name: 'Tindral Sageswift, Seer of the Flame',
  rSlug: 'tindral-sageswift-seer-of-the-flame'
};

const FYRAKK_THE_BLAZING: Encounter = {
  id: FYRAKK_ID,
  name: 'Fyrakk the Blazing',
  rSlug: 'fyrakk-the-blazing'
};

// Encounters
export const AMIRDRASSIL_ENCOUNTERS: Encounter[] = [
  GNARLROOT,
  IGIRA_THE_CRUEL,
  VOLCOROSS,
  LARODAR_KEEPER_OF_THE_FLAME,
  COUNCIL_OF_DREAMS,
  NYMUE_WEAVER_OF_THE_CYCLE,
  SMOLDERON,
  TINDRAL_SAGESWIFT_SEER_OF_THE_FLAME,
  FYRAKK_THE_BLAZING
];

export const AMIRDRASSIL_THE_DREAMS_HOPE: RaidInfo = {
  name: "Amirdrassil, The Dream's Hope",
  slug: 'amirdrassil-the-dreams-hope',
  encounters: AMIRDRASSIL_ENCOUNTERS
};

export const RAIDS = [AMIRDRASSIL_THE_DREAMS_HOPE];
