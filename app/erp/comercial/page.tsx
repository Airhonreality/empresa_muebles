'use client'

import { useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/veta/button'
import { Busqueda } from '@/components/veta/busqueda'
import { useDataStore, type Proyecto, type Cliente, type TransicionesProyecto } from '@/lib/data'
import { useSmartSearch } from '@/lib/hooks/useSmartSearch'

// Macro-fases del proyecto
type MacroFase = 'pre_venta' | 'cotizacion' | 'produccion' | 'instalacion' | 'post_venta';

// Estados del proyecto
type EstadoProyecto = 'activa' | 'enviada' | 'negociacion' | 'en_contrato' | 'retoma' | 'pre_produccion' | 'produccion' | 'entregado' | 'perdida' | 'cancelada';

// Macro-fase a la que pertenece cada estado
const MACRO_FASE_POR_ESTADO: Record<EstadoProyecto, MacroFase> = {
  activa: 'pre_venta',
  enviada: 'cotizacion',
  negociacion: 'cotizacion',
  en_contrato: 'cotizacion',
  retoma: 'cotizacion',
  pre_produccion: 'produccion',
  produccion: 'produccion',
  entregado: 'instalacion',
  perdida: 'post_venta',
  cancelada: 'post_venta',
};

// Acciones permitidas por estado (solo transiciones válidas dentro de su macro-fase o a macro-fases adyacentes)
const ACCIONES_POR_ESTADO: Record<EstadoProyecto, { transiciones: string[]; puedeRetoma: boolean }> = {
  activa: { transiciones: ['enviada', 'perdida', 'cancelada'], puedeRetoma: false },
  enviada: { transiciones: ['negociacion', 'en_contrato', 'perdida', 'cancelada'], puedeRetoma: false },
  negociacion: { transiciones: ['en_contrato', 'enviada', 'perdida', 'cancelada'], puedeRetoma: false },
  en_contrato: { transiciones: ['pre_produccion', 'retoma', 'perdida', 'cancelada'], puedeRetoma: true },
  retoma: { transiciones: ['en_contrato', 'pre_produccion', 'perdida', 'cancelada'], puedeRetoma: false },
  pre_produccion: { transiciones: ['produccion', 'retoma', 'cancelada'], puedeRetoma: true },
  produccion: { transiciones: ['entregado', 'retoma', 'cancelada'], puedeRetoma: true },
  entregado: { transiciones: ['perdida', 'cancelada'], puedeRetoma: false },
  perdida: { transiciones: [], puedeRetoma: false },
  cancelada: { transiciones: [], puedeRetoma: false },
};

// Orden de macro-fases para validar adyacencia
const ORDEN_MACRO_FASES: MacroFase[] = ['pre_venta', 'cotizacion', 'produccion', 'instalacion', 'post_venta'];

// Verifica si dos macro-fases son adyacentes (diferencia de 1 en el orden)
const sonMacrosAdyacentes = (a: MacroFase, b: MacroFase): boolean => {
  const idxA = ORDEN_MACRO_FASES.indexOf(a)
  const idxB = ORDEN_MACRO_FASES.indexOf(b)
  if (idxA === -1 || idxB === -1) return false
  return Math.abs(idxA - idxB) <= 1
}

// Valida si una transición es válida según macro-fases
const esTransicionValidaMacroFase = (estadoActual: EstadoProyecto, estadoDestino: string): boolean => {
  const macroActual = MACRO_FASE_POR_ESTADO[estadoActual]
  const macroDestino = MACRO_FASE_POR_ESTADO[estadoDestino as EstadoProyecto]
  if (!macroActual || !macroDestino) return false
  return macroActual === macroDestino || sonMacrosAdyacentes(macroActual, macroDestino)
}

type ColumnKey = { key: string; keys?: undefined; label: string; color: 'stone' | 'sky' | 'emerald' | 'amber' | 'red' | 'gray'; editable: boolean }
type ColumnKeys = { key?: undefined; keys: string[]; label: string; color: 'stone' | 'sky' | 'emerald' | 'amber' | 'red' | 'gray'; editable: boolean }
type ColumnaKanban = ColumnKey | ColumnKeys

const COLUMNAS_KANBAN: ColumnaKanban[] = [
  { key: 'activa', label: 'Activa / Lead', color: 'stone', editable: true },
  { key: 'enviada', label: 'Cotización Enviada', color: 'sky', editable: true },
  { key: 'negociacion', label: 'En Negociación', color: 'amber', editable: true },
  { key: 'en_contrato', label: 'En Contrato', color: 'emerald', editable: true },
  { key: 'retoma', label: 'Retoma de Medidas', color: 'sky', editable: true },
  { key: 'pre_produccion', label: 'Pre-Producción', color: 'amber', editable: true },
  { key: 'produccion', label: 'Producción', color: 'red', editable: false },
  { key: 'entregado', label: 'Entregado', color: 'gray', editable: false },
  { keys: ['perdida', 'cancelada'], label: 'Archivo', color: 'gray', editable: false },
]

const ESTADO_LABELS: Record<string, string> = {
  activa: 'Lead',
  enviada: 'Propuesta',
  negociacion: 'En Negociación',
  en_contrato: 'En Contrato',
  retoma: 'Retoma de Medidas',
  pre_produccion: 'Pre-Producción',
  produccion: 'Producción',
  entregado: 'Entregado',
  perdida: 'Perdida',
  cancelada: 'Cancelada',
}

// Label natural de tipoProyecto (H07 + POC-12). "Proyecto a medida"/"Servicio técnico" son
// labels nuevos propuestos por disenio_p01 §v3.1, pendientes de agregar a glosario_h07.md.
const TIPO_PROYECTO_LABEL: Record<string, string> = {
  producto_fijo: 'Producto fijo',
  proyecto_a_medida: 'Proyecto a medida',
  personalizado: 'Proyecto a medida',
  servicio_tecnico: 'Servicio técnico',
}

// Color del punto de estado (badge minimalista v3.2) — reusa el mapeo ya vigente por
// columna en COLUMNAS_KANBAN, no la paleta amber/blue/orange/violet/green/muted del §2
// histórico del diseño (nunca implementada en código real).
const ESTADO_DOT_COLOR: Record<string, string> = {
  activa: 'text-stone-500',
  enviada: 'text-sky-600',
  negociacion: 'text-amber-600',
  en_contrato: 'text-emerald-600',
  retoma: 'text-sky-600',
  pre_produccion: 'text-amber-600',
  produccion: 'text-red-600',
  entregado: 'text-stone-400',
  perdida: 'text-stone-400',
  cancelada: 'text-stone-400',
}

// Destinos canónicos de los controles rápidos in-card (disenio_p01 §v3.3). No es una
// máquina de estados nueva: el botón solo se muestra si el destino sigue estando en
// estadosPosibles (derivado de parametros.transiciones_proyecto).
const CANONICO_AVANZAR: Partial<Record<EstadoProyecto, EstadoProyecto>> = {
  activa: 'enviada',
  enviada: 'negociacion',
  negociacion: 'en_contrato',
  en_contrato: 'retoma',
  retoma: 'pre_produccion',
  pre_produccion: 'produccion',
}

const CANONICO_RETORNAR: Partial<Record<EstadoProyecto, EstadoProyecto>> = {
  negociacion: 'enviada',
  retoma: 'en_contrato',
  pre_produccion: 'retoma',
}

function ProjectCard({
  proyecto,
  cliente,
  totalItems,
  espaciosCount,
  espaciosActivos,
  transiciones,
  columnEditable,
  onTransition,
}: {
  proyecto: Proyecto
  cliente: Cliente | undefined
  totalItems: number
  espaciosCount: number
  espaciosActivos: number
  transiciones: TransicionesProyecto
  columnEditable: boolean
  onTransition: (id: string, nuevoEstado: EstadoProyecto) => void
}) {
  const router = useRouter()
  const [menuAbierto, setMenuAbierto] = useState(false)

  // Obtener acciones permitidas para este estado
  const estadoActual = proyecto.estado as EstadoProyecto;
  const acciones = ACCIONES_POR_ESTADO[estadoActual] ?? { transiciones: [], puedeRetoma: false };

  // Filtrar transiciones permitidas (intersección entre transiciones del store y ACCIONES_POR_ESTADO + validación macro-fase)
  const estadosPosibles = (transiciones[estadoActual] ?? []).filter(destino =>
    (acciones.transiciones.includes(destino) || (destino === 'retoma' && acciones.puedeRetoma)) &&
    esTransicionValidaMacroFase(estadoActual, destino)
  );

  const handleCardClick = useCallback(() => {
    router.push(`/erp/proyectos/${proyecto.id}`);
  }, [router, proyecto.id]);

  // Controles rápidos (disenio_p01 §v3.3): solo destinos canónicos, solo si válidos hoy.
  const destinoAvanzar = CANONICO_AVANZAR[estadoActual];
  const puedeAvanzar = Boolean(destinoAvanzar && estadosPosibles.includes(destinoAvanzar));
  const destinoRetroceder = CANONICO_RETORNAR[estadoActual];
  const puedeRetroceder = Boolean(destinoRetroceder && estadosPosibles.includes(destinoRetroceder));
  const archivar = estadosPosibles.includes('perdida')
    ? 'perdida'
    : estadosPosibles.includes('cancelada')
      ? 'cancelada'
      : null;

  const diasEnEstado = Math.max(0, Math.floor((Date.now() - new Date(proyecto.updatedAt).getTime()) / 86400000));
  const tipoLabel = TIPO_PROYECTO_LABEL[proyecto.tipoProyecto] ?? proyecto.tipoProyecto;
  const dotColor = ESTADO_DOT_COLOR[proyecto.estado] ?? 'text-stone-400';
  const estadoLabel = ESTADO_LABELS[proyecto.estado] ?? proyecto.estado;

  return (
    <div
      className="group rounded-md border border-border-subtle bg-bg-raised p-2 shadow-xs transition-all duration-soft hover:border-gold-400 hover:shadow-md cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between gap-1.5">
        <span className="inline-flex min-w-0 items-center gap-1" aria-label={`Estado: ${estadoLabel}`}>
          <span
            aria-hidden
            className={`inline-block shrink-0 rounded-full ${dotColor} ${columnEditable ? 'animate-dot-mini' : ''}`}
            style={{ width: 'var(--badge-dot-size)', height: 'var(--badge-dot-size)', backgroundColor: 'currentColor' }}
          />
          <span
            className="truncate text-text-muted"
            style={{ fontSize: 'var(--badge-label-size)', fontWeight: 'var(--badge-label-weight)' }}
          >
            {estadoLabel}
          </span>
        </span>

        <div className="flex items-center gap-0.5 shrink-0">
          {columnEditable && puedeAvanzar && destinoAvanzar && (
            <button
              type="button"
              className="rounded p-0.5 text-text-muted hover:bg-bg-alt hover:text-brand transition-colors duration-fast"
              onClick={(e) => { e.stopPropagation(); onTransition(proyecto.id, destinoAvanzar); }}
              aria-label={`Avanzar a ${ESTADO_LABELS[destinoAvanzar] ?? destinoAvanzar}`}
              title={`Avanzar a ${ESTADO_LABELS[destinoAvanzar] ?? destinoAvanzar}`}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 8h8M8 4l4 4-4 4" />
              </svg>
            </button>
          )}
          {columnEditable && puedeRetroceder && destinoRetroceder && (
            <button
              type="button"
              className="rounded p-0.5 text-text-muted hover:bg-bg-alt hover:text-amber-600 transition-colors duration-fast"
              onClick={(e) => { e.stopPropagation(); onTransition(proyecto.id, destinoRetroceder); }}
              aria-label={`Retornar a ${ESTADO_LABELS[destinoRetroceder] ?? destinoRetroceder}`}
              title={`Retornar a ${ESTADO_LABELS[destinoRetroceder] ?? destinoRetroceder}`}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8H4M8 4L4 8l4 4" />
              </svg>
            </button>
          )}
          <button
            type="button"
            className="p-1 rounded text-text-muted hover:text-text-heading hover:bg-bg-alt transition-colors duration-fast"
            onClick={(e) => { e.stopPropagation(); setMenuAbierto(!menuAbierto) }}
            aria-label="Más acciones del proyecto"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor">
              <circle cx="3" cy="7" r="1.5" /><circle cx="7" cy="7" r="1.5" /><circle cx="11" cy="7" r="1.5" />
            </svg>
          </button>
        </div>
      </div>

      <p
        className="mt-1 truncate text-xs font-semibold leading-tight text-text-heading group-hover:text-brand transition-colors"
        title={cliente?.nombre}
      >
        {cliente?.nombre ?? 'Sin cliente'}
      </p>

      <p className="mt-0.5 truncate text-[11px] text-text-muted" title={`${proyecto.nombreProyecto} · ${tipoLabel}`}>
        {proyecto.nombreProyecto} · {tipoLabel}
      </p>

      {proyecto.direccionObra && (
        <p className="mt-0.5 truncate text-[11px] text-text-muted" title={proyecto.direccionObra}>
          {proyecto.direccionObra}
        </p>
      )}

      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 border-t border-border-subtle/50 pt-1 text-[10px] text-text-muted">
        <span>{espaciosCount} esp.</span>
        <span>Items: {totalItems}</span>
        <span>Variantes {espaciosActivos}/{espaciosCount}</span>
        {/* suppressHydrationWarning: diasEnEstado depende de Date.now() -- puede diferir por
            milisegundos entre el render del servidor y la hidratación del cliente si cruza un
            límite de día. Patrón recomendado por React para valores de tiempo variables (mismo
            motivo que un "hace 5 min"); no afecta el valor final, solo evita el warning de
            hidratación en ese caso límite. Hallazgo de Javier (2026-08-17), error #418 en Preview. */}
        <span suppressHydrationWarning>{diasEnEstado}d en estado</span>
      </div>

      {archivar && columnEditable && (
        <div className="mt-1 flex justify-end">
          <Button
            variant="ghost"
            size="md"
            className="h-5 px-1 text-[10px] leading-none text-red-500 hover:text-red-600"
            onClick={(e) => { e.stopPropagation(); onTransition(proyecto.id, archivar); }}
            title={`Archivar (${archivar})`}
          >
            &#10005; Archivar
          </Button>
        </div>
      )}

      {menuAbierto && (
        <div className="mt-1.5 border-t border-border-subtle pt-1 text-[11px] text-text-muted" onClick={(e) => e.stopPropagation()}>
          {proyecto.descripcionSemantica && (
            <p className="italic">&ldquo;{proyecto.descripcionSemantica}&rdquo;</p>
          )}
          {cliente?.telefono && <p className="mt-0.5">{cliente.telefono}</p>}
          <div className="mt-1 flex flex-wrap gap-2">
            <button
              type="button"
              className="text-brand hover:underline font-medium"
              onClick={(e) => { e.stopPropagation(); router.push(`/erp/cotizador/${proyecto.id}`); }}
            >
              Abrir Cotizador
            </button>
            {estadoActual !== 'perdida' && estadoActual !== 'cancelada' && (
              <button
                type="button"
                className="text-red-500 hover:text-red-600 hover:underline font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`¿Eliminar la cotización "${proyecto.nombreProyecto}"? Pasa a Archivo, no se borra el historial.`)) {
                    onTransition(proyecto.id, 'cancelada');
                    setMenuAbierto(false);
                  }
                }}
              >
                Eliminar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function KanbanComercialPage() {
  const router = useRouter()
  const store = useDataStore()
  const version = store.getVersion()

  const proyectos = store.proyectos.listar()
  const clientes = store.clientes.listar()
  const transiciones = store.parametros.transicionesProyecto()
  const espaciosTodos = store.espacios
  const itemsTodos = store.items

  const clienteMap = useMemo(() => {
    const m = new Map<string, Cliente>()
    clientes.forEach((c) => m.set(c.id, c))
    return m
  }, [clientes])

  // CA-7 (disenio_p01 §5.2): buscador resiliente con contexto "comercial-kanban" —
  // matchea nombreProyecto, cliente, descripción semántica, tipo y obra (t-141, Opción A).
  // La clave localStorage "comercial-kanban-search" se escribe apenas el usuario busca.
  const [filtroTipo, setFiltroTipo] = useState('')
  const { query, setQuery, resultado: proyectosBuscados } = useSmartSearch({
    items: proyectos,
    getCampos: (p) => [
      p.nombreProyecto,
      clienteMap.get(p.clienteId ?? '')?.nombre ?? '',
      p.descripcionSemantica ?? '',
      TIPO_PROYECTO_LABEL[p.tipoProyecto] ?? p.tipoProyecto,
      p.direccionObra ?? '',
    ],
    contexto: 'comercial-kanban',
    fuzzy: true,
    limite: 500,
  })

  // Filtro de tipo de proyecto sobre el resultado de la búsqueda. El filtro se aplica ANTES de
  // columnData para que los conteos de columna reflejen lo que el usuario ve (flag de t-141).
  const proyectosFiltrados = useMemo(() => {
    if (!filtroTipo) return proyectosBuscados
    return proyectosBuscados.filter((p) => p.tipoProyecto === filtroTipo)
  }, [proyectosBuscados, filtroTipo])

  const projectStats = useMemo(() => {
    const stats = new Map<string, { items: number; espacios: number; espaciosActivos: number }>()
    proyectos.forEach((p) => {
      const esp = espaciosTodos.porProyecto(p.id)
      const itCnt = esp.reduce((sum, e) => sum + itemsTodos.porVariante(e.id).length, 0)
      const activos = esp.filter((e) => e.activa).length
      stats.set(p.id, { items: itCnt, espacios: esp.length, espaciosActivos: activos })
    })
    return stats
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectos, version])

   const columnData = useMemo(() => {
     const map = new Map<string, Proyecto[]>()
     COLUMNAS_KANBAN.forEach((col) => {
       if (col.key) map.set(col.key, [])
       else if (col.keys) col.keys.forEach((k) => map.set(k, []))
     })
     proyectosFiltrados.forEach((p) => {
       const arr = map.get(p.estado)
       if (arr) arr.push(p)
     })
      return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectosFiltrados, version])

  const handleTransition = async (proyectoId: string, nuevoEstado: EstadoProyecto) => {
    await store.proyectos.actualizarEstado(proyectoId, nuevoEstado)
  }

  return (
    <div className="mx-auto max-w-full px-6 py-6">
      <header className="mb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-text-heading">
              Kanban Comercial
            </h1>
            <p className="text-sm text-text-muted">
              {proyectos.length} proyectos · {COLUMNAS_KANBAN.length} estados
              {(query.trim() || filtroTipo) && (
                <span className="ml-2 text-gold-600">
                  · {proyectosFiltrados.length} mostrando
                </span>
              )}
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => router.push('/erp/cotizador/new')}
          >
            + Nuevo Proyecto
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Busqueda
            valor={query}
            onChange={setQuery}
            placeholder="Buscar proyecto, cliente u obra..."
            label="Buscar en el tablero"
            className="w-full sm:w-72"
          />
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            aria-label="Filtrar por tipo de proyecto"
            className="rounded-sm border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-heading focus:border-brand focus:shadow-ring-focus focus:outline-none"
          >
            <option value="">Todos los tipos</option>
            {Object.entries(TIPO_PROYECTO_LABEL).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>{etiqueta}</option>
            ))}
          </select>
          {(query.trim() || filtroTipo) && (
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                setQuery('')
                setFiltroTipo('')
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </header>

      <div className="kanban-board flex gap-3 overflow-x-auto pb-4" style={{ scrollSnapType: 'x mandatory' }}>
        {COLUMNAS_KANBAN.map((col) => {
          const cards = col.keys
            ? col.keys.flatMap((k) => columnData.get(k) ?? [])
            : (columnData.get(col.key) ?? [])
          const colId = col.keys ? col.keys.join('+') : col.key!
          return (
            <div
              key={colId}
              className="flex-shrink-0 w-[210px] sm:w-[220px] lg:w-[215px] xl:w-[230px] flex flex-col rounded-lg border border-border-subtle bg-bg-alt/60 p-2"
              style={{ scrollSnapAlign: 'start' }}
            >
              <div className="mb-2 flex items-center justify-between px-0.5">
                <span className="text-[13px] font-semibold text-text-heading">{col.label}</span>
                <span className="rounded-full bg-bg-raised border border-border-subtle px-2 text-xs text-text-muted font-mono">
                  {cards.length}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 flex-1">
                {cards.length === 0 && (
                  <p className="text-[11px] text-text-muted text-center py-5 italic">
                    Sin proyectos en este estado.
                  </p>
                )}
                {cards.map((proj) => {
                  const stats = projectStats.get(proj.id) ?? { items: 0, espacios: 0, espaciosActivos: 0 }
                  return (
                    <ProjectCard
                      key={proj.id}
                      proyecto={proj}
                      cliente={clienteMap.get(proj.clienteId ?? '')}
                      totalItems={stats.items}
                      espaciosCount={stats.espacios}
                      espaciosActivos={stats.espaciosActivos}
                      transiciones={transiciones}
                      columnEditable={col.editable}
                      onTransition={handleTransition}
                    />
                  )
                })}
              </div>

              {!col.editable && cards.length > 0 && (
                <p className="mt-1.5 text-[10px] text-text-muted italic text-center">
                  Solo lectura
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
