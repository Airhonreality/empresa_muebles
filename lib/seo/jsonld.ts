// JSON-LD centralizado del sitio público (auditoría 2026-08-15,
// arnes/lineas/demanda/auditoria_prelanzamiento_seo_20260815.md, hallazgo P1-4/P1-5).
// Antes vivía inline en app/(publico)/page.tsx con 3 defectos que fallarían el validador
// de datos estructurados de Google — corregidos acá:
// - `logo` apuntaba a /logo.png, que no existe en public/ — se usa el SVG real.
// - `potentialAction.SearchAction` apuntaba a /buscar, ruta inexistente — no hay feature de
//   búsqueda en el sitio, así que se elimina en vez de apuntar a algo que no funciona.
// - `foundingDate` usaba '1995' (narrativa de marca) en vez de '2014' (entidad legal
//   verificable, HERMANOS GARCIA GONZALEZ S.A.S. NIT 901421357-9) — decisión ya documentada
//   en plan_seo_2026.md línea 43.
// `sameAs`/`address` (sin streetAddress/postalCode) quedan igual que antes: no se inventa una
// URL de Google Maps con place_id verificado ni una dirección exacta sin que el Supervisor la
// confirme (regla anti-invención, plan_seo_2026.md §"Reglas duras anti-invención").
export const SITE_URL = 'https://vetadorada.co'

export interface TestimonioJsonLd {
  nombre: string
  texto: string
  barrio?: string
  tipoProyecto?: string
}

export function getHomeJsonLd(testimonios: TestimonioJsonLd[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'HomeAndConstructionBusiness',
        '@id': `${SITE_URL}/#homeandconstructionbusiness`,
        name: 'Veta Dorada',
        description:
          'Estudio de carpintería arquitectónica en Bogotá. Diseñamos, fabricamos e instalamos cocinas, closets, centros de entretenimiento y espacios integrales en madera a la medida.',
        url: SITE_URL,
        telephone: '+57 302 592 2101',
        areaServed: 'Bogotá',
        priceRange: 'Consultar',
        knowsLanguage: 'es-CO',
        review: testimonios.map((t) => ({
          '@type': 'Review',
          reviewRating: {
            '@type': 'Rating',
            ratingValue: '5',
            bestRating: '5',
            worstRating: '1',
          },
          reviewBody: t.texto,
          author: {
            '@type': 'Person',
            name: t.nombre,
          },
          publisher: {
            '@type': 'Organization',
            name: 'Google',
          },
        })),
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'Veta Dorada',
        url: SITE_URL,
        // TODO(NAP completo): falta streetAddress/postalCode reales y un sameAs con place_id
        // verificado de Google — pendiente de confirmación del Supervisor, no se inventan
        // (plan_seo_2026.md §"NAP canónico" / "Reglas duras anti-invención").
        logo: `${SITE_URL}/logo-veta-positive.svg`,
        description:
          'Somos un estudio de carpintería arquitectónica en Bogotá. Diseñamos, fabricamos e instalamos cocinas, closets, centros de entretenimiento y espacios integrales en madera — todo a la medida, con diseño contemporáneo y manufactura en taller propio. Tres generaciones de oficio en la construcción, desde 1995.',
        sameAs: ['https://www.google.com/maps/place/Veta+Dorada'],
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'CO',
          addressRegion: 'Bogotá',
          addressLocality: 'Bogotá',
        },
        telephone: '+57 302 592 2101',
        // 2014: constitución legal de HERMANOS GARCIA GONZALEZ S.A.S. (entidad verificable).
        // 1995 es la narrativa de marca (tradición familiar) — vive en la descripción, no acá.
        foundingDate: '2014',
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: 'Veta Dorada',
        description:
          'Carpintería arquitectónica, diseño y fabricación de espacios integrales en madera en Bogotá.',
      },
    ],
  }
}
