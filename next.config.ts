import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-ce098e41ccfb4f699b43c40e3e668d44.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'veta-dorada.r2.cloudflarestorage.com',
      },
    ],
  },
  // Headers de seguridad y caché (checklist SEO 2026-08-16, #13/#14). Auditoría 2026-08-19: la
  // app no usaba cámara/micrófono/geolocalización; nosniff + frame-deny + referrer estricto.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=31536000' },
        ],
      },
    ];
  },
};

export default nextConfig;
