import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { postQuery, isWCLAuthFailed } from '../wlogs.api';
import { clearAccessToken } from '../wlogs-auth';

const TOKEN_URL = 'https://www.warcraftlogs.com/oauth/token';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

function token(value: string) {
  return json({ token_type: 'Bearer', expires_in: 3600, access_token: value });
}

const unauthenticated = () => json({ error: 'Unauthenticated.' }, 401);

describe('postQuery auth', () => {
  beforeEach(() => {
    clearAccessToken();
    process.env.WLOGS_CLIENT_ID = 'client-id';
    process.env.WLOGS_CLIENT_SECRET = 'client-secret';
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends the fetched token as a bearer token', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(token('tok-1'))
      .mockResolvedValueOnce(json({ data: { ok: 1 } }));

    expect(await postQuery('{ q }', {}, 'err')).toEqual({ data: { ok: 1 } });

    const headers = new Headers(fetchSpy.mock.calls[1][1]?.headers);
    expect(headers.get('Authorization')).toBe('Bearer tok-1');
  });

  it('refreshes the token and retries once when WCL answers 401', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(token('stale'))
      .mockResolvedValueOnce(unauthenticated())
      .mockResolvedValueOnce(token('fresh'))
      .mockResolvedValueOnce(json({ data: { ok: 1 } }));

    expect(await postQuery('{ q }', {}, 'err')).toEqual({ data: { ok: 1 } });

    expect(fetchSpy.mock.calls[2][0]).toBe(TOKEN_URL);
    const retryHeaders = new Headers(fetchSpy.mock.calls[3][1]?.headers);
    expect(retryHeaders.get('Authorization')).toBe('Bearer fresh');
  });

  it('gives up after one retry and flags the auth failure', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(token('a'))
      .mockResolvedValueOnce(unauthenticated())
      .mockResolvedValueOnce(token('b'))
      .mockResolvedValueOnce(unauthenticated());

    expect(await postQuery('{ q }', {}, 'err')).toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(4);
    expect(isWCLAuthFailed()).toBe(true);
  });

  it('skips the query and flags the auth failure when no token is available', async () => {
    delete process.env.WLOGS_CLIENT_ID;
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    expect(await postQuery('{ q }', {}, 'err')).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(isWCLAuthFailed()).toBe(true);
  });
});
