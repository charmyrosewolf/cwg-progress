import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseGuildsCsv,
  getGuilds,
  getCWGGuild,
  isCWG,
  clearGuildCache
} from '../guild-data.service';

// Helper: mock a successful Sheets fetch with given CSV
function mockSheetsFetch(csv: string) {
  process.env.GOOGLE_SHEETS_GUILDS_CSV_URL = 'https://sheets.example.com/csv';
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(csv, { status: 200 })
  );
}

const VALID_CSV = [
  'rId,name,slug,realm,region,faction,displayName,profileUrl,optOut',
  '100,Test Guild,test-guild,skywall,us,alliance,,,FALSE',
  '0,CWG,CWG,Eldrethalas,us,alliance,CWG Community,,FALSE'
].join('\n');

// ─── parseGuildsCsv ─────────────────────────────────────────

describe('parseGuildsCsv', () => {
  it('parses a valid CSV with all columns', () => {
    const csv = [
      'rId,name,slug,realm,region,faction,displayName,profileUrl,optOut',
      '1436410,Born Again,born-again,skywall,us,alliance,,,FALSE',
      '0,CWG,CWG,Eldrethalas,us,alliance,CWG Community,https://warcraftlogs.com/guild/id/697334/,FALSE'
    ].join('\n');

    const result = parseGuildsCsv(csv);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      rId: 1436410,
      name: 'Born Again',
      slug: 'born-again',
      realm: 'skywall',
      region: 'us',
      faction: 'alliance'
    });
    expect(result[1]).toMatchObject({
      rId: 0,
      name: 'CWG',
      slug: 'CWG',
      displayName: 'CWG Community'
    });
  });

  it('sets optOut flag on opted-out guilds', () => {
    const csv = [
      'rId,name,slug,realm,region,faction,displayName,profileUrl,optOut',
      '100,Active Guild,active-guild,skywall,us,alliance,,,FALSE',
      '200,Opted Out,opted-out,skywall,us,horde,,,TRUE',
      '300,Also Active,also-active,skywall,us,alliance,,,FALSE'
    ].join('\n');

    const result = parseGuildsCsv(csv);

    expect(result).toHaveLength(3);
    expect(result[1].optOut).toBe(true);
    expect(result[0].optOut).toBeUndefined();
    expect(result[2].optOut).toBeUndefined();
  });

  it('handles optOut values: true, 1, yes (case-insensitive)', () => {
    const csv = [
      'rId,name,slug,realm,region,faction,optOut',
      '1,A,a,r,us,alliance,TRUE',
      '2,B,b,r,us,alliance,true',
      '3,C,c,r,us,alliance,1',
      '4,D,d,r,us,alliance,yes',
      '5,E,e,r,us,alliance,Yes',
      '6,F,f,r,us,alliance,FALSE',
      '7,G,g,r,us,alliance,'
    ].join('\n');

    const result = parseGuildsCsv(csv);

    expect(result[0].optOut).toBe(true); // TRUE
    expect(result[1].optOut).toBe(true); // true
    expect(result[2].optOut).toBe(true); // 1
    expect(result[3].optOut).toBe(true); // yes
    expect(result[4].optOut).toBe(true); // Yes
    expect(result[5].optOut).toBeUndefined(); // FALSE
    expect(result[6].optOut).toBeUndefined(); // empty
  });

  it('returns empty array for CSV with no data rows', () => {
    const csv = 'rId,name,slug,realm,region,faction';
    const result = parseGuildsCsv(csv);
    expect(result).toEqual([]);
  });

  it('returns empty array for empty CSV', () => {
    const result = parseGuildsCsv('');
    expect(result).toEqual([]);
  });

  it('skips rows with invalid rId', () => {
    const csv = [
      'rId,name,slug,realm,region,faction',
      'abc,Bad Guild,bad,skywall,us,alliance',
      '100,Good Guild,good,skywall,us,alliance'
    ].join('\n');

    const result = parseGuildsCsv(csv);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Good Guild');
  });

  it('skips rows with missing name or slug', () => {
    const csv = [
      'rId,name,slug,realm,region,faction',
      '100,,missing-name,skywall,us,alliance',
      '200,Missing Slug,,skywall,us,alliance',
      '300,Valid,valid,skywall,us,alliance'
    ].join('\n');

    const result = parseGuildsCsv(csv);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Valid');
  });

  it('returns empty array when required columns are missing', () => {
    const csv = [
      'id,guild_name,server',
      '100,Test,skywall'
    ].join('\n');

    const result = parseGuildsCsv(csv);
    expect(result).toEqual([]);
  });

  it('handles columns in different order', () => {
    const csv = [
      'faction,name,region,rId,realm,slug',
      'horde,Test Guild,us,12345,Illidan,test-guild'
    ].join('\n');

    const result = parseGuildsCsv(csv);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      rId: 12345,
      name: 'Test Guild',
      slug: 'test-guild',
      realm: 'Illidan',
      region: 'us',
      faction: 'horde'
    });
  });

  it('skips empty lines', () => {
    const csv = [
      'rId,name,slug,realm,region,faction',
      '100,Guild A,guild-a,skywall,us,alliance',
      '',
      '200,Guild B,guild-b,skywall,us,horde',
      ''
    ].join('\n');

    const result = parseGuildsCsv(csv);
    expect(result).toHaveLength(2);
  });
});

// ─── getGuilds ──────────────────────────────────────────────

describe('getGuilds', () => {
  beforeEach(() => {
    clearGuildCache();
    vi.restoreAllMocks();
  });

  it('throws when env var is not set', async () => {
    delete process.env.GOOGLE_SHEETS_GUILDS_CSV_URL;

    await expect(getGuilds()).rejects.toThrow('GOOGLE_SHEETS_GUILDS_CSV_URL');
  });

  it('fetches and parses guilds from Sheets CSV', async () => {
    mockSheetsFetch(VALID_CSV);

    const guilds = await getGuilds();

    expect(guilds).toHaveLength(2);
    expect(guilds[0].name).toBe('Test Guild');
    expect(guilds[1].name).toBe('CWG');
  });

  it('filters out opted-out guilds', async () => {
    const csv = [
      'rId,name,slug,realm,region,faction,optOut',
      '100,Active,active,skywall,us,alliance,FALSE',
      '200,Opted Out,opted-out,skywall,us,horde,TRUE',
      '300,Also Active,also-active,skywall,us,alliance,FALSE'
    ].join('\n');

    mockSheetsFetch(csv);

    const guilds = await getGuilds();

    expect(guilds).toHaveLength(2);
    expect(guilds.find((g) => g.name === 'Opted Out')).toBeUndefined();
  });

  it('returns cached data on subsequent calls', async () => {
    mockSheetsFetch(VALID_CSV);

    const first = await getGuilds();
    const second = await getGuilds();

    expect(first).toBe(second); // same reference
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('throws when fetch fails', async () => {
    process.env.GOOGLE_SHEETS_GUILDS_CSV_URL = 'https://sheets.example.com/csv';
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    await expect(getGuilds()).rejects.toThrow();
  });

  it('throws when response is not ok', async () => {
    process.env.GOOGLE_SHEETS_GUILDS_CSV_URL = 'https://sheets.example.com/csv';
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Not Found', { status: 404 })
    );

    await expect(getGuilds()).rejects.toThrow('No guild data available');
  });

  it('throws when CSV parses to 0 guilds', async () => {
    process.env.GOOGLE_SHEETS_GUILDS_CSV_URL = 'https://sheets.example.com/csv';
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('rId,name,slug,realm,region,faction', { status: 200 })
    );

    await expect(getGuilds()).rejects.toThrow('No guild data available');
  });
});

// ─── getCWGGuild ────────────────────────────────────────────

describe('getCWGGuild', () => {
  beforeEach(() => {
    clearGuildCache();
    vi.restoreAllMocks();
  });

  it('returns CWG from fetched guild list', async () => {
    mockSheetsFetch(VALID_CSV);

    const cwg = await getCWGGuild();

    expect(cwg.slug).toBe('CWG');
    expect(cwg.displayName).toBe('CWG Community');
  });

  it('throws when CWG is not in guild list', async () => {
    const csv = [
      'rId,name,slug,realm,region,faction',
      '100,No CWG Here,no-cwg,skywall,us,alliance'
    ].join('\n');

    mockSheetsFetch(csv);

    await expect(getCWGGuild()).rejects.toThrow('CWG guild not found');
  });
});

// ─── isCWG ──────────────────────────────────────────────────

describe('isCWG', () => {
  it('returns true for CWG slug', () => {
    expect(isCWG('CWG')).toBe(true);
  });

  it('returns false for other slugs', () => {
    expect(isCWG('born-again')).toBe(false);
    expect(isCWG('cwg')).toBe(false); // case-sensitive
    expect(isCWG('')).toBe(false);
  });
});
