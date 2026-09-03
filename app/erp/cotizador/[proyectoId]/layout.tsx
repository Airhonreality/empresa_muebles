// Layout del cotizador de un proyecto: monta el puente de sincronización
// Zustand ↔ DataStore una sola vez para todo el subárbol (Fase 1, ZN-002).
'use client'

import { useParams } from 'next/navigation'
import type { ReactNode } from 'react'
import { CotizadorSincronizador } from '@/lib/data/stores/CotizadorSincronizador'

export default function CotizadorProyectoLayout({ children }: { children: ReactNode }) {
  const params = useParams<{ proyectoId: string }>()
  const proyectoId = params.proyectoId
  return (
    <>
      <CotizadorSincronizador proyectoId={proyectoId} />
      {children}
    </>
  )
}
