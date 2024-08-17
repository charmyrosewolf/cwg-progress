import { defineStyle, defineStyleConfig } from '@chakra-ui/react';

const defaultStyle = defineStyle({
  color: 'blue.400',
  textDecoration: 'underline',

  _hover: {
    color: 'blue.500'
  },

  _dark: {
    color: 'blue.100',

    _hover: {
      color: 'blue.200'
    }
  }
});

const header = defineStyle({
  color: 'black',
  textDecoration: 'none',

  _hover: {
    textDecoration: 'none'
  },

  _dark: {
    color: 'white',

    _hover: {}
  }
});

export const linkTheme = defineStyleConfig({
  variants: { header },
  baseStyle: defaultStyle
});

// Now we can use the new `header` variant
// <Link variant="header">...</Link>
