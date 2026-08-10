// Fábrica del store de datos, sin imports de React — separado de index.ts a
// propósito (t-auth-cliente-f07, 2026-08-09): index.ts también exporta
// useDataStore() (usa useSyncExternalStore), y Next marca CUALQUIER archivo
// que toque ese hook como "necesita 'use client'" apenas se lo importa desde
// una cadena server-only (ej. Server Actions), aunque nunca se llame al hook.
// Módulos de servidor plano (ej. lib/auth/session.ts) importan getDataStore
// desde acá para no arrastrar esa restricción. index.ts sigue siendo el
// punto de entrada para componentes React (re-exporta todo esto + el hook).
//
// DATA_IMPL=mock  → repositorio en memoria (prototipo, default en dev)
// DATA_IMPL=drizzle → adaptador real (no implementado aún, lanza error)
// Guard: mock está prohibido si VERCEL=1 (despliegue real). En local, next build con mock es válido para verificar prototipo.
import type { DataStore } from './contracts'
import { createMockStore } from './mock-store'
import { createDrizzleStore } from './drizzle-impl'

let store: DataStore | null = null

export function getDataStore(): DataStore {
  if (store) return store

  const impl = process.env.DATA_IMPL ?? 'mock'

  if (impl === 'drizzle') {
    store = createDrizzleStore()
  } else if (impl === 'mock') {
    if (process.env.VERCEL === '1') {
      throw new Error('DATA_IMPL=mock no puede desplegarse en Vercel. Usá DATA_IMPL=drizzle para producción real.')
    }
    store = createMockStore()
  } else {
    throw new Error(`DATA_IMPL="${impl}" no es válido. Usá "mock" o "drizzle".`)
  }

  return store
}
