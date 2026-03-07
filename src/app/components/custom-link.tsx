'use client';
import NextLink from 'next/link';
import { IconButton, Link, VisuallyHidden } from '@chakra-ui/react';
import { LuExternalLink } from 'react-icons/lu';
import { IconType } from 'react-icons';

type LinkProps = {
  href: string;
  Icon?: IconType;
  iconName?: string;
  target?: string;
  [key: string]: any;
};

export default function CustomLink({
  children,
  href,
  iconName,
  Icon = LuExternalLink,
  target,
  ...restProps
}: LinkProps) {
  if (iconName && iconName === 'external') {
    return (
      <Link variant='underline' target={target} {...restProps} asChild>
        <NextLink href={href}>
          <IconButton aria-label='External link (opens in new tab)' size='sm'>
            <Icon />
          </IconButton>
        </NextLink>
      </Link>
    );
  } else {
    return (
      <Link variant='underline' target={target} {...restProps} asChild>
        <NextLink href={href}>
          {children}
          {target === '_blank' && (
            <VisuallyHidden>(opens in new tab)</VisuallyHidden>
          )}
        </NextLink>
      </Link>
    );
  }
}
