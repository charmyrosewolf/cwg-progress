// Any images need the basePath
// import Image from 'next/image';
import styles from './page.module.css';
import { GuildRaidProgress, RaidInfo, ProgressReport } from './lib/types';
import {
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer
} from '@chakra-ui/react';

import { generateProgressReport } from './lib/report-progress.service';

export default async function Page() {
  const reports = await generateProgressReport();

  return <Home progressReports={reports}></Home>;
}

type HomeProps = { progressReports: ProgressReport[] };

async function Home({ progressReports }: HomeProps) {
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
        <Td>{pr.guild.name}</Td>
        {pr.raidEncounters.map((e) => (
          <Td
            key={`${pr.guild.slug}-${e.slug}`}
            className={`${e.maxDifficultyDefeated}`}
          >
            {e.defeatedAt ? 'YES' : 'NO'}
          </Td>
        ))}
        <Td key={`${pr.guild.slug}-normal`} className={difficulty}>
          {pr.stats.summary}
        </Td>
      </>
    );
  };

  const getTable = (report: ProgressReport) => {
    if (!report) return <>No Data Available</>;

    return (
      <TableContainer key={report.raid.slug}>
        {/* <TableContainer width={{ base: 'full', md: '100%' }} mx='auto'> */}
        <Table colorScheme='gray'>
          <TableCaption placement={'top'}>{report.raid.name}</TableCaption>
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
  };

  const getSummaryTable = () => {
    return <>temp</>;
  };

  return (
    <main className={styles.main}>
      <div className={styles.description}>This is under construction</div>

      {progressReports && progressReports.length
        ? 'Summary Table here'
        : 'NO DATA AVAILABLE'}

      {/* Create Summary table to mitigate space  issues? */}
      {progressReports && progressReports.length
        ? progressReports.map(getTable)
        : 'NO DATA AVAILABLE'}

      <div className={styles.grid}></div>
    </main>
  );
}
