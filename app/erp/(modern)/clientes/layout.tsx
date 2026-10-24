import type { ReactNode } from 'react'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { obtenerSnapshotClientesAction } from '@/lib/data/actions/lecturas-clientes'
import { ClientesCompatProvider, clientesKeys } from '@/lib/data/queries/clientes-compat'
import { ClientesSnapBridge } from '@/lib/data/queries/ClientesSnapBridge'

export const dynamic = 'force-dynamic'

export default async function ClientesLayout({ children }: { children: ReactNode }) {
  const qc = new QueryClient()
  await qc.prefetchQuery({
    queryKey: clientesKeys.all,
    queryFn: obtenerSnapshotClientesAction,
  })

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <ClientesCompatProvider>
        <ClientesSnapBridge />
        {children}
      </ClientesCompatProvider>
    </HydrationBoundary>
  )
}
