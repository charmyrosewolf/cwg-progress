import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import {
  IconButton,
  VStack,
  useColorMode,
  useColorModeValue
} from '@chakra-ui/react';

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
      <IconButton
        aria-label={useColorModeValue(
          'change to dark mode',
          'change to light mode'
        )}
        variant='outline'
        colorScheme='black'
        size='lg'
        icon={useColorModeValue(<MoonIcon />, <SunIcon />)}
        onClick={toggleColorMode}
      />
    </VStack>
  );
}

export default ColorModeToggle;
