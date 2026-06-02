'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { SmartImageInput } from '@/components/ui/SmartImageInput'
import { Lock, Plus, Calendar, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { vaultWrite, zapCall } from '@/lib/agnostic/vault-client'
import { useMateriaStore } from '@/lib/agnostic/store'
import type { ContratosRecord, AbonosContratoRecord } from '@/generated/agnostic-schemas'

interface PhasePaymentsProps {
  contrato: ContratosRecord | null
  abonos: AbonosContratoRecord[]
  onRefresh: () => void
}

export default function PhasePayments({ contrato, abonos, onRefresh }: PhasePaymentsProps) {
  const [abonoNum, setAbonoNum]       = useState('1')
  const [abonoValor, setAbonoValor]   = useState('')
  const [abonoFecha, setAbonoFecha]   = useState(new Date().toISOString().split('T')[0])
  const [abonoVoucher, setAbonoVoucher] = useState('')
  const [abonoObs, setAbonoObs]       = useState('')
  const [adding, setAdding]           = useState(false)

  const handleAdd = async () => {
    if (!contrato || !abonoValor) { toast.error('Define un valor de abono.'); return }
    setAdding(true)
    try {
      const saved = await vaultWrite('abonos_contrato', undefined, {
        contrato_id: contrato.id, numero_abono: abonoNum,
        valor_abono: Number(abonoValor), fecha_recibido: abonoFecha,
        observaciones: abonoObs, imagen_comprobante: abonoVoucher, verificado: false,
      })
      useMateriaStore.getState().updateItem('abonos_contrato', saved)
      await zapCall('registrar_abono_y_activar', { record: saved })
      setAbonoValor(''); setAbonoObs(''); setAbonoVoucher('')
      onRefresh()
    } catch { toast.error('Error al registrar abono.') }
    finally { setAdding(false) }
  }

  if (!contrato) {
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-lg font-bold">Lienzo de Control de Pagos</h2>
        <div className="rounded-xl border border-dashed p-12 text-center text-xs text-muted-foreground bg-muted/5 flex flex-col items-center gap-3">
          <Lock size={24} className="text-muted-foreground/60" />
          <p className="font-semibold text-foreground">Control de pagos inactivo.</p>
          <p>Los pagos se activarán cuando el contrato oficial haya sido generado.</p>
        </div>
      </div>
    )
  }

  const valorTotal    = Number(contrato.data.valor_total ?? 0)
  const abonosPagados = abonos.filter(a => a.data.verificado)
  const totalPagado   = abonosPagados.reduce((s, a) => s + Number(a.data.valor_abono ?? 0), 0)
  const pct           = valorTotal > 0 ? Math.round((totalPagado / valorTotal) * 100) : 0

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-bold">Lienzo de Control de Pagos</h2>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 flex flex-col gap-4">
          {/* Progress */}
          <div className="border rounded-xl p-4 bg-muted/5 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-primary uppercase tracking-wider">Avance Financiero</span>
              <span className="font-mono">{pct}% Cobrado</span>
            </div>
            <Progress value={pct} className="h-2.5 bg-muted rounded-full" />
            <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
              <span>Cobrado: <strong className="font-mono text-foreground">${totalPagado.toLocaleString('es-CO')}</strong></span>
              <span>Pendiente: <strong className="font-mono text-foreground">${Math.max(0, valorTotal - totalPagado).toLocaleString('es-CO')}</strong></span>
            </div>
          </div>

          {/* Cuotas */}
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-2">Cuotas</h4>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(n => {
              const abono = abonos.find(a => String(a.data.numero_abono) === String(n))
              const isDone = abono?.data.verificado
              const isSubmitted = abono && !isDone
              return (
                <div key={n} className={[
                  'rounded-xl border p-3 flex flex-col gap-1.5 text-center transition-all',
                  isDone ? 'border-green-500/40 bg-green-500/[0.03] text-green-700' :
                  isSubmitted ? 'border-amber-500/40 bg-amber-500/[0.03] text-amber-700' :
                  'border-border bg-card text-muted-foreground',
                ].join(' ')}>
                  <div className="text-xs font-bold flex items-center justify-center gap-1.5">
                    Abono {n}
                    <Badge variant="outline" className={`text-[8px] px-1 py-0 border-none uppercase ${
                      isDone ? 'bg-green-100 text-green-700' : isSubmitted ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'
                    }`}>{isDone ? 'Verificado' : isSubmitted ? 'Pendiente' : 'Vacío'}</Badge>
                  </div>
                  <div className="font-mono text-xs font-bold text-foreground">
                    ${abono?.data.valor_abono ? Number(abono.data.valor_abono).toLocaleString('es-CO') : '0'}
                  </div>
                  {abono?.data.fecha_recibido && (
                    <span className="text-[9px] text-muted-foreground/80 flex items-center justify-center gap-1">
                      <Calendar size={9} /> {abono.data.fecha_recibido as string}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Registrar abono */}
        <div className="border rounded-xl p-4 bg-muted/5 flex flex-col gap-3.5 h-fit">
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Registrar Abono</h4>
          <div className="grid grid-cols-3 gap-1">
            {['1', '2', '3'].map(num => (
              <button key={num} type="button" onClick={() => {
                setAbonoNum(num)
                const pctMap: Record<string, number> = { '1': 0.5, '2': 0.25, '3': 0.25 }
                setAbonoValor(String(Math.round(valorTotal * (pctMap[num] ?? 0.25))))
              }} className={`rounded-md border p-1 text-[10px] font-semibold text-center transition-colors ${
                abonoNum === num ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted/50 text-muted-foreground'
              }`}>Cuota {num}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] font-medium">Valor ($)</Label>
              <Input type="number" value={abonoValor} onChange={e => setAbonoValor(e.target.value)} className="h-8 text-xs font-mono" />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] font-medium">Fecha</Label>
              <Input type="date" value={abonoFecha} onChange={e => setAbonoFecha(e.target.value)} className="h-8 text-xs" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-[10px] font-medium">Comprobante</Label>
            <SmartImageInput value={abonoVoucher} onChange={setAbonoVoucher} placeholder="Pega imagen (Ctrl+V)" />
          </div>
          <Input value={abonoObs} onChange={e => setAbonoObs(e.target.value)} placeholder="Ref. transferencia..." className="h-8 text-xs" />
          <Button size="sm" onClick={handleAdd} disabled={adding || !abonoValor} className="w-full h-8 text-xs font-bold gap-1 mt-1">
            {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus size={13} />} Registrar Abono
          </Button>
        </div>
      </div>
    </div>
  )
}
