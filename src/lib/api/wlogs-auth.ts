/** Warcraft Logs OAuth: client-credentials token, cached until it nears expiry. */

const TOKEN_URL = 'https://www.warcraftlogs.com/oauth/token';

// refresh this long before WCL's stated expiry
const EXPIRY_MARGIN_MS = 5 * 60 * 1000;

type CachedToken = { value: string; expiresAt: number };

let _token: CachedToken | null = null;
// shared so parallel guild fetches don't each request a token
let _pending: Promise<string | null> | null = null;

async function requestToken(): Promise<string | null> {
  const id = process.env.WLOGS_CLIENT_ID;
  const secret = process.env.WLOGS_CLIENT_SECRET;

  if (!id || !secret) {
    console.error('[wlogs] WLOGS_CLIENT_ID or WLOGS_CLIENT_SECRET is not set');
    return null;
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.access_token) {
    const reason = data?.error ?? `status ${res.status}`;
    console.error(`[wlogs] FAILED TO FETCH ACCESS TOKEN: ${reason}`);
    return null;
  }

  _token = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000 - EXPIRY_MARGIN_MS
  };

  return _token.value;
}

/** Returns a valid WCL access token, or null when one can't be had. */
export async function getAccessToken(): Promise<string | null> {
  if (_token && Date.now() < _token.expiresAt) {
    return _token.value;
  }

  _pending ??= requestToken().finally(() => {
    _pending = null;
  });

  return _pending;
}

/** Drops the cached token, e.g. after WCL rejects it. */
export function clearAccessToken(): void {
  _token = null;
}
