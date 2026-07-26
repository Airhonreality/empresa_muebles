import type { MetadataRoute } from 'next';
import { getPublicSiteUrl } from '@/lib/veta/seo/publicSite';
import { getPublicStoreProducts } from '@/server/public-site-data';

const STATIC_ROUTES = [
  { path: '/', priority: 1, freq: 'weekly' as const },
  { path: '/portafolio', priority: 0.8, freq: 'weekly' as const },
  { path: '/colecciones', priority: 0.8, freq: 'weekly' as const },
  { path: '/agendar', priority: 0.6, freq: 'monthly' as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const staticEntries = STATIC_ROUTES.map(({ path, priority, freq }) => ({
    url: getPublicSiteUrl(path),
    lastModified,
    changeFrequency: freq,
    priority,
  }));

  const products = await getPublicStoreProducts();
  const productEntries = products.map((product) => ({
    url: getPublicSiteUrl(`/tienda/${product.slug_publico}`),
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticEntries, ...productEntries];
}
