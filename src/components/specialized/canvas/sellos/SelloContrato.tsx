'use client'
import { useState, useCallback } from 'react'
import { Check, Lock, ChevronDown, ChevronUp, DollarSign, Mail, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import type { ContratosRecord, AbonosContratoRecord } from '@/generated/agnostic-schemas'
import { useMateriaStore } from '@/lib/agnostic/store'
import type { SelloStatus } from './SelloDiseno'

async function vaultWrite(namespace: string, id: string | undefined, data: Record<string, unknown>) {
  const res = await fetch('/api/vault', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'WRITE', namespace, record: { id, data } }),
  })
  if (!res.ok) throw new Error(await res.text())
  const body = await res.json()
  return body.record ?? body
}

async function zapCall(zap: string, payload: Record<string, unknown>) {
  const res = await fetch('/api/engine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ zap, payload }),
  })
  const { events = [] } = await res.json()
  for (const event of events) {
    if (event.action === 'materia_sync') {
      useMateriaStore.getState().updateItem(event.context, event.item)
    }
    if (event.action === 'notify') {
      event.type === 'success' ? toast.success(event.message) : toast.error(event.message)
    }
  }
}

interface SelloContratoProps {
  status: SelloStatus
  expanded: boolean
  onToggle: () => void
  contrato: ContratosRecord | null
  abonos: AbonosContratoRecord[]
  onRefresh: () => void
}

function AbonoMiniForm({ contrato, onDone, onRefresh }: { contrato: ContratosRecord; onDone: () => void; onRefresh: () => void }) {
  const valorTotal = Number(contrato.data.valor_total ?? 0)
  const cuotas = [
    { num: '1', pct: 0.5,  label: 'Anticipo 50%' },
    { num: '2', pct: 0.25, label: 'Segundo 25%' },
    { num: '3', pct: 0.25, label: 'Final 25%' },
  ]
  const [numero, setNumero] = useState('1')
  const [valor, setValor]   = useState(String(Math.round(valorTotal * 0.5)))
  const [fecha, setFecha]   = useState(new Date().toISOString().split('T')[0])
  const [obs, setObs]       = useState('')
  const [saving, setSaving] = useState(false)

  const handleNumero = (n: string) => {
    setNumero(n)
    const c = cuotas.find(c => c.num === n)
    if (c) setValor(String(Math.round(valorTotal * c.pct)))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const saved = await vaultWrite('abonos_contrato', undefined, {
        contrato_id: contrato.id,
        numero_abono: numero,
        valor_abono: Number(valor),
        fecha_recibido: fecha,
        observaciones: obs,
        verificado: false,
      })
      useMateriaStore.getState().updateItem('abonos_contrato', saved)
      await zapCall('registrar_abono_y_activar', { record: saved })
      onRefresh()
      onDone()
    } catch { toast.error('Error al registrar el abono.') }
    finally { setSaving(false) }
  }

  return (
    <div className="rounded-md border border-dashed p-3 mt-2 flex flex-col gap-2.5">
      <p className="text-xs font-medium">Registrar abono — {contrato.data.codigo_contrato}</p>
      <div className="grid grid-cols-3 gap-1.5">
        {cuotas.map(c => (
          <button
            key={c.num}
            type="button"
            onClick={() => handleNumero(c.num)}
            className={[
              'rounded border p-1.5 text-[11px] text-center transition-colors',
              numero === c.num ? 'border-primary bg-primary/10 font-semibold' : 'border-border hover:bg-muted/50',
            ].join(' ')}
          >
            <div>{c.label}</div>
            <div className="font-mono">${Math.round(valorTotal * c.pct).toLocaleString('es-CO')}</div>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[11px]">Valor ($)</Label>
          <Input type="number" value={valor} onChange={e => setValor(e.target.value)} className="h-7 text-xs" />
        </div>
        <div>
          <Label className="text-[11px]">Fecha</Label>
          <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="h-7 text-xs" />
        </div>
      </div>
      <Input value={obs} onChange={e => setObs(e.target.value)} placeholder="Observaciones..." className="h-7 text-xs" />
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onDone} className="h-7 text-xs">Cancelar</Button>
        <Button size="sm" onClick={handleSave} disabled={saving} className="h-7 text-xs">
          {saving && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
          Registrar
        </Button>
      </div>
    </div>
  )
}

export default function SelloContrato({ status, expanded, onToggle, contrato, abonos, onRefresh }: SelloContratoProps) {
  const [editingPlazo, setEditingPlazo]   = useState(false)
  const [plazoText, setPlazoText]         = useState(contrato?.data.plazo_ejecucion_texto ?? '')
  const [savingPlazo, setSavingPlazo]     = useState(false)
  const [showAbonoForm, setShowAbonoForm] = useState(false)

  const valorTotal   = Number(contrato?.data.valor_total ?? 0)
  const abonosPagados = abonos.filter(a => a.data.verificado)
  const totalPagado  = abonosPagados.reduce((s, a) => s + Number(a.data.valor_abono ?? 0), 0)
  const pct          = valorTotal > 0 ? Math.round((totalPagado / valorTotal) * 100) : 0

  const savePlazo = useCallback(async () => {
    if (!contrato) return
    setSavingPlazo(true)
    try {
      await vaultWrite('contratos', contrato.id, { ...contrato.data, plazo_ejecucion_texto: plazoText })
      onRefresh()
      setEditingPlazo(false)
    } catch { toast.error('Error al guardar el plazo.') }
    finally { setSavingPlazo(false) }
  }, [contrato, plazoText, onRefresh])

  const mailtoHref = contrato
    ? `mailto:?subject=${encodeURIComponent(contrato.data.email_asunto ?? '')}&body=${encodeURIComponent(contrato.data.email_cuerpo ?? '')}`
    : '#'

  const summaryText = contrato
    ? `${contrato.data.codigo_contrato} · ${contrato.data.estado}`
    : 'Sin contrato'

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
          <span className="font-medium text-sm">Contrato</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{summaryText}</span>
          {status !== 'locked' && (expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
        </div>
      </button>

      {expanded && status !== 'locked' && (
        <div className="border-t px-4 pb-4 pt-3 flex flex-col gap-3">
          {!contrato ? (
            <p className="text-sm text-muted-foreground">Sin contrato generado.</p>
          ) : (
            <>
              {/* Plazo editable */}
              <div>
                <Label className="text-xs text-muted-foreground">Plazo de ejecución</Label>
                {editingPlazo ? (
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={plazoText}
                      onChange={e => setPlazoText(e.target.value)}
                      className="h-7 text-sm flex-1"
                      autoFocus
                    />
                    <Button size="sm" className="h-7 text-xs" disabled={savingPlazo} onClick={savePlazo}>
                      {savingPlazo ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Guardar'}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditingPlazo(false)}>
                      ✕
                    </Button>
                  </div>
                ) : (
                  <button
                    className="w-full text-left text-sm mt-1 px-2 py-1 rounded border border-dashed hover:bg-muted/50 transition-colors"
                    onClick={() => { setPlazoText(contrato.data.plazo_ejecucion_texto); setEditingPlazo(true) }}
                  >
                    {contrato.data.plazo_ejecucion_texto || <span className="text-muted-foreground italic">Click para editar plazo...</span>}
                  </button>
                )}
              </div>

              {contrato.data.garantia_anios != null && (
                <p className="text-xs text-muted-foreground">Garantía: {contrato.data.garantia_anios} años</p>
              )}

              <Separator />

              {/* Pagos */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium">Pagos</span>
                  <span className="text-xs text-muted-foreground">{abonosPagados.length} de 3 · {pct}%</span>
                </div>
                <Progress value={pct} className="h-2 mb-2" />
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {[1, 2, 3].map(n => {
                    const abono = abonos.find(a => String(a.data.numero_abono) === String(n))
                    const done  = abono?.data.verificado
                    return (
                      <div
                        key={n}
                        className={[
                          'rounded border p-1.5 text-[11px] text-center',
                          done ? 'border-green-500/40 bg-green-500/10 text-green-700' : 'border-border text-muted-foreground',
                        ].join(' ')}
                      >
                        <div>{done ? '✓' : '○'} Abono {n}</div>
                        {abono?.data.valor_abono && (
                          <div className="font-mono">${Number(abono.data.valor_abono).toLocaleString('es-CO')}</div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {!showAbonoForm ? (
                  <Button variant="outline" size="sm" className="w-full text-xs h-8" onClick={() => setShowAbonoForm(true)}>
                    <DollarSign size={12} className="mr-1" />
                    Registrar abono
                  </Button>
                ) : (
                  <AbonoMiniForm contrato={contrato} onDone={() => setShowAbonoForm(false)} onRefresh={onRefresh} />
                )}
              </div>

              <Separator />

              {/* Correo */}
              <div>
                <Label className="text-xs text-muted-foreground">Correo</Label>
                <p className="text-sm mt-0.5 mb-2">{contrato.data.email_asunto || <span className="text-muted-foreground italic">Sin asunto configurado</span>}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    asChild
                  >
                    <a href={mailtoHref} target="_blank" rel="noreferrer">
                      <ExternalLink size={12} className="mr-1" />
                      Abrir en correo
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => window.open('/app/contratos', '_blank')}
                  >
                    <Mail size={12} className="mr-1" />
                    Contrato completo
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
