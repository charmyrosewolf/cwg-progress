import { getStrategy } from '../guild-report-strategy';
import { CommunityStrategy } from '../community-strategy';
import { GuildStrategy } from '../guild-strategy';
import type { ReportBuilder } from '@/lib/reports/report-builder';
import type { GuildInfo } from '@/lib/types';

const communityGuild: GuildInfo = {
  rId: 0,
  name: 'CWG',
  slug: 'CWG',
  realm: "Eldre'Thalas",
  region: 'us',
  faction: 'alliance'
};

const regularGuild: GuildInfo = {
  rId: 123,
  name: 'Born Again',
  slug: 'born-again',
  realm: 'skywall',
  region: 'us',
  faction: 'alliance'
};

// The factory only inspects the slug — GuildStrategy stores the builder
// without touching it, so a stub is enough here.
const builderStub = {} as ReportBuilder;

describe('getStrategy', () => {
  it('returns CommunityStrategy for the CWG slug', () => {
    expect(getStrategy(communityGuild, builderStub)).toBeInstanceOf(
      CommunityStrategy
    );
  });

  it('returns GuildStrategy for a regular guild slug', () => {
    expect(getStrategy(regularGuild, builderStub)).toBeInstanceOf(
      GuildStrategy
    );
  });
});
