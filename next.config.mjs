/** @type {import('next').NextConfig} */

// Load env from ~/env locally only. On Vercel, env vars are injected via the dashboard.
const isVercel = process.env.VERCEL === '1';

if (!isVercel) {
  const { createRequire } = await import('module');
  const path = await import('path');
  const os = await import('os');

  const require = createRequire(import.meta.url);
  const { loadEnvConfig } = require('@next/env');

  const envDir = path.resolve(os.homedir(), 'env').replace(/\\/g, '/');

  const { loadedEnvFiles } = loadEnvConfig(envDir, true, console, true);

  if (loadedEnvFiles.length === 0) {
    throw new Error(
      `🛑 BUILD FAILED: No .env files found in ${envDir}. Check directory path.`
    );
  }

  const REQUIRED_VARS = ['RAIDERIO_ACCESS_KEY'];
  REQUIRED_VARS.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(
        `🛑 BUILD FAILED: Missing required environment variable: ${key}`
      );
    }
  });
}

const nextConfig = {
  // build config here
};

export default nextConfig;
