'use client'

import { useState, useMemo, useEffect } from 'react'
import type { 
  OrdenesTrabajoRecord, 
  TareasProduccionRecord, 
  EspacioVariantesRecord, 
  ItemsVarianteRecord, 
  ProductosCatalogoRecord,
  UsuariosEquipoRecord
} from '@/generated/agnostic-schemas'
import { useRelationData } from '@/lib/agnostic/hooks/useRelationData'
import { useMateriaStore } from '@/lib/agnostic/store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Copy, 
  Eye, 
  Loader2, 
  Plus, 
  Wrench, 
  ClipboardCheck, 
  Image, 
  Trash2,
  Calendar,
  MapPin
} from 'lucide-react'
import { toast } from 'sonner'
import Viewer3DModal from './Viewer3DModal'
import SemaforoSuministrosBadge from './taller/SemaforoSuministrosBadge'
import { ApoyoTecnicoPanel } from './cotizador/ApoyoTecnicoPanel'

async function vaultWrite(namespace: string, id: string, data: Record<string, unknown>) {
  const res = await fetch('/api/vault', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'WRITE', namespace, record: { id, data } }),
  })
  if (!res.ok) throw new Error(await res.text())
  const body = await res.json()
  return body.record ?? body
}

export default function ProjectDetails({
  order,
  tasks,
  api,
  direccion_obra,
  onClose,
}: {
  order: OrdenesTrabajoRecord
  tasks: TareasProduccionRecord[]
  api?: Record<string, unknown>
  direccion_obra?: string
  onClose?: () => void
}) {
  const [is3DModalOpen, set3DModalOpen] = useState(false)
  const [loadingZap, setLoadingZap] = useState<boolean>(false)
  const [activeEspacioId, setActiveEspacioId] = useState<string | null>(null)
  
  // Estados para agregar item manual
  const [manualCatalogoId, setManualCatalogoId] = useState('')
  const [manualCantidad, setManualCantidad] = useState('1')
  const [manualPrecio, setManualPrecio] = useState('0')
  const [addingManual, setAddingManual] = useState(false)

  // Estado para agregar tarea rápida
  const [newTaskNombre, setNewTaskNombre] = useState('')
  const [addingTask, setAddingTask] = useState(false)

  // Carga de datos relacionales vía useRelationData para asegurar consistencia
  const { data: allEspacios,  isLoading: loadingEsp  } = useRelationData('espacio_variantes')
  const { data: allInsumos,   isLoading: loadingIns  } = useRelationData('items_variante')
  const { data: allCatalogo,  isLoading: loadingCat  } = useRelationData('productos_catalogo')
  const { data: allEquipo,    isLoading: loadingEq   } = useRelationData('usuarios_equipo')

  // Filtrar espacios activos del proyecto
  const proyectoEspacios = useMemo(() => {
    return (allEspacios as EspacioVariantesRecord[] || []).filter(
      ev => ev.data.proyecto_id === order.data.proyecto_id && ev.data.activa === true
    )
  }, [allEspacios, order.data.proyecto_id])

  // Seleccionar automáticamente el primer espacio al cargar
  useEffect(() => {
    if (proyectoEspacios.length && !activeEspacioId) {
      setActiveEspacioId(proyectoEspacios[0].id)
    }
  }, [proyectoEspacios, activeEspacioId])

  // Filtrar insumos del espacio seleccionado
  const espacioItems = useMemo(() => {
    if (!activeEspacioId) return []
    return (allInsumos as ItemsVarianteRecord[] || []).filter(
      item => item.data.variante_id === activeEspacioId
    )
  }, [allInsumos, activeEspacioId])

  // Mapa de productos del catálogo para resoluciones rápidas de SKU y Nombre
  const catalogoMap = useMemo(() => {
    const map: Record<string, ProductosCatalogoRecord> = {}
    for (const prod of (allCatalogo as ProductosCatalogoRecord[] || [])) {
      map[prod.id] = prod
    }
    return map
  }, [allCatalogo])

  // Operarios de taller
  const operariosList = useMemo(() => {
    return (allEquipo as UsuariosEquipoRecord[] || []).filter(
      u => u.data.rol === 'taller' || u.data.rol === 'operario' || !u.data.rol
    )
  }, [allEquipo])

  // Copiado rápido de dirección
  const handleCopyDireccion = () => {
    if (direccion_obra) {
      navigator.clipboard.writeText(direccion_obra)
      toast.success('Dirección copiada al portapapeles.')
    }
  }

  // Mutación en caliente del estado de la Orden de Trabajo
  const handleOrderStageChange = async (newStage: string) => {
    try {
      const saved = await vaultWrite('ordenes_trabajo', order.id, {
        ...order.data,
        estado: newStage
      })
      useMateriaStore.getState().updateItem('ordenes_trabajo', saved)
      toast.success(`Estado de la orden actualizado a: ${newStage}`)
    } catch {
      toast.error('Error al actualizar el estado de la orden.')
    }
  }

  // Mutación de notas de compra in-situ en el Grid Sheets
  const handleUpdateNotasCompra = async (itemId: string, itemData: Record<string, unknown>, newVal: string) => {
    try {
      const saved = await vaultWrite('items_variante', itemId, {
        ...itemData,
        notas_compra: newVal
      })
      useMateriaStore.getState().updateItem('items_variante', saved)
    } catch {
      toast.error('Error al actualizar las notas de compra.')
    }
  }

  // Alternar anulación de un material in-situ
  const handleToggleAnulado = async (itemId: string, itemData: Record<string, unknown>, currentVal: boolean) => {
    try {
      const saved = await vaultWrite('items_variante', itemId, {
        ...itemData,
        anulado: !currentVal
      })
      useMateriaStore.getState().updateItem('items_variante', saved)
      toast.success(!currentVal ? 'Insumo anulado de la producción' : 'Insumo restaurado')
    } catch {
      toast.error('Error al anular el insumo.')
    }
  }

  // Agregar insumo de taller manual
  const handleAddManualItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeEspacioId || !manualCatalogoId) return
    setAddingManual(true)
    try {
      const prod = catalogoMap[manualCatalogoId]
      const saved = await vaultWrite('items_variante', crypto.randomUUID(), {
        variante_id: activeEspacioId,
        catalogo_id: manualCatalogoId,
        cantidad: Number(manualCantidad) || 1,
        precio_unitario: Number(manualPrecio) || (prod ? Number(prod.data.precio_directo) : 0),
        notas_compra: 'Agregado manualmente en taller',
        anulado: false,
        compra_generada: false
      })
      useMateriaStore.getState().updateItem('items_variante', saved)
      toast.success('Insumo manual añadido al espacio.')
      setManualCatalogoId('')
      setManualCantidad('1')
      setManualPrecio('0')
    } catch {
      toast.error('Error al agregar el insumo.')
    } finally {
      setAddingManual(false)
    }
  }

  // Eliminar un insumo agregado manualmente
  const handleDeleteManualItem = async (itemId: string) => {
    try {
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE', namespace: 'items_variante', record: { id: itemId } }),
      })
      if (!res.ok) throw new Error()
      useMateriaStore.getState().removeItem('items_variante', itemId)
      toast.success('Insumo manual eliminado.')
    } catch {
      toast.error('Error al eliminar el insumo.')
    }
  }

  // Mutación en caliente de tareas de producción
  const handleUpdateTaskStatus = async (task: TareasProduccionRecord, newStatus: string) => {
    try {
      const saved = await vaultWrite('tareas_produccion', task.id, {
        ...task.data,
        estado: newStatus
      })
      useMateriaStore.getState().updateItem('tareas_produccion', saved)
      toast.success(`Tarea en estado: ${newStatus}`)
    } catch {
      toast.error('Error al actualizar la tarea.')
    }
  }

  // Asignar operario a la tarea
  const handleAssignOperario = async (task: TareasProduccionRecord, operarioId: string) => {
    try {
      const saved = await vaultWrite('tareas_produccion', task.id, {
        ...task.data,
        operario_id: operarioId || null
      })
      useMateriaStore.getState().updateItem('tareas_produccion', saved)
      toast.success('Operario asignado con éxito.')
    } catch {
      toast.error('Error al asignar el operario.')
    }
  }

  // Agregar tarea rápida de taller
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskNombre.trim()) return
    setAddingTask(true)
    try {
      const saved = await vaultWrite('tareas_produccion', crypto.randomUUID(), {
        orden_trabajo_id: order.id,
        nombre_tarea: newTaskNombre.trim(),
        estado: 'pendiente',
        operario_id: null,
        notas: 'Agregada en taller'
      })
      useMateriaStore.getState().updateItem('tareas_produccion', saved)
      toast.success('Tarea rápida agregada.')
      setNewTaskNombre('')
    } catch {
      toast.error('Error al crear la tarea.')
    } finally {
      setAddingTask(false)
    }
  }

  // Ejecución del Zap de Compra consolidada de este proyecto
  const handleGenerarOrdenCompra = async () => {
    setLoadingZap(true)
    try {
      const res = await fetch('/api/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zap: 'zap_generar_orden_compra',
          payload: { proyecto_id: order.data.proyecto_id }
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const body = await res.json()
      
      // Sincronizar store local si el motor devuelve eventos
      if (body.events) {
        for (const ev of body.events) {
          if (ev.action === 'materia_sync') {
            useMateriaStore.getState().updateItem(ev.context, ev.item)
          }
        }
      }
      toast.success('¡Órdenes de compra y obligaciones generadas con éxito!')
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar la orden de compra.')
    } finally {
      setLoadingZap(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden rounded-xl border border-stone-200 shadow-lg">
      
      {/* HEADER PERSISTENTE (Contexto de Obra) */}
      <div className="bg-stone-50 border-b border-stone-200 p-5 md:p-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-stone-850 tracking-tight">
                Orden #{order.data.codigo_orden || order.id.slice(0, 6)}
              </span>
              <SemaforoSuministrosBadge proyectoId={order.data.proyecto_id} />
            </div>
            <p className="text-xs text-stone-400 font-medium">Ficha Técnica de Fabricación e Insumos</p>
          </div>

          {/* Selector de Estado OT */}
          <div className="flex items-center gap-2">
            <span className="text-2xs font-bold uppercase tracking-wider text-stone-450">Fase Taller:</span>
            <select
              value={order.data.estado as string}
              onChange={(e) => handleOrderStageChange(e.target.value)}
              className="h-10 px-3 rounded-lg border-2 border-stone-200 bg-white text-xs font-bold text-stone-700 outline-none focus:border-amber-500"
            >
              <option value="pendiente">Pendiente</option>
              <option value="en_proceso">En Proceso</option>
              <option value="instalacion">Instalación</option>
              <option value="entregada">Entregada</option>
              <option value="garantia">Garantía</option>
            </select>
          </div>
        </div>

        {/* Metadatos Rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-600 bg-white p-3 rounded-lg border border-stone-200/60 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="h-4 w-4 text-stone-450 shrink-0" />
            <span className="truncate">{direccion_obra || 'Sin dirección de obra registrada'}</span>
            {direccion_obra && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyDireccion}
                className="h-7 w-7 text-stone-400 hover:text-stone-700 hover:bg-stone-50 shrink-0"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-500 shrink-0" />
            <span>Entrega Estimada: <strong className="text-stone-850 font-bold">{order.data.fecha_entrega as string || '—'}</strong></span>
          </div>
        </div>
      </div>

      {/* SELECTOR DE TABS */}
      <Tabs defaultValue="insumos" className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-stone-200 bg-stone-50/50 px-5">
          <TabsList className="bg-transparent p-0 gap-6 h-12">
            <TabsTrigger 
              value="insumos" 
              className="relative h-12 rounded-none bg-transparent border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent data-[state=active]:text-stone-900 text-xs font-bold text-stone-500 transition-all p-0"
            >
              <ClipboardCheck className="h-4 w-4 mr-2" /> Planilla e Insumos
            </TabsTrigger>
            <TabsTrigger 
              value="tareas" 
              className="relative h-12 rounded-none bg-transparent border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent data-[state=active]:text-stone-900 text-xs font-bold text-stone-500 transition-all p-0"
            >
              <Wrench className="h-4 w-4 mr-2" /> Tareas de Taller
            </TabsTrigger>
            <TabsTrigger 
              value="apoyo" 
              className="relative h-12 rounded-none bg-transparent border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent data-[state=active]:text-stone-900 text-xs font-bold text-stone-500 transition-all p-0"
            >
              <Image className="h-4 w-4 mr-2" /> Fotos y Obra
            </TabsTrigger>
          </TabsList>
        </div>

        {/* CONTENIDOS FLUIDOS */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 bg-stone-50/10">
          
          {/* PESTAÑA 1: PLANILLAS E INSUMOS */}
          <TabsContent value="insumos" className="m-0 space-y-6 outline-none">
            
            {/* Visualización 3D y Control de Espacios */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
              {/* Selector de Espacio */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-500">Espacio:</span>
                <select
                  value={activeEspacioId || ''}
                  onChange={(e) => setActiveEspacioId(e.target.value)}
                  className="h-10 px-3 rounded-lg border-2 border-stone-200 bg-white text-xs font-bold text-stone-700 outline-none focus:border-amber-500"
                >
                  {proyectoEspacios.map((esp) => (
                    <option key={esp.id} value={esp.id}>
                      {esp.data.nombre_espacio} - {esp.data.nombre_variante}
                    </option>
                  ))}
                  {proyectoEspacios.length === 0 && (
                    <option value="">Sin espacios activos</option>
                  )}
                </select>
              </div>

              {/* Botón 3D */}
              <Button
                type="button"
                className="h-11 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-sm px-4 rounded-lg shrink-0 flex items-center justify-center"
                onClick={() => set3DModalOpen(true)}
              >
                <Eye className="h-4 w-4 mr-2" /> Ver Despiece 3D
              </Button>
            </div>

            {/* Planilla Grid Insumos */}
            <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <div className="overflow-x-auto min-h-[220px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="p-3 sticky left-0 bg-stone-50 border-r border-stone-150 z-20">Descripción / Insumo</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3 text-right">Cant.</th>
                      <th className="p-3 text-right">Unidad</th>
                      <th className="p-3">Especificación de Compra / Armado</th>
                      <th className="p-3 text-center w-16">Anular</th>
                      <th className="p-3 text-center w-12">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {espacioItems.map((item) => {
                      const prod = catalogoMap[item.data.catalogo_id as string]
                      const isManual = item.data.notas_compra === 'Agregado manualmente en taller'
                      return (
                        <tr 
                          key={item.id}
                          className={`border-b border-stone-100 hover:bg-stone-50/50 transition-colors ${
                            item.data.anulado ? 'bg-red-50/30 text-stone-400 line-through' : ''
                          }`}
                        >
                          {/* Descripción Sticky */}
                          <td className={`p-3 sticky left-0 bg-white border-r border-stone-150 font-medium font-sans z-10 ${
                            item.data.anulado ? 'bg-red-50/10' : ''
                          }`}>
                            {prod?.data?.descripcion || 'Material General'}
                          </td>
                          <td className="p-3 font-mono text-[10px] text-stone-400">
                            {prod?.data?.sku || 'GENÉRICO'}
                          </td>
                          <td className="p-3 text-right font-semibold font-mono text-stone-700">
                            {item.data.cantidad as number}
                          </td>
                          <td className="p-3 text-right text-stone-400 font-mono">
                            {item.data.unidad_medida as string || 'un'}
                          </td>
                          {/* Especificación de Compra */}
                          <td className="p-3">
                            <input
                              type="text"
                              value={item.data.notas_compra as string || ''}
                              onChange={(e) => handleUpdateNotasCompra(item.id, item.data, e.target.value)}
                              placeholder="Notas de herraje, corte, color..."
                              disabled={!!item.data.anulado}
                              className="w-full h-8 px-2 rounded border border-stone-200 text-xs focus:border-amber-500 focus:outline-none bg-stone-50/40 focus:bg-white"
                            />
                          </td>
                          {/* Anulación Checkbox */}
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={!!item.data.anulado}
                              onChange={() => handleToggleAnulado(item.id, item.data, !!item.data.anulado)}
                              className="h-4.5 w-4.5 rounded border-stone-300 accent-amber-500 cursor-pointer"
                            />
                          </td>
                          {/* Borrar manual */}
                          <td className="p-3 text-center">
                            {isManual ? (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteManualItem(item.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            ) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                    {espacioItems.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-stone-400 italic">
                          Sin materiales registrados en este espacio.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Agregar Insumo Manual de Taller */}
            {activeEspacioId && (
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
                <h5 className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <Plus className="h-4 w-4 text-amber-500" /> Añadir Material Faltante (Manual)
                </h5>
                <form onSubmit={handleAddManualItem} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-bold text-stone-500 uppercase">Seleccionar del Catálogo</label>
                    <select
                      value={manualCatalogoId}
                      onChange={(e) => setManualCatalogoId(e.target.value)}
                      required
                      className="w-full h-10 px-3 rounded-lg border border-stone-200 bg-white text-xs text-stone-750 outline-none focus:border-amber-500"
                    >
                      <option value="">-- Buscar insumo --</option>
                      {allCatalogo?.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.data.sku} - {p.data.descripcion}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      value={manualCantidad}
                      onChange={(e) => setManualCantidad(e.target.value)}
                      required
                      className="w-full h-10 px-3 rounded-lg border border-stone-200 text-xs text-center font-bold"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={addingManual}
                    className="h-10 bg-stone-900 hover:bg-stone-850 text-white font-bold text-xs"
                  >
                    {addingManual ? 'Añadiendo...' : 'Añadir Insumo'}
                  </Button>
                </form>
              </div>
            )}

            {/* Botón de Envío Financiero */}
            <div className="flex justify-end pt-2 border-t border-stone-200">
              <Button
                type="button"
                onClick={handleGenerarOrdenCompra}
                disabled={loadingZap || espacioItems.length === 0}
                className="h-12 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm px-6 rounded-xl shadow"
              >
                {loadingZap ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generando Compra...
                  </>
                ) : (
                  '⚡ Generar Orden de Compra'
                )}
              </Button>
            </div>
          </TabsContent>

          {/* PESTAÑA 2: TAREAS DE TALLER */}
          <TabsContent value="tareas" className="m-0 space-y-6 outline-none">
            
            {/* Agregar Tarea Rápida */}
            <div className="bg-white p-4 border border-stone-200 rounded-xl shadow-2xs space-y-3">
              <h5 className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-amber-500" /> Crear Tarea Rápida de Taller
              </h5>
              <form onSubmit={handleAddTask} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Ej: Pintado de tapacantos, Perforaciones especiales..."
                  value={newTaskNombre}
                  onChange={(e) => setNewTaskNombre(e.target.value)}
                  className="flex-1 h-10 px-3 rounded-lg border border-stone-200 text-xs outline-none focus:border-amber-500"
                  required
                />
                <Button
                  type="submit"
                  disabled={addingTask}
                  className="h-10 bg-stone-900 hover:bg-stone-850 text-white font-bold text-xs px-4"
                >
                  {addingTask ? 'Creando...' : 'Crear Tarea'}
                </Button>
              </form>
            </div>

            {/* Listado de Tareas */}
            <div className="space-y-3">
              {tasks.length === 0 ? (
                <div className="text-center p-8 bg-white border border-stone-200 rounded-xl italic text-stone-400 text-xs">
                  Sin tareas operativas registradas para esta orden de trabajo.
                </div>
              ) : (
                tasks.map((task) => (
                  <Card key={task.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-stone-200 shadow-2xs">
                    
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-stone-800 truncate">
                          {task.data.nombre_tarea}
                        </span>
                        <Badge 
                          variant={task.data.estado === 'completada' ? 'default' : 'secondary'}
                          className="text-[10px] font-mono px-2 py-0.2"
                        >
                          {task.data.estado}
                        </Badge>
                      </div>
                      {task.data.notas && (
                        <p className="text-[11px] text-stone-400 truncate">{task.data.notas}</p>
                      )}
                    </div>

                    {/* Asignación de Operario y Controles */}
                    <div className="flex flex-wrap items-center gap-3">
                      
                      {/* Dropdown Operario */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-stone-450 uppercase">Asignar:</span>
                        <select
                          value={task.data.operario_id as string || ''}
                          onChange={(e) => handleAssignOperario(task, e.target.value)}
                          className="h-9 px-2 rounded-lg border border-stone-200 bg-white text-[11px] font-bold text-stone-600 outline-none focus:border-amber-500"
                        >
                          <option value="">-- Sin asignar --</option>
                          {operariosList.map(op => (
                            <option key={op.id} value={op.id}>
                              {op.data.nombre}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Botones de Control de Estado de Tarea */}
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={task.data.estado === 'en_progreso'}
                          onClick={() => handleUpdateTaskStatus(task, 'en_progreso')}
                          className="h-8 text-[10px] font-bold hover:bg-stone-50"
                        >
                          Iniciar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={task.data.estado === 'pausada'}
                          onClick={() => handleUpdateTaskStatus(task, 'pausada')}
                          className="h-8 text-[10px] font-bold hover:bg-stone-50"
                        >
                          Pausar
                        </Button>
                        <Button
                          size="sm"
                          disabled={task.data.estado === 'completada'}
                          onClick={() => handleUpdateTaskStatus(task, 'completada')}
                          className="h-8 text-[10px] font-bold bg-stone-900 text-white hover:bg-stone-850"
                        >
                          Completar
                        </Button>
                      </div>

                    </div>
                  </Card>
                ))
              )}
            </div>

          </TabsContent>

          {/* PESTAÑA 3: APOYO TÉCNICO Y CHECKLIST */}
          <TabsContent value="apoyo" className="m-0 outline-none">
            <ApoyoTecnicoPanel proyectoId={order.data.proyecto_id as string} />
          </TabsContent>

        </div>
      </Tabs>

      {/* Visor 3D Modal */}
      <Viewer3DModal
        isOpen={is3DModalOpen}
        onClose={() => set3DModalOpen(false)}
        order={order}
      />
    </div>
  )
}
