// Instancia de la cola de escrituras del cotizador en el navegador. 'use client'.
//
// - Persiste la cola en IndexedDB (sobrevive a recargas y cierres de pestaña).
// - Cada escritura se registra por el nombre de su Server Action y sus argumentos tal cual los
//   recibe la mutación. La cola la ejecuta llamando a esa misma acción.
// - Se reanuda sola al volver la red (evento 'online') y al arrancar la app.
// - Al confirmar o rechazar una escritura que venía de una recarga (sin mutación esperando en la
//   sesión actual), refresca la caché del proyecto para mostrar la verdad del servidor.
'use client'

import { createStore, get, set } from 'idb-keyval'
import type { QueryClient } from '@tanstack/react-query'
import {
  crearItemAction, actualizarItemAction, eliminarItemAction,
  crearEspacioAction, actualizarEspacioAction, marcarActivaEspacioAction, eliminarEspacioAction,
  actualizarJornadasAction, actualizarParametrosFinancierosAction, actualizarEstadoProyectoAction,
  crearArtefactoAction, actualizarArtefactoAction, duplicarEspacioAction,
  crearGrupoItemAction, actualizarGrupoItemAction, eliminarGrupoItemAction,
  reemplazarAcabadosEspacioAction, actualizarClienteAction, crearClienteAction,
  actualizarProyectoAction, crearContratoAction, actualizarContratoAction,
  crearProductoCatalogoAction, actualizarProductoCatalogoAction, eliminarProductoCatalogoAction,
} from '@/lib/data/actions/core'
import { crearCatalogoAcabadoAction } from '@/lib/data/actions/f7-tienda'
import { crearProveedorAction } from '@/lib/data/actions/f6'
import { publicarPropuestaAction, eliminarVersionPropuestaAction } from '@/lib/data/actions/public'
import { Outbox, type EscrituraPendiente } from './outbox'
import { cotizadorKeys } from './queryKeys'
import { BASE_OUTBOX_IDB } from './idb-stores'

/** Todas las escrituras del cotizador. La clave es el nombre con el que se encola. */
export const ACCIONES_COTIZADOR = {
  crearItemAction, actualizarItemAction, eliminarItemAction,
  crearEspacioAction, actualizarEspacioAction, marcarActivaEspacioAction, eliminarEspacioAction,
  actualizarJornadasAction, actualizarParametrosFinancierosAction, actualizarEstadoProyectoAction,
  crearArtefactoAction, actualizarArtefactoAction, duplicarEspacioAction,
  crearGrupoItemAction, actualizarGrupoItemAction, eliminarGrupoItemAction,
  reemplazarAcabadosEspacioAction, actualizarClienteAction, crearClienteAction,
  actualizarProyectoAction, crearContratoAction, actualizarContratoAction,
  crearProductoCatalogoAction, actualizarProductoCatalogoAction, eliminarProductoCatalogoAction,
  crearCatalogoAcabadoAction, crearProveedorAction,
  publicarPropuestaAction, eliminarVersionPropuestaAction,
}

type Acciones = typeof ACCIONES_COTIZADOR
export type NombreAccionCotizador = keyof Acciones

const CLAVE_COLA = 'cola-cotizador'
const idbStore = typeof indexedDB === 'undefined' ? null : createStore(BASE_OUTBOX_IDB.nombre, BASE_OUTBOX_IDB.almacen)

const almacenIdb = {
  leer: async (): Promise<EscrituraPendiente[]> => {
    if (!idbStore) return []
    return (await get<EscrituraPendiente[]>(CLAVE_COLA, idbStore)) ?? []
  },
  guardar: async (lista: EscrituraPendiente[]): Promise<void> => {
    if (idbStore) await set(CLAVE_COLA, lista, idbStore)
  },
}

/** Ejecuta la acción registrada con los argumentos guardados. Un nombre desconocido es un error
 *  permanente (no de red): no se reintenta. */
async function ejecutarEscritura(nombre: string, args: unknown): Promise<unknown> {
  const accion = ACCIONES_COTIZADOR[nombre as NombreAccionCotizador] as
    | ((...a: unknown[]) => Promise<unknown>)
    | undefined
  if (!accion) throw new Error(`Acción de escritura desconocida: ${nombre}`)
  return accion(...(args as unknown[]))
}

let queryClient: QueryClient | null = null

function refrescarProyecto(proyectoId: string): void {
  void queryClient?.invalidateQueries({ queryKey: cotizadorKeys.detalle(proyectoId) })
}

const cola = new Outbox({
  almacen: almacenIdb,
  ejecutar: ejecutarEscritura,
  onConfirmada: (escritura, _resultado, conEspera) => {
    if (!conEspera) refrescarProyecto(escritura.proyectoId)
  },
  onRechazada: (escritura, _error, conEspera) => {
    // Rechazo definitivo: la mutación en espera revierte sola (onError). Si no hay mutación
    // esperando (venía de una recarga), la caché se refresca para quitar el cambio rechazado.
    if (!conEspera) refrescarProyecto(escritura.proyectoId)
  },
  onErrorPersistencia: (error, contexto) => {
    // La escritura sigue en memoria y se envía igual. Lo que se pierde es la garantía de
    // sobrevivir a una recarga mientras no haya IndexedDB disponible.
    console.error(`[cotizador] no se pudo ${contexto === 'leer' ? 'leer' : 'guardar'} la cola local de escrituras; si recargas la página, lo pendiente podría perderse:`, error)
  },
})

/** Vincula la caché de TanStack Query y arranca la cola: restaura lo pendiente y lo reenvía. */
export function iniciarOutboxCotizador(qc: QueryClient): void {
  queryClient = qc
  if (typeof window === 'undefined') return
  if (typeof indexedDB === 'undefined') {
    console.warn('[cotizador] IndexedDB no está disponible: las escrituras pendientes no sobreviven a una recarga.')
  }
  void cola.iniciar().then(() => cola.procesar())
  window.addEventListener('online', () => void cola.procesar())
}

/** Encola una escritura del cotizador con los mismos argumentos que su Server Action. Tipado
 *  contra la firma real de la acción. Resuelve con el resultado del servidor; se rechaza solo si
 *  el servidor la rechaza de forma definitiva. Los fallos de red no rechazan: se reintentan. */
export function encolarCotizador<K extends NombreAccionCotizador>(
  nombre: K,
  proyectoId: string,
  ...args: Parameters<Acciones[K]>
): Promise<Awaited<ReturnType<Acciones[K]>>> {
  return cola.encolar(nombre, args, proyectoId) as Promise<Awaited<ReturnType<Acciones[K]>>>
}
