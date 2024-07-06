import { defineStyle, defineStyleConfig } from '@chakra-ui/react';

const defaultStyle = defineStyle({
  color: 'blue.400',

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

const nav = defineStyle({
  color: 'black',

  _hover: {
    textDecoration: 'none'
    // color: 'blue.500'
  },

  _dark: {
    color: 'white',
    // color: 'blue.100',

    _hover: {
      // color: 'blue.500'
    }
  }
});

export const linkTheme = defineStyleConfig({
  variants: { nav },
  baseStyle: defaultStyle
});

// Now we can use the new `nav` variant
// <Link variant="basic">...</Link>
