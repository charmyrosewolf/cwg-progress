import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
  Heading,
  Box,
  Text
} from '@chakra-ui/react';
import {
  GuildRaidEncounter,
  GuildRaidProgress,
  ProgressReport,
  RaidInfo
} from '@/lib/types';
import CustomLink from './custom-link';
import { InfoOutlineIcon } from './chakra-components';

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

  const getPercentage = (e: GuildRaidEncounter) => {
    const percentageString =
      e.maxDifficultyAttempted &&
      e.maxDifficultyAttempted !== e.maxDifficultyDefeated
        ? `${
            e.lowestBossPercentage
          }% ${e.maxDifficultyAttempted[0].toUpperCase()}`
        : null;

    if (!percentageString) {
      return <></>;
    }

    return e.wlogBestPullUrl ? (
      <CustomLink
        href={e.wlogBestPullUrl}
        textDecoration='underline'
        target='_blank'
      >
        {percentageString}
      </CustomLink>
    ) : (
      <>{percentageString}</>
    );
  };

  // todo: should I use RaidInfo.encounters here?
  const getCellData = (pr: GuildRaidProgress) => {
    const { summary } = pr.overallSummary;
    const difficulty = summary[summary.length - 1]; // H, N or M
    const {
      guild: { displayName, name, profileUrl }
    } = pr;

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
        {pr.raidEncounters.map((e) => (
          <Td
            key={`${pr.guild.slug}-${e.slug}`}
            className={`${e.maxDifficultyDefeated}`}
          >
            {e.wlogKillUrl ? (
              <Box>
                <CustomLink href={e.wlogKillUrl} target='_blank'>
                  {e?.maxDifficultyDefeated?.[0].toUpperCase()} Kill
                </CustomLink>
              </Box>
            ) : null}
            {getPercentage(e)}
          </Td>
        ))}
        <Td key={`${pr.guild.slug}-normal`} className={difficulty}>
          {summary}
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
        {report.raidProgression.length ? (
          <>
            {getHeader(report.raid)}
            <Tbody>
              {report.raidProgression.map((pr) => (
                <Tr key={`${pr.guild.slug}`}>{getCellData(pr)}</Tr>
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
                  <InfoOutlineIcon boxSize={20} />
                </Box>
                <Text m='1.25em' fontSize={'lg'}>
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
