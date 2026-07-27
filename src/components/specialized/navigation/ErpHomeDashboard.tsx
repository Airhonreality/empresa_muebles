'use client'

import Link from 'next/link'
import { AlertTriangle, CalendarDays, Factory, FolderKanban, HandCoins } from 'lucide-react'
import type { BlockProps } from '@agnostic/core'
import { useRelationData } from '@/lib/agnostic/hooks/useRelationData'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const TERMINAL_PROJECT_STATES = new Set(['entregado', 'perdida', 'cancelada'])

export default function ErpHomeDashboard(_: BlockProps) {
  const { data: projects } = useRelationData('proyectos')
  const { data: workOrders } = useRelationData('ordenes_trabajo')
  const { data: obligations } = useRelationData('obligaciones_pendientes')
  const { data: tasks } = useRelationData('tareas_operativas')

  const currentProjects = projects.filter((record) => !TERMINAL_PROJECT_STATES.has(String(record.data?.estado || 'activa')))
  const openOrders = workOrders.filter((record) => !['terminada', 'entregada', 'cancelada'].includes(String(record.data?.estado || '')))
  const pendingPayments = obligations.filter((record) => !['pagada', 'cancelada'].includes(String(record.data?.estado || 'pendiente')))
  const overdueTasks = tasks.filter((record) => {
    const dueDate = record.data?.fecha_fin || record.data?.fecha
    if (!dueDate || ['completada', 'cancelada'].includes(String(record.data?.estado || ''))) return false
    return new Date(String(dueDate)).getTime() < Date.now()
  })

  const indicators = [
    { label: 'Proyectos vigentes', value: currentProjects.length, icon: FolderKanban, href: '/app/erp/proyectos' },
    { label: 'Órdenes abiertas', value: openOrders.length, icon: Factory, href: '/app/erp/taller' },
    { label: 'Pagos pendientes', value: pendingPayments.length, icon: HandCoins, href: '/app/erp/finanzas' },
    { label: 'Tareas vencidas', value: overdueTasks.length, icon: AlertTriangle, href: '/app/erp/calendar' },
  ]

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6" aria-labelledby="erp-home-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Resumen operativo</p>
          <h1 id="erp-home-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Inicio
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Prioridades transversales; cada módulo conserva sus decisiones especializadas.
          </p>
        </div>
        <Button asChild variant="outline" className="min-h-11">
          <Link href="/app/erp/calendar">
            <CalendarDays className="mr-2 h-4 w-4" aria-hidden="true" />
            Ver agenda
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {indicators.map(({ label, value, icon: Icon, href }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">{value}</p>
              <Button asChild variant="link" className="mt-2 h-auto p-0 text-xs">
                <Link href={href}>Abrir módulo</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Proyectos que requieren continuidad</CardTitle>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {currentProjects.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No hay proyectos vigentes registrados.</p>
          ) : (
            currentProjects.slice(0, 6).map((project) => (
              <div key={project.id} className="flex min-h-14 items-center justify-between gap-4 px-6 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{project.data?.nombre_proyecto || 'Proyecto sin nombre'}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {String(project.data?.estado || 'activa').replaceAll('_', ' ')}
                  </p>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/app/erp/proyectos">Ver</Link>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  )
}
