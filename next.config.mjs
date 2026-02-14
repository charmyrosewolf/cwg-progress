/** @type {import('next').NextConfig} */

// loadEnv.js
import { createRequire } from 'module';
import path from 'path';
import os from 'os';

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require('@next/env');

// Specify the folder 'env' inside your home directory
// const envDir = path.join(os.homedir(), 'env');
const envDir = path.resolve(os.homedir(), 'env').replace(/\\/g, '/');

// Load environment from the home directory folder
const { loadedEnvFiles } = loadEnvConfig(envDir, true, console, true);

console.log('Current Working Directory:', process.cwd());

// 1. Fail if NO environment files were found in the folder
if (loadedEnvFiles.length === 0) {
  throw new Error(
    `🛑 BUILD FAILED: No .env files found in ${envDir}. Check directory path.`
  );
}

// 2. Fail if a specific critical variable is missing from process.env
const REQUIRED_VARS = ['RAIDERIO_ACCESS_KEY'];
REQUIRED_VARS.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(
      `🛑 BUILD FAILED: Missing required environment variable: ${key}`
    );
  }
});

const nextConfig = {
  // build config here
};

export default nextConfig;
