'use client'
import { Check, Lock } from 'lucide-react'

export type FaseIndex = 0 | 1 | 2 | 3 | 4 | 5

const FASES = [
  { id: 'diseno',     label: 'Diseño' },
  { id: 'cotizacion', label: 'Cotización' },
  { id: 'contrato',   label: 'Contrato' },
  { id: 'pagos',      label: 'Pagos' },
  { id: 'produccion', label: 'Producción' },
  { id: 'entrega',    label: 'Entrega' },
]

interface CanvasTimelineProps {
  currentFase: FaseIndex
  onSelect?: (fase: FaseIndex) => void
}

export default function CanvasTimeline({ currentFase, onSelect }: CanvasTimelineProps) {
  return (
    <div className="flex flex-col items-center gap-0 py-2">
      {FASES.map((fase, idx) => {
        const done    = idx < currentFase
        const active  = idx === currentFase
        const locked  = idx > currentFase

        return (
          <div key={fase.id} className="flex flex-col items-center">
            <button
              onClick={() => !locked && onSelect?.(idx as FaseIndex)}
              disabled={locked}
              title={fase.label}
              className={[
                'w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors',
                done   ? 'border-green-500 bg-green-500 text-white'                  : '',
                active ? 'border-primary bg-primary text-primary-foreground'         : '',
                locked ? 'border-muted-foreground bg-background text-muted-foreground cursor-not-allowed' : '',
                !done && !active && !locked ? 'border-border bg-background' : '',
              ].join(' ')}
            >
              {done   && <Check size={12} />}
              {locked && <Lock size={10} />}
              {active && <span>{idx + 1}</span>}
            </button>

            <span className={[
              'text-[10px] leading-tight text-center mt-0.5 mb-0.5 w-12',
              active ? 'text-primary font-semibold' : 'text-muted-foreground',
            ].join(' ')}>
              {fase.label}
            </span>

            {idx < FASES.length - 1 && (
              <div className={[
                'w-px h-4',
                idx < currentFase ? 'bg-green-500' : 'bg-border',
              ].join(' ')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export { FASES }
