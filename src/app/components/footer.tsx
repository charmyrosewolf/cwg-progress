'use client';
import NextLink from 'next/link';
import { Flex, Stack, Text, Link } from '@chakra-ui/react';

export default function Footer() {
  return (
    <Flex as='header' direction='column' align='center' w='100vw' p='1em'>
      <Stack>
        <Text>
          © 2024 CWG Progress Tracker. Made with &hearts; and&nbsp;
          <Link variant='underline' target='_blank' asChild>
            <NextLink href='https://raider.io'>Raider.io</NextLink>
          </Link>
          &nbsp;and&nbsp;
          <Link variant='underline' target='_blank' asChild>
            <NextLink href='https://www.warcraftlogs.com/'>
              Warcraft Logs
            </NextLink>
          </Link>
          &nbsp;by Charmy Rosewolf
        </Text>
      </Stack>
    </Flex>
  );
}
