import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAccessToken, clearAccessToken } from '../wlogs-auth';

function tokenResponse(token: string, expiresIn = 3600) {
  return new Response(
    JSON.stringify({
      token_type: 'Bearer',
      expires_in: expiresIn,
      access_token: token
    }),
    { status: 200 }
  );
}

describe('getAccessToken', () => {
  beforeEach(() => {
    clearAccessToken();
    process.env.WLOGS_CLIENT_ID = 'client-id';
    process.env.WLOGS_CLIENT_SECRET = 'client-secret';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('requests a client-credentials token with basic auth', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(tokenResponse('tok-1'));

    expect(await getAccessToken()).toBe('tok-1');

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://www.warcraftlogs.com/oauth/token');
    expect(init?.method).toBe('POST');
    const headers = new Headers(init?.headers);
    expect(headers.get('Authorization')).toBe(
      `Basic ${Buffer.from('client-id:client-secret').toString('base64')}`
    );
    expect(String(init?.body)).toBe('grant_type=client_credentials');
  });

  it('reuses the cached token until it nears expiry', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(tokenResponse('tok-1'));

    await getAccessToken();
    expect(await getAccessToken()).toBe('tok-1');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('fetches a new token once the old one nears expiry', async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(tokenResponse('tok-1', 3600))
      .mockResolvedValueOnce(tokenResponse('tok-2', 3600));

    await getAccessToken();
    vi.advanceTimersByTime(3600 * 1000);

    expect(await getAccessToken()).toBe('tok-2');
  });

  it('fetches a new token after clearAccessToken', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(tokenResponse('tok-1'))
      .mockResolvedValueOnce(tokenResponse('tok-2'));

    await getAccessToken();
    clearAccessToken();

    expect(await getAccessToken()).toBe('tok-2');
  });

  it('returns null without calling WCL when credentials are missing', async () => {
    delete process.env.WLOGS_CLIENT_SECRET;
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(await getAccessToken()).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns null and caches nothing when WCL rejects the credentials', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'invalid_client' }), {
          status: 401
        })
      )
      .mockResolvedValueOnce(tokenResponse('tok-1'));

    expect(await getAccessToken()).toBeNull();
    expect(await getAccessToken()).toBe('tok-1');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
