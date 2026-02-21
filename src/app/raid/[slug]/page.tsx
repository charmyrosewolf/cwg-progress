import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import {
  generateProgressReportBySlug,
  getAllRaidMetadata,
  getRaidMetadata
} from '@/lib/reports/report';
import { getRAIDS } from '@/lib/data';
import { RaidInfo } from '@/lib/types';
import { getHost } from '@/lib/utils/helper';

import RaidProgress from './raid-progress';

type PageParams = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params
}: PageParams): Promise<Metadata> {
  const { slug } = await params;

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

export default async function Page({ params }: PageParams) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  const [report, raids] = await Promise.all([
    getRaidProgress(slug),
    getRAIDS()
  ]);

  if (!report) {
    notFound();
  }

  return <RaidProgress progressReport={report} raids={raids} />;
}
