'use client';
import {
  Flex,
  Stack,
  Heading,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  VStack,
  Box,
  HStack
} from '@chakra-ui/react';
import { RAIDS } from '@/lib/data';
import { Link } from '@chakra-ui/next-js';
import { ToggleColorMode } from './toggle-color-code';
import { isDevelopment } from '@/lib/helper';

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
          Everything is subject to major change. Please report bugs on Github OR
          contact CharmyRosewolf on discord with the details.
        </AlertDescription>
      </Alert>

      <Alert status='warning'>
        <AlertIcon />
        <AlertTitle>To guildies</AlertTitle>
        <AlertDescription>
          For accurate boss percentages, please ensure your guild uploads logs
          to the guild warcraft logs ASAP after a raid night (not personal logs)
        </AlertDescription>
      </Alert>

      <Alert status='info'>
        <AlertIcon />
        <AlertTitle>Updates</AlertTitle>
        <AlertDescription>Site updates once a day at 1AM EST</AlertDescription>
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
              <Link href='/'>{name}</Link>
            </Heading>
          </>
        )}
        <Box w='8rem'>
          <ToggleColorMode />
        </Box>
      </HStack>
      <Stack direction={['column', 'row']} spacing={4}>
        {RAIDS && isDevelopment()
          ? RAIDS.map((r) => (
              <Link key={`nav-${r.slug}`} href={`/progress/${r.slug}`}>
                {r.name}
              </Link>
            ))
          : null}
      </Stack>
    </Flex>
  );
}
