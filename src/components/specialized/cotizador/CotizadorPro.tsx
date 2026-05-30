'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type { BlockProps, DataItem } from '@agnostic/core'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Loader2, User, ChevronDown, ChevronUp, FileText, Plus, Eye, EyeOff } from 'lucide-react'

import { EspacioCard } from './EspacioCard'
import { MoneyInput } from './MoneyInput'
import { COP, useDebounce, vWrite, vRemove } from './utils'
import type {
  Cotizaciones,
  EspacioVariantes,
  ItemsVariante,
  ProductosCatalogo,
} from '@/generated/agnostic-schemas'

export default function CotizadorPro({ block = {} }: BlockProps) {
  // ── Data state ───────────────────────────────────────────────────
  const [cotizaciones, setCotizaciones] = useState<DataItem[]>([])
  const [clientes,     setClientes]     = useState<DataItem[]>([])
  const [catalogo,     setCatalogo]     = useState<DataItem[]>([])
  const [variantes,    setVariantes]    = useState<DataItem[]>([])
  const [items,        setItems]        = useState<DataItem[]>([])
  const [loading, setLoading] = useState(true)

  // ── Active quote ─────────────────────────────────────────────────
  const [activeCotId, setActiveCotId]   = useState<string | null>(null)
  const [headerLocal, setHeaderLocal]   = useState<Cotizaciones>({ nombre_proyecto: '' })
  const [subOpen,     setSubOpen]       = useState(false)
  const [secretOpen,  setSecretOpen]    = useState(false)
  const [activeVarMap, setActiveVarMap] = useState<Record<string, string>>({})
  const [isExporting, setIsExporting]   = useState(false)

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
    if (activeCot) setHeaderLocal(activeCot.data as any as Cotizaciones)
  }, [activeCotId]) // eslint-disable-line

  // ── Auto-save header (debounced 800ms) ───────────────────────────
  const dHeader = useDebounce(headerLocal, 800)
  const isDirty = !!activeCot && JSON.stringify(headerLocal) !== JSON.stringify(activeCot.data)

  useEffect(() => {
    if (!isDirty || !activeCotId) return
    vWrite('cotizaciones', activeCotId, dHeader).then(() =>
      setCotizaciones(prev => prev.map(c => c.id === activeCotId ? { ...c, data: dHeader as any } : c))
    )
  }, [dHeader]) // eslint-disable-line

  // ── Derived ──────────────────────────────────────────────────────
  const activeVariantes = useMemo(
    () => variantes.filter(v => (v.data as any as EspacioVariantes).cotizacion_id === activeCotId),
    [variantes, activeCotId],
  )

  const espacios = useMemo(() => {
    const map = new Map<string, DataItem[]>()
    for (const v of activeVariantes) {
      const k = (v.data as any as EspacioVariantes).nombre_espacio || 'Sin nombre'
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(v)
    }
    return Array.from(map.entries()).map(([nombre, vars]) => ({ nombre, vars }))
  }, [activeVariantes])

  // Sync activeVarMap from database when variants load or activeCotId changes
  useEffect(() => {
    if (!activeCotId || !variantes.length) return
    const map: Record<string, string> = {}
    for (const v of activeVariantes) {
      const vd = v.data as any as EspacioVariantes
      const k = vd.nombre_espacio || 'Sin nombre'
      if (vd.activa || !map[k]) {
        map[k] = v.id
      }
    }
    setActiveVarMap(map)
  }, [activeCotId, variantes.length]) // eslint-disable-line

  // ── Dynamic labor rates resolution from catalog SKUs ─────────────
  const tarifas = useMemo(() => {
    const find = (sku: string) => {
      const p = catalogo.find(c => (c.data as any as ProductosCatalogo).sku === sku)
      return Number((p?.data as any as ProductosCatalogo)?.precio_publico || (p?.data as any as ProductosCatalogo)?.precio_directo) || 185_000
    }
    return {
      dev:      find('SERV-DEV'),
      assembly: find('SERV-ASSEMBLY'),
      install:  find('SERV-INSTALL'),
    }
  }, [catalogo])

  // Grand totals — uses active/selected variant per space
  const gt = useMemo(() => {
    let mat = 0, mo = 0
    for (const { nombre, vars } of espacios) {
      const activeId = activeVarMap[nombre] || vars[0]?.id
      const av = vars.find(v => v.id === activeId) || vars[0]; if (!av) continue
      const vItems = items.filter(it => (it.data as any as ItemsVariante).variante_id === av.id)
      mat += vItems.reduce((s, it) => s + (Number((it.data as any as ItemsVariante).total_linea) || 0), 0)
      const vd = av.data as any as EspacioVariantes
      mo += (Number(vd.jornadas_desarrollo_tecnico) || 0) * tarifas.dev
          + (Number(vd.jornadas_ensamblaje_taller)  || 0) * tarifas.assembly
          + (Number(vd.jornadas_instalacion_obra)   || 0) * tarifas.install
    }
    const sub    = mat + mo
    const h      = headerLocal
    const costos = Number(h.costos_operativos)       || 0
    const impr   = Number(h.imprevistos_instalacion) || 0
    const desc   = Number(h.descuento_comercial)     || 0
    const ajuste = Number(h.ajuste_arbitrario)       || 0
    return { mat, mo, sub, costos, impr, desc, ajuste, total: sub + costos + impr - desc + ajuste }
  }, [espacios, items, headerLocal, tarifas, activeVarMap])

  // ── Handlers: espacios ───────────────────────────────────────────
  const addEspacio = async () => {
    if (!activeCotId) return
    const id = crypto.randomUUID()
    const data: EspacioVariantes = { cotizacion_id: activeCotId, nombre_espacio: 'Nuevo Espacio', nombre_variante: 'Inicial', jornadas_desarrollo_tecnico: 0, jornadas_ensamblaje_taller: 0, jornadas_instalacion_obra: 0 }
    await vWrite('espacio_variantes', id, data)
    setVariantes(prev => [...prev, { id, context: 'espacio_variantes', data: data as any }])
  }

  const renameEspacio = async (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) return

    // 1. Instant optimistic local React state update
    setVariantes(prev => prev.map(x => {
      const vd = x.data as any as EspacioVariantes
      if (vd.cotizacion_id === activeCotId && vd.nombre_espacio === oldName) {
        return { ...x, data: { ...vd, nombre_espacio: newName } as any }
      }
      return x
    }))

    // Also update activeVarMap name reference instantly
    setActiveVarMap(prev => {
      const next = { ...prev }
      if (next[oldName]) {
        next[newName] = next[oldName]
        delete next[oldName]
      }
      return next
    })

    // 2. Perform background database persistence
    const toUp = activeVariantes.filter(v => (v.data as any as EspacioVariantes).nombre_espacio === oldName)
    for (const v of toUp) {
      const nd = { ...(v.data as any as EspacioVariantes), nombre_espacio: newName }
      await vWrite('espacio_variantes', v.id, nd)
    }
  }

  const deleteEspacio = async (nombre: string) => {
    const toDel = activeVariantes.filter(v => (v.data as any as EspacioVariantes).nombre_espacio === nombre)
    for (const v of toDel) {
      const vItems = items.filter(it => (it.data as any as ItemsVariante).variante_id === v.id)
      for (const it of vItems) { await vRemove('items_variante', it.id) }
      await vRemove('espacio_variantes', v.id)
    }
    const delIds = new Set(toDel.map(v => v.id))
    setVariantes(prev => prev.filter(v => !delIds.has(v.id)))
    setItems(prev => prev.filter(it => !delIds.has((it.data as any as ItemsVariante).variante_id!)))
  }

  const duplicateEspacio = async (nombreEspacio: string) => {
    if (!activeCotId) return
    const spaceVariants = activeVariantes.filter(v => (v.data as any as EspacioVariantes).nombre_espacio === nombreEspacio)
    if (spaceVariants.length === 0) return

    const newSpaceName = `${nombreEspacio} (Copia)`
    const newVariants: DataItem[] = []
    const newItems: DataItem[] = []

    for (const v of spaceVariants) {
      const vd = v.data as any as EspacioVariantes
      const newVarId = crypto.randomUUID()
      const newVarData: EspacioVariantes = {
        ...vd,
        nombre_espacio: newSpaceName,
      }
      await vWrite('espacio_variantes', newVarId, newVarData)
      newVariants.push({ id: newVarId, context: 'espacio_variantes', data: newVarData as any })

      if (vd.activa) {
        setActiveVarMap(prev => ({ ...prev, [newSpaceName]: newVarId }))
      }

      // Clone items for this variant
      const varItems = items.filter(it => (it.data as any as ItemsVariante).variante_id === v.id)
      for (const it of varItems) {
        const newItemId = crypto.randomUUID()
        const newItemData: ItemsVariante = {
          ...(it.data as any as ItemsVariante),
          variante_id: newVarId,
        }
        await vWrite('items_variante', newItemId, newItemData)
        newItems.push({ id: newItemId, context: 'items_variante', data: newItemData as any })
      }
    }

    setVariantes(prev => [...prev, ...newVariants])
    setItems(prev => [...prev, ...newItems])
    toast.success('Espacio duplicado con éxito')
  }

  // ── Handlers: variantes ──────────────────────────────────────────
  const selectActiveVar = async (nombreEspacio: string, variantId: string) => {
    setActiveVarMap(prev => ({ ...prev, [nombreEspacio]: variantId }))
    const varsInSpace = activeVariantes.filter(v => (v.data as any as EspacioVariantes).nombre_espacio === nombreEspacio)
    await Promise.all(varsInSpace.map(async (v) => {
      const isSelected = v.id === variantId
      const vd = v.data as any as EspacioVariantes
      if (!!vd.activa !== isSelected) {
        const nd = { ...vd, activa: isSelected }
        await vWrite('espacio_variantes', v.id, nd)
        setVariantes(prev => prev.map(x => x.id === v.id ? { ...x, data: nd as any } : x))
      }
    }))
  }

  const addVariante = async (nombreEspacio: string) => {
    if (!activeCotId) return
    const existing = activeVariantes.filter(v => (v.data as any as EspacioVariantes).nombre_espacio === nombreEspacio)
    const id = crypto.randomUUID()
    const data: EspacioVariantes = {
      cotizacion_id: activeCotId,
      nombre_espacio: nombreEspacio,
      nombre_variante: `Variante ${existing.length + 1}`,
      jornadas_desarrollo_tecnico: 0,
      jornadas_ensamblaje_taller: 0,
      jornadas_instalacion_obra: 0,
      activa: true
    }

    // Deactivate other variants
    await Promise.all(existing.map(async (v) => {
      const vd = v.data as any as EspacioVariantes
      if (vd.activa) {
        const nd = { ...vd, activa: false }
        await vWrite('espacio_variantes', v.id, nd)
      }
    }))

    await vWrite('espacio_variantes', id, data)

    setVariantes(prev => {
      const deactivated = prev.map(x => 
        (x.data as any as EspacioVariantes).nombre_espacio === nombreEspacio 
          ? { ...x, data: { ...(x.data as any as EspacioVariantes), activa: false } as any }
          : x
      )
      return [...deactivated, { id, context: 'espacio_variantes', data: data as any }]
    })
    setActiveVarMap(prev => ({ ...prev, [nombreEspacio]: id }))
  }

  const updateVariante = async (id: string, patch: Partial<EspacioVariantes>) => {
    const v = variantes.find(x => x.id === id)
    if (!v) return
    const nd = { ...(v.data as any as EspacioVariantes), ...patch }
    setVariantes(prev => prev.map(x => x.id === id ? { ...x, data: nd as any } : x))
    await vWrite('espacio_variantes', id, nd)
  }

  const duplicateVariante = async (varId: string) => {
    const v = variantes.find(x => x.id === varId)
    if (!v) return
    const vd = v.data as any as EspacioVariantes
    const nombreEspacio = vd.nombre_espacio || 'Sin nombre'

    const id = crypto.randomUUID()
    const name = `${vd.nombre_variante || 'Variante'} (Copia)`
    const data: EspacioVariantes = {
      ...vd,
      nombre_variante: name,
      activa: true
    }

    // Deactivate other variants in the same space
    const siblings = activeVariantes.filter(v => (v.data as any as EspacioVariantes).nombre_espacio === nombreEspacio)
    await Promise.all(siblings.map(async (sibling) => {
      const sd = sibling.data as any as EspacioVariantes
      if (sd.activa) {
        const nd = { ...sd, activa: false }
        await vWrite('espacio_variantes', sibling.id, nd)
      }
    }))
    
    await vWrite('espacio_variantes', id, data)

    // Clone items
    const varItems = items.filter(it => (it.data as any as ItemsVariante).variante_id === varId)
    const clonedItems: DataItem[] = []
    
    for (const it of varItems) {
      const itemId = crypto.randomUUID()
      const itemData: ItemsVariante = {
        ...(it.data as any as ItemsVariante),
        variante_id: id,
      }
      await vWrite('items_variante', itemId, itemData)
      clonedItems.push({ id: itemId, context: 'items_variante', data: itemData as any })
    }

    setVariantes(prev => {
      const deactivated = prev.map(x => 
        (x.data as any as EspacioVariantes).nombre_espacio === nombreEspacio 
          ? { ...x, data: { ...(x.data as any as EspacioVariantes), activa: false } as any }
          : x
      )
      return [...deactivated, { id, context: 'espacio_variantes', data: data as any }]
    })
    setItems(prev => [...prev, ...clonedItems])
    setActiveVarMap(prev => ({ ...prev, [nombreEspacio]: id }))
    toast.success('Variante duplicada con éxito')
  }

  const deleteVariante = async (id: string) => {
    const v = variantes.find(x => x.id === id)
    if (!v) return
    const vd = v.data as any as EspacioVariantes
    const nombreEspacio = vd.nombre_espacio || 'Sin nombre'

    const siblings = variantes.filter(s => (s.data as any as EspacioVariantes).nombre_espacio === nombreEspacio)
    if (siblings.length <= 1) {
      toast.error('No se puede eliminar la última variante.', {
        description: 'Un espacio debe tener al menos una variante. Puede eliminar el espacio completo.'
      })
      return
    }

    const wasActive = activeVarMap[nombreEspacio] === id || vd.activa
    const remaining = siblings.filter(x => x.id !== id)
    const nextActive = remaining[0]

    const vItems = items.filter(it => (it.data as any as ItemsVariante).variante_id === id)
    for (const it of vItems) {
      await vRemove('items_variante', it.id)
    }
    await vRemove('espacio_variantes', id)

    if (wasActive && nextActive) {
      const nd = { ...(nextActive.data as any as EspacioVariantes), activa: true }
      await vWrite('espacio_variantes', nextActive.id, nd)
      
      setVariantes(prev => prev
        .filter(x => x.id !== id)
        .map(x => x.id === nextActive.id ? { ...x, data: nd as any } : x)
      )
      setActiveVarMap(prev => ({ ...prev, [nombreEspacio]: nextActive.id }))
    } else {
      setVariantes(prev => prev.filter(x => x.id !== id))
    }

    setItems(prev => prev.filter(it => (it.data as any as ItemsVariante).variante_id !== id))
    toast.success('Variante deleted successfully')
  }

  // ── Handlers: items ──────────────────────────────────────────────
  const addItem = async (varId: string) => {
    const id = crypto.randomUUID()
    const data: ItemsVariante = { variante_id: varId, catalogo_id: '', cantidad: 1, precio_unitario: 0, total_linea: 0, unidad_medida: '' }
    await vWrite('items_variante', id, data)
    setItems(prev => [...prev, { id, context: 'items_variante', data: data as any }])
  }

  const updateItem = async (id: string, patch: Partial<ItemsVariante>) => {
    const it = items.find(x => x.id === id)
    if (!it) return
    const nd = { ...(it.data as any as ItemsVariante), ...patch }
    setItems(prev => prev.map(x => x.id === id ? { ...x, data: nd as any } : x))
    await vWrite('items_variante', id, nd)
  }

  const deleteItem = async (id: string) => {
    await vRemove('items_variante', id)
    setItems(prev => prev.filter(x => x.id !== id))
  }

  // ── Handlers: new quote ──────────────────────────────────────────
  const newCot = async () => {
    const id = crypto.randomUUID()
    const data: Cotizaciones = { nombre_proyecto: 'Nuevo Proyecto' }
    await vWrite('cotizaciones', id, data)
    setCotizaciones(prev => [...prev, { id, context: 'cotizaciones', data: data as any }])
    setActiveCotId(id); setHeaderLocal(data)
  }

  const handleExportPdf = async () => {
    if (!activeCotId || isExporting) return
    setIsExporting(true)
    const toastId = toast.loading('Generando propuesta comercial premium en PDF...')
    try {
      const response = await fetch('/api/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zap: 'exportar_propuesta_pdf',
          payload: {
            record: { id: activeCotId },
            context: 'cotizaciones'
          }
        })
      })
      const result = await response.json()
      toast.dismiss(toastId)
      if (!result.success) {
        throw new Error(result.error || 'No se pudo generar la propuesta.')
      }

      if (Array.isArray(result.events)) {
        for (const event of result.events) {
          if (event.action === 'notify') {
            if (event.type === 'success') toast.success(event.message)
            else toast.error(event.message)
          } else if (event.action === 'print_pdf') {
            const htmlContent = event.payload?.html || ''
            const iframe = document.createElement('iframe')
            iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;'
            document.body.appendChild(iframe)
            iframe.contentDocument!.open()
            iframe.contentDocument!.write(htmlContent)
            iframe.contentDocument!.close()
            iframe.contentWindow!.focus()
            setTimeout(() => {
              iframe.contentWindow!.print()
              setTimeout(() => document.body.removeChild(iframe), 2000)
            }, 500)
          }
        }
      }
    } catch (e: any) {
      toast.dismiss(toastId)
      toast.error(`Error al exportar: ${e.message}`)
    } finally {
      setIsExporting(false)
    }
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
              const d = c.data as any as Cotizaciones
              const cli = clientes.find(cl => cl.id === d.cliente_id)?.data as any
              const spacesCount = variantes.filter(v => (v.data as any as EspacioVariantes).cotizacion_id === c.id).length
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
    <div className="min-h-screen bg-stone-50 flex flex-col pb-36">

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
        {espacios.map(({ nombre, vars }) => {
          const activeVarId = activeVarMap[nombre] || vars[0]?.id || ''
          return (
            <EspacioCard key={nombre} nombre={nombre} variants={vars}
              activeVarId={activeVarId} onSelectVarId={vid => selectActiveVar(nombre, vid)}
              items={items} catalogo={catalogo} tarifas={tarifas}
              onRename={nn => renameEspacio(nombre, nn)}
              onAddVariante={() => addVariante(nombre)}
              onUpdateVariante={updateVariante}
              onDuplicateVariante={duplicateVariante}
              onDeleteVariante={deleteVariante}
              onAddItem={addItem} onUpdateItem={updateItem} onDeleteItem={deleteItem}
              onDelete={() => deleteEspacio(nombre)}
              onDuplicate={() => duplicateEspacio(nombre)}
            />
          )
        })}

        <button onClick={addEspacio}
          className="w-full py-5 border-2 border-dashed border-stone-200 rounded-2xl text-stone-400 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50/30 transition-all flex items-center justify-center gap-2 text-sm font-medium">
          <Plus size={16} /> Agregar espacio
        </button>
      </main>

      {/* ── Sticky footer ──────────────────────────────────────────── */}
      <footer className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-sm border-t border-stone-200 shadow-[0_-4px_24px_rgba(0,0,0,0.07)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2">
          <div className="flex items-center gap-4 flex-wrap">

            {/* Resumen */}
            <div className="hidden sm:flex items-center gap-4 text-xs text-stone-400 flex-1 flex-wrap">
              <span>Mat <strong className="text-stone-600 tabular-nums">{COP(gt.mat)}</strong></span>
              <span>M.O. <strong className="text-stone-600 tabular-nums">{COP(gt.mo)}</strong></span>
              <span>Subtotal <strong className="text-stone-600 tabular-nums">{COP(gt.sub)}</strong></span>
              <span className="text-[10px] text-stone-300">{espacios.length} espacio{espacios.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Inputs */}
            <div className="flex items-center gap-3 flex-wrap">
              <MoneyInput label="Costos operativos" value={Number(headerLocal.costos_operativos) || undefined}
                onChange={v => setHeaderLocal(p => ({ ...p, costos_operativos: v }))} />
              <MoneyInput label="Imprevistos" value={Number(headerLocal.imprevistos_instalacion) || undefined}
                onChange={v => setHeaderLocal(p => ({ ...p, imprevistos_instalacion: v }))} />

              {/* Secret toggle */}
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-widest text-stone-300">Ajustes</span>
                <button onClick={() => setSecretOpen(o => !o)}
                  className={cn('w-9 h-[28px] border rounded-lg flex items-center justify-center transition-colors',
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
                onClick={handleExportPdf}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                {isExporting ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                Generar cotización
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
