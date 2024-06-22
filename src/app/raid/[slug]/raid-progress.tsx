// Any images need the basePath
// import Image from 'next/image';
import { ProgressReport } from '@/lib/types';
import { Box } from '@chakra-ui/react';
import RaidProgressTable from '@/app/components/raid-progress-table';

type RaidProgressProps = { progressReport: ProgressReport };

export default function RaidProgress({ progressReport }: RaidProgressProps) {
  return (
    <Box m='0 auto'>
      <Box textAlign={'right'}>
        Last Updated on:
        {progressReport ? (
          <Box>
            {progressReport.createdOn.toDateString()}{' '}
            {progressReport.createdOn.toTimeString()}
          </Box>
        ) : null}
      </Box>

      {/* Create Summary table to mitigate space  issues? */}

      <RaidProgressTable report={progressReport}></RaidProgressTable>
    </Box>
  );
}
