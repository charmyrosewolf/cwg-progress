import { useColorMode, useColorModeValue } from '@/components/ui/color-mode';
import { ClientOnly, IconButton, Skeleton, VStack } from '@chakra-ui/react';
import { MoonIcon, SunIcon } from './chakra-components';

// export function ColorModeToggle() {
//   const { colorMode, toggleColorMode } = useColorMode();

//   return (
//     <Button onClick={toggleColorMode}>
//       Toggle {colorMode === 'light' ? 'Dark' : 'Light'}
//     </Button>
//   );
// }

function ColorModeToggle() {
  // Chakra UI hook that toggle the color mode
  const { toggleColorMode } = useColorMode();
  return (
    <VStack>
      <ClientOnly fallback={<Skeleton boxSize='12' />}>
        <IconButton
          aria-label={useColorModeValue(
            'change to dark mode',
            'change to light mode'
          )}
          variant='outline'
          colorPalette='black'
          size='lg'
          onClick={toggleColorMode}
        >
          {useColorModeValue(<MoonIcon />, <SunIcon />)}
        </IconButton>
      </ClientOnly>
    </VStack>
  );
}

export default ColorModeToggle;
