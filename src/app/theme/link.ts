import { defineRecipe } from '@chakra-ui/react';

export const linkRecipe = defineRecipe({
  variants: {
    variant: {
      underline: {
        color: { base: 'blue.500', _dark: 'blue.300' },
        textDecoration: 'underline',
        _hover: {
          color: { base: 'blue.600', _dark: 'blue.400' }
        }
      },
      plain: {
        _hover: {
          color: { base: 'blue.600', _dark: 'blue.400' }
        }
      },
      header: {
        color: { base: 'black', _dark: 'white' },
        textDecoration: 'none',
        _hover: {
          color: { base: 'blue.600', _dark: 'blue.200' },
          textDecoration: 'none'
        }
      }
    }
  }
});
