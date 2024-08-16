import { GuildRaidProgressStatistics, SummaryReport } from '@/lib/types';
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
  summaryReport: SummaryReport;
  maxWidth?: string;
};

export default function SummaryTable({
  summaryReport,
  maxWidth = '100%'
}: SummaryTableProps) {
  const getCellData = (gp: GuildRaidProgressStatistics) => {
    const difficulty =
      gp.overallSummary.summary[gp.overallSummary.summary.length - 1]; // H, N or M
    const {
      summaries,
      guild: { displayName, name, slug }
    } = gp;

    const guildName = displayName || name;

    return (
      <>
        <Td textAlign='left'>{guildName}</Td>
        {summaries.map(({ level, summary }) => {
          return (
            <Td key={`${slug}-${level}`} className={difficulty}>
              {summary}
            </Td>
          );
        })}
      </>
    );
  };

  return (
    <TableContainer maxWidth={maxWidth}>
      <Table colorScheme='gray' size='sm'>
        <TableCaption placement={'top'} fontSize='1.5rem'>
          <CustomLink
            href={`/raid/${summaryReport.raid.slug}`}
            textDecoration='underline'
          >
            {summaryReport.raid.name}
          </CustomLink>
        </TableCaption>
        <Thead>
          <Tr>
            <Th>Guild</Th>
            <Th>Normal</Th>
            <Th>Heroic</Th>
            <Th>Mythic</Th>
          </Tr>
        </Thead>
        <Tbody>
          {summaryReport.summaries.map((sr) => (
            <Tr key={`${sr.guild.slug}-summary`}>{getCellData(sr)}</Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}
