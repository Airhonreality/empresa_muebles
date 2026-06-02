'use client'
import { Check, Lock, ChevronDown, ChevronUp } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import type { ContratosRecord, AbonosContratoRecord } from '@/generated/agnostic-schemas'
import type { SelloStatus } from './SelloDiseno'

interface SelloPagosProps {
  status: SelloStatus
  expanded: boolean
  onToggle: () => void
  contrato: ContratosRecord | null
  abonos: AbonosContratoRecord[]
}

export default function SelloPagos({ status, expanded, onToggle, contrato, abonos }: SelloPagosProps) {
  const valorTotal  = Number(contrato?.data.valor_total ?? 0)
  const totalPagado = abonos.filter(a => a.data.verificado).reduce((s, a) => s + Number(a.data.valor_abono ?? 0), 0)
  const pct         = valorTotal > 0 ? Math.round((totalPagado / valorTotal) * 100) : 0
  const pagados     = abonos.filter(a => a.data.verificado).length

  const summaryText = contrato
    ? `${pagados} de 3 abonos · $${totalPagado.toLocaleString('es-CO')}`
    : 'pendiente anticipo'

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
          <span className="font-medium text-sm">Pagos</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{summaryText}</span>
          {status !== 'locked' && (expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
        </div>
      </button>

      {expanded && status !== 'locked' && (
        <div className="border-t px-4 pb-4 pt-3">
          {!contrato ? (
            <p className="text-sm text-muted-foreground">Sin contrato asociado.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Total: ${valorTotal.toLocaleString('es-CO')}</span>
                <span>Pagado: ${totalPagado.toLocaleString('es-CO')} ({pct}%)</span>
              </div>
              <Progress value={pct} className="h-2" />

              <div className="flex flex-col gap-1.5 mt-1">
                {[1, 2, 3].map(n => {
                  const abono = abonos.find(a => String(a.data.numero_abono) === String(n))
                  const done  = abono?.data.verificado
                  return (
                    <div
                      key={n}
                      className={[
                        'flex items-center justify-between rounded border px-3 py-2 text-sm',
                        done ? 'border-green-500/40 bg-green-500/10' : 'border-border',
                      ].join(' ')}
                    >
                      <span className={done ? 'text-green-700' : 'text-muted-foreground'}>
                        {done ? '✓' : '○'} Abono {n}
                      </span>
                      <div className="text-right">
                        {abono?.data.valor_abono && (
                          <span className="font-mono text-xs">
                            ${Number(abono.data.valor_abono).toLocaleString('es-CO')}
                          </span>
                        )}
                        {abono?.data.fecha_recibido && (
                          <span className="text-xs text-muted-foreground ml-2">{abono.data.fecha_recibido}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
