'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import type { BlockProps, DataItem } from '@agnostic/core'
import { useProjectData } from './useProjectData'
import { useRelationData } from '@/lib/agnostic/hooks/useRelationData'
import { toast } from 'sonner'
import {
  FileText,
  User,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Play,
  Pause,
  Plus,
  Trash2,
  ListTodo,
  Info,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Save,
  Wrench,
  Palette,
  Layers,
  Paperclip,
  Check,
  ClipboardList
} from 'lucide-react'

interface FichaProduccionProps extends BlockProps {
  forcedCotizacionId?: string
}

export default function FichaProduccion({ block, activeRecord, forcedCotizacionId }: FichaProduccionProps) {
  // 1. Resolve active cotizacion ID
  const cotizacionId = useMemo(() => {
    return forcedCotizacionId || activeRecord?.id || (block as any)?.config?.cotizacionId || ''
  }, [forcedCotizacionId, activeRecord, block])

  // 2. Fetch primary project data using the pre-existing hook
  const { data: projectData, isLoading: loadingProject, refresh } = useProjectData(cotizacionId, !!cotizacionId)

  // 3. Fetch secondary data for items, catalog, and clients
  const [items, setItems] = useState<any[]>([])
  const [catalogo, setCatalogo] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [loadingSecondary, setLoadingSecondary] = useState(true)

  const fetchSecondaryData = useCallback(async () => {
    setLoadingSecondary(true)
    try {
      const [resItems, resCat, resCli] = await Promise.all([
        fetch('/api/vault?namespace=items_variante'),
        fetch('/api/vault?namespace=productos_catalogo'),
        fetch('/api/vault?namespace=clientes')
      ])
      const [dataItems, dataCat, dataCli] = await Promise.all([
        resItems.json(),
        resCat.json(),
        resCli.json()
      ])
      setItems(dataItems.records ?? [])
      setCatalogo(dataCat.records ?? [])
      setClientes(dataCli.records ?? [])
    } catch (e) {
      console.error('Error loading secondary data:', e)
    } finally {
      setLoadingSecondary(false)
    }
  }, [])

  useEffect(() => {
    if (cotizacionId) {
      fetchSecondaryData()
    }
  }, [cotizacionId, fetchSecondaryData])

  // 4. Local state for editing
  const [orderNotes, setOrderNotes] = useState('')
  const [showNewTaskForm, setShowNewTaskForm] = useState(false)
  const [newTaskName, setNewTaskName] = useState('')
  const [newTaskOperario, setNewTaskOperario] = useState('')
  const [newTaskNotes, setNewTaskNotes] = useState('')
  
  // Accordion/collapsible states
  const [apoyoExpanded, setApoyoExpanded] = useState(true)

  // Active Work Order
  const activeOrder = useMemo(() => {
    return projectData.ordenes[0] || null
  }, [projectData.ordenes])

  // Sync order notes when loaded
  useEffect(() => {
    if (activeOrder?.data?.notas) {
      setOrderNotes(activeOrder.data.notas)
    }
  }, [activeOrder])

  // Resolve client information
  const activeCotizacion = useMemo(() => {
    if (!cotizacionId) return null
    // We can fetch from allQuotes, but since we have useProjectData, we can resolve it.
    // However, we can also query the cotizacion details directly if needed.
    // Let's assume we can fetch the cotizaciones to get the name and cliente_id.
    return activeRecord?.id === cotizacionId ? activeRecord : null
  }, [activeRecord, cotizacionId])

  // Alternatively, let's load all cotizaciones to resolve active cotización data
  const { data: allQuotes } = useRelationData('cotizaciones')
  const cotizacionDetails = useMemo(() => {
    const q = (allQuotes as any[])?.find(x => x.id === cotizacionId)
    return q ? q.data : null
  }, [allQuotes, cotizacionId])

  const clientDetails = useMemo(() => {
    if (!cotizacionDetails?.cliente_id) return null
    const c = clientes.find(x => x.id === cotizacionDetails.cliente_id)
    return c ? c.data : null
  }, [clientes, cotizacionDetails])

  // 5. Action Handlers
  const handleUpdateOrderStatus = async (newStatus: string) => {
    if (!activeOrder) return
    const toastId = toast.loading('Actualizando estado de la orden...')
    try {
      const response = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'WRITE',
          namespace: 'ordenes_trabajo',
          record: {
            id: activeOrder.id,
            data: {
              ...activeOrder.data,
              estado: newStatus
            }
          }
        })
      })
      if (!response.ok) throw new Error('Error al actualizar el estado')
      toast.success('Estado de la orden actualizado con éxito')
      refresh()
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    } finally {
      toast.dismiss(toastId)
    }
  }

  const handleSaveOrderNotes = async () => {
    if (!activeOrder) return
    const toastId = toast.loading('Guardando notas...')
    try {
      const response = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'WRITE',
          namespace: 'ordenes_trabajo',
          record: {
            id: activeOrder.id,
            data: {
              ...activeOrder.data,
              notas: orderNotes
            }
          }
        })
      })
      if (!response.ok) throw new Error('Error al guardar las notas')
      toast.success('Notas guardadas')
      refresh()
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    } finally {
      toast.dismiss(toastId)
    }
  }

  const handleUpdateTaskStatus = async (task: any, newStatus: string) => {
    const toastId = toast.loading('Actualizando tarea...')
    try {
      const response = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'WRITE',
          namespace: 'tareas_produccion',
          record: {
            id: task.id,
            data: {
              ...task.data,
              estado: newStatus
            }
          }
        })
      })
      if (!response.ok) throw new Error('Error al actualizar la tarea')
      toast.success(`Tarea marked as ${newStatus}`)
      refresh()
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    } finally {
      toast.dismiss(toastId)
    }
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeOrder) return
    if (!newTaskName.trim()) {
      toast.error('El nombre de la tarea es obligatorio')
      return
    }

    const toastId = toast.loading('Añadiendo tarea...')
    try {
      const response = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'WRITE',
          namespace: 'tareas_produccion',
          record: {
            id: crypto.randomUUID(),
            data: {
              orden_trabajo_id: activeOrder.id,
              nombre_tarea: newTaskName,
              estado: 'pendiente',
              operario_id: newTaskOperario || null,
              notas: newTaskNotes || null
            }
          }
        })
      })
      if (!response.ok) throw new Error('Error al crear la tarea')
      toast.success('Tarea añadida con éxito')
      setNewTaskName('')
      setNewTaskOperario('')
      setNewTaskNotes('')
      setShowNewTaskForm(false)
      refresh()
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    } finally {
      toast.dismiss(toastId)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta tarea de producción?')) return
    const toastId = toast.loading('Eliminando tarea...')
    try {
      const response = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REMOVE',
          namespace: 'tareas_produccion',
          id: taskId
        })
      })
      if (!response.ok) throw new Error('Error al eliminar la tarea')
      toast.success('Tarea eliminada')
      refresh()
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    } finally {
      toast.dismiss(toastId)
    }
  }

  // Calculate task progress percentage
  const taskProgress = useMemo(() => {
    const tasks = projectData.tareas
    if (!tasks.length) return 0
    const completed = tasks.filter(t => t.data.estado === 'completada').length
    return Math.round((completed / tasks.length) * 100)
  }, [projectData.tareas])

  // Group items by space variants
  const activeSpacesWithMaterials = useMemo(() => {
    return projectData.espacios.map(space => {
      const spaceItems = items.filter(it => it.data.variante_id === space.id)
      const resolvedItems = spaceItems.map(it => {
        const prod = catalogo.find(p => p.id === it.data.catalogo_id)
        return {
          id: it.id,
          cantidad: it.data.cantidad,
          unidad_medida: it.data.unidad_medida || prod?.data?.unidad_medida || 'unidad',
          descripcion: prod?.data?.descripcion || 'Insumo no encontrado',
          sku: prod?.data?.sku || 'S/N'
        }
      })

      // Resolve colors if any
      let parsedColors: any[] = []
      if (space.data.colores) {
        try {
          parsedColors = JSON.parse(space.data.colores)
        } catch (e) {
          // Fallback if not stringified JSON array
        }
      }

      return {
        ...space,
        resolvedItems,
        colors: parsedColors
      }
    })
  }, [projectData.espacios, items, catalogo])

  const isLoading = loadingProject || loadingSecondary

  if (!cotizacionId) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-stone-500 bg-white rounded-3xl border border-stone-200 shadow-sm">
        <AlertCircle size={48} className="text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-stone-800">Ficha de Producción Inactiva</h2>
        <p className="text-sm text-stone-400 mt-2">Esta vista requiere un identificador de proyecto o cotización válido en la URL.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-stone-400 bg-stone-50/50 rounded-3xl border border-stone-100">
        <Clock size={36} className="animate-spin text-amber-600 mb-3" />
        <span className="text-xs uppercase tracking-widest font-semibold">Cargando Ficha Técnica de Producción...</span>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* 1. TOP HEADER & BACK NAVIGATION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <a
            href="/app/production"
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:shadow-sm transition-all"
            title="Volver a Producción"
          >
            <ArrowLeft size={18} />
          </a>
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
              Módulo de Taller y Carpintería
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
              Ficha de Fabricación
            </h1>
          </div>
        </div>
        
        {/* Quick Progress Badge */}
        {activeOrder && (
          <div className="bg-white border border-stone-200 rounded-2xl p-3 flex items-center gap-4 shadow-sm self-start md:self-auto">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-stone-800">{taskProgress}%</span>
            </div>
            <div>
              <p className="text-xs text-stone-400 font-medium">Progreso General</p>
              <h4 className="text-sm font-bold text-stone-800">
                {projectData.tareas.filter(t => t.data.estado === 'completada').length} de {projectData.tareas.length} Tareas
              </h4>
            </div>
          </div>
        )}
      </div>

      {/* 2. MAIN DETAILS HERO CARD */}
      <div className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-stone-950 text-white rounded-3xl p-6 md:p-8 shadow-xl">
        {/* Background decorative graphic */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
          <Wrench size={320} />
        </div>
        
        <div className="relative z-10 grid md:grid-cols-3 gap-6 md:gap-8 divide-y md:divide-y-0 md:divide-x divide-stone-700/60">
          
          {/* Section A: Project & Client */}
          <div className="space-y-4 pr-2">
            <div className="flex items-center gap-2">
              <FileText className="text-amber-500 shrink-0" size={20} />
              <span className="text-xs font-bold text-stone-400 tracking-wider uppercase">Proyecto Activo</span>
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight leading-tight">
                {cotizacionDetails?.nombre_proyecto || 'Sin Nombre de Proyecto'}
              </h2>
              {clientDetails && (
                <div className="flex items-center gap-1.5 mt-2 text-stone-300 text-sm">
                  <User size={14} className="text-stone-400" />
                  <span>{clientDetails.nombre}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section B: Delivery & Logistics */}
          <div className="space-y-4 pt-4 md:pt-0 md:pl-8 pr-2">
            <div className="flex items-center gap-2">
              <MapPin className="text-amber-500 shrink-0" size={20} />
              <span className="text-xs font-bold text-stone-400 tracking-wider uppercase font-semibold">Ubicación y Fechas</span>
            </div>
            <div className="space-y-2 text-sm text-stone-200">
              <p className="flex items-start gap-1.5 leading-snug">
                <span className="font-semibold text-white">Dirección:</span>{' '}
                {cotizacionDetails?.direccion_obra || 'No registrada'}
              </p>
              {activeOrder?.data?.fecha_entrega && (
                <p className="flex items-center gap-1.5 mt-1 text-amber-400 font-medium">
                  <Calendar size={14} />
                  <span>Entrega Estimada: {activeOrder.data.fecha_entrega}</span>
                </p>
              )}
            </div>
          </div>

          {/* Section C: Work Order State Editor */}
          <div className="space-y-4 pt-4 md:pt-0 md:pl-8">
            <div className="flex items-center gap-2">
              <ClipboardList className="text-amber-500 shrink-0" size={20} />
              <span className="text-xs font-bold text-stone-400 tracking-wider uppercase">Control de Orden</span>
            </div>
            
            {activeOrder ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-stone-400 font-semibold mb-1.5">Estado de Fabricación</label>
                  <select
                    value={activeOrder.data.estado || 'pendiente'}
                    onChange={(e) => handleUpdateOrderStatus(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_proceso">En Proceso</option>
                    <option value="instalacion">Instalación</option>
                    <option value="entregada">Entregada</option>
                    <option value="garantia">Garantía / Reclamación</option>
                  </select>
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-400 font-medium">
                  <span>Código OT:</span>
                  <span className="font-mono bg-stone-800 text-stone-200 px-1.5 py-0.5 rounded border border-stone-700">
                    {activeOrder.data.codigo_orden}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-stone-800/40 rounded-xl p-3 border border-stone-700/50 text-xs text-stone-400 flex items-center gap-2">
                <AlertCircle size={14} className="text-amber-500 shrink-0" />
                <span>No se ha generado orden de trabajo para este proyecto aún.</span>
              </div>
            )}
          </div>
          
        </div>
      </div>

      {/* 3. DOUBLE COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: ACTIVE SPACES & MATERIALS (2 cols on large screen) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
              <Layers size={18} className="text-stone-500" />
              Espacios y Especificaciones de Armado
            </h3>
            <span className="text-xs text-stone-400 font-semibold">
              {activeSpacesWithMaterials.length} Espacio(s) Activo(s)
            </span>
          </div>

          {activeSpacesWithMaterials.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-3xl p-8 text-center text-stone-400 text-sm">
              No hay variantes o espacios activos registrados en la cotización.
            </div>
          ) : (
            <div className="space-y-6">
              {activeSpacesWithMaterials.map((space) => {
                const devJornadas = space.data.jornadas_desarrollo_tecnico ?? 0
                const talJornadas = space.data.jornadas_ensamblaje_taller ?? 0
                const instJornadas = space.data.jornadas_instalacion_obra ?? 0
                return (
                  <div
                    key={space.id}
                    className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden hover:shadow-md transition-all"
                  >
                    {/* Space Header Banner */}
                    <div className="bg-stone-50 border-b border-stone-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-stone-900 text-base flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                          {space.data.nombre_espacio}
                        </h4>
                        <p className="text-xs text-stone-400 font-semibold mt-0.5">
                          Variante Activa: {space.data.nombre_variante || 'Inicial'}
                        </p>
                      </div>
                      
                      {/* Labor days summary badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {devJornadas > 0 && (
                          <span className="text-[10px] font-bold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md border border-stone-200">
                            Dev: {devJornadas}d
                          </span>
                        )}
                        {talJornadas > 0 && (
                          <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md border border-blue-100">
                            Taller: {talJornadas}d
                          </span>
                        )}
                        {instJornadas > 0 && (
                          <span className="text-[10px] font-bold bg-purple-50 text-purple-600 px-2 py-0.5 rounded-md border border-purple-100">
                            Instalación: {instJornadas}d
                          </span>
                        )}
                      </div>
                    </div>

                  <div className="p-6 space-y-5">
                    {/* Space description */}
                    {space.data.descripcion && (
                      <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 text-xs text-stone-600">
                        <span className="font-bold block text-stone-700 mb-1">Notas de Diseño:</span>
                        {space.data.descripcion}
                      </div>
                    )}

                    {/* Color Swatches */}
                    {space.colors && space.colors.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-stone-500 uppercase tracking-wide flex items-center gap-1.5">
                          <Palette size={14} className="text-stone-400" />
                          Colores y Texturas
                        </span>
                        <div className="flex items-center gap-4 flex-wrap">
                          {space.colors.map((color: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg p-1.5 pr-3">
                              {color.imagen_url ? (
                                <img
                                  src={color.imagen_url}
                                  alt={color.nombre}
                                  className="w-7 h-7 rounded-md object-cover border border-stone-300"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-md bg-stone-200 border border-stone-300 flex items-center justify-center text-[10px] font-bold text-stone-500 uppercase">
                                  {color.nombre?.slice(0, 2)}
                                </div>
                              )}
                              <span className="text-xs font-semibold text-stone-700">{color.nombre}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Materials List */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-stone-500 uppercase tracking-wide flex items-center gap-1.5">
                        <Wrench size={14} className="text-stone-400" />
                        Lista de Materiales y Dimensiones
                      </span>
                      
                      {space.resolvedItems.length === 0 ? (
                        <p className="text-xs text-stone-400 italic">No hay insumos o materiales registrados para este espacio.</p>
                      ) : (
                        <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100">
                          {space.resolvedItems.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between p-3.5 hover:bg-stone-50/50 transition-colors text-sm">
                              <div className="font-semibold text-stone-800">
                                {item.descripcion}
                                <span className="block text-[10px] text-stone-400 font-mono mt-0.5">
                                  SKU: {item.sku}
                                </span>
                              </div>
                              <div className="bg-stone-100 text-stone-700 px-3 py-1 rounded-full text-xs font-bold border border-stone-200/50 shrink-0">
                                {item.cantidad} {item.unidad_medida}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            </div>
          )}

          {/* APOYO TECNICO VISITS & PHOTOS (COLLAPSIBLE) */}
          <div className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden">
            <button
              onClick={() => setApoyoExpanded(!apoyoExpanded)}
              className="w-full flex items-center justify-between px-6 py-4 bg-stone-50 border-b border-stone-200 text-left hover:bg-stone-100/60 transition-colors"
            >
              <div>
                <h3 className="font-bold text-stone-800 text-base flex items-center gap-2">
                  <Paperclip size={18} className="text-stone-500" />
                  Apoyo Técnico, Retoma y Visitas de Obra
                </h3>
                <p className="text-xs text-stone-400 font-semibold mt-0.5">
                  Diagramas de diseño, fotos de obra y visitas técnicas
                </p>
              </div>
              {apoyoExpanded ? <ChevronUp size={18} className="text-stone-500" /> : <ChevronDown size={18} className="text-stone-500" />}
            </button>

            {apoyoExpanded && (
              <div className="p-6 space-y-6">
                {projectData.apoyo.length === 0 ? (
                  <p className="text-sm text-stone-400 italic text-center py-4">No hay registros de visitas o apoyo técnico para esta obra.</p>
                ) : (
                  <div className="space-y-6 divide-y divide-stone-100">
                    {projectData.apoyo.map((apoyoItem, idx) => (
                      <div key={apoyoItem.id} className={`pt-6 ${idx === 0 ? 'pt-0' : ''} space-y-4`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                              {apoyoItem.data.tipo_recurso}
                            </span>
                            {apoyoItem.data.fecha_visita && (
                              <span className="text-xs text-stone-500 font-medium flex items-center gap-1">
                                <Calendar size={12} />
                                Visita: {apoyoItem.data.fecha_visita}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Visit notes */}
                        {apoyoItem.data.notas && (
                          <div className="text-sm text-stone-600 bg-stone-50 p-4 rounded-2xl border border-stone-100 whitespace-pre-line leading-relaxed">
                            <span className="font-bold text-stone-700 block mb-1">Notas de Visita:</span>
                            {apoyoItem.data.notas}
                          </div>
                        )}

                        {/* Requirements Checklist */}
                        {apoyoItem.data.lista_requisitos && (
                          <div className="space-y-2">
                            <span className="text-xs font-bold text-stone-500 uppercase tracking-wide block">
                              Requisitos de Obra
                            </span>
                            <div className="text-sm text-stone-700 border border-stone-200 rounded-2xl p-4 bg-white whitespace-pre-wrap leading-relaxed font-mono text-xs">
                              {apoyoItem.data.lista_requisitos}
                            </div>
                          </div>
                        )}

                        {/* Image attachment */}
                        {apoyoItem.data.imagen_url && (
                          <div className="space-y-2">
                            <span className="text-xs font-bold text-stone-500 uppercase tracking-wide block">
                              Imagen / Croquis / Diagrama
                            </span>
                            <div className="border border-stone-200 rounded-2xl overflow-hidden max-w-lg">
                              <img
                                src={apoyoItem.data.imagen_url}
                                alt="Apoyo técnico"
                                className="w-full h-auto object-contain bg-stone-50 max-h-[300px]"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: WORKSHOP TASKS & COMMENTS (1 col) */}
        <div className="space-y-6">
          
          {/* PRODUCTION TASKS ACCORDION */}
          <div className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="bg-stone-50 border-b border-stone-200 px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-stone-800 text-base flex items-center gap-2">
                <ListTodo size={18} className="text-stone-500" />
                Tareas de Taller y Armado
              </h3>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                {projectData.tareas.length} Tareas
              </span>
            </div>

            <div className="p-6 space-y-4">
              
              {/* Add Task Button */}
              {activeOrder && (
                <button
                  onClick={() => setShowNewTaskForm(!showNewTaskForm)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 border-2 border-dashed border-stone-200 text-stone-500 hover:border-amber-500 hover:text-amber-600 rounded-xl text-xs font-bold transition-all"
                >
                  <Plus size={14} />
                  {showNewTaskForm ? 'Cancelar' : 'Añadir Tarea de Producción'}
                </button>
              )}

              {/* Add Task Form */}
              {showNewTaskForm && activeOrder && (
                <form onSubmit={handleAddTask} className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Nombre de la Tarea *</label>
                    <input
                      type="text"
                      placeholder="Ej. Corte de tableros, Canto PVC, Armado"
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      className="w-full text-xs bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Operario</label>
                      <input
                        type="text"
                        placeholder="Nombre"
                        value={newTaskOperario}
                        onChange={(e) => setNewTaskOperario(e.target.value)}
                        className="w-full text-xs bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Notas</label>
                    <textarea
                      placeholder="Detalles adicionales..."
                      rows={2}
                      value={newTaskNotes}
                      onChange={(e) => setNewTaskNotes(e.target.value)}
                      className="w-full text-xs bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-stone-900 text-white py-1.5 rounded-lg text-xs font-bold hover:bg-stone-800 transition-colors flex items-center justify-center gap-1"
                  >
                    <Save size={12} /> Guardar Tarea
                  </button>
                </form>
              )}

              {/* Tasks List */}
              {projectData.tareas.length === 0 ? (
                <div className="text-center py-6 text-stone-400 text-xs italic">
                  No hay tareas añadidas a esta orden de trabajo aún.
                </div>
              ) : (
                <div className="space-y-3">
                  {projectData.tareas.map((task) => (
                    <div
                      key={task.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        task.data.estado === 'completada'
                          ? 'bg-stone-50/50 border-stone-200 opacity-60'
                          : 'bg-white border-stone-200 shadow-sm hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <h4 className={`text-xs font-bold text-stone-800 ${task.data.estado === 'completada' ? 'line-through text-stone-400' : ''}`}>
                            {task.data.nombre_tarea}
                          </h4>
                          {task.data.operario_id && (
                            <span className="text-[10px] text-stone-400 font-semibold flex items-center gap-1">
                              <User size={10} /> Operario: {task.data.operario_id}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-stone-300 hover:text-red-500 p-1 rounded-md transition-colors shrink-0"
                          title="Eliminar tarea"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      {task.data.notas && (
                        <p className="text-[10px] text-stone-500 mt-2 bg-stone-50 p-2 rounded border border-stone-100">
                          {task.data.notas}
                        </p>
                      )}

                      {/* Task Quick Controls */}
                      <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-stone-100">
                        {/* Status Badge */}
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          task.data.estado === 'completada' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          task.data.estado === 'en_progreso' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          task.data.estado === 'pausada' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-stone-100 text-stone-600 border border-stone-200'
                        }`}>
                          {task.data.estado || 'pendiente'}
                        </span>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5">
                          {task.data.estado !== 'en_progreso' && task.data.estado !== 'completada' && (
                            <button
                              onClick={() => handleUpdateTaskStatus(task, 'en_progreso')}
                              className="bg-stone-100 hover:bg-stone-200 text-stone-700 p-1 rounded-lg text-[10px] font-bold flex items-center gap-0.5"
                              title="Iniciar tarea"
                            >
                              <Play size={10} /> Iniciar
                            </button>
                          )}
                          {task.data.estado === 'en_progreso' && (
                            <button
                              onClick={() => handleUpdateTaskStatus(task, 'pausada')}
                              className="bg-amber-100 hover:bg-amber-200 text-amber-800 p-1 rounded-lg text-[10px] font-bold flex items-center gap-0.5"
                              title="Pausar"
                            >
                              <Pause size={10} /> Pausar
                            </button>
                          )}
                          {task.data.estado !== 'completada' && (
                            <button
                              onClick={() => handleUpdateTaskStatus(task, 'completada')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-0.5"
                              title="Completar"
                            >
                              <Check size={10} /> Completar
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>

          {/* ADVANCE NOTES FROM WORKSHOP */}
          {activeOrder && (
            <div className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="bg-stone-50 border-b border-stone-200 px-6 py-4 flex items-center gap-2">
                <Info size={18} className="text-stone-500" />
                <h3 className="font-bold text-stone-800 text-base">
                  Notas de Avance de Fabricación
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <textarea
                  rows={4}
                  placeholder="Escribe aquí notas sobre avances, dificultades, o herrajes pendientes..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full text-xs bg-stone-50 border border-stone-200 rounded-2xl p-3 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none text-stone-700 leading-relaxed"
                />
                <button
                  onClick={handleSaveOrderNotes}
                  className="w-full bg-stone-900 text-white py-2 rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Save size={14} /> Guardar Notas de Avance
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  )
}
