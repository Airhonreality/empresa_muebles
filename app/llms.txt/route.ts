import { SITE_URL } from '@/lib/seo/jsonld'
import { listarPortafolioPublicadosAction, listarProductosTiendaVisiblesAction } from '@/lib/data/actions/public'
import { listarBitacoraAction } from '@/lib/data/actions/portafolio'

// llms.txt (llmstxt.org) — creado 2026-08-16 a pedido explícito de Javier, adelantando la
// prioridad "Baja — post-corte" de plan_seo_2026.md línea 28/119 (el plan original pedía
// esperar a que el contenido estuviera cerrado antes de publicarlo). Generado dinámicamente
// (Route Handler, no archivo estático en public/) con las mismas Server Actions que
// app/sitemap.ts — no puede quedar desincronizado de lo que realmente existe hoy.
export const dynamic = 'force-dynamic'

function seccion(titulo: string, items: { url: string; nombre: string; descripcion?: string }[]): string {
  if (items.length === 0) return ''
  const lineas = items.map((it) => `- [${it.nombre}](${it.url})${it.descripcion ? `: ${it.descripcion}` : ''}`)
  return `\n## ${titulo}\n\n${lineas.join('\n')}\n`
}

export async function GET() {
  const [portafolio, productos, articulos] = await Promise.all([
    listarPortafolioPublicadosAction(),
    listarProductosTiendaVisiblesAction(),
    listarBitacoraAction(),
  ])

  const partes: string[] = []

  partes.push(
    '# Veta Dorada\n\n' +
    '> Estudio de carpintería arquitectónica en Bogotá. Diseñamos, fabricamos e instalamos ' +
    'cocinas, closets, centros de entretenimiento y espacios integrales en madera a la medida, ' +
    'con taller propio. Tres generaciones de oficio en la construcción.\n'
  )

  partes.push(
    seccion('Páginas principales', [
      { url: SITE_URL, nombre: 'Inicio', descripcion: 'Presentación del estudio, proceso de trabajo y proyectos destacados' },
      { url: `${SITE_URL}/como-trabajamos`, nombre: 'Proceso', descripcion: 'Proceso de 4 pasos para espacios a la medida (visita, cotización, taller, instalación)' },
      { url: `${SITE_URL}/espacios`, nombre: 'Espacios', descripcion: 'Categorías de espacios a la medida: cocinas, closets, cavas, consolas, estudios, centros de entretenimiento' },
      { url: `${SITE_URL}/espacios/pisos-de-madera`, nombre: 'Restauración de pisos de madera', descripcion: 'Servicio de restauración de pisos de madera originales en Bogotá' },
      { url: `${SITE_URL}/portafolio`, nombre: 'Portafolio', descripcion: 'Casos reales de proyectos ejecutados' },
      { url: `${SITE_URL}/testimonios`, nombre: 'Testimonios', descripcion: 'Prueba social de clientes satisfechos con nombre y barrio' },
      { url: `${SITE_URL}/conocenos`, nombre: 'Conócenos', descripcion: 'Historia de Veta Dorada, perfiles de Hugo García (obra) y Airhon García (diseño)' },
      { url: `${SITE_URL}/para-arquitectos`, nombre: 'Para Arquitectos B2B', descripcion: 'Fabricación a la medida para estudios, cotización de planos en 1 día hábil' },
      { url: `${SITE_URL}/colecciones`, nombre: 'Colecciones', descripcion: 'Piezas de mobiliario diseñadas y fabricadas en taller propio' },
      { url: `${SITE_URL}/bitacora`, nombre: 'Bitácora de diseño', descripcion: 'Casos de estudio y notas de proceso, materiales y técnica' },
    ])
  )

  partes.push(
    seccion(
      'Portafolio',
      portafolio.slice(0, 30).map((p) => ({
        url: `${SITE_URL}/portafolio/${p.slug}`,
        nombre: p.titulo,
        descripcion: p.descripcionComercial ?? p.categoriaEspacio ?? undefined,
      }))
    )
  )

  partes.push(
    seccion(
      'Colecciones',
      productos.slice(0, 30).map((p) => ({
        url: `${SITE_URL}/colecciones/${p.id}`,
        nombre: p.descripcionDiseno ?? 'Producto Veta Dorada',
        descripcion: p.categoria ?? undefined,
      }))
    )
  )

  partes.push(
    seccion(
      'Bitácora',
      articulos
        .filter((a) => a.publicado)
        .slice(0, 30)
        .map((a) => ({
          url: `${SITE_URL}/bitacora/${a.slug}`,
          nombre: a.titulo,
          descripcion: a.extracto ?? undefined,
        }))
    )
  )

  const body = partes.filter(Boolean).join('\n')

  return new Response(body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}
