// Fábrica del store MOCK, sin imports de React — separado de index.ts a propósito
// (t-auth-cliente-f07, 2026-08-09): index.ts también exporta useDataStore() (usa
// useSyncExternalStore), y Next marca CUALQUIER archivo que toque ese hook como
// "necesita 'use client'" apenas se lo importa desde una cadena server-only (ej.
// Server Actions), aunque nunca se llame al hook. Módulos de servidor plano (ej.
// lib/auth/session.ts) importan getDataStore desde acá para no arrastrar esa
// restricción. index.ts sigue siendo el punto de entrada para componentes React.
//
// DATA_IMPL=mock    → repositorio en memoria (prototipo, default en dev). getDataStore()
//                      sigue siendo un singleton síncrono válido acá.
// DATA_IMPL=drizzle → adaptador real sobre Neon (§3.1d, plan_f10_migracion.md). El store real
//                      NO es un singleton ad-hoc: lo construye DataStoreProvider (lib/data/DataStoreProvider.tsx)
//                      a partir del snapshot inicial que sirve el layout raíz (Server Component), y
//                      useDataStore() lo lee de React Context. getDataStore() con DATA_IMPL=drizzle
//                      lanza un error explícito — es una trampa intencional para detectar código que
//                      todavía asume el singleton viejo.
// Guard: mock está prohibido si VERCEL=1 (despliegue real). En local, next build con mock es válido para verificar prototipo.
// Escape temporal de preview (F10-Opción A, 2026-08-12): si VERCEL=1 Y ALLOW_MOCK_PREVIEW=1,
// se permite mock SOLO en el entorno Preview de Vercel para validar el pipeline/UI sin datos reales.
// NUNCA debe setearse ALLOW_MOCK_PREVIEW en el entorno Production.
import type { DataStore } from './contracts'
import { createMockStore } from './mock-store'

let store: DataStore | null = null

export function getDataStore(): DataStore {
  if (store) return store

  const impl = process.env.DATA_IMPL ?? 'mock'

  if (impl === 'drizzle') {
    throw new Error(
      'getDataStore() no sirve para DATA_IMPL=drizzle. El store real se construye vía <DataStoreProvider> ' +
      '(lib/data/DataStoreProvider.tsx) a partir del snapshot del layout raíz, y useDataStore() lo lee de Context. ' +
      'Si este error viene de un módulo server-only (ej. lib/auth/session.ts), esa consulta puntual debe hacerse ' +
      'con Drizzle directo (lib/db/client), no a través de getDataStore(). Ver plan_f10_migracion.md §3.1d.'
    )
  } else if (impl === 'mock') {
    if (process.env.VERCEL === '1' && process.env.ALLOW_MOCK_PREVIEW !== '1') {
      throw new Error('DATA_IMPL=mock no puede desplegarse en Vercel (salvo ALLOW_MOCK_PREVIEW=1 en preview). Usá DATA_IMPL=drizzle para producción real.')
    }
    store = createMockStore()
  } else {
    throw new Error(`DATA_IMPL="${impl}" no es válido. Usá "mock" o "drizzle".`)
  }

  return store
}
