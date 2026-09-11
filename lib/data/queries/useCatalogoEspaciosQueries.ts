// Hooks TanStack Query de Catálogo de Espacios Arquitectónicos (Fase 2).
// Reemplaza useDataStore()/store.catalogosEspaciosArquitectonicos.* en
// app/erp/catalogos/espacios-arquitectonicos/page.tsx.
'use client'

import { useQuery } from '@tanstack/react-query'
import { useMutationOptGenerico, upsertPorId, eliminarPorId } from './factory'
import { catalogoEspaciosKeys } from './queryKeys'
import {
  listarCatalogoEspaciosAction,
  crearCatalogoEspacioAction,
  actualizarCatalogoEspacioAction,
  eliminarCatalogoEspacioAction,
} from '@/lib/data/actions/catalogo-espacios'
import type { CatalogoEspacioArquitectonico } from '@/lib/data/contracts'

export function useCatalogoEspacios() {
  return useQuery<CatalogoEspacioArquitectonico[]>({
    queryKey: catalogoEspaciosKeys.listado,
    queryFn: () => listarCatalogoEspaciosAction(),
  })
}

/** Crear no tiene id cliente-generado — sin optimismo de inserción (mismo patrón que testimonios
 * y galería), la fila real se agrega en `reconciliar` en cuanto responde el servidor. */
export function useCrearCatalogoEspacioMutation() {
  return useMutationOptGenerico<CatalogoEspacioArquitectonico[], Parameters<typeof crearCatalogoEspacioAction>[0], CatalogoEspacioArquitectonico>(
    catalogoEspaciosKeys.listado,
    (data) => crearCatalogoEspacioAction(data),
    (lista) => lista,
    (lista, real) => upsertPorId(lista, real),
  )
}

export function useActualizarCatalogoEspacioMutation() {
  return useMutationOptGenerico<CatalogoEspacioArquitectonico[], { id: string; patch: Partial<Pick<CatalogoEspacioArquitectonico, 'codigo' | 'nombre' | 'descripcion' | 'unidadBase' | 'rangoMinimo' | 'rangoMaximo' | 'ejemploTamanio' | 'modulosTipicosJson'>> }, CatalogoEspacioArquitectonico | null>(
    catalogoEspaciosKeys.listado,
    ({ id, patch }) => actualizarCatalogoEspacioAction(id, patch),
    (lista, { id, patch }) => lista.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    (lista, real) => (real ? upsertPorId(lista, real) : lista),
  )
}

export function useEliminarCatalogoEspacioMutation() {
  return useMutationOptGenerico<CatalogoEspacioArquitectonico[], string, boolean>(
    catalogoEspaciosKeys.listado,
    (id) => eliminarCatalogoEspacioAction(id),
    (lista, id) => eliminarPorId(lista, id),
    undefined,
    { invalidarSiempre: true },
  )
}
