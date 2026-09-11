// Hooks TanStack Query de Galería / Renders Conceptuales (Fase 2).
// Reemplaza useDataStore()/store.renderesConceptuales.* en app/erp/portafolio/galeria/page.tsx.
'use client'

import { useQuery } from '@tanstack/react-query'
import { useMutationOptGenerico, upsertPorId, eliminarPorId } from './factory'
import { rendersConceptualesKeys } from './queryKeys'
import {
  listarRendersConceptualesAction,
  crearRenderConceptualAction,
  actualizarRenderConceptualAction,
  eliminarRenderConceptualAction,
} from '@/lib/data/actions/renders'
import type { RenderConceptual } from '@/lib/data/contracts'

export function useRendersConceptuales() {
  return useQuery<RenderConceptual[]>({
    queryKey: rendersConceptualesKeys.listado,
    queryFn: () => listarRendersConceptualesAction(),
  })
}

/** Crear no tiene id cliente-generado — sin optimismo de inserción (igual que testimonios), la
 * fila real se agrega recién en `reconciliar`, en cuanto responde el servidor. */
export function useCrearRenderConceptualMutation() {
  return useMutationOptGenerico<RenderConceptual[], Parameters<typeof crearRenderConceptualAction>[0], RenderConceptual>(
    rendersConceptualesKeys.listado,
    (data) => crearRenderConceptualAction(data),
    (lista) => lista,
    (lista, real) => upsertPorId(lista, real),
  )
}

export function useActualizarRenderConceptualMutation() {
  return useMutationOptGenerico<RenderConceptual[], { id: string; patch: Partial<Pick<RenderConceptual, 'tipoEspacio' | 'imagenUrl' | 'titulo' | 'visible' | 'orden'>> }, RenderConceptual | null>(
    rendersConceptualesKeys.listado,
    ({ id, patch }) => actualizarRenderConceptualAction(id, patch),
    (lista, { id, patch }) => lista.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    (lista, real) => (real ? upsertPorId(lista, real) : lista),
  )
}

export function useEliminarRenderConceptualMutation() {
  return useMutationOptGenerico<RenderConceptual[], string, boolean>(
    rendersConceptualesKeys.listado,
    (id) => eliminarRenderConceptualAction(id),
    (lista, id) => eliminarPorId(lista, id),
    undefined,
    { invalidarSiempre: true },
  )
}
