'use client'
import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { ChevronDown, DollarSign, LayoutDashboard, Loader2, FileText, Play, CheckCircle2 } from 'lucide-react'
import type { KanbanStage, KanbanRecord } from './KanbanCanvas'
import { STAGE_COLORS } from './KanbanCanvas'
import type {
  ProyectosRecord, ClientesRecord, ContratosRecord,
  AbonosContratoRecord, EspacioVariantesRecord,
} from '@/generated/agnostic-schemas'
import { useMateriaStore } from '@/lib/agnostic/store'
import { processEvents } from '@/lib/agnostic/eventProcessor'

const fmt = (v: number) =>
  '$' + v.toLocaleString('es-CO', { minimumFractionDigits: 0 }) + ' COP'

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
  await processEvents(events, useMateriaStore.getState().updateItem)
}

// ─── Inline abono form ────────────────────────────────────────────────────────
function AbonoPanel({
  contrato,
  onDone,
}: {
  contrato: ContratosRecord
  onDone: () => void
}) {
  const total  = Number(contrato.data.valor_total ?? 0)
  const opts = [
    { num: '1', label: '1er anticipo (50%)',  val: Math.round(total * 0.5) },
    { num: '2', label: '2do pago (25%)',       val: Math.round(total * 0.25) },
    { num: '3', label: 'Pago final (25%)',     val: total - Math.round(total * 0.5) - Math.round(total * 0.25) },
  ]
  const [num,   setNum]   = useState('1')
  const [valor, setValor] = useState(String(opts[0].val))
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [obs,   setObs]   = useState('')
  const [busy,  setBusy]  = useState(false)

  const pickNum = (n: string) => {
    setNum(n)
    const found = opts.find(o => o.num === n)
    if (found) setValor(String(found.val))
  }

  const save = async () => {
    setBusy(true)
    try {
      const saved = await vaultWrite('abonos_contrato', undefined, {
        contrato_id: contrato.id,
        numero_abono: num,
        valor_abono: Number(valor),
        fecha_recibido: fecha,
        observaciones: obs,
        verificado: false,
      })
      useMateriaStore.getState().updateItem('abonos_contrato', saved)
      await zapCall('registrar_abono_y_activar', { record: saved })
      toast.success('Abono registrado correctamente')
      onDone()
    } catch {
      toast.error('Error al registrar el abono.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-lg border border-dashed p-4 bg-stone-50/50">
      <p className="text-sm font-medium text-stone-850">Registrar abono — {contrato.data.codigo_contrato}</p>
      <div className="grid grid-cols-3 gap-2">
        {opts.map(o => (
          <button
            key={o.num}
            type="button"
            onClick={() => pickNum(o.num)}
            className={`rounded-lg border p-2 text-xs transition-all text-left ${
              num === o.num
                ? 'border-amber-500 bg-amber-500/10 font-semibold text-amber-900'
                : 'border-stone-200 hover:bg-stone-100/50 text-stone-600'
            }`}
          >
            <div className="text-3xs uppercase tracking-wider opacity-80">{o.label}</div>
            <div className="font-mono mt-1 font-bold">${o.val.toLocaleString('es-CO')}</div>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-stone-600 mb-1 block">Valor recibido</Label>
          <Input type="number" value={valor} onChange={e => setValor(e.target.value)} className="h-9 text-sm" />
        </div>
        <div>
          <Label className="text-xs text-stone-600 mb-1 block">Fecha</Label>
          <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="h-9 text-sm" />
        </div>
      </div>
      <div>
        <Label className="text-xs text-stone-600 mb-1 block">Soporte / Observaciones</Label>
        <Input
          value={obs}
          onChange={e => setObs(e.target.value)}
          placeholder="Ej: Transferencia Bancolombia #8829"
          className="h-9 text-sm"
        />
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <Button variant="ghost" size="sm" onClick={onDone}>Cancelar</Button>
        <Button size="sm" onClick={save} disabled={busy} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold">
          {busy ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
          Confirmar Recibo
        </Button>
      </div>
    </div>
  )
}

// ─── Main card ────────────────────────────────────────────────────────────────
interface Props {
  record:    KanbanRecord
  stage:     KanbanStage
  onMove:    (newStage: string) => void
  nextStage: KanbanStage | null
  allStages: KanbanStage[]
  client?:   ClientesRecord
  contrato?: ContratosRecord
  abonos:    AbonosContratoRecord[]
  espacios:  EspacioVariantesRecord[]
}

export default function ComercialCard({
  record, stage, onMove, nextStage, allStages,
  client, contrato, abonos, espacios,
}: Props) {
  const cot = record as unknown as ProyectosRecord
  const [abonoOpen, setAbonoOpen] = useState(false)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  
  const colors = STAGE_COLORS[stage.color] ?? STAGE_COLORS.slate

  const valorTotal = Number(contrato?.data.valor_total ?? 0)

  // Calculate sum of verified abonos
  const totalAbonado = useMemo(() => {
    return abonos.reduce((sum, a) => sum + (Number(a.data.valor_abono ?? 0)), 0)
  }, [abonos])

  const handleAction = async (action: 'contrato' | 'produccion' | 'pdf') => {
    setBusyAction(action)
    try {
      if (action === 'contrato') {
        await zapCall('generar_contrato', { record: cot })
        toast.success('Contrato comercial redactado y generado.')
      } else if (action === 'produccion') {
        await zapCall('zap_activar_produccion', { record: cot })
        toast.success('¡Producción Activada! OT, contrato y obligaciones generados.')
      } else if (action === 'pdf') {
        await zapCall('exportar_propuesta_pdf', { record: cot })
        toast.success('PDF Exportado con éxito.')
      }
    } catch (err) {
      toast.error('Error al ejecutar la acción.')
    } finally {
      setBusyAction(null)
    }
  }

  // Determine Fitts' Law CTA action for this stage
  const actionCTA = useMemo(() => {
    if (stage.value === 'enviada' && !contrato) {
      return { label: 'Generar Contrato', action: 'contrato', bg: 'bg-violet-600 hover:bg-violet-700 text-white' }
    }
    if ((stage.value === 'en_contrato' || stage.value === 'pre_produccion') && stage.value !== 'produccion') {
      return { label: 'Activar Producción', action: 'produccion', bg: 'bg-emerald-600 hover:bg-emerald-700 text-white' }
    }
    return null
  }, [stage.value, contrato])

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4">
        
        {/* Col 1: Identification (Left) */}
        <div className="md:col-span-4 flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-900 truncate">
              {cot.data.nombre_proyecto as string ?? '—'}
            </span>
            <Badge variant="outline" className={`text-2xs font-semibold uppercase px-2 py-0.2 ${colors.badge}`}>
              {stage.label}
            </Badge>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Cliente: <span className="font-medium text-stone-700">{client?.data.nombre ?? '—'}</span>
          </p>
          {valorTotal > 0 && (
            <p className="text-xs font-mono font-bold text-stone-600 mt-1">
              {fmt(valorTotal)}
            </p>
          )}
        </div>

        {/* Col 2: Details & Spaces (Center) */}
        <div className="md:col-span-5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-2xs font-bold uppercase tracking-wider text-stone-450">
              Espacios:
            </span>
            {espacios.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {espacios.slice(0, 3).map(e => (
                  <Badge key={e.id} variant="secondary" className="text-3xs bg-stone-100 border-stone-200 text-stone-650 px-1.5">
                    {e.data.nombre_espacio as string}
                  </Badge>
                ))}
                {espacios.length > 3 && (
                  <span className="text-3xs font-mono font-medium text-stone-400">+{espacios.length - 3}</span>
                )}
              </div>
            ) : (
              <span className="text-3xs text-stone-400 font-medium uppercase tracking-wider">Sin espacios configurados</span>
            )}
          </div>

          {/* Abonos Summary */}
          {contrato && (
            <div className="flex items-center gap-2 mt-1.5 text-2xs">
              <span className="text-stone-400 font-bold uppercase tracking-wider">Abonado:</span>
              <span className="font-mono font-bold text-stone-700">{fmt(totalAbonado)}</span>
              {totalAbonado >= valorTotal ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              ) : (
                <span className="text-stone-400 font-mono">({Math.round((totalAbonado / valorTotal) * 100)}%)</span>
              )}
            </div>
          )}
        </div>

        {/* Col 3: Actions (Right) */}
        <div className="md:col-span-3 flex items-center justify-end gap-2.5 w-full md:w-auto">
          {actionCTA ? (
            <Button
              type="button"
              disabled={busyAction !== null}
              className={`flex-1 md:flex-none h-11 text-xs font-semibold px-4 rounded-lg shadow-sm transition-all duration-200 hover:scale-[1.01] ${actionCTA.bg}`}
              onClick={() => handleAction(actionCTA.action as 'contrato' | 'produccion')}
            >
              {busyAction === actionCTA.action ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : actionCTA.action === 'produccion' ? (
                <Play className="h-3.5 w-3.5 mr-1 shrink-0" />
              ) : null}
              {actionCTA.label}
            </Button>
          ) : (
            <div className="flex-1 md:flex-none py-2 text-right">
              {stage.value === 'produccion' ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-2xs font-bold uppercase tracking-wider text-emerald-700 border border-emerald-250">
                  En Taller
                </span>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 px-4 text-xs font-semibold rounded-lg border-stone-200 hover:bg-stone-50"
                  onClick={() => window.location.href = `/app/quoting/${cot.id}`}
                >
                  Ver Cotización
                </Button>
              )}
            </div>
          )}

          {/* PDF exporter */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={busyAction !== null}
            className="h-11 w-11 rounded-lg border-stone-200 hover:bg-stone-50 shrink-0"
            title="Exportar PDF"
            onClick={() => handleAction('pdf')}
          >
            {busyAction === 'pdf' ? (
              <Loader2 className="h-4 w-4 animate-spin text-stone-400" />
            ) : (
              <FileText className="h-4.5 w-4.5 text-stone-600" />
            )}
          </Button>

          {/* Abonos panel toggle */}
          {contrato && (stage.value === 'en_contrato' || stage.value === 'pre_produccion') && (
            <Button
              type="button"
              variant={abonoOpen ? 'default' : 'outline'}
              size="icon"
              className={`h-11 w-11 rounded-lg shrink-0 ${abonoOpen ? 'bg-amber-600 text-white hover:bg-amber-700' : 'border-stone-200 hover:bg-stone-50'}`}
              title="Registrar abono"
              onClick={() => setAbonoOpen(v => !v)}
            >
              <DollarSign className="h-4.5 w-4.5" />
            </Button>
          )}

          {/* Standard stage select */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-lg border-stone-200 hover:bg-stone-50 shrink-0"
              >
                <ChevronDown className="h-4 w-4 text-stone-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {allStages.filter(s => s.value !== stage.value).map(s => (
                <DropdownMenuItem
                  key={s.value}
                  onClick={() => onMove(s.value)}
                  className="flex items-center gap-2 py-2 cursor-pointer text-xs"
                >
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${STAGE_COLORS[s.color]?.dot}`} />
                  {s.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>

      {/* Inline abono form */}
      {abonoOpen && contrato && (
        <div className="px-4 pb-4">
          <AbonoPanel contrato={contrato} onDone={() => setAbonoOpen(false)} />
        </div>
      )}
    </>
  )
}

