/* WLOGS PROGRESS REPORT */
// this is an early prototype

import { RAIDS } from './data/df.s3';
import { GUILDS } from './data/guilds';
import { postQuery } from './api/wlogs.api';
import { sortByBestPulls } from './report-progress.service';

// RAW DATA TYPES
type FightData = {
  name: string;
  startTime: number;
  endTime: number;
  difficulty: number;
  kill: boolean;
  bossPercentage: number;
  fightPercentage: number;
};

type PulledReportData = {
  code: string;
  startTime: number;
  endTime: number;
  fights: FightData[];
};

type FlattenedFightData = {
  code: string;
  encounterID: number | undefined;
  name: string;
  startTime: Date;
  endTime: Date;
  reportStartTime: Date;
  reportEndTime: Date;
  difficulty: number;
  kill: boolean;
  bossPercentage: number;
  fightPercentage: number;
};

type RaidProgress = {
  encounterId: number;
  kill: boolean;
  firstKillTime: Date | null;
  percentageDown: number;
};
type Guild = {
  name: string;
  server: string;
  progress: RaidProgress[];
};

const FIGHT_QUERY = `query ($name: String, $server: String, $region: String, $encounterID: Int) {
	reportData {
		reports(guildName: $name, guildServerSlug: $server, guildServerRegion: $region, limit: 70) {
			data {
				code,
				startTime,
				endTime
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

// TODO: fetch encounter ids for table construction

// filter out empty fights
// could create flat map w/ report data if desireable.
// for first kill need report startTime / endTime?

// TODO: Might need to change return type as data grows
function processReports(reports: PulledReportData[]): FlattenedFightData[] {
  return reports
    .filter((report) => {
      return report.fights.length;
    })
    .map((report) =>
      report.fights.map((f) => {
        return {
          encounterID: 0,
          code: report.code,
          reportStartTime: new Date(report.startTime),
          reportEndTime: new Date(report.endTime),
          ...f,
          startTime: new Date(f.startTime),
          endTime: new Date(f.endTime)
        };
      })
    )
    .flat()
    .sort((a, b) => (a.reportStartTime > b.reportStartTime ? 1 : -1));
}

async function fetchEncounterData(
  vars: any
): Promise<PulledReportData[] | null> {
  const queryResults = await postQuery(
    FIGHT_QUERY,
    vars,
    `FAILED TO FETCH ENCOUNTER ${vars.encounterID} FOR ${vars.name}`
  );

  return queryResults ? queryResults.data.reportData.reports.data : null;
  // if (!response.ok) {
  //   console.error(
  //     `FAILED TO FETCH ENCOUNTER ${vars.encounterID} FOR ${vars.name}`,
  //     response
  //   );
  //   // return Promise.reject(response);
  //   Promise.reject(response);
  //   return null; // Treat as no kills for now
  // }

  // const queryResults = await response.json();
}

function getBestKill(fights: FlattenedFightData[]): FlattenedFightData | null {
  if (!fights || !fights.length) {
    return null;
  }
  const firstKill = fights.find((f) => f.kill);
  let bestKill = firstKill;

  if (!bestKill) {
    bestKill = fights.sort((a, b) => a.bossPercentage - b.bossPercentage)[0];
  }

  return bestKill;
}

export async function createReport2() {
  const fightVariablesMap = RAIDS[0].encounters.map((e) => {
    return {
      ...GUILDS[0],
      encounterID: e.id
    };
  });

  const results = [];

  for (const fv of fightVariablesMap) {
    // const fightData = await fetchEncounterData(fv);

    const queryResults = await postQuery(
      FIGHT_QUERY,
      fv,
      `FAILED TO FETCH ENCOUNTER ${fv.encounterID} FOR ${fv.name}`
    );

    const fights: PulledReportData[] =
      queryResults && queryResults.data.reportData
        ? queryResults.data.reportData.reports.data
        : null;

    results.push(fights);
  }

  const flattenedEncounters = results.map((r) => (r ? processReports(r) : []));

  // TODO: Separate Heroic & Normal
  const guildProgress: RaidProgress[] = flattenedEncounters.map((fights) => {
    // console.log(fights[0]);

    const bestKill = getBestKill(fights);

    return {
      encounterId: 0,
      kill: !!bestKill?.kill,
      firstKillTime: bestKill?.kill
        ? (bestKill?.reportStartTime as Date)
        : null,
      percentageDown: bestKill?.bossPercentage as number
    };
  });

  const guildReport: Guild = {
    name: GUILDS[0].name,
    server: GUILDS[0].realm,
    progress: guildProgress
  };

  console.log(guildReport);

  return guildProgress;
}

createReport2();

export async function createReport() {
  const variables = {
    ...GUILDS[0],
    encounterID: RAIDS[0].encounters[0].id
  };

  const errorMessage = `FAILED TO FETCH ENCOUNTER ${variables.encounterID} FOR ${variables.name}`;
  try {
    const reports = await postQuery(FIGHT_QUERY, variables, errorMessage);
    console.log(reports);
    const report = processReports(reports.data.reportData.reports.data);

    // report.forEach((r) => console.log(r));

    const firstKill = report.find((r) => r.kill);
    let bestKill = firstKill;
    if (!firstKill) {
      bestKill = report.sort((a, b) => a.bossPercentage - b.bossPercentage)[0];
    }

    const guildProgress: Guild = {
      name: GUILDS[0].name,
      server: GUILDS[0].realm,
      progress: [
        {
          encounterId: variables.encounterID,
          kill: !!bestKill?.kill,
          firstKillTime: firstKill ? (bestKill?.reportStartTime as Date) : null,
          percentageDown: bestKill?.bossPercentage as number
        }
      ]
    };
    return guildProgress;
  } catch (e) {
    console.error('FAILED to FETCH REPORT', e);
    // return [] as Guild[];
    return {} as Guild;
  }
}

// mock data

const date = new Date();
const fightTime = new Date(date.getTime() - 1000);
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayFightTime = new Date(yesterday.getTime() - 1000);

export const mockFights: FlattenedFightData[] = [
  {
    encounterID: 1,
    code: 'dfsdgsa',
    reportStartTime: date,
    reportEndTime: date,
    name: 'Fyrakk the Blazing',
    startTime: fightTime,
    endTime: fightTime,
    difficulty: 3,
    kill: false,
    bossPercentage: 20.0,
    fightPercentage: 0.01
  },
  {
    encounterID: 2,
    code: 'dfasdfdsfs',
    reportStartTime: date,
    reportEndTime: date,
    name: 'Fyrakk the Blazing',
    startTime: fightTime,
    endTime: fightTime,
    difficulty: 3,
    kill: false,
    bossPercentage: 80.0,
    fightPercentage: 0.01
  },
  {
    encounterID: 3,
    code: 'dfasdfdsfs',
    reportStartTime: date,
    reportEndTime: date,
    name: 'Fyrakk the Blazing',
    startTime: fightTime,
    endTime: fightTime,
    difficulty: 3,
    kill: true,
    bossPercentage: 0.01,
    fightPercentage: 0.01
  },
  {
    encounterID: 4,
    code: 'dfasdfdsfs',
    reportStartTime: date,
    reportEndTime: date,
    name: 'Fyrakk the Blazing',
    startTime: fightTime,
    endTime: fightTime,
    difficulty: 4,
    kill: false,
    bossPercentage: 20.0,
    fightPercentage: 0.01
  },
  {
    encounterID: 5,
    code: 'dfasdfdsfs',
    reportStartTime: yesterday,
    reportEndTime: yesterday,
    name: 'Fyrakk the Blazing',
    startTime: yesterdayFightTime,
    endTime: yesterdayFightTime,
    difficulty: 3,
    kill: true,
    bossPercentage: 0.01,
    fightPercentage: 0.01
  },
  {
    encounterID: 6,
    code: 'dfasdfdsfs',
    reportStartTime: date,
    reportEndTime: date,
    name: 'Fyrakk the Blazing',
    startTime: fightTime,
    endTime: fightTime,
    difficulty: 4,
    kill: true,
    bossPercentage: 0.01,
    fightPercentage: 0.01
  }
];

// mockFights.sort(sortByBestPulls);
// console.log(mockFights);
const recentUpdates = [];
recentUpdates.unshift(
  ...[
    {
      guildName: 'CWG Community',
      raidName: 'Fyrakk',
      bossName: 'Broodkeeper Diurna',
      lowestPercentage: 10.5,
      type: 'BEST',
      dateOccurred: new Date()
    } as RaidProgressEvent
  ]
);
