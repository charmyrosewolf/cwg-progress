import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/reports/discord.service', () => ({ sendDiscordUpdate: vi.fn() }));
vi.mock('@/lib/diagnostics/cron-diagnostics', () => ({ runCronDiagnostics: vi.fn() }));

import { sendDiscordUpdate } from '@/lib/reports/discord.service';
import { runCronDiagnostics } from '@/lib/diagnostics/cron-diagnostics';
import { POST } from '../route';

const mockedUpdate = vi.mocked(sendDiscordUpdate);
const mockedDiagnostics = vi.mocked(runCronDiagnostics);

const SECRET = 'cron-secret-for-tests';

function request(auth?: string) {
  return new NextRequest('http://localhost:3000/cwg-progress/api/cron', {
    method: 'POST',
    headers: auth ? { authorization: auth } : {}
  });
}

const diagnosticsResult = {
  diagnostics: [],
  snapshot: {
    store: 'unconfigured' as const,
    previousTakenAt: null,
    missing: [],
    alerted: false,
    saved: false
  }
};

describe('POST /api/cron', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = SECRET;
    mockedUpdate.mockReset();
    mockedDiagnostics.mockReset();
    mockedUpdate.mockResolvedValue(new Response('No updates were found.', { status: 200 }));
    mockedDiagnostics.mockResolvedValue(diagnosticsResult);
  });

  it('rejects a missing bearer token with 401 and runs nothing', async () => {
    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(mockedUpdate).not.toHaveBeenCalled();
    expect(mockedDiagnostics).not.toHaveBeenCalled();
  });

  it('rejects the wrong bearer token with 401', async () => {
    const response = await POST(request('Bearer wrong'));

    expect(response.status).toBe(401);
  });

  it('returns the update status and diagnostics as JSON', async () => {
    const response = await POST(request(`Bearer ${SECRET}`));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    await expect(response.json()).resolves.toEqual({
      updates: { status: 200, body: 'No updates were found.' },
      diagnostics: [],
      diagnosticsError: null,
      snapshot: diagnosticsResult.snapshot
    });
  });

  it('keeps the update result when diagnostics throw', async () => {
    mockedDiagnostics.mockRejectedValue(new Error('WCL exploded'));

    const response = await POST(request(`Bearer ${SECRET}`));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      updates: { status: 200, body: 'No updates were found.' },
      diagnostics: null,
      diagnosticsError: 'WCL exploded',
      snapshot: null
    });
  });

  it('answers 500 with diagnostics attached when the update itself throws', async () => {
    mockedUpdate.mockRejectedValue(new Error('report build failed'));

    const response = await POST(request(`Bearer ${SECRET}`));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      updates: { status: null, body: 'report build failed' },
      diagnostics: []
    });
  });
});
