// Persistencia de la caché de TanStack Query en IndexedDB (no localStorage: tiene un límite de
// ~5 MB que un snapshot del cotizador puede superar, y es síncrono). Usa idb-keyval, una
// envoltura mínima y estándar de IndexedDB, sin proveedor externo.
'use client'

import { createStore, get, set, del } from 'idb-keyval'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'

const store = typeof indexedDB === 'undefined' ? null : createStore('veta-erp', 'cache-query')

const storageIdb = {
  getItem: async (key: string): Promise<string | null> => {
    if (!store) return null
    return (await get<string>(key, store)) ?? null
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (store) await set(key, value, store)
  },
  removeItem: async (key: string): Promise<void> => {
    if (store) await del(key, store)
  },
}

/** Persister de la caché del ERP. Se crea solo en el navegador (el layout puede renderizar en el
 *  servidor). Clave nueva: la anterior de localStorage ('veta-cotizador-cache') queda sin uso. */
export function crearPersisterIdb() {
  return createAsyncStoragePersister({ storage: storageIdb, key: 'veta-erp-cache' })
}
