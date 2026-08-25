import { config } from 'dotenv';
config({ path: '.env.local' });
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL no está definida en .env.local");
  process.exit(1);
}

async function migrateLeadsSchema() {
  console.log("🔄 Aplicando columnas de atribución y tabla eventos_conversion_offline a Neon Postgres...");
  const sql = postgres(connectionString as string, { max: 1 });

  try {
    // 1. Crear enums si no existen
    await sql`
      DO $$ BEGIN
        CREATE TYPE estado_lead AS ENUM ('nuevo_lead', 'contactado', 'asesoria_agendada', 'cotizado', 'contrato_firmado', 'descartado');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await sql`
      DO $$ BEGIN
        CREATE TYPE estado_envio_google AS ENUM ('pendiente', 'procesando', 'enviado_exitoso', 'error_matching');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    // 2. Agregar columnas faltantes a la tabla `leads`
    await sql`ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "gclid" text;`;
    await sql`ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "wbraid" text;`;
    await sql`ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "gbraid" text;`;
    await sql`ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "utm_term" text;`;
    await sql`ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "utm_content" text;`;
    await sql`ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "hashed_phone" text;`;
    await sql`ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "hashed_email" text;`;
    await sql`ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "tipo_proyecto" text;`;
    await sql`ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "ubicacion" text;`;
    await sql`ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "etapa" estado_lead DEFAULT 'nuevo_lead' NOT NULL;`;
    await sql`ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "proyecto_id" uuid;`;
    await sql`ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "cliente_id" uuid;`;
    await sql`ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;`;

    // 3. Crear la tabla `eventos_conversion_offline`
    await sql`
      CREATE TABLE IF NOT EXISTS "eventos_conversion_offline" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "lead_id" uuid NOT NULL REFERENCES "leads"("id") ON DELETE CASCADE,
        "contrato_id" uuid REFERENCES "contratos"("id") ON DELETE SET NULL,
        "nombre_evento_google" text NOT NULL,
        "valor_conversion" numeric(14, 2) DEFAULT '0' NOT NULL,
        "gclid_usado" text,
        "hashed_phone_usado" text,
        "estado_envio" estado_envio_google DEFAULT 'pendiente' NOT NULL,
        "respuesta_google_api" jsonb,
        "reintentos" integer DEFAULT 0,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "enviado_en" timestamp
      );
    `;

    console.log("✅ Columnas de atribución y tabla de conversiones offline creadas exitosamente en Neon Postgres.");
  } catch (error) {
    console.error("❌ Error al aplicar migración:", error);
  } finally {
    await sql.end();
  }
}

migrateLeadsSchema();
