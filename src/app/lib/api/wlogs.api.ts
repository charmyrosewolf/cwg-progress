/** Warcraft Logs APIv2 */
const PUBLIC_URL = 'https://www.warcraftlogs.com/api/v2/client';

function getHeaders(): Headers {
  const headers = new Headers();
  const auth = `Bearer ${process.env.WLOGS_ACCESS_TOKEN}`;

  headers.append('Authorization', auth);
  headers.append('Content-Type', 'application/json');

  return headers;
}

type variablesType = { [key: string]: any };

export async function postQuery(
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

  if (res.ok) {
    return data;
  } else {
    console.error(errorMessage, data);
    return Promise.reject(data);
  }
}
