import {
  Box,
  Grid,
  GridItem,
  Heading,
  SimpleGrid,
  Stack
} from '@chakra-ui/react';
import { RAIDS } from '@/lib/data';
import { generateProgressReportBySlug } from '@/lib/report-progress.service';
import { ProgressReport, RaidProgressEvent } from '@/lib/types';
import SummaryTable from './components/summary-table';
import { getNextUpdateUnixTime } from '@/lib/helper';
import Date from './components/date';

// TODO: update return value for this?
export default async function Page() {
  const progressReportsPromise = RAIDS.map(async (r) => {
    return await generateProgressReportBySlug(r.slug);
  });

  const reports = await Promise.all(progressReportsPromise);
  const filteredReports = reports.filter((r) => r !== null) as ProgressReport[];

  return <Home progressReports={filteredReports}></Home>;
}

type HomeProps = { progressReports: ProgressReport[] };

async function Home({ progressReports }: HomeProps) {
  const updatedTime =
    progressReports && progressReports.length
      ? progressReports[0].createdOn
      : null;

  const nextUpdateUnixTIme = updatedTime
    ? getNextUpdateUnixTime(updatedTime)
    : null;

  const recentUpdates: RaidProgressEvent[] = progressReports
    .reduce(
      (acc, pr, i) => [...acc, ...pr.recentEvents],
      [] as RaidProgressEvent[]
    )
    .sort((a, b) => (a.dateOccurred < b.dateOccurred ? 1 : -1))
    .splice(0, 5);
  return (
    <Box mt='1em'>
      <Box mt='1em' textAlign={'center'}>
        <Heading as='h3'>Recent Updates</Heading>
        {recentUpdates
          ? recentUpdates.map((u, i) => (
              <Box
                key={`update-${i}`}
              >{`${u.guildName} defeated ${u.bossName}`}</Box>
            ))
          : 'No recent updates'}
      </Box>

      <Box>
        <Heading as='h3' textAlign='center' mt='1rem'>
          Summary
        </Heading>

        <SimpleGrid h='auto' columns={[1, 1, 1, 1, 2, 2]} spacing={10}>
          {progressReports && progressReports.length
            ? progressReports.map((r) => (
                <SummaryTable
                  key={`${r.raid.slug}-summary-table`}
                  progressReport={r}
                ></SummaryTable>
              ))
            : 'NO DATA AVAILABLE'}
        </SimpleGrid>
      </Box>

      {updatedTime && nextUpdateUnixTIme ? (
        <>
          <Box textAlign={'left'} pt='1rem'>
            Last update on&nbsp;
            <Date
              dt={updatedTime.toISOString()}
              type='default'
              dateFormat={'PPPP p'}
            ></Date>
          </Box>

          <Box textAlign={'left'}>
            Next update in&nbsp;
            <Date dt={nextUpdateUnixTIme} type='distance'></Date>
          </Box>
        </>
      ) : null}
    </Box>
  );
}
