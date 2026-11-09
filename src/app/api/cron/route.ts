import type { NextRequest } from 'next/server';

import { runCronDiagnostics, type CronDiagnosticsResult } from '@/lib/diagnostics/cron-diagnostics';
import { sendDiscordUpdate } from '@/lib/reports/discord.service';

/**
 * 401: bad or missing bearer. 200: the progress update ran (its own status is in
 * `updates.status`, whatever Discord answered). 500: the update threw; `updates.status`
 * is null and `body` the message. `diagnostics`/`snapshot` are null only when the
 * diagnostics step threw, named in `diagnosticsError`; an empty guild list is `[]`.
 */
export type CronResponse = {
  updates: { status: number | null; body: string };
  diagnostics: CronDiagnosticsResult['diagnostics'] | null;
  diagnosticsError: string | null;
  snapshot: CronDiagnosticsResult['snapshot'] | null;
};

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function runUpdates(): Promise<CronResponse['updates']> {
  const response = await sendDiscordUpdate();
  if (response instanceof Response) {
    return { status: response.status, body: await response.text() };
  }
  // sendDiscordMessage swallows fetch errors and returns the error itself
  return { status: null, body: errorMessage(response) };
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401
    });
  }

  // TODO: ensure cache is invalidated and get latest updates?

  // if (!isDevelopment()) {
  // invalidates current cache - on development we want to be careful with this
  // revalidatePath('/'); // revalidateTag?
  // }

  let updates: CronResponse['updates'];
  let updatesFailed = false;
  try {
    updates = await runUpdates();
  } catch (err) {
    updates = { status: null, body: errorMessage(err) };
    updatesFailed = true;
  }

  let diagnostics: CronResponse['diagnostics'] = null;
  let snapshot: CronResponse['snapshot'] = null;
  let diagnosticsError: string | null = null;
  try {
    const result = await runCronDiagnostics();
    diagnostics = result.diagnostics;
    snapshot = result.snapshot;
  } catch (err) {
    diagnosticsError = errorMessage(err);
  }

  const body: CronResponse = { updates, diagnostics, diagnosticsError, snapshot };

  return Response.json(body, { status: updatesFailed ? 500 : 200 });
}
