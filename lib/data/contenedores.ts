// Proyección de `contenedores_descriptivos` sobre los espacios (2026-10-29, Fase 2).
//
// El commit 5238385 movió descripción/fotos a una tabla compartida polimórfica
// (contenedores_descriptivos), pero toda la UI (cotizador, propuesta pública, contrato,
// presentación) sigue leyendo `espacio.descripcion` / `espacio.fotos*`, que en
// `EspacioVariante` son campos OPCIONALES documentados como "cargados opcionalmente".
// Estos dos helpers son la única traducción entre el modelo nuevo y ese modelo de lectura,
// para no repetir el merge en cada consumidor.
import type { ContenedorDescriptivo } from './contracts'

export interface CamposDescriptivos {
  descripcion?: string | null
  fotosEspacio?: string[]
  fotosDisenio?: string[]
  fotosReferencia?: string[]
}

/** Normaliza saltos de línea para lectura en documentos al cliente.
 *  2026-10-29 (markdown): se conserva UNA línea en blanco, que es la separación de bloques
 *  que usa markdown (párrafos, listas, encabezados). Solo se colapsan 3+ saltos seguidos,
 *  se normaliza CRLF y se recortan espacios al final de línea. No toca el dato guardado. */
export function normalizarDescripcion(texto: string | null | undefined): string | null {
  if (!texto) return null
  const limpio = texto
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return limpio.length > 0 ? limpio : null
}

/** Aplica la descripción de cada contenedor de grupo (si existe) sobre la fila del grupo.
 *  Los grupos comparten `contenedores_descriptivos` con los espacios, pero se indexan por
 *  `grupoItemId`. Si no hay contenedor se conserva la descripción que ya trajera el grupo
 *  (los snapshots publicados antes de este cambio no la traen: queda null). */
export function aplicarContenedoresAGrupos<T extends { id: string; descripcion?: string | null }>(
  grupos: readonly T[],
  contenedores: readonly ContenedorDescriptivo[],
): Array<T & { descripcion: string | null }> {
  const porGrupo = new Map<string, ContenedorDescriptivo>()
  for (const contenedor of contenedores) {
    if (contenedor.grupoItemId) porGrupo.set(contenedor.grupoItemId, contenedor)
  }
  return grupos.map((grupo) => {
    const contenedor = porGrupo.get(grupo.id)
    if (!contenedor) return { ...grupo, descripcion: grupo.descripcion ?? null }
    return { ...grupo, descripcion: contenedor.descripcion }
  })
}

/** Aplica el contenedor de cada espacio (si existe) sobre la fila del espacio. */
export function aplicarContenedoresAEspacios<T extends { id: string }>(
  espacios: readonly T[],
  contenedores: readonly ContenedorDescriptivo[],
): Array<T & CamposDescriptivos> {
  const porEspacio = new Map<string, ContenedorDescriptivo>()
  for (const contenedor of contenedores) {
    if (contenedor.espacioVarianteId) porEspacio.set(contenedor.espacioVarianteId, contenedor)
  }
  return espacios.map((espacio) => {
    const contenedor = porEspacio.get(espacio.id)
    if (!contenedor) return espacio
    return {
      ...espacio,
      descripcion: contenedor.descripcion,
      fotosEspacio: contenedor.fotosEspacio,
      fotosDisenio: contenedor.fotosDisenio,
      fotosReferencia: contenedor.fotosReferencia,
    }
  })
}

/** Conserva los campos descriptivos ya proyectados cuando llega una lista "seca" de
 *  espacio_variantes (refresh parcial de tabla, seed del bridge). Sin esto, cualquier
 *  actualización de `espacio_variantes` borraría descripción/fotos de la pantalla aunque
 *  sigan intactas en `contenedores_descriptivos`. */
export function conservarCamposDescriptivos<T extends { id: string }>(
  filas: readonly T[],
  previas: ReadonlyArray<{ id: string } & CamposDescriptivos>,
): Array<T & CamposDescriptivos> {
  const porId = new Map(previas.map((fila) => [fila.id, fila]))
  return filas.map((fila) => {
    const previa = porId.get(fila.id)
    if (!previa) return fila
    return {
      ...fila,
      descripcion: previa.descripcion,
      fotosEspacio: previa.fotosEspacio,
      fotosDisenio: previa.fotosDisenio,
      fotosReferencia: previa.fotosReferencia,
    }
  })
}
