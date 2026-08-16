'use client'

import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/veta/badge'
import { LinkButton } from '@/components/veta/button'
import {
  useDataStore,
  type ActaEntrega,
  type CitacionCalidad,
  type DesfaseCronograma,
  type Instalacion,
  type ObligacionPendiente,
  type OrdenCompra,
  type RecepcionMaterial,
  type Reproceso,
  type Verificacion,
} from '@/lib/data'

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
}

function numDe(s: string | null | undefined): number {
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

// ---------------------------------------------------------------------------
// Timeline de gates derivado (disenio_dashboard_proyecto.md §2.4, R1..R10)
// Nodos derivados de datos del store — nunca asentados a mano. Sin emojis.
// ---------------------------------------------------------------------------

type GateId = 'E-18' | 'E-21' | 'E-24' | 'E-33' | 'E-20' | 'E-23' | 'E-25' | 'E-26'

interface GateNodo {
  id: GateId
  code: string
  label: string
  tipo: 'gate' | 'senal' | 'hito' | 'transversal'
  estado: 'completado' | 'pendiente' | 'rechazado' | 'senal' | 'transversal'
  dotColor: string
  detalle: string | null
  actual: boolean
  ramas: Reproceso[]
}

const ORDEN_ACTUAL: GateId[] = ['E-18', 'E-21', 'E-24', 'E-25', 'E-26']

// Regla R3: el nodo actual es el primer nodo pendiente del camino primario cuyo
// estado_origen coincide con proyectos.estado.
const ESTADO_ORIGEN_POR_NODO: Partial<Record<GateId, string[]>> = {
  'E-18': ['desarrollo'],
  'E-21': ['aprobado_compras'],
  'E-24': ['armado'],
  'E-25': ['verificado', 'en_instalacion'],
  'E-26': ['instalado'],
}

function estadoDotColor(estado: GateNodo['estado']): string {
  switch (estado) {
    case 'completado':
      return 'text-gold-600'
    case 'rechazado':
      return 'text-error-stroke'
    case 'senal':
      return 'text-info-stroke'
    default:
      return 'text-stone-400'
  }
}

function veredictoAprobado(v: Verificacion | undefined): boolean {
  return v?.veredicto === 'aprobado'
}

function veredictoRechazado(v: Verificacion | undefined): boolean {
  return v ? ['rechazado', 'rechazado_total', 'reproceso_parcial'].includes(v.veredicto) : false
}

function nodoActual(proyectoEstado: string | undefined, nodos: GateNodo[]): GateId | null {
  if (!proyectoEstado) return null
  for (const gid of ORDEN_ACTUAL) {
    const nodo = nodos.find((n) => n.id === gid)
    if (!nodo || nodo.estado === 'completado') continue
    if ((ESTADO_ORIGEN_POR_NODO[gid] ?? []).includes(proyectoEstado)) return gid
  }
  return null
}

function derivarNodos(args: {
  proyectoEstado: string | undefined
  verificaciones: Verificacion[]
  recepciones: RecepcionMaterial[]
  desfases: DesfaseCronograma[]
  citaciones: CitacionCalidad[]
  reprocesos: Reproceso[]
  instalaciones: Instalacion[]
  acta: ActaEntrega | undefined
  cajaDisponible: number
  obligaciones: ObligacionPendiente[]
  ordenesCompra: OrdenCompra[]
}): GateNodo[] {
  const {
    proyectoEstado,
    verificaciones,
    recepciones,
    desfases,
    citaciones,
    reprocesos,
    instalaciones,
    acta,
    cajaDisponible,
    obligaciones,
    ordenesCompra,
  } = args

  const vSchema = verificaciones.find((v) => v.tipoGate === 'schema')
  const vCalidad = verificaciones.find((v) => v.tipoGate === 'calidad')
  const citacion = citaciones.length > 0 ? citaciones[0] : undefined
  const desfase = desfases.length > 0 ? desfases[desfases.length - 1] : undefined
  const ultimaInstalacion = instalaciones.length > 0 ? instalaciones[instalaciones.length - 1] : undefined
  const recepcionVerificada = recepciones.some(
    (r) => r.estado === 'recibido_verificado' || (r.checkPedidoBien && r.checkDespachoBien && r.checkMaterial),
  )
  const recepcionDefectuosa = recepciones.some((r) => r.estado === 'recibido_defectuoso')

  const instalacionCompletada = instalaciones.some((i) => i.estado === 'instalada')
  const instalacionEnCurso = instalaciones.some((i) => i.estado === 'programada' || i.estado === 'en_curso')
  const instalacionFallida = instalaciones.some((i) => i.estado === 'fallida')

  const hayObligacionesProyecto = obligaciones.length > 0
  const obligacionesAtrasadas = obligaciones.some((o) => o.estado === 'atrasada')
  const hayOcEnPago = ordenesCompra.some((oc) => oc.estado === 'en_pago' || oc.estado === 'recibida_verificada')

  const e18Estado: GateNodo['estado'] = veredictoAprobado(vSchema)
    ? 'completado'
    : veredictoRechazado(vSchema)
      ? 'rechazado'
      : 'pendiente'
  const e18Detalle = veredictoAprobado(vSchema)
    ? 'Aprobado'
    : veredictoRechazado(vSchema)
      ? 'Rechazado'
      : null

  const e24Estado: GateNodo['estado'] = veredictoAprobado(vCalidad)
    ? 'completado'
    : veredictoRechazado(vCalidad)
      ? 'rechazado'
      : 'pendiente'
  const e24Detalle = veredictoAprobado(vCalidad)
    ? 'Aprobado'
    : veredictoRechazado(vCalidad)
      ? 'Rechazado'
      : null

  const e21Estado: GateNodo['estado'] = recepcionVerificada ? 'completado' : recepcionDefectuosa ? 'rechazado' : 'pendiente'
  const e21Detalle = recepcionVerificada
    ? 'Material verificado'
    : recepcionDefectuosa
      ? 'Defectuoso'
      : null

  const e25Estado: GateNodo['estado'] = instalacionCompletada
    ? 'completado'
    : instalacionFallida
      ? 'rechazado'
      : instalacionEnCurso
        ? 'pendiente'
        : 'pendiente'
  const e25Detalle = instalacionCompletada
    ? 'Instalada'
    : instalacionFallida
      ? 'Fallida'
      : instalacionEnCurso
        ? ultimaInstalacion?.estado === 'programada' ? 'Programada' : 'En curso'
        : null

  const nodos: GateNodo[] = [
    {
      id: 'E-18',
      code: 'E-18',
      label: 'Esquema',
      tipo: 'gate',
      estado: e18Estado,
      dotColor: estadoDotColor(e18Estado),
      detalle: e18Detalle,
      actual: false,
      ramas: reprocesos.filter((r) => r.origen === 'schema'),
    },
    {
      id: 'E-21',
      code: 'E-21',
      label: 'Recepción',
      tipo: 'gate',
      estado: e21Estado,
      dotColor: estadoDotColor(e21Estado),
      detalle: e21Detalle,
      actual: false,
      ramas: [],
    },
    {
      id: 'E-23',
      code: 'E-23',
      label: 'Citación',
      tipo: 'senal',
      estado: 'senal',
      dotColor: citacion ? 'text-info-stroke' : 'text-stone-400',
      detalle: citacion ? (citacion.estado === 'citada' ? 'Citada' : 'Atendida') : 'Sin citación',
      actual: false,
      ramas: [],
    },
    {
      id: 'E-24',
      code: 'E-24',
      label: 'Calidad',
      tipo: 'gate',
      estado: e24Estado,
      dotColor: estadoDotColor(e24Estado),
      detalle: e24Detalle,
      actual: false,
      ramas: reprocesos.filter((r) => r.origen === 'calidad'),
    },
    {
      id: 'E-25',
      code: 'E-25',
      label: 'Instalación',
      tipo: 'hito',
      estado: e25Estado,
      dotColor: instalacionEnCurso && !instalacionCompletada ? 'text-warning-stroke' : estadoDotColor(e25Estado),
      detalle: e25Detalle,
      actual: false,
      ramas: reprocesos.filter((r) => r.origen === 'instalacion'),
    },
    {
      id: 'E-26',
      code: 'E-26',
      label: 'Entrega',
      tipo: 'hito',
      estado: acta ? 'completado' : 'pendiente',
      dotColor: estadoDotColor(acta ? 'completado' : 'pendiente'),
      detalle: acta ? 'Acta generada' : 'Pendiente',
      actual: false,
      ramas: [],
    },
    {
      id: 'E-33',
      code: 'E-33',
      label: 'Desfase',
      tipo: 'transversal',
      estado: 'transversal',
      dotColor: !desfase ? 'text-stone-400' : desfase.aplicado ? 'text-gold-600' : 'text-warning-stroke',
      detalle: !desfase
        ? 'Sin desfases'
        : `${desfase.diasDesfase} días · ${desfase.aplicado ? 'aplicado' : 'pendiente'}`,
      actual: false,
      ramas: [],
    },
    {
      id: 'E-20',
      code: 'E-20',
      label: 'Caja',
      tipo: 'transversal',
      estado: 'transversal',
      dotColor: obligacionesAtrasadas
        ? 'text-error-stroke'
        : hayObligacionesProyecto || hayOcEnPago
          ? 'text-warning-stroke'
          : 'text-stone-400',
      detalle: `Disponible ${formatCOP(cajaDisponible)} · ${obligaciones.length} obligaciones`,
      actual: false,
      ramas: [],
    },
  ]

  const actualId = nodoActual(proyectoEstado, nodos)
  nodos.forEach((n) => {
    n.actual = n.id === actualId
  })
  return nodos
}

const ORIGEN_REPROCESO_LABEL: Record<string, string> = {
  schema: 'Schema',
  calidad: 'Calidad',
  instalacion: 'Instalación',
  garantia: 'Garantía',
  recepcion: 'Recepción',
}

const MODULO_ESTADO_LABEL: Record<string, string> = {
  por_armar: 'Por armar',
  en_armado: 'En armado',
  armado: 'Armado',
  en_calidad: 'En calidad',
  aprobado: 'Aprobado',
  en_instal: 'En instalación',
}

const INSTALACION_ESTADO_LABEL: Record<string, string> = {
  programada: 'Programada',
  en_curso: 'En curso',
  instalada: 'Instalada',
  fallida: 'Fallida',
}

const ARTEFACTO_TIPO_LABEL: Record<string, string> = {
  imagen: 'Imagen',
  plano_armado: 'Plano de armado',
  orden_armado: 'Orden de armado',
  modelo_3d: 'Modelo 3D',
}

function dotModuloColor(estado: string): string {
  if (['armado', 'aprobado'].includes(estado)) return 'text-gold-600'
  if (estado === 'en_instal' || estado === 'instalado') return 'text-info-stroke'
  if (estado === 'por_armar') return 'text-stone-400'
  return 'text-warning-stroke'
}

function Chevron({ abierto }: { abierto: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      className={`shrink-0 text-text-muted transition-transform ${abierto ? 'rotate-90' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="m4 3 3 3-3 3" />
    </svg>
  )
}

function RamaReprocesoChip({ reproceso }: { reproceso: Reproceso }) {
  return (
    <div className="flex items-center gap-1 rounded-sm bg-bg-alt px-1.5 py-1">
      <svg
        width="10"
        height="10"
        viewBox="0 0 12 12"
        className="text-text-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <path d="M2 6h6M8 6 5 3.5M8 6 5 8.5" />
      </svg>
      <span className="text-[10px] text-text-muted">
        Reproceso {ORIGEN_REPROCESO_LABEL[reproceso.origen] ?? reproceso.origen}
      </span>
      {reproceso.granularidad && (
        <span className="rounded-sm border border-border-subtle px-1 text-[9px] font-mono text-text-muted">
          {reproceso.granularidad}
        </span>
      )}
    </div>
  )
}

function GateNodeChip({ nodo }: { nodo: GateNodo }) {
  return (
    <div className="flex w-24 flex-shrink-0 flex-col items-center gap-1.5">
      <span className="inline-flex items-center gap-1.5">
        <span
          aria-hidden
          className={`inline-block shrink-0 rounded-full ${nodo.dotColor} ${nodo.actual ? 'animate-dot-mini' : ''}`}
          style={{ width: 'var(--badge-dot-size)', height: 'var(--badge-dot-size)', backgroundColor: 'currentColor' }}
        />
        <span className="font-mono text-[10px] text-text-muted">{nodo.code}</span>
      </span>
      <span
        className="text-center text-text-muted"
        style={{ fontSize: 'var(--badge-label-size)', fontWeight: 'var(--badge-label-weight)' }}
      >
        {nodo.label}
      </span>
      {nodo.detalle && <span className="text-center text-[10px] text-text-muted">{nodo.detalle}</span>}
      {nodo.ramas.length > 0 && (
        <div className="mt-1 flex flex-col items-center gap-1">
          <div className="h-3 w-0.5 bg-border-subtle" />
          {nodo.ramas.map((r) => (
            <RamaReprocesoChip key={r.id} reproceso={r} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProyectoHubPage() {
  const params = useParams()
  const proyectoId = params.proyectoId as string
  const store = useDataStore()
  const version = store.getVersion()

  const [espaciosExpandidos, setEspaciosExpandidos] = useState<Set<string>>(new Set())
  const [moduloSeleccionadoId, setModuloSeleccionadoId] = useState<string | null>(null)

  const proyecto = store.proyectos.obtenerPorId(proyectoId)
  const cliente = proyecto?.clienteId ? store.clientes.obtenerPorId(proyecto.clienteId) : undefined

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const verificaciones = useMemo(() => (proyecto ? store.verificaciones.porProyecto(proyectoId) : []), [proyectoId, store, version])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recepciones = useMemo(() => (proyecto ? store.recepcionesMaterial.porProyecto(proyectoId) : []), [proyectoId, store, version])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const desfases = useMemo(() => (proyecto ? store.desfases.porProyecto(proyectoId) : []), [proyectoId, store, version])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const citaciones = useMemo(() => (proyecto ? store.citacionesCalidad.porProyecto(proyectoId) : []), [proyectoId, store, version])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reprocesos = useMemo(() => (proyecto ? store.reprocesos.porProyecto(proyectoId) : []), [proyectoId, store, version])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const instalaciones = useMemo(() => (proyecto ? store.instalaciones.porProyecto(proyectoId) : []), [proyectoId, store, version])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const acta = useMemo(() => (proyecto ? store.actasEntrega.porProyecto(proyectoId) : undefined), [proyectoId, store, version])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const espacios = useMemo(() => (proyecto ? store.espacios.porProyecto(proyectoId) : []), [proyectoId, store, version])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const modulos = useMemo(() => (proyecto ? store.modulos.porProyecto(proyectoId) : []), [proyectoId, store, version])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cronograma = useMemo(() => (proyecto ? store.cronogramas.porProyecto(proyectoId) : undefined), [proyectoId, store, version])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const obligaciones = useMemo(() => (proyecto ? store.obligacionesPendientes.porProyecto(proyectoId) : []), [proyectoId, store, version])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ordenesCompraProyecto = useMemo(() => (proyecto ? store.ordenesCompra.listar().filter((oc) => oc.proyectoId === proyectoId) : []), [proyectoId, store, version])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cajaDisponible = useMemo(() => store.cuentasFinancieras.disponible(), [store, version])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cronogramaEtapas = useMemo(() => (cronograma ? store.cronogramaEtapas.porCronograma(cronograma.id) : []), [cronograma, store, version])

  const moduloSeleccionado = moduloSeleccionadoId ? (modulos.find((m) => m.id === moduloSeleccionadoId) ?? null) : null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const artefactosModulo = useMemo(() => (moduloSeleccionado ? store.modulosArtefactos.porModulo(moduloSeleccionado.id) : []), [moduloSeleccionado, store, version])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const itemsEspacio = useMemo(() => (moduloSeleccionado?.espacioVarianteId ? store.items.porVariante(moduloSeleccionado.espacioVarianteId) : []), [moduloSeleccionado, store, version])

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

  const nodos = derivarNodos({
    proyectoEstado: proyecto.estado,
    verificaciones,
    recepciones,
    desfases,
    citaciones,
    reprocesos,
    instalaciones,
    acta,
    cajaDisponible,
    obligaciones,
    ordenesCompra: ordenesCompraProyecto,
  })
  const nodosPrimarios = nodos.filter((n) => n.tipo !== 'transversal')
  const nodosTransversales = nodos.filter((n) => n.tipo === 'transversal')

  const modulosPorEspacio = (espacioId: string) => modulos.filter((m) => m.espacioVarianteId === espacioId)
  const modulosSinEspacio = modulos.filter((m) => !m.espacioVarianteId)

  const toggleEspacio = (espacioId: string) => {
    setEspaciosExpandidos((prev) => {
      const next = new Set(prev)
      if (next.has(espacioId)) next.delete(espacioId)
      else next.add(espacioId)
      return next
    })
  }

  const etapaInstalacionContractual = cronogramaEtapas.find((e) => e.linea === 'contractual' && e.etapa === 'instalacion')
  const fechaPrevistaInstalacion = etapaInstalacionContractual?.fechaIdeal ?? null
  const ultimaInstalacion = instalaciones.length > 0 ? instalaciones[instalaciones.length - 1] : undefined

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

      {/* Timeline de Gates derivado: E-18, E-21, E-23, E-24, E-25, E-26 + transversales E-33/E-20 */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-4">Timeline de Gates y Señales</h2>
        <div className="rounded-lg border border-border-subtle bg-bg-raised p-5">
          <div className="flex items-start gap-2 overflow-x-auto pb-2">
            {nodosPrimarios.map((nodo, i) => (
              <div key={nodo.id} className="flex flex-shrink-0 items-start">
                <GateNodeChip nodo={nodo} />
                {i < nodosPrimarios.length - 1 && <div className="mt-2 h-0.5 w-6 flex-shrink-0 bg-border-subtle" />}
              </div>
            ))}
          </div>
          {nodosTransversales.length > 0 && (
            <div className="mt-4 flex items-center gap-5 border-t border-border-subtle pt-3">
              <span className="text-[10px] uppercase tracking-wide text-text-muted">Transversales</span>
              {nodosTransversales.map((nodo) => (
                <GateNodeChip key={nodo.id} nodo={nodo} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Árbol operativo: Nodos → Espacios → Módulos → Ítem / planos */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-4">Árbol Operativo</h2>
        <div className="rounded-lg border border-border-subtle bg-bg-raised p-5">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="min-w-0">
              <h3 className="text-[13px] font-semibold text-text-heading mb-3">Espacios</h3>
              {espacios.length === 0 && modulosSinEspacio.length === 0 ? (
                <p className="text-sm text-text-muted">Sin espacios ni módulos registrados.</p>
              ) : (
                <ul className="space-y-1">
                  {espacios.map((esp) => {
                    const mods = modulosPorEspacio(esp.id)
                    const expandido = espaciosExpandidos.has(esp.id)
                    return (
                      <li key={esp.id}>
                        <button
                          type="button"
                          onClick={() => toggleEspacio(esp.id)}
                          className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-bg-alt"
                        >
                          <span className="flex min-w-0 items-center gap-1.5">
                            <Chevron abierto={expandido} />
                            <span className="truncate text-sm text-text-heading">{esp.nombreEspacio}</span>
                            {esp.nombreVariante !== esp.nombreEspacio && (
                              <span className="truncate text-xs text-text-muted">· {esp.nombreVariante}</span>
                            )}
                            {esp.activa && <Badge tone="info">Activa</Badge>}
                          </span>
                          <span className="shrink-0 font-mono text-[10px] text-text-muted">{mods.length} módulos</span>
                        </button>
                        {expandido && (
                          <ul className="ml-4 space-y-1 border-l border-border-subtle pl-3">
                            {mods.length === 0 && <li className="px-2 py-1 text-xs text-text-muted">Sin módulos</li>}
                            {mods.map((mod) => (
                              <li key={mod.id}>
                                <button
                                  type="button"
                                  onClick={() => setModuloSeleccionadoId(mod.id)}
                                  className={`flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-bg-alt ${moduloSeleccionadoId === mod.id ? 'bg-bg-alt' : ''}`}
                                >
                                  <span className="flex min-w-0 items-center gap-1.5">
                                    <span
                                      aria-hidden
                                      className={`inline-block shrink-0 rounded-full ${dotModuloColor(mod.estado)}`}
                                      style={{ width: 'var(--badge-dot-size)', height: 'var(--badge-dot-size)', backgroundColor: 'currentColor' }}
                                    />
                                    <span className="truncate text-sm text-text-heading">{mod.nombre}</span>
                                  </span>
                                  <span className="shrink-0 text-[10px] text-text-muted">
                                    {MODULO_ESTADO_LABEL[mod.estado] ?? mod.estado}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    )
                  })}
                  {modulosSinEspacio.length > 0 && (
                    <li>
                      <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                        <span className="text-sm font-medium text-text-muted">Módulos del proyecto (sin espacio)</span>
                        <span className="shrink-0 font-mono text-[10px] text-text-muted">{modulosSinEspacio.length}</span>
                      </div>
                      <ul className="ml-4 space-y-1 border-l border-border-subtle pl-3">
                        {modulosSinEspacio.map((mod) => (
                          <li key={mod.id}>
                            <button
                              type="button"
                              onClick={() => setModuloSeleccionadoId(mod.id)}
                              className={`flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-bg-alt ${moduloSeleccionadoId === mod.id ? 'bg-bg-alt' : ''}`}
                            >
                              <span className="flex min-w-0 items-center gap-1.5">
                                <span
                                  aria-hidden
                                  className={`inline-block shrink-0 rounded-full ${dotModuloColor(mod.estado)}`}
                                  style={{ width: 'var(--badge-dot-size)', height: 'var(--badge-dot-size)', backgroundColor: 'currentColor' }}
                                />
                                <span className="truncate text-sm text-text-heading">{mod.nombre}</span>
                              </span>
                              <span className="shrink-0 text-[10px] text-text-muted">
                                {MODULO_ESTADO_LABEL[mod.estado] ?? mod.estado}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </li>
                  )}
                </ul>
              )}
            </div>

            <div className="min-w-0">
              <h3 className="text-[13px] font-semibold text-text-heading mb-3">Ítem y planos</h3>
              {moduloSeleccionado ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-text-heading">{moduloSeleccionado.nombre}</p>
                    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <dt className="text-text-muted">Estado</dt>
                      <dd>{MODULO_ESTADO_LABEL[moduloSeleccionado.estado] ?? moduloSeleccionado.estado}</dd>
                      <dt className="text-text-muted">Tipo</dt>
                      <dd>{moduloSeleccionado.tipoModulo ?? '—'}</dd>
                      <dt className="text-text-muted">Cantidad</dt>
                      <dd>{moduloSeleccionado.cantidad}</dd>
                      <dt className="text-text-muted">Horas estimadas</dt>
                      <dd>{moduloSeleccionado.horasEstimadas}</dd>
                    </dl>
                  </div>
                  {artefactosModulo.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">Planos y artefactos</h4>
                      <ul className="space-y-1">
                        {artefactosModulo.map((a) => (
                          <li key={a.id}>
                            <a
                              href={a.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between gap-2 rounded-sm border border-border-subtle px-2 py-1.5 text-sm text-text-heading hover:border-gold-400"
                            >
                              <span>{ARTEFACTO_TIPO_LABEL[a.tipo] ?? a.tipo}</span>
                              <span className="text-[10px] text-text-muted">Abrir</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {itemsEspacio.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">Ítems de cotización</h4>
                      <ul className="space-y-1">
                        {itemsEspacio.map((item) => (
                          <li key={item.id} className="flex items-center justify-between gap-2 rounded-sm border border-border-subtle px-2 py-1.5 text-sm">
                            <span className="truncate text-text-heading">
                              {item.nombrePersonalizado ?? 'Ítem'}
                            </span>
                            <span className="shrink-0 font-mono text-xs text-text-muted">
                              {item.cantidad} × {formatCOP(numDe(item.precioUnitario))}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {artefactosModulo.length === 0 && itemsEspacio.length === 0 && (
                    <p className="text-xs text-text-muted">Sin planos ni ítems registrados para este módulo.</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-text-muted">Selecciona un espacio y un módulo para ver su detalle.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Dirección y datos de instalación */}
      <section className="mb-8 rounded-lg border border-border-subtle bg-bg-raised p-6">
        <h3 className="font-semibold text-text-heading mb-4">Dirección y datos de instalación</h3>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-text-muted">Dirección de obra</dt>
            <dd className="mt-0.5 text-text-heading">{proyecto.direccionObra ?? 'Sin registrar'}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Plazo contractual</dt>
            <dd className="mt-0.5 text-text-heading">{cronograma ? `${cronograma.promesaSemanas} semanas` : 'Sin cronograma'}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Fecha prevista de instalación</dt>
            <dd className="mt-0.5 text-text-heading">
              {fechaPrevistaInstalacion ? formatDate(fechaPrevistaInstalacion) : 'Sin programar'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Estado de instalación</dt>
            <dd className="mt-0.5 text-text-heading">
              {ultimaInstalacion ? INSTALACION_ESTADO_LABEL[ultimaInstalacion.estado] ?? ultimaInstalacion.estado : 'Sin programar'}
            </dd>
          </div>
        </dl>
        {instalaciones.length > 0 && (
          <ul className="mt-4 space-y-2 border-t border-border-subtle pt-3">
            {instalaciones.map((inst) => (
              <li key={inst.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-text-heading">
                  {formatDate(inst.rangoFechaInicio)} → {formatDate(inst.rangoFechaFin)}
                </span>
                <Badge tone={inst.estado === 'instalada' ? 'info' : inst.estado === 'fallida' ? 'danger' : 'warning'}>
                  {INSTALACION_ESTADO_LABEL[inst.estado] ?? inst.estado}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Acciones (grilla "Ir a X" conservada tal cual existía) */}
      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border-subtle bg-bg-raised p-6">
          <h3 className="font-semibold text-text-heading mb-3">Retoma de Medidas</h3>
          <p className="text-sm text-text-muted mb-4">
            Registro de medidas y anomalías detectadas en obra.
          </p>
          <LinkButton href={`/erp/proyectos/${proyectoId}/retoma`} variant="primary" size="md" className="w-full">
            Ir a Retoma
          </LinkButton>
        </div>

        <div className="rounded-lg border border-border-subtle bg-bg-raised p-6">
          <h3 className="font-semibold text-text-heading mb-3">Esquema y Veredicto</h3>
          <p className="text-sm text-text-muted mb-4">
            Carga, revisión y aprobación del esquema técnico.
          </p>
          <LinkButton href={`/erp/proyectos/${proyectoId}/desarrollo`} variant="primary" size="md" className="w-full">
            Ir a Esquema
          </LinkButton>
        </div>

        <div className="rounded-lg border border-border-subtle bg-bg-raised p-6">
          <h3 className="font-semibold text-text-heading mb-3">Cronograma</h3>
          <p className="text-sm text-text-muted mb-4">
            Línea contractual/interna, novedades críticas y check de producción.
          </p>
          <LinkButton href={`/erp/proyectos/${proyectoId}/cronograma`} variant="primary" size="md" className="w-full">
            Ir a Cronograma
          </LinkButton>
        </div>

        <div className="rounded-lg border border-border-subtle bg-bg-raised p-6">
          <h3 className="font-semibold text-text-heading mb-3">Calidad</h3>
          <p className="text-sm text-text-muted mb-4">
            Citación y veredicto de calidad tras el armado en taller.
          </p>
          <LinkButton href={`/erp/proyectos/${proyectoId}/calidad`} variant="primary" size="md" className="w-full">
            Ir a Calidad
          </LinkButton>
        </div>

        <div className="rounded-lg border border-border-subtle bg-bg-raised p-6">
          <h3 className="font-semibold text-text-heading mb-3">Instalación</h3>
          <p className="text-sm text-text-muted mb-4">
            Programación y ejecución de la instalación en obra.
          </p>
          <LinkButton href={`/erp/proyectos/${proyectoId}/instalacion`} variant="primary" size="md" className="w-full">
            Ir a Instalación
          </LinkButton>
        </div>

        <div className="rounded-lg border border-border-subtle bg-bg-raised p-6">
          <h3 className="font-semibold text-text-heading mb-3">Entrega</h3>
          <p className="text-sm text-text-muted mb-4">
            Acta de entrega firmada, cierre del proyecto.
          </p>
          <LinkButton href={`/erp/proyectos/${proyectoId}/entrega`} variant="primary" size="md" className="w-full">
            Ir a Entrega
          </LinkButton>
        </div>

         <div className="rounded-lg border border-border-subtle bg-bg-raised p-6">
           <h3 className="font-semibold text-text-heading mb-3">Documentos</h3>
           <p className="text-sm text-text-muted mb-4">
             Fotos y documentos del proyecto por etapa.
           </p>
           <LinkButton href={`/erp/proyectos/${proyectoId}/documentos`} variant="primary" size="md" className="w-full">
             Ir a Documentos
           </LinkButton>
         </div>

         <div className="rounded-lg border border-border-subtle bg-bg-raised p-6">
           <h3 className="font-semibold text-text-heading mb-3">Publicar en Portafolio Web</h3>
           <p className="text-sm text-text-muted mb-4">
             Control manual de publicación (T-02). Configurar título, descripción, imágenes y visibilidad para el sitio público.
           </p>
           <LinkButton href={`/erp/proyectos/${proyectoId}/portafolio`} variant="primary" size="md" className="w-full">
             Ir a Portafolio
           </LinkButton>
         </div>
       </section>
    </div>
  )
}
