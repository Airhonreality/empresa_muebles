'use client'
import { Button } from '@/components/ui/button'
import { Award, Loader2 } from 'lucide-react'
import type { ConfirmConfig } from '../ConfirmActionDialog'

interface PhaseDeliveryProps {
  cotizacionId: string
  isCurrentPhase: boolean
  onRequestConfirm: (config: ConfirmConfig) => void
  zapBusy: string | null
}

export default function PhaseDelivery({
  cotizacionId, isCurrentPhase, onRequestConfirm, zapBusy,
}: PhaseDeliveryProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-lg font-bold">Entrega e Instalación</h2>
          <p className="text-xs text-muted-foreground">Formaliza el control de calidad y registra la entrega definitiva.</p>
        </div>
        {isCurrentPhase && (
          <Button size="sm" disabled={!!zapBusy} onClick={() => onRequestConfirm({
            title: 'Entregar y Cerrar Proyecto',
            description: '¿Confirmas la entrega a conformidad del mobiliario? Esto activará los plazos de garantía técnica.',
            zap: 'entregar_proyecto',
            payload: { cotizacion_id: cotizacionId },
          })}>
            {zapBusy === 'entregar_proyecto' && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
            ✦ Confirmar Entrega Final
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="border rounded-xl p-5 bg-muted/5 flex flex-col gap-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Checklist de Conformidad</h4>
          <div className="flex flex-col gap-3 text-xs">
            {[
              'Instalación y ensamble aplomado a muros.',
              'Calibración de bisagras y rieles deslizantes.',
              'Limpieza superficial de aserrines y lacados.',
              'Firma física de acta y entrega de llaves.',
            ].map((item, i) => (
              <label key={i} className="flex items-center gap-2.5 p-2 rounded-lg bg-card border shadow-sm">
                <input type="checkbox" defaultChecked={i < 3}
                  className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4" />
                <span className="font-semibold text-foreground/90">{item}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center items-center text-center p-8 bg-muted/5 rounded-xl border border-dashed gap-2">
          <Award size={36} className="text-primary" />
          <h4 className="text-sm font-bold mt-2">Cierre de Proyecto y Garantía</h4>
          <p className="text-xs text-muted-foreground max-w-xs">
            Una vez verificado el checklist y cobrado el saldo final, registra la entrega para activar la garantía.
          </p>
        </div>
      </div>
    </div>
  )
}
