'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectName: string
  currentStage?: string
  contractLabel?: string
  hasContract?: boolean
  busy?: boolean
  onConfirm: () => Promise<void> | void
  sourceLabel?: string
}

export default function ProductionTransitionDialog({
  open,
  onOpenChange,
  projectName,
  currentStage,
  contractLabel,
  hasContract = false,
  busy = false,
  onConfirm,
  sourceLabel = 'Comercial',
}: Props) {
  const contractState = hasContract ? 'Contrato disponible' : 'Contrato no detectado'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-base">Pasar a produccion</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Esta accion es manual. Al confirmar, el backend reutilizara o generara el contrato,
            creara las obligaciones y llevara el proyecto a produccion.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-stone-200 bg-white text-stone-700">
              {sourceLabel}
            </Badge>
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
              {contractState}
            </Badge>
          </div>

          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-stone-500">Proyecto</span>
              <span className="font-medium text-stone-850 text-right">{projectName || 'Sin nombre'}</span>
            </div>
            {currentStage && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-stone-500">Estado actual</span>
                <span className="font-medium text-stone-850 text-right">{currentStage}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <span className="text-stone-500">Contrato</span>
              <span className={cn('font-medium text-right', hasContract ? 'text-emerald-700' : 'text-amber-700')}>
                {contractLabel || (hasContract ? 'Contrato detectado' : 'Se generara al confirmar')}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900 leading-relaxed">
          La firma del contrato por si sola no activa produccion. Esta confirmacion explicita es el unico
          paso que dispara la transicion.
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {busy ? 'Procesando...' : 'Pasar a produccion'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
