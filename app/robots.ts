import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo/jsonld'

// Infraestructura SEO básica (auditoría 2026-08-15, B1/plan_seo_2026.md §1 punto 4): no existía
// ningún robots.txt en el repo. Permite rastreo completo de las rutas públicas + los 4
// user-agents de IA que pide el plan. /erp se excluye por su propio metadata (app/erp/layout.tsx,
// robots noindex) y /cuenta por app/(publico)/cuenta/layout.tsx (2026-08-19) — no hace falta
// Disallow acá: un Disallow publicaría la existencia de esas rutas en un archivo público, que es
// exactamente lo contrario de lo que se busca para /propuesta.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      { userAgent: 'ChatGPT-User', allow: '/' },
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
