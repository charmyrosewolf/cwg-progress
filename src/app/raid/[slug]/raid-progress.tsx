// Any images need the basePath
// import Image from 'next/image';
import { ProgressReport, REVALIDATION_TIME } from '@/lib/types';
import { Box } from '@chakra-ui/react';
import RaidProgressTable from '@/app/components/raid-progress-table';
import Date from '@/app/components/date';
import { getNextUpdateUnixTime } from '@/lib/helper';

type RaidProgressProps = { progressReport: ProgressReport };

export default function RaidProgress({ progressReport }: RaidProgressProps) {
  const nextUpdateUnixTIme = getNextUpdateUnixTime(progressReport.createdOn);

  return (
    <Box m='0 auto'>
      <Box mb='1em'>
        <RaidProgressTable report={progressReport}></RaidProgressTable>
      </Box>
      <Box textAlign={'left'}>
        Last update on&nbsp;
        <Date
          dt={progressReport.createdOn.toISOString()}
          type='default'
          dateFormat={'PPPP p'}
        ></Date>
      </Box>

      <Box textAlign={'left'}>
        Next update in&nbsp;
        <Date dt={nextUpdateUnixTIme} type='distance'></Date>
      </Box>
    </Box>
  );
}
