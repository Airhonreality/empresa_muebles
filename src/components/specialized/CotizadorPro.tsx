'use client'

/**
 * CotizadorPro — Custom ERP Quotation Builder
 * ─────────────────────────────────────────────
 * Aesthetic: "Veta de Oro" — warm stone + gold luxury palette
 * Block type: cotizador_pro   Context: cotizaciones
 *
 * Features:
 *   - Sticky header with inline project/client editing + collapsible sub-header
 *   - Space cards with animated sliding tab per variant
 *   - Inline item sheet with catalog autocomplete
 *   - Collapsible mano de obra strip with ±0.5 day counters
 *   - Collapsible space totals
 *   - Sticky footer: grand total, hidden discount/adjustment fields, export CTA
 *   - Full auto-save via POST /api/vault (debounced for headers, immediate for items)
 *
 * config.tarifa_jornada  — COP per workday (default 185 000)
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BlockProps, DataItem } from '@agnostic/core'
import {
  Briefcase, ChevronDown, ChevronUp, Eye, EyeOff,
  FileText, Loader2, Plus, Trash2, User, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ─── Domain types ─────────────────────────────────────────────────────────────

type CotData = {
  nombre_proyecto?: string
  cliente_id?: string
  direccion_obra?: string
  dias_entrega_estimados?: number
  garantia_anios?: number
  costos_operativos?: number
  imprevistos_instalacion?: number
  descuento_comercial?: number
  ajuste_arbitrario?: number
}

type VarianteData = {
  cotizacion_id?: string
  nombre_espacio?: string
  nombre_variante?: string
  jornadas_desarrollo_tecnico?: number
  jornadas_ensamblaje_taller?: number
  jornadas_instalacion_obra?: number
}

type ItemData = {
  variante_id?: string
  catalogo_id?: string
  unidad_medida?: string
  cantidad?: number
  precio_unitario?: number
  total_linea?: number
}

type CatItem = {
  descripcion?: string
  unidad_medida?: string
  precio_publico?: number
  sku?: string
}

// ─── Utilities ────────────────────────────────────────────────────────────────

const COP = (n: number | string | undefined) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(Number(n) || 0)

function useDebounce<T>(value: T, ms: number): T {
  const [d, setD] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setD(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return d
}

async function vWrite(ns: string, id: string | undefined, data: unknown) {
  return fetch('/api/vault', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'WRITE', namespace: ns, record: { id, data } }),
  }).then(r => r.json())
}

async function vRemove(ns: string, id: string) {
  return fetch('/api/vault', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'REMOVE', namespace: ns, id }),
  })
}

// ─── DayCounter ───────────────────────────────────────────────────────────────

function DayCounter({ label, value, onChange }: {
  label: string; value: number; onChange: (n: number) => void
}) {
  const v = Number(value) || 0
  return (
    <div className="flex flex-col items-center gap-1.5 min-w-[72px]">
      <span className="text-[9px] uppercase tracking-widest text-stone-400 text-center leading-tight">{label}</span>
      <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <button type="button"
          onClick={() => onChange(Math.max(0, parseFloat((v - 0.5).toFixed(1))))}
          className="w-7 h-8 flex items-center justify-center text-stone-300 hover:bg-stone-50 hover:text-amber-600 transition-colors">
          <ChevronDown size={12} />
        </button>
        <span className="w-10 text-center text-sm font-semibold tabular-nums text-stone-700">{v}</span>
        <button type="button"
          onClick={() => onChange(parseFloat((v + 0.5).toFixed(1)))}
          className="w-7 h-8 flex items-center justify-center text-stone-300 hover:bg-stone-50 hover:text-amber-600 transition-colors">
          <ChevronUp size={12} />
        </button>
      </div>
    </div>
  )
}

// ─── InlineMoneyInput ─────────────────────────────────────────────────────────

function MoneyInput({ label, value, onChange }: {
  label?: string; value: number | undefined; onChange: (n: number) => void
}) {
  const [str, setStr] = useState(value ? String(value) : '')
  useEffect(() => { setStr(value ? String(value) : '') }, [value])
  const commit = () => {
    const n = parseFloat(str.replace(/[^0-9.-]/g, '')) || 0
    onChange(n)
  }
  return (
    <div className="flex flex-col gap-1 min-w-[100px]">
      {label && <span className="text-[9px] uppercase tracking-widest text-stone-400">{label}</span>}
      <input type="text" value={str}
        onChange={e => setStr(e.target.value)} onBlur={commit}
        onKeyDown={e => e.key === 'Enter' && commit()}
        placeholder="0"
        className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-300 bg-white tabular-nums text-stone-700"
      />
    </div>
  )
}

// ─── EspacioTabs — animated sliding underline ─────────────────────────────────

function EspacioTabs({ variants, activeId, onSelect, onAdd }: {
  variants: DataItem[]; activeId: string
  onSelect: (id: string) => void; onAdd: () => void
}) {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [ind, setInd] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const el = tabRefs.current[activeId]
    if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth })
  }, [activeId, variants.length])

  return (
    <div className="relative flex items-center border-b border-stone-100">
      {variants.map(v => (
        <button key={v.id}
          ref={el => { tabRefs.current[v.id] = el }}
          onClick={() => onSelect(v.id)}
          className={cn(
            'px-4 py-2.5 text-sm transition-colors duration-200 whitespace-nowrap',
            v.id === activeId ? 'text-amber-700 font-semibold' : 'text-stone-400 hover:text-stone-600',
          )}
        >
          {(v.data as VarianteData).nombre_variante || 'Variante'}
        </button>
      ))}
      <button onClick={onAdd} title="Nueva variante"
        className="px-3 py-2.5 text-stone-300 hover:text-amber-500 transition-colors">
        <Plus size={13} />
      </button>
      <div
        className="absolute bottom-0 h-[2px] bg-amber-500 rounded-full transition-all duration-300 ease-out"
        style={{ left: ind.left, width: ind.width }}
      />
    </div>
  )
}

// ─── ItemRow ──────────────────────────────────────────────────────────────────

function ItemRow({ item, catalogo, onUpdate, onDelete }: {
  item: DataItem; catalogo: DataItem[]
  onUpdate: (p: Partial<ItemData>) => void; onDelete: () => void
}) {
  const d = item.data as ItemData
  const [catSearch, setCatSearch] = useState('')
  const [catOpen, setCatOpen] = useState(false)

  const catItem = catalogo.find(c => c.id === d.catalogo_id)
  const catData = catItem?.data as CatItem | undefined
  const displayName = catData?.descripcion || ''

  const filtered = catSearch
    ? catalogo.filter(c => (c.data as CatItem).descripcion?.toLowerCase().includes(catSearch.toLowerCase())).slice(0, 8)
    : []

  const pickCat = (c: DataItem) => {
    const cd = c.data as CatItem
    const qty = Number(d.cantidad) || 1
    const precio = Number(cd.precio_publico) || 0
    onUpdate({ catalogo_id: c.id, unidad_medida: cd.unidad_medida || '', precio_unitario: precio, total_linea: qty * precio })
    setCatSearch(''); setCatOpen(false)
  }

  return (
    <tr className="group/row border-b border-stone-50 hover:bg-amber-50/20 transition-colors">
      {/* Descripción */}
      <td className="py-2 pl-3 pr-2">
        <div className="relative">
          <input type="text"
            value={catOpen ? catSearch : displayName}
            onChange={e => { setCatSearch(e.target.value); setCatOpen(true) }}
            onFocus={() => { setCatSearch(''); setCatOpen(true) }}
            onBlur={() => setTimeout(() => setCatOpen(false), 180)}
            placeholder="Buscar en catálogo…"
            className="w-full text-xs text-stone-700 bg-transparent focus:outline-none py-0.5 min-w-[140px] placeholder:text-stone-300"
          />
          {catOpen && filtered.length > 0 && (
            <div className="absolute top-full left-0 z-50 w-72 bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden mt-1">
              {filtered.map(c => {
                const cd = c.data as CatItem
                return (
                  <button key={c.id} onMouseDown={() => pickCat(c)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-amber-50 flex items-center justify-between gap-2 transition-colors">
                    <span className="truncate text-stone-700">{cd.descripcion}</span>
                    <span className="text-stone-400 shrink-0 tabular-nums text-[10px]">{COP(cd.precio_publico)}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </td>
      {/* Unidad */}
      <td className="py-2 px-1 w-16 text-center">
        <input type="text" value={d.unidad_medida || ''}
          onChange={e => onUpdate({ unidad_medida: e.target.value })}
          className="w-full text-center text-xs text-stone-400 bg-transparent focus:outline-none"
          placeholder="und"
        />
      </td>
      {/* Cantidad */}
      <td className="py-2 px-1 w-14">
        <input type="number" value={d.cantidad ?? ''}
          onChange={e => {
            const q = parseFloat(e.target.value) || 0
            onUpdate({ cantidad: q, total_linea: q * (Number(d.precio_unitario) || 0) })
          }}
          className="w-full text-center text-xs font-medium text-stone-700 bg-transparent focus:outline-none tabular-nums"
          min={0} step={0.1}
        />
      </td>
      {/* Precio */}
      <td className="py-2 px-1 w-28">
        <input type="number" value={d.precio_unitario ?? ''}
          onChange={e => {
            const p = parseFloat(e.target.value) || 0
            onUpdate({ precio_unitario: p, total_linea: (Number(d.cantidad) || 1) * p })
          }}
          className="w-full text-right text-xs font-medium text-stone-700 bg-transparent focus:outline-none tabular-nums"
          min={0}
        />
      </td>
      {/* Total */}
      <td className="py-2 pl-1 pr-3 text-right w-28">
        <span className="text-xs font-semibold text-stone-700 tabular-nums">{COP(d.total_linea)}</span>
      </td>
      {/* Delete */}
      <td className="py-2 pr-1 w-7">
        <button onClick={onDelete}
          className="opacity-0 group-hover/row:opacity-100 text-stone-200 hover:text-red-400 transition-all">
          <X size={12} />
        </button>
      </td>
    </tr>
  )
}

// ─── Collapsible strip ────────────────────────────────────────────────────────

function CollapseStrip({ open, onToggle, label, icon: Icon, summary, children }: {
  open: boolean; onToggle: () => void
  label: string; icon: React.ElementType; summary?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="border-t border-stone-100">
      <button onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-2.5 text-xs hover:bg-stone-50/80 transition-colors">
        <div className="flex items-center gap-2 text-stone-400">
          <Icon size={12} className="text-amber-400" />
          <span className="uppercase tracking-widest font-semibold">{label}</span>
          {!open && summary}
        </div>
        {open ? <ChevronUp size={12} className="text-stone-300" /> : <ChevronDown size={12} className="text-stone-300" />}
      </button>
      <div className={cn('overflow-hidden transition-all duration-300', open ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0')}>
        {children}
      </div>
    </div>
  )
}

// ─── EspacioCard ──────────────────────────────────────────────────────────────

function EspacioCard({ nombre, variants, items, catalogo, tarifaJornada,
  onRename, onAddVariante, onUpdateVariante, onAddItem, onUpdateItem, onDeleteItem, onDelete,
}: {
  nombre: string; variants: DataItem[]; items: DataItem[]
  catalogo: DataItem[]; tarifaJornada: number
  onRename: (n: string) => void
  onAddVariante: () => void
  onUpdateVariante: (id: string, p: Partial<VarianteData>) => void
  onAddItem: (varId: string) => void
  onUpdateItem: (id: string, p: Partial<ItemData>) => void
  onDeleteItem: (id: string) => void
  onDelete: () => void
}) {
  const [activeVarId, setActiveVarId] = useState(variants[0]?.id ?? '')
  const [moOpen, setMoOpen] = useState(false)
  const [totOpen, setTotOpen] = useState(false)
  const [editName, setEditName] = useState(false)
  const [nameLocal, setNameLocal] = useState(nombre)

  // Keep active variant valid when list changes
  useEffect(() => {
    if (!variants.find(v => v.id === activeVarId) && variants.length) setActiveVarId(variants[0].id)
  }, [variants]) // eslint-disable-line

  const activeVar = variants.find(v => v.id === activeVarId)
  const vd = (activeVar?.data ?? {}) as VarianteData
  const activeItems = items.filter(it => (it.data as ItemData).variante_id === activeVarId)

  const totalMat = activeItems.reduce((s, it) => s + (Number((it.data as ItemData).total_linea) || 0), 0)
  const jorns = (Number(vd.jornadas_desarrollo_tecnico) || 0)
    + (Number(vd.jornadas_ensamblaje_taller) || 0)
    + (Number(vd.jornadas_instalacion_obra) || 0)
  const totalMO  = jorns * tarifaJornada
  const totalEsp = totalMat + totalMO

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-0">
        {editName ? (
          <input autoFocus value={nameLocal}
            onChange={e => setNameLocal(e.target.value)}
            onBlur={() => { onRename(nameLocal); setEditName(false) }}
            onKeyDown={e => { if (e.key === 'Enter') { onRename(nameLocal); setEditName(false) } }}
            className="flex-1 text-base font-semibold text-stone-800 bg-transparent border-b-2 border-amber-400 focus:outline-none pb-0.5"
          />
        ) : (
          <h3 onClick={() => setEditName(true)}
            className="flex-1 text-base font-semibold text-stone-800 cursor-text hover:text-amber-700 transition-colors select-none">
            {nombre}
          </h3>
        )}
        <span className="text-[10px] tabular-nums text-stone-300 font-medium">{COP(totalEsp)}</span>
        <button onClick={onDelete} title="Eliminar espacio"
          className="text-stone-200 hover:text-red-400 transition-colors p-1">
          <Trash2 size={13} />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-2">
        <EspacioTabs variants={variants} activeId={activeVarId} onSelect={setActiveVarId} onAdd={onAddVariante} />
      </div>

      {/* Item sheet */}
      <div className="px-2 py-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100">
              <th className="text-left pb-2 pl-3 text-[9px] font-bold uppercase tracking-widest text-stone-300">Descripción</th>
              <th className="pb-2 text-center text-[9px] font-bold uppercase tracking-widest text-stone-300 w-16">Und</th>
              <th className="pb-2 text-center text-[9px] font-bold uppercase tracking-widest text-stone-300 w-14">Cant</th>
              <th className="pb-2 text-right text-[9px] font-bold uppercase tracking-widest text-stone-300 w-28">P. Unit</th>
              <th className="pb-2 pr-3 text-right text-[9px] font-bold uppercase tracking-widest text-stone-300 w-28">Total</th>
              <th className="w-7" />
            </tr>
          </thead>
          <tbody>
            {activeItems.map(it => (
              <ItemRow key={it.id} item={it} catalogo={catalogo}
                onUpdate={p => onUpdateItem(it.id, p)}
                onDelete={() => onDeleteItem(it.id)}
              />
            ))}
          </tbody>
        </table>
        <button onClick={() => onAddItem(activeVarId)}
          className="mt-1 ml-3 flex items-center gap-1.5 text-xs text-stone-300 hover:text-amber-600 transition-colors py-1">
          <Plus size={11} /><span>Agregar ítem</span>
        </button>
      </div>

      {/* Mano de obra */}
      <CollapseStrip open={moOpen} onToggle={() => setMoOpen(o => !o)}
        label="Mano de obra" icon={Briefcase}
        summary={jorns > 0 && (
          <span className="ml-2 text-amber-600 font-medium tabular-nums">
            {jorns}j · {COP(totalMO)}
          </span>
        )}
      >
        <div className="px-5 pb-5 flex items-start gap-5 flex-wrap">
          <DayCounter label="Desarrollo" value={Number(vd.jornadas_desarrollo_tecnico) || 0}
            onChange={n => onUpdateVariante(activeVarId, { jornadas_desarrollo_tecnico: n })} />
          <DayCounter label="Ensamblaje" value={Number(vd.jornadas_ensamblaje_taller) || 0}
            onChange={n => onUpdateVariante(activeVarId, { jornadas_ensamblaje_taller: n })} />
          <DayCounter label="Instalación" value={Number(vd.jornadas_instalacion_obra) || 0}
            onChange={n => onUpdateVariante(activeVarId, { jornadas_instalacion_obra: n })} />
          <div className="ml-auto text-right flex flex-col justify-end gap-0.5">
            <span className="text-[9px] uppercase tracking-widest text-stone-300">Tarifa/jornada</span>
            <span className="text-xs font-semibold text-stone-500">{COP(tarifaJornada)}</span>
            <span className="text-sm font-bold text-amber-700 tabular-nums">{COP(totalMO)}</span>
          </div>
        </div>
      </CollapseStrip>

      {/* Totals */}
      <CollapseStrip open={totOpen} onToggle={() => setTotOpen(o => !o)}
        label="Subtotal" icon={({ size }: { size: number }) => (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
          </svg>
        )}
        summary={<span className="ml-2 text-stone-600 font-semibold tabular-nums">{COP(totalEsp)}</span>}
      >
        <div className="px-5 pb-5 grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Materiales', val: totalMat },
            { label: 'Mano de obra', val: totalMO },
            { label: 'Total espacio', val: totalEsp, highlight: true },
          ].map(({ label, val, highlight }) => (
            <div key={label}>
              <div className={cn('text-[9px] uppercase tracking-widest mb-1', highlight ? 'text-amber-500' : 'text-stone-400')}>{label}</div>
              <div className={cn('font-bold tabular-nums', highlight ? 'text-lg text-amber-700' : 'text-sm text-stone-700')}>{COP(val)}</div>
            </div>
          ))}
        </div>
      </CollapseStrip>
    </div>
  )
}

// ─── CotizadorPro ─────────────────────────────────────────────────────────────

export default function CotizadorPro({ block }: BlockProps) {
  const tarifaJornada = Number((block.config as any)?.tarifa_jornada) || 185_000

  // ── Data state ───────────────────────────────────────────────────
  const [cotizaciones, setCotizaciones] = useState<DataItem[]>([])
  const [clientes,     setClientes]     = useState<DataItem[]>([])
  const [catalogo,     setCatalogo]     = useState<DataItem[]>([])
  const [variantes,    setVariantes]    = useState<DataItem[]>([])
  const [items,        setItems]        = useState<DataItem[]>([])
  const [loading, setLoading] = useState(true)

  // ── Active quote ─────────────────────────────────────────────────
  const [activeCotId, setActiveCotId]   = useState<string | null>(null)
  const [headerLocal, setHeaderLocal]   = useState<CotData>({})
  const [subOpen,     setSubOpen]       = useState(false)
  const [secretOpen,  setSecretOpen]    = useState(false)

  const activeCot = cotizaciones.find(c => c.id === activeCotId)

  // ── Load ─────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [rc, rci, rcat, rv, ri] = await Promise.all([
        fetch('/api/vault?namespace=cotizaciones'),
        fetch('/api/vault?namespace=clientes'),
        fetch('/api/vault?namespace=productos_catalogo'),
        fetch('/api/vault?namespace=espacio_variantes'),
        fetch('/api/vault?namespace=items_variante'),
      ])
      const [jc, jci, jcat, jv, ji] = await Promise.all([rc.json(), rci.json(), rcat.json(), rv.json(), ri.json()])
      setCotizaciones(jc.records  ?? [])
      setClientes(    jci.records ?? [])
      setCatalogo(    jcat.records?? [])
      setVariantes(   jv.records  ?? [])
      setItems(       ji.records  ?? [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // Sync local header when switching quotes
  useEffect(() => {
    if (activeCot) setHeaderLocal(activeCot.data as CotData)
  }, [activeCotId]) // eslint-disable-line

  // ── Auto-save header (debounced 800ms) ───────────────────────────
  const dHeader = useDebounce(headerLocal, 800)
  const isDirty = !!activeCot && JSON.stringify(headerLocal) !== JSON.stringify(activeCot.data)

  useEffect(() => {
    if (!isDirty || !activeCotId) return
    vWrite('cotizaciones', activeCotId, dHeader).then(() =>
      setCotizaciones(prev => prev.map(c => c.id === activeCotId ? { ...c, data: dHeader } : c))
    )
  }, [dHeader]) // eslint-disable-line

  // ── Derived ──────────────────────────────────────────────────────
  const activeVariantes = useMemo(
    () => variantes.filter(v => (v.data as VarianteData).cotizacion_id === activeCotId),
    [variantes, activeCotId],
  )

  const espacios = useMemo(() => {
    const map = new Map<string, DataItem[]>()
    for (const v of activeVariantes) {
      const k = (v.data as VarianteData).nombre_espacio || 'Sin nombre'
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(v)
    }
    return Array.from(map.entries()).map(([nombre, vars]) => ({ nombre, vars }))
  }, [activeVariantes])

  // Grand totals — uses first (default) variant per space
  const gt = useMemo(() => {
    let mat = 0, mo = 0
    for (const { vars } of espacios) {
      const av = vars[0]; if (!av) continue
      const vItems = items.filter(it => (it.data as ItemData).variante_id === av.id)
      mat += vItems.reduce((s, it) => s + (Number((it.data as ItemData).total_linea) || 0), 0)
      const vd = av.data as VarianteData
      const j = (Number(vd.jornadas_desarrollo_tecnico) || 0)
        + (Number(vd.jornadas_ensamblaje_taller) || 0)
        + (Number(vd.jornadas_instalacion_obra) || 0)
      mo += j * tarifaJornada
    }
    const sub    = mat + mo
    const h      = headerLocal
    const costos = Number(h.costos_operativos)       || 0
    const impr   = Number(h.imprevistos_instalacion) || 0
    const desc   = Number(h.descuento_comercial)     || 0
    const ajuste = Number(h.ajuste_arbitrario)       || 0
    return { mat, mo, sub, costos, impr, desc, ajuste, total: sub + costos + impr - desc + ajuste }
  }, [espacios, items, headerLocal, tarifaJornada])

  // ── Handlers: espacios ───────────────────────────────────────────
  const addEspacio = async () => {
    if (!activeCotId) return
    const id = crypto.randomUUID()
    const data: VarianteData = { cotizacion_id: activeCotId, nombre_espacio: 'Nuevo Espacio', nombre_variante: 'Inicial', jornadas_desarrollo_tecnico: 0, jornadas_ensamblaje_taller: 0, jornadas_instalacion_obra: 0 }
    await vWrite('espacio_variantes', id, data)
    setVariantes(prev => [...prev, { id, context: 'espacio_variantes', data }])
  }

  const renameEspacio = async (oldName: string, newName: string) => {
    const toUp = activeVariantes.filter(v => (v.data as VarianteData).nombre_espacio === oldName)
    for (const v of toUp) {
      const nd = { ...(v.data as VarianteData), nombre_espacio: newName }
      await vWrite('espacio_variantes', v.id, nd)
      setVariantes(prev => prev.map(x => x.id === v.id ? { ...x, data: nd } : x))
    }
  }

  const deleteEspacio = async (nombre: string) => {
    const toDel = activeVariantes.filter(v => (v.data as VarianteData).nombre_espacio === nombre)
    for (const v of toDel) {
      const vItems = items.filter(it => (it.data as ItemData).variante_id === v.id)
      for (const it of vItems) { await vRemove('items_variante', it.id) }
      await vRemove('espacio_variantes', v.id)
    }
    const delIds = new Set(toDel.map(v => v.id))
    setVariantes(prev => prev.filter(v => !delIds.has(v.id)))
    setItems(prev => prev.filter(it => !delIds.has((it.data as ItemData).variante_id!)))
  }

  // ── Handlers: variantes ──────────────────────────────────────────
  const addVariante = async (nombreEspacio: string) => {
    if (!activeCotId) return
    const existing = activeVariantes.filter(v => (v.data as VarianteData).nombre_espacio === nombreEspacio)
    const id = crypto.randomUUID()
    const data: VarianteData = { cotizacion_id: activeCotId, nombre_espacio: nombreEspacio, nombre_variante: `Variante ${existing.length + 1}`, jornadas_desarrollo_tecnico: 0, jornadas_ensamblaje_taller: 0, jornadas_instalacion_obra: 0 }
    await vWrite('espacio_variantes', id, data)
    setVariantes(prev => [...prev, { id, context: 'espacio_variantes', data }])
  }

  const updateVariante = async (id: string, patch: Partial<VarianteData>) => {
    const v = variantes.find(x => x.id === id)
    if (!v) return
    const nd = { ...(v.data as VarianteData), ...patch }
    setVariantes(prev => prev.map(x => x.id === id ? { ...x, data: nd } : x))
    await vWrite('espacio_variantes', id, nd)
  }

  // ── Handlers: items ──────────────────────────────────────────────
  const addItem = async (varId: string) => {
    const id = crypto.randomUUID()
    const data: ItemData = { variante_id: varId, cantidad: 1, precio_unitario: 0, total_linea: 0, unidad_medida: '' }
    await vWrite('items_variante', id, data)
    setItems(prev => [...prev, { id, context: 'items_variante', data }])
  }

  const updateItem = async (id: string, patch: Partial<ItemData>) => {
    const it = items.find(x => x.id === id)
    if (!it) return
    const nd = { ...(it.data as ItemData), ...patch }
    setItems(prev => prev.map(x => x.id === id ? { ...x, data: nd } : x))
    await vWrite('items_variante', id, nd)
  }

  const deleteItem = async (id: string) => {
    await vRemove('items_variante', id)
    setItems(prev => prev.filter(x => x.id !== id))
  }

  // ── Handlers: new quote ──────────────────────────────────────────
  const newCot = async () => {
    const id = crypto.randomUUID()
    const data: CotData = { nombre_proyecto: 'Nuevo Proyecto' }
    await vWrite('cotizaciones', id, data)
    setCotizaciones(prev => [...prev, { id, context: 'cotizaciones', data }])
    setActiveCotId(id); setHeaderLocal(data)
  }

  // ──────────────────────────────────────────────────────────────────
  // RENDER — loading
  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-stone-400">
        <Loader2 size={28} className="animate-spin text-amber-500" />
        <span className="text-xs tracking-widest uppercase font-semibold">Cargando cotizador…</span>
      </div>
    </div>
  )

  // ──────────────────────────────────────────────────────────────────
  // RENDER — selector
  if (!activeCotId) {
    const sorted = [...cotizaciones].sort((a, b) =>
      (b as any).updated_at?.localeCompare?.((a as any).updated_at) ?? 0
    )
    return (
      <div className="min-h-screen bg-stone-50 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-stone-800 tracking-tight">Cotizaciones</h1>
              <p className="text-stone-400 text-sm mt-1">Selecciona o crea una nueva</p>
            </div>
            <button onClick={newCot}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 transition-colors shadow-sm">
              <Plus size={14} /> Nueva
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map(c => {
              const d = c.data as CotData
              const cli = clientes.find(cl => cl.id === d.cliente_id)?.data as any
              const spacesCount = variantes.filter(v => (v.data as VarianteData).cotizacion_id === c.id).length
              return (
                <button key={c.id} onClick={() => { setActiveCotId(c.id); setHeaderLocal(d) }}
                  className="text-left p-5 bg-white border border-stone-200 rounded-2xl hover:border-amber-300 hover:shadow-md transition-all group">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                      <FileText size={13} className="text-amber-500" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-300 group-hover:text-amber-400 transition-colors truncate">
                      {c.id.slice(0, 8)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-stone-800 group-hover:text-amber-700 transition-colors text-sm leading-tight mb-2 line-clamp-2">
                    {d.nombre_proyecto || <span className="italic text-stone-300">Sin nombre</span>}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-stone-300">
                    {cli ? (
                      <span className="flex items-center gap-1"><User size={9} /> {cli.nombre}</span>
                    ) : <span />}
                    {spacesCount > 0 && <span>{spacesCount} espacio{spacesCount !== 1 ? 's' : ''}</span>}
                  </div>
                </button>
              )
            })}
            {sorted.length === 0 && (
              <div className="col-span-3 text-center py-16 text-stone-300 text-sm">
                Sin cotizaciones. Crea la primera.
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ──────────────────────────────────────────────────────────────────
  // RENDER — cotizador
  const clienteData = clientes.find(c => c.id === headerLocal.cliente_id)?.data as any

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col pb-28">

      {/* ── Sticky header ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-stone-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          {/* Primary row */}
          <div className="flex items-center gap-3 py-3">
            <button onClick={() => setActiveCotId(null)}
              className="text-stone-300 hover:text-amber-600 transition-colors p-1 -ml-1 shrink-0">
              <ChevronDown size={18} className="rotate-90" />
            </button>
            <div className="flex-1 min-w-0">
              <input type="text"
                value={headerLocal.nombre_proyecto || ''}
                onChange={e => setHeaderLocal(p => ({ ...p, nombre_proyecto: e.target.value }))}
                placeholder="Nombre del Proyecto"
                className="w-full text-lg font-bold text-stone-800 bg-transparent focus:outline-none placeholder:text-stone-200 leading-tight truncate"
              />
              {clienteData && (
                <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
                  <User size={10} /> {clienteData.nombre}
                  {clienteData.telefono && <span className="opacity-60 ml-1">{clienteData.telefono}</span>}
                </p>
              )}
            </div>
            <button onClick={() => setSubOpen(o => !o)}
              className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-600 px-3 py-1.5 rounded-xl hover:bg-amber-50 transition-colors shrink-0">
              <span className="uppercase tracking-widest font-semibold hidden sm:block">Detalles</span>
              {subOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          {/* Sub-header (collapsible) */}
          <div className={cn('overflow-hidden transition-all duration-300', subOpen ? 'max-h-72 opacity-100 pb-4' : 'max-h-0 opacity-0')}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-stone-100">
              <div className="col-span-2 md:col-span-1 flex flex-col gap-1">
                <label className="text-[9px] uppercase tracking-widest text-stone-400">Cliente</label>
                <select value={headerLocal.cliente_id || ''}
                  onChange={e => setHeaderLocal(p => ({ ...p, cliente_id: e.target.value }))}
                  className="text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300 text-stone-700">
                  <option value="">— Sin cliente —</option>
                  {clientes.map(cl => (
                    <option key={cl.id} value={cl.id}>{(cl.data as any).nombre}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 md:col-span-1 flex flex-col gap-1">
                <label className="text-[9px] uppercase tracking-widest text-stone-400">Dirección de obra</label>
                <input type="text" value={headerLocal.direccion_obra || ''}
                  onChange={e => setHeaderLocal(p => ({ ...p, direccion_obra: e.target.value }))}
                  placeholder="Ciudad, barrio…"
                  className="text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300 text-stone-700"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase tracking-widest text-stone-400">Días entrega</label>
                <input type="number" value={headerLocal.dias_entrega_estimados ?? ''}
                  onChange={e => setHeaderLocal(p => ({ ...p, dias_entrega_estimados: Number(e.target.value) }))}
                  placeholder="0" min={0}
                  className="text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300 text-stone-700"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase tracking-widest text-stone-400">Garantía (años)</label>
                <input type="number" value={headerLocal.garantia_anios ?? ''}
                  onChange={e => setHeaderLocal(p => ({ ...p, garantia_anios: Number(e.target.value) }))}
                  placeholder="0" min={0}
                  className="text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300 text-stone-700"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Body: espacios ─────────────────────────────────────────── */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 space-y-4">
        {espacios.map(({ nombre, vars }) => (
          <EspacioCard key={nombre} nombre={nombre} variants={vars}
            items={items} catalogo={catalogo} tarifaJornada={tarifaJornada}
            onRename={nn => renameEspacio(nombre, nn)}
            onAddVariante={() => addVariante(nombre)}
            onUpdateVariante={updateVariante}
            onAddItem={addItem} onUpdateItem={updateItem} onDeleteItem={deleteItem}
            onDelete={() => deleteEspacio(nombre)}
          />
        ))}

        <button onClick={addEspacio}
          className="w-full py-5 border-2 border-dashed border-stone-200 rounded-2xl text-stone-400 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50/30 transition-all flex items-center justify-center gap-2 text-sm font-medium">
          <Plus size={16} /> Agregar espacio
        </button>
      </main>

      {/* ── Sticky footer ──────────────────────────────────────────── */}
      <footer className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-sm border-t border-stone-200 shadow-[0_-4px_24px_rgba(0,0,0,0.07)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-end gap-4 flex-wrap">

            {/* Resumen */}
            <div className="hidden sm:flex items-center gap-4 text-xs text-stone-400 flex-1 flex-wrap">
              <span>Mat <strong className="text-stone-600 tabular-nums">{COP(gt.mat)}</strong></span>
              <span>M.O. <strong className="text-stone-600 tabular-nums">{COP(gt.mo)}</strong></span>
              <span>Subtotal <strong className="text-stone-600 tabular-nums">{COP(gt.sub)}</strong></span>
              <span className="text-[10px] text-stone-300">{espacios.length} espacio{espacios.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Inputs */}
            <div className="flex items-end gap-3 flex-wrap">
              <MoneyInput label="Costos operativos" value={Number(headerLocal.costos_operativos) || undefined}
                onChange={v => setHeaderLocal(p => ({ ...p, costos_operativos: v }))} />
              <MoneyInput label="Imprevistos" value={Number(headerLocal.imprevistos_instalacion) || undefined}
                onChange={v => setHeaderLocal(p => ({ ...p, imprevistos_instalacion: v }))} />

              {/* Secret toggle */}
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-widest text-stone-300">Ajustes</span>
                <button onClick={() => setSecretOpen(o => !o)}
                  className={cn('w-9 h-[34px] border rounded-lg flex items-center justify-center transition-colors',
                    secretOpen ? 'border-amber-200 text-amber-500 bg-amber-50' : 'border-stone-200 text-stone-300 hover:text-amber-400')}>
                  {secretOpen ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </div>

              {secretOpen && <>
                <MoneyInput label="Descuento" value={Number(headerLocal.descuento_comercial) || undefined}
                  onChange={v => setHeaderLocal(p => ({ ...p, descuento_comercial: v }))} />
                <MoneyInput label="Ajuste" value={Number(headerLocal.ajuste_arbitrario) || undefined}
                  onChange={v => setHeaderLocal(p => ({ ...p, ajuste_arbitrario: v }))} />
              </>}
            </div>

            {/* Total + CTA */}
            <div className="flex items-center gap-4 ml-auto shrink-0">
              <div className="text-right">
                <div className="text-[9px] uppercase tracking-widest text-stone-400">Total cotización</div>
                <div className="text-2xl font-bold text-amber-700 tabular-nums tracking-tight leading-none mt-0.5">
                  {COP(gt.total)}
                </div>
              </div>
              <button
                onClick={() => toast.info('PDF en construcción — próxima versión')}
                className="flex items-center gap-2 px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm whitespace-nowrap">
                <FileText size={14} /> Generar cotización
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
