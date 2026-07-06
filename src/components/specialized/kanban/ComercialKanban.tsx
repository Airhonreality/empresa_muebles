'use client'
import type { BlockProps } from '@agnostic/core'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { LayoutGrid, PanelsTopLeft } from 'lucide-react'
import { useRelationData } from '@/lib/agnostic/hooks/useRelationData'
import { useMateriaStore } from '@/lib/agnostic/store'
import { processEvents } from '@/lib/agnostic/eventProcessor'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import KanbanCanvas, { STAGE_COLORS, type KanbanStage, type KanbanRecord } from './KanbanCanvas'
import ComercialCard from './ComercialCard'
import type {
  ProyectosRecord, ClientesRecord, ContratosRecord,
  AbonosContratoRecord, EspacioVariantesRecord,
} from '@/generated/agnostic-schemas'

const STAGES: KanbanStage[] = [
  { value: 'activa',         label: 'Lead',          color: 'amber'  },
  { value: 'enviada',        label: 'Propuesta',      color: 'blue'   },
  { value: 'en_contrato',    label: 'En contrato',    color: 'violet' },
  { value: 'pre_produccion', label: 'Pre-producción', color: 'orange' },
  { value: 'produccion',     label: 'Producción',     color: 'green'  },
  { value: 'entregado',      label: 'Entregado',     color: 'green'  },
  { value: 'perdida',        label: 'Perdida',       color: 'rose'   },
  { value: 'cancelada',      label: 'Cancelada',     color: 'muted'  },
]

async function vaultWrite(namespace: string, id: string, data: Record<string, unknown>) {
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
  const raw = await res.text()
  let body: any = {}
  try {
    body = raw ? JSON.parse(raw) : {}
  } catch {
    body = { success: false, error: raw || 'Respuesta invalida del engine.' }
  }
  await processEvents(body.events ?? [], useMateriaStore.getState().updateItem)
  if (!res.ok || body.success === false) {
    throw new Error(body.error || raw || 'Error al ejecutar el zap.')
  }
  return body
}

export default function ComercialKanban({ records }: BlockProps) {
  const [localProyectos, setLocalProyectos] = useState<KanbanRecord[]>(
    () => (records ?? []) as KanbanRecord[]
  )
  const [viewMode, setViewMode] = useState<'tabs' | 'tree'>('tabs')

  const { data: allClientes,  isLoading: loadingCli  } = useRelationData('clientes')
  const { data: allContratos, isLoading: loadingCon  } = useRelationData('contratos')
  const { data: allAbonos,    isLoading: loadingAbo  } = useRelationData('abonos_contrato')
  const { data: allEspacios,  isLoading: loadingEsp  } = useRelationData('espacio_variantes')

  const isLoading = loadingCli || loadingCon || loadingAbo || loadingEsp

  const clientMap = useMemo(() => {
    const map: Record<string, ClientesRecord> = {}
    for (const c of allClientes as ClientesRecord[]) map[c.id] = c
    return map
  }, [allClientes])

  const contratoMap = useMemo(() => {
    const map: Record<string, ContratosRecord | undefined> = {}
    for (const cot of localProyectos) {
      map[cot.id] = (allContratos as ContratosRecord[]).find(
        c => c.data.proyecto_id === cot.id
      )
    }
    return map
  }, [localProyectos, allContratos])

  const abonosMap = useMemo(() => {
    const map: Record<string, AbonosContratoRecord[]> = {}
    for (const a of allAbonos as AbonosContratoRecord[]) {
      const cid = a.data.contrato_id as string
      map[cid] = [...(map[cid] ?? []), a]
    }
    return map
  }, [allAbonos])

  const espaciosByCot = useMemo(() => {
    const map: Record<string, EspacioVariantesRecord[]> = {}
    for (const s of allEspacios as EspacioVariantesRecord[]) {
      const cid = s.data.proyecto_id as string
      map[cid] = [...(map[cid] ?? []), s]
    }
    return map
  }, [allEspacios])

  const groupedByStage = useMemo(() => {
    const map: Record<string, KanbanRecord[]> = {}
    for (const stage of STAGES) map[stage.value] = []
    for (const project of localProyectos) {
      const stage = String(project.data.estado || 'activa')
      if (!map[stage]) map[stage] = []
      map[stage].push(project)
    }
    return map
  }, [localProyectos])

  const handleMove = async (record: KanbanRecord, newStage: string) => {
    const previous = localProyectos
    const estadoActual = String(record.data?.estado ?? 'activa')
    try {
      await zapCall('zap_validar_transicion_estado', { estado_actual: estadoActual, estado_destino: newStage })
      setLocalProyectos(prev =>
        prev.map(c => c.id === record.id ? { ...c, data: { ...c.data, estado: newStage } } : c)
      )
      const saved = await vaultWrite('proyectos', record.id, { ...record.data, estado: newStage })
      useMateriaStore.getState().updateItem('proyectos', saved)
      const stageLabel = STAGES.find(s => s.value === newStage)?.label ?? newStage
      toast.success(`Proyecto movido a "${stageLabel}"`)
    } catch (error) {
      setLocalProyectos(previous)
      if (error instanceof Error && /Transicion ilegal|rechazad|Guardia de transicion/i.test(error.message)) {
        return
      }
      toast.error('Error al mover el proyecto.')
    }
  }

  const handleActivateProduction = async (record: KanbanRecord) => {
    const previous = localProyectos
    try {
      await zapCall('zap_activar_produccion', { record })
      const updated = { ...record, data: { ...record.data, estado: 'produccion' } }
      setLocalProyectos(prev => prev.map(c => c.id === record.id ? updated : c))
      useMateriaStore.getState().updateItem('proyectos', updated)
    } catch (error) {
      setLocalProyectos(previous)
      if (error instanceof Error && /Transicion ilegal|rechazad|Guardia de transicion/i.test(error.message)) {
        return
      }
      toast.error('No se pudo activar la produccion.')
      throw error
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6 bg-stone-50/50">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full h-full bg-stone-50/20 p-6 rounded-xl border border-stone-200/40">
      <div className="mb-6 flex flex-col gap-4 border-b border-stone-200/70 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-stone-600">
            <PanelsTopLeft className="h-3.5 w-3.5" />
            Centro comercial CRM
          </div>
          <h2 className="text-xl font-black tracking-tight text-stone-950">Leads, propuestas, contratos y transición a producción</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            El tablero comercial comparte la misma familia visual del taller, pero se organiza por pestañas de estado para reducir ruido vertical.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode('tabs')}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${
                viewMode === 'tabs'
                  ? 'bg-stone-950 text-white shadow-sm'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Pestañas
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${
                viewMode === 'tree'
                  ? 'bg-stone-950 text-white shadow-sm'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <PanelsTopLeft className="h-4 w-4" />
              Arbol
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'tree' ? (
        <KanbanCanvas
          records={localProyectos}
          stages={STAGES}
          stageKey="estado"
          defaultStage="activa"
          onMoveCard={handleMove}
          renderCard={(record, stage, onMove, nextStage) => {
            const cot     = record as unknown as ProyectosRecord
            const client  = clientMap[(cot.data.cliente_id ?? '') as string]
            const contrato = contratoMap[cot.id]
            const abonos  = contrato ? (abonosMap[contrato.id] ?? []) : []
            const espacios = espaciosByCot[cot.id] ?? []
            return (
              <ComercialCard
                record={record}
                stage={stage}
                onMove={onMove}
                onActivateProduction={handleActivateProduction}
                nextStage={nextStage}
                allStages={STAGES}
                client={client}
                contrato={contrato}
                abonos={abonos}
                espacios={espacios}
              />
            )
          }}
        />
      ) : (
        <Tabs defaultValue={STAGES[0].value} className="w-full">
          <TabsList className="mb-4 flex h-auto flex-wrap gap-2 bg-transparent p-0">
            {STAGES.map((stage) => {
              const count = groupedByStage[stage.value]?.length ?? 0
              return (
                <TabsTrigger
                  key={stage.value}
                  value={stage.value}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-stone-600 data-[state=active]:border-stone-950 data-[state=active]:bg-stone-950 data-[state=active]:text-white"
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${STAGE_COLORS[stage.color]?.dot}`} />
                  {stage.label}
                  <Badge variant="secondary" className="ml-1 bg-stone-100 text-stone-600">
                    {count}
                  </Badge>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {STAGES.map((stage) => {
            const stageRecords = groupedByStage[stage.value] ?? []
            return (
              <TabsContent key={stage.value} value={stage.value} className="mt-0 outline-none">
                <Card className="border-stone-200 bg-white shadow-sm">
                  <CardContent className="p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-stone-500">Estado</p>
                        <h3 className="mt-1 text-lg font-black text-stone-950">{stage.label}</h3>
                      </div>
                      <Badge variant="outline" className={`border-stone-200 ${STAGE_COLORS[stage.color]?.badge}`}>
                        {stageRecords.length} proyecto(s)
                      </Badge>
                    </div>

                    {stageRecords.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-sm text-stone-500">
                        No hay proyectos en este estado.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {stageRecords.map((record, index) => {
                          const cot = record as unknown as ProyectosRecord
                          const client = clientMap[(cot.data.cliente_id ?? '') as string]
                          const contrato = contratoMap[cot.id]
                          const abonos = contrato ? (abonosMap[contrato.id] ?? []) : []
                          const espacios = espaciosByCot[cot.id] ?? []
                          const nextStage = STAGES[index + 1] ?? null
                          return (
                            <div key={record.id} className="rounded-2xl border border-stone-200/80 bg-stone-50/40 shadow-sm">
                              <ComercialCard
                                record={record}
                                stage={stage}
                                onMove={(newStage) => handleMove(record, newStage)}
                                onActivateProduction={handleActivateProduction}
                                nextStage={nextStage}
                                allStages={STAGES}
                                client={client}
                                contrato={contrato}
                                abonos={abonos}
                                espacios={espacios}
                              />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )
          })}
        </Tabs>
      )}
    </div>
  )
}
