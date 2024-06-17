import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// custome themes
import { tableTheme } from './theme/table';

const theme = extendTheme({
  fonts: {
    heading: 'var(--font-inter)',
    body: 'var(--font-inter)'
  },
  components: { Table: tableTheme },
  initialColorMode: 'light',
  useSystemColorMode: false
} as ThemeConfig);

export default theme;
