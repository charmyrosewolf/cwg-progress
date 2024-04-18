import { getTime } from '@/utils';
// import Image from 'next/image'; // Any images need the basePath
import styles from './page.module.css';

export default async function Page() {
  const data = await getTime();

  const date = new Date(data.datetime);

  return (
    <Home
      time={`${date.toDateString()} ${date.toLocaleTimeString()} EST`}
    ></Home>
  );
}

type HomeProps = { time: any };

async function Home({ time }: HomeProps) {
  console.log('time', time);
  return (
    <main className={styles.main}>
      <div className={styles.description}>This is a test</div>

      <div className={styles.center}>{time}</div>

      <div className={styles.grid}></div>
    </main>
  );
}
