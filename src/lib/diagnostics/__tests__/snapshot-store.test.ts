import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@vercel/blob', () => ({ get: vi.fn(), put: vi.fn() }));

import { get, put } from '@vercel/blob';

import {
  createBlobSnapshotStore,
  createSnapshotStore,
  SNAPSHOT_PATH
} from '../snapshot-store';
import type { ReportSnapshot } from '../report-snapshot';

const mockedGet = vi.mocked(get);
const mockedPut = vi.mocked(put);

const snapshot: ReportSnapshot = {
  takenAt: '2026-11-07T05:00:00.000Z',
  seasonStart: '2026-10-01T00:00:00.000Z',
  guilds: { 'test-guild': [{ code: 'aaa', start: '2026-11-01T00:00:00.000Z' }] }
};

function blobResult(body: string) {
  return {
    statusCode: 200,
    stream: new Response(body).body,
    headers: new Headers(),
    blob: { contentType: 'application/json', size: body.length }
  } as unknown as Awaited<ReturnType<typeof get>>;
}

describe('createSnapshotStore', () => {
  it('returns null when no blob token is configured', () => {
    expect(createSnapshotStore({})).toBeNull();
  });

  it('returns a blob store when the token is set', () => {
    const store = createSnapshotStore({ BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_x' });

    expect(store?.kind).toBe('blob');
  });
});

describe('blob snapshot store', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPut.mockReset();
  });

  it('reads the private snapshot blob fresh and parses it', async () => {
    mockedGet.mockResolvedValue(blobResult(JSON.stringify(snapshot)));

    const result = await createBlobSnapshotStore().read();

    expect(result).toEqual(snapshot);
    expect(mockedGet).toHaveBeenCalledWith(SNAPSHOT_PATH, {
      access: 'private',
      useCache: false
    });
  });

  it('returns null when the blob does not exist yet', async () => {
    mockedGet.mockResolvedValue(null);

    expect(await createBlobSnapshotStore().read()).toBeNull();
  });

  it('returns null when the blob holds something that is not a snapshot', async () => {
    mockedGet.mockResolvedValue(blobResult('{"nope":true}'));

    expect(await createBlobSnapshotStore().read()).toBeNull();
  });

  it('overwrites the snapshot blob as private JSON', async () => {
    mockedPut.mockResolvedValue({} as Awaited<ReturnType<typeof put>>);

    await createBlobSnapshotStore().write(snapshot);

    expect(mockedPut).toHaveBeenCalledTimes(1);
    const [path, body, options] = mockedPut.mock.calls[0];
    expect(path).toBe(SNAPSHOT_PATH);
    expect(JSON.parse(body as string)).toEqual(snapshot);
    expect(options).toMatchObject({
      access: 'private',
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: 'application/json'
    });
  });
});
