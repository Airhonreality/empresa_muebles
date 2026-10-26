// t-188/t-189: cola de conversiones offline de Google Ads.
//
// Se escribe una fila `pendiente` cuando un contrato firmado se puede atribuir a un clic de
// Google (gclid/wbraid/gbraid). La subida real necesita la API de Ads (t-110, credenciales
// [SOLO_HUMANO]); hasta entonces esto es el registro que el uploader futuro va a procesar.
//
// Vive fuera de un archivo `'use server'` para poder reutilizarse desde las Server Actions de
// contratos y de leads sin duplicar la regla de idempotencia.
import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'

/**
 * Encola `contrato_firmado` para el lead que originó el proyecto del contrato.
 *
 * Solo escribe si el lead tiene identificador de clic de Google: un lead orgánico no se puede
 * subir a Ads. Es idempotente por (lead, contrato), así que re-editar el contrato o re-asociar
 * la conversión no duplica el evento.
 *
 * Cualquier fallo acá NUNCA debe tumbar la firma del contrato ni la asociación: por eso el
 * error se registra y se devuelve `false`.
 */
export async function registrarConversionOfflineDeContrato(
  contrato: {
    id: string
    proyectoId: string
    valorTotal: string | null
  },
  leadIdForzado?: string,
): Promise<boolean> {
  try {
    const [lead] = leadIdForzado
      ? await db.select().from(s.leads).where(eq(s.leads.id, leadIdForzado)).limit(1)
      : await db
          .select()
          .from(s.leads)
          .where(eq(s.leads.proyectoId, contrato.proyectoId))
          .orderBy(desc(s.leads.createdAt))
          .limit(1)

    if (!lead) return false
    if (!lead.gclid && !lead.wbraid && !lead.gbraid) return false

    const [existente] = await db
      .select({ id: s.eventosConversionOffline.id })
      .from(s.eventosConversionOffline)
      .where(
        and(
          eq(s.eventosConversionOffline.leadId, lead.id),
          eq(s.eventosConversionOffline.contratoId, contrato.id)
        )
      )
      .limit(1)
    if (existente) return false

    await db.insert(s.eventosConversionOffline).values({
      leadId: lead.id,
      contratoId: contrato.id,
      nombreEventoGoogle: 'contrato_firmado',
      valorConversion: contrato.valorTotal ?? '0',
      gclidUsado: lead.gclid ?? lead.wbraid ?? lead.gbraid,
      hashedPhoneUsado: lead.hashedPhone,
      estadoEnvio: 'pendiente',
    })

    if (lead.etapa !== 'contrato_firmado') {
      await db
        .update(s.leads)
        .set({ etapa: 'contrato_firmado', updatedAt: new Date().toISOString() })
        .where(eq(s.leads.id, lead.id))
    }

    return true
  } catch (error) {
    console.error('No se pudo encolar la conversión offline del contrato:', error)
    return false
  }
}
