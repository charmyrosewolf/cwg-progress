'use client';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { Link } from '@chakra-ui/next-js';
import { ComponentWithAs, IconButton, IconProps } from '@chakra-ui/react';

type LinkProps = {
  href: string;
  Icon?: ComponentWithAs<'svg', IconProps>;
  [key: string]: any;
};

export default function CustomLink({
  children,
  iconName,
  ...restProps
}: LinkProps) {
  if (iconName && iconName === 'external') {
    return (
      <Link {...restProps}>
        <IconButton
          aria-label='Go to Wlog'
          size='s'
          icon={<ExternalLinkIcon />}
        />
      </Link>
    );
  } else {
    return <Link {...restProps}>{children}</Link>;
  }
}
