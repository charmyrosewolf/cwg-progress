import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { REVALIDATION_TIME } from '@/lib/types';

// Next's segment-config extractor only accepts a literal for `revalidate`; an identifier
// trips "Invalid segment configuration export detected" at build time (always on Vercel,
// which collects page data with one worker). Source text check keeps it a literal in sync.
describe('layout revalidate export', () => {
  const source = readFileSync(resolve(__dirname, '../layout.tsx'), 'utf8');

  it('is a numeric literal equal to REVALIDATION_TIME', () => {
    const match = source.match(/^export const revalidate = (\d+);/m);

    expect(match, 'layout.tsx must export revalidate as a numeric literal').not.toBeNull();
    expect(Number(match?.[1])).toBe(REVALIDATION_TIME);
  });
});
