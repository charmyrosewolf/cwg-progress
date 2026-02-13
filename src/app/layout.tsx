import type { Metadata } from 'next';
import { Box } from '@chakra-ui/react';

import { REVALIDATION_TIME } from '@/lib/types';
import { getHost } from '@/lib/utils/helper';

import { Providers } from './providers';
import { fonts } from './fonts';
import './globals.css';
import Header from './components/header';
import Footer from './components/footer';

const title = 'CWG Progress';
const description =
  'A progress tracking tool for the Christian WoW Guilds community';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: getHost(),
    siteName: `CWG Progress`,
    // tags: tags
    // images: ['/some-specific-page-image.jpg', ...previousImages]
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    creator: '@charmyrosewolf'
    // images: ['you_url_here']
  }
};

type LayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export const revalidate = REVALIDATION_TIME;

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang='en' className={fonts.inter.variable} suppressHydrationWarning>
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
          <Header />
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
