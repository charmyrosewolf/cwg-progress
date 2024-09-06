import {
  Box,
  Flex,
  Heading,
  ListItem,
  OrderedList,
  Text
} from '@chakra-ui/react';
import CustomLink from '../components/custom-link';

export default async function Page() {
  return <Help></Help>;
}

async function Help() {
  return (
    <Flex direction='column' m='1em 0' align={'center'}>
      <Box w={['90%', null, null, null, '50%']}>
        <Heading as='h2' textAlign='center' mb='1.5em'>
          Help
        </Heading>
        <Box m='1em'>
          <Heading as='h3' mb='.5em'>
            Instructions for Participating Guilds
          </Heading>
          <Text fontSize='xl'>
            To ensure your guild&apos;s progress on this site is accurate:
          </Text>
          <OrderedList fontSize='xl' mt='.25em'>
            <ListItem mb='.25em'>
              Update your raider.io page frequently for accurate progress, and
            </ListItem>
            <ListItem mb='.25em'>
              Update your guild&apos;s warcraft logs (not personal logs) with
              the latest raid logs for accurate links.
            </ListItem>
          </OrderedList>
        </Box>
        <Box m='1em'>
          <Heading as='h3' mb='.5em'>
            Update Schedule
          </Heading>
          <Text fontSize='xl'>
            This site updates every 4 hours (may change). Discord update is sent
            out once per day.
          </Text>
        </Box>
        <Box m='1em'>
          <Heading as='h3' mb='.5em'>
            Issues
          </Heading>
          <Text fontSize='xl'>
            Please contact CharmyRosewolf on discord with requests or to report
            inconsistencies. Include any helpful raider.io or Warcraft Logs
            information if applicable. You may also{' '}
            <CustomLink
              href='https://github.com/charmyrosewolf/cwg-progress/issues'
              target='_blank'
            >
              view or report bugs on Github
            </CustomLink>
            .
          </Text>
        </Box>
      </Box>
    </Flex>
  );
}
