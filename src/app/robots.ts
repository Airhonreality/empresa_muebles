import type { MetadataRoute } from 'next';
import { getPublicSiteUrl } from '@/lib/veta/seo/publicSite';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/portafolio', '/colecciones', '/colecciones/*', '/agendar', '/colecciones', '/colecciones/*'],
        disallow: ['/app/', '/api/'],
      },
    ],
    sitemap: getPublicSiteUrl('/sitemap.xml'),
  };
}
