'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/veta/badge'
import { LinkButton } from '@/components/veta/button'
import { useDataStore, type Verificacion } from '@/lib/data'

export default function GatesPage() {
  const store = useDataStore()
  const version = store.getVersion()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const proyectos = useMemo(() => store.proyectos.listar(), [store, version])
  const verificaciones = useMemo(
    () => {
      const map = new Map<string, Verificacion[]>()
      proyectos.forEach(p => {
        map.set(p.id, store.verificaciones.porProyecto(p.id))
      })
      return map
    },
    [proyectos, store]
  )

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

  const getGateStatus = (proyectoId: string) => {
    const verificacionesProyecto = verificaciones.get(proyectoId) || []
    const schemaGate = verificacionesProyecto.find(v => v.tipoGate === 'schema')

    if (!schemaGate) return 'pending'
    if (schemaGate.veredicto === 'aprobado') return 'approved'
    return 'rejected'
  }

  const getGateBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return { emoji: '✅', label: 'Aprobado', tone: 'info' as const }
      case 'rejected':
        return { emoji: '🔴', label: 'Rechazado', tone: 'danger' as const }
      default:
        return { emoji: '⏳', label: 'Pendiente', tone: 'warning' as const }
    }
  }

  const proyectosConGates = proyectos.filter(p => p.estado === 'desarrollo')

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      {/* Header */}
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-text-heading">
          Gestión de Gates
        </h1>
        <p className="text-sm text-text-muted mt-2">
          Vista general de verificaciones y aprobaciones en desarrollo
        </p>
      </header>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-lg border border-border-subtle bg-bg-raised p-4">
          <p className="text-xs font-semibold uppercase text-text-muted">Total proyectos</p>
          <p className="text-2xl font-bold text-text-heading mt-2">{proyectos.length}</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-bg-raised p-4">
          <p className="text-xs font-semibold uppercase text-text-muted">En desarrollo</p>
          <p className="text-2xl font-bold text-text-heading mt-2">{proyectosConGates.length}</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-bg-raised p-4">
          <p className="text-xs font-semibold uppercase text-text-muted">Gates aprobados</p>
          <p className="text-2xl font-bold text-brand mt-2">
            {proyectosConGates.filter(p => getGateStatus(p.id) === 'approved').length}
          </p>
        </div>
      </div>

      {/* Tabla de proyectos */}
      <div className="rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bg-alt border-b border-border-subtle">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Proyecto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Gate Schema (E-18)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proyectosConGates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-text-muted">
                    No hay proyectos en desarrollo
                  </td>
                </tr>
              ) : (
                proyectosConGates.map((proyecto) => {
                  const gateStatus = getGateStatus(proyecto.id)
                  const gateBadge = getGateBadge(gateStatus)

                  return (
                    <tr key={proyecto.id} className="border-b border-border-subtle/50 last:border-0 hover:bg-bg-alt/50 transition-colors duration-fast">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-text-heading text-sm">
                            {proyecto.nombreProyecto}
                          </p>
                          <p className="text-xs text-text-muted mt-1">
                            ID: {proyecto.id.slice(0, 12)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={estadoBadgeTone(proyecto.estado)}>
                          {estadoLabels[proyecto.estado] || proyecto.estado}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{gateBadge.emoji}</span>
                          <Badge tone={gateBadge.tone}>
                            {gateBadge.label}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <LinkButton href={`/erp/proyectos/${proyecto.id}`} variant="ghost" size="md">
                          Ver detalles
                        </LinkButton>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info de gates */}
      <div className="mt-8 p-4 rounded-lg border border-border-subtle/50 bg-bg-paper">
        <p className="text-xs font-semibold uppercase text-text-muted mb-3">Gates disponibles</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <span className="text-lg flex-shrink-0">E-18</span>
            <div>
              <p className="text-sm font-semibold text-text-heading">Gate Schema</p>
              <p className="text-xs text-text-muted">Aprobación del esquema técnico por el verificador único</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-lg flex-shrink-0">E-25</span>
            <div>
              <p className="text-sm font-semibold text-text-heading">Gate Instalación</p>
              <p className="text-xs text-text-muted">Control y aprobación de la instalación en obra</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
