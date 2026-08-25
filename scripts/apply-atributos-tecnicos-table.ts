import { config } from 'dotenv';
config({ path: '.env.local' });
import postgres from 'postgres';

// Aplicado a mano (no vía drizzle-kit generate) por el mismo motivo que
// scripts/apply-lead-attribution-columns.ts: el journal de drizzle/v3 tiene una corrupción
// preexistente (0011_snapshot.json es una copia idéntica de 0010_snapshot.json, mismo id/prevId —
// no generada por esta tarea) que hace fallar `drizzle-kit generate` con un choque de snapshots,
// y además schema.ts ya tiene tablas (leads, eventos_conversion_offline) sin migración generada
// todavía. Regenerar el journal completo no es parte de esta tarea — se aplica esta tabla sola,
// aditiva, sin tocar nada de lo anterior.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL no está definida en .env.local");
  process.exit(1);
}

async function crearTablaAtributosTecnicos() {
  console.log("🔄 Creando tabla atributos_tecnicos en Neon Postgres...");
  const sql = postgres(connectionString as string, { max: 1 });

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "atributos_tecnicos" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "tipo_espacio" text NOT NULL,
        "titulo" text NOT NULL,
        "cuerpo" text NOT NULL,
        "badge" text,
        "imagen_url" text,
        "visible" boolean DEFAULT true NOT NULL,
        "orden" integer DEFAULT 0 NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log("✅ Tabla atributos_tecnicos creada (o ya existía).");
  } catch (error) {
    console.error("❌ Error al crear la tabla:", error);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

crearTablaAtributosTecnicos();
