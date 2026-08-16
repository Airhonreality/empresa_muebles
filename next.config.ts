import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-ce098e41ccfb4f699b43c40e3e668d44.r2.dev',
      },
    ],
  },
};

export default nextConfig;
