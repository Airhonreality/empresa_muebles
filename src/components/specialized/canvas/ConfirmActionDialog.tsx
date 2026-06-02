'use client'
/**
 * ConfirmActionDialog — Agnostic reusable confirmation modal for critical zap transitions.
 *
 * Usage:
 *   <ConfirmActionDialog
 *     config={confirmConfig}   // null = closed
 *     onConfirm={handleConfirm}
 *     onCancel={() => setConfirmConfig(null)}
 *     isBusy={zapBusy}
 *   />
 */
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { HelpCircle, Loader2 } from 'lucide-react'

export interface ConfirmConfig {
  title: string
  description: string
  zap: string
  payload: Record<string, unknown>
}

interface ConfirmActionDialogProps {
  config: ConfirmConfig | null
  onConfirm: () => void
  onCancel: () => void
  isBusy: boolean
}

export default function ConfirmActionDialog({
  config, onConfirm, onCancel, isBusy,
}: ConfirmActionDialogProps) {
  return (
    <Dialog open={!!config} onOpenChange={v => !v && onCancel()}>
      <DialogContent className="max-w-md p-6 rounded-xl border bg-background shadow-xl z-[60]">
        <DialogHeader className="p-0 flex flex-col gap-2">
          <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <HelpCircle size={18} className="text-primary" />
            {config?.title}
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed text-muted-foreground mt-1">
            {config?.description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 justify-end mt-5 border-t pt-3">
          <Button
            variant="ghost" size="sm"
            className="text-xs h-8 font-semibold"
            onClick={onCancel}
            disabled={isBusy}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            className="text-xs h-8 font-bold"
            onClick={onConfirm}
            disabled={isBusy}
          >
            {isBusy && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
            Confirmar y Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
