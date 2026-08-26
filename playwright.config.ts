import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

/**
 * Pages are server-rendered from the Raider.io and Warcraft Logs APIs, so a
 * cold render can take well over 30s while the dev cache fills. Timeouts are
 * generous on purpose — a slow first paint is not a failure.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'list' : [['list'], ['html', { open: 'never' }]],
  timeout: 120_000,
  expect: { timeout: 30_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    navigationTimeout: 90_000
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],

  // Reuses a dev server you already have running — Next holds a lock on .next,
  // so a second one would fail to start anyway.
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000
  }
});
