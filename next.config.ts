import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server Actions (uploadFileToR2 en lib/r2/upload.ts recibe el File crudo del navegador antes
  // de optimizarlo con sharp) topaban con el límite por defecto de 1MB de Next -- cualquier foto
  // real de celular/cámara lo supera y Next rechaza la petición antes de correr la acción, dejando
  // "Error al subir a R2: An unexpected response was received from the server" en consola.
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
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
  // Redirects 301 del sitio legacy en Wix (3 años de trayectoria del dominio, DNS repuntado a
  // Vercel 2026-08-28) hacia las rutas nuevas de V3. Sin esto, backlinks/bookmarks/resultados de
  // búsqueda viejos, y el tráfico pagado de Ads que apunte a la ruta legacy, aterrizan en un 404.
  // /cocinas es urgente (2026-08-29): el grupo de anuncios "Cocinas" se reactivó hoy mismo con
  // dirección directa a la web de cocinas (arnes/lineas/demanda/estado_demanda.md). El resto del
  // mapa de URLs legacy queda pendiente hasta que el Supervisor confirme el listado completo del
  // Wix antiguo.
  async redirects() {
    return [
      {
        source: '/cocinas',
        destination: '/espacios/cocinas-integrales-bogota',
        permanent: true,
      },
    ]
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
