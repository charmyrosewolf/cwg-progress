import { FightData, createReport } from '@/app/lib/utils';
// Any images need the basePath
// import Image from 'next/image';
import styles from './page.module.css';

export default async function Page() {
  const report = await createReport();

  // console.log('REPORT DATA');
  // console.log(report);

  return <Home report={report}></Home>;
}

type HomeProps = { report: FightData[] };

async function Home({ report }: HomeProps) {
  const reportDataTest = report[0]?.name;
  return (
    <main className={styles.main}>
      <div className={styles.description}>This is a test</div>

      <div className={styles.center}>
        {reportDataTest ? reportDataTest : 'NO DATA'}
      </div>

      <div className={styles.grid}></div>
    </main>
  );
}
