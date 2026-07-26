import type { MetadataRoute } from 'next';
import { getVaultData } from '@/core/server/vault';
import { readCommercialConfig, readSiteIdentity } from '@/lib/seo/siteConfig';

export const dynamic = 'force-dynamic';

/**
 * Data-driven robots. A fork with a public `site_url` (in configuracion_comercial)
 * is indexable; a virgin/dev seed with no site url is not. Private areas come
 * from the same env prefixes the middleware protects, so robots and auth agree.
 * A fork never edits this file.
 */
function protectedPrefixes(): string[] {
  const engine = ['/app', '/schema', '/_data', '/setup', '/login', '/api'];
  const extra = ['AGNOSTIC_PROTECTED_PATHS', 'AGNOSTIC_PROTECTED_API_PATHS']
    .flatMap(k => (process.env[k] ?? '').split(',').map(s => s.trim()).filter(Boolean));
  return Array.from(new Set([...engine, ...extra]));
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  let siteUrl: string | undefined;
  try {
    const data = await getVaultData(['configuracion_comercial']);
    siteUrl = readSiteIdentity(readCommercialConfig(data['configuracion_comercial'] as unknown)).siteUrl;
  } catch { /* no config → treat as private */ }

  if (!siteUrl) {
    // No public site configured → do not index (seed default / staging).
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  const base = siteUrl.replace(/\/$/, '');
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: protectedPrefixes() }],
    sitemap: `${base}/sitemap.xml`,
  };
}
