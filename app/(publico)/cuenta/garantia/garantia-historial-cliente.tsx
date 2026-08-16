'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { ReportarGarantiaModal } from '@/components/veta/reportar-garantia-modal'
import { useDataStore } from '@/lib/data'
import type { EstadoCasoGarantia } from '@/lib/data'

// F-07 Portal Cliente — Historial de garantías del cliente.
// Componente 'use client' que consume useDataStore() filtrado por clienteId.

const ESTADO_LABEL: Record<EstadoCasoGarantia, string> = {
  reportado: 'Reportado',
  diagnosticado: 'Diagnosticado',
  en_reparacion: 'En reparación',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
}

const ESTADO_TONE: Record<EstadoCasoGarantia, 'neutral' | 'info' | 'warning' | 'danger'> = {
  reportado: 'warning',
  diagnosticado: 'info',
  en_reparacion: 'warning',
  resuelto: 'info',
  cerrado: 'neutral',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface GarantiaHistorialClienteProps {
  clienteId: string
}

export function GarantiaHistorialCliente({ clienteId }: GarantiaHistorialClienteProps) {
  const store = useDataStore()

  const casos = useMemo(
    () => store.casosGarantia.porCliente(clienteId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.getVersion(), clienteId]
  )

  const proyectos = useMemo(
    () => store.proyectos.listar().filter((p) => p.clienteId === clienteId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.getVersion(), clienteId]
  )

  const proyectoMap = useMemo(() => {
    const map = new Map<string, string>()
    proyectos.forEach((p) => map.set(p.id, p.nombreProyecto))
    return map
  }, [proyectos])

  // Proyectos entregados del cliente (para el modal de reporte)
  const proyectosEntregados = useMemo(
    () => proyectos.filter((p) => p.estado === 'entregado'),
    [proyectos]
  )

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <Link href="/cuenta" className="text-xs uppercase tracking-wide text-text-muted hover:underline">
            Mis proyectos
          </Link>
          <h1 className="font-display text-3xl font-semibold text-text-heading mt-1">Garantía</h1>
          <p className="text-sm text-text-muted mt-1">Historial de reportes de garantía</p>
        </div>
        {proyectosEntregados.length > 0 && (
          <ReportarGarantiaModal clienteId={clienteId} proyectos={proyectosEntregados} />
        )}
      </header>

      {casos.length === 0 ? (
        <div className="rounded-lg border border-border-subtle bg-bg-raised p-8 text-center">
          <p className="text-text-muted">No tenés reportes de garantía.</p>
          <p className="text-xs text-text-muted mt-2">
            Podés reportar desde el detalle de cada proyecto entregado.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {casos.map((caso) => (
            <div
              key={caso.id}
              className="rounded-lg border border-border-subtle bg-bg-raised p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display text-base font-medium text-text-heading">
                      {proyectoMap.get(caso.proyectoId) ?? 'Proyecto'}
                    </h3>
                    <Badge tone={ESTADO_TONE[caso.estado]} variant="material">
                      {ESTADO_LABEL[caso.estado]}
                    </Badge>
                    {caso.dentroGarantiaContractual && (
                      <Badge tone="info" variant="material">En garantía</Badge>
                    )}
                  </div>
                  <p className="text-sm text-text-muted">{caso.descripcion}</p>
                  <p className="text-xs text-text-muted mt-1">
                    Reportado: {formatDate(caso.fechaReporte)}
                  </p>
                </div>
              </div>

              {caso.diagnostico && (
                <div className="mt-3 border-t border-border-subtle pt-3">
                  <p className="text-xs font-semibold uppercase text-text-muted mb-1">Diagnóstico</p>
                  <p className="text-sm text-text-heading">{caso.diagnostico}</p>
                </div>
              )}

              {caso.solucionAplicada && (
                <div className="mt-2">
                  <p className="text-xs font-semibold uppercase text-text-muted mb-1">Solución</p>
                  <p className="text-sm text-text-heading">{caso.solucionAplicada}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Export para compatibilidad con el page.tsx
export function GarantiaHistorialClienteConReportar({ clienteId }: GarantiaHistorialClienteProps) {
  return <GarantiaHistorialCliente clienteId={clienteId} />
}
