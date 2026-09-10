import { config } from 'dotenv';
config({ path: '.env.local' });
import postgres from 'postgres';

// t-150: agrega la columna proyectos.codigo (COT-AAAA-MM-DD-NN) con backfill de las filas
// existentes. Aplicado a mano (no vía drizzle-kit migrate) por el mismo motivo que
// scripts/apply-0013.ts: el journal de drizzle/v3 tiene una corrupción preexistente que hace
// fallar drizzle-kit generate/migrate. Idempotente: se puede re-correr sin daño.
//
// Historia de bugs que este script ya resolvió (2026-09-10):
//  1) El backfill original etiquetaba con lpad(seq, 2, '0'). PostgreSQL lpad TRUNCA cuando la
//     cadena supera el largo pedido: lpad('100',2,'0') = '10'. El 2026-08-15 hubo 112
//     cotizaciones, así que seq 100-109 colapsaron a '10' y 110-112 a '11' → 11 códigos
//     COT-2026-08-15-10 y 4 COT-2026-08-15-11 que tumbaron el CREATE UNIQUE INDEX. El padding
//     se corrigió a mínimo 3 dígitos (ver generarCodigoCotizacion en lib/data).
//  2) La re-normalización original corría en sentencias autocommit separadas sobre el pooler de
//     Neon y su read-back de verificación no veía el estado ya escrito (abortaba en falso). Por
//     eso TODO el proceso (limpiar, re-asignar, NOT NULL, chequeo, índice) vive ahora en UNA
//     transacción con LOCK de tabla, sin ninguna verificación fuera de ella.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL no está definida en .env.local");
  process.exit(1);
}

async function aplicarCodigoCotizacion() {
  console.log("🔄 Aplicando migración t-150 (proyectos.codigo)...");
  const sql = postgres(connectionString as string, { max: 1 });

  try {
    await sql.begin(async (tx) => {
      await tx`ALTER TABLE "proyectos" ADD COLUMN IF NOT EXISTS "codigo" text;`;

      // Bloquea escrituras concurrentes, permitiendo lecturas; evita que el backfill compita con
      // inserts. Ese es el único momento en que la tabla queda "congelada" (milisegundos).
      await tx`LOCK TABLE "proyectos" IN SHARE ROW EXCLUSIVE MODE;`;

      await tx`ALTER TABLE "proyectos" ALTER COLUMN "codigo" DROP NOT NULL;`;
      await tx`UPDATE "proyectos" SET "codigo" = NULL;`;

      // Re-asignación determinista: fecha único (UTC, zona fija — inmuniza contra el TimeZone de
      // la sesión) + secuencial por día en orden de creación (created_at, id). row_number() en
      // una sola partición es siempre único, así el código resultante no puede repetirse.
      await tx`
        WITH base AS (
          SELECT id, to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS fecha
          FROM "proyectos"
        ),
        sec AS (
          SELECT id, fecha,
            row_number() OVER (PARTITION BY fecha ORDER BY created_at, id) AS seq
          FROM "proyectos" JOIN base USING (id)
        )
        UPDATE "proyectos" p
        SET "codigo" = 'COT-' || s.fecha || '-' || lpad(s.seq::text, 3, '0')
        FROM sec s
        WHERE p.id = s.id;
      `;
      console.log("✅ Backfill determinista (UTC) completado para todas las filas.");

      await tx`ALTER TABLE "proyectos" ALTER COLUMN "codigo" SET NOT NULL;`;
      console.log("✅ NOT NULL aplicado.");

      // Verificación DENTRO de la transacción (misma conexión, estado ya escrito — no hay
      // read-back sobre una réplica/snapshot distinta).
      const duplicados = await tx`
        SELECT codigo FROM "proyectos" GROUP BY codigo HAVING count(*) > 1 LIMIT 1;
      `;
      if (duplicados.length > 0) {
        throw new Error(`Codigos duplicados detectados (${duplicados[0].codigo}) — abortando`);
      }

      await tx`CREATE UNIQUE INDEX IF NOT EXISTS "proyectos_codigo_unique" ON "proyectos" ("codigo");`;
      console.log("✅ Índice único creado (o ya existía).");
    });

    console.log("✅ Migración t-150 aplicada (commit).");
  } catch (error) {
    console.error("❌ Error al aplicar la migración (rollback):", error);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

aplicarCodigoCotizacion();