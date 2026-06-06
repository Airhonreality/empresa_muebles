'use client'
/**
 * PhaseQuoting — Fase de Cotización Comercial.
 *
 * Embebe directamente el componente CotizadorPro en modo proyecto,
 * eliminando la duplicidad e ineficiencia del formulario rápido de mentiras.
 */
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'
import type { EspacioVariantesRecord } from '@/generated/agnostic-schemas'
import type { ConfirmConfig } from '../ConfirmActionDialog'
import CotizadorPro from '@/components/specialized/cotizador/CotizadorPro'

interface PhaseQuotingProps {
  cotizacionId: string
  espacios: EspacioVariantesRecord[] // Se mantiene por compatibilidad de firma con el padre, pero opera a nivel de Zustand
  isCurrentPhase: boolean
  onRefresh: () => void
  onRequestConfirm: (config: ConfirmConfig) => void
  zapBusy: string | null
}

export default function PhaseQuoting({
  cotizacionId, isCurrentPhase, onRefresh, onRequestConfirm, zapBusy,
}: PhaseQuotingProps) {

  return (
    <div className="flex flex-col gap-5 h-full min-h-[550px] relative">
      
      {/* Header */}
      <div className="flex justify-between items-start gap-4 shrink-0 border-b pb-3.5">
        <div>
          <h2 className="text-lg font-bold">Lienzo de Cotización Comercial</h2>
          <p className="text-xs text-muted-foreground">Configura los espacios del mobiliario, asigna ítems y estima jornadas técnicas reales.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"
            className="text-xs h-9 border-primary/20 text-primary hover:bg-primary/5 font-semibold"
            onClick={() => window.open(`/app/quoting/${cotizacionId}`, '_blank')}>
            <ExternalLink size={12} className="mr-1.5" /> Abrir Pantalla Completa
          </Button>
          {isCurrentPhase && (
            <Button size="sm" disabled={!!zapBusy} className="h-9" onClick={() => onRequestConfirm({
              title: 'Aprobar y Congelar Cotización',
              description: '¿Deseas congelar esta propuesta comercial? Se generará un snapshot inmutable y no podrás modificar los precios.',
              zap: 'aprobar_cotizacion',
              payload: { cotizacion_id: cotizacionId },
            })}>
              ✦ Congelar Propuesta
            </Button>
          )}
        </div>
      </div>

      {/* Embedded real configurator with absolute bottom/left/right coordinates within PhaseQuoting viewport */}
      <div className="flex-1 border rounded-xl overflow-hidden bg-card shadow-sm min-h-[480px] relative flex flex-col">
        <div className="flex-1 overflow-y-auto pb-20 custom-scrollbar">
          <CotizadorPro forcedCotizacionId={cotizacionId} />
        </div>
      </div>
    </div>
  )
}
