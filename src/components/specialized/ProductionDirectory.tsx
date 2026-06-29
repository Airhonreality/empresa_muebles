'use client'
import type { BlockProps } from '@agnostic/core'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMemo } from 'react'
import { useRelationData } from '@/lib/agnostic/hooks/useRelationData'
import type { OrdenesTrabajoRecord, TareasProduccionRecord, ProyectosRecord, ClientesRecord } from '@/generated/agnostic-schemas'
import ProjectNode from './ProjectNode'
import { Skeleton } from '@/components/ui/skeleton'

export default function ProductionDirectory({ records, api }: BlockProps) {
  const orders = (records ?? []) as unknown as OrdenesTrabajoRecord[]

  // Datos compartidos cargados UNA vez aquí — no en cada ProjectNode
  const { data: allTasks,  isLoading: loadingTasks  } = useRelationData('tareas_produccion')
  const { data: allQuotes, isLoading: loadingQuotes } = useRelationData('proyectos')
  const { data: allClients                           } = useRelationData('clientes')

  const isLoading = loadingTasks || loadingQuotes

  const { inProgress, warranty } = useMemo(() => {
    const inProgress = orders.filter(o =>
      o.data.estado !== 'entregada' && o.data.estado !== 'garantia'
    )
    const warranty = orders.filter(o =>
      o.data.estado === 'entregada' || o.data.estado === 'garantia'
    )
    return { inProgress, warranty }
  }, [orders])

  // Resolver clientName para cada orden aquí — un solo pass sobre los datos
  const clientNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const order of orders) {
      const cotizacion = (allQuotes as ProyectosRecord[]).find(q => q.id === order.data.proyecto_id)
      if (!cotizacion) { map[order.id] = 'Cargando...'; continue }
      const client = (allClients as ClientesRecord[]).find(c => c.id === cotizacion.data.cliente_id)
      map[order.id] = client?.data?.nombre ?? cotizacion.data.nombre_proyecto
    }
    return map
  }, [orders, allQuotes, allClients])

  const cotizacionMap = useMemo(() => {
    const map: Record<string, ProyectosRecord | undefined> = {}
    for (const order of orders) {
      map[order.id] = (allQuotes as ProyectosRecord[]).find(q => q.id === order.data.proyecto_id)
    }
    return map
  }, [orders, allQuotes])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 pt-2">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
      </div>
    )
  }

  return (
    <Tabs defaultValue="in-progress" className="w-full">
      <TabsList>
        <TabsTrigger value="in-progress">En Curso ({inProgress.length})</TabsTrigger>
        <TabsTrigger value="warranty">Garantía / Post-Venta ({warranty.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="in-progress">
        {inProgress.length === 0 ? (
          <p className="text-muted-foreground text-sm p-4">No hay órdenes en curso. Crea una desde el Cotizador.</p>
        ) : (
          <div className="flex flex-col gap-4 pt-2">
            {inProgress.map(order => (
              <ProjectNode
                key={order.id}
                record={order}
                api={api as unknown as Record<string, unknown>}
                allTasks={allTasks as TareasProduccionRecord[]}
                proyecto={cotizacionMap[order.id]}
                clientName={clientNameMap[order.id] ?? ''}
              />
            ))}
          </div>
        )}
      </TabsContent>
      <TabsContent value="warranty">
        {warranty.length === 0 ? (
          <p className="text-muted-foreground text-sm p-4">No hay órdenes en garantía o post-venta.</p>
        ) : (
          <div className="flex flex-col gap-4 pt-2">
            {warranty.map(order => (
              <ProjectNode
                key={order.id}
                record={order}
                api={api as unknown as Record<string, unknown>}
                allTasks={allTasks as TareasProduccionRecord[]}
                proyecto={cotizacionMap[order.id]}
                clientName={clientNameMap[order.id] ?? ''}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
