import type { Metadata } from 'next'
import { SITE_URL } from './jsonld'

// OG/Twitter cards compartidas (auditoría SEO 2026-08-19, checklist #8): solo 2 páginas tenían
// Open Graph y ninguna Twitter. Helper único para que todas las páginas públicas emitan el
// mismo patrón (siteName/locale/card consistentes), con imagen opcional.
export interface SocialMetaOptions {
  title: string
  description: string
  /** Ruta canónica sin dominio, ej. "/espacios/cocinas-integrales-bogota". */
  path: string
  image?: string | null
}

export function socialMeta({ title, description, path, image }: SocialMetaOptions): Pick<
  Metadata,
  'openGraph' | 'twitter'
> {
  const url = `${SITE_URL}${path}`
  return {
    openGraph: {
      title,
      description,
      url,
      siteName: 'Veta Dorada',
      locale: 'es_CO',
      type: 'website',
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: image ? [{ url: image }] : undefined,
    },
  }
}