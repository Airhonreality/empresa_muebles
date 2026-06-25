'use client'
import type { OrdenesTrabajoRecord, TareasProduccionRecord } from '@/generated/agnostic-schemas'
import { useMateriaStore } from '@/lib/agnostic/store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Copy, Eye, Loader2 } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { toast } from 'sonner'
import Viewer3DModal from './Viewer3DModal'
import SemaforoSuministrosBadge from './taller/SemaforoSuministrosBadge'


export default function ProjectDetails({
  order,
  tasks,
  api,
  direccion_obra,
}: {
  order: OrdenesTrabajoRecord
  tasks: TareasProduccionRecord[]
  api?: Record<string, unknown>
  direccion_obra?: string
}) {
  const [isModalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  // Mismo pattern que AgnosticAction.tsx — procesa materia_sync para actualizar store
  const handleAction = async (zap: string, payload: Record<string, unknown>) => {
    setLoading(zap)
    try {
      const res = await fetch('/api/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zap, payload }),
      })
      const { events = [] } = await res.json()
      for (const event of events) {
        if (event.action === 'materia_sync') {
          useMateriaStore.getState().updateItem(event.context, event.item)
        }
        if (event.action === 'notify') {
          event.type === 'success'
            ? toast.success(event.message)
            : toast.error(event.message)
        }
      }
    } catch {
      toast.error('Error al ejecutar la acción.')
    } finally {
      setLoading(null)
    }
  }

  const handleCopy = () => {
    if (direccion_obra) {
      navigator.clipboard.writeText(direccion_obra)
      toast.success('Dirección copiada.')
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex justify-between items-center border-b pb-2">
        <span className="font-bold text-base text-stone-700">Orden #{order.data?.codigo_orden || order.id?.substring(0,6)}</span>
        <SemaforoSuministrosBadge proyectoId={order.data?.cotizacion_id} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Columna 1: Pendientes del proyecto */}
        <Card className="p-4">
          <h4 className="font-semibold mb-2">Pendientes del Proyecto</h4>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin tareas registradas.</p>
          ) : (
            <Accordion type="multiple" className="w-full">
              {tasks.map(task => (
                <AccordionItem value={task.id} key={task.id}>
                  <AccordionTrigger className="text-sm">{task.data.nombre_tarea}</AccordionTrigger>
                  <AccordionContent>
                    <div className="flex justify-between items-center mb-2">
                      <Badge variant={task.data.estado === 'completada' ? 'default' : 'secondary'}>
                        {task.data.estado}
                      </Badge>
                      {task.data.operario_id && (
                        <span className="text-xs text-muted-foreground">
                          Operario: {task.data.operario_id}
                        </span>
                      )}
                    </div>
                    {task.data.notas && (
                      <p className="text-xs text-muted-foreground mb-3">{task.data.notas}</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!!loading || task.data.estado === 'pausada'}
                        onClick={() => handleAction('pausar_tarea', { record: task })}
                      >
                        {loading === 'pausar_tarea' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Pausar'}
                      </Button>
                      <Button
                        size="sm"
                        disabled={!!loading || task.data.estado === 'completada'}
                        onClick={() => handleAction('finalizar_tarea', { record: task })}
                      >
                        {loading === 'finalizar_tarea' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Finalizar'}
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </Card>

        {/* Columna 2: Información ágil */}
        <Card className="p-4 flex flex-col gap-4">
          <h4 className="font-semibold">Información Ágil</h4>
          <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50">
            <span className="text-sm truncate text-muted-foreground">
              {direccion_obra ?? 'Sin dirección registrada'}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              disabled={!direccion_obra}
              title="Copiar dirección"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setModalOpen(true)} className="w-full">
            <Eye className="mr-2 h-4 w-4" /> Ver Modelo 3D
          </Button>
        </Card>

        <Viewer3DModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          order={order}
        />
      </div>

    </div>
  )
}
