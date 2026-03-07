'use client';
import NextLink from 'next/link';
import { Flex, Stack, Text, Link, VisuallyHidden } from '@chakra-ui/react';

export default function Footer() {
  return (
    <Flex as='footer' direction='column' align='center' w='100vw' p='1em'>
      <Stack>
        <Text fontSize='sm'>
          © 2024 CWG Progress Tracker. Made with &hearts; and&nbsp;
          <Link variant='underline' target='_blank' rel='noopener noreferrer' asChild>
            <NextLink href='https://raider.io'>
              Raider.io
              <VisuallyHidden>(opens in new tab)</VisuallyHidden>
            </NextLink>
          </Link>
          &nbsp;and&nbsp;
          <Link variant='underline' target='_blank' rel='noopener noreferrer' asChild>
            <NextLink href='https://www.warcraftlogs.com/'>
              Warcraft Logs
              <VisuallyHidden>(opens in new tab)</VisuallyHidden>
            </NextLink>
          </Link>
        </Text>
      </Stack>
    </Flex>
  );
}
