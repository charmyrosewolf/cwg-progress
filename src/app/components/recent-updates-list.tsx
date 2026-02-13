import { RaidProgressEvent } from '@/lib/types';
import { Card, SimpleGrid, Text, Separator } from '@chakra-ui/react';
import Date from './datebox';

type RecentUpdateListProps = {
  recentUpdates: RaidProgressEvent[];
};
export default function RecentUpdatesList({
  recentUpdates
}: RecentUpdateListProps) {
  return (
    <SimpleGrid gap={4}>
      {recentUpdates
        ? recentUpdates.map((u, i) => (
            <RecentUpdate key={`update-${i}`} recentUpdate={u}></RecentUpdate>
          ))
        : 'No recent updates'}
    </SimpleGrid>
  );
}

type RecentUpdateProps = {
  recentUpdate: RaidProgressEvent;
};

function RecentUpdate({ recentUpdate }: RecentUpdateProps) {
  const getText = () => {
    switch (recentUpdate.type) {
      case 'KILL':
        return `${recentUpdate.guildName} defeated ${recentUpdate.bossName}`;
      case 'BEST':
        return `${recentUpdate.guildName} achieved a new best of ${recentUpdate.lowestPercentage}% on ${recentUpdate.bossName}`;
    }
  };
  return (
    <Card.Root
      flexDirection={{ base: 'column', sm: 'row' }}
      overflow='hidden'
      variant='outline'
    >
      <Card.Header alignSelf={'center'} gap='0' py='var(--card-padding)'>
        <Date
          dt={recentUpdate.dateOccurred.toISOString()}
          type='default'
          dateFormat={'LLL do'}
        ></Date>
        <Date
          dt={recentUpdate.dateOccurred.toISOString()}
          type='default'
          dateFormat={'p'}
        ></Date>
      </Card.Header>
      <Separator orientation='vertical' />
      <Card.Body alignContent={'center'}>
        <Text>{getText()}</Text>
      </Card.Body>
    </Card.Root>
  );
}
