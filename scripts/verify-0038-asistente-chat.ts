import { config } from 'dotenv';
config({ path: '.env.local' });
import postgres from 'postgres';

// Verificación de SOLO LECTURA de la migración 0038 (asistente de chat).
// Dice, para cada objeto que crea la 0038 (enums, tablas, columnas, FK, unique), si existe.
// La transacción es READ ONLY: no puede escribir aunque se le pase una URL equivocada.
//
// Uso:
//   npx tsx scripts/verify-0038-asistente-chat.ts                       (usa DATABASE_URL)
//   npx tsx scripts/verify-0038-asistente-chat.ts DATABASE_URL_V3_PREVIEW
// Sale con código 1 si falta cualquier objeto.

const urlVar = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'DATABASE_URL';
const connectionString = process.env[urlVar];
if (!connectionString) {
  console.error(`❌ ${urlVar} no está definida`);
  process.exit(1);
}

const ENUMS = [
  'estado_clave_asistente',
  'estado_propuesta_asistente',
  'proveedor_asistente',
  'rol_mensaje_asistente',
  'tipo_llamada_asistente',
];

// Columnas esperadas, copiadas del SQL 0038 y cotejadas contra lib/db/schema.ts.
const TABLAS: Record<string, string[]> = {
  adjuntos_asistente: ['id', 'mensaje_id', 'r2_clave', 'nombre', 'tipo_mime', 'tamano_bytes', 'creado_en'],
  configuracion_asistente: ['id', 'clave', 'valor', 'actualizada_por', 'actualizada_en'],
  conversaciones_asistente: ['id', 'usuario_id', 'creada_en', 'actualizada_en'],
  llamadas_herramienta_asistente: [
    'id', 'usuario_id', 'tipo', 'herramienta', 'proveedor_clave_id', 'modelo', 'entrada_resumen',
    'resultado_resumen', 'tokens_entrada', 'tokens_salida', 'costo_estimado', 'duracion_ms', 'detalle', 'creada_en',
  ],
  mensajes_asistente: ['id', 'conversacion_id', 'rol', 'contenido', 'creado_en'],
  propuestas_asistente: [
    'id', 'conversacion_id', 'usuario_id', 'herramienta', 'entrada', 'resumen', 'estado',
    'creada_en', 'vence_en', 'resuelta_en',
  ],
  proveedores_asistente: [
    'id', 'proveedor', 'etiqueta', 'clave_cifrada', 'clave_ultimos4', 'orden', 'estado',
    'enfriada_hasta', 'creada_en', 'actualizada_en',
  ],
};

const FKS = [
  'adjuntos_asistente_mensaje_id_mensajes_asistente_id_fk',
  'configuracion_asistente_actualizada_por_usuarios_id_fk',
  'conversaciones_asistente_usuario_id_usuarios_id_fk',
  'llamadas_herramienta_asistente_usuario_id_usuarios_id_fk',
  'llamadas_herramienta_asistente_proveedor_clave_id_proveedores_asistente_id_fk',
  'mensajes_asistente_conversacion_id_conversaciones_asistente_id_fk',
  'propuestas_asistente_conversacion_id_conversaciones_asistente_id_fk',
  'propuestas_asistente_usuario_id_usuarios_id_fk',
];

const UNIQUES = ['configuracion_asistente_clave_unique'];

// Postgres trunca identificadores a 63 bytes; el nombre real guardado es el truncado.
const pgNombre = (n: string) => n.slice(0, 63);

async function main() {
  const host = new URL(connectionString as string).host;
  console.log(`🔗 ${urlVar} → ${host}`);
  console.log('🔒 modo: solo lectura (transacción READ ONLY)\n');

  const sql = postgres(connectionString as string, { prepare: false, max: 1 });
  let faltan = 0;
  const marcar = (ok: boolean) => (ok ? 'OK    ' : 'FALTA ');

  try {
    await sql.begin(async (tx) => {
      await tx`SET TRANSACTION READ ONLY`;

      const tipos = await tx<{ typname: string }[]>`
        SELECT t.typname FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' AND t.typtype = 'e'`;
      const tiposSet = new Set(tipos.map((r) => r.typname));
      console.log('ENUMS:');
      for (const e of ENUMS) {
        const ok = tiposSet.has(e);
        if (!ok) faltan++;
        console.log(`  ${marcar(ok)}${e}`);
      }

      const tablas = await tx<{ table_name: string }[]>`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`;
      const tablasSet = new Set(tablas.map((r) => r.table_name));
      console.log('\nTABLAS y COLUMNAS:');
      for (const [tabla, columnas] of Object.entries(TABLAS)) {
        const existe = tablasSet.has(tabla);
        if (!existe) {
          faltan++;
          console.log(`  FALTA  ${tabla}`);
          continue;
        }
        const cols = await tx<{ column_name: string }[]>`
          SELECT column_name FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = ${tabla}`;
        const colsSet = new Set(cols.map((r) => r.column_name));
        const faltanCols = columnas.filter((c) => !colsSet.has(c));
        const sobran = [...colsSet].filter((c) => !columnas.includes(c));
        const ok = faltanCols.length === 0 && sobran.length === 0;
        if (!ok) faltan++;
        console.log(`  ${marcar(ok)}${tabla} (${colsSet.size} columnas)`);
        if (faltanCols.length) console.log(`           columnas que faltan: ${faltanCols.join(', ')}`);
        if (sobran.length) console.log(`           columnas que sobran: ${sobran.join(', ')}`);
      }

      const constraints = await tx<{ conname: string; contype: string }[]>`
        SELECT c.conname, c.contype FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public' AND c.contype IN ('f', 'u')`;
      const conSet = new Set(constraints.map((r) => r.conname));
      console.log('\nFOREIGN KEYS:');
      for (const fk of FKS) {
        const ok = conSet.has(pgNombre(fk));
        if (!ok) faltan++;
        console.log(`  ${marcar(ok)}${pgNombre(fk)}`);
      }
      console.log('\nUNIQUE:');
      for (const u of UNIQUES) {
        const ok = conSet.has(pgNombre(u));
        if (!ok) faltan++;
        console.log(`  ${marcar(ok)}${pgNombre(u)}`);
      }

      const todas = [...tablasSet].sort();
      console.log(`\nTABLAS BASE en public: ${todas.length}`);
      console.log(todas.map((t) => `  - ${t}`).join('\n'));
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
