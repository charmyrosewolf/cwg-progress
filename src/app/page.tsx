// Any images need the basePath
// import Image from 'next/image';
import { ProgressReport } from '@/lib/types';
import { Box } from '@chakra-ui/react';

import { generateProgressReports } from '@/lib/report-progress.service';
import RaidProgressTable from './components/raid-progress-table';
import { isDevelopment } from '@/lib/helper';
import { sendDiscordMessage } from './_actions/discord';

export default async function Page() {
  const reports = await generateProgressReports();

  return <Home progressReports={reports}></Home>;
}

type HomeProps = { progressReports: ProgressReport[] };

async function Home({ progressReports }: HomeProps) {
  // await sendDiscordMessage('Hello World!');

  return (
    <Box>
      {/* {progressReports && progressReports.length
        ? getSummaryTable()
        : 'NO DATA AVAILABLE'} */}

      {/* Create Summary table to mitigate space  issues? */}
      {progressReports && progressReports.length && isDevelopment()
        ? progressReports.map((r) => (
            <RaidProgressTable
              key={`${r.raid.slug}-table`}
              report={r}
            ></RaidProgressTable>
          ))
        : 'NO DATA AVAILABLE'}
    </Box>
  );
}
