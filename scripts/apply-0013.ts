import { config } from 'dotenv';
config({ path: '.env.local' });
import postgres from 'postgres';

// Aplicado a mano (no vía drizzle-kit migrate) por el mismo motivo que
// scripts/apply-atributos-tecnicos-table.ts: el journal de drizzle/v3 tiene una corrupción
// preexistente (choque de snapshots 0010/0011 y falta 0006_snapshot.json) que hace fallar
// drizzle-kit generate/migrate. Se aplica la migración 0013 (S1 + S2) solo, sin tocar lo anterior.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL no está definida en .env.local");
  process.exit(1);
}

async function aplicarMigracion0013() {
  console.log("🔄 Aplicando migración 0013 (portafolio.proyecto_id nullable + catalogo_espacios_arquitectonicos)...");
  const sql = postgres(connectionString as string, { max: 1 });

  try {
    // S1: entradas de portafolio libres (independientes pero relacionables)
    await sql`ALTER TABLE "portafolio" ALTER COLUMN "proyecto_id" DROP NOT NULL;`;
    console.log("✅ S1: portafolio.proyecto_id ahora es nullable.");

    // S2: taxonomía orgánica de espacios (aditiva, jamás genera landing)
    await sql`
      CREATE TABLE IF NOT EXISTS "catalogo_espacios_arquitectonicos" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "codigo" text NOT NULL,
        "nombre" text NOT NULL,
        "descripcion" text,
        "unidad_base" text,
        "rango_minimo" numeric(14, 2),
        "rango_maximo" numeric(14, 2),
        "ejemplo_tamanio" text,
        "modulos_tipicos_json" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "catalogo_espacios_arquitectonicos_codigo_unique" UNIQUE("codigo")
      );
    `;
    console.log("✅ S2: catalogo_espacios_arquitectonicos creada (o ya existía).");
  } catch (error) {
    console.error("❌ Error al aplicar la migración:", error);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

aplicarMigracion0013();