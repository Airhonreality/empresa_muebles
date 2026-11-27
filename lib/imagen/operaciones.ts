// Capa 0 del módulo de imágenes (t-200). Operaciones puras: cada una devuelve una colección
// nueva y nunca muta la entrada. Sin React, sin DOM, sin almacenamiento.
import type { CamposSlot, ImagenItem, SlotImagen, ValoresCampos } from './tipos'

export type GenerarId = () => string

/** Convierte URLs persistidas (formato actual) en items con id local. */
export function desdeUrls<C extends CamposSlot>(urls: readonly string[], generarId: GenerarId): ImagenItem<C>[] {
  return urls.map((url) => ({ clienteId: generarId(), url, base: {}, valores: {} as ValoresCampos<C> }))
}

/** Extrae solo las URLs, que es lo que se persiste hoy (P3, sin cambio de forma de datos). */
export function aUrls<C extends CamposSlot>(coleccion: readonly ImagenItem<C>[]): string[] {
  return coleccion.map((it) => it.url)
}

/**
 * Agrega URLs al final del slot. Descarta duplicadas (por URL) y respeta el tope `max`.
 * Si `multiple` es false, reemplaza la colección por la primera URL válida.
 */
export function insertar<C extends CamposSlot>(
  coleccion: readonly ImagenItem<C>[],
  urls: readonly string[],
  slot: Pick<SlotImagen<C>, 'multiple' | 'max'>,
  generarId: GenerarId,
): ImagenItem<C>[] {
  const limpias = urls.map((u) => u.trim()).filter((u) => u.length > 0)
  if (!slot.multiple) {
    const primera = limpias[0]
    return primera ? [{ clienteId: generarId(), url: primera, base: {}, valores: {} as ValoresCampos<C> }] : [...coleccion]
  }
  const vistas = new Set(coleccion.map((it) => it.url))
  const nuevos: ImagenItem<C>[] = []
  for (const url of limpias) {
    if (vistas.has(url)) continue
    if (slot.max !== undefined && coleccion.length + nuevos.length >= slot.max) break
    vistas.add(url)
    nuevos.push({ clienteId: generarId(), url, base: {}, valores: {} as ValoresCampos<C> })
  }
  return [...coleccion, ...nuevos]
}

export function quitar<C extends CamposSlot>(coleccion: readonly ImagenItem<C>[], clienteId: string): ImagenItem<C>[] {
  return coleccion.filter((it) => it.clienteId !== clienteId)
}

/** Mueve una imagen a una posición absoluta. Si la posición está fuera de rango, no cambia nada. */
export function mover<C extends CamposSlot>(
  coleccion: readonly ImagenItem<C>[],
  clienteId: string,
  posicion: number,
): ImagenItem<C>[] {
  const origen = coleccion.findIndex((it) => it.clienteId === clienteId)
  if (origen === -1 || !Number.isInteger(posicion) || posicion < 0 || posicion >= coleccion.length) {
    return [...coleccion]
  }
  const copia = [...coleccion]
  const [item] = copia.splice(origen, 1)
  copia.splice(posicion, 0, item)
  return copia
}

/** Mueve una posición hacia adelante (+1) o atrás (-1). Bordes: no cambia nada. */
export function moverRelativo<C extends CamposSlot>(
  coleccion: readonly ImagenItem<C>[],
  clienteId: string,
  delta: 1 | -1,
): ImagenItem<C>[] {
  const origen = coleccion.findIndex((it) => it.clienteId === clienteId)
  return origen === -1 ? [...coleccion] : mover(coleccion, clienteId, origen + delta)
}

/** Actualiza valores de campos del slot. Ignora claves que el slot no declara. */
export function actualizarValores<C extends CamposSlot>(
  coleccion: readonly ImagenItem<C>[],
  clienteId: string,
  parcial: Partial<ValoresCampos<C>>,
  campos: C | undefined,
): ImagenItem<C>[] {
  const declaradas = new Set(Object.keys(campos ?? {}))
  const filtrado = Object.fromEntries(
    Object.entries(parcial).filter(([clave]) => declaradas.has(clave)),
  ) as Partial<ValoresCampos<C>>
  return coleccion.map((it) =>
    it.clienteId === clienteId ? { ...it, valores: { ...it.valores, ...filtrado } } : it,
  )
}

/** Actualiza atributos base (alt, pie). Respeta `maxLength` de pie si se pasa. */
export function actualizarBase<C extends CamposSlot>(
  coleccion: readonly ImagenItem<C>[],
  clienteId: string,
  parcial: { alt?: string; pie?: string },
  limitePie = 160,
): ImagenItem<C>[] {
  const pie = parcial.pie === undefined ? undefined : parcial.pie.slice(0, limitePie)
  return coleccion.map((it) =>
    it.clienteId === clienteId
      ? { ...it, base: { ...it.base, ...parcial, ...(pie !== undefined ? { pie } : {}) } }
      : it,
  )
}

/** Diagnóstico de accesibilidad: imágenes sin texto alternativo. */
export function sinAlt<C extends CamposSlot>(coleccion: readonly ImagenItem<C>[]): string[] {
  return coleccion.filter((it) => !(it.base.alt ?? '').trim()).map((it) => it.clienteId)
}
