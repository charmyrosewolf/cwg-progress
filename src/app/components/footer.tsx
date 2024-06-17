'use client';
import { Link } from '@chakra-ui/next-js';
import { Flex, Stack, Text } from '@chakra-ui/react';

export default function Footer() {
  return (
    <Flex as='header' direction='column' align='center' w='100vw' p='1em'>
      <Stack>
        <Text>
          © 2024 CWG Progress Tracker. Made with &hearts; and&nbsp;
          <Link
            href='https://raider.io'
            target='_blank'
            color='blue.400'
            _hover={{ color: 'blue.500' }}
          >
            raider.io
          </Link>
          &nbsp;by Charmy Rosewolf
        </Text>
      </Stack>
    </Flex>
  );
}
