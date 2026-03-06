import { Box, Text } from '@chakra-ui/react';
import { getNextRaid } from '@/lib/data';

export default async function NextRaidBanner() {
  const nextRaid = await getNextRaid();

  if (!nextRaid) return null;

  const daysText =
    nextRaid.daysUntilLaunch === 1
      ? '1 day'
      : `${nextRaid.daysUntilLaunch} days`;

  return (
    <Box
      w='100vw'
      bg={{ base: 'teal.600', _dark: 'teal.800' }}
      color={{ base: 'white', _dark: 'teal.100' }}
      textAlign='center'
      py='0.5em'
      px='1em'
    >
      <Text fontWeight='bold' fontSize={['sm', 'md']}>
        {nextRaid.name} launches in {daysText}
      </Text>
    </Box>
  );
}
