import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { generateProgressReportBySlug } from '@/app/lib/report-progress.service';
import RaidProgress from './raid-progress';
import { RAIDS } from '@/app/lib/data';

// export async function generateMetadata({ params }: any): Promise<Metadata> {
//   const { slug } = params;

//   const post = await getBlogPost(slug);

//   const { title, description, createdOn, updatedOn, tags } = post.metadata;

//   // viewport?
//   return {
//     title: title,
//     description: description,
//     openGraph: {
//       title: title,
//       description: description,
//       type: 'article',
//       publishedTime: `${createdOn}T00:00:00.000Z`,
//       modifiedTime: `${updatedOn ? updatedOn : createdOn}T00:00:00.000Z`,
//       authors: ['Charmy Rosewolf'],
//       tags: tags
//       // images: ['/some-specific-page-image.jpg', ...previousImages]
//     }
//   };
// }

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
