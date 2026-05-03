import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Silence workspace-root detection warning when lockfiles exist at parent dirs
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
