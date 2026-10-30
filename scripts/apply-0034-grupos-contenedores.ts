import { config } from 'dotenv';
config({ path: '.env.local' });
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import postgres, { type Sql } from 'postgres';

// Aplica drizzle/v3/0034_grupos_contenedores.sql a mano (no vía drizzle-kit migrate), por el
// mismo motivo que scripts/apply-0013.ts: el journal de drizzle/v3 arrastra drift/corrupción
// preexistente y `drizzle-kit migrate` re-aplicaría migraciones viejas encima.
//
// Uso:
//   npx tsx scripts/apply-0034-grupos-contenedores.ts            # dry-run (hace todo y ROLLBACK)
//   npx tsx scripts/apply-0034-grupos-contenedores.ts --apply    # aplica de verdad
//   npx tsx scripts/apply-0034-grupos-contenedores.ts DATABASE_URL_LEGACY --apply
//                                                                # otra rama de Neon (opcional)
//
// La migración es aditiva e idempotente: no borra columnas, tablas ni filas.
const args = process.argv.slice(2);
const aplicar = args.includes('--apply');
const urlVar = args.find((a) => !a.startsWith('--')) ?? 'DATABASE_URL';
const connectionString = process.env[urlVar];

if (!connectionString) {
  console.error(`❌ ${urlVar} no está definida en .env.local`);
  process.exit(1);
}

class Rollback extends Error {}

const SQL_PATH = join(process.cwd(), 'drizzle', 'v3', '0034_grupos_contenedores.sql');
const sentencias = readFileSync(SQL_PATH, 'utf8')
  .split('--> statement-breakpoint')
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !/^(--[^\n]*\n?)+$/.test(s));

async function verificar(sql: Sql) {
  const columnas = await sql`
    select column_name from information_schema.columns
    where table_name = 'grupos_item'
      and column_name in ('jornadas_desarrollo_tecnico','jornadas_ensamblaje_taller','jornadas_instalacion_obra','estado','producto_catalogo_id','updated_at')
    order by column_name
  `;
  const tablas = await sql`
    select table_name from information_schema.tables
    where table_schema = 'public' and table_name in ('contenedores_descriptivos','contenedores_artefactos')
    order by table_name
  `;
  const backfill = await sql`select count(*)::int as n from contenedores_descriptivos`;
  console.log(`   grupos_item nuevas columnas: ${columnas.length}/6 → ${columnas.map((c) => String(c.column_name)).join(', ')}`);
  console.log(`   tablas nuevas: ${tablas.map((t) => String(t.table_name)).join(', ')}`);
  console.log(`   contenedores_descriptivos: ${backfill[0].n} filas`);
  if (columnas.length !== 6 || tablas.length !== 2) {
    throw new Error('Verificación falló: falta DDL esperado');
  }
  return backfill[0].n as number;
}

/** Prueba el insert exacto que genera Drizzle (todas las columnas + returning *) dentro de una
 *  transacción que el llamador siempre revierte. */
async function smokeInsertGrupo(tx: Sql) {
  const [espacio] = await tx`select id from espacio_variantes limit 1`;
  if (!espacio) {
    console.log('   smoke insert: omitido (no hay espacio_variantes para el FK)');
    return;
  }
  const [grupo] = await tx`
    insert into "grupos_item" (
      "id","espacio_variante_id","nombre","padre_id","orden",
      "jornadas_desarrollo_tecnico","jornadas_ensamblaje_taller","jornadas_instalacion_obra",
      "estado","producto_catalogo_id","created_at","updated_at"
    ) values (
      default, ${espacio.id}, '__smoke_0034__', default, 999,
      default, default, default, default, default, default, default
    ) returning *
  `;
  console.log(`   smoke insert: OK (estado=${grupo.estado}, updated_at=${grupo.updated_at instanceof Date ? 'timestamp' : typeof grupo.updated_at})`);
}

async function main() {
  const sql = postgres(connectionString as string, { prepare: false, max: 1 });
  const host = new URL(connectionString as string).host;
  console.log(`\n📄 ${SQL_PATH}`);
  console.log(`🔗 ${urlVar} → ${host}`);
  console.log(`🧭 modo: ${aplicar ? 'APLICAR (commit)' : 'dry-run (rollback al final)'}`);
  console.log(`📦 ${sentencias.length} sentencias\n`);

  try {
    await sql.begin(async (tx) => {
      for (const [i, sentencia] of sentencias.entries()) {
        await tx.unsafe(sentencia);
        console.log(`   ✅ ${i + 1}/${sentencias.length} aplicada`);
      }
      console.log('\n🔎 Verificación:');
      await verificar(tx as unknown as Sql);
      if (!aplicar) {
        await smokeInsertGrupo(tx as unknown as Sql);
        throw new Rollback();
      }
    });
  } catch (error) {
    if (error instanceof Rollback) {
      console.log('\n↩️  dry-run: todo revertido (nada quedó escrito).');
      await sql.end();
      return;
    }
    throw error;
  }

  // Smoke test con el DDL ya commiteado, en otra transacción que siempre revierte.
  try {
    await sql.begin(async (tx) => {
      await smokeInsertGrupo(tx as unknown as Sql);
      throw new Rollback();
    });
  } catch (error) {
    if (!(error instanceof Rollback)) throw error;
  }

  console.log('\n🔎 Estado persistido:');
  await verificar(sql as unknown as Sql);
  console.log('\n✅ 0034 aplicada.');
  await sql.end();
}

main().catch(async (error) => {
  console.error('\n❌', error instanceof Error ? error.message : error);
  process.exit(1);
});
