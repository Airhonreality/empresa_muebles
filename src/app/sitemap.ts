import type { MetadataRoute } from 'next';
import { getVaultData } from '@/core/server/vault';
import { readCommercialConfig, readSiteIdentity } from '@/lib/seo/siteConfig';
import { SYSTEM_NS } from '@/lib/agnostic/constants';

export const dynamic = 'force-dynamic';

/**
 * Data-driven sitemap: public routes from page_routes.json (those not marked
 * isPrivate), resolved against the fork's `site_url`. Empty until a site url is
 * configured. Forks with explicit route modules (src/app/<x>/page.tsx) that are
 * not in page_routes can add them via extra entries later; a fork never edits
 * this engine file.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const data = await getVaultData(['configuracion_comercial', SYSTEM_NS.ROUTES]);
    const siteUrl = readSiteIdentity(readCommercialConfig(data['configuracion_comercial'] as unknown)).siteUrl;
    if (!siteUrl) return [];

    const base = siteUrl.replace(/\/$/, '');
    const routes = (data[SYSTEM_NS.ROUTES] ?? []) as Array<{ data?: { path?: string; isPrivate?: boolean } }>;
    const publicPaths = routes
      .map(r => r.data)
      .filter((d): d is { path: string; isPrivate?: boolean } => !!d?.path && !d.isPrivate)
      .map(d => d.path);

    const uniquePaths = Array.from(new Set(['/', ...publicPaths]));
    const now = new Date();
    return uniquePaths.map(p => ({
      url: `${base}${p === '/' ? '' : p}`,
      lastModified: now,
      changeFrequency: 'weekly',
    }));
  } catch {
    return [];
  }
}
