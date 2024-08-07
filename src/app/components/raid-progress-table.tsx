import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
  Heading
} from '@chakra-ui/react';
import { GuildRaidProgress, ProgressReport, RaidInfo } from '@/lib/types';

type RaidProgressTableProps = {
  report: ProgressReport;
};

export default function RaidProgressTable({ report }: RaidProgressTableProps) {
  const getHeader = (raid: RaidInfo) => {
    return (
      <Thead>
        <Tr>
          <Th>Guild</Th>
          {raid.encounters.map((b) => (
            <Th key={'header' + b.id}>
              {b.name.substring(0, b.name.indexOf(',')) || b.name}
            </Th>
          ))}
          <Th>Summary</Th>
        </Tr>
      </Thead>
    );
  };

  // todo: should I use RaidInfo.encounters here?
  const getCellData = (pr: GuildRaidProgress) => {
    const difficulty = pr.stats.summary[pr.stats.summary.length - 1]; // H, N or M

    return (
      <>
        <Td>{pr.guild?.displayName || pr.guild.name}</Td>
        {pr.raidEncounters.map((e) => (
          <Td
            key={`${pr.guild.slug}-${e.slug}`}
            className={`${e.maxDifficultyDefeated}`}
          >
            {e.maxDifficultyAttempted &&
            e.maxDifficultyAttempted !== e.maxDifficultyDefeated
              ? `${
                  e.lowestBossPercentage
                }% ${e.maxDifficultyAttempted[0].toUpperCase()}`
              : null}
          </Td>
        ))}
        <Td key={`${pr.guild.slug}-normal`} className={difficulty}>
          {pr.stats.summary}
        </Td>
      </>
    );
  };

  return (
    <TableContainer key={report.raid.slug}>
      <Table colorScheme='gray' size={['sm', null, null, 'md', null, 'lg']}>
        <TableCaption placement={'top'}>
          <Heading as='h2'>{report.raid.name}</Heading>
        </TableCaption>
        {getHeader(report.raid)}
        <Tbody>
          {report.raidProgression.map((pr) => (
            <Tr key={`${pr.guild.slug}`}>{getCellData(pr)}</Tr>
          ))}
        </Tbody>
        {/* <Tfoot>
            <Tr>
              <Th>Guild</Th>
              {RAID.encounters.map((e) => (
                <Th key={'footer' + e.id}>{e.name}</Th>
              ))}
            </Tr>
          </Tfoot> */}
      </Table>
    </TableContainer>
  );
}
