import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  TableCaption,
  Show,
  Hide,
  Heading
} from '@chakra-ui/react';

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
      <Hide breakpoint={`(min-width: ${breakpoint})`}>
        <TableContainer maxWidth={maxWidth}>
          <Table colorScheme='gray' size='sm'>
            <TableCaption placement={'top'}>Table Key</TableCaption>
            <Tbody>
              <Tr>
                <Td className='N' textAlign={'center'}>
                  {labels[0]}
                </Td>
              </Tr>
              <Tr>
                <Td className='H' textAlign={'center'}>
                  {labels[1]}
                </Td>
              </Tr>
              <Tr>
                <Td className='M' textAlign={'center'}>
                  {labels[2]}
                </Td>
              </Tr>
            </Tbody>
          </Table>
        </TableContainer>
      </Hide>

      <Show breakpoint={`(min-width: ${breakpoint})`}>
        <TableContainer>
          <Table colorScheme='gray' size='sm'>
            <TableCaption placement={'top'}>Table Key</TableCaption>
            <Tbody>
              <Tr>
                <Td className='N' textAlign={'center'}>
                  {labels[0]}
                </Td>
                <Td className='H' textAlign={'center'}>
                  {labels[1]}
                </Td>
                <Td className='M' textAlign={'center'}>
                  {labels[2]}
                </Td>
              </Tr>
            </Tbody>
          </Table>
        </TableContainer>
      </Show>
    </>
  );
}
