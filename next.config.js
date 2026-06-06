/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@agnostic/core'],
  // Tell Next.js file tracing to bundle storage/ with the serverless functions.
  // Without this, Vercel does not include dynamically-read files in /var/task/.
  outputFileTracingIncludes: {
    '/**': ['./storage/**/*'],
  },
  webpack(config, { isServer, nextRuntime }) {
    // Avoid eval-based devtool for edge runtime (middleware) — use plain source-map
    if (nextRuntime === 'edge') {
      config.devtool = 'source-map';
    }
    return config;
  }
};

module.exports = nextConfig;
