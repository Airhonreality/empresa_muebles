'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { useDataStore, type EstadoInstalacion, type Instalacion } from '@/lib/data'
import { P24, rangoInstalacionValido } from '@/lib/modules/f4f5f6/gates'

const ETIQUETA_ESTADO: Record<EstadoInstalacion, string> = {
  programada: 'Programada',
  en_curso: 'En curso',
  instalada: 'Instalada',
  fallida: 'Fallida',
}

const BADGE_TONE: Record<EstadoInstalacion, 'neutral' | 'warning' | 'info' | 'danger'> = {
  programada: 'neutral',
  en_curso: 'warning',
  instalada: 'info',
  fallida: 'danger',
}

export default function InstalacionPage() {
  const params = useParams()
  const router = useRouter()
  const proyectoId = params.proyectoId as string
  const store = useDataStore()
  const version = store.getVersion()

  const proyecto = store.proyectos.obtenerPorId(proyectoId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const instalaciones = useMemo(() => proyecto ? store.instalaciones.porProyecto(proyectoId) : [], [proyectoId, store, version])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const citaciones = useMemo(() => proyecto ? store.citacionesCalidad.porProyecto(proyectoId) : [], [proyectoId, store, version])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const verificaciones = useMemo(() => proyecto ? store.verificaciones.porProyecto(proyectoId) : [], [proyectoId, store, version])

  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [fallidaMotivos, setFallidaMotivos] = useState<Record<string, string>>({})

  if (!proyecto) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-text-muted">Proyecto no encontrado</p>
      </div>
    )
  }

  const gateAprobado = P24(proyecto, citaciones, verificaciones)

  const handleProgramar = async () => {
    setFormError(null)
    if (!fechaInicio || !fechaFin) {
      setFormError('Seleccioná una fecha de inicio y una de fin para programar la instalación.')
      return
    }
    if (!rangoInstalacionValido(fechaInicio, fechaFin)) {
      setFormError('El rango de instalación no puede superar 5 días (R40).')
      return
    }
    const resultado = await store.instalaciones.programar({ proyectoId, rangoFechaInicio: fechaInicio, rangoFechaFin: fechaFin })
    if (!resultado) {
      setFormError('No se pudo programar la instalación. Verificá el rango de fechas.')
      return
    }
    setFechaInicio('')
    setFechaFin('')
  }

  const handleIniciar = async (instalacion: Instalacion) => {
    const resultado = await store.instalaciones.iniciar(instalacion.id)
    if (!resultado) {
      setFormError('No se pudo iniciar la instalación: el gate de calidad (E-24) debe estar aprobado para este proyecto.')
    }
  }

  const handleMarcarFallida = async (instalacion: Instalacion) => {
    const motivo = (fallidaMotivos[instalacion.id] ?? '').trim()
    if (!motivo) return
    await store.instalaciones.marcarFallida(instalacion.id, motivo)
    setFallidaMotivos(prev => ({ ...prev, [instalacion.id]: '' }))
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-heading">Instalación — Gate E-25</h1>
          <p className="text-sm text-text-muted mt-1">{proyecto.nombreProyecto}</p>
        </div>
        <Button variant="ghost" size="md" onClick={() => router.back()}>
          ← Volver
        </Button>
      </header>

      {/* --- Programar instalación --- */}
      <section className="mb-6 rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
        <div className="border-b border-border-subtle px-4 py-3">
          <h2 className="font-semibold text-text-heading">Programar instalación</h2>
        </div>
        <div className="px-4 py-4 space-y-3">
          <p className="text-sm text-text-muted">
            El rango de instalación no puede superar 5 días (R40). Programar no exige el gate de calidad; iniciarla sí.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-text-muted">Fecha inicio*</span>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-text-muted">Fecha fin*</span>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
              />
            </label>
          </div>

          {formError && (
            <div className="rounded border border-red-300 bg-red-50/80 p-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <Button variant="primary" size="md" onClick={handleProgramar}>
            Programar instalación
          </Button>
        </div>
      </section>

      {/* --- Lista de instalaciones --- */}
      <section className="rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
        <div className="border-b border-border-subtle px-4 py-3">
          <h2 className="font-semibold text-text-heading">Instalaciones del proyecto</h2>
        </div>
        <div className="px-4 py-4 space-y-3">
          {instalaciones.length === 0 ? (
            <p className="text-sm text-text-muted italic">Sin instalaciones programadas.</p>
          ) : (
            instalaciones.map(instalacion => (
              <div key={instalacion.id} className="rounded border border-border-subtle bg-bg-alt/30 p-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-text-heading">
                      {new Date(instalacion.rangoFechaInicio).toLocaleDateString('es-CO')} → {new Date(instalacion.rangoFechaFin).toLocaleDateString('es-CO')}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      Estado del proyecto: {proyecto.estado.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <Badge tone={BADGE_TONE[instalacion.estado]} dot>
                    {ETIQUETA_ESTADO[instalacion.estado]}
                  </Badge>
                </div>

                {instalacion.estado === 'programada' && (
                  <div className="space-y-2">
                    {!gateAprobado && (
                      <div className="rounded border border-amber-300 bg-amber-50/80 p-3 text-sm text-amber-800">
                        No se puede iniciar la instalación: el gate de calidad (E-24) no está aprobado para este proyecto (R16).
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="md"
                        disabled={!gateAprobado}
                        title={!gateAprobado ? 'Requiere veredicto de calidad aprobado (E-24)' : undefined}
                        onClick={() => handleIniciar(instalacion)}
                      >
                        Iniciar instalación
                      </Button>
                    </div>
                  </div>
                )}

                {instalacion.estado === 'en_curso' && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button variant="primary" size="md" onClick={async () => await store.instalaciones.marcarInstalada(instalacion.id)}>
                        Marcar instalada
                      </Button>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                      <label className="flex flex-1 flex-col gap-1">
                        <span className="text-xs text-text-muted">Motivo de falla*</span>
                        <input
                          type="text"
                          value={fallidaMotivos[instalacion.id] ?? ''}
                          onChange={(e) => setFallidaMotivos(prev => ({ ...prev, [instalacion.id]: e.target.value }))}
                          placeholder="Ej. Medidas de obra no coinciden"
                          className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
                        />
                      </label>
                      <Button
                        variant="destructive"
                        size="md"
                        disabled={!((fallidaMotivos[instalacion.id] ?? '').trim())}
                        onClick={() => handleMarcarFallida(instalacion)}
                      >
                        Marcar fallida
                      </Button>
                    </div>
                  </div>
                )}

                {instalacion.estado === 'fallida' && (
                  <p className="text-xs text-text-muted italic">
                    Instalación fallida. Se creó un reproceso de origen &quot;instalación&quot; (E-54).
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
