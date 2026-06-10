'use client'
import type { BlockProps } from '@agnostic/core'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useMateriaStore } from '@/lib/agnostic/store'
import { useRelationData } from '@/lib/agnostic/hooks/useRelationData'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { DollarSign, FileText, Loader2, ExternalLink, LayoutDashboard } from 'lucide-react'
import type { CotizacionesRecord, ClientesRecord, ContratosRecord } from '@/generated/agnostic-schemas'

type CotEstado = 'activa' | 'enviada' | 'en_contrato' | 'pre_produccion' | 'produccion' | 'entregada'

const ESTADO_LABEL: Record<CotEstado, string> = {
  activa:         'Lead / Activa',
  enviada:        'Propuesta enviada',
  en_contrato:    'En contrato',
  pre_produccion: 'Pre-producción',
  produccion:     'En producción',
  entregada:      'Entregada',
}

const TABS: { value: string; label: string; estados: CotEstado[] }[] = [
  { value: 'leads',      label: 'Leads',           estados: ['activa'] },
  { value: 'propuestas', label: 'Propuestas',       estados: ['enviada'] },
  { value: 'contratos',  label: 'En contrato',      estados: ['en_contrato', 'pre_produccion'] },
  { value: 'produccion', label: 'En producción',    estados: ['produccion', 'entregada'] },
]

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

// ─── AbonoForm — panel inline para registrar un abono ────────────────────────
function AbonoForm({
  contrato,
  onDone,
}: {
  contrato: ContratosRecord
  onDone: () => void
}) {
  const valorTotal = Number(contrato.data.valor_total ?? 0)
  const abonos = [
    { num: '1', label: 'Primer anticipo (50%)', valor: Math.round(valorTotal * 0.5) },
    { num: '2', label: 'Segundo pago (25%)',    valor: Math.round(valorTotal * 0.25) },
    { num: '3', label: 'Pago final (25%)',      valor: valorTotal - Math.round(valorTotal * 0.5) - Math.round(valorTotal * 0.25) },
  ]
  const [numero, setNumero] = useState('1')
  const [valor, setValor] = useState(String(abonos[0].valor))
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [obs, setObs] = useState('')
  const [saving, setSaving] = useState(false)

  const handleNumeroChange = (n: string) => {
    setNumero(n)
    const found = abonos.find(a => a.num === n)
    if (found) setValor(String(found.valor))
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
      onDone()
    } catch {
      toast.error('Error al registrar el abono.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="mt-3 border-dashed">
      <CardContent className="p-4 flex flex-col gap-3">
        <p className="text-sm font-medium">Registrar abono — {contrato.data.codigo_contrato}</p>
        <div className="grid grid-cols-3 gap-2">
          {abonos.map(a => (
            <button
              key={a.num}
              type="button"
              onClick={() => handleNumeroChange(a.num)}
              className={`rounded-md border p-2 text-xs text-center transition-colors ${
                numero === a.num
                  ? 'border-primary bg-primary/10 font-semibold'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <div>{a.label}</div>
              <div className="font-mono mt-0.5">
                ${a.valor.toLocaleString('es-CO')}
              </div>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Valor recibido ($)</Label>
            <Input
              type="number"
              value={valor}
              onChange={e => setValor(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Fecha de recepción</Label>
            <Input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs">Observaciones</Label>
          <Input
            value={obs}
            onChange={e => setObs(e.target.value)}
            placeholder="Ej: transferencia Bancolombia, ref #..."
            className="h-8 text-sm"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onDone}>Cancelar</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
            Registrar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── CotizacionCard — tarjeta de cada proyecto ───────────────────────────────
function CotizacionCard({
  cotizacion,
  clientName,
  contrato,
  onOpenCanvas,
}: {
  cotizacion: CotizacionesRecord
  clientName: string
  contrato?: ContratosRecord
  onOpenCanvas: (cot: CotizacionesRecord) => void
}) {
  const [showAbono, setShowAbono] = useState(false)
  const estado = (cotizacion.data.estado ?? 'activa') as CotEstado
  const puedeAbono = estado === 'en_contrato' || estado === 'pre_produccion'

  return (
    <div>
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold truncate">{cotizacion.data.nombre_proyecto}</span>
              <Badge variant="outline" className="text-xs shrink-0">{ESTADO_LABEL[estado] ?? estado}</Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate mt-0.5">{clientName}</p>
            {contrato && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {contrato.data.codigo_contrato}
                {contrato.data.valor_total
                  ? ` · $${Number(contrato.data.valor_total).toLocaleString('es-CO')}`
                  : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Ver Ficha de Producción"
              onClick={() => window.location.href = `/app/ficha/${cotizacion.id}`}
            >
              <LayoutDashboard className="h-4 w-4" />
            </Button>
            {contrato && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Abrir generador de contrato"
                onClick={() => window.location.href = `/app/contratos`}
              >
                <FileText className="h-4 w-4" />
              </Button>
            )}
            {puedeAbono && contrato && (
              <Button
                variant={showAbono ? 'default' : 'outline'}
                size="icon"
                className="h-8 w-8"
                title="Registrar abono"
                onClick={() => setShowAbono(v => !v)}
              >
                <DollarSign className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {showAbono && contrato && (
        <AbonoForm contrato={contrato} onDone={() => setShowAbono(false)} />
      )}
    </div>
  )
}

// ─── ComercialDirectory ───────────────────────────────────────────────────────
export default function ComercialDirectory({ records }: BlockProps) {
  const cotizaciones = (records ?? []) as unknown as CotizacionesRecord[]

  const { data: allClientes,  isLoading: loadingCli } = useRelationData('clientes')
  const { data: allContratos, isLoading: loadingCon } = useRelationData('contratos')

  const isLoading = loadingCli || loadingCon

  const clientNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const cot of cotizaciones) {
      const client = (allClientes as ClientesRecord[]).find(c => c.id === cot.data.cliente_id)
      map[cot.id] = client?.data.nombre ?? cot.data.nombre_proyecto ?? '—'
    }
    return map
  }, [cotizaciones, allClientes])

  const contratoMap = useMemo(() => {
    const map: Record<string, ContratosRecord | undefined> = {}
    for (const cot of cotizaciones) {
      map[cot.id] = (allContratos as ContratosRecord[]).find(
        c => c.data.cotizacion_id === cot.id
      )
    }
    return map
  }, [cotizaciones, allContratos])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 pt-2">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
      </div>
    )
  }

  return (
    <Tabs defaultValue="leads" className="w-full">
      <TabsList className="flex-wrap h-auto gap-1">
        {TABS.map(tab => {
          const count = cotizaciones.filter(c =>
            tab.estados.includes((c.data.estado ?? 'activa') as CotEstado)
          ).length
          return (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label} ({count})
            </TabsTrigger>
          )
        })}
      </TabsList>

      {TABS.map(tab => {
        const filtered = cotizaciones.filter(c =>
          tab.estados.includes((c.data.estado ?? 'activa') as CotEstado)
        )
        return (
          <TabsContent key={tab.value} value={tab.value}>
            {filtered.length === 0 ? (
              <p className="text-muted-foreground text-sm p-4">
                No hay proyectos en esta etapa.
              </p>
            ) : (
              <div className="flex flex-col gap-3 pt-2">
                {filtered.map(cot => (
                  <CotizacionCard
                     key={cot.id}
                     cotizacion={cot}
                     clientName={clientNameMap[cot.id] ?? '—'}
                     contrato={contratoMap[cot.id]}
                     onOpenCanvas={() => {}}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
