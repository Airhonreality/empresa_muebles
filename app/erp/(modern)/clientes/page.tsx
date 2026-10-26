'use client'

import { useMemo, useState } from 'react'
import { Button, LinkButton } from '@/components/veta/button'
import { Busqueda } from '@/components/veta/busqueda'
import { Badge } from '@/components/veta/badge'
import { DataTable, type DataTableColumn } from '@/components/veta/data-table'
import { StatCard } from '@/components/veta/stat-card'
import { BarraFiltros, FiltroChip } from '@/components/veta/filtros'
import { AsociarConversionModal } from '@/components/veta/asociar-conversion-modal'
import { DetalleConversionModal } from '@/components/veta/detalle-conversion-modal'
import { useToast } from '@/components/veta/toast-provider'
import { type Cliente, type EstadoLead, type EventoConversionOffline, type Lead } from '@/lib/data'
import { useClientesCompat } from '@/lib/data/queries/clientes-compat'
import {
  calcularKpis,
  construirFilasConversion,
  filtrarConversiones,
  listarCampanas,
  type FilaConversion,
  type FiltroAtribucion,
  type FiltroVinculo,
} from '@/lib/data/queries/conversiones'
import { useSmartSearch } from '@/lib/hooks/useSmartSearch'
import { generarRefLead } from '@/lib/leads/ref'
import { formatCurrency } from '@/lib/utils/format'

interface ClienteFila {
  cliente: Cliente
  proyectosCount: number
  obligacionesCount: number
  pedidosCount: number
  /** t-189: conversiones del sitio vinculadas a este cliente (por cliente o por proyecto). */
  conversiones: Lead[]
}

const ETAPA_LABELS: Record<EstadoLead, string> = {
  nuevo_lead: 'Nuevo lead',
  contactado: 'Contactado',
  asesoria_agendada: 'Asesoría agendada',
  cotizado: 'Cotizado',
  contrato_firmado: 'Contrato firmado',
  descartado: 'Descartado',
}

const ETAPA_TONE: Record<EstadoLead, 'neutral' | 'info' | 'warning' | 'danger'> = {
  nuevo_lead: 'info',
  contactado: 'info',
  asesoria_agendada: 'warning',
  cotizado: 'warning',
  contrato_firmado: 'neutral',
  descartado: 'neutral',
}

const ESTADO_ENVIO_LABELS: Record<EventoConversionOffline['estadoEnvio'], string> = {
  pendiente: 'Pendiente de subir',
  procesando: 'Subiendo',
  enviado_exitoso: 'Enviada a Google',
  error_matching: 'Error de matching',
}

function formatFechaHora(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
}

export default function ClientesTableroPage() {
  const { store } = useClientesCompat()
  const version = store.getVersion()
  const toast = useToast()

  const [vista, setVista] = useState<'clientes' | 'conversiones'>('clientes')
  const [soloConObligaciones, setSoloConObligaciones] = useState(false)
  const [soloSinConversion, setSoloSinConversion] = useState(false)

  // ── Vista Clientes ────────────────────────────────────────────────────────
  const filas = useMemo(() => {
    const clientes = store.clientes.listar()
    const proyectos = store.proyectos.listar()
    const obligacionesPorProyecto = new Map<string, number>()
    store.obligacionesPendientes.listar().forEach((o) => {
      if (o.proyectoId) obligacionesPorProyecto.set(o.proyectoId, (obligacionesPorProyecto.get(o.proyectoId) ?? 0) + 1)
    })

    const pedidosPorCliente = new Map<string, number>()
    store.pedidosWeb.listar().forEach((p) => {
      pedidosPorCliente.set(p.clienteId, (pedidosPorCliente.get(p.clienteId) ?? 0) + 1)
    })

    // t-189: una conversión cuenta para el cliente si está vinculada a él directamente o a
    // cualquiera de sus proyectos. Así el mapping no depende de haber asociado por el lado
    // del cliente: la asociación por proyecto también se refleja acá.
    const proyectoACliente = new Map<string, string>()
    proyectos.forEach((p) => {
      if (p.clienteId) proyectoACliente.set(p.id, p.clienteId)
    })
    const leadsPorCliente = new Map<string, Lead[]>()
    store.leads.listar().forEach((lead) => {
      const clienteId =
        lead.clienteId ?? (lead.proyectoId ? proyectoACliente.get(lead.proyectoId) ?? null : null)
      if (!clienteId) return
      const lista = leadsPorCliente.get(clienteId) ?? []
      lista.push(lead)
      leadsPorCliente.set(clienteId, lista)
    })

    return clientes.map((cliente): ClienteFila => {
      const proyectosCliente = proyectos.filter((p) => p.clienteId === cliente.id)
      const obligacionesCount = proyectosCliente.reduce(
        (acc, p) => acc + (obligacionesPorProyecto.get(p.id) ?? 0),
        0
      )
      return {
        cliente,
        proyectosCount: proyectosCliente.length,
        obligacionesCount,
        pedidosCount: pedidosPorCliente.get(cliente.id) ?? 0,
        conversiones: [...(leadsPorCliente.get(cliente.id) ?? [])].sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt)
        ),
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, version])

  const filasConId = useMemo(() => filas.map((f) => ({ ...f, id: f.cliente.id })), [filas])

  const { query: busqueda, setQuery: setBusqueda, resultado: filasBuscadas } = useSmartSearch({
    items: filasConId,
    getCampos: (f) => [
      f.cliente.nombre ?? '',
      f.cliente.telefono ?? '',
      f.cliente.email ?? '',
      f.cliente.documento ?? '',
      f.cliente.domicilio ?? '',
    ],
    contexto: 'clientes',
    fuzzy: true,
    limite: 500,
  })

  const filasFiltradas = useMemo(() => {
    return filasBuscadas.filter((fila) => {
      if (soloConObligaciones && fila.obligacionesCount === 0) return false
      if (soloSinConversion && fila.conversiones.length > 0) return false
      return true
    })
  }, [filasBuscadas, soloConObligaciones, soloSinConversion])

  type FilaCliente = (typeof filasFiltradas)[number]

  const columnas: DataTableColumn<FilaCliente>[] = [
    {
      key: 'nombre',
      header: 'Nombre',
      sortValue: (f) => f.cliente.nombre,
      render: (f) => <span className="font-medium text-text-heading">{f.cliente.nombre}</span>,
    },
    {
      key: 'telefono',
      header: 'Teléfono',
      sortValue: (f) => f.cliente.telefono,
      render: (f) => <span className="text-text-muted">{f.cliente.telefono || '—'}</span>,
    },
    {
      key: 'email',
      header: 'Correo',
      sortValue: (f) => f.cliente.email,
      render: (f) => <span className="text-text-muted">{f.cliente.email || '—'}</span>,
    },
    {
      key: 'documento',
      header: 'Documento',
      sortValue: (f) => f.cliente.documento,
      render: (f) => <span className="text-text-muted">{f.cliente.documento || '—'}</span>,
    },
    {
      key: 'domicilio',
      header: 'Domicilio',
      sortValue: (f) => f.cliente.domicilio,
      render: (f) => <span className="text-text-muted">{f.cliente.domicilio || '—'}</span>,
    },
    {
      key: 'actividad',
      header: 'Actividad',
      sortValue: (f) => f.proyectosCount,
      render: (f) => (
        <span className="text-xs text-text-muted">
          {f.proyectosCount} proyecto{f.proyectosCount === 1 ? '' : 's'} ·{' '}
          {f.obligacionesCount} obligación{f.obligacionesCount === 1 ? '' : 'es'} pendiente{f.obligacionesCount === 1 ? '' : 's'} ·{' '}
          {f.pedidosCount} pedido{f.pedidosCount === 1 ? '' : 's'} web
        </span>
      ),
    },
    {
      key: 'origen',
      header: 'Origen',
      sortValue: (f) => f.conversiones.length,
      render: (f) => {
        if (f.conversiones.length === 0) return <Badge tone="warning">Sin conversión</Badge>
        const ultima = f.conversiones[0]
        return (
          <div className="flex flex-col gap-1">
            <Badge tone="info">
              {f.conversiones.length} conversión{f.conversiones.length === 1 ? '' : 'es'}
            </Badge>
            <span className="text-[10px] text-text-muted">
              {ultima.utmCampaign?.trim() ||
                (ultima.gclid || ultima.wbraid || ultima.gbraid ? 'Google Ads' : 'Orgánico')}
            </span>
          </div>
        )
      },
    },
    {
      key: 'detalle',
      header: 'Acciones',
      align: 'right',
      render: (f) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => {
              setLeadSeleccionado(null)
              setClienteSeleccionado(f.cliente)
            }}
          >
            Vincular conversión
          </Button>
          <LinkButton href={`/erp/clientes/${f.cliente.id}`} variant="secondary" size="md">
            Ver detalle
          </LinkButton>
        </div>
      ),
    },
  ]

  // ── Vista Conversiones (t-188) ────────────────────────────────────────────
  const leads = useMemo(() => store.leads.listar(), [store])
  const eventosConversion = useMemo(() => store.eventosConversion.listar(), [store])

  const filasConversion = useMemo(
    () =>
      construirFilasConversion({
        leads,
        clientes: store.clientes.listar(),
        proyectos: store.proyectos.listar(),
        contratos: store.contratos.listar(),
        eventos: eventosConversion,
      }),
    [leads, eventosConversion, store]
  )

  const [busquedaConv, setBusquedaConv] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [campana, setCampana] = useState('')
  const [etapa, setEtapa] = useState('')
  const [atribucion, setAtribucion] = useState<FiltroAtribucion>('todas')
  const [vinculo, setVinculo] = useState<FiltroVinculo>('todos')
  const [soloSinIdentificar, setSoloSinIdentificar] = useState(false)

  const campanas = useMemo(() => listarCampanas(filasConversion), [filasConversion])

  const filtrosActivos =
    (busquedaConv ? 1 : 0) +
    (desde ? 1 : 0) +
    (hasta ? 1 : 0) +
    (campana ? 1 : 0) +
    (etapa ? 1 : 0) +
    (atribucion !== 'todas' ? 1 : 0) +
    (vinculo !== 'todos' ? 1 : 0) +
    (soloSinIdentificar ? 1 : 0)

  const limpiarFiltros = () => {
    setBusquedaConv('')
    setDesde('')
    setHasta('')
    setCampana('')
    setEtapa('')
    setAtribucion('todas')
    setVinculo('todos')
    setSoloSinIdentificar(false)
  }

  const filasConvFiltradas = useMemo(() => {
    const base = filtrarConversiones(filasConversion, {
      busqueda: busquedaConv,
      desde: desde || undefined,
      hasta: hasta || undefined,
      campana: campana || undefined,
      etapa: etapa || undefined,
      atribucion,
      vinculo,
    })
    return soloSinIdentificar ? base.filter((f) => f.sinIdentificar) : base
  }, [filasConversion, busquedaConv, desde, hasta, campana, etapa, atribucion, vinculo, soloSinIdentificar])

  const kpis = useMemo(() => calcularKpis(filasConversion), [filasConversion])

  const [leadSeleccionado, setLeadSeleccionado] = useState<Lead | null>(null)
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [detalleConversion, setDetalleConversion] = useState<FilaConversion | null>(null)
  const [guardandoConversion, setGuardandoConversion] = useState(false)

  const leadsParaVincular = useMemo(() => {
    if (!clienteSeleccionado) return []
    return store.leads
      .listar()
      .filter((l) => !l.clienteId || l.clienteId === clienteSeleccionado.id)
  }, [clienteSeleccionado, store])

  const abrirAsociar = (fila: FilaConversion) => {
    const lead = leads.find((l) => l.id === fila.id) ?? null
    setClienteSeleccionado(null)
    setLeadSeleccionado(lead)
  }

  const asociarLead = async ({
    leadId,
    clienteId,
    proyectoId,
  }: {
    leadId: string
    clienteId: string
    proyectoId?: string | null
  }) => {
    setGuardandoConversion(true)
    try {
      await store.leads.asociarACliente(leadId, clienteId, proyectoId)
      toast.mostrarInfo(
        proyectoId ? 'Conversión vinculada al proyecto' : 'Conversión asociada al cliente'
      )
    } catch (error) {
      toast.mostrarError(error instanceof Error ? error.message : 'No se pudo asociar la conversión')
      throw error
    } finally {
      setGuardandoConversion(false)
    }
  }

  const convertirLead = async () => {
    if (!leadSeleccionado) return
    setGuardandoConversion(true)
    try {
      const cliente = await store.leads.convertirEnCliente(leadSeleccionado.id)
      toast.mostrarInfo(cliente ? `Cliente creado: ${cliente.nombre}` : 'No se pudo crear el cliente')
    } catch (error) {
      toast.mostrarError(error instanceof Error ? error.message : 'No se pudo crear el cliente')
      throw error
    } finally {
      setGuardandoConversion(false)
    }
  }

  const columnasConversion: DataTableColumn<FilaConversion>[] = [
    {
      key: 'fecha',
      header: 'Fecha',
      sortValue: (f) => f.fecha,
      render: (f) => <span className="whitespace-nowrap text-xs text-text-muted">{formatFechaHora(f.fecha)}</span>,
    },
    {
      key: 'ref',
      header: 'Ref',
      sortValue: (f) => f.ref,
      render: (f) => <span className="font-mono text-xs text-text-heading">{f.ref}</span>,
    },
    {
      key: 'persona',
      header: 'Persona',
      sortValue: (f) => f.nombre ?? f.telefono ?? '',
      render: (f) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text-heading">
            {f.nombre ?? (f.sinIdentificar ? 'Sin identificar' : 'Sin nombre')}
          </p>
          <p className="truncate text-xs text-text-muted">{f.telefono ?? 'Sin teléfono'}</p>
        </div>
      ),
    },
    {
      key: 'campana',
      header: 'Campaña / término',
      sortValue: (f) => f.campana ?? '',
      render: (f) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-text-heading">{f.campana ?? '—'}</p>
          <p className="truncate text-xs text-text-muted">{f.termino ?? f.fuente ?? 'Sin UTM'}</p>
        </div>
      ),
    },
    {
      key: 'atribucion',
      header: 'Atribución',
      sortValue: (f) => (f.atribuido ? 0 : 1),
      render: (f) =>
        f.atribuido ? (
          <div className="space-y-1">
            <Badge tone="info">Clic Google Ads</Badge>
            <p className="max-w-[10rem] truncate font-mono text-[10px] text-text-muted" title={f.gclid ?? ''}>
              {f.gclid}
            </p>
          </div>
        ) : (
          <Badge tone="neutral">Sin clic Ads</Badge>
        ),
    },
    {
      key: 'etapa',
      header: 'Etapa',
      sortValue: (f) => f.etapa,
      render: (f) => <Badge tone={ETAPA_TONE[f.etapa]}>{ETAPA_LABELS[f.etapa]}</Badge>,
    },
    {
      key: 'cliente',
      header: 'Cliente',
      sortValue: (f) => f.clienteNombre ?? '',
      render: (f) =>
        f.clienteId ? (
          <LinkButton href={`/erp/clientes/${f.clienteId}`} variant="ghost" size="md">
            {f.clienteNombre ?? 'Ver cliente'}
          </LinkButton>
        ) : (
          <span className="text-xs text-text-muted">Sin asociar</span>
        ),
    },
    {
      key: 'valor',
      header: 'Contrato',
      align: 'right',
      sortValue: (f) => f.valorContrato,
      render: (f) =>
        f.contratoId ? (
          <div className="text-right">
            <p className="text-sm font-medium text-text-heading">{formatCurrency(f.valorContrato)}</p>
            <p className="font-mono text-[10px] text-text-muted">{f.contratoCodigo}</p>
          </div>
        ) : (
          <span className="text-xs text-text-muted">—</span>
        ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (f) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" size="md" onClick={() => setDetalleConversion(f)}>
            Datos
          </Button>
          <Button type="button" variant="secondary" size="md" onClick={() => abrirAsociar(f)}>
            Asociar
          </Button>
          {f.proyectoId && (
            <LinkButton href={`/erp/cotizador/${f.proyectoId}`} variant="ghost" size="md">
              Ver proyecto
            </LinkButton>
          )}
        </div>
      ),
    },
  ]

  const eventosOrdenados = useMemo(
    () => [...eventosConversion].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [eventosConversion]
  )
  const leadsPorId = useMemo(() => new Map(leads.map((l) => [l.id, l])), [leads])
  const eventosPendientes = eventosConversion.filter((e) => e.estadoEnvio === 'pendiente').length

  const columnasEvento: DataTableColumn<EventoConversionOffline>[] = [
    {
      key: 'fecha',
      header: 'Fecha',
      sortValue: (e) => e.createdAt,
      render: (e) => <span className="whitespace-nowrap text-xs text-text-muted">{formatFechaHora(e.createdAt)}</span>,
    },
    {
      key: 'lead',
      header: 'Conversión',
      render: (e) => {
        const lead = leadsPorId.get(e.leadId)
        return (
          <div>
            <p className="font-mono text-xs text-text-heading">{generarRefLead(e.leadId)}</p>
            <p className="text-xs text-text-muted">{lead?.nombre?.trim() || lead?.telefonoWhatsapp || 'Sin identificar'}</p>
          </div>
        )
      },
    },
    {
      key: 'evento',
      header: 'Evento',
      sortValue: (e) => e.nombreEventoGoogle,
      render: (e) => <span className="text-xs text-text-heading">{e.nombreEventoGoogle}</span>,
    },
    {
      key: 'valor',
      header: 'Valor',
      align: 'right',
      sortValue: (e) => Number(e.valorConversion),
      render: (e) => <span className="text-xs text-text-heading">{formatCurrency(Number(e.valorConversion))}</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      sortValue: (e) => e.estadoEnvio,
      render: (e) => (
        <Badge tone={e.estadoEnvio === 'error_matching' ? 'danger' : e.estadoEnvio === 'pendiente' ? 'warning' : 'neutral'}>
          {ESTADO_ENVIO_LABELS[e.estadoEnvio]}
        </Badge>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-full px-6 py-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-heading">
            {vista === 'clientes' ? 'Clientes' : 'Conversiones'}
          </h1>
          <p className="text-sm text-text-muted">
            {vista === 'clientes'
              ? `${filas.length} clientes`
              : `${filasConversion.length} conversiones captadas por el sitio`}
          </p>
        </div>
      </header>

      <div className="mb-5">
        <BarraFiltros etiqueta="Vista de clientes">
          <FiltroChip activo={vista === 'clientes'} onClick={() => setVista('clientes')}>
            Clientes
          </FiltroChip>
          <FiltroChip activo={vista === 'conversiones'} onClick={() => setVista('conversiones')}>
            Conversiones
            {eventosPendientes > 0 ? ` · ${eventosPendientes} por subir` : ''}
          </FiltroChip>
        </BarraFiltros>
      </div>

      {vista === 'clientes' ? (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Busqueda
              valor={busqueda}
              onChange={setBusqueda}
              placeholder="Buscar por nombre, teléfono o correo..."
              label="Buscar cliente"
              className="w-full max-w-sm"
            />
            <label className="flex items-center gap-2 text-sm text-text-muted">
              <input
                type="checkbox"
                checked={soloConObligaciones}
                onChange={(e) => setSoloConObligaciones(e.target.checked)}
                className="h-4 w-4 accent-gold-600"
              />
              Solo con obligaciones pendientes
            </label>
            <label className="flex items-center gap-2 text-sm text-text-muted">
              <input
                type="checkbox"
                checked={soloSinConversion}
                onChange={(e) => setSoloSinConversion(e.target.checked)}
                className="h-4 w-4 accent-gold-600"
              />
              Solo sin conversión
            </label>
          </div>

          <DataTable
            rows={filasFiltradas}
            columns={columnas}
            rowKey={(f) => f.cliente.id}
            initialSort={{ key: 'nombre', direction: 'asc' }}
            density="spacious"
            caption="Clientes"
            empty={
              <div className="p-4">
                <p className="mb-4 text-text-muted">No hay clientes con estos filtros</p>
                <LinkButton
                  href="/erp/clientes"
                  variant="ghost"
                  size="md"
                  onClick={() => {
                    setBusqueda('')
                    setSoloConObligaciones(false)
                    setSoloSinConversion(false)
                  }}
                >
                  Limpiar filtros
                </LinkButton>
              </div>
            }
          />
        </>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Conversiones" value={String(kpis.total)} />
            <StatCard label="Con clic de Google Ads" value={String(kpis.atribuidas)} tone="brand" />
            <StatCard label="Sin clic de Ads" value={String(kpis.sinAtribucion)} />
            <StatCard label="Sin identificar" value={String(kpis.sinIdentificar)} tone={kpis.sinIdentificar > 0 ? 'danger' : 'neutral'} />
            <StatCard label="Asociadas a cliente" value={String(kpis.conCliente)} />
            <StatCard label="Contratos firmados" value={String(kpis.contratos)} tone="brand" />
          </div>

          <p className="mb-4 rounded-sm border border-border-subtle bg-bg-alt px-3 py-2 text-xs text-text-muted">
            Datos capturados por el sitio (formulario + pixel: gclid/wbraid/gbraid y UTMs). El costo,
            los clics y las impresiones que reporta Google Ads llegarán cuando se conecte su API
            (t-110, pendiente de credenciales); no se inventan ni se estiman aquí.
          </p>

          <div className="mb-4 flex flex-wrap items-end gap-3">
            <Busqueda
              valor={busquedaConv}
              onChange={setBusquedaConv}
              placeholder="Buscar por nombre, teléfono, ref o campaña..."
              label="Buscar conversión"
              className="w-full max-w-sm"
            />
            <label className="flex flex-col gap-1 text-xs text-text-muted">
              Desde
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="rounded-sm border border-border-strong/40 bg-bg-alt px-2 py-1.5 text-sm text-text-primary focus:border-gold-500 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-text-muted">
              Hasta
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="rounded-sm border border-border-strong/40 bg-bg-alt px-2 py-1.5 text-sm text-text-primary focus:border-gold-500 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-text-muted">
              Campaña
              <select
                value={campana}
                onChange={(e) => setCampana(e.target.value)}
                className="rounded-sm border border-border-strong/40 bg-bg-alt px-2 py-1.5 text-sm text-text-primary focus:border-gold-500 focus:outline-none"
              >
                <option value="">Todas</option>
                {campanas.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-text-muted">
              Etapa
              <select
                value={etapa}
                onChange={(e) => setEtapa(e.target.value)}
                className="rounded-sm border border-border-strong/40 bg-bg-alt px-2 py-1.5 text-sm text-text-primary focus:border-gold-500 focus:outline-none"
              >
                <option value="">Todas</option>
                {(Object.keys(ETAPA_LABELS) as EstadoLead[]).map((e) => (
                  <option key={e} value={e}>
                    {ETAPA_LABELS[e]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-text-muted">
              Atribución
              <select
                value={atribucion}
                onChange={(e) => setAtribucion(e.target.value as FiltroAtribucion)}
                className="rounded-sm border border-border-strong/40 bg-bg-alt px-2 py-1.5 text-sm text-text-primary focus:border-gold-500 focus:outline-none"
              >
                <option value="todas">Todas</option>
                <option value="ads">Con clic de Ads</option>
                <option value="sin_ads">Sin clic de Ads</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-text-muted">
              Cliente
              <select
                value={vinculo}
                onChange={(e) => setVinculo(e.target.value as FiltroVinculo)}
                className="rounded-sm border border-border-strong/40 bg-bg-alt px-2 py-1.5 text-sm text-text-primary focus:border-gold-500 focus:outline-none"
              >
                <option value="todos">Todos</option>
                <option value="con_cliente">Con cliente</option>
                <option value="sin_cliente">Sin cliente</option>
              </select>
            </label>
            <label className="flex items-center gap-2 pb-1.5 text-sm text-text-muted">
              <input
                type="checkbox"
                checked={soloSinIdentificar}
                onChange={(e) => setSoloSinIdentificar(e.target.checked)}
                className="h-4 w-4 accent-gold-600"
              />
              Solo sin identificar
            </label>
            {filtrosActivos > 0 && (
              <Button type="button" variant="ghost" size="md" onClick={limpiarFiltros}>
                Limpiar filtros ({filtrosActivos})
              </Button>
            )}
          </div>

          <DataTable
            rows={filasConvFiltradas}
            columns={columnasConversion}
            rowKey={(f) => f.id}
            initialSort={{ key: 'fecha', direction: 'desc' }}
            density="compact"
            caption="Conversiones captadas por el sitio"
            empty={
              <div className="p-4">
                <p className="mb-2 text-text-muted">
                  {filasConversion.length === 0
                    ? 'Todavía no hay conversiones registradas.'
                    : 'No hay conversiones con estos filtros.'}
                </p>
                {filtrosActivos > 0 && (
                  <Button type="button" variant="ghost" size="md" onClick={limpiarFiltros}>
                    Limpiar filtros
                  </Button>
                )}
              </div>
            }
          />

          <details className="mt-8 rounded-md border border-border-subtle bg-bg-raised p-4">
            <summary className="cursor-pointer text-sm font-medium text-text-heading">
              Cola de conversiones offline de Google · {eventosPendientes} pendiente{eventosPendientes === 1 ? '' : 's'} de subir
            </summary>
            <p className="mb-4 mt-2 text-xs text-text-muted">
              Se registran al firmar un contrato, con el valor contractual y el gclid del lead. La
              subida a Google Ads requiere credenciales de su API (t-110), por eso quedan en cola y
              no se envían solas todavía.
            </p>
            <DataTable
              rows={eventosOrdenados}
              columns={columnasEvento}
              rowKey={(e) => e.id}
              initialSort={{ key: 'fecha', direction: 'desc' }}
              density="compact"
              caption="Conversiones offline"
              empty={<p className="p-4 text-sm text-text-muted">Sin eventos todavía.</p>}
            />
          </details>
        </>
      )}

      <AsociarConversionModal
        open={leadSeleccionado !== null || clienteSeleccionado !== null}
        lead={leadSeleccionado}
        cliente={clienteSeleccionado}
        leads={leadsParaVincular}
        clientes={store.clientes.listar()}
        proyectos={store.proyectos.listar()}
        contratos={store.contratos.listar()}
        guardando={guardandoConversion}
        onClose={() => {
          setLeadSeleccionado(null)
          setClienteSeleccionado(null)
        }}
        onAsociar={asociarLead}
        onConvertir={convertirLead}
      />

      <DetalleConversionModal
        fila={detalleConversion}
        onClose={() => setDetalleConversion(null)}
      />
    </div>
  )
}
