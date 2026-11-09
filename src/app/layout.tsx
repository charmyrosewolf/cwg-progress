import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Box } from '@chakra-ui/react';

import { getHost } from '@/lib/utils/helper';

import { Providers } from './providers';
import { EmotionRegistry } from './registry';
import { fonts } from './fonts';
import './globals.css';
import Header from './components/header';
import Footer from './components/footer';
import NextRaidBanner from './components/next-raid-banner';

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

// Must be a literal (Next rejects identifiers here); mirrors REVALIDATION_TIME in lib/types,
// enforced by app/__tests__/layout-revalidate.test.ts.
export const revalidate = 14400;

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang='en' className={fonts.inter.variable} suppressHydrationWarning>
      {/* <body style={{ maxHeight: '100vh', overflow: 'hidden' }}> */}
      <body
        suppressHydrationWarning
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
        <EmotionRegistry>
        <Providers>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <Suspense fallback={null}>
            <NextRaidBanner />
          </Suspense>
          {/* header */}
          <Header />
          {/* main */}
          <Box as='main' id='main-content' flexGrow='1' w='100vw' maxW='100vw' p='0 2rem'>
            {children}
          </Box>
          {/* footer */}
          <Footer></Footer>
        </Providers>
        </EmotionRegistry>
      </body>
    </html>
  );
}
