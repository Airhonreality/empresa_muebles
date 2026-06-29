'use client'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useMemo, useState } from 'react'
import type { OrdenesTrabajoRecord, TareasProduccionRecord, ProyectosRecord } from '@/generated/agnostic-schemas'
import ProjectDetails from './ProjectDetails'

interface Props {
  record: OrdenesTrabajoRecord
  api?: Record<string, unknown>
  allTasks: TareasProduccionRecord[]
  proyecto?: ProyectosRecord
  clientName: string
}

export default function ProjectNode({ record, api, allTasks, proyecto, clientName }: Props) {
  const [expanded, setExpanded] = useState(false)

  // Filtrado local — no hay hooks de datos aquí
  const tasks = useMemo(
    () => allTasks.filter(t => t.data.orden_trabajo_id === record.id),
    [allTasks, record.id]
  )

  const progress = useMemo(() => {
    if (!tasks.length) return 0
    const completed = tasks.filter(t => t.data.estado === 'completada').length
    return (completed / tasks.length) * 100
  }, [tasks])

  return (
    <Accordion
      type="single"
      collapsible
      className="w-full"
      onValueChange={v => setExpanded(!!v)}
    >
      <AccordionItem value={record.id}>
        <AccordionTrigger className="hover:no-underline p-0">
          <Card className="w-full p-4 text-left">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">{record.data.codigo_orden} — {clientName}</h3>
              <span className="text-xs text-muted-foreground shrink-0 ml-2">{record.data.fecha_entrega}</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={progress} className="flex-1 h-1.5" />
              <span className="text-xs text-muted-foreground w-10 text-right">
                {tasks.filter(t => t.data.estado === 'completada').length}/{tasks.length}
              </span>
            </div>
          </Card>
        </AccordionTrigger>
        <AccordionContent>
          {/* Lazy mount: ProjectDetails (y su Viewer3DModal) solo se monta al expandir */}
          {expanded && (
            <ProjectDetails
              order={record}
              tasks={tasks}
              api={api}
              direccion_obra={proyecto?.data?.direccion_obra as string | undefined}
            />
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
