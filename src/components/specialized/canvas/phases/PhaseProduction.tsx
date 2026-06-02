'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Lock, Check, Play, Loader2 } from 'lucide-react'
import { zapCall } from '@/lib/agnostic/vault-client'
import type { OrdenesTrabajoRecord, TareasProduccionRecord } from '@/generated/agnostic-schemas'
import type { ConfirmConfig } from '../ConfirmActionDialog'

interface PhaseProductionProps {
  cotizacionId: string
  ordenes: OrdenesTrabajoRecord[]
  tareas: TareasProduccionRecord[]
  isCurrentPhase: boolean
  onRefresh: () => void
  onRequestConfirm: (config: ConfirmConfig) => void
  zapBusy: string | null
}

export default function PhaseProduction({
  cotizacionId, ordenes, tareas, isCurrentPhase, onRefresh, onRequestConfirm, zapBusy,
}: PhaseProductionProps) {
  const [taskBusy, setTaskBusy] = useState<string | null>(null)

  const handleTaskAction = async (zap: string, task: TareasProduccionRecord) => {
    setTaskBusy(task.id)
    try { await zapCall(zap, { record: task }); onRefresh() }
    catch { /* toast handled by zapCall */ }
    finally { setTaskBusy(null) }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-lg font-bold">Producción en Taller</h2>
          <p className="text-xs text-muted-foreground">Gestiona órdenes de trabajo y tareas de operarios.</p>
        </div>
        {isCurrentPhase && (
          <Button size="sm" disabled={!!zapBusy} onClick={() => onRequestConfirm({
            title: 'Enviar a Fabricación',
            description: '¿Deseas crear la Orden de Trabajo técnica? Esto asignará tareas a los carpinteros.',
            zap: 'crear_orden_trabajo',
            payload: { cotizacion_id: cotizacionId },
          })}>
            ✦ Enviar a Producción
          </Button>
        )}
      </div>

      {ordenes.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-xs text-muted-foreground bg-muted/5 flex flex-col items-center gap-3">
          <Lock size={24} className="text-muted-foreground/60" />
          <p className="font-semibold text-foreground">Producción no iniciada.</p>
          <p>Disponible cuando se reciba el anticipo del pago inicial.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tareas Operativas</h4>
          {tareas.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-xs text-muted-foreground bg-muted/5">Sin tareas asignadas.</div>
          ) : (
            <Accordion type="multiple" className="w-full border rounded-xl overflow-hidden bg-card shadow-sm">
              {tareas.map(task => {
                const isBusy = taskBusy === task.id
                const isCompletada = task.data.estado === 'completada'
                return (
                  <AccordionItem value={task.id} key={task.id} className="border-b last:border-b-0 px-4">
                    <AccordionTrigger className="text-xs font-bold py-3 hover:no-underline">
                      <div className="flex justify-between items-center w-full gap-4 pr-3">
                        <span>{task.data.nombre_tarea as string}</span>
                        <Badge variant={isCompletada ? 'default' : 'secondary'} className={`text-[9px] uppercase border-none font-bold py-0.5 px-2 ${
                          isCompletada ? 'bg-green-100 text-green-700' :
                          task.data.estado === 'pausada' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>{task.data.estado as string}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 flex flex-col gap-2 pt-1 border-t border-dashed">
                      {task.data.notas && (
                        <p className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded border">{task.data.notas as string}</p>
                      )}
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1 gap-4">
                        <span>Asignado a: <strong className="text-foreground font-semibold">{task.data.operario_id as string || 'General'}</strong></span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="h-7 text-[10px] px-2.5 font-bold gap-1"
                            disabled={!!isBusy || task.data.estado === 'pausada'}
                            onClick={() => handleTaskAction('pausar_tarea', task)}>
                            {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play size={11} className="rotate-90" />} Pausar
                          </Button>
                          <Button size="sm" className="h-7 text-[10px] px-2.5 font-bold gap-1 bg-green-600 hover:bg-green-700 text-white"
                            disabled={!!isBusy || isCompletada}
                            onClick={() => handleTaskAction('finalizar_tarea', task)}>
                            {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check size={11} />} Finalizar
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          )}
        </div>
      )}
    </div>
  )
}
