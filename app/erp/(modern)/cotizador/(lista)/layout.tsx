import type { ReactNode } from 'react'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { obtenerSnapshotCotizadorListaAction } from '@/lib/data/actions/lecturas-cotizador-lista'
import {
  CotizadorListaCompatProvider,
  cotizadorListaKeys,
} from '@/lib/data/queries/cotizador-lista-compat'
import { CotizadorListaSnapBridge } from '@/lib/data/queries/CotizadorListaSnapBridge'

export const dynamic = 'force-dynamic'

export default async function CotizadorListaLayout({ children }: { children: ReactNode }) {
  const qc = new QueryClient()
  await qc.prefetchQuery({
    queryKey: cotizadorListaKeys.all,
    queryFn: obtenerSnapshotCotizadorListaAction,
  })

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <CotizadorListaCompatProvider>
        <CotizadorListaSnapBridge />
        {children}
      </CotizadorListaCompatProvider>
    </HydrationBoundary>
  )
}
