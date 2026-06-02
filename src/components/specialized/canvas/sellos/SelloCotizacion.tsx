'use client'
import { Check, Lock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { EspacioVariantesRecord } from '@/generated/agnostic-schemas'
import type { SelloStatus } from './SelloDiseno'

interface SelloCotizacionProps {
  status: SelloStatus
  expanded: boolean
  onToggle: () => void
  cotizacionId: string
  espacios: EspacioVariantesRecord[]
}

export default function SelloCotizacion({ status, expanded, onToggle, cotizacionId, espacios }: SelloCotizacionProps) {
  const activeEspacios = espacios.filter(e => e.data.activa !== false)

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
          <span className="font-medium text-sm">Cotización</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{activeEspacios.length} espacios</span>
          {status !== 'locked' && (expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
        </div>
      </button>

      {expanded && status !== 'locked' && (
        <div className="border-t px-4 pb-4 pt-3">
          {activeEspacios.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Sin espacios cotizados.</p>
          ) : (
            <Accordion type="multiple" className="w-full mb-3">
              {activeEspacios.map(espacio => (
                <AccordionItem key={espacio.id} value={espacio.id}>
                  <AccordionTrigger className="text-sm py-2">
                    <span>{espacio.data.nombre_espacio}</span>
                    {espacio.data.nombre_variante && (
                      <span className="text-xs text-muted-foreground ml-2">— {espacio.data.nombre_variante}</span>
                    )}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="text-xs text-muted-foreground flex gap-4">
                      {espacio.data.jornadas_desarrollo_tecnico != null && (
                        <span>Técnico: {espacio.data.jornadas_desarrollo_tecnico}j</span>
                      )}
                      {espacio.data.jornadas_ensamblaje_taller != null && (
                        <span>Ensamble: {espacio.data.jornadas_ensamblaje_taller}j</span>
                      )}
                      {espacio.data.jornadas_instalacion_obra != null && (
                        <span>Instalación: {espacio.data.jornadas_instalacion_obra}j</span>
                      )}
                    </div>
                    {espacio.data.notas_markdown && (
                      <p className="text-xs mt-1 text-muted-foreground">{espacio.data.notas_markdown}</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => window.open('/app/quoting', '_blank')}
          >
            <ExternalLink size={12} className="mr-1" />
            Abrir cotizador completo
          </Button>
        </div>
      )}
    </div>
  )
}
