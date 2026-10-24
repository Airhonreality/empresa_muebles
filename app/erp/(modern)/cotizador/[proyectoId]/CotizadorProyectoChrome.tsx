'use client'

import type { ReactNode } from 'react'
import { CotizadorSnapBridge } from '@/lib/data/queries/CotizadorSnapBridge'
import { BannerSinConexion } from '@/components/veta/banner-sin-conexion'
import { HistorialDeshacerListener } from '@/components/veta/historial-deshacer-listener'

export function CotizadorProyectoChrome({
  proyectoId,
  children,
}: {
  proyectoId: string
  children: ReactNode
}) {
  return (
    <>
      <CotizadorSnapBridge proyectoId={proyectoId} />
      <BannerSinConexion proyectoId={proyectoId} />
      <HistorialDeshacerListener proyectoId={proyectoId} />
      {children}
    </>
  )
}
