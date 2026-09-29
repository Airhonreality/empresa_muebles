/**
 * t-166 (2026-09-29): compilación de la lista de ítems del contrato.
 *
 * Módulo PURO (sin React, sin store, sin I/O) para que sea testeable con el patrón del
 * repo — `node:assert` + `npx tsx`, ver AGENTS.md §"Comandos de verificación".
 *
 * Contexto: hasta t-166 esta lógica vivía dentro de `ContratoModal.tsx` como funciones
 * declaradas en el cuerpo del componente. Dos consecuencias:
 *   1. No había forma de testearla (dependía del render).
 *   2. Cada montaje del componente recompilaba la lista desde cero, pisando lo que el
 *      usuario hubiera escrito a mano.
 *
 * Decisión de Supervisor (t-166): la línea de cada ítem NO incluye el SKU —es un código
 * interno de catálogo, no un dato contractual— e INCLUYE la ficha técnica disponible
 * (marca, acabado, referencia, dimensiones, espesor, color y campos personalizados).
 * Los 6 campos universales son por ítem cotizado (`ItemVariante`, no `ProductoCatalogo`):
 * la misma tabla puede estar en un acabado distinto en dos cotizaciones distintas.
 */

import type {
  CampoPersonalizadoProducto,
  EspacioVariante,
  ItemVariante,
  ProductoCatalogo,
} from './contracts'

/** Las 4 secciones de especificaciones que el contrato tiene como columnas.
 *  Solo se rellenan si el catálogo tiene productos cuya categoría comercial mapea a ellas. */
export type SeccionEspecificacion = 'Estructura' | 'Herrajes' | 'Mesones' | 'Desmonte'

/**
 * Mapeo categoría comercial del catálogo → sección del contrato.
 *
 * Deliberadamente MÍNIMO y sin mapeos inventados: "Mesones" (piedra/granito) y
 * "Desmonte" (retiro de mobiliario existente) no tienen categoría comercial equivalente
 * todavía, así que sus secciones quedan vacías hasta que el catálogo tenga productos de
 * ese tipo. Mapear "Muebles"→Mesones o "Mano de Obra"→Desmonte sería semánticamente
 * incorrecto: publicaría en el contrato una sección que no describe lo entregado.
 */
const CATEGORIA_A_SECCION: Record<string, SeccionEspecificacion> = {
  Maderas: 'Estructura',
  Herrajes: 'Herrajes',
}

export function mapearCategoriaASeccion(categoriaComercial: string | null | undefined): SeccionEspecificacion | null {
  if (!categoriaComercial) return null
  return CATEGORIA_A_SECCION[categoriaComercial] ?? null
}

function sinEspacios(valor: string | null | undefined): string | null {
  const limpio = valor?.trim()
  return limpio ? limpio : null
}

/** Descripción legible del ítem. `nombrePersonalizado` gana porque es lo que el vendedor
 *  escribió para ESE ítem; si no hay, se cae a la descripción del catálogo. */
function descripcionDe(item: ItemVariante, prod: ProductoCatalogo | undefined): string {
  return item.nombrePersonalizado ?? prod?.descripcion ?? 'Ítem sin catálogo'
}

function etiquetaNormalizada(etiqueta: string): string {
  return etiqueta.trim().toLowerCase()
}

/** Campos universales de ficha, en el orden en que se imprimen. */
const CAMPOS_UNIVERSALES: ReadonlyArray<{ etiqueta: string; leer: (item: ItemVariante) => string | null }> = [
  { etiqueta: 'Marca', leer: (i) => i.marca },
  { etiqueta: 'Acabado', leer: (i) => i.acabado },
  { etiqueta: 'Referencia', leer: (i) => i.referencia },
  { etiqueta: 'Dimensiones', leer: (i) => i.dimensiones },
  { etiqueta: 'Espesor', leer: (i) => i.espesor },
  { etiqueta: 'Color', leer: (i) => i.color },
]

/**
 * Sufijo de ficha técnica de una línea de ítem: `" — Marca: Blum, Acabado: Acero satinable"`.
 * Devuelve cadena vacía si el ítem no tiene ningún dato de ficha.
 *
 * Deduplica por etiqueta normalizada: si un campo personalizado se llama "marca", no se
 * repite al lado del campo universal "Marca" (el mismo dato dos veces en el contrato).
 * El campo universal gana por ser el de esquema fijo.
 */
export function compilarFichaItem(item: ItemVariante, prod: ProductoCatalogo | undefined): string {
  const partes: string[] = []
  const vistas = new Set<string>()

  for (const campo of CAMPOS_UNIVERSALES) {
    const valor = sinEspacios(campo.leer(item))
    if (!valor) continue
    vistas.add(etiquetaNormalizada(campo.etiqueta))
    partes.push(`${campo.etiqueta}: ${valor}`)
  }

  // Los personalizados del ítem mandan; si el ítem no tiene, se hereda la ficha del
  // producto de catálogo (P-27: atributos técnicos libres clave+valor, p. ej. "número de
  // aperturas" -> "60000"). Nunca se mezclan ambas listas: son fuentes alternativas.
  const personalizados: CampoPersonalizadoProducto[] =
    item.camposPersonalizados?.length ? item.camposPersonalizados : prod?.camposPersonalizados ?? []

  for (const cp of personalizados) {
    const etiqueta = sinEspacios(cp?.clave)
    const valor = sinEspacios(cp?.valor)
    if (!etiqueta || !valor) continue
    const clave = etiquetaNormalizada(etiqueta)
    if (vistas.has(clave)) continue
    vistas.add(clave)
    partes.push(`${etiqueta}: ${valor}`)
  }

  return partes.length > 0 ? ` — ${partes.join(', ')}` : ''
}

/** Línea de un ítem dentro de la lista del objeto del contrato. */
export function lineaObjetoItem(item: ItemVariante, prod: ProductoCatalogo | undefined): string {
  const unidad = sinEspacios(prod?.unidadMedida) ?? 'ud'
  return `- ${descripcionDe(item, prod)}: ${item.cantidad} ${unidad}${compilarFichaItem(item, prod)}`
}

/** Línea de un ítem dentro de una sección de especificaciones técnicas. */
function lineaEspecificacion(item: ItemVariante, prod: ProductoCatalogo): string {
  const unidad = sinEspacios(prod.unidadMedida) ?? 'ud'
  return `- ${descripcionDe(item, prod)}: ${item.cantidad} ${unidad}${compilarFichaItem(item, prod)}`
}

/** Recorre los ítems de los espacios indicados, en orden, resuelriendo su producto de catálogo. */
function recorrerItems(
  espacios: EspacioVariante[],
  itemsPorEspacio: Map<string, ItemVariante[]>,
  productMap: Map<string, ProductoCatalogo>,
  visitar: (item: ItemVariante, prod: ProductoCatalogo | undefined) => void,
): void {
  for (const esp of espacios) {
    for (const item of itemsPorEspacio.get(esp.id) ?? []) {
      visitar(item, item.catalogoId ? productMap.get(item.catalogoId) : undefined)
    }
  }
}

/**
 * Objeto del contrato: una línea por ítem cotizado, en todos los espacios activos.
 * Sin SKU (decisión t-166) y con la ficha técnica que exista.
 */
export function compilarObjetoItems(
  espacios: EspacioVariante[],
  itemsPorEspacio: Map<string, ItemVariante[]>,
  productMap: Map<string, ProductoCatalogo>,
): string {
  const lines: string[] = []
  recorrerItems(espacios, itemsPorEspacio, productMap, (item, prod) => {
    lines.push(lineaObjetoItem(item, prod))
  })
  return lines.join('\n')
}

/**
 * Especificaciones técnicas de una sección. Solo incluye el ítem si la categoría REAL de su
 * producto mapea a esa sección — un ítem de catálogo sin categoría no se publica en
 * ninguna, en vez de meterse a la fuerza en la primera.
 */
export function compilarEspecificaciones(
  espacios: EspacioVariante[],
  itemsPorEspacio: Map<string, ItemVariante[]>,
  productMap: Map<string, ProductoCatalogo>,
  seccion: SeccionEspecificacion,
): string {
  const lines: string[] = []
  recorrerItems(espacios, itemsPorEspacio, productMap, (item, prod) => {
    if (prod && mapearCategoriaASeccion(prod.categoriaComercial) === seccion) {
      lines.push(lineaEspecificacion(item, prod))
    }
  })
  return lines.join('\n')
}

/** ¿Hay al menos un ítem cuya categoría comercial mapee a esta sección?
 *  Gate de visibilidad del modal: si no hay, la sección no se muestra ni se persiste. */
export function tieneItemsDeLaCategoria(
  espacios: EspacioVariante[],
  itemsPorEspacio: Map<string, ItemVariante[]>,
  productMap: Map<string, ProductoCatalogo>,
  seccion: SeccionEspecificacion,
): boolean {
  let encontrado = false
  recorrerItems(espacios, itemsPorEspacio, productMap, (item, prod) => {
    if (prod && mapearCategoriaASeccion(prod.categoriaComercial) === seccion) encontrado = true
  })
  return encontrado
}

/** Las 4 secciones que el modal renderiza, en orden de aparición. */
export const SECCIONES_ESPECIFICACIONES: ReadonlyArray<SeccionEspecificacion> = [
  'Estructura',
  'Herrajes',
  'Mesones',
  'Desmonte',
]
