// Any images need the basePath
// import Image from 'next/image';
import { ProgressReport } from '../../lib/types';
import { Box } from '@chakra-ui/react';
import RaidProgressTable from '@/app/components/raid-progress-table';

type RaidProgressProps = { progressReport: ProgressReport };

export default function RaidProgress({ progressReport }: RaidProgressProps) {
  return (
    <Box m='0 auto'>
      {/* Create Summary table to mitigate space  issues? */}
      <RaidProgressTable report={progressReport}></RaidProgressTable>
    </Box>
  );
}
