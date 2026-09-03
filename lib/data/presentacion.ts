// lib/data/presentacion.ts
// Genera la lista de slides para el modo presentación comercial (ZN-004).
// Pura: sin side-effects, sin React, testeable con tsx.
import type { Proyecto, Cliente, EspacioVariante, ItemVariante, ProductoCatalogo } from './contracts'

export type TipoSlide =
  | { tipo: 'portada_proyecto'; proyecto: Proyecto; cliente: Cliente | null }
  | { tipo: 'espacio_portada'; espacio: EspacioVariante; indice: number; total: number }
  | { tipo: 'espacio_galeria'; espacio: EspacioVariante; fotos: string[] }
  | {
      tipo: 'espacio_items'
      espacio: EspacioVariante
      items: ItemVariante[]
      catalogo: Map<string, ProductoCatalogo>
      subtotal: string
    }
  | {
      tipo: 'resumen_breakdown'
      espacios: EspacioVariante[]
      subtotales: Record<string, string>          // espacioId → subtotal formateado
      totalGeneral: string
    }
  | { tipo: 'cierre'; proyecto: Proyecto; renderHero: string | null }

function calcSubtotal(items: ItemVariante[]): number {
  return items
    .filter((it) => !it.anulado && !it.esReferencial)
    .reduce((acc, it) => acc + (Number(it.totalLinea) || 0), 0)
}

function formatCOP(n: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
  }).format(n)
}

/**
 * Genera el array de slides en orden narrativo:
 * Portada → [por espacio: portada + galería? + items] → breakdown → cierre
 *
 * Filtra: solo espacios con activa=true y visibleEnPropuestaPublica=true,
 * ordenados por `orden` ASC.
 */
export function generarSlides(
  proyecto: Proyecto,
  cliente: Cliente | null,
  todosEspacios: EspacioVariante[],
  todosItems: ItemVariante[],
  catalogo: ProductoCatalogo[],
): TipoSlide[] {
  const catalogoMap = new Map(catalogo.map((p) => [p.id, p]))

  // Solo variantes activas y visibles, ordenadas
  const espacios = todosEspacios
    .filter((e) => e.activa && e.visibleEnPropuestaPublica)
    .sort((a, b) => a.orden - b.orden)

  const slides: TipoSlide[] = []

  // SLIDE 1: Portada del proyecto
  slides.push({ tipo: 'portada_proyecto', proyecto, cliente })

  const subtotalesPorEspacio: Record<string, string> = {}
  let totalGeneral = 0
  let renderHero: string | null = null

  espacios.forEach((espacio, idx) => {
    const itemsEspacio = todosItems.filter(
      (it) => it.varianteId === espacio.id && !it.anulado && !it.esReferencial,
    )
    const sub = calcSubtotal(itemsEspacio)
    totalGeneral += sub
    subtotalesPorEspacio[espacio.id] = formatCOP(sub)

    // Hero: primera foto de diseño del primer espacio
    const fotosDisenio = (espacio.fotosDisenio || []).filter(Boolean)
    if (!renderHero && fotosDisenio[0]) renderHero = fotosDisenio[0]

    // SLIDE A: Portada del espacio
    slides.push({
      tipo: 'espacio_portada',
      espacio,
      indice: idx + 1,
      total: espacios.length,
    })

    // SLIDE B: Galería (solo si hay fotos de diseño)
    const fotos = [...fotosDisenio, ...(espacio.fotosReferencia || []).filter(Boolean)]
    if (fotos.length > 0) {
      slides.push({ tipo: 'espacio_galeria', espacio, fotos })
    }

    // SLIDE C: Qué incluye
    if (itemsEspacio.length > 0) {
      slides.push({
        tipo: 'espacio_items',
        espacio,
        items: itemsEspacio,
        catalogo: catalogoMap,
        subtotal: formatCOP(sub),
      })
    }
  })

  // SLIDE D: Breakdown por espacios (solo si hay >1 espacio)
  if (espacios.length > 1) {
    slides.push({
      tipo: 'resumen_breakdown',
      espacios,
      subtotales: subtotalesPorEspacio,
      totalGeneral: formatCOP(totalGeneral),
    })
  }

  // SLIDE E: Cierre
  slides.push({ tipo: 'cierre', proyecto, renderHero })

  return slides
}
