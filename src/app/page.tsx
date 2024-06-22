// Any images need the basePath
// import Image from 'next/image';
import { ProgressReport } from '@/lib/types';
import { Box, Stack } from '@chakra-ui/react';

import { generateProgressReportBySlug } from '@/lib/report-progress.service';
// import { sendDiscordMessage } from './_actions/discord';
import { RAIDS } from '@/lib/data';
import Link from 'next/link';
// import { Link } from '@chakra-ui/next-js';

export default async function Page() {
  // const progressReportsPromise = RAIDS.map(async (r) => {
  //   return await generateProgressReportBySlug(r.slug);
  // });

  // const reports = await Promise.all(progressReportsPromise);
  // const filteredReports = reports.filter((r) => r !== null) as ProgressReport[];

  // return <Home progressReports={filteredReports}></Home>;
  return <Home></Home>;
}

// type HomeProps = { progressReports: ProgressReport[] };

async function Home() {
  // await sendDiscordMessage('Hello World! This deployment has been updated');

  return (
    <Box>
      {/* {progressReports && progressReports.length
        ? getSummaryTable()
        : 'NO DATA AVAILABLE'} */}

      {/* {progressReports && progressReports.length ? (
        <Box>
          {progressReports[0].createdOn.toDateString()}{' '}
          {progressReports[0].createdOn.toTimeString()}
        </Box>
      ) : null} */}

      {/* Create Summary table to mitigate space  issues? */}
      {/* {progressReports && progressReports.length && isDevelopment()
        ? progressReports.map((r) => (
            <RaidProgressTable
              key={`${r.raid.slug}-table`}
              report={r}
            ></RaidProgressTable>
          ))
        : 'NO DATA AVAILABLE'} */}

      <Stack
        fontSize={'4em'}
        textAlign={'center'}
        direction={['column']}
        spacing={4}
      >
        {RAIDS
          ? RAIDS.map((r) => (
              <Link key={`nav-${r.slug}`} href={`/raid/${r.slug}`}>
                {r.name}
              </Link>
            ))
          : null}
      </Stack>
    </Box>
  );
}
