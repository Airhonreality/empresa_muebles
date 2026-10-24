import type { ReactNode } from 'react'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { obtenerSnapshotCatalogoAction } from '@/lib/data/actions/lecturas-catalogo'
import { CatalogoCompatProvider, catalogoKeys } from '@/lib/data/queries/catalogo-compat'
import { CatalogoSnapBridge } from '@/lib/data/queries/CatalogoSnapBridge'

export const dynamic = 'force-dynamic'

export default async function CatalogoLayout({ children }: { children: ReactNode }) {
  const qc = new QueryClient()
  await qc.prefetchQuery({
    queryKey: catalogoKeys.all,
    queryFn: obtenerSnapshotCatalogoAction,
  })

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <CatalogoCompatProvider>
        <CatalogoSnapBridge />
        {children}
      </CatalogoCompatProvider>
    </HydrationBoundary>
  )
}
