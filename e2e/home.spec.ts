import { test, expect } from '@playwright/test';
import { raidLinks, raidTables, recentUpdateEntries } from './helpers';

/**
 * Smoke coverage for the summary page.
 *
 * These run against live (or dev-cached) API data, so they assert structure and
 * invariants rather than specific guild standings, which change every raid night.
 */

test.describe('home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders the header and both summary panels', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'CWG Progress' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Raid Progression Summary' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Recent Updates' })
    ).toBeVisible();
  });

  test('renders a raid table per current raid, with the expected columns', async ({
    page
  }) => {
    const tables = raidTables(page);

    await expect(tables.first()).toBeVisible();
    expect(await tables.count()).toBeGreaterThan(0);
    expect(await tables.count()).toBe(await raidLinks(page).count());

    for (const column of ['Guild', 'Normal', 'Heroic', 'Mythic']) {
      await expect(
        tables.first().getByRole('columnheader', { name: column, exact: true })
      ).toBeVisible();
    }
  });

  test('every raid table has at least one guild row', async ({ page }) => {
    const tables = await raidTables(page).all();

    expect(tables.length).toBeGreaterThan(0);

    for (const table of tables) {
      expect(await table.locator('tbody tr').count()).toBeGreaterThan(0);
    }
  });

  test('shows the CWG community alongside the guilds', async ({ page }) => {
    // CWG is built from Warcraft Logs alone, so it is the first thing to vanish
    // when encounter IDs stop matching — the failure this suite exists to catch.
    // It legitimately disappears if the community has no kills in the current
    // tier at all, which is why this is its own test rather than an assertion
    // bolted onto another.
    await expect(
      page.getByRole('cell', { name: 'CWG Community' }).first()
    ).toBeVisible();
  });

  test('lists at most five recent updates', async ({ page }) => {
    const entries = recentUpdateEntries(page);

    const count = await entries.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(5);

    await expect(entries.first()).toBeVisible();
  });

  test('links each raid heading through to its detail page', async ({
    page
  }) => {
    const link = raidLinks(page).first();
    const name = (await link.textContent())?.trim();

    await link.click();

    await expect(page).toHaveURL(/\/raid\//);
    await expect(
      page.getByRole('heading', { name: name!, exact: false }).first()
    ).toBeVisible();
  });
});

test.describe('home page — client behaviour', () => {
  test('hydrates without console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'CWG Progress' })
    ).toBeVisible();

    // Give React a beat to flush hydration warnings
    await page.waitForTimeout(1000);

    expect(errors).toEqual([]);
  });

  test('toggles colour mode', async ({ page }) => {
    await page.goto('/');

    const toggle = page.getByRole('button', {
      name: /change to (dark|light) mode/
    });
    await expect(toggle).toBeVisible();

    const before = await page.locator('html').getAttribute('class');
    await toggle.click();

    await expect(page.locator('html')).not.toHaveAttribute(
      'class',
      before ?? ''
    );
  });

  test('renders on a mobile viewport without sideways scroll', async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: 'CWG Progress' })
    ).toBeVisible();
    await expect(raidTables(page).first()).toBeVisible();

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(overflows).toBe(false);
  });
});
