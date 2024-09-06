import { RAIDS } from '@/lib/data';
import { ProgressReport, RaidInfo, SummaryReport } from '@/lib/types';

import {
  generateProgressReport,
  generateSummaryReport
} from './report-progress.service';

/**
 * Generates statistics summary for current season by raid name slug
 * */
export async function generateSummaryReportBySlug(
  slug: string
): Promise<SummaryReport | null> {
  console.log('\ngenerating statistics for:', slug);

  const raid = RAIDS.find((r) => r.slug === slug);

  // raid may not exist
  if (!raid) return null;

  const report = await generateSummaryReport(raid);

  return report;
}

/**
 * Generates a report for current season by raid name slug
 * */
export async function generateProgressReportBySlug(
  slug: string
): Promise<ProgressReport | null> {
  console.log('\ngenerating report for:', slug);

  const raid = RAIDS.find((r) => r.slug === slug);

  // raid may not exist
  if (!raid) return null;

  const report = await generateProgressReport(raid);

  return report;
}

/**
 * Get raid metadata
 * */
export async function getRaidMetadata(slug: string): Promise<RaidInfo | null> {
  const raid = RAIDS.find((r) => r.slug === slug);

  // raid may not exist
  if (!raid) return null;

  return raid;
}

/**
 * Get all raid metadata
 * */
export async function getAllRaidMetadata(): Promise<RaidInfo[] | null> {
  // raid may not exist
  if (!RAIDS) return null;

  return RAIDS;
}
