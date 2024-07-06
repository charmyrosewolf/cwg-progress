'use client';
import { Link } from '@chakra-ui/next-js';

type LinkProps = {
  href: string;
  [key: string]: any;
};

export default function CustomLink({ children, ...restProps }: LinkProps) {
  return <Link {...restProps}>{children}</Link>;
}
