import { ProgressReport, RaidInfo } from '@/lib/types';
import { Box, Heading, Stack } from '@chakra-ui/react';
import RaidProgressTable from '@/app/components/raid-progress-table';
import TableKey from '@/app/components/table-key';
import UpdateTime from '@/app/components/update-time';
import CustomLink from '@/app/components/custom-link';

type RaidProgressProps = {
  progressReport: ProgressReport;
  raids: RaidInfo[];
};

export default function RaidProgress({
  progressReport,
  raids
}: RaidProgressProps) {
  return (
    <Box m='1em 0'>
      <Stack
        direction={['column', 'column', 'column', 'row']}
        align='center'
        justify={'center'}
        textAlign='center'
        gap={4}
      >
        {raids && raids.length > 1
          ? raids.map((r) => (
              <Heading
                key={`nav-${r.slug}`}
                justifySelf='center'
                as='h2'
                m='1rem 1rem'
                fontSize={['md', 'lg', null, 'xl']}
              >
                <CustomLink textDecoration='none' href={`/raid/${r.slug}`}>
                  {r.name}
                </CustomLink>
              </Heading>
            ))
          : null}
      </Stack>
      <Box m='1em'>
        {progressReport.createdOn ? (
          <UpdateTime lastUpdate={progressReport.createdOn} />
        ) : null}
      </Box>
      <Box mb='1em' display={'flex'} justifyContent={'right'}>
        <TableKey
          breakpoint='500px'
          labels={['Normal kill', 'Heroic kill', 'Mythic kill']}
        />
      </Box>
      <Box mb='1em'>
        <RaidProgressTable report={progressReport}></RaidProgressTable>
      </Box>
      <CustomLink href='/'>&larr; back to summary</CustomLink>
    </Box>
  );
}
