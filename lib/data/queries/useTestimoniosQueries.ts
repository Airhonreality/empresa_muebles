// Hooks TanStack Query de Testimonios (Fase 2, primer piloto fuera del DataStore legacy).
// Reemplaza useDataStore()/store.testimonios.* en app/erp/portafolio/testimonios/page.tsx.
'use client'

import { useQuery } from '@tanstack/react-query'
import { useMutationOptGenerico, upsertPorId } from './factory'
import { testimoniosKeys } from './queryKeys'
import {
  listarTestimoniosAction,
  crearTestimonioAction,
  actualizarTestimonioAction,
  publicarTestimonioAction,
  despublicarTestimonioAction,
} from '@/lib/data/actions/portafolio'
import type { Testimonio } from '@/lib/data/contracts'

export function useTestimonios() {
  return useQuery<Testimonio[]>({
    queryKey: testimoniosKeys.listado,
    queryFn: () => listarTestimoniosAction(),
  })
}

/** Crear no tiene id cliente-generado (a diferencia de items/espacios del cotizador) — no hay
 * forma segura de mostrar una fila optimista identificable antes de la respuesta real, así que
 * no se inserta nada en onMutate (no-op); en éxito, reconciliar agrega la fila real ya con su id
 * de servidor. Sigue siendo más rápido que antes: ya no espera un refetch de 64 tablas, solo la
 * respuesta de este insert + el cache local de testimonios. */
export function useCrearTestimonioMutation() {
  return useMutationOptGenerico<Testimonio[], Parameters<typeof crearTestimonioAction>[0], Testimonio>(
    testimoniosKeys.listado,
    (data) => crearTestimonioAction(data),
    (lista) => lista,
    (lista, real) => upsertPorId(lista, real),
  )
}

export function useActualizarTestimonioMutation() {
  return useMutationOptGenerico<Testimonio[], { id: string; patch: Partial<Testimonio> }, Testimonio | null>(
    testimoniosKeys.listado,
    ({ id, patch }) => actualizarTestimonioAction(id, patch),
    (lista, { id, patch }) => lista.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    (lista, real) => (real ? upsertPorId(lista, real) : lista),
  )
}

export function usePublicarTestimonioMutation() {
  return useMutationOptGenerico<Testimonio[], string, Testimonio | null>(
    testimoniosKeys.listado,
    (id) => publicarTestimonioAction(id),
    (lista, id) => lista.map((t) => (t.id === id ? { ...t, publicado: true, aprobado: true, curado: true } : t)),
    (lista, real) => (real ? upsertPorId(lista, real) : lista),
  )
}

export function useDespublicarTestimonioMutation() {
  return useMutationOptGenerico<Testimonio[], string, Testimonio | null>(
    testimoniosKeys.listado,
    (id) => despublicarTestimonioAction(id),
    (lista, id) => lista.map((t) => (t.id === id ? { ...t, publicado: false } : t)),
    (lista, real) => (real ? upsertPorId(lista, real) : lista),
  )
}
