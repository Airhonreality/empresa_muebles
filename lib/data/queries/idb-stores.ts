// Fuente única de las bases y stores de IndexedDB del ERP.
//
// Regla: cada `createStore` de idb-keyval debe usar SU PROPIA base. idb-keyval solo crea el store
// cuando la base se crea por primera vez (open sin versión, onupgradeneeded). Si dos stores de
// distintos nombres comparten base, el segundo nunca existe y sus transacciones fallan con
// "One of the specified object stores was not found". Ver idb-stores.test.ts.
export const BASE_CACHE_IDB = { nombre: 'veta-erp-cache', almacen: 'cache-query' } as const
export const BASE_OUTBOX_IDB = { nombre: 'veta-erp-outbox', almacen: 'outbox' } as const
