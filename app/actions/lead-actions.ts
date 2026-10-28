"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { leads } from "@/lib/db/schema";
import { normalizeAndHashPhone, normalizeAndHashEmail } from "@/lib/security/user-hashing";
import {
  construirMensajeWhatsApp,
  construirUrlWhatsApp,
  generarRefLead,
} from "@/lib/leads/ref";

export interface SubmitLeadInput {
  /** UUID generado en el navegador: permite que la referencia del mensaje exista aunque la DB tarde. */
  leadId?: string;
  nombre?: string;
  telefono: string;
  email?: string;
  tipoProyecto?: string;
  ubicacion?: string;
  gclid?: string;
  wbraid?: string;
  gbraid?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

export interface SubmitLeadResponse {
  success: boolean;
  leadId?: string;
  /** Referencia corta (VD-XXXXXXXX). Se conserva en el response para compatibilidad ERP;
   * ya NO viaja en el cuerpo del mensaje de WhatsApp. */
  ref?: string;
  whatsappUrl?: string;
  error?: string;
}

// t-188: `nombre` deja de ser obligatorio (el formulario lo marca opcional). El teléfono sí:
// es la llave que enlaza el clic con la conversación real de WhatsApp.
const submitLeadSchema = z.object({
  leadId: z.uuid().optional(),
  nombre: z.string().trim().max(120).optional(),
  telefono: z.string().trim().min(1),
  email: z.string().trim().max(200).optional(),
  tipoProyecto: z.string().trim().max(120).optional(),
  ubicacion: z.string().trim().max(120).optional(),
  gclid: z.string().trim().max(500).optional(),
  wbraid: z.string().trim().max(500).optional(),
  gbraid: z.string().trim().max(500).optional(),
  utmSource: z.string().trim().max(200).optional(),
  utmMedium: z.string().trim().max(200).optional(),
  utmCampaign: z.string().trim().max(200).optional(),
  utmTerm: z.string().trim().max(200).optional(),
  utmContent: z.string().trim().max(200).optional(),
});

const WHATSAPP_NUMBER = "573025922101";

/**
 * Server Action para guardar un lead con atribución completa (GCLID/GBRAID/WBRAID),
 * hasheado Enhanced Conversions SHA-256 en PostgreSQL y generar la URL de WhatsApp.
 *
 * El `leadId` lo genera el navegador antes de llamar: así la fila de la DB se identifica
 * aunque la escritura tarde o el usuario abandone la página apenas se abre WhatsApp.
 * La referencia corta (`ref`) se devuelve en el response para compatibilidad con el ERP,
 * pero ya NO se inyecta en el cuerpo del mensaje de WhatsApp; el enlace clic->persona se
 * hace por teléfono y el seguimiento va por el píxel (gtag con user_data: nombre + teléfono
 * hasheado).
 */
export async function submitLeadAction(input: SubmitLeadInput): Promise<SubmitLeadResponse> {
  const parsed = submitLeadSchema.safeParse(input);
  if (!parsed.success) {
    const primero = parsed.error.issues[0];
    return {
      success: false,
      error: `Datos inválidos: ${primero?.path.join(".") || "formulario"} — ${primero?.message || "revisa el formulario"}`,
    };
  }

  const data = parsed.data;
  const nombre = data.nombre?.trim() || "";
  const tipoProyecto = data.tipoProyecto?.trim() || "Cocina";
  const ubicacion = data.ubicacion?.trim() || "Bogotá";
  // El navegador siempre manda leadId; si algún llamador no lo hace, el servidor genera uno
  // para que la referencia del mensaje siga siendo válida y única.
  const leadIdFinal = data.leadId ?? crypto.randomUUID();
  const ref = generarRefLead(leadIdFinal);

  try {
    // 1. Normalización E.164 y hashing SHA-256
    const phoneData = normalizeAndHashPhone(data.telefono, "CO");
    const hashedEmail = normalizeAndHashEmail(data.email);

    const formattedPhone = phoneData.rawE164Phone || data.telefono;

    // 2. Insertar en la base de datos PostgreSQL via Drizzle. `onConflictDoNothing` hace
    //    idempotente el reintento del mismo leadId (doble clic / reintento tras timeout).
    const [insertedLead] = await db
      .insert(leads)
      .values({
        id: leadIdFinal,
        nombre,
        telefonoWhatsapp: formattedPhone,
        email: data.email?.trim() || null,
        gclid: data.gclid || null,
        wbraid: data.wbraid || null,
        gbraid: data.gbraid || null,
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || null,
        utmTerm: data.utmTerm || null,
        utmContent: data.utmContent || null,
        hashedPhone: phoneData.hashedPhone || null,
        hashedEmail: hashedEmail || null,
        tipoProyecto,
        ubicacion,
        etapa: "nuevo_lead",
      })
      .onConflictDoNothing({ target: leads.id })
      .returning({ id: leads.id });

    let leadId = insertedLead?.id;
    if (!leadId) {
      const [existente] = await db
        .select({ id: leads.id })
        .from(leads)
        .where(eq(leads.id, leadIdFinal))
        .limit(1);
      leadId = existente?.id;
    }

    // 3. Generar mensaje de WhatsApp pre-llenado (nombre real o saludo sin él; ya sin referencia corta)
    const mensajeText = construirMensajeWhatsApp({
      nombre,
      tipoProyecto,
      ubicacion,
    });

    return {
      success: true,
      leadId,
      /** ref se conserva en el response para compatibilidad ERP (tablas/modales de conversión);
       * ya NO viaja en el cuerpo del mensaje de WhatsApp. */
      ref,
      whatsappUrl: construirUrlWhatsApp(WHATSAPP_NUMBER, mensajeText),
    };
  } catch (error) {
    console.error("Error al registrar el lead:", error);
    return {
      success: false,
      error: "Error interno al guardar la información. Por favor reintente.",
    };
  }
}
