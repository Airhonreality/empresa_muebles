// Factory genérica de mutaciones optimistas TanStack Query (Fase 0 de la migración sistemática,
// aprobada por Supervisor). Generaliza el patrón onMutate/onError/onSuccess/onSettled que antes
// vivía hardcodeado a CotizadorSnapshot dentro de useCotizadorQueries.ts — ahora cualquier módulo
// puede reusarlo pasando su propio queryKey y shape de datos, sin reescribir el plumbing.
'use client'

import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'

export interface ContextoMutacionOpt<TSnapshot> {
  previous?: TSnapshot
}

export interface OpcionesMutationOpt<TVars> {
  /** Se llama dentro de onMutate, después de aplicar el optimismo (registries externos). */
  onMutateExtra?: (vars: TVars) => void
  /** Se llama dentro de onSettled, antes de decidir si invalidar. */
  onSettledExtra?: (vars: TVars) => void
  /** Mutations sin `reconciliar` necesitan invalidar SIEMPRE al asentar, sin depender de ningún
   * puente de invalidación externo — si no, su resultado puede no aparecer nunca en pantalla. */
  invalidarSiempre?: boolean
}

/** Mutación optimista genérica: aplica `aplicarOptimista` al cache de `queryKey` antes de que el
 * servidor responda, hace rollback en error, y reconcilia con el resultado real en éxito. */
export function useMutationOptGenerico<TSnapshot, TVars, TResult>(
  queryKey: QueryKey,
  mutationFn: (vars: TVars) => Promise<TResult>,
  aplicarOptimista: (snapshot: TSnapshot, vars: TVars) => TSnapshot,
  reconciliar?: (snapshot: TSnapshot, result: TResult) => TSnapshot,
  opciones?: OpcionesMutationOpt<TVars>,
) {
  const qc = useQueryClient()
  return useMutation<TResult, Error, TVars, ContextoMutacionOpt<TSnapshot>>({
    mutationKey: queryKey,
    mutationFn,
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey })
      const previous = qc.getQueryData<TSnapshot>(queryKey)
      if (previous) qc.setQueryData<TSnapshot>(queryKey, aplicarOptimista(previous, vars))
      opciones?.onMutateExtra?.(vars)
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData<TSnapshot>(queryKey, ctx.previous)
    },
    onSuccess: (result, _vars, ctx) => {
      if (ctx?.previous && reconciliar && result !== null && result !== undefined) {
        qc.setQueryData<TSnapshot>(queryKey, (cur) => (cur ? reconciliar(cur as TSnapshot, result) : cur))
      }
    },
    onSettled: (_result, _err, vars) => {
      opciones?.onSettledExtra?.(vars)
      if (opciones?.invalidarSiempre) void qc.invalidateQueries({ queryKey })
    },
  })
}

// --- Helpers para el caso más común: un array de entidades identificadas por `id` ---

/** Inserta o reemplaza por id (create/upsert optimista para colecciones simples). */
export function upsertPorId<T extends { id: string }>(lista: T[], item: T): T[] {
  const existe = lista.some((x) => x.id === item.id)
  return existe ? lista.map((x) => (x.id === item.id ? item : x)) : [...lista, item]
}

/** Quita por id (delete optimista para colecciones simples). */
export function eliminarPorId<T extends { id: string }>(lista: T[], id: string): T[] {
  return lista.filter((x) => x.id !== id)
}
