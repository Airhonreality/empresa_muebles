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
//
// Dominio + datos legales (2026-08-16, `arnes/parameros de branding y data  veta dorada.txt`,
// dato directo de Javier): `PAGINA_WEB: www.vetadeoro.co` — el dominio real hoy, consistente con
// plan_demanda.md línea 150 ("Segundo dominio: 4-8 semanas de métricas estables tras C" — un
// dominio nuevo es una fase futura, no la de hoy). `NOMBRE_MARCA: Veta de Oro` y
// `ESLOGAN_EMPRESA: Estética y Confort` de ese mismo archivo NO se aplican acá — son datos de
// registro legal/legacy, superados por decisiones de diseño ya cerradas y confirmadas por el
// Supervisor: nombre de marca "Veta Dorada" (plan_demanda.md línea 27, renombre del Perfil de
// Empresa deliberadamente diferido a "después del corte") y eslogan "Diseña tu espacio. Habita
// el bienestar." (plan_demanda.md línea 42, D1 RESUELTA 2026-08-09).
export const SITE_URL = 'https://www.vetadeoro.co'

// Redes sociales reales (2026-08-16, pasadas por Javier). Facebook incluido acá (identidad de
// entidad para Google/IA) aunque no se muestre como ícono clickeable en el footer — está
// inactiva y no se quiere mandar visitantes reales a una página sin actividad.
// 2026-08-19: Perfil de Empresa en Google renombrado a "Veta Dorada" (checklist #3 CERRADO) —
// sameAs actualizado al link real que Javier pasó en sesión.
const SAME_AS = [
  'https://share.google/C4ERFWARygKWHkNGO',
  'https://www.instagram.com/veta_dorada/',
  'https://www.tiktok.com/@veta_dorada.co',
  'https://www.facebook.com/profile.php?id=61567800401365',
]

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
        // NAP en la entidad LocalBusiness (Google la lee de acá, no solo de Organization).
        // streetAddress: dato real de Javier (2026-08-16). postalCode: I-019, plan_seo_2026.md:41.
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Cra 72a #71a-57',
          postalCode: '111061',
          addressCountry: 'CO',
          addressRegion: 'Bogotá',
          addressLocality: 'Bogotá',
        },
        sameAs: SAME_AS,
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
        // legalName/taxID: dato real de Javier (2026-08-16, `arnes/parameros de branding y data
        // veta dorada.txt`) — schema.org distingue `name` (marca comercial) de `legalName`
        // (razón social), consistente con la fórmula ya aprobada del footer ("Veta Dorada es una
        // marca comercial registrada... operados por HERMANOS GARCIA GONZALEZ SAS").
        legalName: 'Hermanos Garcia Gonzalez SAS',
        taxID: '901421357-9',
        url: SITE_URL,
        sameAs: SAME_AS,
        logo: `${SITE_URL}/logo-veta-positive.svg`,
        description:
          'Somos un estudio de carpintería arquitectónica en Bogotá. Diseñamos, fabricamos e instalamos cocinas, closets, centros de entretenimiento y espacios integrales en madera — todo a la medida, con diseño contemporáneo y manufactura en taller propio. Tres generaciones de oficio en la construcción, desde 1995.',
        address: {
          '@type': 'PostalAddress',
          // streetAddress: dato real de Javier (DIRECCIÓN_EMPRESA, mismo archivo 2026-08-16).
          // postalCode ya estaba confirmado por el Supervisor (I-019, plan_seo_2026.md línea 41),
          // no es dato nuevo de esta sesión.
          streetAddress: 'Cra 72a #71a-57',
          postalCode: '111061',
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
