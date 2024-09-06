import { GuildRaidProgressStatistics, SummaryReport } from '@/lib/types';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
  Box,
  Text
} from '@chakra-ui/react';
import CustomLink from './custom-link';
import { InfoOutlineIcon } from './chakra-components';

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
      currentProgression,
      summaries,
      guild: { displayName, name, slug, profileUrl }
    } = gp;

    const guildName = displayName || name;

    return (
      <>
        <Td textAlign='left'>
          {profileUrl ? (
            <CustomLink
              href={profileUrl}
              textDecoration='underline'
              target='_blank'
            >
              {guildName}
            </CustomLink>
          ) : (
            <>{guildName}</>
          )}
        </Td>
        {summaries.map(({ level, summary }) => {
          return (
            <Td key={`${slug}-${level}`} className={difficulty}>
              {summary}
            </Td>
          );
        })}
        <Td className={difficulty}>{currentProgression}</Td>
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
        {summaryReport.summaries.length ? (
          <>
            <Thead>
              <Tr>
                <Th>Guild</Th>
                <Th textAlign='center'>Normal</Th>
                <Th textAlign='center'>Heroic</Th>
                <Th textAlign='center'>Mythic</Th>
                <Th textAlign='center'>Current Boss</Th>
              </Tr>
            </Thead>
            <Tbody>
              {summaryReport.summaries.map((sr) => (
                <Tr key={`${sr.guild.slug}-summary`}>{getCellData(sr)}</Tr>
              ))}
            </Tbody>
          </>
        ) : (
          <>
            <Thead>
              <Tr>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              <Td>
                <Box>
                  <InfoOutlineIcon boxSize={12} />
                </Box>
                <Text m='1.25em' fontSize={'md'}>
                  This season has no data yet.
                </Text>
              </Td>
            </Tbody>
          </>
        )}
      </Table>
    </TableContainer>
  );
}
