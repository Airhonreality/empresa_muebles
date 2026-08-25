"use server";

import { db } from "@/lib/db/client";
import { leads } from "@/lib/db/schema";
import { normalizeAndHashPhone, normalizeAndHashEmail } from "@/lib/security/user-hashing";

export interface SubmitLeadInput {
  nombre: string;
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
  whatsappUrl?: string;
  error?: string;
}

/**
 * Server Action para guardar un lead con atribución completa (GCLID/GBRAID/WBRAID),
 * hasheado Enhanced Conversions SHA-256 en PostgreSQL y generar la URL de WhatsApp.
 */
export async function submitLeadAction(input: SubmitLeadInput): Promise<SubmitLeadResponse> {
  try {
    if (!input.nombre || !input.telefono) {
      return { success: false, error: "Nombre y teléfono son obligatorios" };
    }

    // 1. Normalización E.164 y hashing SHA-256
    const phoneData = normalizeAndHashPhone(input.telefono, "CO");
    const hashedEmail = normalizeAndHashEmail(input.email);

    const formattedPhone = phoneData.rawE164Phone || input.telefono;

    // 2. Insertar en la base de datos PostgreSQL via Drizzle
    const [insertedLead] = await db
      .insert(leads)
      .values({
        nombre: input.nombre.trim(),
        telefonoWhatsapp: formattedPhone,
        email: input.email?.trim() || null,
        gclid: input.gclid || null,
        wbraid: input.wbraid || null,
        gbraid: input.gbraid || null,
        utmSource: input.utmSource || null,
        utmMedium: input.utmMedium || null,
        utmCampaign: input.utmCampaign || null,
        utmTerm: input.utmTerm || null,
        utmContent: input.utmContent || null,
        hashedPhone: phoneData.hashedPhone || null,
        hashedEmail: hashedEmail || null,
        tipoProyecto: input.tipoProyecto || "Cocina Integral",
        ubicacion: input.ubicacion || "Bogotá",
        etapa: "nuevo_lead",
      })
      .returning({ id: leads.id });

    // 3. Generar mensaje de WhatsApp pre-llenado
    const whatsappNumber = "573025922101"; // Teléfono oficial Veta de Oro
    const mensajeText = `Hola Veta de Oro, mi nombre es ${input.nombre.trim()}. Estoy interesado en un proyecto de ${
      input.tipoProyecto || "Cocina"
    } en ${input.ubicacion || "Bogotá"}. Solicito mi asesoría.`;

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(mensajeText)}`;

    return {
      success: true,
      leadId: insertedLead.id,
      whatsappUrl,
    };
  } catch (error) {
    console.error("Error al registrar el lead:", error);
    return {
      success: false,
      error: "Error interno al guardar la información. Por favor reintente.",
    };
  }
}
