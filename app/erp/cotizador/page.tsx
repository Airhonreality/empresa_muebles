'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Button, LinkButton } from '@/components/veta/button'
import { Badge } from '@/components/veta/badge'
import { Busqueda } from '@/components/veta/busqueda'
import { useDataStore } from '@/lib/data'
import { useSmartSearch } from '@/lib/hooks/useSmartSearch'

const PIPELINE_ESTADOS = ['activa', 'enviada', 'negociacion', 'en_contrato', 'retoma', 'pre_produccion', 'produccion']

const ESTADO_LABEL: Record<string, string> = {
  activa: 'Lead',
  enviada: 'Propuesta',
  negociacion: 'En Negociación',
  en_contrato: 'En Contrato',
  retoma: 'Retoma de Medidas',
  pre_produccion: 'Pre-Producción',
  produccion: 'Producción',
}

const ESTADO_TONE: Record<string, 'info' | 'warning' | 'neutral' | 'danger'> = {
  activa: 'info',
  enviada: 'warning',
  negociacion: 'warning',
  en_contrato: 'warning',
  retoma: 'neutral',
  pre_produccion: 'neutral',
  produccion: 'danger',
}

export default function CotizadorIndexPage() {
  const store = useDataStore()
  const proyectos = store.proyectos.listar()
  const clientes = store.clientes.listar()

  const eliminarProyecto = async (proj: { id: string; nombreProyecto: string }) => {
    if (window.confirm(`¿Eliminar la cotización "${proj.nombreProyecto}"? Solo se pueden eliminar cotizaciones en estado Lead. Esta acción borra todos sus datos y no se puede deshacer.`)) {
      await store.proyectos.eliminar(proj.id)
    }
  }

  const pipeline = useMemo(() => {
    const clienteMap = new Map(clientes.map((c) => [c.id, c]))
    return proyectos
      .filter((p) => PIPELINE_ESTADOS.includes(p.estado))
      .map((p) => ({ ...p, clienteNombre: clienteMap.get(p.clienteId ?? '')?.nombre }))
  }, [proyectos, clientes])

  const { query, setQuery, resultado: proyectosBuscados } = useSmartSearch({
    items: pipeline,
    getCampos: (p) => [
      p.nombreProyecto,
      p.clienteNombre ?? '',
      p.direccionObra ?? '',
      p.tipoProyecto ?? '',
    ],
    contexto: 'cotizador',
    fuzzy: true,
    limite: 500,
  })

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-heading">Cotizador</h1>
          <p className="text-sm text-text-muted">
            Seleccioná un proyecto para ver su cotización y contrato
            {query.trim() && (
              <span className="ml-2 text-gold-600">· {proyectosBuscados.length} mostrando</span>
            )}
          </p>
        </div>
        <LinkButton href="/erp/cotizador/new" variant="primary">+ Nueva Cotización</LinkButton>
      </header>

      <div className="mb-4 max-w-sm">
        <Busqueda
          valor={query}
          onChange={setQuery}
          placeholder="Buscar proyecto, cliente u obra..."
          label="Buscar cotizaciones"
        />
      </div>

      {pipeline.length === 0 ? (
        <div className="rounded-lg border border-border-subtle bg-bg-raised p-8 text-center">
          <p className="text-text-muted">No hay proyectos activos en el pipeline.</p>
          <LinkButton href="/erp/comercial" variant="primary" className="mt-4">Ir al Kanban</LinkButton>
        </div>
      ) : proyectosBuscados.length === 0 ? (
        <div className="rounded-lg border border-border-subtle bg-bg-raised p-8 text-center">
          <p className="text-text-muted">No hay cotizaciones que coincidan con la búsqueda.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {proyectosBuscados.map((proj) => (
            <Link key={proj.id} href={`/erp/cotizador/${proj.id}`}>
              <div className="rounded-lg border border-border-subtle bg-bg-raised p-4 shadow-xs transition-all duration-soft hover:border-gold-400 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-text-heading">{proj.nombreProyecto}</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {proj.clienteNombre ?? 'Sin cliente'} · {proj.diasEntregaEstimados} días · {proj.tipoProyecto === 'producto_fijo' ? 'Producto fijo' : 'Personalizado'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={ESTADO_TONE[proj.estado] ?? 'neutral'} dot>
                      {ESTADO_LABEL[proj.estado] ?? proj.estado}
                    </Badge>
                    {proj.estado === 'activa' && (
                      <Button
                        variant="ghost"
                        size="md"
                        className="h-6 min-h-0 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-bg-alt"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          void eliminarProyecto(proj)
                        }}
                        title="Eliminar cotización (solo Lead)"
                      >
                        Eliminar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
