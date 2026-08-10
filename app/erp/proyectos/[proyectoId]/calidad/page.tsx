'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { useDataStore, type CitacionCalidad, type Reproceso, type Verificacion } from '@/lib/data'
import { puedeEmitirVeredictoCalidad } from '@/lib/modules/f4f5f6/gates'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
}

const MODULO_ESTADO_LABEL: Record<string, string> = {
  por_armar: 'Por armar',
  en_armado: 'En armado',
  armado: 'Armado',
  en_calidad: 'En calidad',
}

function moduloBadgeTone(estado: string): 'neutral' | 'warning' | 'info' | 'danger' {
  if (estado === 'en_calidad') return 'warning'
  if (estado === 'armado') return 'info'
  if (estado === 'en_armado') return 'warning'
  return 'neutral'
}

export default function CalidadPage() {
  const params = useParams()
  const router = useRouter()
  const proyectoId = params.proyectoId as string
  const store = useDataStore()
  const version = store.getVersion()

  const proyecto = store.proyectos.obtenerPorId(proyectoId)
  const usuario = store.auth.usuarioActual()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const citaciones = useMemo(() => proyecto ? store.citacionesCalidad.porProyecto(proyectoId) : [], [proyectoId, store, version])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const modulos = useMemo(() => proyecto ? store.modulos.porProyecto(proyectoId) : [], [proyectoId, store, version])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const verificaciones = useMemo(() => proyecto ? store.verificaciones.porProyecto(proyectoId) : [], [proyectoId, store, version])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reprocesos = useMemo(() => proyecto ? store.reprocesos.porProyecto(proyectoId) : [], [proyectoId, store, version])

  const [veredictoError, setVeredictoError] = useState<string | null>(null)

  const citacionPendiente: CitacionCalidad | undefined = citaciones.find(c => c.estado === 'citada')
  const verificacionesCalidad = useMemo(() => {
    const calidad = verificaciones.filter(v => v.tipoGate === 'calidad')
    return [...calidad].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))
  }, [verificaciones])
  const ultimoVeredicto: Verificacion | undefined = verificacionesCalidad[0]
  const reprocesosCalidad: Reproceso[] = reprocesos.filter(r => r.origen === 'calidad')

  if (!proyecto) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-text-muted">Proyecto no encontrado</p>
      </div>
    )
  }

  const puedeVeredicto = puedeEmitirVeredictoCalidad(proyecto, citaciones, usuario.id)
  const veredictoYaEmitido = verificacionesCalidad.length > 0

  const razonVeredictoDeshabilitado = (): string | null => {
    if (!proyecto.verificadorId || proyecto.verificadorId !== usuario.id) {
      return 'Solo el comercial vendedor del proyecto (verificador) puede emitir el veredicto de calidad.'
    }
    if (!citacionPendiente) {
      return 'Sin citación de calidad activa: el veredicto queda deshabilitado hasta que exista una citación con estado "Citada".'
    }
    return null
  }

  const emitirVeredicto = (veredicto: 'aprobado' | 'rechazado') => {
    setVeredictoError(null)
    const resultado = store.verificaciones.emitirVeredicto({
      proyectoId,
      tipoGate: 'calidad',
      veredicto,
      verificadorId: usuario.id,
    })
    if (!resultado) {
      setVeredictoError('No se pudo emitir el veredicto: verificá que el proyecto esté armado y con una citación de calidad activa.')
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-heading">Calidad — Veredicto (Gate E-24)</h1>
          <p className="text-sm text-text-muted mt-1">{proyecto.nombreProyecto}</p>
        </div>
        <Button variant="ghost" size="md" onClick={() => router.back()}>
          ← Volver
        </Button>
      </header>

      {/* --- Citaciones de calidad --- */}
      <section className="mb-6 rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
        <div className="border-b border-border-subtle px-4 py-3">
          <h2 className="font-semibold text-text-heading">Citaciones de calidad</h2>
        </div>
        <div className="px-4 py-4 space-y-3">
          {citaciones.length === 0 ? (
            <p className="text-sm text-text-muted italic">Sin citaciones registradas. El desarrollador cita los módulos al pasarlos a &quot;En calidad&quot; (E-23).</p>
          ) : (
            citaciones.map(citacion => {
              const citados = citacion.modulosIds
                .map(id => modulos.find(m => m.id === id))
                .filter((m): m is NonNullable<typeof m> => !!m)
              return (
                <div key={citacion.id} className="rounded border border-border-subtle bg-bg-alt/30 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-text-heading">
                      Citación del {formatDate(citacion.fecha)}
                    </p>
                    <Badge tone={citacion.estado === 'citada' ? 'warning' : 'neutral'} dot>
                      {citacion.estado === 'citada' ? 'Citada' : 'Atendida'}
                    </Badge>
                  </div>
                  {citados.length > 0 ? (
                    <ul className="space-y-1">
                      {citados.map(modulo => (
                        <li key={modulo.id} className="flex items-center justify-between text-sm">
                          <span className="text-text-heading">{modulo.nombre}</span>
                          <Badge tone={moduloBadgeTone(modulo.estado)}>
                            {MODULO_ESTADO_LABEL[modulo.estado] ?? modulo.estado}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-text-muted">Módulos citados: —</p>
                  )}
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* --- Emitir veredicto (E-24) --- */}
      <section className="mb-6 rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
        <div className="border-b border-border-subtle px-4 py-3">
          <h2 className="font-semibold text-text-heading">Veredicto de calidad</h2>
        </div>
        <div className="px-4 py-4 space-y-3">
          {veredictoYaEmitido && ultimoVeredicto ? (
            <div className="rounded border border-gold-300 bg-bg-alt/50 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-text-heading">Último veredicto emitido</p>
                  <p className="text-xs text-text-muted mt-1">
                    {ultimoVeredicto.veredicto === 'aprobado' ? 'Aprobado' : 'Rechazado'} · {formatDate(ultimoVeredicto.creadoEn)}
                  </p>
                </div>
                <Badge tone={ultimoVeredicto.veredicto === 'aprobado' ? 'info' : 'danger'} dot>
                  {ultimoVeredicto.veredicto === 'aprobado' ? 'Aprobado' : 'Rechazado'}
                </Badge>
              </div>
              {ultimoVeredicto.veredicto === 'aprobado' && (
                <p className="text-xs text-text-muted mt-2 italic">
                  El proyecto permanece en su estado actual (determinismo E-24); la instalación puede iniciarse desde el gate E-25.
                </p>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm text-text-muted">
                {citacionPendiente
                  ? 'Citación activa detectada. Emití el veredicto sobre los módulos citados.'
                  : 'Sin citación activa: el veredicto está deshabilitado hasta que exista una citación "Citada" (R16).'}
              </p>

              {!puedeVeredicto && (
                <div className="rounded border border-amber-300 bg-amber-50/80 p-3 text-sm text-amber-800">
                  {razonVeredictoDeshabilitado()}
                </div>
              )}

              {veredictoError && (
                <div className="rounded border border-red-300 bg-red-50/80 p-3 text-sm text-red-700">
                  {veredictoError}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  variant="primary"
                  size="md"
                  disabled={!puedeVeredicto}
                  title={!puedeVeredicto ? 'El veredicto está deshabilitado (R16)' : undefined}
                  onClick={() => emitirVeredicto('aprobado')}
                >
                  Aprobar
                </Button>
                <Button
                  variant="destructive"
                  size="md"
                  disabled={!puedeVeredicto}
                  title={!puedeVeredicto ? 'El veredicto está deshabilitado (R16)' : undefined}
                  onClick={() => emitirVeredicto('rechazado')}
                >
                  Rechazar
                </Button>
              </div>
              {puedeVeredicto && (
                <p className="text-xs text-text-muted">
                  Rechazar crea automáticamente un reproceso de origen &quot;calidad&quot; (E-54).
                </p>
              )}
            </>
          )}
        </div>
      </section>

      {/* --- Reprocesos de calidad --- */}
      <section className="mb-6 rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
        <div className="border-b border-border-subtle px-4 py-3">
          <h2 className="font-semibold text-text-heading">Reprocesos de calidad</h2>
        </div>
        <div className="px-4 py-4 space-y-2">
          {reprocesosCalidad.length === 0 ? (
            <p className="text-sm text-text-muted italic">Sin reprocesos de calidad.</p>
          ) : (
            reprocesosCalidad.map(reproceso => (
              <div key={reproceso.id} className="rounded border border-border-subtle bg-bg-alt/30 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-text-heading">{reproceso.descripcion ?? 'Reproceso'}</p>
                  <Badge tone={reproceso.estado === 'abierto' ? 'warning' : 'neutral'} dot>
                    {reproceso.estado}
                  </Badge>
                </div>
                <p className="text-xs text-text-muted mt-1">
                  Origen: {reproceso.origen} · {formatDate(reproceso.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
