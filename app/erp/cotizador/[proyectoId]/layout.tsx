// Layout del cotizador de un proyecto: monta el puente de sincronización
// TangStack Query en el subárbol (B4, plan_cotizador_tanstack_query.md). El seed
// inicial sale del DataStore SSR (layout /erp → fetchSnapshotAction) y cada versión
// global invalida SOLO la query escopada ['cotizador', proyectoId].
'use client'

import { useParams } from 'next/navigation'
import type { ReactNode } from 'react'
import { CotizadorSnapBridge } from '@/lib/data/queries/CotizadorSnapBridge'

export default function CotizadorProyectoLayout({ children }: { children: ReactNode }) {
  const params = useParams<{ proyectoId: string }>()
  const proyectoId = params.proyectoId
  return (
    <>
      <CotizadorSnapBridge proyectoId={proyectoId} />
      {children}
    </>
  )
}