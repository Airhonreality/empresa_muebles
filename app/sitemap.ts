import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo/jsonld'
import { listarPortafolioPublicadosAction, listarProductosTiendaVisiblesAction } from '@/lib/data/actions/public'
import { listarBitacoraAction } from '@/lib/data/actions/portafolio'

// Infraestructura SEO básica (auditoría 2026-08-15, B1/plan_seo_2026.md §1 punto 3): no existía
// ningún sitemap.xml en el repo. Rutas estáticas + dinámicas (portafolio/colecciones/bitácora)
// vía las mismas Server Actions escopadas que ya usan esas páginas — sin duplicar lógica de
// filtrado (publicado/visible). /propuesta, /cuenta y /erp quedan fuera a propósito (no son
// contenido de marketing indexable).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [portafolio, productos, articulos] = await Promise.all([
    listarPortafolioPublicadosAction(),
    listarProductosTiendaVisiblesAction(),
    listarBitacoraAction(),
  ])

  const estaticas: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/espacios`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/espacios/pisos-de-madera`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/portafolio`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/colecciones`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/bitacora`, changeFrequency: 'weekly', priority: 0.7 },
  ]

  const portafolioUrls: MetadataRoute.Sitemap = portafolio.map((p) => ({
    url: `${SITE_URL}/portafolio/${p.slug}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  const productosUrls: MetadataRoute.Sitemap = productos.map((p) => ({
    url: `${SITE_URL}/colecciones/${p.id}`,
    changeFrequency: 'monthly',
    priority: 0.5,
  }))

  const bitacoraUrls: MetadataRoute.Sitemap = articulos
    .filter((a) => a.publicado)
    .map((a) => ({
      url: `${SITE_URL}/bitacora/${a.slug}`,
      changeFrequency: 'monthly',
      priority: 0.6,
    }))

  return [...estaticas, ...portafolioUrls, ...productosUrls, ...bitacoraUrls]
}
