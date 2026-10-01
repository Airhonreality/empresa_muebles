'use client'
// QueryClientProvider ERP-wide (DEC-2, plan_cotizador_tanstack_query.md): montado en
// app/erp/layout.tsx. Config pensada para datos colaborativos del cotizador: staleTime 0
// (nunca cache fresca que esconda un cambio de otra pestaña), refetchOnWindowFocus false
// (el long-poll / SnapBridge mandan), retry 1, gcTime default.
//
// t-178 (2026-09-30): persistencia a localStorage SOLO del nodo `['cotizador', ...]` -- cierra
// el hueco dejado explícitamente en t-170. Antes, si cerrabas/recargabas la pestaña en plena
// desconexión, el caché (en memoria únicamente) desaparecía y la pantalla volvía a mostrar lo
// último confirmado por el servidor, sin rastro de lo que se veía justo antes. Ahora el último
// snapshot queda en el dispositivo; con `staleTime: 0` se refresca solo apenas hay red de nuevo
// (mismo mecanismo que ya usa `keepPreviousData` en useCotizadorSnapshot). Escopado a un solo
// prefijo de queryKey a propósito: el resto del ERP (taller, finanzas, catálogo...) no necesita
// este respaldo y persistir todo el caché arriesgaría llenar el límite de localStorage sin
// ningún beneficio real.
import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

const VEINTICUATRO_HORAS_MS = 1000 * 60 * 60 * 24

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  )

  // `window` no existe en el primer render server-side de este componente 'use client' -- el
  // persister solo se crea en el cliente, donde `localStorage` sí está disponible.
  const [persister] = useState(() =>
    typeof window === 'undefined'
      ? null
      : createSyncStoragePersister({ storage: window.localStorage, key: 'veta-cotizador-cache' }),
  )

  if (!persister) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister,
        maxAge: VEINTICUATRO_HORAS_MS,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => query.queryKey[0] === 'cotizador',
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}
