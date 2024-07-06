// TABLE VARIANT
import { isDevelopment } from '@/lib/helper';
import { tableAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers, defineStyle } from '@chakra-ui/react';

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(tableAnatomy.keys);

const fit = defineStyle({
  fontSize: 'sm',
  px: '2',
  h: '100'
});

const sizes = {
  fit: definePartsStyle({ th: fit, td: fit, caption: fit })
};

const variantCustom = definePartsStyle((props) => {
  const { colorScheme: c, colorMode } = props;

  if (isDevelopment()) {
    console.log('colorMode', c, colorMode);
  }

  return {
    tr: {
      'td:first-of-type': {
        borderTopLeftRadius: 'full',
        borderBottomLeftRadius: 'full'
      },
      'td:last-of-type': {
        borderTopRightRadius: 'full',
        borderBottomRightRadius: 'full'
      }
    },
    th: {
      '&[data-is-numeric=true]': {
        textAlign: 'end'
      },
      whiteSpace: 'wrap'
    },
    td: {
      '&[data-is-numeric=true]': {
        textAlign: 'end'
      }
    },
    caption: {
      color: colorMode === 'light' ? `${c}.600` : `${c}.100`
    },
    tbody: {
      tr: {
        'th, td': {
          borderBottomWidth: '1px',
          borderRightWidth: '1px',

          '&:last-of-type': {
            borderRightWidth: 0
          }
        },

        '&:nth-of-type(odd)': {
          'th, td': {
            borderColor: colorMode === 'light' ? `${c}.100` : `${c}.700`,
            width: '1px'
          },
          td: {
            background: colorMode === 'light' ? `${c}.100` : `${c}.700`
          }
        },
        '&:nth-of-type(even)': {
          'th, td': {
            borderColor: colorMode === 'light' ? `${c}.300` : `${c}.600`
          },
          td: {
            background: colorMode === 'light' ? `${c}.300` : `${c}.600`
          }
        },
        'td.normal, td.N': {
          background: colorMode === 'light' ? `green.100` : `green.700`
        },
        'td.heroic, td.H': {
          background: colorMode === 'light' ? `blue.100` : `blue.700`
        },
        'td.mythic, td.M': {
          background: colorMode === 'light' ? `purple.100` : `purple.700`
        }
      }
    },
    tfoot: {
      tr: {
        '&:last-of-type': {
          th: { borderBottomWidth: 0 }
        }
      }
    }
  };
});

export const tableTheme = defineMultiStyleConfig({
  variants: { variantCustom },
  // sizes: sizes
  defaultProps: {
    // size: 'sm',
    variant: 'variantCustom'
  }
});
