'use client'
// QueryClientProvider ERP-wide (DEC-2, plan_cotizador_tanstack_query.md): montado en
// app/erp/layout.tsx. Config pensada para datos colaborativos del cotizador: staleTime 0
// (nunca cache fresca que esconda un cambio de otra pestaña), refetchOnWindowFocus false
// (el long-poll / SnapBridge mandan), retry 1, gcTime default.
import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

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
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}