'use client'

import { useCallback, useEffect, useState } from 'react'
import { Modal } from '@/components/veta/modal'
import { Button } from '@/components/veta/button'
import {
  Plus,
  Trash2,
  Save,
  Layout,
  FileText,
  Clock,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import {
  crearPlantillaEspacioAction,
  actualizarPlantillaEspacioAction,
  crearPlantillaGrupoAction,
  crearPlantillaItemAction,
  resetearContenidoPlantillaAction,
  eliminarPlantillaGrupoAction,
} from '@/lib/data/actions/core'
import type { PlantillaEspacio, PlantillaGrupoHidratado, PlantillaItem } from '@/lib/data'
import { TIPOS_ESPACIO } from '@/lib/catalogos/tipos-espacio'

function parseNum(s: string | null | undefined): number {
  if (!s) return 0
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

interface BorradorGrupo {
  id: string
  nombre: string
  padreId: string | null
  orden: number
  jornadasDesarrolloTecnico: string
  jornadasEnsamblajeTaller: string
  jornadasInstalacionObra: string
}

interface BorradorItem {
  id: string
  nombrePersonalizado: string
  cantidad: string
  precioUnitario: string
  esReferencial: boolean
  fuenteReferencial: 'electrodomestico' | 'obra_civil' | 'servicio_tercero' | 'otro' | null
  grupoReferencial: string | null
  grupoId: string | null
  orden: number
}

interface BorradorPlantilla {
  id: string | null
  nombre: string
  tipoEspacio: string
  descripcion: string
  icono: string
  orden: number
  activa: boolean
  jornadasDesarrolloTecnico: string
  jornadasEnsamblajeTaller: string
  jornadasInstalacionObra: string
  grupos: BorradorGrupo[]
  items: BorradorItem[]
}

function borradorVacio(): BorradorPlantilla {
  return {
    id: null,
    nombre: '',
    tipoEspacio: TIPOS_ESPACIO[0].codigo,
    descripcion: '',
    icono: '📦',
    orden: 0,
    activa: true,
    jornadasDesarrolloTecnico: '0',
    jornadasEnsamblajeTaller: '0',
    jornadasInstalacionObra: '0',
    grupos: [],
    items: [],
  }
}

interface NodoGrupoArbol {
  id: string
  nombre: string
  padreId: string | null
  orden: number
  jornadasDesarrolloTecnico: string
  jornadasEnsamblajeTaller: string
  jornadasInstalacionObra: string
  subgrupos?: NodoGrupoArbol[]
  items?: PlantillaItem[]
}

function profundidadGrupo(g: BorradorGrupo, grupos: BorradorGrupo[], visitados = new Set<string>()): number {
  if (!g.padreId || visitados.has(g.id)) return 0
  visitados.add(g.id)
  const padre = grupos.find((x) => x.id === g.padreId)
  return padre ? 1 + profundidadGrupo(padre, grupos, visitados) : 0
}

interface PlantillaEditorModalProps {
  open: boolean
  onClose: () => void
  plantillaId?: string
  onSave: (plantilla: PlantillaEspacio) => void
}

export function PlantillaEditorModal({ open, onClose, plantillaId, onSave }: PlantillaEditorModalProps) {
  const JORNADA_CAMPOS = [
    ['jornadasDesarrolloTecnico', 'Dev'] as const,
    ['jornadasEnsamblajeTaller', 'Ens'] as const,
    ['jornadasInstalacionObra', 'Inst'] as const,
  ]
  const [borrador, setBorrador] = useState<BorradorPlantilla>(borradorVacio())
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!open || !plantillaId) {
      setBorrador(borradorVacio())
      return
    }
    const cargar = async () => {
      setCargando(true)
      try {
        const { obtenerPlantillaEspacioAction } = await import('@/lib/data/actions/core')
        const p = await obtenerPlantillaEspacioAction(plantillaId)
        if (!p) { onClose(); return }
        const grupos: BorradorGrupo[] = []
        const items: BorradorItem[] = []
        const plana: BorradorGrupo[] = []
        const porId = new Map<string, BorradorGrupo>()
        const agregarGrupo = (g: NodoGrupoArbol, padreId: string | null) => {
          const id = g.id
          const bg: BorradorGrupo = {
            id,
            nombre: g.nombre,
            padreId,
            orden: g.orden ?? 0,
            jornadasDesarrolloTecnico: g.jornadasDesarrolloTecnico ?? '0',
            jornadasEnsamblajeTaller: g.jornadasEnsamblajeTaller ?? '0',
            jornadasInstalacionObra: g.jornadasInstalacionObra ?? '0',
          }
          plana.push(bg)
          porId.set(id, bg)
          if (g.subgrupos) g.subgrupos.forEach((sg: NodoGrupoArbol) => agregarGrupo(sg, id))
        }
        p.grupos.forEach((g) => agregarGrupo(g, null))
        // ordenar padres antes que hijos
        const ordenados = [...plana].sort((a, b) => profundidadGrupo(a, plana) - profundidadGrupo(b, plana))
        ordenados.forEach((g) => grupos.push(g))
        p.grupos.forEach((g: NodoGrupoArbol) => {
          if (g.items) {
            g.items.forEach((it: PlantillaItem, i: number) => {
              items.push({
                id: it.id,
                nombrePersonalizado: it.nombrePersonalizado,
                cantidad: it.cantidad ?? '1',
                precioUnitario: it.precioUnitario ?? '0',
                esReferencial: it.esReferencial ?? false,
                fuenteReferencial: it.fuenteReferencial ?? null,
                grupoReferencial: it.grupoReferencial ?? null,
                grupoId: g.id,
                orden: it.orden ?? i,
              })
            })
          }
        })
        // ítems sin grupo
        setBorrador({
          id: p.id,
          nombre: p.nombre,
          tipoEspacio: p.tipoEspacio,
          descripcion: p.descripcion ?? '',
          icono: p.icono ?? '📦',
          orden: p.orden ?? 0,
          activa: p.activa,
          jornadasDesarrolloTecnico: p.jornadasDesarrolloTecnico ?? '0',
          jornadasEnsamblajeTaller: p.jornadasEnsamblajeTaller ?? '0',
          jornadasInstalacionObra: p.jornadasInstalacionObra ?? '0',
          grupos,
          items: items.filter((it) => it.grupoId === null),
        })
      } catch (err) {
        console.error('No se pudo cargar la plantilla:', err)
        alert('No se pudo cargar la plantilla')
      } finally {
        setCargando(false)
      }
    }
    void cargar()
  }, [open, plantillaId, onClose])

  const setCampo = useCallback((key: string, value: string) => {
    setBorrador((prev) => ({ ...prev, [key]: value }))
  }, [])

  const agregarGrupo = useCallback((padreId: string | null = null) => {
    setBorrador((prev) => {
      const id = `tmp-${crypto.randomUUID()}`
      const nuevo: BorradorGrupo = {
        id,
        nombre: 'Nuevo grupo',
        padreId,
        orden: prev.grupos.filter((g) => g.padreId === padreId).length,
        jornadasDesarrolloTecnico: '0',
        jornadasEnsamblajeTaller: '0',
        jornadasInstalacionObra: '0',
      }
      return { ...prev, grupos: [...prev.grupos, nuevo] }
    })
  }, [])

  const agregarItem = useCallback((grupoId: string | null = null) => {
    setBorrador((prev) => {
      const id = `tmp-${crypto.randomUUID()}`
      const nuevo: BorradorItem = {
        id,
        nombrePersonalizado: '',
        cantidad: '1',
        precioUnitario: '0',
        esReferencial: false,
        fuenteReferencial: null,
        grupoReferencial: null,
        grupoId,
        orden: prev.items.filter((it) => it.grupoId === grupoId).length,
      }
      return { ...prev, items: [...prev.items, nuevo] }
    })
  }, [])

  const eliminarGrupoBorrador = useCallback((id: string) => {
    setBorrador((prev) => {
      const tieneHijos = prev.grupos.some((g) => g.padreId === id)
      if (tieneHijos) {
        alert('No se puede eliminar un grupo que tiene subgrupos. Elimínalos primero.')
        return prev
      }
      const itemsDelGrupo = prev.items.filter((it) => it.grupoId === id).length > 0
      if (itemsDelGrupo) {
        if (!window.confirm('Este grupo tiene ítems. Al eliminarlos pasarán a ítems sueltos, ¿continuas?')) {
          return prev
        }
      }
      return {
        ...prev,
        grupos: prev.grupos.filter((g) => g.id !== id),
        items: prev.items.map((it) => (it.grupoId === id ? { ...it, grupoId: null } : it)),
      }
    })
  }, [])

  const eliminarItemBorrador = useCallback((id: string) => {
    setBorrador((prev) => ({ ...prev, items: prev.items.filter((it) => it.id !== id) }))
  }, [])

  const guardar = useCallback(async () => {
    if (!borrador.nombre.trim()) {
      alert('El nombre de la plantilla es obligatorio.')
      return
    }
    setGuardando(true)
    try {
      // 1. Crear o actualizar la plantilla base
      let plantillaIdReal: string
      if (borrador.id) {
        const actualizado = await actualizarPlantillaEspacioAction(borrador.id, {
          nombre: borrador.nombre,
          tipoEspacio: borrador.tipoEspacio,
          descripcion: borrador.descripcion || null,
          icono: borrador.icono || null,
          orden: borrador.orden,
          activa: borrador.activa,
          jornadasDesarrolloTecnico: borrador.jornadasDesarrolloTecnico,
          jornadasEnsamblajeTaller: borrador.jornadasEnsamblajeTaller,
          jornadasInstalacionObra: borrador.jornadasInstalacionObra,
        })
        if (!actualizado) throw new Error('No se pudo actualizar la plantilla')
        plantillaIdReal = actualizado.id
        await resetearContenidoPlantillaAction(plantillaIdReal)
      } else {
        const creada = await crearPlantillaEspacioAction({
          nombre: borrador.nombre,
          tipoEspacio: borrador.tipoEspacio,
          descripcion: borrador.descripcion || null,
          icono: borrador.icono || null,
          orden: borrador.orden,
          activa: borrador.activa,
          jornadasDesarrolloTecnico: borrador.jornadasDesarrolloTecnico,
          jornadasEnsamblajeTaller: borrador.jornadasEnsamblajeTaller,
          jornadasInstalacionObra: borrador.jornadasInstalacionObra,
        })
        plantillaIdReal = creada.id
      }

      // 2. Insertar grupos (padres antes que hijos), mapeando id temporal -> id real
      const gruposOrdenados = [...borrador.grupos].sort((a, b) => profundidadGrupo(a, borrador.grupos) - profundidadGrupo(b, borrador.grupos))
      const mapaIdGrupo = new Map<string, string>()
      for (const g of gruposOrdenados) {
        const nuevoPadreId = g.padreId ? mapaIdGrupo.get(g.padreId) ?? null : null
        const creado = await crearPlantillaGrupoAction(plantillaIdReal, g.nombre, nuevoPadreId)
        mapaIdGrupo.set(g.id, creado.id)
      }

      // 3. Insertar ítems
      for (const it of borrador.items) {
        const grupoRealId = it.grupoId ? mapaIdGrupo.get(it.grupoId) ?? null : null
        await crearPlantillaItemAction(plantillaIdReal, grupoRealId, {
          nombrePersonalizado: it.nombrePersonalizado,
          cantidad: it.cantidad,
          precioUnitario: it.precioUnitario,
          esReferencial: it.esReferencial,
          fuenteReferencial: it.fuenteReferencial,
          grupoReferencial: it.grupoReferencial,
          orden: it.orden,
        })
      }

      // 4. Devolver la plantilla guardada
      const { obtenerPlantillaEspacioAction } = await import('@/lib/data/actions/core')
      const guardada = await obtenerPlantillaEspacioAction(plantillaIdReal)
      if (guardada) {
        onSave({
          id: guardada.id,
          nombre: guardada.nombre,
          tipoEspacio: guardada.tipoEspacio,
          descripcion: guardada.descripcion ?? null,
          icono: guardada.icono ?? null,
          orden: guardada.orden,
          activa: guardada.activa,
          jornadasDesarrolloTecnico: guardada.jornadasDesarrolloTecnico,
          jornadasEnsamblajeTaller: guardada.jornadasEnsamblajeTaller,
          jornadasInstalacionObra: guardada.jornadasInstalacionObra,
          createdAt: guardada.createdAt,
          updatedAt: guardada.updatedAt,
        })
      }
      onClose()
    } catch (err) {
      console.error('No se pudo guardar la plantilla:', err)
      alert(`No se pudo guardar la plantilla: ${err instanceof Error ? err.message : 'Error desconocido'}`)
    } finally {
      setGuardando(false)
    }
  }, [borrador, onClose, onSave])

  const gruposPorPadre = (padreId: string | null) =>
    borrador.grupos.filter((g) => g.padreId === padreId).sort((a, b) => a.orden - b.orden)

  const itemsDeGrupo = (grupoId: string | null) =>
    borrador.items.filter((it) => it.grupoId === grupoId).sort((a, b) => a.orden - b.orden)

  return (
    <Modal open={open} onClose={onClose} title={borrador.id ? 'Editar plantilla de espacio' : 'Nueva plantilla de espacio'} maxWidthClassName="max-w-4xl">
      <div className="space-y-4">
        {/* Cabecera de la plantilla */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="col-span-full sm:col-span-2">
            <label className="block text-xs font-medium text-text-muted mb-1">Nombre de la plantilla</label>
            <input
              type="text"
              value={borrador.nombre}
              onChange={(e) => setCampo('nombre', e.target.value)}
              placeholder="Ej. Cocina Integral Estándar"
              className="rounded border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-heading focus:outline-none focus:border-gold-400 w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Tipo de espacio</label>
            <select
              value={borrador.tipoEspacio}
              onChange={(e) => setCampo('tipoEspacio', e.target.value)}
              className="rounded border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-heading focus:outline-none focus:border-gold-400 w-full"
            >
              {TIPOS_ESPACIO.map((t) => (
                <option key={t.codigo} value={t.codigo}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Icono (emoji)</label>
            <input
              type="text"
              value={borrador.icono}
              onChange={(e) => setCampo('icono', e.target.value)}
              maxLength={2}
              placeholder="📦"
              className="rounded border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-heading focus:outline-none focus:border-gold-400 w-full text-center"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="col-span-full sm:col-span-2">
            <label className="block text-xs font-medium text-text-muted mb-1">Descripción</label>
            <textarea
              value={borrador.descripcion}
              onChange={(e) => setCampo('descripcion', e.target.value)}
              placeholder="Descripción opcional de la plantilla"
              rows={2}
              className="rounded border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-heading focus:outline-none focus:border-gold-400 w-full"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-text-muted">
              <input
                type="checkbox"
                checked={borrador.activa}
                onChange={() => setBorrador((prev) => ({ ...prev, activa: !prev.activa }))}
                className="rounded border border-border-subtle text-gold-600 focus:ring-gold-500"
              />
              Activa en el catálogo
            </label>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {JORNADA_CAMPOS.map(([campo, etiqueta]) => (
            <div key={campo}>
              <label className="block text-xs font-medium text-text-muted mb-1">{etiqueta}</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={borrador[campo]}
                onChange={(e) => setCampo(campo, e.target.value)}
                placeholder="0"
                className="rounded border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-heading focus:outline-none focus:border-gold-400 w-full"
              />
            </div>
          ))}
        </div>

        {/* Grupos y subgrupos */}
        <div className="border border-border-subtle rounded-lg bg-bg-paper p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layout className="h-5 w-5 text-gold-600" />
              <h4 className="font-semibold text-text-heading">Grupos y subgrupos</h4>
            </div>
            <Button variant="ghost" size="sm" onClick={() => agregarGrupo(null)}>
              <Plus className="h-4 w-4" /> Grupo
            </Button>
          </div>

          {gruposPorPadre(null).length === 0 && (
            <p className="text-xs text-text-muted italic">Sin grupos. Agrega un grupo para organizar los ítems.</p>
          )}

          {gruposPorPadre(null).map((grupo) => (
            <div key={grupo.id} className="mb-4 border-l-2 border-gold-400 pl-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-text-muted">{grupo.orden + 1}.</span>
                  <input
                    type="text"
                    value={grupo.nombre}
                    onChange={(e) => {
                      setBorrador((prev) => ({
                        ...prev,
                        grupos: prev.grupos.map((g) => (g.id === grupo.id ? { ...g, nombre: e.target.value } : g)),
                      }))
                    }}
                    className="border border-border-subtle bg-bg-raised px-2 py-1 text-sm text-text-heading focus:outline-none focus:border-gold-400 w-full"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => agregarGrupo(grupo.id)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => eliminarGrupoBorrador(grupo.id)}>
                    <Trash2 className="h-3 w-3 text-text-muted" />
                  </Button>
                </div>
              </div>

              {/* Subgrupos */}
              {gruposPorPadre(grupo.id).length > 0 && (
                <div className="ml-6 border-l border-gold-200 pl-4 mt-2">
                  {gruposPorPadre(grupo.id).map((sub) => (
                    <div key={sub.id} className="mb-3 pl-2">
                      <div className="flex items-center gap-2 mb-1">
                        <ChevronRight className="h-4 w-4 text-text-muted" />
                        <input
                          type="text"
                          value={sub.nombre}
                          onChange={(e) => {
                            setBorrador((prev) => ({
                              ...prev,
                              grupos: prev.grupos.map((g) => (g.id === sub.id ? { ...g, nombre: e.target.value } : g)),
                            }))
                          }}
                          className="border border-border-subtle bg-bg-raised px-2 py-1 text-sm text-text-heading focus:outline-none focus:border-gold-400 w-full"
                        />
                      </div>
                      {itemsDeGrupo(sub.id).map((it) => (
                        <div key={it.id} className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-text-muted">•</span>
                          <input
                            type="text"
                            value={it.nombrePersonalizado}
                            onChange={(e) => {
                              setBorrador((prev) => ({
                                ...prev,
                                items: prev.items.map((i) => (i.id === it.id ? { ...i, nombrePersonalizado: e.target.value } : i)),
                              }))
                            }}
                            placeholder="Ítem..."
                            className="border border-border-subtle bg-bg-raised px-2 py-1 text-sm text-text-heading focus:outline-none focus:border-gold-400 flex-1"
                          />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={it.precioUnitario}
                            onChange={(e) => {
                              setBorrador((prev) => ({
                                ...prev,
                                items: prev.items.map((i) => (i.id === it.id ? { ...i, precioUnitario: e.target.value } : i)),
                              }))
                            }}
                            placeholder="0"
                            className="border border-border-subtle bg-bg-raised px-2 py-1 text-sm text-text-heading focus:outline-none focus:border-gold-400 w-20"
                          />
                          <Button variant="ghost" size="sm" onClick={() => eliminarItemBorrador(it.id)}>
                            <Trash2 className="h-3 w-3 text-text-muted" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" className="mt-1" onClick={() => agregarItem(sub.id)}>
                        <Plus className="h-3 w-3" /> Ítem
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Ítems directos del grupo */}
              {itemsDeGrupo(grupo.id).length > 0 && (
                <div className="ml-6 border-l border-gold-200 pl-4 mt-2">
                  {itemsDeGrupo(grupo.id).map((it) => (
                    <div key={it.id} className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-text-muted">•</span>
                      <input
                        type="text"
                        value={it.nombrePersonalizado}
                        onChange={(e) => {
                          setBorrador((prev) => ({
                            ...prev,
                            items: prev.items.map((i) => (i.id === it.id ? { ...i, nombrePersonalizado: e.target.value } : i)),
                          }))
                        }}
                        placeholder="Ítem..."
                        className="border border-border-subtle bg-bg-raised px-2 py-1 text-sm text-text-heading focus:outline-none focus:border-gold-400 flex-1"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={it.precioUnitario}
                        onChange={(e) => {
                          setBorrador((prev) => ({
                            ...prev,
                            items: prev.items.map((i) => (i.id === it.id ? { ...i, precioUnitario: e.target.value } : i)),
                          }))
                        }}
                        placeholder="0"
                        className="border border-border-subtle bg-bg-raised px-2 py-1 text-sm text-text-heading focus:outline-none focus:border-gold-400 w-20"
                      />
                      <Button variant="ghost" size="sm" onClick={() => eliminarItemBorrador(it.id)}>
                        <Trash2 className="h-3 w-3 text-text-muted" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button variant="ghost" size="sm" className="mt-1" onClick={() => agregarItem(grupo.id)}>
                <Plus className="h-3 w-3" /> Ítem
              </Button>
            </div>
          ))}

          {/* Ítems sueltos (sin grupo) */}
          {itemsDeGrupo(null).length > 0 && (
            <div className="mt-4 border-t pt-3">
              <h5 className="text-xs font-semibold text-text-muted mb-2">Ítems sin grupo</h5>
              {itemsDeGrupo(null).map((it) => (
                <div key={it.id} className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-text-muted">•</span>
                  <input
                    type="text"
                    value={it.nombrePersonalizado}
                    onChange={(e) => {
                      setBorrador((prev) => ({
                        ...prev,
                        items: prev.items.map((i) => (i.id === it.id ? { ...i, nombrePersonalizado: e.target.value } : i)),
                      }))
                    }}
                    placeholder="Ítem..."
                    className="border border-border-subtle bg-bg-raised px-2 py-1 text-sm text-text-heading focus:outline-none focus:border-gold-400 flex-1"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={it.precioUnitario}
                    onChange={(e) => {
                      setBorrador((prev) => ({
                        ...prev,
                        items: prev.items.map((i) => (i.id === it.id ? { ...i, precioUnitario: e.target.value } : i)),
                      }))
                    }}
                    placeholder="0"
                    className="border border-border-subtle bg-bg-raised px-2 py-1 text-sm text-text-heading focus:outline-none focus:border-gold-400 w-20"
                  />
                  <Button variant="ghost" size="sm" onClick={() => eliminarItemBorrador(it.id)}>
                    <Trash2 className="h-3 w-3 text-text-muted" />
                  </Button>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="mt-1" onClick={() => agregarItem(null)}>
                <Plus className="h-3 w-3" /> Ítem suelto
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" size="md" onClick={onClose} disabled={guardando || cargando}>
          Cancelar
        </Button>
        <Button variant="primary" size="md" onClick={guardar} disabled={guardando || cargando || !borrador.nombre.trim()}>
          {guardando ? 'Guardando...' : borrador.id ? 'Actualizar plantilla' : 'Crear plantilla'}
        </Button>
      </div>
    </Modal>
  )
}
