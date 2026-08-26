import { type Page, type Locator, expect } from '@playwright/test';

/**
 * The page renders the colour-key legend as a <table> too, so "the first table"
 * is not a raid table. Raid tables are the ones with a Guild column.
 */
export function raidTables(page: Page): Locator {
  return page
    .getByRole('table')
    .filter({ has: page.getByRole('columnheader', { name: 'Guild' }) });
}

/** Every raid heading links to /raid/<slug> from its table caption. */
export function raidLinks(page: Page): Locator {
  return page.locator('a[href^="/raid/"]');
}

export async function firstRaidHref(page: Page): Promise<string> {
  await page.goto('/');

  const link = raidLinks(page).first();
  await expect(link).toBeVisible();

  const href = await link.getAttribute('href');
  expect(href).toBeTruthy();

  return href!;
}

/** Recent-update entries read "<Guild> defeated <Boss>" or "…new best of …". */
export function recentUpdateEntries(page: Page): Locator {
  return page.getByText(/\b(defeated|achieved a new best of)\b/);
}
