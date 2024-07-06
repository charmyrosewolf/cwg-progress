'use client';
import {
  Flex,
  Stack,
  Heading,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  HStack
} from '@chakra-ui/react';
import { RAIDS } from '@/lib/data';
import { Link } from '@chakra-ui/next-js';
import ColorModeToggle from './color-mode-toggle';

const name = 'CWG Progress';

interface HeaderProps {
  isHome: boolean;
}

export default function Header({ isHome }: HeaderProps) {
  return (
    <Flex as='header' direction='column' align='center' w='100vw'>
      <Alert status='error'>
        <AlertIcon />
        <AlertTitle>This site is under construction!</AlertTitle>
        <AlertDescription>
          Everything is subject to major change. Please{' '}
          <Link
            href='https://github.com/charmyrosewolf/cwg-progress/issues'
            target='_blank'
          >
            report bugs on Github
          </Link>{' '}
          OR contact CharmyRosewolf on discord with the details.
        </AlertDescription>
      </Alert>

      <Alert status='warning'>
        <AlertIcon />
        <AlertTitle>To guildies</AlertTitle>
        <AlertDescription>
          Please update: 1. your raider.io page and 2. Your GUILD warcraft logs
          (not personal logs) with the latest raid logs for accurate boss
          percentages.
        </AlertDescription>
      </Alert>

      <Alert status='info'>
        <AlertIcon />
        <AlertTitle>Update Schedule</AlertTitle>
        <AlertDescription>
          This site updates every 4 hours (may change). Discord webhook is sent
          out once per day.
        </AlertDescription>
      </Alert>
      <HStack w='95%' justifyContent={'space-between'}>
        <Box w='8rem'></Box>
        {isHome ? (
          <>
            <Heading justifySelf='center' as='h1' m='1rem 0'>
              {name}
            </Heading>
          </>
        ) : (
          <>
            <Heading justifySelf='center' as='h2' m='1rem 0'>
              <Link variant='nav' href='/'>
                {name}
              </Link>
            </Heading>
          </>
        )}
        <Box w='8rem'>
          <ColorModeToggle />
        </Box>
      </HStack>
      {!isHome ? (
        <Stack direction={['column', 'row']} spacing={4}>
          {RAIDS
            ? RAIDS.map((r) => (
                <Link
                  variant='nav'
                  key={`nav-${r.slug}`}
                  href={`/raid/${r.slug}`}
                >
                  {r.name}
                </Link>
              ))
            : null}
        </Stack>
      ) : null}
    </Flex>
  );
}
