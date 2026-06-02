'use client'
import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, ChevronRight, LayoutList } from 'lucide-react'
import type { KanbanStage, KanbanRecord } from './KanbanCanvas'
import { STAGE_COLORS } from './KanbanCanvas'
import type { OrdenesTrabajoRecord, TareasProduccionRecord, CotizacionesRecord } from '@/generated/agnostic-schemas'
// Reuse existing ProjectDetails — cero duplicación
import ProjectDetails from '../ProjectDetails'

interface Props {
  record:    KanbanRecord
  stage:     KanbanStage
  onMove:    (newStage: string) => void
  nextStage: KanbanStage | null
  allStages: KanbanStage[]
  api?:      Record<string, unknown>
  tasks:     TareasProduccionRecord[]
  cotizacion?: CotizacionesRecord
  clientName: string
}

export default function ProductionCard({
  record, stage, onMove, nextStage, allStages,
  api, tasks, cotizacion, clientName,
}: Props) {
  const order  = record as unknown as OrdenesTrabajoRecord
  const [sheetOpen, setSheetOpen] = useState(false)
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

  return (
    <>
      <Card className="p-3 flex flex-col gap-2 hover:shadow-sm transition-shadow">
        {/* Top: order code + client */}
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight truncate">
            {order.data.codigo_orden}
          </p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{clientName}</p>
          {order.data.fecha_entrega && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Entrega: {order.data.fecha_entrega as string}
            </p>
          )}
        </div>

        {/* Progress */}
        {orderTasks.length > 0 && (
          <div className="flex items-center gap-2">
            <Progress value={progress} className="flex-1 h-1.5" />
            <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
              {completedCount}/{orderTasks.length}
            </span>
          </div>
        )}

        <Separator />

        {/* Stage badge + actions */}
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors hover:opacity-80 ${colors.badge}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                {stage.label}
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {allStages.filter(s => s.value !== stage.value).map(s => (
                <DropdownMenuItem key={s.value} onClick={() => onMove(s.value)}>
                  <span className={`w-2 h-2 rounded-full mr-2 ${STAGE_COLORS[s.color]?.dot}`} />
                  {s.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-1 ml-auto">
            {nextStage && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                title={`Avanzar a ${nextStage.label}`}
                onClick={() => onMove(nextStage.value)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              title="Ver detalle y tareas"
              onClick={() => setSheetOpen(true)}
            >
              <LayoutList className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Detail sheet — reusa ProjectDetails íntegro */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle className="text-base">
              {order.data.codigo_orden} — {clientName}
            </SheetTitle>
            {orderTasks.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <Progress value={progress} className="flex-1 h-1.5" />
                <span className="text-xs text-muted-foreground tabular-nums">
                  {completedCount}/{orderTasks.length} tareas
                </span>
              </div>
            )}
          </SheetHeader>
          <ProjectDetails
            order={order}
            tasks={orderTasks}
            api={api}
            direccion_obra={cotizacion?.data?.direccion_obra as string | undefined}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
