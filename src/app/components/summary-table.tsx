import {
  GuildRaidProgress,
  GuildRaidProgressStats,
  KeysOfUnion,
  ProgressReport
} from '@/lib/types';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer
} from '@chakra-ui/react';
import CustomLink from './custom-link';

type SummaryTableProps = {
  progressReport: ProgressReport;
  maxWidth?: string;
};

export default function SummaryTable({
  progressReport,
  maxWidth = '100%'
}: SummaryTableProps) {
  const statKeys = Object.keys(
    progressReport.raidProgression[0].stats
  ) as KeysOfUnion<GuildRaidProgressStats>[];

  const getCellData = (gp: GuildRaidProgress) => {
    const difficulty = gp.stats.summary[gp.stats.summary.length - 1]; // H, N or M

    return (
      <>
        <Td>{gp.guild?.displayName || gp.guild.name}</Td>
        {statKeys.map((k: KeysOfUnion<GuildRaidProgressStats>) => (
          <Td key={`${gp.guild.slug}-${k}`} className={difficulty}>
            {gp.stats[k]}
          </Td>
        ))}
      </>
    );
  };

  const getFirstWordInCamel = (camel: string): string => {
    const camelCase = camel.replace(/([a-z])([A-Z])/g, '$1 $2');

    return camelCase.split(' ')[0];
  };

  return (
    <TableContainer maxWidth={maxWidth}>
      <Table colorScheme='gray' size='sm'>
        <TableCaption placement={'top'} fontSize='1.5rem'>
          <CustomLink
            href={`/raid/${progressReport.raid.slug}`}
            textDecoration='underline'
          >
            {progressReport.raid.name}
          </CustomLink>
        </TableCaption>
        <Thead>
          <Tr>
            <Th>Guild</Th>
            {statKeys.map((k: string) => (
              <Th key={'header-' + k}>{getFirstWordInCamel(k)}</Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {progressReport.raidProgression.map((pr) => (
            <Tr key={`${pr.guild.slug}-summary`}>{getCellData(pr)}</Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}
