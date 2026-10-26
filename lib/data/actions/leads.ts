'use server'
// t-188: asociación de conversiones (leads del sitio) con clientes del ERP.
//
// El enlace lead -> persona ya existe por teléfono (el formulario lo exige). Esta acción
// agrega el vínculo formal con `clientes` para que la conversión aparezca en la ficha del
// cliente y para poder subir la conversión offline cuando exista la integración con Ads.
//
// t-189: también acepta `proyectoId` para el mapping inverso — un cliente/proyecto que ya
// existía en el ERP (creado a mano en el cotizador) se puede vincular a un clic concreto del
// sitio. Si ese proyecto ya tiene contrato, la conversión se encola de una vez.
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import { requireSesionEmpleado } from '@/lib/auth/session'
import { validarEntrada } from '@/lib/validacion/validar'
import type { Cliente, Lead } from '../contracts'
import { registrarConversionOfflineDeContrato } from '../conversion-offline'

const asociarSchema = z.object({
  leadId: z.uuid(),
  clienteId: z.uuid(),
  proyectoId: z.uuid().nullish(),
})

const convertirSchema = z.object({
  leadId: z.uuid(),
})

export async function asociarLeadAClienteAction(input: {
  leadId: string
  clienteId: string
  proyectoId?: string | null
}): Promise<Lead | null> {
  const sesion = await requireSesionEmpleado()
  if (!sesion) throw new Error('No autorizado: se requiere sesión de empleado')

  const { leadId, clienteId, proyectoId } = validarEntrada(asociarSchema, input)

  const [cliente] = await db
    .select({ id: s.clientes.id })
    .from(s.clientes)
    .where(eq(s.clientes.id, clienteId))
    .limit(1)
  if (!cliente) throw new Error('El cliente no existe')

  const [leadActual] = await db.select().from(s.leads).where(eq(s.leads.id, leadId)).limit(1)
  if (!leadActual) return null

  let valorContrato: string | null = null
  let contratoId: string | null = null

  if (proyectoId) {
    const [proyecto] = await db
      .select({ id: s.proyectos.id, clienteId: s.proyectos.clienteId })
      .from(s.proyectos)
      .where(eq(s.proyectos.id, proyectoId))
      .limit(1)
    if (!proyecto) throw new Error('El proyecto no existe')
    if (proyecto.clienteId && proyecto.clienteId !== clienteId) {
      throw new Error('El proyecto no pertenece a ese cliente')
    }

    const [contrato] = await db
      .select({ id: s.contratos.id, valorTotal: s.contratos.valorTotal })
      .from(s.contratos)
      .where(eq(s.contratos.proyectoId, proyectoId))
      .limit(1)
    if (contrato) {
      contratoId = contrato.id
      valorContrato = contrato.valorTotal
    }
  }

  // Solo se avanza la etapa hacia adelante: vincular un clic a un proyecto ya cotizado no debe
  // degradar un lead que ya estaba más avanzado.
  let etapa = leadActual.etapa
  if (contratoId) {
    etapa = 'contrato_firmado'
  } else if (
    proyectoId &&
    (etapa === 'nuevo_lead' || etapa === 'contactado' || etapa === 'asesoria_agendada')
  ) {
    etapa = 'cotizado'
  }

  const [actualizado] = await db
    .update(s.leads)
    .set({
      clienteId,
      proyectoId: proyectoId ?? leadActual.proyectoId,
      etapa,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(s.leads.id, leadId))
    .returning()

  if (contratoId && proyectoId) {
    await registrarConversionOfflineDeContrato(
      { id: contratoId, proyectoId, valorTotal: valorContrato },
      leadId,
    )
  }

  return (actualizado as unknown as Lead) ?? null
}

/**
 * Crea el cliente a partir de los datos del lead y los deja asociados en la misma transacción.
 * Si el lead ya tenía cliente, devuelve el existente sin duplicarlo.
 */
export async function convertirLeadEnClienteAction(input: { leadId: string }): Promise<Cliente | null> {
  const sesion = await requireSesionEmpleado()
  if (!sesion) throw new Error('No autorizado: se requiere sesión de empleado')

  const { leadId } = validarEntrada(convertirSchema, input)

  return db.transaction(async (tx) => {
    const [lead] = await tx.select().from(s.leads).where(eq(s.leads.id, leadId)).limit(1)
    if (!lead) return null

    if (lead.clienteId) {
      const [existente] = await tx
        .select()
        .from(s.clientes)
        .where(eq(s.clientes.id, lead.clienteId))
        .limit(1)
      if (existente) return existente as unknown as Cliente
    }

    const nombre =
      lead.nombre?.trim() ||
      (lead.telefonoWhatsapp ? `Cliente ${lead.telefonoWhatsapp}` : 'Cliente web')

    const [cliente] = await tx
      .insert(s.clientes)
      .values({
        nombre,
        telefono: lead.telefonoWhatsapp,
        email: lead.email,
      })
      .returning()

    await tx
      .update(s.leads)
      .set({ clienteId: cliente.id, updatedAt: new Date().toISOString() })
      .where(eq(s.leads.id, leadId))

    return cliente as unknown as Cliente
  })
}
