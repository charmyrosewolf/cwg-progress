'use client';
import NextLink from 'next/link';
import { Flex, Heading, Box, Button, Stack, Link } from '@chakra-ui/react';
import ColorModeToggle from './color-mode-toggle';
import CustomLink from './custom-link';

const name = 'CWG Progress';

interface HeaderProps {}

export default function Header({}: HeaderProps) {
  return (
    <Flex as='header' direction='column' align='center' w='100vw'>
      <Stack
        p='1em 2em'
        direction={['column', 'row']}
        align='center'
        w='100%'
        justifyContent={'space-between'}
      >
        <Box w='10rem'></Box>
        <Heading
          justifySelf='center'
          as='h1'
          m='1rem 0'
          fontSize={'2.6rem'}
          lineHeight='normal'
        >
          {/* @ts-expect-error - custom variant from linkRecipe in theme */}
          <Link variant='header' asChild>
            <NextLink href='/'>{name}</NextLink>
          </Link>
        </Heading>
        <Stack
          w='10rem'
          direction={'row'}
          justifyContent={'space-around'}
          alignItems={'flex-end'}
        >
          <CustomLink href={`/help`} variant='plain'>
            <Button size='lg' variant='surface' px='6'>
              Help
            </Button>
          </CustomLink>
          <ColorModeToggle />
        </Stack>
      </Stack>
    </Flex>
  );
}
