import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// custome themes
import { tableTheme } from './theme/table';
import { linkTheme } from './theme/link';

const theme = extendTheme({
  fonts: {
    heading: 'var(--font-inter)',
    body: 'var(--font-inter)'
  },
  components: { Table: tableTheme, Link: linkTheme },
  initialColorMode: 'light',
  useSystemColorMode: false
} as ThemeConfig);

export default theme;
