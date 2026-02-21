import { generateFightUrl, WlogReport } from '@/lib/api/wlogs.types';
import { WlogFlattenedFight, REVALIDATION_TIME, FightMap } from '@/lib/types';

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function getHost(): string {
  return isDevelopment()
    ? `http://localhost:3000`
    : `https://cwg-progress.vercel.app`;
}

export function getUnixTimestampInSeconds(date: Date) {
  return Math.floor(date.getTime() / 1000);
}

export function getNextUpdateUnixTime(date: Date) {
  return date.getTime() + REVALIDATION_TIME * 1000;
}

// TODO: Might need to change return type as data grows
export function flattenWLOGReportFights(
  reports: WlogReport[]
): WlogFlattenedFight[] {
  return reports
    .filter((report) => {
      return report.fights.length;
    })
    .map((report) =>
      report.fights.map((f) => {
        return {
          code: report.code,
          url: generateFightUrl(report.code, f.id),
          reportStartTime: new Date(report.startTime),
          reportEndTime: new Date(report.endTime),
          ...f,
          startTime: new Date(report.startTime + f.startTime),
          endTime: new Date(report.startTime + f.endTime)
        };
      })
    )
    .flat();
}

export function sortByBestPulls(a: WlogFlattenedFight, b: WlogFlattenedFight) {
  return (
    b.difficulty - a.difficulty ||
    Number(b.kill) - Number(a.kill) ||
    a.bossPercentage - b.bossPercentage ||
    (a.reportStartTime > b.reportStartTime ? 1 : -1)
  );
}

export function getWlogFightMap(flattenedEncounters: WlogFlattenedFight[]) {
  const fightMap: FightMap = flattenedEncounters.reduce(
    (acc: FightMap, fight, index) => {
      const encounterID = fight.encounterID as number;
      if (acc && acc.has(encounterID)) {
        acc.set(encounterID, [...(acc.get(encounterID) as []), fight]);
      } else {
        acc.set(encounterID, [fight]);
      }
      return acc;
    },
    new Map() as FightMap
  );

  return fightMap;
}

export function sortFightMapByBestPulls(fightMap: FightMap): FightMap {
  const bestPullFightMap: FightMap = new Map();

  fightMap.forEach((fights, encounterId) => {
    (fights as WlogFlattenedFight[]).sort(sortByBestPulls);

    let bestPull = (fights as WlogFlattenedFight[])[0];

    bestPullFightMap.set(encounterId, bestPull);
  });

  return bestPullFightMap;
}
