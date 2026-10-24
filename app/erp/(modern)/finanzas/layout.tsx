import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { FinanzasCompatProvider } from '@/lib/data/queries/finanzas-compat'
import { FinanzasSnapBridge } from '@/lib/data/queries/FinanzasSnapBridge'
import { obtenerSnapshotFinanzasAction } from '@/lib/data/actions/lecturas-finanzas'
import { finanzasKeys } from '@/lib/data/queries/queryKeys'

export const dynamic = 'force-dynamic'

export default async function FinanzasLayout({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient()
  await qc.prefetchQuery({
    queryKey: finanzasKeys.snapshot,
    queryFn: obtenerSnapshotFinanzasAction,
  })

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <FinanzasCompatProvider>
        <FinanzasSnapBridge />
        {children}
      </FinanzasCompatProvider>
    </HydrationBoundary>
  )
}
