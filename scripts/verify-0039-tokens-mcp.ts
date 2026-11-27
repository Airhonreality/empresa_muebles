import { config } from 'dotenv';
config({ path: '.env.local' });
import postgres from 'postgres';

// Verificación de SOLO LECTURA de la migración 0039 (tokens_mcp).
// Dice si la tabla existe, sus columnas, la FK y el índice único de hash.
// La transacción es READ ONLY: no puede escribir aunque se le pase una URL equivocada.
//
// Uso:
//   npx tsx scripts/verify-0039-tokens-mcp.ts                       (usa DATABASE_URL)
//   npx tsx scripts/verify-0039-tokens-mcp.ts DATABASE_URL_V3_PREVIEW
// Sale con código 1 si falta cualquier objeto.

const urlVar = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'DATABASE_URL';
const connectionString = process.env[urlVar];
if (!connectionString) {
  console.error(`❌ ${urlVar} no está definida`);
  process.exit(1);
}

const COLUMNAS = ['id', 'usuario_id', 'etiqueta', 'hash', 'creado_en', 'ultimo_uso_en', 'revocado_en'];
const FK = 'tokens_mcp_usuario_id_usuarios_id_fk';
const UNICO = 'tokens_mcp_hash_unique';

async function main() {
  const host = new URL(connectionString as string).host;
  console.log(`🔗 ${urlVar} → ${host}`);
  console.log('🔒 modo: solo lectura (transacción READ ONLY)\n');

  const sql = postgres(connectionString as string, { prepare: false, max: 1 });
  let existeTabla = false;
  let faltan = 0;
  try {
    await sql.begin(async (tx) => {
      await tx`SET TRANSACTION READ ONLY`;
      const tablas = await tx<{ table_name: string }[]>`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'tokens_mcp'`;
      existeTabla = tablas.length > 0;
      console.log(`TABLA tokens_mcp: ${existeTabla ? 'EXISTE' : 'NO EXISTE'}`);
      if (!existeTabla) {
        faltan++;
        return;
      }
      const cols = await tx<{ column_name: string }[]>`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'tokens_mcp'`;
      const set = new Set(cols.map((c) => c.column_name));
      console.log('COLUMNAS:');
      for (const c of COLUMNAS) {
        const ok = set.has(c);
        if (!ok) faltan++;
        console.log(`  ${ok ? 'OK    ' : 'FALTA '}${c}`);
      }
      const extra = [...set].filter((c) => !COLUMNAS.includes(c));
      if (extra.length) {
        faltan++;
        console.log(`  SOBRAN: ${extra.join(', ')}`);
      }
      const cons = await tx<{ conname: string }[]>`
        SELECT conname FROM pg_constraint WHERE conname = ${FK}`;
      const uni = await tx<{ conname: string }[]>`
        SELECT conname FROM pg_constraint WHERE conname = ${UNICO} AND contype = 'u'`;
      console.log(`FK ${FK}: ${cons.length ? 'OK' : 'FALTA'}`);
      console.log(`UNIQUE ${UNICO}: ${uni.length ? 'OK' : 'FALTA'}`);
      if (!cons.length) faltan++;
      if (!uni.length) faltan++;
    });
  } finally {
    await sql.end();
  }
  console.log(faltan === 0 ? '\n✅ Todo presente.' : `\n❌ Objetos faltantes o diferentes: ${faltan}`);
  process.exit(faltan === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error('\n❌', error instanceof Error ? error.message : error);
  process.exit(1);
});
