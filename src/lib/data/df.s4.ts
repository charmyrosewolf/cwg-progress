import { Encounter, RaidInfo } from '../types';
import {
  VAULT_OF_THE_INCARNATES,
  VAULT_OF_THE_INCARNATES_ENCOUNTERS
} from './df.s1';
import { ABERRUS_ENCOUNTERS, ABERRUS_THE_SHADOWED_CRUCIBLE } from './df.s2';
import { AMIRDRASSIL_ENCOUNTERS, AMIRDRASSIL_THE_DREAMS_HOPE } from './df.s3';

export const SEASON_START_DATE = '2024-04-23T12:00:00.000Z';
export const SEASON_END_DATE = 0; // TODO: update later

// Encounters
const AWAKENED_VAULT_OF_THE_INCARNATES_ENCOUNTERS: Encounter[] =
  VAULT_OF_THE_INCARNATES_ENCOUNTERS.map((e) => {
    return {
      id: e.id,
      name: `Awakened ${e.name}`,
      rSlug: `awakened-${e.rSlug}`
    };
  });

const AWAKENED_VAULT_OF_THE_INCARNATES: RaidInfo = {
  name: `Awakened ${VAULT_OF_THE_INCARNATES.name}`,
  slug: `awakened-${VAULT_OF_THE_INCARNATES.slug}`,
  encounters: AWAKENED_VAULT_OF_THE_INCARNATES_ENCOUNTERS
};

const AWAKENED_ABERRUS_ENCOUNTERS: Encounter[] = ABERRUS_ENCOUNTERS.map((e) => {
  return {
    id: e.id,
    name: `Awakened ${e.name}`,
    rSlug: `awakened-${e.rSlug}`
  };
});

const AWAKENED_ABERRUS_THE_SHADOWED_CRUCIBLE: RaidInfo = {
  name: `Awakened ${ABERRUS_THE_SHADOWED_CRUCIBLE.name}`,
  slug: `awakened-${ABERRUS_THE_SHADOWED_CRUCIBLE.slug}`,
  encounters: AWAKENED_ABERRUS_ENCOUNTERS
};

const AWAKENED_AMIRDRASSIL_ENCOUNTERS: Encounter[] = AMIRDRASSIL_ENCOUNTERS.map(
  (e) => {
    return {
      id: e.id,
      name: `Awakened ${e.name}`,
      rSlug: `awakened-${e.rSlug}`
    };
  }
);

const AWAKENED_AMIRDRASSIL_THE_DREAMS_HOPE: RaidInfo = {
  name: `Awakened ${AMIRDRASSIL_THE_DREAMS_HOPE.name}`,
  slug: `awakened-${AMIRDRASSIL_THE_DREAMS_HOPE.slug}`,
  encounters: AWAKENED_AMIRDRASSIL_ENCOUNTERS
};

export const RAIDS = [
  AWAKENED_VAULT_OF_THE_INCARNATES,
  AWAKENED_ABERRUS_THE_SHADOWED_CRUCIBLE,
  AWAKENED_AMIRDRASSIL_THE_DREAMS_HOPE
];

// test non awakened raids
// export const RAIDS = [
//   VAULT_OF_THE_INCARNATES,
//   ABERRUS_THE_SHADOWED_CRUCIBLE,
//   AMIRDRASSIL_THE_DREAMS_HOPE
// ];
