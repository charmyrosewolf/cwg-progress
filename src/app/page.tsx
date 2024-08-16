import { Box, Heading, SimpleGrid, Stack } from '@chakra-ui/react';
import { RAIDS } from '@/lib/data';
import { generateSummaryReportBySlug } from '@/lib/report-progress.service';
import { RaidProgressEvent, SummaryReport } from '@/lib/types';
import SummaryTable from './components/summary-table';
import TableKey from './components/table-key';
import RecentUpdatesList from './components/recent-updates-list';
import UpdateTime from './components/update-time';

export default async function Page() {
  const summaryReportsPromise = RAIDS.map(async (r) => {
    return await generateSummaryReportBySlug(r.slug);
  });

  const reports = await Promise.all(summaryReportsPromise);
  const filteredReports = reports.filter((r) => r !== null) as SummaryReport[];

  return <Home summaryReports={filteredReports}></Home>;
}

type HomeProps = {
  summaryReports: SummaryReport[];
};

async function Home({ summaryReports }: HomeProps) {
  const updatedTime =
    summaryReports && summaryReports.length
      ? summaryReports[0].createdOn
      : null;

  const recentUpdates: RaidProgressEvent[] = summaryReports
    .reduce(
      (acc, pr, i) => [...acc, ...pr.recentEvents],
      [] as RaidProgressEvent[]
    )
    .sort((a, b) => (a.dateOccurred < b.dateOccurred ? 1 : -1))
    .splice(0, 5);

  return (
    <Box m='1em 0' justifyContent={'space-around'}>
      <Box mb='1em'>
        {updatedTime ? <UpdateTime lastUpdate={updatedTime} /> : null}
      </Box>
      <Stack
        direction={['column', null, null, null, 'row', null]}
        mt='1em'
        align={['center', null, null, null, 'unset', null]}
        justifyContent={'space-evenly'}
      >
        <Box maxWidth={'100%'}>
          <Heading as='h2' textAlign='center' m='1rem 0'>
            Raid Progression Summary
          </Heading>

          <Box display={'flex'} justifyContent={'center'}>
            <TableKey
              maxWidth='22ch'
              labels={[
                'Progressing on Normal',
                'Progressing on Heroic',
                'Progressing on Mythic'
              ]}
            />
          </Box>

          <SimpleGrid h='auto' mt='1em' columns={1} spacing={10}>
            {summaryReports && summaryReports.length
              ? summaryReports.map((r) => (
                  <SummaryTable
                    key={`${r.raid.slug}-summary-table`}
                    summaryReport={r}
                  ></SummaryTable>
                ))
              : 'NO DATA AVAILABLE'}
          </SimpleGrid>
        </Box>

        <Box
          mt={['1em', null, '0em']}
          maxW={['20em', null, '30em', null, '40em', null]}
          justifySelf={'flex-start'}
        >
          <Heading as='h2' textAlign='center' m='1rem 0'>
            Recent Updates
          </Heading>
          <RecentUpdatesList recentUpdates={recentUpdates}></RecentUpdatesList>
        </Box>
      </Stack>
    </Box>
  );
}
