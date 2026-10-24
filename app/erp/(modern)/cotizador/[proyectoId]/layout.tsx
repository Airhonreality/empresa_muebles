import type { ReactNode } from 'react'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { obtenerSnapshotCotizadorAction } from '@/lib/data/actions/lecturas-cotizador'
import { cotizadorKeys } from '@/lib/data/queries/queryKeys'
import { CotizadorProyectoChrome } from './CotizadorProyectoChrome'

export const dynamic = 'force-dynamic'

export default async function CotizadorProyectoLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ proyectoId: string }>
}) {
  const { proyectoId } = await params
  const qc = new QueryClient()
  await qc.prefetchQuery({
    queryKey: cotizadorKeys.detalle(proyectoId),
    queryFn: () => obtenerSnapshotCotizadorAction(proyectoId),
  })

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <CotizadorProyectoChrome proyectoId={proyectoId}>{children}</CotizadorProyectoChrome>
    </HydrationBoundary>
  )
}
