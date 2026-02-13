import { Table, Heading, Box, Text } from '@chakra-ui/react';
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
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>Guild</Table.ColumnHeader>
          {raid.encounters.map((b) => (
            <Table.ColumnHeader key={'header' + b.id}>
              {b.name.substring(0, b.name.indexOf(',')) || b.name}
            </Table.ColumnHeader>
          ))}
          <Table.ColumnHeader>Summary</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
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
        <Table.Cell textAlign='left'>
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
        </Table.Cell>
        {pr.raidEncounters.map((e) => (
          <Table.Cell
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
          </Table.Cell>
        ))}
        <Table.Cell key={`${pr.guild.slug}-normal`} className={difficulty}>
          {summary}
        </Table.Cell>
      </>
    );
  };

  return (
    <Table.ScrollArea key={report.raid.slug}>
      <Table.Root
        colorPalette='gray'
        size={['sm', null, null, 'md', null, 'lg']}
      >
        <Table.Caption captionSide='top'>
          <Heading as='h2'>{report.raid.name}</Heading>
        </Table.Caption>
        {report.raidProgression.length ? (
          <>
            {getHeader(report.raid)}
            <Table.Body>
              {report.raidProgression.map((pr) => (
                <Table.Row key={`${pr.guild.slug}`}>
                  {getCellData(pr)}
                </Table.Row>
              ))}
            </Table.Body>
          </>
        ) : (
          <>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader></Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Cell>
                <Box>
                  <InfoOutlineIcon size={80} />
                </Box>
                <Text m='1.25em' fontSize={'lg'}>
                  This season has no data yet.
                </Text>
              </Table.Cell>
            </Table.Body>
          </>
        )}
      </Table.Root>
    </Table.ScrollArea>
  );
}
