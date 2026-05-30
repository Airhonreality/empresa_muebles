'use client'
import type { BlockProps } from '@agnostic/core'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMemo } from 'react'
import type { OrdenesTrabajoRecord } from '@/generated/agnostic-schemas'
import ProjectNode from './ProjectNode'

export default function ProductionDirectory({ records }: BlockProps) {
  const orders = records as OrdenesTrabajoRecord[]

  const { inProgress, warranty } = useMemo(() => {
    const inProgress = orders.filter(o => o.data.estado !== 'entregada' && o.data.estado !== 'terminada')
    const warranty = orders.filter(o => o.data.estado === 'entregada' || o.data.estado === 'terminada')
    return { inProgress, warranty }
  }, [orders])

  return (
    <Tabs defaultValue="in-progress" className="w-full">
      <TabsList>
        <TabsTrigger value="in-progress">En Curso</TabsTrigger>
        <TabsTrigger value="warranty">Garantía / Post-Venta</TabsTrigger>
      </TabsList>
      <TabsContent value="in-progress">
        <div className="flex flex-col gap-4">
          {inProgress.map(order => (
            <ProjectNode key={order.id} record={order} />
          ))}
        </div>
      </TabsContent>
      <TabsContent value="warranty">
        <div className="flex flex-col gap-4">
          {warranty.map(order => (
            <ProjectNode key={order.id} record={order} />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
}
