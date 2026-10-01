// Historial de acciones ya confirmadas en la DB, deshacibles con Ctrl+Z global (t-179,
// diagnóstico de UI del cotizador 2026-09-30 — el usuario preguntó si "se puede hacer Ctrl+Z en
// cualquier lugar"). Distinto del deshacer por campo (t-177, `useUndoHistorial`): ese revierte lo
// que estás tecleando ANTES de guardar; este revierte una acción que YA se guardó -- crear un
// ítem sin querer, editar un precio y arrepentirse, borrar un ítem por error.
//
// Pila en memoria por proyecto (mismo patrón que `pendientesItemsPorProyecto` en optimistic.ts):
// vive mientras dura la sesión de la pestaña, no se persiste. Deshacer una acción ya confirmada
// en la DB siempre requiere volver a llamar al servidor con los valores anteriores -- no alcanza
// con tocar el caché local, porque lo que se está revirtiendo ya quedó escrito.
export interface AccionDeshacer {
  descripcion: string
  deshacer: () => Promise<void>
}

const LIMITE_HISTORIAL = 20

const pilaPorProyecto = new Map<string, AccionDeshacer[]>()

export function registrarAccionDeshacer(proyectoId: string, accion: AccionDeshacer): void {
  const pila = pilaPorProyecto.get(proyectoId) ?? []
  pila.push(accion)
  if (pila.length > LIMITE_HISTORIAL) pila.shift()
  pilaPorProyecto.set(proyectoId, pila)
}

/** Deshace la última acción registrada y la quita de la pila. Devuelve su descripción (para
 *  mostrarla en un toast) o `null` si no había nada que deshacer. Propaga el error de `deshacer`
 *  tal cual (sin volver a meter la acción en la pila -- reintentar un deshacer fallido es
 *  decisión del usuario, no algo para reintentar en silencio). */
export async function deshacerUltimaAccion(proyectoId: string): Promise<string | null> {
  const pila = pilaPorProyecto.get(proyectoId)
  const accion = pila?.pop()
  if (!accion) return null
  await accion.deshacer()
  return accion.descripcion
}

export function hayAccionesPorDeshacer(proyectoId: string): boolean {
  return (pilaPorProyecto.get(proyectoId)?.length ?? 0) > 0
}

/** Solo para tests: limpia la pila de un proyecto. */
export function _limpiarHistorialDeshacer(proyectoId: string): void {
  pilaPorProyecto.delete(proyectoId)
}

/** Construye el patch inverso: para cada clave presente en `patch`, toma el valor que tenía
 *  `anterior` antes del cambio. Deshacer una actualización es aplicar este patch inverso. */
export function patchInverso<T extends object>(anterior: T, patch: Partial<T>): Partial<T> {
  const inverso: Partial<T> = {}
  for (const clave of Object.keys(patch) as (keyof T)[]) {
    inverso[clave] = anterior[clave]
  }
  return inverso
}
