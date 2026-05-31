'use client'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useMemo } from 'react'
import { useRelationData } from '@/lib/agnostic/hooks/useRelationData'
import type { OrdenesTrabajoRecord, TareasProduccionRecord, ClientesRecord, CotizacionesRecord } from '@/generated/agnostic-schemas'
import ProjectDetails from './ProjectDetails'

export default function ProjectNode({ record, api }: { record: OrdenesTrabajoRecord, api?: Record<string, unknown> }) {
  const { data: allTasks } = useRelationData('tareas_produccion')
  const { data: allClients } = useRelationData('clientes')
  const { data: allQuotes } = useRelationData('cotizaciones')

  const tasks = useMemo(
    () => (allTasks as TareasProduccionRecord[]).filter(t => t.data.orden_trabajo_id === record.id),
    [allTasks, record.id]
  )

  const cotizacion = useMemo(
    () => (allQuotes as CotizacionesRecord[]).find(q => q.id === record.data.cotizacion_id),
    [allQuotes, record.data.cotizacion_id]
  )

  const clientName = useMemo(() => {
    if (!cotizacion) return 'Cargando...'
    const client = (allClients as ClientesRecord[]).find(c => c.id === cotizacion.data.cliente_id)
    return client?.data?.nombre ?? cotizacion.data.nombre_proyecto
  }, [cotizacion, allClients])

  const progress = useMemo(() => {
    if (!tasks.length) return 0
    const completed = tasks.filter(t => t.data.estado === 'completada').length
    return (completed / tasks.length) * 100
  }, [tasks])

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
          <ProjectDetails
            order={record}
            tasks={tasks}
            api={api}
            direccion_obra={cotizacion?.data?.direccion_obra as string | undefined}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
