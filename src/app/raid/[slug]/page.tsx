import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import {
  generateProgressReportBySlug,
  getAllRaidMetadata,
  getRaidMetadata
} from '@/lib/reports/report';
import { RaidInfo } from '@/lib/types';
import { getHost } from '@/lib/utils/helper';

import RaidProgress from './raid-progress';

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const { slug } = params;

  const raid = (await getRaidMetadata(slug)) as RaidInfo;

  if (!raid) {
    return notFound();
  }

  const title = raid.name;
  const description = `See ${raid.name} progress for guilds in the CWG community`;

  return {
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
}

/* Generates all raid progress routes using slug */
export async function generateStaticParams() {
  const raids = await getAllRaidMetadata();

  return raids && raids.length
    ? raids.map((post) => ({
        slug: post.slug
      }))
    : [];
}

async function getRaidProgress(slug: string) {
  return await generateProgressReportBySlug(slug);
}

export default async function Page({ params }: { params: { slug: string } }) {
  const { slug } = params;

  if (!slug) {
    notFound();
  }

  const report = await getRaidProgress(slug);

  if (!report) {
    notFound();
  }

  return <RaidProgress progressReport={report} />;
}
