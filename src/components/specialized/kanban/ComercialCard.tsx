'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { ChevronDown, ChevronRight, DollarSign, LayoutDashboard, Loader2 } from 'lucide-react'
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
      onDone()
    } catch {
      toast.error('Error al registrar el abono.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-lg border border-dashed p-4">
      <p className="text-sm font-medium">Registrar abono — {contrato.data.codigo_contrato}</p>
      <div className="grid grid-cols-3 gap-1.5">
        {opts.map(o => (
          <button
            key={o.num}
            type="button"
            onClick={() => pickNum(o.num)}
            className={`rounded-md border p-2 text-xs transition-colors text-left ${
              num === o.num
                ? 'border-primary bg-primary/10 font-semibold'
                : 'border-border hover:bg-muted/50'
            }`}
          >
            <div className="text-muted-foreground">{o.label}</div>
            <div className="font-mono mt-0.5">${o.val.toLocaleString('es-CO')}</div>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Valor recibido</Label>
          <Input type="number" value={valor} onChange={e => setValor(e.target.value)} className="h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Fecha</Label>
          <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="h-8 text-sm" />
        </div>
      </div>
      <Input
        value={obs}
        onChange={e => setObs(e.target.value)}
        placeholder="Observaciones (ref. transferencia…)"
        className="h-8 text-sm"
      />
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onDone}>Cancelar</Button>
        <Button size="sm" onClick={save} disabled={busy}>
          {busy ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
          Registrar
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
  const cot     = record as unknown as ProyectosRecord
  const [abonoOpen,  setAbonoOpen]  = useState(false)
  const colors = STAGE_COLORS[stage.color] ?? STAGE_COLORS.slate

  const puedeAbono = contrato && (stage.value === 'en_contrato' || stage.value === 'pre_produccion')
  const valorTotal = Number(contrato?.data.valor_total ?? 0)

  return (
    <>
      <Card className="p-3 flex flex-col gap-2 hover:shadow-sm transition-shadow">
        {/* Top: project name + client */}
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight truncate">
            {cot.data.nombre_proyecto as string ?? '—'}
          </p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {client?.data.nombre ?? '—'}
          </p>
          {contrato?.data.valor_total ? (
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              {fmt(valorTotal)}
            </p>
          ) : null}
        </div>

        <Separator />

        {/* Bottom: stage badge + actions */}
        <div className="flex items-center gap-1 flex-wrap">
          {/* Stage badge → dropdown for any-stage move */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors hover:opacity-80 ${colors.badge}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                {stage.label}
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {allStages.filter(s => s.value !== stage.value).map(s => (
                <DropdownMenuItem key={s.value} onClick={() => onMove(s.value)}>
                  <span className={`w-2 h-2 rounded-full mr-2 ${STAGE_COLORS[s.color]?.dot}`} />
                  {s.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-1 ml-auto">
            {/* Quick next-stage */}
            {nextStage && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                title={`Avanzar a ${nextStage.label}`}
                onClick={() => onMove(nextStage.value)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            )}
            {/* Project canvas */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              title="Ver Ficha de Producción"
              onClick={() => window.location.href = `/app/ficha/${cot.id}`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
            </Button>
            {/* Abono */}
            {puedeAbono && (
              <Button
                variant={abonoOpen ? 'default' : 'outline'}
                size="icon"
                className="h-6 w-6"
                title="Registrar abono"
                onClick={() => setAbonoOpen(v => !v)}
              >
                <DollarSign className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Inline abono panel */}
        {abonoOpen && contrato && (
          <AbonoPanel contrato={contrato} onDone={() => setAbonoOpen(false)} />
        )}
      </Card>
    </>
  )
}
