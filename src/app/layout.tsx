import type { Metadata } from 'next';

import { Providers } from './providers';
import { fonts } from './fonts';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'CWG Progress',
  description:
    'A website to track progress of raid progress in the Christian WoW guilds community'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' className={fonts.inter.variable}>
      <body>
        <Providers>
          {/* header */}
          <header>CWG Progress</header>
          {/* main */}
          <main>{children}</main>
          {/* footer */}
          <footer>
            Made with &hearts; and
            <Link href={'https://raider.io'} target='_blank'>
              raider.io
            </Link>
            by Charmy Rosewolf
          </footer>
        </Providers>
      </body>
    </html>
  );
}
