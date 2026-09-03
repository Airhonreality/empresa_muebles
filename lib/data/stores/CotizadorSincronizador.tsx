// CotizadorSincronizador.tsx
// Puente de sincronización Zustand ↔ DataStore (Fase 1, ZN-002).
//
// Es un componente `'use client'` que se monta UNA vez (en el layout del cotizador).
// Se suscribe al DataStore vía `useDataStore()` (que a su vez usa useSyncExternalStore
// sobre `subscribe()` + `getVersion()`). En cada cambio de versión rehidrata el store
// Zustand con el slice del proyecto, de modo que los selectores de lectura selectivos
// siempre reflejan la misma fuente de verdad que la UI (misma suscripción del page).
//
// No reimplementa ninguna escritura: las escrituras del cotizador siguen pasando por el
// DataStore real (Server Actions + reactividad multi-usuario), exactamente igual que antes.

'use client'

import { useEffect } from 'react'
import { useDataStore } from '@/lib/data'
import { useCotizadorStore } from './useCotizadorStore'
import { hidratarSliceCotizador } from './hidratador'

/**
 * Hook interno: rehidrata el store Zustand desde el DataStore en cada cambio de versión.
 * Devuelve void; el re-render se produce vía los selectores en los componentes que los usan.
 */
function useFortalezaSincronizadorCotizador(proyectoId: string) {
  const store = useDataStore()
  const version = store.getVersion()

  useEffect(() => {
    const slice = hidratarSliceCotizador(store, proyectoId)
    useCotizadorStore.getState().hidratar({
      items: slice.items,
      espacios: slice.espacios,
      jornadasMap: slice.jornadasMap,
      catalogo: slice.catalogo,
      parametros: slice.parametros,
    })
  }, [store, version, proyectoId])
}

/**
 * Componente puente. Se monta una sola vez cerca de la raíz del cotizador.
 * No renderiza nada visible.
 */
export function CotizadorSincronizador({ proyectoId }: { proyectoId: string }) {
  useFortalezaSincronizadorCotizador(proyectoId)
  return null
}
