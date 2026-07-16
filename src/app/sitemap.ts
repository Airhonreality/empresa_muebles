import type { MetadataRoute } from 'next';
import { getPublicSiteUrl } from '@/lib/veta/seo/publicSite';

const publicRoutes = ['/', '/portafolio', '/agendar'] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return publicRoutes.map((pathname) => ({
    url: getPublicSiteUrl(pathname),
    lastModified,
    changeFrequency: pathname === '/' ? 'weekly' : 'monthly',
    priority: pathname === '/' ? 1 : 0.8,
  }));
}
