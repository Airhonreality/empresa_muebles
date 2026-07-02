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
  { value: 'garantia',    label: 'Garantía',     color: 'rose'   },
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
      <div className="flex flex-col gap-4 p-6 bg-stone-50/50">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full h-full bg-stone-50/20 min-h-screen">
      <Tabs defaultValue="kanban" className="w-full flex-1 flex flex-col">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-6 py-5 border-b border-stone-200/80 bg-white gap-4 shadow-2xs">
          <div>
            <h2 className="text-xl font-bold text-stone-850 tracking-tight">Centro de Taller</h2>
            <p className="text-xs text-stone-400 mt-0.5">Control de órdenes de trabajo, fabricación y abastecimiento de insumos.</p>
          </div>
          <TabsList className="bg-stone-100 p-1 rounded-xl shrink-0">
            <TabsTrigger value="kanban" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-bold text-stone-600 transition-all">
              Tablero de Taller
            </TabsTrigger>
            <TabsTrigger value="abastecimiento" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-xs font-bold text-stone-650 transition-all">
              Central de Abastecimiento
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab content wrapper */}
        <TabsContent value="kanban" className="flex-1 m-0 p-6 outline-none">
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

        <TabsContent value="abastecimiento" className="m-0 p-6 outline-none flex-1 overflow-y-auto">
          <CentralAbastecimientoGlobal 
            block={{} as any}
            context="obligaciones_pendientes"
            schema={{} as any}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
