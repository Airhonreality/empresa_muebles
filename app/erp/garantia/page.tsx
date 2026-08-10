'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { ImagePicker } from '@/components/veta/image-picker'
import { useDataStore, type CasoGarantia, type EstadoCasoGarantia } from '@/lib/data'

const ESTADOS: EstadoCasoGarantia[] = ['reportado', 'diagnosticado', 'en_reparacion', 'resuelto', 'cerrado']

const ETIQUETA_ESTADO: Record<EstadoCasoGarantia, string> = {
  reportado: 'Reportado',
  diagnosticado: 'Diagnosticado',
  en_reparacion: 'En reparación',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
}

const BADGE_TONE: Record<EstadoCasoGarantia, 'neutral' | 'warning' | 'info' | 'danger'> = {
  reportado: 'warning',
  diagnosticado: 'info',
  en_reparacion: 'warning',
  resuelto: 'info',
  cerrado: 'neutral',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function GarantiaPage() {
  const store = useDataStore()
  const version = store.getVersion()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const proyectos = useMemo(() => store.proyectos.listar(), [store, version])

  const casos = useMemo(() => {
    const resultado: CasoGarantia[] = []
    proyectos.forEach(p => {
      store.casosGarantia.porProyecto(p.id).forEach(caso => resultado.push(caso))
    })
    return resultado.sort((a, b) => b.fechaReporte.localeCompare(a.fechaReporte))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectos, store, version])

  const modulosPorId = useMemo(() => {
    const map = new Map<string, { nombre: string; proyectoId: string }>()
    proyectos.forEach(p => {
      store.modulos.porProyecto(p.id).forEach(m => map.set(m.id, { nombre: m.nombre, proyectoId: m.id }))
    })
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectos, store, version])

  const otGarantiaPorProyecto = useMemo(() => {
    const map = new Map<string, number>()
    proyectos.forEach(p => {
      map.set(p.id, store.ordenesTrabajo.porProyecto(p.id).filter(o => o.tipo === 'garantia').length)
    })
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectos, store, version])

  const [mostrarFormReporte, setMostrarFormReporte] = useState(false)
  const [reporteProyectoId, setReporteProyectoId] = useState('')
  const [reporteModuloId, setReporteModuloId] = useState('')
  const [reporteDescripcion, setReporteDescripcion] = useState('')
  const [reporteFotos, setReporteFotos] = useState<string[]>([])
  const [reporteError, setReporteError] = useState<string | null>(null)

  const [diagnosticoDrafts, setDiagnosticoDrafts] = useState<Record<string, string>>({})
  const [solucionDrafts, setSolucionDrafts] = useState<Record<string, string>>({})
  const [visitaFechas, setVisitaFechas] = useState<Record<string, string>>({})

  const proyectosEntregados = proyectos.filter(p => p.estado === 'entregado')
  const proyectoReporte = proyectosEntregados.find(p => p.id === reporteProyectoId)
  const modulosReporte = proyectoReporte ? store.modulos.porProyecto(proyectoReporte.id) : []

  const casosPorEstado = useMemo(() => {
    const map = new Map<EstadoCasoGarantia, CasoGarantia[]>()
    ESTADOS.forEach(estado => map.set(estado, []))
    casos.forEach(caso => {
      map.get(caso.estado)?.push(caso)
    })
    return map
  }, [casos])

  const reportarCaso = () => {
    setReporteError(null)
    if (!reporteProyectoId) {
      setReporteError('Seleccioná un proyecto entregado para reportar la garantía.')
      return
    }
    if (!reporteDescripcion.trim()) {
      setReporteError('La descripción del caso es obligatoria.')
      return
    }
    if (reporteFotos.length > 5) {
      setReporteError('Máximo 5 fotos por caso (R4).')
      return
    }
    const resultado = store.casosGarantia.reportar({
      proyectoId: reporteProyectoId,
      moduloId: reporteModuloId || null,
      clienteId: proyectoReporte?.clienteId ?? null,
      descripcion: reporteDescripcion.trim(),
      fotos: reporteFotos,
    })
    if (!resultado) {
      setReporteError('No se pudo reportar el caso. El proyecto debe estar en estado "Entregado" (R1).')
      return
    }
    setReporteProyectoId('')
    setReporteModuloId('')
    setReporteDescripcion('')
    setReporteFotos([])
    setMostrarFormReporte(false)
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-text-heading">Garantía — Gestión ERP</h1>
        <p className="text-sm text-text-muted mt-2">
          Casos de garantía de todos los proyectos entregados, con su flujo de atención completo.
        </p>
      </header>

      {/* --- Reportar garantía --- */}
      <section className="mb-8 rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
        <div className="border-b border-border-subtle px-4 py-3 flex items-center justify-between gap-2">
          <h2 className="font-semibold text-text-heading">Reportar garantía</h2>
          <Button variant="secondary" size="md" onClick={() => setMostrarFormReporte(v => !v)}>
            {mostrarFormReporte ? 'Cerrar' : '+ Reportar garantía'}
          </Button>
        </div>
        {mostrarFormReporte && (
          <div className="px-4 py-4 space-y-3">
            {proyectosEntregados.length === 0 && (
              <p className="text-sm text-text-muted italic">
                No hay proyectos entregados para reportar garantía (R1: solo proyectos &quot;Entregado&quot;).
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-text-muted">Proyecto*</span>
                <select
                  value={reporteProyectoId}
                  onChange={(e) => {
                    setReporteProyectoId(e.target.value)
                    setReporteModuloId('')
                  }}
                  className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
                >
                  <option value="">Seleccioná un proyecto</option>
                  {proyectosEntregados.map(p => (
                    <option key={p.id} value={p.id}>{p.nombreProyecto}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-text-muted">Módulo (opcional)</span>
                <select
                  value={reporteModuloId}
                  onChange={(e) => setReporteModuloId(e.target.value)}
                  disabled={!proyectoReporte}
                  className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none disabled:opacity-40"
                >
                  <option value="">Caso general del proyecto</option>
                  {modulosReporte.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-text-muted">Descripción del caso*</span>
              <textarea
                value={reporteDescripcion}
                onChange={(e) => setReporteDescripcion(e.target.value)}
                rows={3}
                placeholder="Ej. Puerta de despensa no cierra bien"
                className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
              />
            </label>
            <ImagePicker label="Fotos (máx 5)" value={reporteFotos} onChange={setReporteFotos} />

            {reporteError && (
              <div className="rounded border border-red-300 bg-red-50/80 p-3 text-sm text-red-700">
                {reporteError}
              </div>
            )}

            <Button
              variant="primary"
              size="md"
              disabled={!reporteProyectoId || !reporteDescripcion.trim() || reporteFotos.length > 5}
              onClick={reportarCaso}
            >
              Reportar garantía
            </Button>
          </div>
        )}
      </section>

      {/* --- Kanban por estado --- */}
      <section>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {ESTADOS.map(estado => {
            const casosEstado = casosPorEstado.get(estado) ?? []
            return (
              <div key={estado} className="rounded-lg border border-border-subtle bg-bg-raised/60 overflow-hidden">
                <div className="border-b border-border-subtle bg-bg-alt/40 px-3 py-2 flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-text-heading">
                    {ETIQUETA_ESTADO[estado]}
                  </h3>
                  <Badge tone={BADGE_TONE[estado]}>{casosEstado.length}</Badge>
                </div>
                <div className="p-2 space-y-2 min-h-[120px]">
                  {casosEstado.length === 0 ? (
                    <p className="text-xs text-text-muted italic px-2 py-3">Sin casos</p>
                  ) : (
                    casosEstado.map(caso => {
                      const proyecto = proyectos.find(p => p.id === caso.proyectoId)
                      const cliente = caso.clienteId ? store.clientes.obtenerPorId(caso.clienteId) : undefined
                      const modulo = caso.moduloId ? modulosPorId.get(caso.moduloId) : undefined
                      const citas = store.citasGarantia.porCaso(caso.id)
                      return (
                        <div key={caso.id} className="rounded border border-border-subtle bg-bg-raised p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-text-heading truncate">{proyecto?.nombreProyecto ?? caso.proyectoId}</p>
                              <p className="text-xs text-text-muted">Cliente: {cliente?.nombre ?? '—'}</p>
                            </div>
                            <Badge
                              tone={caso.dentroGarantiaContractual ? 'info' : 'danger'}
                              dot
                            >
                              {caso.dentroGarantiaContractual ? 'Dentro de garantía' : 'Fuera de garantía'}
                            </Badge>
                          </div>

                          <p className="text-sm text-text-heading">{caso.descripcion}</p>
                          <p className="text-xs text-text-muted">
                            {modulo ? `Módulo: ${modulo.nombre}` : 'Caso general del proyecto'} · Reportado el {formatDate(caso.fechaReporte)}
                          </p>

                          {caso.diagnostico && (
                            <p className="text-xs text-text-muted bg-bg-alt/50 rounded p-2">
                              Diagnóstico: {caso.diagnostico}
                            </p>
                          )}
                          {caso.solucionAplicada && (
                            <p className="text-xs text-text-muted bg-emerald-50/70 rounded p-2">
                              Solución: {caso.solucionAplicada}
                            </p>
                          )}

                          {caso.fotos.length > 0 && (
                            <p className="text-xs text-text-muted">Fotos: {caso.fotos.length}</p>
                          )}

                          {citas.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-text-heading">Visitas de garantía</p>
                              {citas.map(cita => (
                                <p key={cita.id} className="text-xs text-text-muted">
                                  {formatDate(cita.fecha)}
                                  {cita.resultado ? ` — ${cita.resultado}` : ''}
                                </p>
                              ))}
                            </div>
                          )}

                          {otGarantiaPorProyecto.get(caso.proyectoId)! > 0 && (
                            <p className="text-xs text-text-muted">
                              Órdenes de reparación del proyecto: {otGarantiaPorProyecto.get(caso.proyectoId)}
                            </p>
                          )}

                          {/* --- Acciones por estado --- */}
                          {caso.estado === 'reportado' && (
                            <div className="space-y-2 pt-1 border-t border-border-subtle">
                              <div className="flex flex-col gap-1">
                                <label className="flex items-center gap-2">
                                  <span className="text-xs text-text-muted shrink-0">Visita:</span>
                                  <input
                                    type="date"
                                    value={visitaFechas[caso.id] ?? ''}
                                    onChange={(e) => setVisitaFechas(prev => ({ ...prev, [caso.id]: e.target.value }))}
                                    className="flex-1 rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
                                  />
                                  <Button
                                    variant="secondary"
                                    size="md"
                                    disabled={!((visitaFechas[caso.id] ?? '').trim())}
                                    onClick={() => store.citasGarantia.agendar({
                                      casoId: caso.id,
                                      proyectoId: caso.proyectoId,
                                      fecha: new Date(`${visitaFechas[caso.id]}T09:00:00`).toISOString(),
                                    })}
                                  >
                                    Agendar
                                  </Button>
                                </label>
                              </div>
                              <div className="flex flex-col gap-1">
                                <textarea
                                  value={diagnosticoDrafts[caso.id] ?? ''}
                                  onChange={(e) => setDiagnosticoDrafts(prev => ({ ...prev, [caso.id]: e.target.value }))}
                                  rows={2}
                                  placeholder="Diagnóstico del desarrollador..."
                                  className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
                                />
                                <Button
                                  variant="primary"
                                  size="md"
                                  disabled={!((diagnosticoDrafts[caso.id] ?? '').trim())}
                                  onClick={() => {
                                    store.casosGarantia.diagnosticar(caso.id, (diagnosticoDrafts[caso.id] ?? '').trim())
                                    setDiagnosticoDrafts(prev => ({ ...prev, [caso.id]: '' }))
                                  }}
                                >
                                  Diagnosticar
                                </Button>
                              </div>
                            </div>
                          )}

                          {caso.estado === 'diagnosticado' && (
                            <div className="space-y-2 pt-1 border-t border-border-subtle">
                              <Button variant="primary" size="md" onClick={() => store.casosGarantia.crearOrdenReparacion(caso.id)}>
                                Crear orden de reparación
                              </Button>
                              {!caso.dentroGarantiaContractual && (
                                <p className="text-xs text-amber-700 bg-amber-50/80 rounded p-2">
                                  Reproceso no disponible: el caso está fuera de la garantía contractual (R2).
                                </p>
                              )}
                              <Button
                                variant="secondary"
                                size="md"
                                disabled={!caso.dentroGarantiaContractual}
                                title={!caso.dentroGarantiaContractual ? 'Fuera de garantía contractual' : undefined}
                                onClick={() => store.casosGarantia.dispararReproceso(caso.id)}
                              >
                                Disparar reproceso
                              </Button>
                            </div>
                          )}

                          {caso.estado === 'en_reparacion' && (
                            <div className="flex flex-col gap-1 pt-1 border-t border-border-subtle">
                              <textarea
                                value={solucionDrafts[caso.id] ?? ''}
                                onChange={(e) => setSolucionDrafts(prev => ({ ...prev, [caso.id]: e.target.value }))}
                                rows={2}
                                placeholder="Solución aplicada..."
                                className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
                              />
                              <Button
                                variant="primary"
                                size="md"
                                disabled={!((solucionDrafts[caso.id] ?? '').trim())}
                                onClick={() => {
                                  store.casosGarantia.resolver(caso.id, (solucionDrafts[caso.id] ?? '').trim())
                                  setSolucionDrafts(prev => ({ ...prev, [caso.id]: '' }))
                                }}
                              >
                                Resolver caso
                              </Button>
                            </div>
                          )}

                          {caso.estado === 'resuelto' && (
                            <div className="pt-1 border-t border-border-subtle">
                              <Button variant="secondary" size="md" onClick={() => store.casosGarantia.cerrar(caso.id)}>
                                Cerrar caso
                              </Button>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
