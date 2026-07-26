import type { MetadataRoute } from 'next';
import { getPublicSiteUrl } from '@/lib/veta/seo/publicSite';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/portafolio', '/colecciones', '/colecciones/*', '/tienda', '/tienda/*', '/agendar'],
        disallow: ['/app/', '/api/', '/cuenta'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
      },
    ],
    sitemap: getPublicSiteUrl('/sitemap.xml'),
  };
}
