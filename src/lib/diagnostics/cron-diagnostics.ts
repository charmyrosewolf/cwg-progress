import { sendDiscordMessage } from '@/app/_actions/discord';
import { getGuilds, getRAIDS, getSeasonEndDate, getSeasonStartDate } from '@/lib/data';

import {
  buildShrinkAlert,
  findMissingReports,
  mergeSnapshot,
  type MissingReports
} from './report-snapshot';
import { createSnapshotStore } from './snapshot-store';
import { collectDiagnostics, type GuildDiagnostic } from './wcl-diagnostics';

/**
 * store 'unconfigured' = no BLOB_READ_WRITE_TOKEN, nothing compared or saved.
 * previousTakenAt null = no earlier snapshot. alerted false with missing
 * non-empty = the webhook call failed.
 */
export type SnapshotResult = {
  store: 'blob' | 'unconfigured';
  previousTakenAt: string | null;
  missing: MissingReports[];
  alerted: boolean;
  saved: boolean;
};

export type CronDiagnosticsResult = {
  diagnostics: GuildDiagnostic[];
  snapshot: SnapshotResult;
};

export async function runCronDiagnostics(now = new Date()): Promise<CronDiagnosticsResult> {
  const [guilds, raids, seasonStart, seasonEnd] = await Promise.all([
    getGuilds(),
    getRAIDS(),
    getSeasonStartDate(),
    getSeasonEndDate()
  ]);

  const diagnostics = await collectDiagnostics(guilds, raids, seasonStart, seasonEnd);

  const store = createSnapshotStore();
  if (!store) {
    return {
      diagnostics,
      snapshot: {
        store: 'unconfigured',
        previousTakenAt: null,
        missing: [],
        alerted: false,
        saved: false
      }
    };
  }

  const previous = await store.read();
  const missing = findMissingReports(previous, diagnostics, seasonStart);

  let alerted = false;
  if (missing.length) {
    const response = await sendDiscordMessage(buildShrinkAlert(missing, now));
    alerted = response instanceof Response && response.ok;
  }

  await store.write(mergeSnapshot(previous, diagnostics, seasonStart, now));

  return {
    diagnostics,
    snapshot: {
      store: store.kind,
      previousTakenAt: previous?.takenAt ?? null,
      missing,
      alerted,
      saved: true
    }
  };
}
