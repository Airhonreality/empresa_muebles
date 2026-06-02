'use client'
import type { BlockProps } from '@agnostic/core'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { useRelationData } from '@/lib/agnostic/hooks/useRelationData'
import { useMateriaStore } from '@/lib/agnostic/store'
import { Skeleton } from '@/components/ui/skeleton'
import KanbanCanvas, { type KanbanStage, type KanbanRecord } from './KanbanCanvas'
import ProductionCard from './ProductionCard'
import type {
  OrdenesTrabajoRecord, TareasProduccionRecord,
  CotizacionesRecord, ClientesRecord,
} from '@/generated/agnostic-schemas'

const STAGES: KanbanStage[] = [
  { value: 'pendiente',   label: 'Pendiente',    color: 'slate'  },
  { value: 'en_proceso',  label: 'En proceso',   color: 'blue'   },
  { value: 'instalacion', label: 'Instalación',  color: 'orange' },
  { value: 'entregada',   label: 'Entregada',    color: 'green'  },
  { value: 'garantia',    label: 'Garantía',     color: 'muted'  },
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

export default function ProductionKanban({ records, api }: BlockProps) {
  const [localOrders, setLocalOrders] = useState<KanbanRecord[]>(
    () => (records ?? []) as KanbanRecord[]
  )

  const { data: allTasks,   isLoading: loadingTasks  } = useRelationData('tareas_produccion')
  const { data: allQuotes,  isLoading: loadingQuotes } = useRelationData('cotizaciones')
  const { data: allClients                            } = useRelationData('clientes')

  const isLoading = loadingTasks || loadingQuotes

  const clientNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const order of localOrders) {
      const cot = (allQuotes as CotizacionesRecord[]).find(q => q.id === order.data.cotizacion_id)
      if (!cot) { map[order.id] = '—'; continue }
      const client = (allClients as ClientesRecord[]).find(c => c.id === cot.data.cliente_id)
      map[order.id] = client?.data?.nombre ?? cot.data.nombre_proyecto ?? '—'
    }
    return map
  }, [localOrders, allQuotes, allClients])

  const cotizacionMap = useMemo(() => {
    const map: Record<string, CotizacionesRecord | undefined> = {}
    for (const order of localOrders) {
      map[order.id] = (allQuotes as CotizacionesRecord[]).find(
        q => q.id === order.data.cotizacion_id
      )
    }
    return map
  }, [localOrders, allQuotes])

  const handleMove = async (record: KanbanRecord, newStage: string) => {
    const previous = localOrders
    setLocalOrders(prev =>
      prev.map(o => o.id === record.id ? { ...o, data: { ...o.data, estado: newStage } } : o)
    )
    try {
      const saved = await vaultWrite('ordenes_trabajo', record.id, { ...record.data, estado: newStage })
      useMateriaStore.getState().updateItem('ordenes_trabajo', saved)
      const stageLabel = STAGES.find(s => s.value === newStage)?.label ?? newStage
      toast.success(`Orden movida a "${stageLabel}"`)
    } catch {
      setLocalOrders(previous)
      toast.error('Error al actualizar el estado.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex gap-3">
        {STAGES.map(s => (
          <div key={s.value} className="w-[272px] shrink-0">
            <Skeleton className="h-10 w-full rounded-t-xl" />
            <div className="flex flex-col gap-2 p-2 mt-0.5">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <KanbanCanvas
      records={localOrders}
      stages={STAGES}
      stageKey="estado"
      defaultStage="pendiente"
      onMoveCard={handleMove}
      renderCard={(record, stage, onMove, nextStage) => (
        <ProductionCard
          record={record}
          stage={stage}
          onMove={onMove}
          nextStage={nextStage}
          allStages={STAGES}
          api={api}
          tasks={allTasks as TareasProduccionRecord[]}
          cotizacion={cotizacionMap[record.id]}
          clientName={clientNameMap[record.id] ?? '—'}
        />
      )}
    />
  )
}
