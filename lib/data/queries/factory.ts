// Factory genérica de mutaciones optimistas TanStack Query (Fase 0 de la migración sistemática,
// aprobada por Supervisor). Generaliza el patrón onMutate/onError/onSuccess/onSettled que antes
// vivía hardcodeado a CotizadorSnapshot dentro de useCotizadorQueries.ts — ahora cualquier módulo
// puede reusarlo pasando su propio queryKey y shape de datos, sin reescribir el plumbing.
'use client'

import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'

export interface ContextoMutacionOpt<TSnapshot> {
  previous?: TSnapshot
}

export interface OpcionesMutationOpt<TVars, TSnapshot> {
  /** Se llama dentro de onMutate, después de aplicar el optimismo (registries externos). */
  onMutateExtra?: (vars: TVars) => void
  /** Se llama dentro de onSettled, antes de decidir si invalidar. */
  onSettledExtra?: (vars: TVars) => void
  /** Mutations sin `reconciliar` necesitan invalidar SIEMPRE al asentar, sin depender de ningún
   * puente de invalidación externo — si no, su resultado puede no aparecer nunca en pantalla. */
  invalidarSiempre?: boolean
  /** Deshace SOLO el cambio de ESTA mutación, aplicado sobre el snapshot ACTUAL del cache (no
   * sobre el `previous` capturado en onMutate). Es el fix de t-170: dos mutaciones concurrentes
   * sobre el mismo queryKey capturan cada una su propio `previous` en instantes distintos: si
   * `onError` restaura ese `previous` a ciegas, pisa el trabajo de la mutación hermana que sí
   * tuvo éxito mientras esta fallaba (causa raíz del "titileo" y la pérdida de ítems reportada
   * 2026-09-30 tras un corte de red). Sin `revertirOptimista`, el fallback es invalidar (pedir
   * la verdad al servidor) en vez de sobreescribir con un snapshot potencialmente viejo. */
  revertirOptimista?: (actual: TSnapshot, vars: TVars, previo: TSnapshot) => TSnapshot
}

/** Mutación optimista genérica: aplica `aplicarOptimista` al cache de `queryKey` antes de que el
 * servidor responda, hace rollback en error, y reconcilia con el resultado real en éxito. */
export function useMutationOptGenerico<TSnapshot, TVars, TResult>(
  queryKey: QueryKey,
  mutationFn: (vars: TVars) => Promise<TResult>,
  aplicarOptimista: (snapshot: TSnapshot, vars: TVars) => TSnapshot,
  reconciliar?: (snapshot: TSnapshot, result: TResult, vars: TVars) => TSnapshot,
  opciones?: OpcionesMutationOpt<TVars, TSnapshot>,
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
    onError: (_err, vars, ctx) => {
      if (!ctx?.previous) return
      const previo = ctx.previous
      if (opciones?.revertirOptimista) {
        qc.setQueryData<TSnapshot>(queryKey, (actual) => (actual ? opciones.revertirOptimista!(actual, vars, previo) : actual))
      } else {
        // Sin deshacer dirigido: no pisar el cache actual (puede tener trabajo de otra mutación
        // en vuelo) con un snapshot viejo. Se pide la verdad al servidor en su lugar.
        void qc.invalidateQueries({ queryKey })
      }
    },
    onSuccess: (result, vars, ctx) => {
      const fallo = result === null || result === undefined || result === false
      if (fallo) {
        // Un `false`/`null` de la Server Action significa "la escritura no aplicó" (p.ej. el id
        // ya no existía) — el mismo tratamiento que un error de red: revertir dirigido si hay
        // cómo, si no invalidar. Antes esto se ignoraba en silencio y el optimismo quedaba
        // aplicado aunque el servidor nunca lo confirmó.
        if (ctx?.previous && opciones?.revertirOptimista) {
          const previo = ctx.previous
          qc.setQueryData<TSnapshot>(queryKey, (actual) => (actual ? opciones.revertirOptimista!(actual, vars, previo) : actual))
        } else if (!opciones?.invalidarSiempre) {
          void qc.invalidateQueries({ queryKey })
        }
        return
      }
      if (ctx?.previous && reconciliar) {
        qc.setQueryData<TSnapshot>(queryKey, (cur) => (cur ? reconciliar(cur as TSnapshot, result, vars) : cur))
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
