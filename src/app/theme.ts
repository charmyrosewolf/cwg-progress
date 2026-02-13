import {
  createSystem,
  defaultConfig,
  defineConfig,
  mergeConfigs
} from '@chakra-ui/react';
import { tableSlotRecipe } from './theme/table';
import { linkRecipe } from './theme/link';

const customConfig = defineConfig({
  theme: {
    tokens: {
      fonts: {
        heading: { value: 'var(--font-inter)' },
        body: { value: 'var(--font-inter)' }
      }
    },
    recipes: {
      link: linkRecipe
    },
    slotRecipes: {
      table: tableSlotRecipe
    }
  }
});

export const system = createSystem(mergeConfigs(defaultConfig, customConfig));
