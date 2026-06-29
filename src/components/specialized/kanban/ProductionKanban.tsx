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
  ProyectosRecord, ClientesRecord,
} from '@/generated/agnostic-schemas'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CentralAbastecimientoGlobal from '../WidgetArmadoOrdenCompra'

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
  const { data: allProjects,  isLoading: loadingProjects } = useRelationData('proyectos')
  const { data: allClients                            } = useRelationData('clientes')

  const isLoading = loadingTasks || loadingProjects

  const clientNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const order of localOrders) {
      const project = (allProjects as ProyectosRecord[]).find(q => q.id === order.data.proyecto_id)
      if (!project) { map[order.id] = '—'; continue }
      const client = (allClients as ClientesRecord[]).find(c => c.id === project.data.cliente_id)
      map[order.id] = client?.data?.nombre ?? project.data.nombre_proyecto ?? '—'
    }
    return map
  }, [localOrders, allProjects, allClients])

  const projectMap = useMemo(() => {
    const map: Record<string, ProyectosRecord | undefined> = {}
    for (const order of localOrders) {
      map[order.id] = (allProjects as ProyectosRecord[]).find(
        q => q.id === order.data.proyecto_id
      )
    }
    return map
  }, [localOrders, allProjects])

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
    <div className="flex flex-col w-full h-full space-y-4">
      <Tabs defaultValue="kanban" className="w-full flex-1 flex flex-col">
        <div className="flex justify-between items-center px-4 py-2 border-b bg-white">
          <h2 className="text-xl font-bold text-stone-800 tracking-tight">Centro de Taller</h2>
          <TabsList className="bg-stone-100 p-1 rounded-lg">
            <TabsTrigger value="kanban" className="px-6 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm font-semibold">
              Tablero de Producción
            </TabsTrigger>
            <TabsTrigger value="abastecimiento" className="px-6 py-2 rounded-md data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-sm text-sm font-semibold transition-colors">
              Central de Abastecimiento
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="kanban" className="flex-1 overflow-hidden m-0 p-4 outline-none">
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
                api={api as unknown as Record<string, unknown>}
                tasks={allTasks as TareasProduccionRecord[]}
                proyecto={projectMap[record.id]}
                clientName={clientNameMap[record.id] ?? '—'}
              />
            )}
          />
        </TabsContent>

        <TabsContent value="abastecimiento" className="m-0 p-4 outline-none flex-1 overflow-y-auto">
          <CentralAbastecimientoGlobal 
            block={{} as any}
            context="obligaciones_pendientes"
            schema={{} as any} // Agnostic schema bypass as the component loads data natively
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
