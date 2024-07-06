import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import {
  generateProgressReportBySlug,
  getRaidMetadata
} from '@/lib/report-progress.service';
import RaidProgress from './raid-progress';
import { RAIDS } from '@/lib/data';
import { RaidInfo } from '@/lib/types';
import { getHost } from '@/lib/helper';

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const { slug } = params;

  const raid = (await getRaidMetadata(slug)) as RaidInfo;

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
  return RAIDS.map((post) => ({
    slug: post.slug
  }));
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
