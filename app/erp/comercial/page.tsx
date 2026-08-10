'use client'

import { useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/veta/button'
import { Badge } from '@/components/veta/badge'
import { useDataStore, type Proyecto, type Cliente, type TransicionesProyecto } from '@/lib/data'

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

// Orden lineal de estados para derivar "1 avanzar" / "1 retroceder" en la card
const ORDEN_ESTADOS: EstadoProyecto[] = ['activa', 'enviada', 'negociacion', 'en_contrato', 'retoma', 'pre_produccion', 'produccion', 'entregado', 'perdida', 'cancelada'];

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

const ESTADO_TONE: Record<string, 'info' | 'warning' | 'neutral' | 'danger'> = {
  activa: 'info',
  enviada: 'warning',
  negociacion: 'warning',
  en_contrato: 'warning',
  retoma: 'warning',
  pre_produccion: 'neutral',
  produccion: 'danger',
  entregado: 'neutral',
  perdida: 'neutral',
  cancelada: 'neutral',
}

function ProjectCard({
  proyecto,
  cliente,
  totalItems,
  espaciosCount,
  transiciones,
  columnEditable,
  onTransition,
  espaciosTodos,
  itemsTodos,
  store,
}: {
  proyecto: Proyecto
  cliente: Cliente | undefined
  totalItems: number
  espaciosCount: number
  transiciones: TransicionesProyecto
  columnEditable: boolean
  onTransition: (id: string, nuevoEstado: EstadoProyecto) => void
  espaciosTodos: ReturnType<typeof useDataStore>['espacios']
  itemsTodos: ReturnType<typeof useDataStore>['items']
  store: ReturnType<typeof useDataStore>
}) {
  const router = useRouter()
  const [menuAbierto, setMenuAbierto] = useState(false)
  
  // Calcular valor total cotizado
  const valorTotalCotizado = useMemo(() => {
    const espacios = espaciosTodos.porProyecto(proyecto.id)
    const totalItems = espacios.reduce((sum, espacio) => {
      const items = itemsTodos.porVariante(espacio.id)
      return sum + items.reduce((itemSum, item) => 
        itemSum + (parseFloat(item.totalLinea ?? '0') || 0), 0)
      }, 0)
    return totalItems
  }, [proyecto.id, espaciosTodos, itemsTodos])

  // Obtener historial de estados para este proyecto
  const historial = store.proyectos.historialEstado(proyecto.id)
  const ultimoHistorial = historial.length > 0 ? historial[historial.length - 1] : null

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

  // Botones limitados: 1 avanzar (siguiente estado válido hacia adelante),
  // 1 retroceder (historial o transición válida hacia atrás) y Archivar (perdida/cancelada).
  const esArchivo = (destino: string) => destino === 'perdida' || destino === 'cancelada';
  const indiceEstado = (estado: string) => ORDEN_ESTADOS.indexOf(estado as EstadoProyecto);
  const avanzables = estadosPosibles
    .filter(d => !esArchivo(d) && indiceEstado(d) > indiceEstado(estadoActual))
    .sort((a, b) => indiceEstado(a) - indiceEstado(b));
  const destinoAvanzar = avanzables[avanzables.length - 1] as EstadoProyecto | undefined;
  const retrocedentes = estadosPosibles
    .filter(d => indiceEstado(d) < indiceEstado(estadoActual))
    .sort((a, b) => indiceEstado(a) - indiceEstado(b));
  const destinoRetroceder =
    ultimoHistorial && estadosPosibles.includes(ultimoHistorial.estadoAnterior)
      ? ultimoHistorial.estadoAnterior
      : (retrocedentes[retrocedentes.length - 1] as EstadoProyecto | undefined);
  const archivar = estadosPosibles.includes('perdida')
    ? 'perdida'
    : estadosPosibles.includes('cancelada')
      ? 'cancelada'
      : null;

  return (
    <div
      className="group rounded-md border border-border-subtle bg-bg-raised p-2 shadow-xs transition-all duration-soft hover:border-gold-400 hover:shadow-md cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
    >
       <div className="flex items-start justify-between gap-1.5">
         <p
           className="min-w-0 flex-1 truncate text-xs font-semibold leading-tight text-text-heading group-hover:text-brand transition-colors"
           title={proyecto.nombreProyecto}
         >
           {proyecto.nombreProyecto}
         </p>
         <div className="flex items-center gap-1 shrink-0">
           <button
             type="button"
             className="p-1 rounded text-text-muted hover:text-text-heading hover:bg-bg-alt transition-colors duration-fast"
             onClick={(e) => { e.stopPropagation(); setMenuAbierto(!menuAbierto) }}
             aria-label="Ver descripción del proyecto"
           >
             <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor">
               <circle cx="3" cy="7" r="1.5" /><circle cx="7" cy="7" r="1.5" /><circle cx="11" cy="7" r="1.5" />
             </svg>
           </button>
          <span className="text-xs font-medium text-text-muted">
            ${valorTotalCotizado.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <Badge tone={ESTADO_TONE[proyecto.estado] ?? 'neutral'}>
            {ESTADO_LABELS[proyecto.estado] ?? proyecto.estado}
          </Badge>
        </div>
      </div>

      {cliente && (
        <p className="mt-0.5 truncate text-[11px] text-text-muted">{cliente.nombre}</p>
      )}

      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-text-muted">
        <span>{espaciosCount} esp.</span>
        <span>{totalItems} items</span>
        {proyecto.tipoProyecto === 'producto_fijo' && (
          <span className="text-brand font-medium">Fijo</span>
        )}
        {proyecto.diasEntregaEstimados && (
          <span>&#9201; {proyecto.diasEntregaEstimados}d</span>
        )}
      </div>

      {columnEditable && estadosPosibles.length > 0 && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1 pt-1 border-t border-border-subtle/50">
          {destinoAvanzar && (
            <Button
              variant="ghost"
              size="md"
              className="h-5 px-1 text-[10px] leading-none"
              onClick={(e) => {
                e.stopPropagation();
                onTransition(proyecto.id, destinoAvanzar);
              }}
            >
              &rarr; {ESTADO_LABELS[destinoAvanzar] ?? destinoAvanzar}
            </Button>
          )}
          {destinoRetroceder && (
            <Button
              variant="ghost"
              size="md"
              className="h-5 px-1 text-[10px] leading-none text-amber-600"
              onClick={(e) => { e.stopPropagation(); onTransition(proyecto.id, destinoRetroceder as EstadoProyecto); }}
              title={`Regresar a ${ESTADO_LABELS[destinoRetroceder] ?? destinoRetroceder}`}
            >
              &#8630; {ESTADO_LABELS[destinoRetroceder] ?? destinoRetroceder}
            </Button>
          )}
          {archivar && (
            <Button
              variant="ghost"
              size="md"
              className="h-5 px-1 text-[10px] leading-none text-red-500 hover:text-red-600"
              onClick={(e) => { e.stopPropagation(); onTransition(proyecto.id, archivar); }}
              title={`Archivar (${archivar})`}
            >
              &#10005; Archivar
            </Button>
          )}
        </div>
      )}

      {menuAbierto && (
        <div className="mt-1.5 border-t border-border-subtle pt-1 text-[11px] text-text-muted" onClick={(e) => e.stopPropagation()}>
          {proyecto.descripcionSemantica && (
            <p className="italic">&ldquo;{proyecto.descripcionSemantica}&rdquo;</p>
          )}
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              className="text-brand hover:underline font-medium"
              onClick={(e) => { e.stopPropagation(); router.push(`/erp/cotizador/${proyecto.id}`); }}
            >
              Abrir Cotizador
            </button>
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

  const projectStats = useMemo(() => {
    const stats = new Map<string, { items: number; espacios: number }>()
    proyectos.forEach((p) => {
      const esp = espaciosTodos.porProyecto(p.id)
      const itCnt = esp.reduce((sum, e) => sum + itemsTodos.porVariante(e.id).length, 0)
      stats.set(p.id, { items: itCnt, espacios: esp.length })
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
     proyectos.forEach((p) => {
       const arr = map.get(p.estado)
       if (arr) arr.push(p)
     })
      return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectos, version])

  const handleTransition = (proyectoId: string, nuevoEstado: EstadoProyecto) => {
    store.proyectos.actualizarEstado(proyectoId, nuevoEstado)
  }

  return (
    <div className="mx-auto max-w-full px-6 py-6">
      <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-heading">
            Kanban Comercial
          </h1>
          <p className="text-sm text-text-muted">
            {proyectos.length} proyectos · {COLUMNAS_KANBAN.length} estados
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="primary"
            onClick={() => router.push('/erp/cotizador/new')}
          >
            + Nuevo Proyecto
          </Button>
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
                  const stats = projectStats.get(proj.id) ?? { items: 0, espacios: 0 }
                  return (
                    <ProjectCard
                      key={proj.id}
                      proyecto={proj}
                      cliente={clienteMap.get(proj.clienteId ?? '')}
                      totalItems={stats.items}
                      espaciosCount={stats.espacios}
                      transiciones={transiciones}
                      columnEditable={col.editable}
                      onTransition={handleTransition}
                      espaciosTodos={store.espacios}
                      itemsTodos={store.items}
                      store={store}
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
