import { Table, Box } from '@chakra-ui/react';

type TableKeyProps = {
  maxWidth?: string;
  labels: string[];
  breakpoint?: string; // when to hide vertical and show horizontal
};

export default function TableKey({
  maxWidth = '100%',
  breakpoint = '1200px',
  labels
}: TableKeyProps) {
  return (
    <>
      {/* Vertical layout — hidden on wide screens */}
      <Box css={{ [`@media (min-width: ${breakpoint})`]: { display: 'none' } }}>
        <Table.ScrollArea maxWidth={maxWidth}>
          <Table.Root colorPalette='gray' size='sm'>
            <Table.Caption captionSide='top'>Table Key</Table.Caption>
            <Table.Body>
              <Table.Row>
                <Table.Cell className='N' textAlign={'center'}>
                  {labels[0]}
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell className='H' textAlign={'center'}>
                  {labels[1]}
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell className='M' textAlign={'center'}>
                  {labels[2]}
                </Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
      </Box>

      {/* Horizontal layout — shown on wide screens */}
      <Box
        css={{
          display: 'none',
          [`@media (min-width: ${breakpoint})`]: { display: 'block' }
        }}
      >
        <Table.ScrollArea>
          <Table.Root colorPalette='gray' size='sm'>
            <Table.Caption captionSide='top'>Table Key</Table.Caption>
            <Table.Body>
              <Table.Row>
                <Table.Cell className='N' textAlign={'center'}>
                  {labels[0]}
                </Table.Cell>
                <Table.Cell className='H' textAlign={'center'}>
                  {labels[1]}
                </Table.Cell>
                <Table.Cell className='M' textAlign={'center'}>
                  {labels[2]}
                </Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
      </Box>
    </>
  );
}
