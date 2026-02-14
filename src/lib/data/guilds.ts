import { GuildInfo } from '../types';

const BORN_AGAIN: GuildInfo = {
  rId: 1436410,
  name: 'Born Again',
  slug: 'born-again',
  realm: 'skywall',
  region: 'us',
  faction: 'alliance'
};

const BY_HIS_STRIPES: GuildInfo = {
  rId: 25183,
  name: 'By His Stripes',
  slug: 'by-his-stripes',
  realm: 'Thunderhorn',
  region: 'us',
  faction: 'alliance'
};

const CHILDREN_OF_GOD: GuildInfo = {
  rId: 977154,
  name: 'Children Of God',
  slug: 'children-of-god',
  realm: 'skywall',
  region: 'us',
  faction: 'horde'
};

const ETERNITY_MATTERS: GuildInfo = {
  rId: 54617,
  name: 'Eternity Matters',
  slug: 'eternity-matters',
  realm: "Eldre'Thalas",
  region: 'us',
  faction: 'alliance'
};

export const FAMS: GuildInfo = {
  rId: 1928668,
  name: 'Faith As A Mustard Seed',
  slug: 'faith-as-a-mustard-seed',
  realm: 'Illidan',
  region: 'us',
  faction: 'horde'
};

const IS_SAVED_BY_GRACE: GuildInfo = {
  rId: 2005811,
  name: 'Is Saved By Grace',
  slug: 'is-saved-by-grace',
  realm: 'Medivh',
  region: 'us',
  faction: 'alliance'
};

const IXOYE: GuildInfo = {
  rId: 58701,
  name: 'IXOYE',
  slug: 'ixoye',
  realm: 'Medivh',
  region: 'us',
  faction: 'alliance'
};

const KINGDOM_HEIRS: GuildInfo = {
  rId: 1875874,
  name: 'Kingdom Heirs',
  slug: 'kingdom-heirs',
  realm: 'Stormrage',
  region: 'us',
  faction: 'alliance'
};

const NARROW_PATH: GuildInfo = {
  rId: 25085,
  name: 'Narrow Path',
  slug: 'narrow-path',
  realm: 'Thunderhorn',
  region: 'us',
  faction: 'alliance'
};

const ORDER_OF_THE_RIGHTEOUS: GuildInfo = {
  rId: 1994719,
  name: 'Order of the Righteous',
  slug: 'order-of-the-righteous',
  realm: 'Area 52',
  region: 'us',
  faction: 'horde'
};

const RENEWED_HOPE: GuildInfo = {
  rId: 14324,
  name: 'Renewed Hope',
  slug: 'renewed-hope',
  realm: 'Alexstrasza',
  region: 'us',
  faction: 'alliance'
};

export const SALVATIONS_DAWN: GuildInfo = {
  rId: 714202,
  name: 'Salvations Dawn',
  slug: 'salvations-dawn',
  realm: 'Arathor',
  region: 'us',
  faction: 'horde'
};

export const SALT_AND_LIGHT: GuildInfo = {
  rId: 2024322,
  name: 'Salt and Light',
  slug: 'salt-and-light',
  realm: 'Arathor',
  region: 'us',
  faction: 'alliance'
};

export const THE_FISH_AND_BREAD_TRICK: GuildInfo = {
  rId: 413801,
  name: 'The Fish and Bread Trick',
  slug: 'the-fish-and-bread-trick',
  realm: 'Dalaran',
  region: 'us',
  faction: 'horde'
};

const HAWKS_NEST: GuildInfo = {
  rId: 1985559,
  name: 'Hawks Nest',
  slug: 'hawks-nest',
  realm: 'Area 52',
  region: 'us',
  faction: 'horde'
};

// FOR WARCRAFT LOGS ONLY
// not an actual guild - this is a wlogs only team for the community logs
// https://www.warcraftlogs.com/guild/id/697334/
export const CWG: GuildInfo = {
  rId: 0, // 0 since it's not on raider.io
  displayName: 'CWG Community',
  name: 'CWG',
  // todo: can this be pulled from wlogs?
  profileUrl: 'https://www.warcraftlogs.com/guild/id/697334/',
  slug: 'CWG',
  realm: "Eldre'Thalas",
  region: 'us',
  faction: 'alliance'
};

// raiding guilds
export const GUILDS = [
  CWG,
  BORN_AGAIN, // not raiding?
  BY_HIS_STRIPES,
  CHILDREN_OF_GOD, // not raiding?
  ETERNITY_MATTERS, // retired
  FAMS,
  IS_SAVED_BY_GRACE,
  IXOYE,
  KINGDOM_HEIRS, // not raiding?
  NARROW_PATH,
  ORDER_OF_THE_RIGHTEOUS, // not raiding?
  RENEWED_HOPE,
  SALVATIONS_DAWN,
  SALT_AND_LIGHT,
  THE_FISH_AND_BREAD_TRICK,
  HAWKS_NEST
];

// test
export const GUILDS2 = [NARROW_PATH];

// CLASSIC GUILD - save for future reference
// export const WORK_IN_PROGRESS: GuildInfo = {
//   name: 'Work in Progress',
//   slug: 'Work-in-progress',
//   realm: 'Pagle',
//   region: 'us',
//   faction: 'alliance'
// };

export function isCWG(guildSlug: string) {
  return CWG.slug === guildSlug;
}
