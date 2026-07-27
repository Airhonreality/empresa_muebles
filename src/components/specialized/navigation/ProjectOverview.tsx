'use client'

import Link from 'next/link'
import { Archive, Factory, FileText, MapPin, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { BlockProps } from '@agnostic/core'
import { useRelationData } from '@/lib/agnostic/hooks/useRelationData'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const TERMINAL_STATES = new Set(['entregado', 'perdida', 'cancelada'])

function stateLabel(value: unknown) {
  return String(value || 'activa').replaceAll('_', ' ')
}

export default function ProjectOverview({ records }: BlockProps) {
  const projects = records ?? []
  const { data: spaces } = useRelationData('espacio_variantes')
  const { data: workOrders } = useRelationData('ordenes_trabajo')
  const [query, setQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const visibleProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es')
    return projects.filter((project) => {
      const state = String(project.data?.estado || 'activa')
      if (!showArchived && TERMINAL_STATES.has(state)) return false
      if (!normalizedQuery) return true
      const searchable = [
        project.data?.nombre_proyecto,
        project.data?.direccion_obra,
        stateLabel(state),
      ].join(' ').toLocaleLowerCase('es')
      return searchable.includes(normalizedQuery)
    })
  }, [projects, query, showArchived])

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-5" aria-labelledby="projects-title">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Agregado transversal</p>
          <h1 id="projects-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">Proyectos</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Continuidad comercial, técnica, productiva y financiera. Producción sigue siendo el tablero de ejecución.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/app/erp/cotizador"><FileText className="mr-2 h-4 w-4" />Cotizador</Link>
          </Button>
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/app/erp/taller"><Factory className="mr-2 h-4 w-4" />Producción</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por proyecto, ubicación o estado"
            className="h-11 pl-10"
            aria-label="Buscar proyectos"
          />
        </div>
        <Button
          variant={showArchived ? 'secondary' : 'outline'}
          className="min-h-11"
          onClick={() => setShowArchived((current) => !current)}
          aria-pressed={showArchived}
        >
          <Archive className="mr-2 h-4 w-4" aria-hidden="true" />
          {showArchived ? 'Ocultar históricos' : 'Incluir históricos'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleProjects.map((project) => {
          const projectSpaces = spaces.filter((space) => space.data?.proyecto_id === project.id)
          const projectOrders = workOrders.filter((order) => order.data?.proyecto_id === project.id)
          return (
            <Card key={project.id} className="overflow-hidden">
              <CardContent className="flex h-full flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">
                      {String(project.data?.nombre_proyecto || 'Proyecto sin nombre')}
                    </h2>
                    {Boolean(project.data?.direccion_obra) && (
                      <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {String(project.data.direccion_obra)}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary" className="shrink-0 capitalize">
                    {stateLabel(project.data?.estado)}
                  </Badge>
                </div>

                <dl className="grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Espacios</dt>
                    <dd className="mt-1 font-semibold tabular-nums">{projectSpaces.length}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Órdenes</dt>
                    <dd className="mt-1 font-semibold tabular-nums">{projectOrders.length}</dd>
                  </div>
                </dl>

                <div className="mt-auto flex gap-2">
                  <Button asChild variant="outline" size="sm" className="min-h-10 flex-1">
                    <Link href={`/app/ficha/${project.id}`}>Ficha operativa</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {visibleProjects.length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No hay proyectos que coincidan con los filtros.
        </div>
      )}
    </section>
  )
}
