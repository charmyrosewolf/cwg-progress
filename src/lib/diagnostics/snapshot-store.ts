// Where the previous run's snapshot lives: one private Vercel Blob. Chosen over
// a commit-back from the GH Actions job and Upstash; see the branch's plan notes.

import { get, put } from '@vercel/blob';

import { isReportSnapshot, type ReportSnapshot } from './report-snapshot';

export const SNAPSHOT_PATH = 'cron/report-snapshot.json';

export type SnapshotStore = {
  kind: 'blob';
  /** null = no snapshot yet, or one we cannot read as a snapshot. */
  read(): Promise<ReportSnapshot | null>;
  write(snapshot: ReportSnapshot): Promise<void>;
};

export function createBlobSnapshotStore(): SnapshotStore {
  return {
    kind: 'blob',
    async read() {
      const result = await get(SNAPSHOT_PATH, { access: 'private', useCache: false });
      if (!result || !result.stream) return null;

      const parsed: unknown = JSON.parse(await new Response(result.stream).text());
      return isReportSnapshot(parsed) ? parsed : null;
    },
    async write(snapshot) {
      await put(SNAPSHOT_PATH, JSON.stringify(snapshot), {
        access: 'private',
        allowOverwrite: true,
        addRandomSuffix: false,
        contentType: 'application/json'
      });
    }
  };
}

/** null when no blob token is configured, so callers skip the comparison. */
export function createSnapshotStore(
  env: Record<string, string | undefined> = process.env
): SnapshotStore | null {
  return env.BLOB_READ_WRITE_TOKEN ? createBlobSnapshotStore() : null;
}
