/**
 * Dev-mode file-system cache to protect API rate limits.
 * Next.js dev mode ignores force-cache on refreshes, so we cache to disk.
 * In production, page-level ISR handles caching instead.
 *
 * Uses dynamic imports for fs/path so webpack doesn't bundle them for client.
 */

import { REVALIDATION_TIME } from '@/lib/types';

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * @param key - unique cache key (used as filename)
 * @param fetcher - async function that fetches fresh data
 * @param ttlSeconds - time-to-live in seconds (default: REVALIDATION_TIME)
 */
export async function devCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = REVALIDATION_TIME
): Promise<T> {
  if (!isDevelopment) {
    return fetcher();
  }

  // Dynamic imports so fs/path aren't bundled for client components
  const fs = await import('fs');
  const path = await import('path');

  const cacheDir = path.join(process.cwd(), '.next', 'cache', 'dev-api');
  const cacheFile = path.join(cacheDir, `${key}.json`);

  // Check if cached file exists and is fresh
  try {
    const stat = fs.statSync(cacheFile);
    const ageSeconds = (Date.now() - stat.mtimeMs) / 1000;

    if (ageSeconds < ttlSeconds) {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
      console.log(`[dev-cache] HIT: ${key} (${Math.round(ageSeconds)}s old)`);
      return cached as T;
    }
  } catch {
    // File doesn't exist or can't be read — fetch fresh
  }

  console.log(`[dev-cache] MISS: ${key} — fetching fresh data`);
  const data = await fetcher();

  // Write to cache
  try {
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(cacheFile, JSON.stringify(data));
  } catch (err) {
    console.warn(`[dev-cache] Failed to write cache for ${key}:`, err);
  }

  return data;
}
