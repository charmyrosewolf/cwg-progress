import { Box } from '@chakra-ui/react';
import DateBox from './datebox';
import { getNextUpdateUnixTime } from '@/lib/helper';
import { compareAsc } from 'date-fns';

type UpdateTimeProps = {
  textAlign?: any;
  lastUpdate: Date;
};

export default function UpdateTime({
  textAlign = ['center', 'right'],
  lastUpdate
}: UpdateTimeProps) {
  const nextUpdateUnixTIme = getNextUpdateUnixTime(lastUpdate);

  const needsRefresh =
    compareAsc(new Date(), new Date(nextUpdateUnixTIme)) === 1;

  return (
    <>
      <Box textAlign={textAlign}>
        Last update on&nbsp;
        <DateBox
          dt={lastUpdate.toISOString()}
          type='default'
          dateFormat={'PPPP p'}
        ></DateBox>
      </Box>

      <Box textAlign={textAlign}>
        {needsRefresh ? 'Last updated ' : 'Next update in '}
        <DateBox dt={nextUpdateUnixTIme} type='distance'></DateBox>
        {needsRefresh ? ' ago. Refresh browser to update' : null}
      </Box>
    </>
  );
}
