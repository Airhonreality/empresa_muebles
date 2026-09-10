// Hooks TanStack Query del cotizador (A6, plan_cotizador_tanstack_query.md §1 DESPUÉS).
// 'use client': useQuery sobre obtenerSnapshotCotizadorAction (una sola read action escopada)
// y useMutation a las Server Actions con onMutate optimista / onError rollback / onSettled
// invalidación selectiva. Nada de esto llama notify() ni dispara fetchSnapshotAction (64 tablas).
//
// Nota de escrituras: van directo a la Server Action + setQueryData (no al DataStore). La
// propagación cross-usuario sigue por la DB trigger → snap bridge invalida ['cotizador', id].
'use client'

import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
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
} from '@/lib/data/actions/core'
import { obtenerSnapshotCotizadorAction } from '@/lib/data/actions/lecturas-cotizador'
import { cotizadorKeys } from './queryKeys'
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
import type { EspacioArtefacto, EspacioVariante, ItemVariante, Proyecto } from '../contracts'

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

interface ContextoMutacion {
  previous?: CotizadorSnapshot
}

interface OpcionesMutationOpt<TVars> {
  /** Se llama dentro de onMutate, después de aplicar el optimismo — para registries externos (Fase 1.3). */
  onMutateExtra?: (vars: TVars) => void
  /** Se llama dentro de onSettled, antes de decidir si invalidar. */
  onSettledExtra?: (vars: TVars) => void
  /** Mutations sin `reconciliar` (eliminar*, duplicarEspacio) necesitan invalidar SIEMPRE al
   * asentar, sin depender del gate/debounce de CotizadorSnapBridge — si no, su resultado puede
   * no aparecer nunca en pantalla (no hay optimismo real que lo muestre). */
  invalidarSiempre?: boolean
}

function useMutationOpt<TVars, TResult>(
  proyectoId: string,
  mutationFn: (vars: TVars) => Promise<TResult>,
  aplicarOptimista: (snapshot: CotizadorSnapshot, vars: TVars) => CotizadorSnapshot,
  reconciliar?: (snapshot: CotizadorSnapshot, result: TResult) => CotizadorSnapshot,
  opciones?: OpcionesMutationOpt<TVars>,
) {
  const qc = useQueryClient()
  const queryKey = cotizadorKeys.detalle(proyectoId)
  return useMutation<TResult, Error, TVars, ContextoMutacion>({
    // Permite a CotizadorSnapBridge filtrar "¿hay mutations de ESTA pantalla en vuelo?" (Fase 1.2).
    mutationKey: queryKey,
    mutationFn,
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey })
      const previous = qc.getQueryData<CotizadorSnapshot>(queryKey)
      if (previous) qc.setQueryData<CotizadorSnapshot>(queryKey, aplicarOptimista(previous, vars))
      opciones?.onMutateExtra?.(vars)
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData<CotizadorSnapshot>(queryKey, ctx.previous)
    },
    onSuccess: (result, _vars, ctx) => {
      if (ctx?.previous && reconciliar && result !== null && result !== undefined) {
        qc.setQueryData<CotizadorSnapshot>(queryKey, (cur) => (cur ? reconciliar(cur, result) : cur))
      }
    },
    onSettled: (_result, _err, vars) => {
      opciones?.onSettledExtra?.(vars)
      // Se quita la invalidación redundante por defecto (Fase 1.1): la correctitud local ya la
      // da onSuccess/reconciliar; la propagación multi-usuario la da el puente
      // (NOTIFY -> version++ -> CotizadorSnapBridge). Solo las mutations sin reconciliar
      // (eliminar*/duplicarEspacio) piden invalidarSiempre para no depender del gate del puente.
      if (opciones?.invalidarSiempre) void qc.invalidateQueries({ queryKey })
    },
  })
}

// --- Items (B2) ---

export function useCrearItemMutation(proyectoId: string) {
  return useMutationOpt<InputItemOptimista, ItemVariante>(
    proyectoId,
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
  return useMutationOpt<
    { id: string; patch: Partial<Pick<ItemVariante, 'catalogoId' | 'cantidad' | 'precioUnitario' | 'nombrePersonalizado' | 'anulado' | 'esReferencial' | 'fuenteReferencial' | 'grupoReferencial'>> },
    ItemVariante | null
  >(
    proyectoId,
    ({ id, patch }) => actualizarItemAction(id, patch),
    (snap, { id, patch }) => actualizarItem(snap, id, patch),
    (snap, r) => (r ? upsertItem(snap, r) : snap),
  )
}

export function useEliminarItemMutation(proyectoId: string) {
  return useMutationOpt<{ id: string }, boolean>(
    proyectoId,
    ({ id }) => eliminarItemAction(id),
    (snap, { id }) => eliminarItem(snap, id),
    undefined,
    { invalidarSiempre: true },
  )
}

// --- Espacios / variantes (B3) ---

export function useCrearEspacioMutation(proyectoId: string) {
  return useMutationOpt<InputEspacioOptimista, EspacioVariante>(
    proyectoId,
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
  return useMutationOpt<
    { id: string; patch: Partial<Pick<EspacioVariante, 'nombreEspacio' | 'nombreVariante' | 'tipoEspacio' | 'descripcion' | 'activa' | 'visibleEnPropuestaPublica' | 'colores' | 'fotosEspacio' | 'fotosDisenio' | 'fotosReferencia'>> },
    EspacioVariante | null
  >(
    proyectoId,
    ({ id, patch }) => actualizarEspacioAction(id, patch),
    (snap, { id, patch }) => actualizarEspacio(snap, id, patch),
    (snap, r) => (r ? upsertEspacio(snap, r) : snap),
  )
}

export function useMarcarEspacioActivaMutation(proyectoId: string) {
  return useMutationOpt<{ id: string }, EspacioVariante | null>(
    proyectoId,
    ({ id }) => marcarActivaEspacioAction(id),
    (snap, { id }) => marcarEspacioActiva(snap, id),
    (snap, r) => (r ? upsertEspacio(snap, r) : snap),
  )
}

export function useEliminarEspacioMutation(proyectoId: string) {
  return useMutationOpt<{ id: string }, boolean>(
    proyectoId,
    ({ id }) => eliminarEspacioAction(id),
    (snap, { id }) => eliminarEspacio(snap, id),
    undefined,
    { invalidarSiempre: true },
  )
}

export function useActualizarJornadasMutation(proyectoId: string) {
  return useMutationOpt<
    { id: string; jornadas: { jornadasDesarrolloTecnico: string; jornadasEnsamblajeTaller: string; jornadasInstalacionObra: string } },
    EspacioVariante | null
  >(
    proyectoId,
    ({ id, jornadas }) => actualizarJornadasAction(id, jornadas),
    (snap, { id, jornadas }) => actualizarJornadas(snap, id, jornadas),
    (snap, r) => (r ? upsertEspacio(snap, r) : snap),
  )
}

export function useDuplicarEspacioMutation(proyectoId: string) {
  // Duplicar no es trivialmente optimizable (ids clonados nuevos); refetch selectivo.
  return useMutationOpt<{ id: string; opciones: { vacio: boolean; nuevoNombreEspacio?: string } }, EspacioVariante | null>(
    proyectoId,
    ({ id, opciones }) => duplicarEspacioAction(id, opciones),
    (snap) => snap,
    undefined,
    { invalidarSiempre: true },
  )
}

// --- Proyecto (parámetros financieros / renombres, B3) ---

export function useActualizarParametrosFinancierosMutation(proyectoId: string) {
  return useMutationOpt<
    { id: string; partial: Partial<Pick<Proyecto, 'aplicaIva' | 'porcentajeIva' | 'garantiaAnios'>> },
    Proyecto | null
  >(
    proyectoId,
    ({ id, partial }) => actualizarParametrosFinancierosAction(id, partial),
    (snap, { id, partial }) => actualizarProyecto(snap, id, partial),
    (snap, r) => (r ? upsertProyecto(snap, r) : snap),
  )
}

// --- Artefactos (B3) ---

export function useCrearArtefactoMutation(proyectoId: string) {
  return useMutationOpt<InputArtefactoOptimista, EspacioArtefacto>(
    proyectoId,
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
  return useMutationOpt<
    { id: string; patch: Partial<Pick<EspacioArtefacto, 'dimensionesMm' | 'tipoSpecifique' | 'ubicacion' | 'fotoUrl'>> },
    EspacioArtefacto | null
  >(
    proyectoId,
    ({ id, patch }) => actualizarArtefactoAction(id, patch),
    (snap, { id, patch }) => actualizarArtefacto(snap, id, patch),
    (snap, r) => (r ? upsertArtefacto(snap, r) : snap),
  )
}