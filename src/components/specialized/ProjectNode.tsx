'use client'
import type { BlockProps } from '@agnostic/core'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useMemo, useState } from 'react'
import { useRelationData } from '@/lib/agnostic/hooks/useRelationData'
import type { OrdenesTrabajoRecord, TareasProduccionRecord, ClientesRecord } from '@/generated/agnostic-schemas'
import ProjectDetails from './ProjectDetails'

export default function ProjectNode({ record }: { record: OrdenesTrabajoRecord }) {
  const { data: tasks } = useRelationData('tareas_produccion', {
    filter: { orden_trabajo_id: record.id }
  })
  const { data: client } = useRelationData('clientes', {
    id: record.data.cotizacion_id?.toString() 
  })

  const progress = useMemo(() => {
    if (!tasks || tasks.length === 0) return 0
    const completed = (tasks as TareasProduccionRecord[]).filter(t => t.data.estado === 'completada').length
    return (completed / tasks.length) * 100
  }, [tasks])

  const clientName = (client as ClientesRecord)?.data?.nombre || 'Cargando...'

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={record.id}>
        <AccordionTrigger>
          <Card className="w-full p-4 text-left">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">{record.data.codigo_orden} - {clientName}</h3>
              <span className="text-sm text-muted-foreground">{record.data.fecha_entrega}</span>
            </div>
            <Progress value={progress} className="mt-2" />
          </Card>
        </AccordionTrigger>
        <AccordionContent>
          <ProjectDetails order={record} tasks={tasks as TareasProduccionRecord[]} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
