/* theme.ts */
import { extendTheme } from '@chakra-ui/react';
import { tableTheme } from './theme/table';

export const theme = extendTheme({
  fonts: {
    heading: 'var(--font-inter)',
    body: 'var(--font-inter)'
  },
  components: { Table: tableTheme }
});
