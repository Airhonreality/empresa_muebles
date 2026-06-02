'use client'
import { Check, Lock, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { OrdenesTrabajoRecord, TareasProduccionRecord } from '@/generated/agnostic-schemas'
import type { SelloStatus } from './SelloDiseno'

interface SelloProduccionProps {
  status: SelloStatus
  expanded: boolean
  onToggle: () => void
  ordenes: OrdenesTrabajoRecord[]
  tareas: TareasProduccionRecord[]
}

const ESTADO_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  completada:  'default',
  en_proceso:  'secondary',
  pausada:     'outline',
  pendiente:   'outline',
}

export default function SelloProduccion({ status, expanded, onToggle, ordenes, tareas }: SelloProduccionProps) {
  const summaryText = status === 'locked'
    ? 'pendiente anticipo'
    : ordenes.length > 0
      ? `${ordenes.length} OT · ${tareas.filter(t => t.data.estado === 'completada').length}/${tareas.length} tareas`
      : 'sin órdenes'

  return (
    <div className={[
      'border rounded-lg overflow-hidden',
      status === 'active'    && 'border-primary/60 bg-primary/[0.03]',
      status === 'completed' && 'border-border',
      status === 'locked'    && 'border-border opacity-60',
    ].filter(Boolean).join(' ')}>

      <button
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors disabled:cursor-not-allowed"
        onClick={onToggle}
        disabled={status === 'locked'}
      >
        <div className="flex items-center gap-2.5">
          {status === 'completed' && <Check size={15} className="text-green-500 shrink-0" />}
          {status === 'active'    && <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />}
          {status === 'locked'    && <Lock size={13} className="text-muted-foreground shrink-0" />}
          <span className="font-medium text-sm">Producción</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{summaryText}</span>
          {status !== 'locked' && (expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
        </div>
      </button>

      {expanded && status !== 'locked' && (
        <div className="border-t px-4 pb-4 pt-3">
          {ordenes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin órdenes de trabajo.</p>
          ) : (
            <Accordion type="multiple" className="w-full">
              {ordenes.map(orden => {
                const ordenTareas = tareas.filter(t => t.data.orden_trabajo_id === orden.id)
                const completadas = ordenTareas.filter(t => t.data.estado === 'completada').length

                return (
                  <AccordionItem key={orden.id} value={orden.id}>
                    <AccordionTrigger className="text-sm py-2">
                      <div className="flex items-center gap-2">
                        <span>{orden.data.codigo_orden}</span>
                        <Badge variant={ESTADO_VARIANT[orden.data.estado] ?? 'outline'} className="text-[10px]">
                          {orden.data.estado}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground ml-auto mr-2">
                        {completadas}/{ordenTareas.length} tareas
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      {ordenTareas.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Sin tareas.</p>
                      ) : (
                        <ul className="flex flex-col gap-1">
                          {ordenTareas.map(t => (
                            <li key={t.id} className="flex items-center gap-2 text-xs">
                              <span className={t.data.estado === 'completada' ? 'text-green-600' : 'text-muted-foreground'}>
                                {t.data.estado === 'completada' ? '✓' : '○'}
                              </span>
                              <span>{t.data.nombre_tarea}</span>
                              {t.data.estado !== 'completada' && (
                                <Badge variant="outline" className="text-[9px] ml-auto">{t.data.estado}</Badge>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                      {orden.data.fecha_entrega && (
                        <p className="text-xs text-muted-foreground mt-2">Entrega estimada: {orden.data.fecha_entrega}</p>
                      )}
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
