'use client'

import { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { useDataStore, type CronogramaEtapa, type CausaDesfase, type EstadoNovedadCritica, type DesenlaceCheck } from '@/lib/data'

function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatDateRelative(createdAt: string, horasSla: number): { horasRestantes: number; enAtraso: boolean; porcentaje: number } {
  const now = new Date()
  const created = new Date(createdAt)
  const horasTranscurridas = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
  const horasRestantes = Math.max(0, horasSla - horasTranscurridas)
  const enAtraso = horasTranscurridas > horasSla
  const porcentaje = Math.min(100, Math.max(0, (horasRestantes / horasSla) * 100))
  return { horasRestantes, enAtraso, porcentaje }
}

function getEstadoBadgeTone(estado: EstadoNovedadCritica): 'info' | 'warning' | 'danger' | 'neutral' {
  switch (estado) {
    case 'abierta': return 'warning'
    case 'en_atencion': return 'info'
    case 'escalada': return 'danger'
    case 'resuelta': return 'info'
    default: return 'neutral'
  }
}

export default function CronogramaPage() {
  const params = useParams()
  const router = useRouter()
  const proyectoId = params.proyectoId as string
  const store = useDataStore()

  const proyecto = store.proyectos.obtenerPorId(proyectoId)
  const cronograma = proyecto ? store.cronogramas.porProyecto(proyectoId) : undefined
  const etapas = cronograma ? store.cronogramaEtapas.porCronograma(cronograma.id) : []
  const desfases = proyecto ? store.desfases.porProyecto(proyectoId) : []
  const desfasesAplicados = desfases.filter(d => d.aplicado)
  const ultimoDesfaseAplicado = desfasesAplicados.length > 0 ? desfasesAplicados[desfasesAplicados.length - 1] : null
  const checks = proyecto ? store.checks.porProyecto(proyectoId) : []
  const novedades = proyecto ? store.novedades.porProyecto(proyectoId) : []
  const comunicaciones = proyecto ? store.comunicaciones.porProyecto(proyectoId) : []

  // Derivados directos: arreglos pequeños (mock), no ameritan useMemo — y
  // memoizar sobre una referencia que ya cambia cada render (etapas/checks/
  // comunicaciones vienen frescos de store.xxx.porYyy() arriba) no memoiza nada.
  const etapasMap = new Map<string, { contractual?: CronogramaEtapa; interna?: CronogramaEtapa }>()
  etapas.forEach(e => {
    const key = e.etapa
    const current = etapasMap.get(key) ?? {}
    if (e.linea === 'contractual') current.contractual = e
    else current.interna = e
    etapasMap.set(key, current)
  })

  const ultimoCheck = checks.length > 0 ? checks[checks.length - 1] : null
  const ultimaComun = comunicaciones.length > 0 ? comunicaciones[comunicaciones.length - 1] : null

  const [seccionesExpandidas, setSeccionesExpandidas] = useState({
    cronograma: true,
    novedades: true,
    check: true,
  })

  const toggleSeccion = useCallback((seccion: keyof typeof seccionesExpandidas) => {
    setSeccionesExpandidas(prev => ({ ...prev, [seccion]: !prev[seccion] }))
  }, [])

  // --- P-09 State ---
  const [mostrarFormDesfase, setMostrarFormDesfase] = useState(false)
  const [desfaseForm, setDesfaseForm] = useState({
    causa: 'interna' as CausaDesfase,
    motivo: '',
    diasDesfase: '0',
    composicion: '' // CSV de "origen:dias"
  })

  // --- P-10 State ---
  const [mostrarFormNovedad, setMostrarFormNovedad] = useState(false)
  const [novedadForm, setNovedadForm] = useState({ descripcion: '', fase: 'compras', slaHoras: '24' })

  // --- P-09 Additional State (FIX 1: Decisión manual) ---
  const [mostrarFormDecisionManual, setMostrarFormDecisionManual] = useState(false)
  const [decisionManualForm, setDecisionManualForm] = useState({ decision: '', autorizadoPor: '' })

  // --- P-10 Additional State (FIX 2: Escalar con escaladoA) ---
  const [novedadEnEscalacion, setNovedadEnEscalacion] = useState<string | null>(null)
  const [escaladoAForm, setEscaladoAForm] = useState('')

  // --- P-11 State ---
  const [mostrarFormCheck, setMostrarFormCheck] = useState(false)
  const [checkForm, setCheckForm] = useState({ ratioInsumos: '0.95', ratioPagos: '0.95', ratioProduccion: '0.95' })
  const [anularSugerencia, setAnularSugerencia] = useState(false)
  const [anulationDesenlace, setAnulationDesenlace] = useState<DesenlaceCheck | null>(null)
  const [overrideJustificacion, setOverrideJustificacion] = useState('')

  if (!proyecto) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-text-muted">Proyecto no encontrado</p>
      </div>
    )
  }

  const parseNum = (s: string | undefined): number => {
    const n = Number(s)
    return Number.isFinite(n) ? n : 0
  }

  const handleAplicarDesfase = async () => {
    if (!desfaseForm.motivo.trim() || !cronograma) return

    const composicion = desfaseForm.composicion
      .split('\n')
      .filter(l => l.trim())
      .map(l => {
        const [origen, dias] = l.split(':')
        return { origen: origen.trim(), aporteDias: parseNum(dias) }
      })

    if (composicion.length === 0) return

    await store.desfases.aplicar(proyectoId, {
      causa: desfaseForm.causa,
      motivo: desfaseForm.motivo,
      diasDesfase: parseNum(desfaseForm.diasDesfase),
      composicionCausal: composicion,
    })

    setMostrarFormDesfase(false)
    setDesfaseForm({ causa: 'interna', motivo: '', diasDesfase: '0', composicion: '' })
  }

  const handleRegistrarNovedad = async () => {
    if (!novedadForm.descripcion.trim()) return
    await store.novedades.crear(proyectoId, {
      descripcion: novedadForm.descripcion,
      fase: novedadForm.fase,
      ventanaSlaHoras: parseNum(novedadForm.slaHoras),
    })
    setMostrarFormNovedad(false)
    setNovedadForm({ descripcion: '', fase: 'compras', slaHoras: '24' })
  }

  const handleGenerarCheck = async () => {
    await store.checks.crear(proyectoId, {
      ratioInsumos: parseNum(checkForm.ratioInsumos),
      ratioPagos: parseNum(checkForm.ratioPagos),
      ratioProduccion: parseNum(checkForm.ratioProduccion),
    })
    setMostrarFormCheck(false)
    setCheckForm({ ratioInsumos: '0.95', ratioPagos: '0.95', ratioProduccion: '0.95' })
  }

  // FIX 3: Reescribir handleConfirmarCheck con 2 caminos claros (DP3)
  const handleConfirmarCheck = async () => {
    if (!ultimoCheck) return

    if (!anularSugerencia) {
      // Camino A: Confirmar sugerencia tal cual (aceptar sin fricción)
      await store.checks.confirmar(ultimoCheck.id, {
        desenlaceFinal: ultimoCheck.desenlaceSugerido,
        overrideJustificacion: undefined,
      })
      setAnularSugerencia(false)
      setAnulationDesenlace(null)
      setOverrideJustificacion('')
    } else {
      // Camino B: Anular con selección explícita del verificador + justificación obligatoria
      if (!anulationDesenlace || !overrideJustificacion.trim()) return

      await store.checks.confirmar(ultimoCheck.id, {
        desenlaceFinal: anulationDesenlace,
        overrideJustificacion: overrideJustificacion,
      })
      setAnularSugerencia(false)
      setAnulationDesenlace(null)
      setOverrideJustificacion('')
    }
  }

  const handleCrearComunicacion = async () => {
    if (!ultimoCheck || ultimoCheck.desenlaceFinal !== 'todo_bien') return
    await store.comunicaciones.crear(proyectoId, {
      contenido: 'Tu proyecto avanza según lo previsto. Continuaremos informándote sobre los próximos pasos.',
    })
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-heading">{proyecto.nombreProyecto}</h1>
          <p className="text-sm text-text-muted mt-1">Cronograma, novedades críticas y control de producción</p>
        </div>
        <Button variant="ghost" size="md" onClick={() => router.back()}>
          ← Volver
        </Button>
      </header>

      {/* --- P-09: CRONOGRAMA --- */}
      <section className="mb-6 rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSeccion('cronograma')}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-bg-alt transition-colors"
        >
          <h2 className="font-semibold text-text-heading">Cronograma</h2>
          <span className={`text-sm transition-transform duration-fast ${seccionesExpandidas.cronograma ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {seccionesExpandidas.cronograma && (
          <div className="border-t border-border-subtle px-4 py-4 space-y-4">
            {cronograma ? (
              <>
                {/* Tabla doble línea */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        <th className="border-b border-border-subtle text-left px-2 py-2 font-semibold text-text-heading">Etapa</th>
                        <th colSpan={2} className="border-b border-border-subtle text-center px-2 py-2 font-semibold text-text-heading">Línea Contractual</th>
                        <th colSpan={2} className="border-b border-border-subtle text-center px-2 py-2 font-semibold text-text-heading">Línea Interna</th>
                        <th className="border-b border-border-subtle text-center px-2 py-2 font-semibold text-text-heading">Estado</th>
                      </tr>
                      <tr>
                        <th className="border-b border-border-subtle text-left px-2 py-1 text-xs text-text-muted bg-bg-alt"></th>
                        <th className="border-b border-border-subtle text-center px-2 py-1 text-xs text-text-muted bg-bg-alt">Ideal</th>
                        <th className="border-b border-border-subtle text-center px-2 py-1 text-xs text-text-muted bg-bg-alt">Real</th>
                        <th className="border-b border-border-subtle text-center px-2 py-1 text-xs text-text-muted bg-bg-alt">Ideal</th>
                        <th className="border-b border-border-subtle text-center px-2 py-1 text-xs text-text-muted bg-bg-alt">Real</th>
                        <th className="border-b border-border-subtle text-center px-2 py-1 text-xs text-text-muted bg-bg-alt"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {['aprobacion', 'compras', 'ensamblaje', 'instalacion'].map(etapaKey => {
                        const pair = etapasMap.get(etapaKey)
                        const contractual = pair?.contractual
                        const interna = pair?.interna
                        const labelMap: Record<string, string> = {
                          aprobacion: 'Aprobación',
                          compras: 'Compras',
                          ensamblaje: 'Ensamblaje',
                          instalacion: 'Instalación',
                        }
                        return (
                          <tr key={etapaKey} className="border-b border-border-subtle/50">
                            <td className="px-2 py-2 font-medium text-text-heading">{labelMap[etapaKey]}</td>
                            <td className="px-2 py-2 text-center text-xs font-mono text-text-muted bg-bg-alt/30">{contractual ? formatDate(contractual.fechaIdeal) : '—'}</td>
                            <td className="px-2 py-2 text-center text-xs font-mono text-text-heading" style={{ backgroundColor: 'rgba(200, 200, 200, 0.1)' }}>
                              {contractual ? formatDate(contractual.fechaReal) : '—'}
                            </td>
                            <td className="px-2 py-2 text-center text-xs font-mono text-text-heading">{interna ? formatDate(interna.fechaIdeal) : '—'}</td>
                            <td className="px-2 py-2 text-center text-xs font-mono text-brand font-semibold">{interna ? formatDate(interna.fechaReal) : '—'}</td>
                            <td className="px-2 py-2 text-center">
                              {interna && (
                                <Badge tone={interna.estado === 'aprobado' ? 'info' : interna.estado === 'en_curso' ? 'warning' : 'neutral'} dot>
                                  {interna.estado}
                                </Badge>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Form Desfase */}
                {!mostrarFormDesfase ? (
                  <Button variant="secondary" size="md" onClick={() => setMostrarFormDesfase(true)}>
                    + Aplicar desfase
                  </Button>
                ) : (
                  <div className="rounded border border-border-subtle bg-bg-paper p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-text-muted">Causa*</span>
                        <select
                          value={desfaseForm.causa}
                          onChange={(e) => setDesfaseForm(prev => ({ ...prev, causa: e.target.value as CausaDesfase }))}
                          className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
                        >
                          <option value="interna">Causa interna</option>
                          <option value="externa">Causa externa</option>
                          <option value="cambio_contrato">Cambio de contrato</option>
                        </select>
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-text-muted">Días de desfase*</span>
                        <input
                          type="number"
                          min="0"
                          value={desfaseForm.diasDesfase}
                          onChange={(e) => setDesfaseForm(prev => ({ ...prev, diasDesfase: e.target.value }))}
                          className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
                        />
                      </label>
                    </div>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-text-muted">Motivo*</span>
                      <input
                        type="text"
                        value={desfaseForm.motivo}
                        onChange={(e) => setDesfaseForm(prev => ({ ...prev, motivo: e.target.value }))}
                        placeholder="Ej. Retraso del proveedor en despacho de materiales"
                        className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-text-muted">Composición causal (origen:días por línea)*</span>
                      <textarea
                        value={desfaseForm.composicion}
                        onChange={(e) => setDesfaseForm(prev => ({ ...prev, composicion: e.target.value }))}
                        placeholder={"Ej.\nProveedor melamina:2\nFlete:1"}
                        rows={3}
                        className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none font-mono"
                      />
                    </label>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleAplicarDesfase}
                        className="rounded bg-gold-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-gold-600 transition-colors"
                      >
                        Aplicar desfase
                      </button>
                      <button
                        type="button"
                        onClick={() => setMostrarFormDesfase(false)}
                        className="rounded border border-border-subtle px-3 py-1.5 text-xs text-text-muted hover:bg-bg-alt transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* FIX 1: Desfases aplicados + Botón "Decisión manual" */}
                {ultimoDesfaseAplicado && (
                  <div className="rounded border border-amber-300 bg-bg-alt/50 p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-text-heading">Desfase aplicado: {ultimoDesfaseAplicado.diasDesfase} días</p>
                        <p className="text-xs text-text-muted mt-1">Causa: {ultimoDesfaseAplicado.causa === 'interna' ? 'Interna' : ultimoDesfaseAplicado.causa === 'externa' ? 'Externa' : 'Cambio de contrato'}</p>
                        <p className="text-xs text-text-muted">Motivo: {ultimoDesfaseAplicado.motivo}</p>
                        {ultimoDesfaseAplicado.decisionManual && (
                          <p className="text-xs text-text-muted mt-1 italic">Decisión manual: {ultimoDesfaseAplicado.decisionManual}</p>
                        )}
                      </div>
                    </div>
                    {!mostrarFormDecisionManual ? (
                      <Button variant="secondary" size="md" onClick={() => setMostrarFormDecisionManual(true)}>
                        Decisión manual
                      </Button>
                    ) : (
                      <div className="rounded border border-border-subtle bg-bg-paper p-2 space-y-2">
                        <label className="flex flex-col gap-1">
                          <span className="text-xs text-text-muted">Decisión (justificación)*</span>
                          <textarea
                            value={decisionManualForm.decision}
                            onChange={(e) => setDecisionManualForm(prev => ({ ...prev, decision: e.target.value }))}
                            placeholder="Ej. Se acepta el desfase por fuerza mayor"
                            rows={2}
                            className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs text-text-muted">Autorizado por*</span>
                          <input
                            type="text"
                            value={decisionManualForm.autorizadoPor}
                            onChange={(e) => setDecisionManualForm(prev => ({ ...prev, autorizadoPor: e.target.value }))}
                            placeholder="Ej. Javier García (Gerente)"
                            className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
                          />
                        </label>
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={async () => {
                              if (decisionManualForm.decision.trim() && decisionManualForm.autorizadoPor.trim()) {
                                await store.desfases.decisionManual(ultimoDesfaseAplicado.id, {
                                  decisionManual: decisionManualForm.decision,
                                  autorizadoPor: decisionManualForm.autorizadoPor,
                                })
                                setMostrarFormDecisionManual(false)
                                setDecisionManualForm({ decision: '', autorizadoPor: '' })
                              }
                            }}
                            className="rounded bg-gold-500 px-3 py-1 text-xs font-medium text-white hover:bg-gold-600 transition-colors"
                          >
                            Guardar decisión
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMostrarFormDecisionManual(false)
                              setDecisionManualForm({ decision: '', autorizadoPor: '' })
                            }}
                            className="rounded border border-border-subtle px-3 py-1 text-xs text-text-muted hover:bg-bg-alt transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Comunicación de adelanto (solo si check = todo_bien) */}
                {ultimoCheck && ultimoCheck.desenlaceFinal === 'todo_bien' && (
                  <div className="rounded border border-gold-300 bg-bg-alt/50 p-3">
                    <p className="text-xs font-semibold text-text-heading mb-2">Comunicación de adelanto</p>
                    {ultimaComun ? (
                      <p className="text-sm text-text-muted italic">&quot;{ultimaComun.contenido}&quot;</p>
                    ) : (
                      <Button variant="secondary" size="md" onClick={handleCrearComunicacion}>
                        + Crear comunicación
                      </Button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-text-muted">Sin cronograma registrado para este proyecto.</p>
            )}
          </div>
        )}
      </section>

      {/* --- P-10: NOVEDADES CRÍTICAS --- */}
      <section className="mb-6 rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSeccion('novedades')}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-bg-alt transition-colors"
        >
          <h2 className="font-semibold text-text-heading">Novedades críticas</h2>
          <span className={`text-sm transition-transform duration-fast ${seccionesExpandidas.novedades ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {seccionesExpandidas.novedades && (
          <div className="border-t border-border-subtle px-4 py-4 space-y-3">
            {/* Form Registrar */}
            {!mostrarFormNovedad ? (
              <Button variant="secondary" size="md" onClick={() => setMostrarFormNovedad(true)}>
                + Registrar novedad
              </Button>
            ) : (
              <div className="rounded border border-border-subtle bg-bg-paper p-3 space-y-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-text-muted">Descripción*</span>
                  <input
                    type="text"
                    value={novedadForm.descripcion}
                    onChange={(e) => setNovedadForm(prev => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Ej. Proveedor despachó bisagras sin tratamiento anticorrosivo"
                    className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-text-muted">Fase*</span>
                    <select
                      value={novedadForm.fase}
                      onChange={(e) => setNovedadForm(prev => ({ ...prev, fase: e.target.value }))}
                      className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
                    >
                      <option value="aprobacion">Aprobación</option>
                      <option value="compras">Compras</option>
                      <option value="ensamblaje">Ensamblaje</option>
                      <option value="instalacion">Instalación</option>
                      <option value="desarrollo">Desarrollo</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-text-muted">SLA (horas)*</span>
                    <input
                      type="number"
                      min="5"
                      max="24"
                      value={novedadForm.slaHoras}
                      onChange={(e) => setNovedadForm(prev => ({ ...prev, slaHoras: e.target.value }))}
                      className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
                    />
                  </label>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleRegistrarNovedad}
                    className="rounded bg-gold-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-gold-600 transition-colors"
                  >
                    Registrar novedad
                  </button>
                  <button
                    type="button"
                    onClick={() => setMostrarFormNovedad(false)}
                    className="rounded border border-border-subtle px-3 py-1.5 text-xs text-text-muted hover:bg-bg-alt transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Lista de novedades */}
            {novedades.length === 0 ? (
              <p className="text-sm text-text-muted italic">Sin novedades registradas.</p>
            ) : (
              novedades.map(novedad => {
                const sla = formatDateRelative(novedad.createdAt, novedad.ventanaSlaHoras)
                return (
                  <div key={novedad.id} className="rounded border border-border-subtle bg-bg-alt/30 p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-heading">{novedad.descripcion}</p>
                        <p className="text-xs text-text-muted mt-1">Fase: {novedad.fase}</p>
                      </div>
                      <Badge tone={getEstadoBadgeTone(novedad.estado as EstadoNovedadCritica)} dot>
                        {novedad.estado === 'abierta' ? 'Abierta' : novedad.estado === 'escalada' ? 'Escalada' : 'Resuelta'}
                      </Badge>
                    </div>

                    {/* SLA Chip */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-border-subtle rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-colors ${sla.porcentaje > 50 ? 'bg-emerald-500' : sla.porcentaje > 25 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.max(5, sla.porcentaje)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-mono ${sla.enAtraso ? 'text-red-600 font-semibold' : 'text-text-muted'}`}>
                        {sla.enAtraso ? 'VENCIDO' : `${Math.ceil(sla.horasRestantes)}h`}
                      </span>
                    </div>

                    {/* FIX 2: Acciones con captura de escaladoA */}
                    {novedad.estado === 'abierta' && (
                      <div className="space-y-2">
                        {novedadEnEscalacion !== novedad.id ? (
                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setNovedadEnEscalacion(novedad.id)}
                              className="text-xs px-2 py-1 rounded border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors"
                            >
                              Escalar
                            </button>
                            <button
                              type="button"
                              onClick={async () => await store.novedades.actualizarEstado(novedad.id, 'resuelta')}
                              className="text-xs px-2 py-1 rounded border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors"
                            >
                              Marcar resuelta
                            </button>
                          </div>
                        ) : (
                          <div className="rounded border border-amber-300 bg-amber-50 p-2 space-y-2">
                            <label className="flex flex-col gap-1">
                              <span className="text-xs text-text-muted">Escalado a (persona/rol)*</span>
                              <input
                                type="text"
                                value={escaladoAForm}
                                onChange={(e) => setEscaladoAForm(e.target.value)}
                                placeholder="Ej. Gerente de Compras, Javier García"
                                className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
                              />
                            </label>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  if (escaladoAForm.trim()) {
                                    await store.novedades.actualizarEstado(novedad.id, 'escalada', escaladoAForm)
                                    setNovedadEnEscalacion(null)
                                    setEscaladoAForm('')
                                  }
                                }}
                                className="text-xs px-2 py-1 rounded bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                              >
                                Confirmar escalada
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setNovedadEnEscalacion(null)
                                  setEscaladoAForm('')
                                }}
                                className="text-xs px-2 py-1 rounded border border-border-subtle text-text-muted hover:bg-bg-alt transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {(novedad.estado === 'escalada' || novedad.estado === 'en_atencion') && (
                      <button
                        type="button"
                        onClick={async () => await store.novedades.actualizarEstado(novedad.id, 'resuelta')}
                        className="text-xs px-2 py-1 rounded border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors"
                      >
                        Marcar resuelta
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </section>

      {/* --- P-11: CHECK DE PRODUCCIÓN --- */}
      <section className="mb-6 rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSeccion('check')}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-bg-alt transition-colors"
        >
          <h2 className="font-semibold text-text-heading">Check de producción</h2>
          <span className={`text-sm transition-transform duration-fast ${seccionesExpandidas.check ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {seccionesExpandidas.check && (
          <div className="border-t border-border-subtle px-4 py-4 space-y-4">
            {ultimoCheck ? (
              <>
                {/* Medidores */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Ratio Insumos', valor: ultimoCheck.ratioInsumos },
                    { label: 'Ratio Pagos', valor: ultimoCheck.ratioPagos },
                    { label: 'Ratio Producción', valor: ultimoCheck.ratioProduccion },
                  ].map(m => {
                    const pct = Math.round(m.valor * 100)
                    return (
                      <div key={m.label} className="rounded border border-border-subtle bg-bg-alt/30 p-3">
                        <p className="text-xs text-text-muted mb-1">{m.label}</p>
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono text-lg font-semibold text-text-heading">{pct}%</span>
                        </div>
                        <div className="w-full bg-border-subtle rounded-full h-1.5 mt-2 overflow-hidden">
                          <div
                            className={`h-full ${pct >= 95 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.max(5, pct)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Desenlace */}
                <div className="rounded border border-gold-300 bg-bg-alt/50 p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-text-heading">Desenlace</span>
                    <div className="flex gap-1">
                      <Badge tone={ultimoCheck.desenlaceSugerido === 'todo_bien' ? 'info' : ultimoCheck.desenlaceSugerido === 'novedad' ? 'warning' : 'danger'} dot>
                        {ultimoCheck.desenlaceSugerido === 'todo_bien' ? 'Todo listo' : ultimoCheck.desenlaceSugerido === 'novedad' ? 'Novedad' : 'Situación extrema'}
                      </Badge>
                      {ultimoCheck.desenlaceFinal && ultimoCheck.desenlaceFinal !== ultimoCheck.desenlaceSugerido && (
                        <Badge tone="info" dot>
                          Override: {ultimoCheck.desenlaceFinal === 'todo_bien' ? 'Todo listo' : ultimoCheck.desenlaceFinal === 'novedad' ? 'Novedad' : 'Extremo'}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {!ultimoCheck.desenlaceFinal ? (
                    <>
                      {!anularSugerencia ? (
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="primary"
                            size="md"
                            onClick={handleConfirmarCheck}
                          >
                            Confirmar check
                          </Button>
                          <button
                            type="button"
                            onClick={() => setAnularSugerencia(true)}
                            className="text-xs px-2 py-1 rounded border border-border-subtle text-text-muted hover:bg-bg-alt transition-colors"
                          >
                            Anular sugerencia
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 pt-2">
                          <label className="flex flex-col gap-1">
                            <span className="text-xs text-text-muted">Elegir desenlace*</span>
                            <div className="flex flex-col gap-1">
                              {(['todo_bien', 'novedad', 'extremo'] as const).map(desenlace => (
                                <label key={desenlace} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name="anulation-desenlace"
                                    value={desenlace}
                                    checked={anulationDesenlace === desenlace}
                                    onChange={() => setAnulationDesenlace(desenlace)}
                                    className="rounded"
                                  />
                                  <span className="text-xs text-text-heading">
                                    {desenlace === 'todo_bien' ? 'Todo listo' : desenlace === 'novedad' ? 'Novedad' : 'Situación extrema'}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="text-xs text-text-muted">Justificación obligatoria*</span>
                            <textarea
                              value={overrideJustificacion}
                              onChange={(e) => setOverrideJustificacion(e.target.value)}
                              placeholder="Ej. El ratio de insumos es bajo porque..."
                              rows={2}
                              className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
                            />
                          </label>
                          <div className="flex gap-2">
                            <Button
                              variant="primary"
                              size="md"
                              disabled={!anulationDesenlace || !overrideJustificacion.trim()}
                              onClick={handleConfirmarCheck}
                            >
                              Confirmar check
                            </Button>
                            <button
                              type="button"
                              onClick={() => {
                                setAnularSugerencia(false)
                                setAnulationDesenlace(null)
                                setOverrideJustificacion('')
                              }}
                              className="text-xs px-2 py-1 rounded border border-border-subtle text-text-muted hover:bg-bg-alt transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-text-muted italic pt-2">
                      Check confirmado con desenlace: {ultimoCheck.desenlaceFinal === 'todo_bien' ? 'Todo listo' : ultimoCheck.desenlaceFinal === 'novedad' ? 'Novedad' : 'Situación extrema'}
                      {ultimoCheck.comisionesReducidasPct && ultimoCheck.comisionesReducidasPct > 0 && (
                        <span> (reducción de comisiones: {Math.round(ultimoCheck.comisionesReducidasPct * 100)}%)</span>
                      )}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-text-muted mb-3">Sin check de producción registrado.</p>
                {!mostrarFormCheck ? (
                  <Button variant="secondary" size="md" onClick={() => setMostrarFormCheck(true)}>
                    + Generar check
                  </Button>
                ) : (
                  <div className="rounded border border-border-subtle bg-bg-paper p-3 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-text-muted">Ratio Insumos (0-1)*</span>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          value={checkForm.ratioInsumos}
                          onChange={(e) => setCheckForm(prev => ({ ...prev, ratioInsumos: e.target.value }))}
                          className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-text-muted">Ratio Pagos (0-1)*</span>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          value={checkForm.ratioPagos}
                          onChange={(e) => setCheckForm(prev => ({ ...prev, ratioPagos: e.target.value }))}
                          className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-text-muted">Ratio Producción (0-1)*</span>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          value={checkForm.ratioProduccion}
                          onChange={(e) => setCheckForm(prev => ({ ...prev, ratioProduccion: e.target.value }))}
                          className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
                        />
                      </label>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleGenerarCheck}
                        className="rounded bg-gold-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-gold-600 transition-colors"
                      >
                        Generar check
                      </button>
                      <button
                        type="button"
                        onClick={() => setMostrarFormCheck(false)}
                        className="rounded border border-border-subtle px-3 py-1.5 text-xs text-text-muted hover:bg-bg-alt transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
