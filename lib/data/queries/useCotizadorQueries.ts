// Hooks TanStack Query del cotizador (A6, plan_cotizador_tanstack_query.md §1 DESPUÉS).
// 'use client': useQuery sobre obtenerSnapshotCotizadorAction (una sola read action escopada)
// y useMutation a las Server Actions con onMutate optimista / onError rollback / onSettled
// invalidación selectiva. Nada de esto llama notify() ni dispara fetchSnapshotAction (64 tablas).
//
// Nota de escrituras: van directo a la Server Action + setQueryData (no al DataStore). La
// propagación cross-usuario sigue por la DB trigger → snap bridge invalida ['cotizador', id].
'use client'

import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useMutationOptGenerico, upsertPorId, eliminarPorId } from './factory'
import {
  crearItemAction,
  actualizarItemAction,
  eliminarItemAction,
  crearEspacioAction,
  actualizarEspacioAction,
  marcarActivaEspacioAction,
  eliminarEspacioAction,
  actualizarJornadasAction,
  actualizarParametrosFinancierosAction,
  crearArtefactoAction,
  actualizarArtefactoAction,
  duplicarEspacioAction,
  crearGrupoItemAction,
  actualizarGrupoItemAction,
  eliminarGrupoItemAction,
} from '@/lib/data/actions/core'
import { obtenerSnapshotCotizadorAction } from '@/lib/data/actions/lecturas-cotizador'
import {
  obtenerEstadoPublicacionPropuestaAction,
  publicarPropuestaAction,
  listarVersionesPropuestaAction,
  eliminarVersionPropuestaAction,
  type EstadoPublicacionPropuesta,
} from '@/lib/data/actions/public'
import type { PropuestaVersion } from '@/lib/data'
import { cotizadorKeys, propuestaVersionKeys } from './queryKeys'
import {
  agregarArtefacto,
  agregarEspacio,
  agregarItem,
  actualizarArtefacto,
  actualizarEspacio,
  actualizarItem,
  actualizarJornadas,
  actualizarProyecto,
  construirArtefactoOptimista,
  construirItemOptimista,
  eliminarEspacio,
  eliminarItem,
  marcarEspacioActiva,
  upsertArtefacto,
  upsertEspacio,
  upsertItem,
  upsertProyecto,
  type InputArtefactoOptimista,
  type InputEspacioOptimista,
  type InputItemOptimista,
  fusionarPendientes,
  registrarItemPendiente,
  liberarItemPendiente,
  obtenerItemsPendientes,
} from './optimistic'
import type { CotizadorSnapshot } from './types'
import type { EspacioArtefacto, EspacioVariante, GrupoItem, ItemVariante, Proyecto } from '../contracts'

export function useCotizadorSnapshot(proyectoId: string) {
  return useQuery<CotizadorSnapshot>({
    queryKey: cotizadorKeys.detalle(proyectoId),
    queryFn: async () => {
      const snap = await obtenerSnapshotCotizadorAction(proyectoId)
      return fusionarPendientes(snap, obtenerItemsPendientes(proyectoId))
    },
    // Config de DEC-2 (ERP-wide): datos colaborativos siempre frescos; el long-poll manda.
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: 1,
    // Un refetch que momentáneamente no trae data (p.ej. tras GC de cache) NO debe vaciar la
    // pantalla — se queda con los datos anteriores hasta que llegan los nuevos.
    placeholderData: keepPreviousData,
  })
}

// --- Items (B2) ---

export function useCrearItemMutation(proyectoId: string) {
  return useMutationOptGenerico<CotizadorSnapshot, InputItemOptimista, ItemVariante>(
    cotizadorKeys.detalle(proyectoId),
    (input) =>
      crearItemAction({
        id: input.id,
        varianteId: input.varianteId,
        catalogoId: input.catalogoId,
        cantidad: input.cantidad,
        precioUnitario: input.precioUnitario ?? '0',
        nombrePersonalizado: input.nombrePersonalizado,
        esReferencial: input.esReferencial,
        fuenteReferencial: input.fuenteReferencial,
        grupoReferencial: input.grupoReferencial,
        comentario: input.comentario,
      }),
    (snap, input) => agregarItem(snap, construirItemOptimista(input)),
    (snap, r) => upsertItem(snap, r),
    {
      onMutateExtra: (input) => registrarItemPendiente(proyectoId, construirItemOptimista(input)),
      onSettledExtra: (input) => liberarItemPendiente(proyectoId, input.id),
    },
  )
}

export function useActualizarItemMutation(proyectoId: string) {
  return useMutationOptGenerico<
    CotizadorSnapshot,
    { id: string; patch: Partial<Pick<ItemVariante, 'catalogoId' | 'cantidad' | 'precioUnitario' | 'nombrePersonalizado' | 'anulado' | 'esReferencial' | 'fuenteReferencial' | 'grupoReferencial' | 'comentario' | 'grupoItemId'>> },
    ItemVariante | null
  >(
    cotizadorKeys.detalle(proyectoId),
    ({ id, patch }) => actualizarItemAction(id, patch),
    (snap, { id, patch }) => actualizarItem(snap, id, patch),
    (snap, r) => (r ? upsertItem(snap, r) : snap),
  )
}

export function useEliminarItemMutation(proyectoId: string) {
  return useMutationOptGenerico<CotizadorSnapshot, { id: string }, boolean>(
    cotizadorKeys.detalle(proyectoId),
    ({ id }) => eliminarItemAction(id),
    (snap, { id }) => eliminarItem(snap, id),
    undefined,
    { invalidarSiempre: true },
  )
}

// --- Espacios / variantes (B3) ---

export function useCrearEspacioMutation(proyectoId: string) {
  return useMutationOptGenerico<CotizadorSnapshot, InputEspacioOptimista, EspacioVariante>(
    cotizadorKeys.detalle(proyectoId),
    (input) =>
      crearEspacioAction({
        id: input.id,
        proyectoId,
        nombreEspacio: input.nombreEspacio,
        nombreVariante: input.nombreVariante,
        tipoEspacio: input.tipoEspacio,
        descripcion: input.descripcion,
        visibleEnPropuestaPublica: input.visibleEnPropuestaPublica,
        orden: input.orden,
        jornadasDesarrolloTecnico: input.jornadasDesarrolloTecnico,
        jornadasEnsamblajeTaller: input.jornadasEnsamblajeTaller,
        jornadasInstalacionObra: input.jornadasInstalacionObra,
      }),
    (snap, input) => agregarEspacio(snap, { ...input, proyectoId }),
    (snap, r) => upsertEspacio(snap, r),
  )
}

export function useActualizarEspacioMutation(proyectoId: string) {
  return useMutationOptGenerico<
    CotizadorSnapshot,
    { id: string; patch: Partial<Pick<EspacioVariante, 'nombreEspacio' | 'nombreVariante' | 'tipoEspacio' | 'descripcion' | 'activa' | 'visibleEnPropuestaPublica' | 'colores' | 'fotosEspacio' | 'fotosDisenio' | 'fotosReferencia'>> },
    EspacioVariante | null
  >(
    cotizadorKeys.detalle(proyectoId),
    ({ id, patch }) => actualizarEspacioAction(id, patch),
    (snap, { id, patch }) => actualizarEspacio(snap, id, patch),
    (snap, r) => (r ? upsertEspacio(snap, r) : snap),
  )
}

export function useMarcarEspacioActivaMutation(proyectoId: string) {
  return useMutationOptGenerico<CotizadorSnapshot, { id: string }, EspacioVariante | null>(
    cotizadorKeys.detalle(proyectoId),
    ({ id }) => marcarActivaEspacioAction(id),
    (snap, { id }) => marcarEspacioActiva(snap, id),
    (snap, r) => (r ? upsertEspacio(snap, r) : snap),
  )
}

export function useEliminarEspacioMutation(proyectoId: string) {
  return useMutationOptGenerico<CotizadorSnapshot, { id: string }, boolean>(
    cotizadorKeys.detalle(proyectoId),
    ({ id }) => eliminarEspacioAction(id),
    (snap, { id }) => eliminarEspacio(snap, id),
    undefined,
    { invalidarSiempre: true },
  )
}

export function useActualizarJornadasMutation(proyectoId: string) {
  return useMutationOptGenerico<
    CotizadorSnapshot,
    { id: string; jornadas: { jornadasDesarrolloTecnico: string; jornadasEnsamblajeTaller: string; jornadasInstalacionObra: string } },
    EspacioVariante | null
  >(
    cotizadorKeys.detalle(proyectoId),
    ({ id, jornadas }) => actualizarJornadasAction(id, jornadas),
    (snap, { id, jornadas }) => actualizarJornadas(snap, id, jornadas),
    (snap, r) => (r ? upsertEspacio(snap, r) : snap),
  )
}

export function useDuplicarEspacioMutation(proyectoId: string) {
  // Duplicar no es trivialmente optimizable (ids clonados nuevos); refetch selectivo.
  return useMutationOptGenerico<CotizadorSnapshot, { id: string; opciones: { vacio: boolean; nuevoNombreEspacio?: string } }, EspacioVariante | null>(
    cotizadorKeys.detalle(proyectoId),
    ({ id, opciones }) => duplicarEspacioAction(id, opciones),
    (snap) => snap,
    undefined,
    { invalidarSiempre: true },
  )
}

// --- Proyecto (parámetros financieros / renombres, B3) ---

export function useActualizarParametrosFinancierosMutation(proyectoId: string) {
  return useMutationOptGenerico<
    CotizadorSnapshot,
    { id: string; partial: Partial<Pick<Proyecto, 'aplicaIva' | 'porcentajeIva' | 'garantiaAnios' | 'costosOperativos' | 'imprevistosInstalacion' | 'descuentoComercial' | 'ajusteArbitrario'>> },
    Proyecto | null
  >(
    cotizadorKeys.detalle(proyectoId),
    ({ id, partial }) => actualizarParametrosFinancierosAction(id, partial),
    (snap, { id, partial }) => actualizarProyecto(snap, id, partial),
    (snap, r) => (r ? upsertProyecto(snap, r) : snap),
  )
}

// --- Artefactos (B3) ---

export function useCrearArtefactoMutation(proyectoId: string) {
  return useMutationOptGenerico<CotizadorSnapshot, InputArtefactoOptimista, EspacioArtefacto>(
    cotizadorKeys.detalle(proyectoId),
    (input) =>
      crearArtefactoAction({
        id: input.id,
        espacioVarianteId: input.espacioVarianteId,
        categoria: input.categoria,
        dimensionesMm: input.dimensionesMm,
        tipoSpecifique: input.tipoSpecifique,
        ubicacion: input.ubicacion,
        fotoUrl: input.fotoUrl,
        requiereVerificacion: input.requiereVerificacion,
      }),
    (snap, input) => agregarArtefacto(snap, construirArtefactoOptimista(input)),
    (snap, r) => upsertArtefacto(snap, r),
  )
}

export function useActualizarArtefactoMutation(proyectoId: string) {
  return useMutationOptGenerico<
    CotizadorSnapshot,
    { id: string; patch: Partial<Pick<EspacioArtefacto, 'dimensionesMm' | 'tipoSpecifique' | 'ubicacion' | 'fotoUrl'>> },
    EspacioArtefacto | null
  >(
    cotizadorKeys.detalle(proyectoId),
    ({ id, patch }) => actualizarArtefactoAction(id, patch),
    (snap, { id, patch }) => actualizarArtefacto(snap, id, patch),
    (snap, r) => (r ? upsertArtefacto(snap, r) : snap),
  )
}

// --- Grupos de ítems de cotización (t-157, 2026-09-10) — árbol Espacio → Grupo → Subgrupo →
// Ítems. Igual que duplicarEspacio arriba: no trivialmente optimizable con un merge local
// simple (ids server-generados, reordenamiento de hermanos), así que se resuelve con
// invalidación selectiva del snapshot en vez de un aplicarOptimista real — consistente con el
// resto del cluster de "escrituras poco frecuentes" del cotizador.

export function useCrearGrupoItemMutation(proyectoId: string) {
  return useMutationOptGenerico<CotizadorSnapshot, { espacioVarianteId: string; nombre: string; padreId: string | null }, GrupoItem>(
    cotizadorKeys.detalle(proyectoId),
    ({ espacioVarianteId, nombre, padreId }) => crearGrupoItemAction(espacioVarianteId, nombre, padreId),
    (snap) => snap,
    undefined,
    { invalidarSiempre: true },
  )
}

export function useActualizarGrupoItemMutation(proyectoId: string) {
  return useMutationOptGenerico<
    CotizadorSnapshot,
    { id: string; cambios: Partial<Pick<GrupoItem, 'nombre' | 'padreId' | 'orden'>> },
    GrupoItem | null
  >(
    cotizadorKeys.detalle(proyectoId),
    ({ id, cambios }) => actualizarGrupoItemAction(id, cambios),
    (snap) => snap,
    undefined,
    { invalidarSiempre: true },
  )
}

export function useEliminarGrupoItemMutation(proyectoId: string) {
  return useMutationOptGenerico<CotizadorSnapshot, { id: string }, boolean>(
    cotizadorKeys.detalle(proyectoId),
    ({ id }) => eliminarGrupoItemAction(id),
    (snap) => snap,
    undefined,
    { invalidarSiempre: true },
  )
}

// --- Propuesta versionada (decisión axiomática 2026-09-10, Decisión 2 — t-156) ---
// Nodo de cache independiente del snapshot del cotizador (propuestaVersionKeys, no cotizadorKeys):
// publicar no toca items/espacios, solo agrega una fila en propuestas_versiones.

/** Estado del botón dinámico del header: label "Publicar" (nunca se publicó) vs. "Crear nueva
 * versión" (ya existe al menos una), más el timestamp humano de la última publicación. */
export function useEstadoPublicacionPropuesta(proyectoId: string) {
  return useQuery<EstadoPublicacionPropuesta>({
    queryKey: propuestaVersionKeys.estadoPublicacion(proyectoId),
    queryFn: () => obtenerEstadoPublicacionPropuestaAction(proyectoId),
    staleTime: 0,
  })
}

/** Congela un snapshot nuevo (botón "Publicar"/"Crear nueva versión"). Acepta un nombre libre
 * opcional (2026-09-11, control de versiones amigable — ej. "Ajuste post-reunión") en vez de
 * depender solo del número de versión. Al asentar, invalida el estado de publicación y el
 * listado para que el botón, el timestamp y la lista de versiones se actualicen solos. No toca
 * cotizadorKeys.detalle — publicar no cambia nada del snapshot editable. */
export function usePublicarPropuestaMutation(proyectoId: string) {
  const queryKey = propuestaVersionKeys.listado(proyectoId)
  const qc = useQueryClient()
  return useMutationOptGenerico<PropuestaVersion[], string | undefined, PropuestaVersion>(
    queryKey,
    (nombre) => publicarPropuestaAction(proyectoId, undefined, nombre ?? null),
    (lista, nombre) => {
      const maxVersion = lista.reduce((max, v) => Math.max(max, v.version), 0)
      const optimista: PropuestaVersion = {
        id: `temp-version-${Date.now()}`,
        proyectoId,
        version: maxVersion + 1,
        nombre: nombre?.trim() || null,
        snapshotJson: {},
        publicadaEn: new Date().toISOString(),
        publicadaPorId: null,
      }
      return upsertPorId(lista, optimista)
    },
    (lista, real) => upsertPorId(lista.filter((v) => !v.id.startsWith('temp-version-')), real),
    {
      onSettledExtra: () => {
        void qc.invalidateQueries({ queryKey: propuestaVersionKeys.estadoPublicacion(proyectoId) })
      },
    },
  )
}

/** Histórico completo de versiones publicadas (orden ascendente v1, v2, v3...) — alimenta el
 * modal de control de versiones (2026-09-11). */
export function useVersionesPropuesta(proyectoId: string) {
  return useQuery<PropuestaVersion[]>({
    queryKey: propuestaVersionKeys.listado(proyectoId),
    queryFn: () => listarVersionesPropuestaAction(proyectoId),
  })
}

/** Elimina una versión de prueba del histórico (2026-09-11: pedido explícito de Javier — las
 * versiones de prueba pueden contaminar el histórico que ve el cliente final). Invalida listado
 * Y estado de publicación: si se borró la última, el botón/timestamp deben reflejar la anterior
 * (o volver a "Publicar" si no queda ninguna). */
export function useEliminarVersionPropuestaMutation(proyectoId: string) {
  const queryKey = propuestaVersionKeys.listado(proyectoId)
  const qc = useQueryClient()
  return useMutationOptGenerico<PropuestaVersion[], string, boolean>(
    queryKey,
    (id) => eliminarVersionPropuestaAction(id),
    (lista, id) => eliminarPorId(lista, id),
    undefined,
    {
      invalidarSiempre: true,
      onSettledExtra: () => {
        void qc.invalidateQueries({ queryKey: propuestaVersionKeys.estadoPublicacion(proyectoId) })
      },
    },
  )
}