import type { Metadata } from 'next';

import { Providers } from './providers';
import { fonts } from './fonts';
import './globals.css';
import { Box } from '@chakra-ui/react';
import Header from './components/header';
import Footer from './components/footer';
import { REVALIDATION_TIME } from '@/lib/types';

export const metadata: Metadata = {
  title: 'CWG Progress',
  description:
    'A website to track progress of raid progress in the Christian WoW guilds community'
};

type LayoutProps = Readonly<{
  children: React.ReactNode;
  home?: boolean;
}>;

export const revalidate = REVALIDATION_TIME;

export default function RootLayout({ children, home }: LayoutProps) {
  return (
    <html lang='en' className={fonts.inter.variable}>
      {/* <body style={{ maxHeight: '100vh', overflow: 'hidden' }}> */}
      <body
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          height: '100vh',
          minHeight: '100vh',
          maxWidth: '100vw'
        }}
      >
        <Providers>
          {/* header */}
          <Header isHome={!!home} />
          {/* main */}
          <Box as='main' flexGrow='1' w='100vw' maxW='100vw' p='0 2rem'>
            {children}
          </Box>
          {/* footer */}
          <Footer></Footer>
        </Providers>
      </body>
    </html>
  );
}
