import { slugify } from './slug'

// Slug SEO del portafolio: {tipo de espacio}-bogota-{barrio}, ej. "cocina-bogota-rosales" —
// coincide con lo que la gente busca (hallazgo 2026-08-21: un slug tipeado a mano en vez de
// generado rompió la URL pública de un proyecto real). "bogota" queda fijo porque el
// areaServed hoy es solo Bogotá (arnes/lineas/demanda/plan_seo_2026.md) — D5 (Chía/Cajicá/
// Cota) no está activo y no hay campo de ciudad estructurado todavía.
export function generarSlugPortafolioBase(categoriaEspacio: string, barrio: string | null): string {
  const tipo = slugify(categoriaEspacio)
  const barrioSlug = barrio
    ? slugify(barrio).replace(/(^|-)bogota(-|$)/g, '-').replace(/^-+|-+$/g, '')
    : ''
  return [tipo, 'bogota', barrioSlug].filter(Boolean).join('-')
}
