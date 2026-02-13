'use client';
import NextLink from 'next/link';
import { IconButton, Link } from '@chakra-ui/react';
import { LuExternalLink } from 'react-icons/lu';
import { IconType } from 'react-icons';

type LinkProps = {
  href: string;
  Icon?: IconType;
  [key: string]: any;
};

export default function CustomLink({
  children,
  href,
  iconName,
  Icon = LuExternalLink,
  ...restProps
}: LinkProps) {
  if (iconName && iconName === 'external') {
    return (
      <Link variant='underline' {...restProps} asChild>
        <NextLink href={href}>
          <IconButton aria-label='Go to Wlog' size='sm'>
            <Icon />
          </IconButton>
        </NextLink>
      </Link>
    );
  } else {
    return (
      <Link variant='underline' {...restProps} asChild>
        <NextLink href={href}>{children}</NextLink>
      </Link>
    );
  }
}
