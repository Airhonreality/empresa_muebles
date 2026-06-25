import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Circle, Clock, Plus, User as UserIcon } from 'lucide-react'
import type { TareasOperativasRecord, UsuariosEquipoRecord } from '@/generated/agnostic-schemas'

interface TimelineTareasProps {
  proyectoId: string
  faseActual?: string
}

export function TimelineTareas({ proyectoId, faseActual }: TimelineTareasProps) {
  const [tareas, setTareas] = useState<TareasOperativasRecord[]>([])
  const [usuarios, setUsuarios] = useState<UsuariosEquipoRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [nuevaTarea, setNuevaTarea] = useState('')

  const loadData = async () => {
    try {
      const [resTareas, resUsuarios] = await Promise.all([
        fetch('/api/vault?namespace=tareas_operativas'),
        fetch('/api/vault?namespace=usuarios_equipo')
      ])
      const [jsonTareas, jsonUsuarios] = await Promise.all([
        resTareas.json(),
        resUsuarios.json()
      ])
      const relacionadas = (jsonTareas.records || []).filter(
        (t: any) => t.data.proyecto_id === proyectoId
      )
      setTareas(relacionadas)
      setUsuarios(jsonUsuarios.records || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (proyectoId) loadData()
  }, [proyectoId])

  const toggleEstado = async (tarea: TareasOperativasRecord) => {
    const nuevoEstado = tarea.data.estado === 'Completada' ? 'Pendiente' : 'Completada'
    // Optimistic UI
    setTareas(prev => prev.map(t => 
      t.id === tarea.id ? { ...t, data: { ...t.data, estado: nuevoEstado } } : t
    ))
    try {
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'WRITE',
          namespace: 'tareas_operativas',
          record: {
            id: tarea.id,
            data: { ...tarea.data, estado: nuevoEstado }
          }
        })
      })
      if (!res.ok) throw new Error()
    } catch (e) {
      toast.error('Error al actualizar tarea')
      loadData() // Revert
    }
  }

  const crearTareaManual = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevaTarea.trim()) return
    const id = crypto.randomUUID()
    const nueva = {
      id,
      context: 'tareas_operativas',
      data: {
        proyecto_id: proyectoId,
        titulo: nuevaTarea,
        estado: 'Pendiente',
        departamento: 'Comercial', // Default,
        fase_kanban: faseActual || 'general'
      }
    }
    setTareas(prev => [...prev, nueva as any])
    setNuevaTarea('')
    try {
      await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'WRITE',
          namespace: 'tareas_operativas',
          record: nueva
        })
      })
    } catch (e) {
      toast.error('Error al crear tarea')
      loadData()
    }
  }

  if (loading) {
    return <div className="text-xs text-stone-400 p-4 animate-pulse">Cargando cronología...</div>
  }

  // Agrupar por fase kanban
  const agrupadas = tareas.reduce((acc, t) => {
    const fase = t.data.fase_kanban || 'General'
    if (!acc[fase]) acc[fase] = []
    acc[fase].push(t)
    return acc
  }, {} as Record<string, TareasOperativasRecord[]>)

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-stone-800 tracking-tight">Timeline Operativo</h3>
        <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400 bg-stone-100 px-2 py-1 rounded-md">
          {tareas.filter(t => t.data.estado === 'Completada').length} / {tareas.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        {Object.entries(agrupadas).map(([fase, lista]) => (
          <div key={fase} className="relative">
            <div className="text-[10px] uppercase font-black text-amber-600 tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              {fase.replace('_', ' ')}
            </div>
            
            <div className="space-y-2 pl-4 border-l-2 border-stone-100 ml-1">
              {lista.map(t => {
                const completada = t.data.estado === 'Completada'
                const assigneeId = (t.data as any).asignado_a
                const assigneeName = usuarios.find(u => u.id === assigneeId)?.data.nombre
                
                return (
                  <div key={t.id} 
                    className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors border border-transparent hover:border-stone-100 hover:bg-stone-50 ${completada ? 'opacity-60' : ''}`}
                  >
                    <button onClick={() => toggleEstado(t)} className="mt-0.5 shrink-0">
                      {completada ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-stone-300 hover:text-amber-500" />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${completada ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                        {t.data.titulo}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                        <span className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-500">
                          {t.data.departamento}
                        </span>
                        {assigneeName && (
                          <span className="flex items-center gap-1">
                            <UserIcon className="w-3 h-3" /> {assigneeName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {tareas.length === 0 && (
          <div className="text-center py-8 text-stone-400 text-xs italic">
            No hay tareas programadas para este proyecto aún.
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-stone-100">
        <form onSubmit={crearTareaManual} className="relative">
          <input
            type="text"
            value={nuevaTarea}
            onChange={e => setNuevaTarea(e.target.value)}
            placeholder="Añadir tarea manual..."
            className="w-full text-xs p-2.5 pl-3 pr-10 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-700"
          />
          <button type="submit" disabled={!nuevaTarea.trim()}
            className="absolute right-1.5 top-1.5 p-1 bg-amber-100 text-amber-700 rounded-lg disabled:opacity-50 hover:bg-amber-200">
            <Plus className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
