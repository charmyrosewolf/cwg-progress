/** Warcraft Logs APIv2 */
import { devCache } from '@/lib/utils/dev-cache';
import { WCLExpansionZone } from '@/lib/types';

const PUBLIC_URL = 'https://www.warcraftlogs.com/api/v2/client';

function getHeaders(): Headers {
  const headers = new Headers();
  const auth = `Bearer ${process.env.WLOGS_ACCESS_TOKEN}`;

  headers.append('Authorization', auth);
  headers.append('Content-Type', 'application/json');

  return headers;
}

type variablesType = { [key: string]: any };

async function rawPostQuery(
  query: string,
  variables: variablesType,
  errorMessage: string
): Promise<any> {
  const headers = getHeaders();

  const options = {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      query: query,
      variables: variables
    })
  };

  const res = await fetch(PUBLIC_URL, options);

  const data = await res.json();

  // Note that this won't fail in the case that the query is too complex
  if (res.ok) {
    return data;
  } else {
    console.error(errorMessage, data);
    return Promise.resolve(null);
  }
}

/**
 * Posts a GraphQL query to WCL.
 * In dev mode, responses are cached to disk to protect rate limits.
 */
export async function postQuery(
  query: string,
  variables: variablesType,
  errorMessage: string
): Promise<any> {
  // Create a unique cache key from query + variables using a hash
  const crypto = await import('crypto');
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify({ query, variables }))
    .digest('hex');
  const cacheKey = `wlogs-${hash}`;

  return devCache(cacheKey, () => rawPostQuery(query, variables, errorMessage));
}

const WCL_EXPANSION_ZONES_QUERY = `query ($id: Int!) {
  worldData {
    expansion(id: $id) {
      zones {
        id
        name
        frozen
        encounters {
          id
          name
        }
      }
    }
  }
}`;

/**
 * Fetches all zones and encounters for an expansion from WCL.
 * Returns zones with encounter IDs, names, and frozen status.
 */
export async function fetchWCLExpansionZones(
  expansionId: number
): Promise<WCLExpansionZone[]> {
  const result = await postQuery(
    WCL_EXPANSION_ZONES_QUERY,
    { id: expansionId },
    `FAILED TO FETCH WCL EXPANSION ZONES FOR EXPANSION ${expansionId}`
  );

  if (!result?.data?.worldData?.expansion?.zones) {
    console.error('No WCL expansion zone data returned');
    return [];
  }

  return result.data.worldData.expansion.zones as WCLExpansionZone[];
}

const WCL_EXPANSIONS_QUERY = `{
  worldData {
    expansions {
      id
      name
    }
  }
}`;

/**
 * Fetches all expansions from WCL and returns the latest (highest) ID.
 */
export async function fetchLatestWCLExpansionId(): Promise<number> {
  const result = await postQuery(
    WCL_EXPANSIONS_QUERY,
    {},
    'FAILED TO FETCH WCL EXPANSIONS'
  );

  const expansions = result?.data?.worldData?.expansions;

  if (!expansions?.length) {
    throw new Error('No WCL expansions returned');
  }

  // Highest ID = latest expansion
  return Math.max(...expansions.map((e: { id: number }) => e.id));
}
