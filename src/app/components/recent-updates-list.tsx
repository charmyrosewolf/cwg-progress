import { RaidProgressEvent } from '@/lib/types';
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  SimpleGrid,
  Text
} from '@chakra-ui/react';
import Date from './datebox';

type RecentUpdateListProps = {
  recentUpdates: RaidProgressEvent[];
};
export default function RecentUpdatesList({
  recentUpdates
}: RecentUpdateListProps) {
  return (
    <SimpleGrid spacing={4}>
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
    <Card
      direction={{ base: 'column', sm: 'row' }}
      overflow='hidden'
      variant='outline'
    >
      <CardHeader alignSelf={'center'}>
        <Date
          dt={recentUpdate.dateOccurred.toISOString()}
          type='default'
          dateFormat={'LLL do'}
        ></Date>
        <br />
        <Date
          dt={recentUpdate.dateOccurred.toISOString()}
          type='default'
          dateFormat={'p'}
        ></Date>
      </CardHeader>
      <Divider orientation='vertical' />
      <CardBody alignContent={'center'}>
        <Text>{getText()}</Text>
      </CardBody>
    </Card>
  );
}
