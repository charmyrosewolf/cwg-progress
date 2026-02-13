import { defineSlotRecipe } from '@chakra-ui/react';

export const tableSlotRecipe = defineSlotRecipe({
  slots: [],
  variants: {
    variant: {
      variantCustom: {
        row: {
          '& td:first-of-type': {
            borderTopLeftRadius: 'full',
            borderBottomLeftRadius: 'full'
          },
          '& td:last-of-type': {
            borderTopRightRadius: 'full',
            borderBottomRightRadius: 'full'
          }
        },
        columnHeader: {
          '&[data-is-numeric=true]': { textAlign: 'end' },
          whiteSpace: 'wrap'
        },
        cell: {
          textAlign: 'center',
          '&[data-is-numeric=true]': { textAlign: 'end' }
        },
        caption: {
          color: { base: 'colorPalette.600', _dark: 'colorPalette.100' },
          textStyle: 'md'
        },
        body: {
          '& tr': {
            '& th, & td': {
              borderBottomWidth: '1px',
              borderRightWidth: '1px',
              '&:last-of-type': { borderRightWidth: 0 }
            },
            '&:nth-of-type(odd) td': {
              borderColor: {
                base: 'colorPalette.100',
                _dark: 'colorPalette.700'
              },
              background: {
                base: 'colorPalette.100',
                _dark: 'colorPalette.700'
              }
            },
            '&:nth-of-type(even) td': {
              borderColor: {
                base: 'colorPalette.300',
                _dark: 'colorPalette.600'
              },
              background: {
                base: 'colorPalette.300',
                _dark: 'colorPalette.600'
              }
            },
            '& td.normal, & td.N': {
              background: { base: 'green.100', _dark: 'green.700' }
            },
            '& td.heroic, & td.H': {
              background: { base: 'blue.100', _dark: 'blue.700' }
            },
            '& td.mythic, & td.M': {
              background: { base: 'purple.100', _dark: 'purple.700' }
            }
          }
        },
        footer: {
          '& tr:last-of-type th': { borderBottomWidth: 0 }
        }
      }
    },
    size: {
      sm: {
        columnHeader: { px: '4', py: '2' },
        cell: { px: '4', py: '2' }
      },
      md: {
        columnHeader: { px: '6', py: '3' },
        cell: { px: '6', py: '3' }
      },
      lg: {
        columnHeader: { px: '8', py: '4' },
        cell: { px: '8', py: '4' }
      }
    }
  },
  defaultVariants: {
    variant: 'variantCustom'
  }
});
