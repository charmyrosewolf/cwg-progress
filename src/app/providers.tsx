// app/providers.tsx
'use client';

import { ChakraProvider } from '@chakra-ui/react';
import { ColorModeProvider } from '@/components/ui/color-mode';
import { system } from './theme';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider>{children}</ColorModeProvider>
    </ChakraProvider>
  );
}
