'use client';
import {
  Flex,
  Heading,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Button,
  Stack
} from '@chakra-ui/react';
import { Link } from '@chakra-ui/next-js';
import ColorModeToggle from './color-mode-toggle';
import CustomLink from './custom-link';

const name = 'CWG Progress';

interface HeaderProps {}

export default function Header({}: HeaderProps) {
  return (
    <Flex as='header' direction='column' align='center' w='100vw'>
      <Alert status='error'>
        <AlertIcon />
        <AlertTitle textTransform='uppercase'>
          Site under construction
        </AlertTitle>
        <AlertDescription>
          Please contact CharmyRosewolf on discord with any inconsistencies. You
          may also{' '}
          <CustomLink
            href='https://github.com/charmyrosewolf/cwg-progress/issues'
            target='_blank'
          >
            report bugs on Github
          </CustomLink>
        </AlertDescription>
      </Alert>

      <Stack
        p='1em 2em'
        direction={['column', 'row']}
        align='center'
        w='100%'
        justifyContent={'space-between'}
      >
        <Box w='10rem'></Box>
        <Heading justifySelf='center' as='h1' m='1rem 0' fontSize={'2.6rem'}>
          <Link variant='nav' href='/'>
            {name}
          </Link>
        </Heading>
        <Stack
          w='10rem'
          direction={'row'}
          justifyContent={'space-around'}
          alignItems={'flex-end'}
        >
          <CustomLink href={`/help`} textDecoration='underline'>
            <Button size='lg'>Help</Button>
          </CustomLink>
          <ColorModeToggle />
        </Stack>
      </Stack>
    </Flex>
  );
}
