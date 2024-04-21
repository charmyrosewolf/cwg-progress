// WARCRAFT LOGS
const PUBLIC_URL = 'https://www.warcraftlogs.com/api/v2/client';

function getHeaders(): Headers {
  const headers = new Headers();
  const auth = `Bearer ${process.env.WLOGS_ACCESS_TOKEN}`;

  headers.append('Authorization', auth);
  headers.append('Content-Type', 'application/json');

  return headers;
}

type variablesType = { [key: string]: any };

async function postQuery(query: string, variables: variablesType) {
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
    console.error('FAILED TO FETCH DATA', data);
    return Promise.reject(data);
  }
}

// WLOGS PROGRESS REPORT
// this is an early prototype

const FAMS_GUILD = {
  name: 'Faith As A Mustard Seed',
  server: 'Illidan',
  region: 'US'
};

// ENCOUNTER_IDS
const GNARLROOT_ID = 2820;

const famsGnarlQuery = `query ($name: String, $server: String, $region: String, $encounterID: Int) {
	reportData {
		reports(guildName: $name, guildServerSlug: $server, guildServerRegion: $region, limit: 70) {
			data {
				fights(encounterID: $encounterID) {
					name,
					startTime,
					endTime,
					difficulty,
					kill,
					bossPercentage,
					fightPercentage,
				}
			}
		}
	}
}`;

const famsGnarlVariables = {
  ...FAMS_GUILD,
  encounterID: GNARLROOT_ID
};

// filter out empty fights
// could create flat map w/ report data if desireable.
// for first kill need report startTime / endTime?

export type FightData = {
  name: String;
  startTime: Number;
  endTime: Number;
  difficulty: Number;
  kill: Boolean;
  bossPercentage: Number;
  fightPercentage: Number;
};

type PulledReportData = {
  fights: FightData[];
};

// TODO: Might need to change return type as data grows
function processReports(reports: PulledReportData[]): FightData[] {
  return reports
    .filter((report) => {
      return report.fights.length;
    })
    .map((report) => report.fights)
    .flat();
}

export async function createReport() {
  try {
    const reports = await postQuery(famsGnarlQuery, famsGnarlVariables);
    const report = processReports(reports.data.reportData.reports.data);

    return report;
  } catch (e) {
    console.error('FAILED to FETCH REPORT', e);
    return [];
  }
}
