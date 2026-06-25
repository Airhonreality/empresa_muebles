'use client'

import React, { useState } from 'react'
import { CheckSquare, ListTodo, Plus, Loader2, Check } from 'lucide-react'
import { useRelationData } from '@/lib/agnostic/hooks/useRelationData'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Props {
  varianteId: string
}

export function ProjectTasksList({ varianteId }: Props) {
  const { data: tasks, mutate } = useRelationData('project_tasks')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const myTasks = tasks.filter(t => t.data.variante_id === varianteId)
  
  const completedTasks = myTasks.filter(t => t.data.estado === 'Completado')
  const pendingTasks = myTasks.filter(t => t.data.estado === 'Pendiente')

  const progress = myTasks.length === 0 ? 0 : Math.round((completedTasks.length / myTasks.length) * 100)

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    setIsAdding(true)
    const payload = {
      id: crypto.randomUUID(),
      data: {
        variante_id: varianteId,
        titulo: newTaskTitle.trim(),
        estado: 'Pendiente'
      }
    }

    try {
      await fetch('/api/vault?namespace=project_tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      setNewTaskTitle('')
      mutate()
    } catch {
      toast.error('Error al añadir requisito')
    } finally {
      setIsAdding(false)
    }
  }

  const handleToggleTask = async (task: any) => {
    const nextState = task.data.estado === 'Completado' ? 'Pendiente' : 'Completado'
    
    const payload = {
      ...task,
      data: { ...task.data, estado: nextState }
    }

    try {
      await fetch('/api/vault?namespace=project_tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      mutate()
    } catch {
      toast.error('Error al actualizar el estado')
    }
  }

  return (
    <div className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center border border-stone-200">
            <ListTodo size={14} className="text-stone-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-800">Lista de Requerimientos</h3>
            <p className="text-[10px] text-stone-500 font-medium">Requisitos del cliente en tiempo real</p>
          </div>
        </div>
        
        {myTasks.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-stone-500">{progress}%</span>
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto mb-4 min-h-[150px]">
          {myTasks.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-xs text-stone-400 italic">Sin tareas añadidas.</p>
            </div>
          ) : (
            <div className="space-y-1.5 pr-2">
              {[...pendingTasks, ...completedTasks].map((task) => {
                const isCompleted = task.data.estado === 'Completado'
                return (
                  <div 
                    key={task.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer group hover:bg-stone-50",
                      isCompleted ? "bg-stone-50/80 border-stone-100 opacity-75" : "bg-white border-stone-200 shadow-sm"
                    )}
                    onClick={() => handleToggleTask(task)}
                  >
                    <button 
                      className={cn(
                        "mt-0.5 shrink-0 h-5 w-5 rounded-md border flex items-center justify-center transition-colors",
                        isCompleted 
                          ? "bg-emerald-500 border-emerald-500 text-white" 
                          : "border-stone-300 text-transparent group-hover:border-emerald-500 group-hover:text-emerald-500/30"
                      )}
                    >
                      <Check size={12} strokeWidth={3} />
                    </button>
                    <p className={cn(
                      "text-xs leading-relaxed",
                      isCompleted ? "text-stone-400 line-through" : "text-stone-700 font-medium"
                    )}>
                      {task.data.titulo}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <form onSubmit={handleAddTask} className="pt-4 border-t border-stone-100">
          <div className="relative flex items-center">
            <input
              type="text"
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              placeholder="Añadir un ítem o requisito..."
              className="w-full pl-4 pr-12 py-3 text-xs bg-white border border-stone-200 rounded-2xl outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all shadow-sm"
              disabled={isAdding}
            />
            <button
              type="submit"
              disabled={!newTaskTitle.trim() || isAdding}
              className="absolute right-2 h-8 w-8 rounded-xl bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:hover:bg-amber-600"
            >
              {isAdding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={16} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
