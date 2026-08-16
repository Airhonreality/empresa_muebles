'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { LinkButton } from '@/components/veta/button'
import { Badge } from '@/components/veta/badge'
import { useDataStore } from '@/lib/data'

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

  const pipeline = useMemo(() => {
    const clienteMap = new Map(clientes.map((c) => [c.id, c]))
    return proyectos
      .filter((p) => PIPELINE_ESTADOS.includes(p.estado))
      .map((p) => ({ ...p, clienteNombre: clienteMap.get(p.clienteId ?? '')?.nombre }))
  }, [proyectos, clientes])

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-heading">Cotizador</h1>
          <p className="text-sm text-text-muted">
            Seleccioná un proyecto para ver su cotización y contrato
          </p>
        </div>
        <LinkButton href="/erp/cotizador/new" variant="primary">+ Nueva Cotización</LinkButton>
      </header>

      {pipeline.length === 0 ? (
        <div className="rounded-lg border border-border-subtle bg-bg-raised p-8 text-center">
          <p className="text-text-muted">No hay proyectos activos en el pipeline.</p>
          <LinkButton href="/erp/comercial" variant="primary" className="mt-4">Ir al Kanban</LinkButton>
        </div>
      ) : (
        <div className="grid gap-3">
          {pipeline.map((proj) => (
            <Link key={proj.id} href={`/erp/cotizador/${proj.id}`}>
              <div className="rounded-lg border border-border-subtle bg-bg-raised p-4 shadow-xs transition-all duration-soft hover:border-gold-400 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-text-heading">{proj.nombreProyecto}</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {proj.clienteNombre ?? 'Sin cliente'} · {proj.diasEntregaEstimados} días · {proj.tipoProyecto === 'producto_fijo' ? 'Producto fijo' : 'Personalizado'}
                    </p>
                  </div>
                  <Badge tone={ESTADO_TONE[proj.estado] ?? 'neutral'} dot>
                    {ESTADO_LABEL[proj.estado] ?? proj.estado}
                  </Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
