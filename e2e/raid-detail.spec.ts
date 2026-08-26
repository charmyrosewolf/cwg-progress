import { test, expect } from '@playwright/test';
import { firstRaidHref } from './helpers';

/**
 * Smoke coverage for the per-raid progress page and the help page.
 * The raid slug is discovered from the home page so this suite keeps working
 * across tier changes.
 */

test.describe('raid detail page', () => {
  test('renders a progress table for the raid', async ({ page }) => {
    await page.goto(await firstRaidHref(page));

    const table = page.getByRole('table').first();

    await expect(table).toBeVisible();
    expect(await table.locator('tbody tr').count()).toBeGreaterThan(0);
  });

  test('links kills and best pulls out to Warcraft Logs', async ({ page }) => {
    await page.goto(await firstRaidHref(page));

    const wclLinks = page.locator('a[href*="warcraftlogs.com/reports/"]');

    // Every guild uploading logs gets a report link; zero across the whole page
    // means encounter IDs stopped matching WCL fight data.
    await expect(wclLinks.first()).toBeAttached();
    expect(await wclLinks.count()).toBeGreaterThan(0);
    await expect(wclLinks.first()).toHaveAttribute('target', '_blank');
  });

  test('renders the not-found page for an unknown raid', async ({ page }) => {
    await page.goto('/raid/not-a-real-raid');

    await expect(page.getByText(/404|not found/i).first()).toBeVisible();
  });

  /**
   * KNOWN FAILURE — the not-found page is served with HTTP 200.
   *
   * The route streams (there is a loading.tsx under raid/[slug]), so the 200 is
   * committed before notFound() runs and the status can no longer be changed:
   * the response comes back chunked with x-nextjs-prerender: 1. A human sees
   * the correct page; a crawler is told the page exists.
   *
   * Marked test.fail() rather than skipped so the assertion stays honest about
   * what we want. Playwright will flag this as an unexpected pass the moment
   * the status is fixed — that is the signal to delete this modifier.
   */
  test.fail(
    'returns a 404 status for an unknown raid',
    async ({ page }) => {
      const response = await page.goto('/raid/not-a-real-raid');

      expect(response?.status()).toBe(404);
    }
  );
});

test.describe('help page', () => {
  test('is reachable from the header', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /help/i }).first().click();

    await expect(page).toHaveURL(/\/help/);
    await expect(page.getByRole('heading').first()).toBeVisible();
  });
});
