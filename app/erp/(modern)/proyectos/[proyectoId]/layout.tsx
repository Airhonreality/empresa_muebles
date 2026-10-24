import type { ReactNode } from 'react'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { obtenerSnapshotProyectoAction } from '@/lib/data/actions/lecturas-proyecto'
import { ProyectoCompatProvider } from '@/lib/data/queries/proyecto-compat'
import { ProyectoSnapBridge } from '@/lib/data/queries/ProyectoSnapBridge'
import { proyectoKeys } from '@/lib/data/queries/queryKeys'

export const dynamic = 'force-dynamic'

export default async function ProyectoLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ proyectoId: string }>
}) {
  const { proyectoId } = await params
  const qc = new QueryClient()
  await qc.prefetchQuery({
    queryKey: proyectoKeys.detalle(proyectoId),
    queryFn: () => obtenerSnapshotProyectoAction(proyectoId),
  })

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <ProyectoCompatProvider proyectoId={proyectoId}>
        <ProyectoSnapBridge proyectoId={proyectoId} />
        {children}
      </ProyectoCompatProvider>
    </HydrationBoundary>
  )
}
