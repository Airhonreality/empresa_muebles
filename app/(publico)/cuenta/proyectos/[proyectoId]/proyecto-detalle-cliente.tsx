'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { ArbolProyectoSelector } from '@/components/veta/arbol-proyecto-selector'
import { ReportarGarantiaModal } from '@/components/veta/reportar-garantia-modal'
import { useDataStore } from '@/lib/data'
import type { EstadoProyecto } from '@/lib/data'

// F-07 Portal Cliente — Detalle de proyecto (ProyectoDetalleCliente).
// Componente 'use client' que consume useDataStore() filtrado por clienteId.

const ESTADO_LABEL: Record<EstadoProyecto, string> = {
  borrador: 'Borrador',
  en_revision: 'En revisión',
  cotizado: 'En diseño',
  negociacion: 'Negociación',
  en_contrato: 'En contrato',
  desarrollo: 'Desarrollo',
  aprobado_compras: 'Aprobado compras',
  armado: 'En taller',
  verificado: 'Verificado',
  en_instalacion: 'En instalación',
  instalado: 'Instalado',
  entregado: 'Entregado',
  perdida: 'Perdida',
  cancelada: 'Cancelada',
  activa: 'Activa',
  enviada: 'Enviada',
  pre_produccion: 'Pre-producción',
  produccion: 'Producción',
  retoma: 'Retoma',
}

const ESTADO_TONE: Record<EstadoProyecto, 'neutral' | 'info' | 'warning' | 'danger'> = {
  borrador: 'neutral',
  en_revision: 'neutral',
  cotizado: 'info',
  negociacion: 'info',
  en_contrato: 'info',
  desarrollo: 'info',
  aprobado_compras: 'info',
  armado: 'warning',
  verificado: 'warning',
  en_instalacion: 'warning',
  instalado: 'info',
  entregado: 'info',
  perdida: 'danger',
  cancelada: 'danger',
  activa: 'info',
  enviada: 'info',
  pre_produccion: 'info',
  produccion: 'warning',
  retoma: 'warning',
}

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function parseNum(s: string | null | undefined): number {
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface ProyectoDetalleClienteProps {
  proyectoId: string
  clienteId: string
}

export function ProyectoDetalleCliente({ proyectoId, clienteId }: ProyectoDetalleClienteProps) {
  const store = useDataStore()
  const [garantiaEnviado, setGarantiaEnviado] = useState(false)

  const proyecto = useMemo(
    () => store.proyectos.obtenerPorId(proyectoId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.getVersion(), proyectoId]
  )

  const espacios = useMemo(
    () => store.espacios.porProyecto(proyectoId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.getVersion(), proyectoId]
  )

  const contrato = useMemo(
    () => store.contratos.porProyecto(proyectoId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.getVersion(), proyectoId]
  )

  const obligaciones = useMemo(
    () => store.obligacionesPendientes.porProyecto(proyectoId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.getVersion(), proyectoId]
  )

  const movimientos = useMemo(
    () => store.movimientosFinancieros.listar().filter((m) => m.proyectoId === proyectoId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.getVersion(), proyectoId]
  )

  const comunicacionesVisibles = useMemo(
    () => store.comunicaciones.visiblesAlCliente(proyectoId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.getVersion(), proyectoId]
  )

  const instalaciones = useMemo(
    () => store.instalaciones.porProyecto(proyectoId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.getVersion(), proyectoId]
  )

  const actaEntrega = useMemo(
    () => store.actasEntrega.porProyecto(proyectoId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.getVersion(), proyectoId]
  )

  const casosGarantia = useMemo(
    () => store.casosGarantia.porProyecto(proyectoId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.getVersion(), proyectoId]
  )

  const modulos = useMemo(
    () => store.modulos.porProyecto(proyectoId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.getVersion(), proyectoId]
  )

  if (!proyecto) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="text-text-muted">Proyecto no encontrado.</p>
        <Link href="/cuenta" className="text-sm text-brand mt-4 inline-block hover:underline">
          Volver a mis proyectos
        </Link>
      </div>
    )
  }

  // Obligaciones del cliente (aislamiento R5: sin costos internos)
  const obligacionesCliente = obligaciones.filter(
    (o) => o.clienteId === clienteId && o.origen === 'contrato_hito'
  )
  const totalPagado = obligacionesCliente.reduce((s, o) => s + parseNum(o.montoPagado), 0)
  const totalContrato = contrato ? parseNum(contrato.valorTotal) : 0
  const saldoPendiente = totalContrato - totalPagado

  // Módulos instalados/entregados para garantía (R3)
  const modulosGarantia = modulos.filter(
    (m) => m.estado === 'en_instalacion' || m.estado === 'aprobado'
  )

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <Link href="/cuenta" className="text-xs uppercase tracking-wide text-text-muted hover:underline">
            Mis proyectos
          </Link>
          <h1 className="font-display text-3xl font-semibold text-text-heading mt-1">
            {proyecto.nombreProyecto}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge tone={ESTADO_TONE[proyecto.estado]} variant="material">
              {ESTADO_LABEL[proyecto.estado] ?? proyecto.estado}
            </Badge>
            {proyecto.direccionObra && (
              <span className="text-sm text-text-muted">{proyecto.direccionObra}</span>
            )}
          </div>
        </div>
      </header>

      {/* ResumenContrato */}
      {contrato && (
        <section className="mb-8 rounded-lg border border-border-subtle bg-bg-raised p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-3">Contrato</h2>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <span className="text-text-muted">Código</span>
              <p className="font-mono text-text-heading">{contrato.codigoContrato}</p>
            </div>
            <div>
              <span className="text-text-muted">Valor total</span>
              <p className="font-mono text-text-heading">{formatCOP(totalContrato)}</p>
            </div>
            <div>
              <span className="text-text-muted">Plazo</span>
              <p className="text-text-heading">{contrato.plazoEjecucionTexto}</p>
            </div>
            <div>
              <span className="text-text-muted">Garantía</span>
              <p className="text-text-heading">{contrato.garantiaAnios} años</p>
            </div>
          </div>
        </section>
      )}

      {/* Ambientes */}
      {espacios.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-3">Ambientes</h2>
          <div className="space-y-3">
            {espacios.filter((e) => e.activa).map((esp) => (
              <div key={esp.id} className="rounded-lg border border-border-subtle bg-bg-raised p-4">
                <h3 className="font-display text-base font-medium text-text-heading">{esp.nombreEspacio}</h3>
                <p className="text-xs text-text-muted">{esp.nombreVariante}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Abonos y saldos */}
      {obligacionesCliente.length > 0 && (
        <section className="mb-8 rounded-lg border border-border-subtle bg-bg-raised p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-3">Abonos y saldos</h2>
          <div className="space-y-1">
            {obligacionesCliente.map((o) => {
              const saldo = parseNum(o.montoTotal) - parseNum(o.montoPagado)
              return (
                <div key={o.id} className="flex justify-between text-sm border-b border-border-subtle/50 py-1.5 last:border-0">
                  <span className="text-text-heading">{o.descripcion}</span>
                  <div className="text-right">
                    <span className="font-mono text-text-heading">{formatCOP(parseNum(o.montoTotal))}</span>
                    {saldo > 0 && (
                      <span className="text-xs text-amber-600 ml-2">Saldo: {formatCOP(saldo)}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-3 flex justify-between text-sm font-semibold border-t border-border-subtle pt-3">
            <span>Total pagado</span>
            <span className="font-mono">{formatCOP(totalPagado)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold">
            <span>Saldo pendiente</span>
            <span className="font-mono text-amber-600">{formatCOP(saldoPendiente)}</span>
          </div>

          {/* Historial de movimientos */}
          {movimientos.length > 0 && (
            <div className="mt-4 border-t border-border-subtle pt-3">
              <p className="text-xs font-semibold uppercase text-text-muted mb-2">Historial de pagos</p>
              <div className="space-y-1">
                {movimientos.filter((m) => m.tipo === 'credito').map((m) => (
                  <div key={m.id} className="flex justify-between text-xs text-text-muted">
                    <span>{formatDate(m.fecha)} — {m.descripcion}</span>
                    <span className="font-mono">{formatCOP(parseNum(m.monto))}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Progreso */}
      {comunicacionesVisibles.length > 0 && (
        <section className="mb-8 rounded-lg border border-border-subtle bg-bg-raised p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-3">Progreso</h2>
          <div className="space-y-3">
            {[...comunicacionesVisibles].reverse().map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" />
                <div>
                  <p className="text-sm text-text-heading">{c.contenido}</p>
                  <p className="text-xs text-text-muted">{formatDate(c.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Instalación */}
      {instalaciones.length > 0 && (
        <section className="mb-8 rounded-lg border border-border-subtle bg-bg-raised p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-3">Instalación</h2>
          {instalaciones.map((inst) => (
            <div key={inst.id} className="text-sm">
              <p className="text-text-heading">
                {formatDate(inst.rangoFechaInicio)} — {formatDate(inst.rangoFechaFin)}
              </p>
              <Badge tone={inst.estado === 'instalada' ? 'info' : 'warning'} variant="material">
                {inst.estado}
              </Badge>
            </div>
          ))}
        </section>
      )}

      {/* Acta de entrega */}
      {actaEntrega && (
        <section className="mb-8 rounded-lg border border-border-subtle bg-bg-raised p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-3">Acta de entrega</h2>
          <div className="flex items-center gap-3">
            <Badge
              tone={actaEntrega.estado === 'firmada' ? 'info' : 'warning'}
              variant="material"
            >
              {actaEntrega.estado}
            </Badge>
            {actaEntrega.pdfUrl && (actaEntrega.estado === 'generada' || actaEntrega.estado === 'enviada' || actaEntrega.estado === 'firmada') && (
              <a
                href={actaEntrega.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-brand hover:underline"
              >
                Descargar PDF
              </a>
            )}
          </div>
        </section>
      )}

      {/* Garantía */}
      {proyecto.estado === 'entregado' && (
        <section className="mb-8 rounded-lg border border-border-subtle bg-bg-raised p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-3">Garantía</h2>

          {/* Reportar garantía */}
          {modulosGarantia.length > 0 && (
            <div className="mb-4">
              <ReportarGarantiaModal
                clienteId={clienteId}
                proyectoId={proyectoId}
                modulos={modulos}
                onSuccess={() => setGarantiaEnviado(true)}
              />
            </div>
          )}
          {garantiaEnviado && (
            <div className="mb-4 rounded border border-green-200 bg-green-50/50 p-4 text-sm text-green-700">
              Reporte enviado correctamente.
            </div>
          )}

          {/* Historial de garantías */}
          {casosGarantia.length > 0 && (
            <div className="space-y-2">
              {casosGarantia.map((caso) => (
                <div key={caso.id} className="flex justify-between text-sm border-b border-border-subtle/50 py-1.5 last:border-0">
                  <span className="text-text-heading">{caso.descripcion}</span>
                  <Badge tone={caso.estado === 'cerrado' || caso.estado === 'resuelto' ? 'info' : 'warning'} variant="material">
                    {caso.estado}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          {casosGarantia.length === 0 && modulosGarantia.length === 0 && (
            <p className="text-sm text-text-muted">No hay módulos elegibles para garantía.</p>
          )}
        </section>
      )}
    </div>
  )
}
