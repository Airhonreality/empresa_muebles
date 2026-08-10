'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useMemo } from 'react'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { useDataStore } from '@/lib/data'

export default function ProyectoHubPage() {
  const params = useParams()
  const proyectoId = params.proyectoId as string
  const store = useDataStore()
  const version = store.getVersion()

  const proyecto = store.proyectos.obtenerPorId(proyectoId)
  const cliente = proyecto?.clienteId ? store.clientes.obtenerPorId(proyecto.clienteId) : undefined
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const verificaciones = useMemo(() => proyecto ? store.verificaciones.porProyecto(proyectoId) : [], [proyectoId, store, version])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const desfases = useMemo(() => proyecto ? store.desfases.porProyecto(proyectoId) : [], [proyectoId, store, version])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const schemas = useMemo(() => proyecto ? store.schemas.porProyecto(proyectoId) : [], [proyectoId, store, version])

  if (!proyecto) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-text-muted">Proyecto no encontrado</p>
        <p className="text-xs font-mono mt-2">{proyectoId}</p>
      </div>
    )
  }

  const estadoLabels: Record<string, string> = {
    borrador: 'Borrador',
    en_revision: 'En revisión',
    cotizado: 'Cotizado',
    negociacion: 'Negociación',
    en_contrato: 'En contrato',
    desarrollo: 'En desarrollo técnico',
    aprobado_compras: 'Aprobado para compras',
    armado: 'En armado',
    verificado: 'Verificado',
    en_instalacion: 'En instalación',
    instalado: 'Instalado',
    entregado: 'Entregado',
    perdida: 'Pérdida',
    cancelada: 'Cancelada',
    activa: 'Activa',
    enviada: 'Enviada',
    pre_produccion: 'Pre-producción',
    produccion: 'Producción',
    retoma: 'Retoma',
  }

  const estadoBadgeTone = (estado: string): 'info' | 'warning' | 'danger' | 'neutral' => {
    if (['desarrollo', 'aprobado_compras', 'armado'].includes(estado)) return 'info'
    if (['en_instalacion', 'instalado', 'entregado'].includes(estado)) return 'info'
    if (['en_revision', 'negociacion', 'pre_produccion'].includes(estado)) return 'warning'
    return 'danger'
  }

  const verificacionSchema = verificaciones.find(v => v.tipoGate === 'schema')
  const gateStatusBadge = !verificacionSchema ? 'pending' : verificacionSchema.veredicto === 'aprobado' ? 'approved' : 'rejected'

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="font-display text-3xl font-semibold text-text-heading">
              {proyecto.nombreProyecto}
            </h1>
            {cliente && (
              <p className="text-sm text-text-muted mt-2">
                Cliente: {cliente.nombre}
              </p>
            )}
            {proyecto.direccionObra && (
              <p className="text-xs text-text-muted mt-1">Ubicación: {proyecto.direccionObra}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={estadoBadgeTone(proyecto.estado)} dot>
              {estadoLabels[proyecto.estado] || proyecto.estado}
            </Badge>
          </div>
        </div>
      </header>

      {/* Timeline de Gates */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-4">Timeline de Gates</h2>
        <div className="flex items-center gap-4 overflow-x-auto pb-4">
          {/* Gate E-18: Schema */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="flex items-center justify-center w-16 h-16 rounded-lg border-2 border-border-subtle bg-bg-raised">
              {gateStatusBadge === 'approved' && (
                <span className="text-2xl">✅</span>
              )}
              {gateStatusBadge === 'rejected' && (
                <span className="text-2xl">🔴</span>
              )}
              {gateStatusBadge === 'pending' && (
                <span className="text-2xl">⏳</span>
              )}
            </div>
            <p className="text-xs font-semibold text-text-heading">Esquema</p>
            <p className="text-[11px] text-text-muted">E-18</p>
          </div>

          {/* Connectors */}
          <div className="flex-shrink-0 w-8 h-0.5 bg-border-subtle" />

          {/* Gate E-33: Desfase (if applicable) */}
          {desfases.length > 0 && (
            <>
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="flex items-center justify-center w-16 h-16 rounded-lg border-2 border-border-subtle bg-bg-raised">
                  {desfases[desfases.length - 1].aplicado ? (
                    <span className="text-2xl">⚠️</span>
                  ) : (
                    <span className="text-2xl">⏳</span>
                  )}
                </div>
                <p className="text-xs font-semibold text-text-heading">Desfase</p>
                <p className="text-[11px] text-text-muted">E-33</p>
              </div>
              <div className="flex-shrink-0 w-8 h-0.5 bg-border-subtle" />
            </>
          )}

          {/* Gate E-25: Instalación (future) */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="flex items-center justify-center w-16 h-16 rounded-lg border-2 border-border-dashed border-border-subtle bg-bg-raised opacity-50">
              <span className="text-2xl">🔒</span>
            </div>
            <p className="text-xs font-semibold text-text-heading">Instalación</p>
            <p className="text-[11px] text-text-muted">E-25</p>
          </div>
        </div>
      </section>

      {/* Actions */}
      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border-subtle bg-bg-raised p-6">
          <h3 className="font-semibold text-text-heading mb-3">Retoma de Medidas</h3>
          <p className="text-sm text-text-muted mb-4">
            Registro de medidas y anomalías detectadas en obra.
          </p>
          <Link href={`/erp/proyectos/${proyectoId}/retoma`}>
            <Button variant="primary" size="md" className="w-full">
              Ir a Retoma
            </Button>
          </Link>
        </div>

        <div className="rounded-lg border border-border-subtle bg-bg-raised p-6">
          <h3 className="font-semibold text-text-heading mb-3">Esquema y Veredicto</h3>
          <p className="text-sm text-text-muted mb-4">
            Carga, revisión y aprobación del esquema técnico.
          </p>
          <Link href={`/erp/proyectos/${proyectoId}/desarrollo`}>
            <Button variant="primary" size="md" className="w-full">
              Ir a Esquema
            </Button>
          </Link>
        </div>

        <div className="rounded-lg border border-border-subtle bg-bg-raised p-6">
          <h3 className="font-semibold text-text-heading mb-3">Cronograma</h3>
          <p className="text-sm text-text-muted mb-4">
            Línea contractual/interna, novedades críticas y check de producción.
          </p>
          <Link href={`/erp/proyectos/${proyectoId}/cronograma`}>
            <Button variant="primary" size="md" className="w-full">
              Ir a Cronograma
            </Button>
          </Link>
        </div>

        <div className="rounded-lg border border-border-subtle bg-bg-raised p-6">
          <h3 className="font-semibold text-text-heading mb-3">Calidad</h3>
          <p className="text-sm text-text-muted mb-4">
            Citación y veredicto de calidad tras el armado en taller.
          </p>
          <Link href={`/erp/proyectos/${proyectoId}/calidad`}>
            <Button variant="primary" size="md" className="w-full">
              Ir a Calidad
            </Button>
          </Link>
        </div>

        <div className="rounded-lg border border-border-subtle bg-bg-raised p-6">
          <h3 className="font-semibold text-text-heading mb-3">Instalación</h3>
          <p className="text-sm text-text-muted mb-4">
            Programación y ejecución de la instalación en obra.
          </p>
          <Link href={`/erp/proyectos/${proyectoId}/instalacion`}>
            <Button variant="primary" size="md" className="w-full">
              Ir a Instalación
            </Button>
          </Link>
        </div>

        <div className="rounded-lg border border-border-subtle bg-bg-raised p-6">
          <h3 className="font-semibold text-text-heading mb-3">Entrega</h3>
          <p className="text-sm text-text-muted mb-4">
            Acta de entrega firmada, cierre del proyecto.
          </p>
          <Link href={`/erp/proyectos/${proyectoId}/entrega`}>
            <Button variant="primary" size="md" className="w-full">
              Ir a Entrega
            </Button>
          </Link>
        </div>
      </section>

      {/* Schema Info */}
      {schemas.length > 0 && (
        <section className="mb-8 rounded-lg border border-border-subtle bg-bg-raised p-6">
          <h3 className="font-semibold text-text-heading mb-4">Esquemas</h3>
          <div className="space-y-2">
            {schemas.map((schema) => (
              <div key={schema.id} className="flex items-center justify-between text-sm border-b border-border-subtle/50 pb-2 last:border-0">
                <div>
                  <span className="text-text-heading">Versión {schema.version}</span>
                  <p className="text-xs text-text-muted mt-0.5">
                    Creado: {new Date(schema.createdAt).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <Badge tone={
                  schema.estado === 'aprobado_compras' ? 'info' :
                  schema.estado === 'para_revision' ? 'warning' :
                  schema.estado === 'en_reproceso' ? 'danger' :
                  'neutral'
                }>
                  {schema.estado}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Verificaciones */}
      {verificaciones.length > 0 && (
        <section className="rounded-lg border border-border-subtle bg-bg-raised p-6">
          <h3 className="font-semibold text-text-heading mb-4">Verificaciones</h3>
          <div className="space-y-2">
            {verificaciones.map((ver) => (
              <div key={ver.id} className="flex items-center justify-between text-sm border-b border-border-subtle/50 pb-2 last:border-0">
                <div>
                  <span className="text-text-heading">Gate: {ver.tipoGate}</span>
                  <p className="text-xs text-text-muted mt-0.5">
                    {new Date(ver.creadoEn).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <Badge tone={ver.veredicto === 'aprobado' ? 'info' : 'danger'}>
                  {ver.veredicto}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
