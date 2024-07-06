import { Spinner, Stack } from '@chakra-ui/react';

export default function LoadingVisual() {
  return (
    <Stack direction='row' spacing={4}>
      <Spinner size='xl' label='loading spinner' />
    </Stack>
  );
}
