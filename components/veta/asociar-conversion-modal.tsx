'use client'

import { useEffect, useMemo, useState } from 'react'
import { Modal } from '@/components/veta/modal'
import { Button } from '@/components/veta/button'
import type { Cliente, Contrato, Lead, Proyecto } from '@/lib/data'
import { generarRefLead } from '@/lib/leads/ref'

interface AsociarConversionModalProps {
  open: boolean
  /** Modo conversión -> cliente: la conversión que se quiere vincular. */
  lead: Lead | null
  /** Modo cliente -> conversión: el cliente ya cotizado al que se le busca su clic. */
  cliente: Cliente | null
  /** Candidatos cuando se parte del cliente. */
  leads: Lead[]
  clientes: Cliente[]
  proyectos: Proyecto[]
  contratos: Contrato[]
  guardando: boolean
  onClose: () => void
  onAsociar: (args: { leadId: string; clienteId: string; proyectoId?: string | null }) => Promise<void>
  onConvertir: () => Promise<void>
}

/**
 * t-188/t-189: enlaza una conversión del sitio con un cliente del ERP.
 *
 * Dos direcciones, mismo modal:
 * - Desde la tabla de conversiones: se elige el cliente (o se crea desde el lead).
 * - Desde la tabla de clientes: se elige la conversión que originó un cliente/proyecto que
 *   ya existía en el ERP (universos que hasta ahora estaban separados).
 *
 * En ambos casos se puede elegir el proyecto cotizado. Si ese proyecto ya tiene contrato, la
 * asociación encola la conversión offline para Google Ads (idempotente).
 */
export function AsociarConversionModal({
  open,
  lead,
  cliente,
  leads,
  clientes,
  proyectos,
  contratos,
  guardando,
  onClose,
  onAsociar,
  onConvertir,
}: AsociarConversionModalProps) {
  const modoLead = lead !== null
  const modoCliente = !modoLead && cliente !== null

  const [busqueda, setBusqueda] = useState('')
  const [clienteElegido, setClienteElegido] = useState<Cliente | null>(null)
  const [leadElegido, setLeadElegido] = useState<Lead | null>(null)
  const [proyectoId, setProyectoId] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setBusqueda('')
    setClienteElegido(null)
    setLeadElegido(null)
    setProyectoId('')
    setError(null)
  }, [open, lead?.id, cliente?.id])

  const clienteDestino = modoLead ? clienteElegido : cliente
  const leadDestino = modoLead ? lead : leadElegido

  const proyectosCliente = useMemo(
    () => (clienteDestino ? proyectos.filter((p) => p.clienteId === clienteDestino.id) : []),
    [proyectos, clienteDestino]
  )

  const contratoDelProyecto = useMemo(
    () => (proyectoId ? contratos.find((c) => c.proyectoId === proyectoId) ?? null : null),
    [contratos, proyectoId]
  )

  const filtradosClientes = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const base = q
      ? clientes.filter((c) =>
          [c.nombre, c.telefono, c.email, c.documento]
            .filter(Boolean)
            .some((campo) => campo!.toLowerCase().includes(q))
        )
      : clientes
    return base.slice(0, 50)
  }, [clientes, busqueda])

  const filtradosLeads = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const base = q
      ? leads.filter((l) =>
          [l.nombre, l.telefonoWhatsapp, l.email, generarRefLead(l.id), l.utmCampaign]
            .filter(Boolean)
            .some((campo) => campo!.toLowerCase().includes(q))
        )
      : leads
    return [...base]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 50)
  }, [leads, busqueda])

  if (!open || (!lead && !cliente)) return null

  const ejecutar = async (accion: () => Promise<void>) => {
    setError(null)
    try {
      await accion()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la asociación')
    }
  }

  const asociarElegido = () => {
    if (!leadDestino || !clienteDestino) return
    return ejecutar(() =>
      onAsociar({
        leadId: leadDestino.id,
        clienteId: clienteDestino.id,
        proyectoId: proyectoId || null,
      })
    )
  }

  const titulo = modoLead ? 'Asociar conversión a un cliente' : 'Vincular conversión del sitio'

  return (
    <Modal open={open} onClose={onClose} title={titulo} maxWidthClassName="max-w-xl">
      <div className="space-y-4">
        {/* Encabezado del lado fijo (la conversión o el cliente). */}
        {modoLead && lead ? (
          <div className="rounded-sm border border-border-subtle bg-bg-alt p-3 text-sm">
            <p className="font-medium text-text-heading">
              {lead.nombre?.trim() || 'Sin nombre'} · {lead.telefonoWhatsapp?.trim() || 'Sin teléfono'}
            </p>
            <p className="mt-1 font-mono text-xs text-text-muted">
              Ref {generarRefLead(lead.id)}
              {lead.utmCampaign ? ` · Campaña ${lead.utmCampaign}` : ''}
            </p>
          </div>
        ) : cliente ? (
          <div className="rounded-sm border border-border-subtle bg-bg-alt p-3 text-sm">
            <p className="font-medium text-text-heading">{cliente.nombre}</p>
            <p className="mt-1 text-xs text-text-muted">
              {[cliente.telefono, cliente.email, cliente.documento].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {proyectosCliente.length} proyecto{proyectosCliente.length === 1 ? '' : 's'} cotizado{proyectosCliente.length === 1 ? '' : 's'} en el ERP.
            </p>
          </div>
        ) : null}

        {/* Paso 1: elegir el otro lado. */}
        {!clienteDestino || !leadDestino ? (
          <>
            {modoLead && !clienteElegido && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="w-full"
                  disabled={guardando}
                  onClick={() => ejecutar(onConvertir)}
                >
                  Crear cliente desde esta conversión
                </Button>

                <div className="relative flex items-center gap-2 text-xs uppercase tracking-wider text-text-muted">
                  <span className="h-px flex-1 bg-border-subtle" />
                  o asociar a un cliente existente
                  <span className="h-px flex-1 bg-border-subtle" />
                </div>
              </>
            )}

            {modoCliente && !leadElegido && (
              <p className="text-xs text-text-muted">
                Elige la conversión (clic o formulario capturado por el sitio) que corresponde a
                este cliente. Se puede filtrar por ref, nombre, teléfono o campaña.
              </p>
            )}

            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={modoLead ? 'Buscar cliente por nombre, teléfono o documento...' : 'Buscar conversión por ref, nombre, teléfono o campaña...'}
              className="w-full rounded-sm border border-border-strong/40 bg-bg-alt px-3 py-2 text-sm text-text-primary focus:border-gold-500 focus:outline-none"
            />

            <div className="max-h-64 overflow-y-auto rounded-sm border border-border-subtle">
              {modoLead ? (
                filtradosClientes.length === 0 ? (
                  <p className="p-4 text-sm text-text-muted">No hay clientes con esa búsqueda.</p>
                ) : (
                  <ul className="divide-y divide-border-subtle">
                    {filtradosClientes.map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-3 p-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-text-heading">{c.nombre}</p>
                          <p className="truncate text-xs text-text-muted">
                            {[c.telefono, c.email, c.documento].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="md"
                          disabled={guardando}
                          onClick={() => {
                            setClienteElegido(c)
                            setProyectoId('')
                          }}
                        >
                          Elegir
                        </Button>
                      </li>
                    ))}
                  </ul>
                )
              ) : filtradosLeads.length === 0 ? (
                <p className="p-4 text-sm text-text-muted">No hay conversiones con esa búsqueda.</p>
              ) : (
                <ul className="divide-y divide-border-subtle">
                  {filtradosLeads.map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text-heading">
                          {l.nombre?.trim() || l.telefonoWhatsapp?.trim() || 'Sin identificar'}
                        </p>
                        <p className="truncate font-mono text-xs text-text-muted">
                          {generarRefLead(l.id)} · {new Date(l.createdAt).toLocaleDateString('es-CO')}
                          {l.utmCampaign ? ` · ${l.utmCampaign}` : ''}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        disabled={guardando}
                        onClick={() => {
                          setLeadElegido(l)
                          setProyectoId('')
                        }}
                      >
                        Elegir
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Paso 2: confirmar y elegir proyecto. */}
            <div className="rounded-sm border border-gold-600/30 bg-bg-alt p-3 text-sm">
              <p className="text-text-heading">
                {modoLead ? (
                  <>
                    <span className="font-mono text-xs">{generarRefLead(leadDestino.id)}</span> → {clienteDestino.nombre}
                  </>
                ) : (
                  <>
                    {clienteDestino.nombre} → <span className="font-mono text-xs">{generarRefLead(leadDestino.id)}</span>
                  </>
                )}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                La conversación de WhatsApp y el nombre viajan con la ref; el vínculo formal permite
                cruzar la campaña con el proyecto y su valor.
              </p>
            </div>

            <label className="flex flex-col gap-1 text-xs text-text-muted">
              Proyecto cotizado (opcional)
              <select
                value={proyectoId}
                onChange={(e) => setProyectoId(e.target.value)}
                className="rounded-sm border border-border-strong/40 bg-bg-alt px-2 py-2 text-sm text-text-primary focus:border-gold-500 focus:outline-none"
              >
                <option value="">Sin proyecto específico</option>
                {proyectosCliente.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo} · {p.nombreProyecto}
                  </option>
                ))}
              </select>
            </label>

            {contratoDelProyecto && (
              <p className="rounded-sm border border-border-subtle bg-bg-alt px-3 py-2 text-xs text-text-muted">
                Este proyecto ya tiene el contrato <span className="font-mono">{contratoDelProyecto.codigoContrato}</span>.
                Al asociar, la conversión quedará en cola para Google Ads con el valor contractual
                (se sube cuando existan las credenciales de su API).
              </p>
            )}

            {!proyectoId && (
              <p className="text-xs text-text-muted">
                Sin proyecto, la conversión solo se vincula a la persona; no se puede cruzar con el
                valor de un contrato.
              </p>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="md"
                disabled={guardando}
                onClick={() => {
                  if (modoLead) setClienteElegido(null)
                  else setLeadElegido(null)
                  setProyectoId('')
                }}
              >
                Cambiar selección
              </Button>
              <Button type="button" variant="primary" size="md" disabled={guardando} onClick={asociarElegido}>
                {guardando ? 'Asociando...' : 'Asociar conversión'}
              </Button>
            </div>
          </>
        )}

        {error && <p className="text-sm text-error-text">{error}</p>}
      </div>
    </Modal>
  )
}
