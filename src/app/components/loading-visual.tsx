import { Spinner, Stack } from '@chakra-ui/react';

export default function LoadingVisual() {
  return (
    <Stack direction='row' gap={4}>
      <Spinner size='xl' aria-label='loading spinner' />
    </Stack>
  );
}
