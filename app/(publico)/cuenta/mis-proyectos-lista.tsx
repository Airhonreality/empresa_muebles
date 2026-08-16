'use client'

import Link from 'next/link'
import { Badge } from '@/components/veta/badge'
import { LinkButton, buttonClassName } from '@/components/veta/button'
import { LogoutButton } from '@/components/veta/logout-button'
import type { EstadoProyecto } from '@/lib/data'
import type { ProyectosClienteData } from '@/lib/data/actions/public'

// F-07 Portal Cliente — Lista de proyectos del cliente autenticado.
// Auditoría 2026-08-15 (A5): ya no consume useDataStore() — recibe los datos ya escopados a
// este clienteId (Server Action, aislamiento R1/R26 verificado server-side) como prop desde el
// Server Component padre.

const ESTADO_LABEL: Record<EstadoProyecto, string> = {
  borrador: 'Borrador',
  en_revision: 'En revisión',
  cotizado: 'En diseño',
  negociacion: 'Negociación',
  en_contrato: 'En contrato',
  desarrollo: 'Desarrollo',
  aprobado_compras: 'Aprobado compras',
  armado: 'En taller',
  verificado: 'Verificado',
  en_instalacion: 'En instalación',
  instalado: 'Instalado',
  entregado: 'Entregado',
  perdida: 'Perdida',
  cancelada: 'Cancelada',
  activa: 'Activa',
  enviada: 'Enviada',
  pre_produccion: 'Pre-producción',
  produccion: 'Producción',
  retoma: 'Retoma',
}

const ESTADO_TONE: Record<EstadoProyecto, 'neutral' | 'info' | 'warning' | 'danger'> = {
  borrador: 'neutral',
  en_revision: 'neutral',
  cotizado: 'info',
  negociacion: 'info',
  en_contrato: 'info',
  desarrollo: 'info',
  aprobado_compras: 'info',
  armado: 'warning',
  verificado: 'warning',
  en_instalacion: 'warning',
  instalado: 'info',
  entregado: 'info',
  perdida: 'danger',
  cancelada: 'danger',
  activa: 'info',
  enviada: 'info',
  pre_produccion: 'info',
  produccion: 'warning',
  retoma: 'warning',
}

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function parseNum(s: string | null | undefined): number {
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

interface MisProyectosListaProps {
  data: ProyectosClienteData
}

export function MisProyectosLista({ data }: MisProyectosListaProps) {
  const { cliente, proyectos } = data

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">Portal cliente</p>
          <h1 className="font-display text-3xl font-semibold text-text-heading mt-1">Mis proyectos</h1>
          {cliente && <p className="text-sm text-text-muted mt-1">{cliente.nombre}</p>}
        </div>
        <div className="flex items-center gap-3">
          <LinkButton href="/cuenta/garantia" variant="ghost" size="md">
            Garantía
          </LinkButton>
          <LogoutButton />
        </div>
      </header>

      {proyectos.length === 0 ? (
        <div className="rounded-lg border border-border-subtle bg-bg-raised p-8 text-center">
          <p className="text-text-muted">No tenés proyectos registrados.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {proyectos.map(({ proyecto, espaciosCount, contrato, obligaciones }) => {
            const totalPagado = obligaciones.reduce((s, o) => s + parseNum(o.montoPagado), 0)
            const totalContrato = contrato ? parseNum(contrato.valorTotal) : 0

            return (
              <Link
                key={proyecto.id}
                href={`/cuenta/proyectos/${proyecto.id}`}
                className="block rounded-lg border border-border-subtle bg-bg-raised p-5 transition-colors hover:border-border-strong hover:bg-bg-alt"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-display text-lg font-medium text-text-heading truncate">
                        {proyecto.nombreProyecto}
                      </h2>
                      <Badge tone={ESTADO_TONE[proyecto.estado]} variant="material">
                        {ESTADO_LABEL[proyecto.estado] ?? proyecto.estado}
                      </Badge>
                    </div>
                    {proyecto.direccionObra && (
                      <p className="text-sm text-text-muted">{proyecto.direccionObra}</p>
                    )}
                  </div>
                  {/* D-02/D-03 (re-auditoría 2026-08-10): antes era un <Button> (=<button>) real acá
                      adentro -- pero toda la card ya es el <Link>, así que era un botón interactivo
                      sin onClick propio, anidado en otro elemento interactivo. Es una etiqueta visual,
                      no un segundo control: span no interactivo con el mismo look de Button. */}
                  <span className={buttonClassName('ghost', 'md')} aria-hidden>
                    Ver detalle
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-4 text-sm text-text-muted">
                  <span>{espaciosCount} ambiente{espaciosCount !== 1 ? 's' : ''}</span>
                  {contrato && (
                    <span>Contrato: {contrato.codigoContrato}</span>
                  )}
                  {totalContrato > 0 && (
                    <span className="font-mono">{formatCOP(totalContrato)}</span>
                  )}
                  {obligaciones.length > 0 && (
                    <span>
                      Pagado: {formatCOP(totalPagado)} / {formatCOP(totalContrato)}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
