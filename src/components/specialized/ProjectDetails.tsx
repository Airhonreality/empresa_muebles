'use client'
import type { OrdenesTrabajoRecord, TareasProduccionRecord } from '@/generated/agnostic-schemas'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Copy, Eye } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import Viewer3DModal from './Viewer3DModal'

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

  const handleAction = async (zap: string, payload: Record<string, unknown>) => {
    if (!api) return
    await fetch('/api/engine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zap, payload }),
    })
  }

  const handleCopy = () => {
    if (direccion_obra) navigator.clipboard.writeText(direccion_obra)
  }

  return (
    <div className="grid md:grid-cols-2 gap-4 p-4">
      <Card className="p-4">
        <h4 className="font-semibold mb-2">Pendientes del Proyecto</h4>
        <Accordion type="multiple" className="w-full">
          {(tasks || []).map(task => (
            <AccordionItem value={task.id} key={task.id}>
              <AccordionTrigger>{task.data.nombre_tarea}</AccordionTrigger>
              <AccordionContent>
                <div className="flex justify-between items-center">
                    <Badge>{task.data.estado}</Badge>
                    <span className="text-sm">Operario: {task.data.operario_id}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{task.data.notas}</p>
                <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" onClick={() => handleAction('pausar_tarea', { tarea_id: task.id })}>Pausar</Button>
                    <Button size="sm" onClick={() => handleAction('finalizar_tarea', { tarea_id: task.id })}>Finalizar</Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>
      <Card className="p-4 flex flex-col gap-4">
        <h4 className="font-semibold">Información Ágil</h4>
        <div className="flex items-center justify-between">
          <span>Dirección del proyecto</span>
          <Button variant="ghost" size="icon" onClick={handleCopy}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Eye className="mr-2 h-4 w-4" /> Ver Modelo 3D
        </Button>
      </Card>
      <Viewer3DModal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        order={order} 
      />
    </div>
  )
}
