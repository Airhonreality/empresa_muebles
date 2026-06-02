'use client'
/**
 * ProjectCanvas — Overlay Dialog de gran formato.
 *
 * Orquestador ligero: solo maneja layout, stepper y routing de fases.
 * Cada fase vive en su propio sub-componente en ./phases/.
 * Los datos se obtienen vía useProjectData (Zustand cache).
 * Las confirmaciones críticas usan ConfirmActionDialog (reutilizable).
 */
import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { X, Check, Lock, Camera, Ruler, BookOpen, DollarSign, Hammer, Award } from 'lucide-react'
import { toast } from 'sonner'
import { zapCall } from '@/lib/agnostic/vault-client'
import ConfirmActionDialog, { type ConfirmConfig } from './ConfirmActionDialog'
import type { CotizacionesRecord } from '@/generated/agnostic-schemas'

// Phase sub-components
import PhaseDesign     from './phases/PhaseDesign'
import PhaseQuoting    from './phases/PhaseQuoting'
import PhaseContract   from './phases/PhaseContract'
import PhasePayments   from './phases/PhasePayments'
import PhaseProduction from './phases/PhaseProduction'
import PhaseDelivery   from './phases/PhaseDelivery'

// Data hook
import { useProjectData } from './useProjectData'

// ─── Domain constants ─────────────────────────────────────────────────────────

const ESTADO_TO_FASE: Record<string, number> = {
  activa: 0, enviada: 1, en_contrato: 2,
  pre_produccion: 3, produccion: 4, entregada: 5,
}

const ESTADO_LABEL: Record<string, string> = {
  activa: 'Activa', enviada: 'Propuesta enviada', en_contrato: 'En contrato',
  pre_produccion: 'Pre-producción', produccion: 'En producción', entregada: 'Entregada',
}

interface PhaseDefinition {
  index: number
  key: string
  label: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
}

const PHASES: PhaseDefinition[] = [
  { index: 0, key: 'diseno',     label: 'Diseño Comercial',     subtitle: 'Fotos, diagramas y notas de obra',   icon: Camera },
  { index: 1, key: 'cotizacion', label: 'Cotización Comercial', subtitle: 'Configurar ambientes e insumos',     icon: Ruler },
  { index: 2, key: 'contrato',   label: 'Contrato Legal',       subtitle: 'Cláusulas, plazos y pliego técnico', icon: BookOpen },
  { index: 3, key: 'pagos',      label: 'Control de Pagos',     subtitle: 'Registro de anticipos y cuotas',     icon: DollarSign },
  { index: 4, key: 'produccion', label: 'Producción en Taller', subtitle: 'Órdenes de trabajo y operarios',     icon: Hammer },
  { index: 5, key: 'entrega',    label: 'Entrega en Obra',      subtitle: 'Conformidad e instalación final',    icon: Award },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProjectCanvasProps {
  cotizacion: CotizacionesRecord | null
  clientName: string
  open: boolean
  onClose: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjectCanvas({ cotizacion, clientName, open, onClose }: ProjectCanvasProps) {
  const [activePhase, setActivePhase]   = useState(0)
  const [zapBusy, setZapBusy]          = useState<string | null>(null)
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(null)

  const cotizId        = cotizacion?.id
  const currentFase    = ESTADO_TO_FASE[cotizacion?.data.estado ?? 'activa'] ?? 0
  const { data, isLoading, refresh } = useProjectData(cotizId, open)

  // Sync active phase with project state
  useEffect(() => {
    if (cotizacion) setActivePhase(currentFase)
  }, [cotizId, currentFase]) // eslint-disable-line react-hooks/exhaustive-deps

  const getSelloStatus = (idx: number) =>
    idx < currentFase ? 'completed' : idx === currentFase ? 'active' : 'locked'

  // Confirmation flow
  const handleConfirmExecute = useCallback(async () => {
    if (!confirmConfig) return
    setZapBusy(confirmConfig.zap)
    setConfirmConfig(null)
    try {
      await zapCall(confirmConfig.zap, confirmConfig.payload)
      refresh()
    } catch {
      toast.error('Error al ejecutar la acción.')
    } finally {
      setZapBusy(null)
    }
  }, [confirmConfig, refresh])

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <Dialog open={open} onOpenChange={v => !v && onClose()}>
        <DialogContent className="max-w-6xl w-[95vw] h-[85vh] p-0 flex flex-col overflow-hidden rounded-xl border bg-background shadow-2xl z-50">

          {/* Header */}
          <DialogHeader className="shrink-0 px-6 py-4 border-b flex flex-row items-center justify-between bg-muted/10 gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-xl font-bold tracking-tight">
                  {cotizacion?.data.nombre_proyecto ?? 'Proyecto'}
                </DialogTitle>
                <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 border-primary/20 bg-primary/5 text-primary">
                  {ESTADO_LABEL[cotizacion?.data.estado ?? ''] ?? 'Activa'}
                </Badge>
              </div>
              <DialogDescription className="text-xs mt-1 text-muted-foreground truncate">
                <span>Cliente: <strong className="text-foreground/90 font-medium">{clientName}</strong></span>
                {cotizacion?.data.direccion_obra && <span> · {cotizacion.data.direccion_obra as string}</span>}
                {data.contrato?.data.valor_total && (
                  <span> · <strong className="font-mono">${Number(data.contrato.data.valor_total).toLocaleString('es-CO')}</strong></span>
                )}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 rounded-lg" onClick={onClose}>
              <X size={18} />
            </Button>
          </DialogHeader>

          {/* Main layout */}
          <div className="flex-1 flex overflow-hidden">

            {/* LEFT: Phase Stepper */}
            <div className="w-80 border-r flex flex-col bg-muted/5 overflow-y-auto shrink-0 select-none">
              <div className="p-4 border-b bg-muted/10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Etapas del Proyecto</h3>
              </div>
              <nav className="flex-1 p-2 flex flex-col gap-1.5">
                {PHASES.map(phase => {
                  const status   = getSelloStatus(phase.index)
                  const isActive = activePhase === phase.index
                  const Icon     = phase.icon

                  return (
                    <button
                      key={phase.key}
                      onClick={() => status !== 'locked' && setActivePhase(phase.index)}
                      disabled={status === 'locked'}
                      className={[
                        'w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all border outline-none',
                        isActive ? 'border-primary bg-primary/[0.04] shadow-sm' : 'border-transparent hover:bg-muted/50',
                        status === 'locked' && 'opacity-40 cursor-not-allowed',
                      ].filter(Boolean).join(' ')}
                    >
                      <div className={[
                        'w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border',
                        status === 'completed' && 'bg-green-50 border-green-200 text-green-600',
                        status === 'active'    && 'bg-primary/10 border-primary/20 text-primary',
                        status === 'locked'    && 'bg-muted border-border text-muted-foreground',
                      ].filter(Boolean).join(' ')}>
                        {status === 'completed' ? <Check size={16} className="stroke-[3px]" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold ${isActive ? 'text-primary' : 'text-foreground'}`}>{phase.label}</span>
                          {status === 'locked' && <Lock size={10} className="text-muted-foreground shrink-0" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{phase.subtitle}</p>
                      </div>
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* RIGHT: Action Canvas */}
            <div className="flex-1 flex flex-col overflow-y-auto p-6 bg-card custom-scrollbar">
              {isLoading ? (
                <div className="flex flex-col gap-4">
                  <Skeleton className="h-8 w-48 rounded" />
                  <Skeleton className="h-32 w-full rounded-xl" />
                  <Skeleton className="h-48 w-full rounded-xl" />
                </div>
              ) : (
                <>
                  {activePhase === 0 && (
                    <PhaseDesign
                      cotizacionId={cotizId ?? ''}
                      apoyo={data.apoyo}
                      isCurrentPhase={currentFase === 0}
                      onRefresh={refresh}
                      onRequestConfirm={setConfirmConfig}
                      zapBusy={zapBusy}
                    />
                  )}
                  {activePhase === 1 && (
                    <PhaseQuoting
                      cotizacionId={cotizId ?? ''}
                      espacios={data.espacios}
                      isCurrentPhase={currentFase === 1}
                      onRefresh={refresh}
                      onRequestConfirm={setConfirmConfig}
                      zapBusy={zapBusy}
                    />
                  )}
                  {activePhase === 2 && (
                    <PhaseContract
                      cotizacionId={cotizId ?? ''}
                      contrato={data.contrato}
                      abonos={data.abonos}
                      isCurrentPhase={currentFase === 2}
                      onRefresh={refresh}
                      onRequestConfirm={setConfirmConfig}
                      zapBusy={zapBusy}
                    />
                  )}
                  {activePhase === 3 && (
                    <PhasePayments
                      contrato={data.contrato}
                      abonos={data.abonos}
                      onRefresh={refresh}
                    />
                  )}
                  {activePhase === 4 && (
                    <PhaseProduction
                      cotizacionId={cotizId ?? ''}
                      ordenes={data.ordenes}
                      tareas={data.tareas}
                      isCurrentPhase={currentFase === 3}
                      onRefresh={refresh}
                      onRequestConfirm={setConfirmConfig}
                      zapBusy={zapBusy}
                    />
                  )}
                  {activePhase === 5 && (
                    <PhaseDelivery
                      cotizacionId={cotizId ?? ''}
                      isCurrentPhase={currentFase === 4}
                      onRequestConfirm={setConfirmConfig}
                      zapBusy={zapBusy}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Agnostic Confirmation Modal */}
      <ConfirmActionDialog
        config={confirmConfig}
        onConfirm={handleConfirmExecute}
        onCancel={() => setConfirmConfig(null)}
        isBusy={!!zapBusy}
      />
    </>
  )
}
