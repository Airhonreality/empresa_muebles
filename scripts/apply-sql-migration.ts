import { config } from 'dotenv';
config({ path: '.env.local' });
import { readFileSync } from 'node:fs';
import postgres from 'postgres';

// Runner genérico para migraciones ad-hoc de drizzle/v3 que NO pasan por `drizzle-kit migrate`
// (el journal tiene drift/corrupción preexistente — ver scripts/apply-0013.ts).
// Aplica el archivo completo en UNA transacción: si una sentencia falla, no queda nada a medias.
//
// Uso:
//   npx tsx scripts/apply-sql-migration.ts drizzle/v3/0035_item_jornadas_leads_fks.sql
//   npx tsx scripts/apply-sql-migration.ts drizzle/v3/0035_item_jornadas_leads_fks.sql --apply
//   npx tsx scripts/apply-sql-migration.ts drizzle/v3/0035_item_jornadas_leads_fks.sql --apply DATABASE_URL_LEGACY
class Rollback extends Error {}

const args = process.argv.slice(2);
const archivo = args.find((a) => !a.startsWith('--') && a.endsWith('.sql'));
const aplicar = args.includes('--apply');
const urlVar = args.find((a) => !a.startsWith('--') && !a.endsWith('.sql')) ?? 'DATABASE_URL';

if (!archivo) {
  console.error('❌ Falta la ruta del .sql. Ej: drizzle/v3/0035_item_jornadas_leads_fks.sql');
  process.exit(1);
}
const connectionString = process.env[urlVar];
if (!connectionString) {
  console.error(`❌ ${urlVar} no está definida en .env.local`);
  process.exit(1);
}

const sentencias = readFileSync(archivo, 'utf8')
  .split('--> statement-breakpoint')
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !/^(--[^\n]*\n?)+$/.test(s));

async function main() {
  const host = new URL(connectionString as string).host;
  console.log(`\n📄 ${archivo}`);
  console.log(`🔗 ${urlVar} → ${host}`);
  console.log(`🧭 modo: ${aplicar ? 'APLICAR (commit)' : 'dry-run (rollback al final)'}`);
  console.log(`📦 ${sentencias.length} sentencias\n`);

  const sql = postgres(connectionString as string, { prepare: false, max: 1 });
  try {
    await sql.begin(async (tx) => {
      for (const [i, sentencia] of sentencias.entries()) {
        await tx.unsafe(sentencia);
        console.log(`   ✅ ${i + 1}/${sentencias.length}`);
      }
      if (!aplicar) throw new Rollback();
    });
    console.log(aplicar ? '\n✅ Aplicada (commit).' : '\n↩️  dry-run: todo revertido.');
  } catch (error) {
    if (!(error instanceof Rollback)) throw error;
    console.log('\n↩️  dry-run: todo revertido (nada quedó escrito).');
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error('\n❌', error instanceof Error ? error.message : error);
  process.exit(1);
});
