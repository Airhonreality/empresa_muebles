'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type { BlockProps, DataItem } from '@agnostic/core'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Loader2, User, ChevronDown, ChevronUp, FileText, Plus, Eye, EyeOff, Trash2, Edit3, X, Copy, Play } from 'lucide-react'

import { EspacioCard } from './EspacioCard'
import { MoneyInput } from './MoneyInput'
import { HybridClientSelector } from './HybridClientSelector'
import { ApoyoTecnicoPanel } from './ApoyoTecnicoPanel'
import { ContratoModal } from './ContratoModal'
import { ContratoEmailModal } from './ContratoEmailModal'
import ProductionTransitionDialog from '../kanban/ProductionTransitionDialog'
import { COP, vWrite, vRemove } from './utils'
import { useAutoSave } from '@/hooks/useAutoSave'
import { processEvents } from '@/lib/agnostic/eventProcessor'
import { useMateriaStore } from '@/lib/agnostic/store'
import type {
  Proyectos as ProyectoData,
  EspacioVariantes,
  ItemsVariante,
  ProductosCatalogo,
} from '@/generated/agnostic-schemas'

interface CotizadorProProps extends Partial<BlockProps> {
  forcedProyectoId?: string
}

export default function CotizadorPro({ block = {}, forcedProyectoId, activeRecord }: CotizadorProProps) {
  // ── Data state ───────────────────────────────────────────────────
  const [proyectosList, setProyectos] = useState<DataItem[]>([])
  const [clientes,     setClientes]     = useState<DataItem[]>([])
  const [contratos,    setContratos]    = useState<DataItem[]>([])
  const [catalogo,     setCatalogo]     = useState<DataItem[]>([])
  const [variantes,    setVariantes]    = useState<DataItem[]>([])
  const [items,        setItems]        = useState<DataItem[]>([])
  const [loading, setLoading] = useState(true)

  // ── Active quote ─────────────────────────────────────────────────
  // forcedProyectoId > URL :id (activeRecord) > internal selection
  const [activeCotId, setActiveCotId]   = useState<string | null>(
    forcedProyectoId || activeRecord?.id || null
  )
  const [headerLocal, setHeaderLocal]   = useState<ProyectoData>({ nombre_proyecto: '', estado: 'activa' })
  const [subOpen,     setSubOpen]       = useState(false)
  const [secretOpen,  setSecretOpen]    = useState(false)
  const [activeVarMap, setActiveVarMap] = useState<Record<string, string>>({})
  const [isExporting, setIsExporting]   = useState(false)
  const [isContratoOpen, setIsContratoOpen] = useState(false)
  const [isEmailOpen, setIsEmailOpen] = useState(false)
  const [isProductionOpen, setIsProductionOpen] = useState(false)
  const [isProducing, setIsProducing] = useState(false)
  const [generatedContratoId, setGeneratedContratoId] = useState<string | null>(null)
  const [emailModalData, setEmailModalData] = useState<{ email: string; subject: string; body: string } | null>(null)
  const [catalogModal, setCatalogModal] = useState<{
    isOpen: boolean
    mode: 'create' | 'edit'
    id?: string
    data: Partial<ProductosCatalogo>
  }>({
    isOpen: false,
    mode: 'create',
    data: {}
  })

  const activeCot = proyectosList.find(c => c.id === activeCotId)
  const activeContrato = useMemo(() => {
    if (!activeCotId) return null
    return contratos.find(c => (c.data as any)?.proyecto_id === activeCotId) ?? null
  }, [contratos, activeCotId])

  const clienteData = useMemo(() => {
    if (!headerLocal?.cliente_id) return null
    const cl = clientes.find(c => c.id === headerLocal.cliente_id)
    return cl ? { id: cl.id, ...((cl.data || {}) as any) } : null
  }, [clientes, headerLocal?.cliente_id])

  const missingServiceSkus = useMemo(() => {
    const required = ['SERV-DEV', 'SERV-ASSEMBLY', 'SERV-INSTALL']
    return required.filter(sku => !catalogo.some(c => (c.data as any as ProductosCatalogo).sku === sku))
  }, [catalogo])

  // ── Load ─────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [rc, rci, rco, rcat, rv, ri] = await Promise.all([
        fetch('/api/vault?namespace=proyectos'),
        fetch('/api/vault?namespace=clientes'),
        fetch('/api/vault?namespace=contratos'),
        fetch('/api/vault?namespace=productos_catalogo'),
        fetch('/api/vault?namespace=espacio_variantes'),
        fetch('/api/vault?namespace=items_variante'),
      ])
      const [jc, jci, jco, jcat, jv, ji] = await Promise.all([rc.json(), rci.json(), rco.json(), rcat.json(), rv.json(), ri.json()])
      setProyectos(jc.records  ?? [])
      setClientes(    jci.records ?? [])
      setContratos(   jco.records ?? [])
      setCatalogo(    jcat.records?? [])
      setVariantes(   jv.records  ?? [])
      setItems(       ji.records  ?? [])
    } finally { setLoading(false) }
  }, [])

  async function zapCall(zap: string, payload: Record<string, unknown>) {
    const res = await fetch('/api/engine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zap, payload }),
    })
    if (!res.ok) throw new Error(await res.text())
    const { events = [] } = await res.json()
    await processEvents(events, useMateriaStore.getState().updateItem)
  }

  useEffect(() => { loadAll() }, [loadAll])

  // Sync local header when switching quotes or when database updates activeCot
  useEffect(() => {
    if (activeCot) setHeaderLocal(activeCot.data as any as ProyectoData)
  }, [activeCotId, activeCot])

  // Sync when engine provides a new activeRecord via URL :id navigation
  useEffect(() => {
    if (activeRecord?.id && !forcedProyectoId && activeRecord.id !== activeCotId) {
      setActiveCotId(activeRecord.id)
    }
  }, [activeRecord?.id]) // eslint-disable-line

  // ── Auto-save header using useAutoSave hook ───────────────────────────
  const isDirty = !!activeCot && JSON.stringify(headerLocal) !== JSON.stringify(activeCot.data)

  useAutoSave({
    key: activeCotId || '',
    // Bundle the active ID with the headerLocal data to ensure atomic saves
    data: { id: activeCotId || '', header: headerLocal },
    delay: 800,
    onSave: async (bundle) => {
      if (!bundle.id) return
      await vWrite('proyectos', bundle.id, bundle.header)
      setProyectos(prev => prev.map(c => c.id === bundle.id ? { ...c, data: bundle.header as any } : c))
    }
  })

  // ── Derived ──────────────────────────────────────────────────────
  const activeVariantes = useMemo(
    () => {
      const filtered = variantes.filter(v => (v.data as any as EspacioVariantes).proyecto_id === activeCotId)
      return [...filtered].sort((a, b) => {
        const oa = Number((a.data as any).orden) || 0
        const ob = Number((b.data as any).orden) || 0
        if (oa !== ob) return oa - ob
        return a.id.localeCompare(b.id)
      })
    },
    [variantes, activeCotId],
  )

  const espacios = useMemo(() => {
    const map = new Map<string, DataItem[]>()
    for (const v of activeVariantes) {
      const k = (v.data as any as EspacioVariantes).nombre_espacio || 'Sin nombre'
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(v)
    }
    return Array.from(map.entries()).map(([nombre, vars]) => ({ nombre, vars })).sort((a, b) => {
      const oa = (a.vars[0].data as any).orden_espacio !== undefined ? Number((a.vars[0].data as any).orden_espacio) : 0
      const ob = (b.vars[0].data as any).orden_espacio !== undefined ? Number((b.vars[0].data as any).orden_espacio) : 0
      if (oa !== ob) return oa - ob
      const cta = (a.vars[0].data as any).created_at || ''
      const ctb = (b.vars[0].data as any).created_at || ''
      if (cta !== ctb) return cta.localeCompare(ctb)
      return a.vars[0].id.localeCompare(b.vars[0].id)
    })
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

  // Catalog of all unique colors extracted from database variants
  const allExistingColors = useMemo(() => {
    const map = new Map<string, string>()
    variantes.forEach(v => {
      const colorsStr = (v.data as any).colores
      if (colorsStr) {
        try {
          const parsed = JSON.parse(colorsStr)
          if (Array.isArray(parsed)) {
            parsed.forEach(col => {
              if (col.nombre && col.imagen_url) {
                map.set(col.nombre.trim(), col.imagen_url)
              }
            })
          }
        } catch (e) {}
      }
    })
    return Array.from(map.entries()).map(([nombre, imagen_url]) => ({ nombre, imagen_url }))
  }, [variantes])

  const tiposOptions = useMemo(() => {
    const base = [
      'Tableros / Maderas',
      'Herrajes / Accesorios',
      'Modulos prefabricados',
      'Piedras / Mesones',
      'Electrodomesticos / Gasodomesticos',
      'Servicio'
    ]
    const set = new Set(base)
    catalogo.forEach(c => {
      const val = (c.data as any).tipo
      if (val && typeof val === 'string' && val.trim() && !val.includes('-') && val !== 'servicio') {
        set.add(val.trim())
      }
    })
    return Array.from(set)
  }, [catalogo])

  const unidadesOptions = useMemo(() => {
    const base = [
      'unidad',
      'metro lineal',
      'metro cuadrado',
      'tablero',
      'juego',
      'juegos',
      'cm',
      'Kg',
      'Galon',
      'm2',
      'Tablón',
      'Perfil',
      'día',
      'jornada',
      'servicio'
    ]
    const set = new Set(base)
    catalogo.forEach(c => {
      const val = (c.data as any).unidad_medida
      if (val && typeof val === 'string' && val.trim()) {
        set.add(val.trim())
      }
    })
    return Array.from(set)
  }, [catalogo])

  const proveedoresOptions = useMemo(() => {
    const base = [
      'Dalver Fonseca'
    ]
    const set = new Set(base)
    catalogo.forEach(c => {
      const val = (c.data as any).proveedor
      if (val && typeof val === 'string' && val.trim() && !val.includes('-')) {
        set.add(val.trim())
      }
    })
    return Array.from(set)
  }, [catalogo])

  // Grand totals — uses active/selected variant per space
  const gt = useMemo(() => {
    let mat = 0, mo = 0
    for (const { nombre, vars } of espacios) {
      const activeId = activeVarMap[nombre] || vars[0]?.id
      const av = vars.find(v => v.id === activeId) || vars[0]; if (!av) continue
      const vd = av.data as any as EspacioVariantes
      if (vd.visible_pdf === false) continue

      const vItems = items.filter(it => (it.data as any as ItemsVariante).variante_id === av.id)
      mat += vItems.reduce((s, it) => s + (Number((it.data as any as ItemsVariante).total_linea) || 0), 0)
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

  const productionReady = !!activeCotId && (
    !!activeContrato ||
    headerLocal.estado === 'en_contrato' ||
    headerLocal.estado === 'pre_produccion'
  )

  const handleActivateProduction = async () => {
    if (!activeCot) return
    setIsProducing(true)
    try {
      await zapCall('zap_activar_produccion', { record: activeCot })
      await loadAll()
      setIsProductionOpen(false)
    } catch (err) {
      toast.error('No se pudo activar la produccion.')
      throw err
    } finally {
      setIsProducing(false)
    }
  }

  // ── Handlers: espacios ───────────────────────────────────────────
  const addEspacio = async () => {
    if (!activeCotId) return
    const id = crypto.randomUUID()

    // Generate a unique name for the new space to avoid collision upon renaming
    let baseName = 'Nuevo Espacio'
    let nombreEspacio = baseName
    let counter = 1
    const existingNames = new Set(activeVariantes.map(v => (v.data as any as EspacioVariantes).nombre_espacio?.trim()).filter(Boolean))
    while (existingNames.has(nombreEspacio)) {
      counter++
      nombreEspacio = `${baseName} ${counter}`
    }

    const data: EspacioVariantes = {
      proyecto_id: activeCotId,
      nombre_espacio: nombreEspacio,
      nombre_variante: 'Inicial',
      jornadas_desarrollo_tecnico: 0,
      jornadas_ensamblaje_taller: 0,
      jornadas_instalacion_obra: 0,
      activa: true,
      orden_espacio: espacios.length,
      created_at: new Date().toISOString()
    } as any
    await vWrite('espacio_variantes', id, data)
    setVariantes(prev => [...prev, { id, context: 'espacio_variantes', data: data as any }])
  }

  const renameEspacio = async (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) return

    // 1. Instant optimistic local React state update
    setVariantes(prev => prev.map(x => {
      const vd = x.data as any as EspacioVariantes
      if (vd.proyecto_id === activeCotId && vd.nombre_espacio === oldName) {
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
        orden_espacio: espacios.length,
        created_at: new Date().toISOString()
      } as any
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

  const reorderEspacio = async (nombreEspacio: string, direction: 'up' | 'down') => {
    const idx = espacios.findIndex(e => e.nombre === nombreEspacio)
    if (idx === -1) return
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= espacios.length) return

    const newSpaces = [...espacios]
    const temp = newSpaces[idx]
    newSpaces[idx] = newSpaces[targetIdx]
    newSpaces[targetIdx] = temp

    const toUpdate: any[] = []
    newSpaces.forEach((space, index) => {
      space.vars.forEach(v => {
        toUpdate.push({ id: v.id, data: { ...(v.data as any), orden_espacio: index } })
      })
    })

    setVariantes(prev => prev.map(x => {
      const match = toUpdate.find(u => u.id === x.id)
      return match ? { ...x, data: match.data as any } : x
    }))

    await Promise.all(toUpdate.map(u => vWrite('espacio_variantes', u.id, u.data)))
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
    const existingDesc = existing.length > 0 ? (existing[0].data as any as EspacioVariantes).descripcion : undefined
    const id = crypto.randomUUID()
    const data: EspacioVariantes = {
      proyecto_id: activeCotId,
      nombre_espacio: nombreEspacio,
      nombre_variante: `Variante ${existing.length + 1}`,
      jornadas_desarrollo_tecnico: 0,
      jornadas_ensamblaje_taller: 0,
      jornadas_instalacion_obra: 0,
      activa: true,
      descripcion: existingDesc,
      orden: existing.length
    } as any

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
    const vd = v.data as any as EspacioVariantes

    if ('descripcion' in patch) {
      const spaceName = vd.nombre_espacio
      const siblings = variantes.filter(x => (x.data as any as EspacioVariantes).nombre_espacio === spaceName)
      await Promise.all(siblings.map(async (sibling) => {
        const siblingData = { ...(sibling.data as any as EspacioVariantes), descripcion: patch.descripcion }
        setVariantes(prev => prev.map(x => x.id === sibling.id ? { ...x, data: siblingData as any } : x))
        await vWrite('espacio_variantes', sibling.id, siblingData)
      }))
    } else {
      const nd = { ...vd, ...patch }
      setVariantes(prev => prev.map(x => x.id === id ? { ...x, data: nd as any } : x))
      await vWrite('espacio_variantes', id, nd)
    }
  }

  const duplicateVariante = async (varId: string) => {
    const v = variantes.find(x => x.id === varId)
    if (!v) return
    const vd = v.data as any as EspacioVariantes
    const nombreEspacio = vd.nombre_espacio || 'Sin nombre'
    const siblings = activeVariantes.filter(v => (v.data as any as EspacioVariantes).nombre_espacio === nombreEspacio)

    const id = crypto.randomUUID()
    const name = `${vd.nombre_variante || 'Variante'} (Copia)`
    const data: EspacioVariantes = {
      ...vd,
      nombre_variante: name,
      activa: true,
      orden: siblings.length
    } as any

    // Deactivate other variants in the same space
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

  const reorderVariante = async (id: string, direction: 'left' | 'right') => {
    const v = variantes.find(x => x.id === id)
    if (!v) return
    const vd = v.data as any as EspacioVariantes
    const spaceName = vd.nombre_espacio

    const siblings = activeVariantes.filter(x => (x.data as any as EspacioVariantes).nombre_espacio === spaceName)
    const idx = siblings.findIndex(x => x.id === id)
    if (idx === -1) return

    const swapIdx = direction === 'left' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= siblings.length) return

    const swapVar = siblings[swapIdx]
    const currentOrder = (vd as any).orden !== undefined ? Number((vd as any).orden) : idx
    const swapOrder = (swapVar.data as any).orden !== undefined ? Number((swapVar.data as any).orden) : swapIdx

    let newOrder1 = swapOrder
    let newOrder2 = currentOrder
    if (newOrder1 === newOrder2) {
      newOrder1 = direction === 'left' ? swapIdx : idx
      newOrder2 = direction === 'left' ? idx : swapIdx
    }

    const nd1 = { ...vd, orden: newOrder1 }
    const nd2 = { ...(swapVar.data as any), orden: newOrder2 }

    setVariantes(prev => prev.map(x => {
      if (x.id === id) return { ...x, data: nd1 as any }
      if (x.id === swapVar.id) return { ...x, data: nd2 as any }
      return x
    }))

    await Promise.all([
      vWrite('espacio_variantes', id, nd1),
      vWrite('espacio_variantes', swapVar.id, nd2)
    ])
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
    return id
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
    const data: ProyectoData = { nombre_proyecto: 'Nuevo Proyecto', estado: 'activa' }
    await vWrite('proyectos', id, data)
    setProyectos(prev => [...prev, { id, context: 'proyectos', data: data as any }])
    setActiveCotId(id); setHeaderLocal(data)
  }

  const handleExportPdf = async () => {
    if (!activeCotId || isExporting) return
    setIsExporting(true)
    const toastId = toast.loading('Generando propuesta comercial premium en PDF...')
    try {
      // Bug 1 fix: flush pending header changes before Zap reads from DB
      if (isDirty) {
        await vWrite('proyectos', activeCotId, headerLocal)
        setProyectos(prev => prev.map(c => c.id === activeCotId ? { ...c, data: headerLocal as any } : c))
      }

      // Bug 2 fix (Axiom 1): Enforce exact 1:1 synchronization of active variants in DB before Zap execution
      const spaceNames = new Set<string>()
      for (const v of activeVariantes) {
        const vd = v.data as any as EspacioVariantes
        if (vd.nombre_espacio) spaceNames.add(vd.nombre_espacio)
      }
      const syncTasks: Promise<any>[] = []
      for (const sName of spaceNames) {
        const activeVarId = activeVarMap[sName]
        const varsInSpace = activeVariantes.filter(v => (v.data as any as EspacioVariantes).nombre_espacio === sName)
        for (const v of varsInSpace) {
          const isSelected = activeVarId ? (v.id === activeVarId) : (v === varsInSpace[0])
          const vd = v.data as any as EspacioVariantes
          if (!!vd.activa !== isSelected) {
            syncTasks.push(vWrite('espacio_variantes', v.id, { ...vd, activa: isSelected }))
          }
        }
      }
      if (syncTasks.length > 0) {
        await Promise.all(syncTasks)
      }

      const response = await fetch('/api/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zap: 'exportar_propuesta_pdf',
          payload: {
            record: { id: activeCotId },
            context: 'proyectos'
          }
        })
      })
      const result = await response.json()
      toast.dismiss(toastId)
      if (!result.success) {
        throw new Error(result.error || 'No se pudo generar la propuesta.')
      }

      if (Array.isArray(result.events)) {
        await processEvents(result.events)
      }
    } catch (e: any) {
      toast.dismiss(toastId)
      toast.error(`Error al exportar: ${e.message}`)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportContratoPdf = async (contratoId: string) => {
    const toastId = toast.loading('Generando contrato legal en PDF...')
    try {
      const response = await fetch('/api/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zap: 'exportar_contrato_pdf',
          payload: {
            contratoId
          }
        })
      })
      const result = await response.json()
      toast.dismiss(toastId)
      if (!result.success) {
        throw new Error(result.error || 'No se pudo generar el documento del contrato.')
      }

      if (Array.isArray(result.events)) {
        await processEvents(result.events)
      }
    } catch (err: any) {
      toast.error('Error al generar PDF del contrato: ' + err.message, { id: toastId })
    }
  }

  const deleteCotizacionById = async (cotId: string, confirmFirst = true) => {
    if (confirmFirst && !confirm('¿Estás seguro de que deseas eliminar esta cotización y todos sus espacios de forma permanente?')) return
    
    try {
      // Delete all items of all variants belonging to this quotation
      const toDelVariants = variantes.filter(v => (v.data as any as EspacioVariantes).proyecto_id === cotId)
      for (const v of toDelVariants) {
        const vItems = items.filter(it => (it.data as any as ItemsVariante).variante_id === v.id)
        for (const it of vItems) {
          await vRemove('items_variante', it.id)
        }
        await vRemove('espacio_variantes', v.id)
      }
      
      // Delete the quotation record itself
      await vRemove('proyectos', cotId)
      
      // Update local state
      setProyectos(prev => prev.filter(c => c.id !== cotId))
      setVariantes(prev => prev.filter(v => (v.data as any as EspacioVariantes).proyecto_id !== cotId))
      setItems(prev => prev.filter(it => {
        const varId = (it.data as any as ItemsVariante).variante_id
        const vari = variantes.find(v => v.id === varId)
        return vari ? (vari.data as any as EspacioVariantes).proyecto_id !== cotId : true
      }))
      
      if (activeCotId === cotId) {
        setActiveCotId(null)
      }
      
      toast.success('Cotización eliminada con éxito')
    } catch (error: any) {
      toast.error('Error al eliminar la cotización: ' + error.message)
    }
  }

  const deleteCotizacion = async () => {
    if (!activeCotId) return
    await deleteCotizacionById(activeCotId, true)
  }

  const duplicateCotizacion = async (cotId: string) => {
    const orig = proyectosList.find(c => c.id === cotId)
    if (!orig) return
    const origData = orig.data as any as ProyectoData
    
    const newCotId = crypto.randomUUID()
    const newCotData: ProyectoData = {
      ...origData,
      nombre_proyecto: origData.nombre_proyecto ? `${origData.nombre_proyecto} (Copia)` : 'Proyecto (Copia)'
    }
    
    // Find all spaces / variants belonging to the original cotizacion
    const origVariants = variantes.filter(v => (v.data as any as EspacioVariantes).proyecto_id === cotId)
    const newVariants: DataItem[] = []
    const newItems: DataItem[] = []
    
    try {
      // 1. Write the new cotizacion
      await vWrite('proyectos', newCotId, newCotData)
      
      // 2. Clone each space/variant and its items
      for (const v of origVariants) {
        const vd = v.data as any as EspacioVariantes
        const newVarId = crypto.randomUUID()
        const newVarData: EspacioVariantes = {
          ...vd,
          proyecto_id: newCotId
        }
        await vWrite('espacio_variantes', newVarId, newVarData)
        newVariants.push({ id: newVarId, context: 'espacio_variantes', data: newVarData as any })
        
        // Find items for this variant
        const origItems = items.filter(it => (it.data as any as ItemsVariante).variante_id === v.id)
        for (const it of origItems) {
          const newItemId = crypto.randomUUID()
          const newItemData: ItemsVariante = {
            ...(it.data as any as ItemsVariante),
            variante_id: newVarId
          }
          await vWrite('items_variante', newItemId, newItemData)
          newItems.push({ id: newItemId, context: 'items_variante', data: newItemData as any })
        }
      }
      
      // 3. Update local states
      setProyectos(prev => [...prev, { id: newCotId, context: 'proyectos', data: newCotData as any }])
      setVariantes(prev => [...prev, ...newVariants])
      setItems(prev => [...prev, ...newItems])
      
      toast.success('Cotización duplicada con éxito')
    } catch (error: any) {
      toast.error('Error al duplicar la cotización: ' + error.message)
    }
  }

  const handleEditCatalogItem = (id: string) => {
    const item = catalogo.find(c => c.id === id)
    if (!item) return
    setCatalogModal({
      isOpen: true,
      mode: 'edit',
      id,
      data: { ...(item.data as any as ProductosCatalogo) }
    })
  }

  const handleAddCatalogItem = (initialSearch: string) => {
    setCatalogModal({
      isOpen: true,
      mode: 'create',
      data: { descripcion: initialSearch, unidad_medida: 'unidad', precio_publico: 0, precio_directo: 0 }
    })
  }

  const handleSaveCatalogItem = async () => {
    const { mode, id, data } = catalogModal
    if (!data.descripcion?.trim()) {
      toast.error('La descripción es obligatoria')
      return
    }

    try {
      if (mode === 'create') {
        const newId = crypto.randomUUID()
        await vWrite('productos_catalogo', newId, data)
        const newItem = { id: newId, context: 'productos_catalogo', data: data as any }
        
        // Update catalogo state immediately for real-time reactivity!
        setCatalogo(prev => [...prev, newItem])
        toast.success('Producto creado y agregado al catálogo')
      } else if (mode === 'edit' && id) {
        await vWrite('productos_catalogo', id, data)
        setCatalogo(prev => prev.map(c => c.id === id ? { ...c, data: data as any } : c))
        
        // Also update all items in the quotation that reference this catalog item
        setItems(prev => prev.map(it => {
          const itd = it.data as any as ItemsVariante
          if (itd.catalogo_id === id) {
            const qty = Number(itd.cantidad) || 1
            const precio = Number(data.precio_publico) || 0
            return {
              ...it,
              data: {
                ...itd,
                unidad_medida: data.unidad_medida || '',
                precio_unitario: precio,
                total_linea: qty * precio
              } as any
            }
          }
          return it
        }))
        toast.success('Producto del catálogo actualizado')
      }
      setCatalogModal(prev => ({ ...prev, isOpen: false }))
    } catch (err: any) {
      toast.error('Error al guardar el producto: ' + err.message)
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
    const sorted = [...proyectosList].sort((a, b) =>
      (b as any).updated_at?.localeCompare?.((a as any).updated_at) ?? 0
    )
    return (
      <div className="min-h-screen bg-stone-50 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="w-full min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-stone-800 tracking-tight w-full max-w-full break-words text-balance">Proyectos</h1>
              <p className="text-stone-400 text-sm mt-1">Selecciona o crea una nueva</p>
            </div>
            <button onClick={newCot}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 transition-colors shadow-sm">
              <Plus size={14} /> Nueva
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map(c => {
              const d = c.data as any as ProyectoData
              const cli = clientes.find(cl => cl.id === d.cliente_id)?.data as any

              // Count unique physical space names in this quotation
              const spacesList = variantes.filter(v => (v.data as any as EspacioVariantes).proyecto_id === c.id)
              const uniqueSpaceNames = new Set(
                spacesList.map(v => (v.data as any as EspacioVariantes).nombre_espacio?.trim()).filter(Boolean)
              )
              const spacesCount = uniqueSpaceNames.size
              return (
                <div key={c.id}
                  className="relative p-5 bg-white border border-stone-200 rounded-2xl hover:border-amber-300 hover:shadow-md transition-all group flex flex-col justify-between min-h-[140px]">
                  <div onClick={() => { setActiveCotId(c.id); setHeaderLocal(d) }} className="cursor-pointer flex-1 flex flex-col justify-start">
                    <div className="flex items-center justify-between mb-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setActiveCotId(c.id); setHeaderLocal(d) }}>
                        <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                          <FileText size={13} className="text-amber-500" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-300 group-hover:text-amber-400 transition-colors truncate">
                          {c.id.slice(0, 8)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => duplicateCotizacion(c.id)}
                          className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Duplicar cotización"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          onClick={() => deleteCotizacionById(c.id)}
                          className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar cotización"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-semibold text-stone-800 group-hover:text-amber-700 transition-colors text-sm leading-tight mb-2 w-full max-w-full break-words text-balance">
                      {d.nombre_proyecto || <span className="italic text-stone-300">Sin nombre</span>}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between text-xs text-stone-400 mt-2 pt-2 border-t border-stone-50 w-full min-w-0">
                    {cli ? (
                      <span className="flex items-center gap-1 min-w-0 max-w-full"><User size={9} className="shrink-0" /> <span className="truncate">{cli.nombre}</span></span>
                    ) : <span />}
                    {spacesCount > 0 && <span>{spacesCount} espacio{spacesCount !== 1 ? 's' : ''}</span>}
                  </div>
                </div>
              )
            })}
            {sorted.length === 0 && (
              <div className="col-span-3 text-center py-16 text-stone-300 text-sm">
                Sin proyectos. Crea el primero.
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const isEmbedded = !!forcedProyectoId

  return (
    <div className={cn("flex flex-col flex-1", isEmbedded ? "pb-24 bg-transparent" : "min-h-screen bg-stone-50 pb-36")}>

      {/* ── Sticky header ──────────────────────────────────────────── */}
      <header className={cn("sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-stone-200 shadow-sm", isEmbedded && "rounded-t-xl")}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          {/* Primary row */}
          <div className="flex items-center gap-3 py-3">
            {!isEmbedded && (
              <button onClick={() => setActiveCotId(null)}
                className="text-stone-300 hover:text-amber-600 transition-colors p-1 -ml-1 shrink-0">
                <ChevronDown size={18} className="rotate-90" />
              </button>
            )}
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
            <button onClick={deleteCotizacion}
              className="flex items-center gap-1.5 text-xs text-stone-300 hover:text-red-500 px-3 py-1.5 rounded-xl hover:bg-red-50/50 transition-colors shrink-0"
              title="Eliminar cotización"
            >
              <Trash2 size={12} />
              <span className="uppercase tracking-widest font-semibold hidden sm:block">Eliminar</span>
            </button>
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
                <HybridClientSelector
                  value={headerLocal.cliente_id || ''}
                  clientes={clientes}
                onChange={clientId => {
                  const cl = clientes.find(c => c.id === clientId)
                  const clDom = cl?.data?.domicilio || cl?.domicilio || ''
                  setHeaderLocal(p => ({
                    ...p,
                    cliente_id: clientId,
                    direccion_obra: p.direccion_obra || clDom
                  }))
                }}
                onClientCreated={newClient => setClientes(prev => [...prev, newClient])}
              />
            </div>
            <div className="col-span-2 md:col-span-1 flex flex-col gap-1">
              <label className="text-[9px] uppercase tracking-widest text-stone-400">Dirección de obra</label>
              <input type="text" value={headerLocal.direccion_obra || clienteData?.domicilio || ''}
                onChange={e => setHeaderLocal(p => ({ ...p, direccion_obra: e.target.value }))}
                placeholder="Ciudad, barrio…"
                className="text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300 text-stone-700"
              />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase tracking-widest text-stone-400">Días entrega</label>
                <input type="number" value={headerLocal.dias_entrega_estimados ?? ''}
                  onChange={e => {
                    const val = e.target.value;
                    setHeaderLocal(p => ({ ...p, dias_entrega_estimados: val === '' ? undefined : Number(val) }));
                  }}
                  placeholder="0" min={0}
                  className="text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300 text-stone-700"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase tracking-widest text-stone-400">Garantía (años)</label>
                <input type="number" value={headerLocal.garantia_anios ?? ''}
                  onChange={e => {
                    const val = e.target.value;
                    setHeaderLocal(p => ({ ...p, garantia_anios: val === '' ? undefined : Number(val) }));
                  }}
                  placeholder="0" min={0}
                  className="text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300 text-stone-700"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Apoyo Técnico panel ─────────────────────────────────────── */}
      <div className={cn("max-w-4xl mx-auto w-full px-4 sm:px-6 pt-4", isEmbedded && "px-2 sm:px-3")}>
        <ApoyoTecnicoPanel proyectoId={activeCotId!} />
      </div>

      {/* ── Body: espacios ─────────────────────────────────────────── */}
      <main className={cn("flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-4 space-y-4", isEmbedded && "px-2 sm:px-3")}>
        {missingServiceSkus.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-800 flex items-start gap-3 shadow-sm transition-all duration-300">
            <span className="text-base select-none">⚠️</span>
            <div className="flex-1">
              <p className="font-bold text-amber-900">Tarifas de Mano de Obra por Defecto (SKUs Huérfanos)</p>
              <p className="mt-1 leading-relaxed opacity-90">
                Los siguientes servicios técnicos no están configurados en tu catálogo maestro comercial: <strong className="font-mono bg-amber-100/80 px-1 py-0.5 rounded text-amber-950 font-bold">{missingServiceSkus.join(', ')}</strong>. Se está aplicando la tarifa fallback estándar de <strong className="font-mono text-amber-950 font-bold">$185.000 COP</strong> por jornada para los cálculos de diseño, taller e instalación.
              </p>
            </div>
          </div>
        )}

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
              onReorderVariante={reorderVariante}
              onMoveUp={() => reorderEspacio(nombre, 'up')}
              onMoveDown={() => reorderEspacio(nombre, 'down')}
              onAddItem={addItem} onUpdateItem={updateItem} onDeleteItem={deleteItem}
              onDelete={() => deleteEspacio(nombre)}
              onDuplicate={() => duplicateEspacio(nombre)}
              onEditCatalogItem={handleEditCatalogItem}
              onAddCatalogItem={handleAddCatalogItem}
              allExistingColors={allExistingColors}
            />
          )
        })}

        <button onClick={addEspacio}
          className="w-full py-5 border-2 border-dashed border-stone-200 rounded-2xl text-stone-400 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50/30 transition-all flex items-center justify-center gap-2 text-sm font-medium">
          <Plus size={16} /> Agregar espacio
        </button>
      </main>

      {/* ── Sticky footer ──────────────────────────────────────────── */}
      <footer className={cn("z-30 bg-white/95 backdrop-blur-sm border-t border-stone-200 shadow-[0_-4px_24px_rgba(0,0,0,0.07)]", 
        isEmbedded ? "absolute bottom-0 left-0 right-0" : "fixed bottom-0 inset-x-0"
      )}>
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
            <div className="flex items-center gap-3 ml-auto shrink-0">
              <div className="text-right mr-1">
                <div className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Total cotización</div>
                <div className="text-xl font-bold text-amber-700 tabular-nums tracking-tight leading-none mt-0.5">
                  {COP(gt.total)}
                </div>
              </div>
              <button
                onClick={handleExportPdf}
                disabled={isExporting || !activeCotId}
                className="flex items-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                {isExporting ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
                Generar cotización
              </button>
              <button
                type="button"
                onClick={() => setIsContratoOpen(true)}
                disabled={isExporting || !activeCotId}
                className="flex items-center gap-2 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white border border-stone-850 rounded-xl text-xs font-semibold transition-colors shadow-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                <FileText size={13} className="text-amber-500" />
                Generar contrato
              </button>
              <Button
                type="button"
                onClick={() => setIsProductionOpen(true)}
                disabled={isExporting || isProducing || !activeCotId || !productionReady}
                className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                title={!productionReady ? 'Genera o confirma un contrato antes de pasar a produccion' : 'Pasar a produccion'}
              >
                <Play className="h-3.5 w-3.5" />
                Pasar a produccion
              </Button>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Catalog Item Form Modal (Create or Edit) ────────────────── */}
      <ProductionTransitionDialog
        open={isProductionOpen}
        onOpenChange={setIsProductionOpen}
        projectName={(activeCot?.data as any)?.nombre_proyecto || 'Proyecto sin nombre'}
        currentStage={headerLocal.estado}
        hasContract={!!activeContrato}
        contractLabel={activeContrato?.data?.codigo_contrato ? `Contrato ${activeContrato.data.codigo_contrato}` : 'Se generara al confirmar'}
        busy={isProducing}
        sourceLabel="Cotizador"
        onConfirm={handleActivateProduction}
      />

      {catalogModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-2xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-bold text-stone-800 text-sm">
                {catalogModal.mode === 'create' ? 'Agregar Producto al Catálogo' : 'Editar Producto del Catálogo'}
              </h3>
              <button
                onClick={() => setCatalogModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Content */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Descripción *</label>
                  <input
                    type="text"
                    required
                    value={catalogModal.data.descripcion || ''}
                    onChange={e => setCatalogModal(prev => ({ ...prev, data: { ...prev.data, descripcion: e.target.value } }))}
                    placeholder="Descripción o nombre del producto..."
                    className="w-full text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300 text-stone-700 font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">SKU</label>
                  <input
                    type="text"
                    value={catalogModal.data.sku || ''}
                    onChange={e => setCatalogModal(prev => ({ ...prev, data: { ...prev.data, sku: e.target.value } }))}
                    placeholder="Eje: PROD-001"
                    className="w-full text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300 text-stone-700"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Tipo / Categoría</label>
                  <select
                    value={catalogModal.data.tipo || ''}
                    onChange={e => setCatalogModal(prev => ({ ...prev, data: { ...prev.data, tipo: e.target.value } }))}
                    className="w-full text-xs border border-stone-200 rounded-lg px-2.5 py-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300 text-stone-700"
                  >
                    <option value="">Seleccionar...</option>
                    {tiposOptions.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Unidad de Medida</label>
                  <select
                    value={catalogModal.data.unidad_medida || ''}
                    onChange={e => setCatalogModal(prev => ({ ...prev, data: { ...prev.data, unidad_medida: e.target.value } }))}
                    className="w-full text-xs border border-stone-200 rounded-lg px-2.5 py-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300 text-stone-700"
                  >
                    <option value="">Seleccionar...</option>
                    {unidadesOptions.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Proveedor</label>
                  <select
                    value={catalogModal.data.proveedor || ''}
                    onChange={e => setCatalogModal(prev => ({ ...prev, data: { ...prev.data, proveedor: e.target.value } }))}
                    className="w-full text-xs border border-stone-200 rounded-lg px-2.5 py-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300 text-stone-700"
                  >
                    <option value="">Seleccionar...</option>
                    {proveedoresOptions.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Precio Directo (Costo)</label>
                  <input
                    type="number"
                    value={catalogModal.data.precio_directo ?? ''}
                    onChange={e => setCatalogModal(prev => ({ ...prev, data: { ...prev.data, precio_directo: parseFloat(e.target.value) || 0 } }))}
                    placeholder="0"
                    min={0}
                    className="w-full text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300 text-stone-700"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Precio Público (Venta) *</label>
                  <input
                    type="number"
                    value={catalogModal.data.precio_publico ?? ''}
                    onChange={e => setCatalogModal(prev => ({ ...prev, data: { ...prev.data, precio_publico: parseFloat(e.target.value) || 0 } }))}
                    placeholder="0"
                    min={0}
                    className="w-full text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300 text-stone-700 font-semibold text-amber-700"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Ancho</label>
                  <input
                    type="text"
                    value={catalogModal.data.ancho || ''}
                    onChange={e => setCatalogModal(prev => ({ ...prev, data: { ...prev.data, ancho: e.target.value } }))}
                    placeholder="0.00"
                    className="w-full text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300 text-stone-700"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Alto</label>
                  <input
                    type="text"
                    value={catalogModal.data.alto || ''}
                    onChange={e => setCatalogModal(prev => ({ ...prev, data: { ...prev.data, alto: e.target.value } }))}
                    placeholder="0.00"
                    className="w-full text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300 text-stone-700"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Profundo</label>
                  <input
                    type="text"
                    value={catalogModal.data.profundo || ''}
                    onChange={e => setCatalogModal(prev => ({ ...prev, data: { ...prev.data, profundo: e.target.value } }))}
                    placeholder="0.00"
                    className="w-full text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300 text-stone-700"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">URL de Referencia</label>
                  <input
                    type="text"
                    value={catalogModal.data.url_referencia || ''}
                    onChange={e => setCatalogModal(prev => ({ ...prev, data: { ...prev.data, url_referencia: e.target.value } }))}
                    placeholder="https://..."
                    className="w-full text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300 text-stone-700"
                  />
                </div>

                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">URL Imagen del Producto</label>
                  <input
                    type="text"
                    value={catalogModal.data.imagen_url || ''}
                    onChange={e => setCatalogModal(prev => ({ ...prev, data: { ...prev.data, imagen_url: e.target.value } }))}
                    placeholder="https://..."
                    className="w-full text-xs border border-stone-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300 text-stone-700"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCatalogModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-semibold text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveCatalogItem}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
              >
                {catalogModal.mode === 'create' ? 'Crear Producto' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contrato Modals */}
      {isContratoOpen && (
        <ContratoModal
          isOpen={isContratoOpen}
          onClose={() => {
            setIsContratoOpen(false)
            loadAll()
          }}
          cotizacion={activeCot}
          cliente={clienteData}
          espacios={espacios}
          activeVarMap={activeVarMap}
          items={items}
          catalogo={catalogo}
          calculatedTotal={gt.total}
          onSaveSuccess={async (contratoId, emailData) => {
            await loadAll()
            setGeneratedContratoId(contratoId)
            setEmailModalData(emailData)
            setIsContratoOpen(false)
            // Ejecutar la generación e impresión del PDF
            await handleExportContratoPdf(contratoId)
            // Abrir el modal de correo
            setIsEmailOpen(true)
          }}
        />
      )}

      {isEmailOpen && generatedContratoId && emailModalData && (
        <ContratoEmailModal
          isOpen={isEmailOpen}
          onClose={() => setIsEmailOpen(false)}
          contratoId={generatedContratoId}
          emailData={emailModalData}
          onSuccess={() => {
            setIsEmailOpen(false)
            loadAll()
          }}
        />
      )}
    </div>
  )
}
