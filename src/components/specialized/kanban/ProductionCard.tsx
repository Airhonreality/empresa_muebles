'use client'
import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, LayoutList, CheckSquare, Square, Loader2, MapPin, Calendar } from 'lucide-react'
import type { KanbanStage, KanbanRecord } from './KanbanCanvas'
import { STAGE_COLORS } from './KanbanCanvas'
import type { OrdenesTrabajoRecord, TareasProduccionRecord, ProyectosRecord } from '@/generated/agnostic-schemas'
import ProjectDetails from '../ProjectDetails'
import { toast } from 'sonner'
import { useMateriaStore } from '@/lib/agnostic/store'

interface Props {
  record:    KanbanRecord
  stage:     KanbanStage
  onMove:    (newStage: string) => void
  nextStage: KanbanStage | null
  allStages: KanbanStage[]
  api?:      Record<string, unknown>
  tasks:     TareasProduccionRecord[]
  proyecto?: ProyectosRecord
  clientName: string
}

async function updateTaskStatus(taskId: string, currentData: Record<string, unknown>, completed: boolean) {
  const nextEstado = completed ? 'completada' : 'pendiente'
  const res = await fetch('/api/vault', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'WRITE',
      namespace: 'tareas_produccion',
      record: { id: taskId, data: { ...currentData, estado: nextEstado } }
    }),
  })
  if (!res.ok) throw new Error(await res.text())
  const body = await res.json()
  return body.record ?? body
}

export default function ProductionCard({
  record, stage, onMove, nextStage, allStages,
  api, tasks, proyecto, clientName,
}: Props) {
  const order  = record as unknown as OrdenesTrabajoRecord
  const [dialogOpen, setDialogOpen] = useState(false)
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  
  const colors = STAGE_COLORS[stage.color] ?? STAGE_COLORS.slate

  const orderTasks = useMemo(
    () => tasks.filter(t => t.data.orden_trabajo_id === order.id),
    [tasks, order.id]
  )

  const progress = useMemo(() => {
    if (!orderTasks.length) return 0
    return (orderTasks.filter(t => t.data.estado === 'completada').length / orderTasks.length) * 100
  }, [orderTasks])

  const completedCount = orderTasks.filter(t => t.data.estado === 'completada').length

  const nextTwoTasks = useMemo(() => {
    const incomplete = orderTasks.filter(t => t.data.estado !== 'completada')
    if (incomplete.length >= 2) return incomplete.slice(0, 2)
    
    const completed = orderTasks.filter(t => t.data.estado === 'completada')
    return [...incomplete, ...completed].slice(0, 2)
  }, [orderTasks])

  const handleToggleTask = async (task: TareasProduccionRecord) => {
    const isCompleted = task.data.estado === 'completada'
    setUpdatingTaskId(task.id)
    try {
      const saved = await updateTaskStatus(task.id, task.data, !isCompleted)
      useMateriaStore.getState().updateItem('tareas_produccion', saved)
      toast.success(isCompleted ? 'Tarea marcada como pendiente' : 'Tarea completada con éxito')
    } catch (err) {
      toast.error('Error al actualizar la tarea.')
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const actionButton = useMemo(() => {
    switch (stage.value) {
      case 'pendiente':
        return { label: 'Iniciar Fabricación', nextVal: 'en_proceso', variant: 'default' as const, bg: 'bg-blue-600 hover:bg-blue-700 text-white' }
      case 'en_proceso':
        return { label: 'Iniciar Instalación', nextVal: 'instalacion', variant: 'default' as const, bg: 'bg-violet-600 hover:bg-violet-700 text-white' }
      case 'instalacion':
        return { label: 'Completar Entrega', nextVal: 'entregada', variant: 'default' as const, bg: 'bg-emerald-600 hover:bg-emerald-700 text-white' }
      default:
        return null
    }
  }, [stage.value])

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4">
        <div className="md:col-span-4 flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-bold tracking-tight text-stone-900 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
              {order.data.codigo_orden as string}
            </span>
            <Badge variant="outline" className={`text-2xs font-semibold uppercase px-2 py-0.2 ${colors.badge}`}>
              {stage.label}
            </Badge>
          </div>
          
          <h4 className="text-sm font-semibold text-stone-800 truncate mt-1">
            {proyecto?.data?.nombre_proyecto as string ?? 'Mobiliario'}
          </h4>
          <p className="text-xs text-stone-500 truncate">
            Cliente: <span className="font-medium text-stone-700">{clientName}</span>
          </p>

          <div className="flex flex-col gap-0.5 mt-1.5 text-2xs text-stone-400 font-mono">
            {proyecto?.data?.direccion_obra && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                {proyecto.data.direccion_obra as string}
              </span>
            )}
            {order.data.fecha_entrega && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 shrink-0" />
                {order.data.fecha_entrega as string}
              </span>
            )}
          </div>
        </div>

        <div className="md:col-span-5 flex flex-col gap-2.5">
          {orderTasks.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-2xs font-bold uppercase tracking-wider text-stone-450">
                Tareas Siguientes
              </span>
              <div className="flex flex-col gap-1">
                {nextTwoTasks.map(task => {
                  const isDone = task.data.estado === 'completada'
                  const isBusy = updatingTaskId === task.id
                  return (
                    <div 
                      key={task.id}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-all duration-200 ${
                        isDone 
                          ? 'bg-stone-50/70 border-stone-200/50 text-stone-400 line-through' 
                          : 'bg-white border-stone-200 hover:border-stone-300 text-stone-700'
                      }`}
                    >
                      <span className="truncate pr-2 font-medium">
                        {task.data.nombre_tarea as string}
                      </span>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleToggleTask(task)}
                        className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-stone-100/80 transition-colors focus:outline-none shrink-0"
                      >
                        {isBusy ? (
                          <Loader2 className="h-4 w-4 animate-spin text-stone-400" />
                        ) : isDone ? (
                          <CheckSquare className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <Square className="h-5 w-5 text-stone-400" />
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="py-2 text-stone-400 text-2xs uppercase tracking-wide">
              Sin tareas
            </div>
          )}

          {orderTasks.length > 0 && (
            <div className="flex items-center gap-2.5 pt-0.5">
              <Progress value={progress} className="flex-1 h-1.5 bg-stone-100" />
              <span className="text-2xs font-mono font-bold text-stone-500 shrink-0 select-none">
                {completedCount}/{orderTasks.length} ({Math.round(progress)}%)
              </span>
            </div>
          )}
        </div>

        <div className="md:col-span-3 flex items-center justify-end gap-2.5 w-full md:w-auto">
          {actionButton ? (
            <Button
              type="button"
              variant={actionButton.variant}
              className={`flex-1 md:flex-none h-11 text-xs font-semibold px-4 rounded-lg shadow-sm transition-all duration-200 hover:scale-[1.01] ${actionButton.bg}`}
              onClick={() => onMove(actionButton.nextVal)}
            >
              {actionButton.label}
            </Button>
          ) : (
            <div className="flex-1 md:flex-none py-2 text-right">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-2xs font-bold uppercase tracking-wider text-stone-500 border border-stone-200">
                Completada
              </span>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-lg border-stone-200 hover:bg-stone-50 shrink-0"
              >
                <ChevronDown className="h-4 w-4 text-stone-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {allStages.filter(s => s.value !== stage.value).map(s => (
                <DropdownMenuItem 
                  key={s.value} 
                  onClick={() => onMove(s.value)}
                  className="flex items-center gap-2 py-2 cursor-pointer text-xs"
                >
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${STAGE_COLORS[s.color]?.dot}`} />
                  {s.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-lg border-stone-200 hover:bg-stone-50 shrink-0"
            onClick={() => setDialogOpen(true)}
          >
            <LayoutList className="h-4.5 w-4.5 text-stone-600" />
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-6xl w-[92vw] max-h-[90vh] h-[85vh] overflow-hidden p-0 bg-white border-stone-200/80">
          <DialogHeader className="sr-only">
            <DialogTitle>Ficha de Producción {order.data.codigo_orden}</DialogTitle>
          </DialogHeader>
          <ProjectDetails
            order={order}
            tasks={orderTasks}
            api={api}
            direccion_obra={proyecto?.data?.direccion_obra as string | undefined}
            onClose={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
