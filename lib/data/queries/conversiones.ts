// t-188: modelo de lectura de la vista "Conversiones" de /erp/clientes.
//
// Es lógica pura (sin React, sin DB) para poder testearla con el patrón node:assert del repo.
// Cruza el lead del sitio con el cliente, el proyecto y el contrato, y clasifica la atribución
// que capturó el pixel (gclid/wbraid/gbraid + UTMs).

import { generarRefLead } from '../../leads/ref'
import type {
  Cliente,
  Contrato,
  EstadoLead,
  EventoConversionOffline,
  Lead,
  Proyecto,
} from '../contracts'

export type CanalConversion = 'google_ads' | 'organico'

export interface FilaConversion {
  id: string
  ref: string
  fecha: string
  nombre: string | null
  telefono: string | null
  email: string | null
  tipoProyecto: string | null
  ubicacion: string | null
  etapa: EstadoLead
  /** true si el pixel capturó un identificador de clic de Google (gclid/wbraid/gbraid). */
  atribuido: boolean
  canal: CanalConversion
  /** Identificador de clic efectivo (el primero disponible de gclid/wbraid/gbraid). */
  gclid: string | null
  /** t-189: identificadores crudos, para analizar lo que realmente capturó el pixel. */
  wbraid: string | null
  gbraid: string | null
  campana: string | null
  termino: string | null
  fuente: string | null
  medio: string | null
  contenido: string | null
  hashedPhone: string | null
  hashedEmail: string | null
  clienteId: string | null
  clienteNombre: string | null
  proyectoId: string | null
  proyectoCodigo: string | null
  contratoId: string | null
  contratoCodigo: string | null
  valorContrato: number
  eventosPendientes: number
  /** Sin nombre y sin teléfono: el clic llegó pero no hay forma de saber de quién es. */
  sinIdentificar: boolean
}

const NOMBRES_PLACEHOLDER = new Set(['cliente web', 'sin nombre', 'sin identificar', '(sin nombre)'])

function nombreReal(nombre: string | null | undefined): string | null {
  const limpio = nombre?.trim()
  if (!limpio) return null
  if (NOMBRES_PLACEHOLDER.has(limpio.toLowerCase())) return null
  return limpio
}

export interface ConstruirFilasInput {
  leads: Lead[]
  clientes: Cliente[]
  proyectos: Proyecto[]
  contratos: Contrato[]
  eventos: EventoConversionOffline[]
}

export function construirFilasConversion({
  leads,
  clientes,
  proyectos,
  contratos,
  eventos,
}: ConstruirFilasInput): FilaConversion[] {
  const clientesPorId = new Map(clientes.map((c) => [c.id, c]))
  const proyectosPorId = new Map(proyectos.map((p) => [p.id, p]))
  const contratosPorProyecto = new Map<string, Contrato>()
  for (const contrato of contratos) {
    if (!contratosPorProyecto.has(contrato.proyectoId)) {
      contratosPorProyecto.set(contrato.proyectoId, contrato)
    }
  }

  const eventosPendientesPorLead = new Map<string, number>()
  for (const evento of eventos) {
    if (evento.estadoEnvio !== 'pendiente') continue
    eventosPendientesPorLead.set(evento.leadId, (eventosPendientesPorLead.get(evento.leadId) ?? 0) + 1)
  }

  return leads.map((lead) => {
    const cliente = lead.clienteId ? clientesPorId.get(lead.clienteId) : undefined
    const proyecto = lead.proyectoId ? proyectosPorId.get(lead.proyectoId) : undefined
    const contrato = lead.proyectoId ? contratosPorProyecto.get(lead.proyectoId) : undefined
    const gclid = lead.gclid || lead.wbraid || lead.gbraid || null
    const atribuido = Boolean(gclid)
    const nombre = nombreReal(lead.nombre)

    return {
      id: lead.id,
      ref: generarRefLead(lead.id),
      fecha: lead.createdAt,
      nombre,
      telefono: lead.telefonoWhatsapp?.trim() || null,
      email: lead.email?.trim() || null,
      tipoProyecto: lead.tipoProyecto,
      ubicacion: lead.ubicacion,
      etapa: lead.etapa,
      atribuido,
      canal: atribuido ? 'google_ads' : 'organico',
      gclid,
      wbraid: lead.wbraid || null,
      gbraid: lead.gbraid || null,
      campana: lead.utmCampaign || null,
      termino: lead.utmTerm || null,
      fuente: lead.utmSource || null,
      medio: lead.utmMedium || null,
      contenido: lead.utmContent || null,
      hashedPhone: lead.hashedPhone || null,
      hashedEmail: lead.hashedEmail || null,
      clienteId: cliente?.id ?? null,
      clienteNombre: cliente?.nombre ?? null,
      proyectoId: proyecto?.id ?? null,
      proyectoCodigo: proyecto?.codigo ?? null,
      contratoId: contrato?.id ?? null,
      contratoCodigo: contrato?.codigoContrato ?? null,
      valorContrato: Number(contrato?.valorTotal ?? 0) || 0,
      eventosPendientes: eventosPendientesPorLead.get(lead.id) ?? 0,
      sinIdentificar: !nombre && !lead.telefonoWhatsapp?.trim(),
    }
  })
}

export type FiltroAtribucion = 'todas' | 'ads' | 'sin_ads'
export type FiltroVinculo = 'todos' | 'con_cliente' | 'sin_cliente'

export interface FiltrosConversion {
  desde?: string
  hasta?: string
  campana?: string
  etapa?: string
  atribucion?: FiltroAtribucion
  vinculo?: FiltroVinculo
  busqueda?: string
}

export function filtrarConversiones(
  filas: FilaConversion[],
  filtros: FiltrosConversion
): FilaConversion[] {
  const busqueda = filtros.busqueda?.trim().toLowerCase() ?? ''

  return filas.filter((fila) => {
    const dia = fila.fecha.slice(0, 10)
    if (filtros.desde && dia < filtros.desde) return false
    if (filtros.hasta && dia > filtros.hasta) return false
    if (filtros.campana && (fila.campana ?? '') !== filtros.campana) return false
    if (filtros.etapa && fila.etapa !== filtros.etapa) return false

    if (filtros.atribucion === 'ads' && !fila.atribuido) return false
    if (filtros.atribucion === 'sin_ads' && fila.atribuido) return false

    if (filtros.vinculo === 'con_cliente' && !fila.clienteId) return false
    if (filtros.vinculo === 'sin_cliente' && fila.clienteId) return false

    if (busqueda) {
      const campos = [
        fila.nombre,
        fila.telefono,
        fila.email,
        fila.ref,
        fila.campana,
        fila.termino,
        fila.clienteNombre,
        fila.proyectoCodigo,
        fila.proyectoId,
      ]
      const coincide = campos.some((campo) => campo?.toLowerCase().includes(busqueda))
      if (!coincide) return false
    }

    return true
  })
}

export interface KpisConversiones {
  total: number
  atribuidas: number
  sinAtribucion: number
  sinIdentificar: number
  conCliente: number
  contratos: number
  valorContratos: number
  eventosPendientes: number
}

export function calcularKpis(filas: FilaConversion[]): KpisConversiones {
  return filas.reduce<KpisConversiones>(
    (acc, fila) => {
      acc.total += 1
      if (fila.atribuido) acc.atribuidas += 1
      else acc.sinAtribucion += 1
      if (fila.sinIdentificar) acc.sinIdentificar += 1
      if (fila.clienteId) acc.conCliente += 1
      if (fila.contratoId) {
        acc.contratos += 1
        acc.valorContratos += fila.valorContrato
      }
      acc.eventosPendientes += fila.eventosPendientes
      return acc
    },
    {
      total: 0,
      atribuidas: 0,
      sinAtribucion: 0,
      sinIdentificar: 0,
      conCliente: 0,
      contratos: 0,
      valorContratos: 0,
      eventosPendientes: 0,
    }
  )
}

export function listarCampanas(filas: FilaConversion[]): string[] {
  const campanas = new Set<string>()
  for (const fila of filas) {
    if (fila.campana) campanas.add(fila.campana)
  }
  return Array.from(campanas).sort((a, b) => a.localeCompare(b, 'es'))
}
