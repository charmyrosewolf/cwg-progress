import { GuildRaidProgressStatistics, SummaryReport } from '@/lib/types';
import { Table, Box, Text } from '@chakra-ui/react';
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
        {summaries.map(({ level, summary }) => {
          return (
            <Table.Cell key={`${slug}-${level}`} className={difficulty}>
              {summary}
            </Table.Cell>
          );
        })}
        <Table.Cell className={difficulty}>{currentProgression}</Table.Cell>
      </>
    );
  };

  return (
    <Table.ScrollArea maxWidth={maxWidth}>
      <Table.Root colorPalette='gray' size='sm'>
        <Table.Caption captionSide='top' fontSize='1.5rem'>
          <CustomLink
            href={`/raid/${summaryReport.raid.slug}`}
            textDecoration='underline'
          >
            {summaryReport.raid.name}
          </CustomLink>
        </Table.Caption>
        {summaryReport.summaries.length ? (
          <>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Guild</Table.ColumnHeader>
                <Table.ColumnHeader textAlign='center'>
                  Normal
                </Table.ColumnHeader>
                <Table.ColumnHeader textAlign='center'>
                  Heroic
                </Table.ColumnHeader>
                <Table.ColumnHeader textAlign='center'>
                  Mythic
                </Table.ColumnHeader>
                <Table.ColumnHeader textAlign='center'>
                  Current Boss
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {summaryReport.summaries.map((sr) => (
                <Table.Row key={`${sr.guild.slug}-summary`}>
                  {getCellData(sr)}
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
                  <InfoOutlineIcon size={48} />
                </Box>
                <Text m='1.25em' fontSize={'md'}>
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
