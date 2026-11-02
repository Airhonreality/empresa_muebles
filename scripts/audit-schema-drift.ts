import { config } from 'dotenv';
config({ path: '.env.local' });
import { getTableConfig, PgTable } from 'drizzle-orm/pg-core';
import * as schema from '../lib/db/schema';
import postgres from 'postgres';

// Auditoría de SOLO LECTURA: compara lib/db/schema.ts con una rama de Neon y reporta
// tablas/columnas/constraints que el código espera y la base no tiene (o viceversa).
// Uso: npx tsx scripts/audit-schema-drift.ts [ENV_VAR] (default DATABASE_URL)
const urlVar = process.argv[2] ?? 'DATABASE_URL';
const url = process.env[urlVar];
if (!url) {
  console.error(`❌ ${urlVar} no está definida en .env.local`);
  process.exit(1);
}

type Col = { name: string; sqlType: string; notNull: boolean; hasDefault: boolean };
const tablas = Object.entries(schema)
  .filter(([, v]) => v instanceof PgTable)
  .map(([key, v]) => {
    const cfg = getTableConfig(v as PgTable);
    return {
      key,
      name: cfg.name,
      columns: cfg.columns.map((c) => ({
        name: c.name,
        sqlType: c.getSQLType(),
        notNull: c.notNull,
        hasDefault: c.hasDefault,
      })) as Col[],
      fks: cfg.foreignKeys.map((f) => f.getName()),
      uniques: cfg.uniqueConstraints.map((u) => u.getName() ?? '').filter((n) => n.length > 0),
      checks: cfg.checks.map((c) => c.name),
      indexes: cfg.indexes.map((i) => i.config.name ?? ''),
    };
  });

async function main() {
const dbUrl = url as string;
const sql = postgres(dbUrl, { prepare: false, max: 1 });
const dbCols = (await sql`
  select table_name, column_name, data_type, udt_name, is_nullable, column_default
  from information_schema.columns where table_schema = 'public'
`) as unknown as Array<{ table_name: string; column_name: string }>;
const dbTables = new Set(dbCols.map((r) => r.table_name));
const dbConstraints = new Set(
  ((await sql`select conname from pg_constraint`) as unknown as Array<{ conname: string }>).map((r) => r.conname),
);
const dbIndexes = new Set(
  ((await sql`select indexname from pg_indexes where schemaname = 'public'`) as unknown as Array<{ indexname: string }>).map((r) => r.indexname),
);
const dbEnums = new Map<string, string[]>();
const enumRows = (await sql`
  select t.typname, e.enumlabel from pg_type t join pg_enum e on e.enumtypid = t.oid order by e.enumsortorder
`) as unknown as Array<{ typname: string; enumlabel: string }>;
for (const r of enumRows) {
  dbEnums.set(r.typname, [...(dbEnums.get(r.typname) ?? []), r.enumlabel]);
}

const porTabla = new Map<string, Array<{ column_name: string }>>();
for (const c of dbCols) porTabla.set(c.table_name, [...(porTabla.get(c.table_name) ?? []), c]);

let faltantes = 0;
const noEnSchema: string[] = [];
console.log(`\n🔗 ${urlVar} → ${new URL(dbUrl).host}`);
console.log(`🧱 ${tablas.length} tablas declaradas en schema.ts dentro de ${dbTables.size} tablas existentes\n`);

for (const t of tablas) {
  const reales = porTabla.get(t.name);
  if (!reales) {
    faltantes++;
    console.log(`❌ TABLA FALTANTE: ${t.name} (${t.key})`);
    for (const c of t.columns) console.log(`     + ${c.name} ${c.sqlType}${c.notNull ? ' NOT NULL' : ''}${c.hasDefault ? ' DEFAULT' : ''}`);
    continue;
  }
  const nombresReales = new Set(reales.map((r) => r.column_name));
  const esperados = new Set(t.columns.map((c) => c.name));
  const faltanCols = t.columns.filter((c) => !nombresReales.has(c.name));
  const sobranCols = reales.filter((r) => !esperados.has(r.column_name)).map((r) => r.column_name);
  const faltanCons = [
    ...t.fks.filter((n) => !dbConstraints.has(n)),
    ...t.uniques.filter((n) => !dbConstraints.has(n)),
    ...t.checks.filter((n) => !dbConstraints.has(n)),
  ];
  const faltanIdx = t.indexes.filter((n) => n && !dbIndexes.has(n));
  if (faltanCols.length === 0 && sobranCols.length === 0 && faltanCons.length === 0 && faltanIdx.length === 0) continue;

  console.log(`⚠️  ${t.name}`);
  for (const c of faltanCols) console.log(`     + columna ${c.name} ${c.sqlType}${c.notNull ? ' NOT NULL' : ''}${c.hasDefault ? ' DEFAULT' : ''}`);
  if (sobranCols.length) console.log(`     - columna en DB y no en schema: ${sobranCols.join(', ')}`);
  if (faltanCons.length) console.log(`     + constraint: ${faltanCons.join(', ')}`);
  if (faltanIdx.length) console.log(`     + index: ${faltanIdx.join(', ')}`);
  faltantes += faltanCols.length + faltanCons.length + faltanIdx.length;
}

for (const t of dbTables) {
  if (!tablas.some((x) => x.name === t)) noEnSchema.push(t);
}
if (noEnSchema.length) console.log(`\nℹ️  tablas en DB sin declaración en schema.ts (no rompen nada): ${noEnSchema.join(', ')}`);

for (const [nombre, etiqueta] of Object.entries(schema)) {
  if (nombre.startsWith('estado') || nombre.startsWith('tipo') || nombre.startsWith('rol') || nombre.startsWith('linea')) {
    const e = etiqueta as unknown as { enumName?: string; enumValues?: string[] };
    if (!e?.enumName) continue;
    const reales = dbEnums.get(e.enumName) ?? [];
    const faltan = (e.enumValues ?? []).filter((v) => !reales.includes(v));
    if (!reales.length) console.log(`❌ ENUM FALTANTE: ${e.enumName} (${e.enumValues?.length} valores)`);
    else if (faltan.length) console.log(`⚠️  ENUM ${e.enumName} sin valores: ${faltan.join(', ')}`);
  }
}

console.log(`\n📊 faltantes detectados: ${faltantes}`);
await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1) });
