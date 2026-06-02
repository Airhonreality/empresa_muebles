'use client'
import { Check, Lock, ChevronDown, ChevronUp, PackageCheck } from 'lucide-react'
import type { SelloStatus } from './SelloDiseno'

interface SelloEntregaProps {
  status: SelloStatus
  expanded: boolean
  onToggle: () => void
}

export default function SelloEntrega({ status, expanded, onToggle }: SelloEntregaProps) {
  const summaryText = status === 'locked' ? 'pendiente producción' : status === 'completed' ? 'entregado' : 'en proceso'

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
          <span className="font-medium text-sm">Entrega</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{summaryText}</span>
          {status !== 'locked' && (expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
        </div>
      </button>

      {expanded && status !== 'locked' && (
        <div className="border-t px-4 pb-6 pt-4 flex flex-col items-center gap-2 text-muted-foreground">
          <PackageCheck size={28} className="opacity-40" />
          <p className="text-sm">Acta de entrega y garantía</p>
          <p className="text-xs text-center">Esta sección estará disponible cuando el proyecto entre en fase de entrega.</p>
        </div>
      )}
    </div>
  )
}
