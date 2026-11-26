// Diagnóstico de solo lectura: compara lib/db/schema.ts contra la base de datos real.
//
// Qué revisa:
//   1. Tablas que el schema declara y no existen en la base (causa típica: "relation does not exist").
//   2. Columnas que el schema declara y no existen en la tabla (causa típica: "column does not exist").
//   3. Tablas en la base que el schema no declara (informativo).
//   4. Migraciones del journal de drizzle/v3 contra las registradas en drizzle.__drizzle_migrations.
//
// Nunca escribe: la sesión es READ ONLY y solo hace SELECT.
//
// Uso (por defecto usa DATABASE_URL de .env.local, que apunta a dev-local):
//   npx tsx scripts/diagnostico-esquema-db.ts
// Otra base (ej. producción) SOLO con autorización del Supervisor, pasando la URL en el entorno:
//   DIAG_DATABASE_URL='postgres://...' npx tsx scripts/diagnostico-esquema-db.ts
// Código de salida: 0 si no hay discrepancias, 1 si las hay, 2 si no pudo ejecutarse.
import { config } from 'dotenv'
config({ path: '.env.local' })
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import postgres from 'postgres'
import { is } from 'drizzle-orm'
import { PgTable, getTableConfig } from 'drizzle-orm/pg-core'
import * as schema from '../lib/db/schema'

interface TablaEsperada {
  nombre: string
  columnas: string[]
}

function tablasDelSchema(): TablaEsperada[] {
  const tablas: TablaEsperada[] = []
  for (const valor of Object.values(schema)) {
    if (!is(valor, PgTable)) continue
    const cfg = getTableConfig(valor as PgTable)
    tablas.push({ nombre: cfg.name, columnas: cfg.columns.map((c) => c.name) })
  }
  return tablas.sort((a, b) => a.nombre.localeCompare(b.nombre))
}

function migracionesDelJournal(): string[] {
  const journal = JSON.parse(readFileSync(join(process.cwd(), 'drizzle/v3/meta/_journal.json'), 'utf8')) as {
    entries: Array<{ tag: string }>
  }
  return journal.entries.map((e) => e.tag)
}

async function main(): Promise<number> {
  const url = process.env.DIAG_DATABASE_URL ?? process.env.DATABASE_URL
  if (!url) {
    console.error('Falta DATABASE_URL (o DIAG_DATABASE_URL).')
    return 2
  }
  const sql = postgres(url, { prepare: false, max: 1 })
  try {
    const esperadas = tablasDelSchema()
    const { tablasReales, columnasReales, migracionesAplicadas } = await sql.begin('read only', async (tx) => {
      const tablas = await tx<{ table_name: string }[]>`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
      const columnas = await tx<{ table_name: string; column_name: string }[]>`
        SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'`
      let aplicadas: number | null = null
      const existe = await tx<{ existe: boolean }[]>`
        SELECT to_regclass('drizzle.__drizzle_migrations') IS NOT NULL AS existe`
      if (existe[0]?.existe) {
        const filas = await tx<{ n: number }[]>`SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations`
        aplicadas = filas[0].n
      }
      return {
        tablasReales: new Set(tablas.map((t) => t.table_name)),
        columnasReales: new Map<string, Set<string>>(
          [...new Set(columnas.map((c) => c.table_name))].map((t) => [
            t,
            new Set(columnas.filter((c) => c.table_name === t).map((c) => c.column_name)),
          ]),
        ),
        migracionesAplicadas: aplicadas,
      }
    })

    const tablasFaltantes: string[] = []
    const columnasFaltantes: string[] = []
    for (const t of esperadas) {
      if (!tablasReales.has(t.nombre)) {
        tablasFaltantes.push(t.nombre)
        continue
      }
      const reales = columnasReales.get(t.nombre) ?? new Set<string>()
      for (const c of t.columnas) if (!reales.has(c)) columnasFaltantes.push(`${t.nombre}.${c}`)
    }
    const nombresEsperados = new Set(esperadas.map((t) => t.nombre))
    const tablasExtra = [...tablasReales].filter((t) => !nombresEsperados.has(t) && !t.startsWith('__'))
    const migracionesJournal = migracionesDelJournal()

    console.log(`Schema: ${esperadas.length} tablas declaradas. Base: ${tablasReales.size} tablas públicas.`)
    console.log(`Migraciones en el journal: ${migracionesJournal.length}. Registradas en la base: ${migracionesAplicadas ?? 'sin tabla de tracking'}.`)
    console.log('')
    console.log(`Tablas faltantes en la base (${tablasFaltantes.length}):`, tablasFaltantes.join(', ') || '—')
    console.log(`Columnas faltantes en la base (${columnasFaltantes.length}):`, columnasFaltantes.join(', ') || '—')
    console.log(`Tablas en la base que el schema no declara (${tablasExtra.length}, informativo):`, tablasExtra.join(', ') || '—')

    const discrepancias = tablasFaltantes.length + columnasFaltantes.length
    console.log('')
    console.log(discrepancias === 0 ? 'OK: el schema y la base coinciden en tablas y columnas.' : `DISCREPANCIAS: ${discrepancias}`)
    return discrepancias === 0 ? 0 : 1
  } finally {
    await sql.end()
  }
}

main()
  .then((codigo) => process.exit(codigo))
  .catch((err) => {
    console.error('No se pudo ejecutar el diagnóstico:', err instanceof Error ? err.message : err)
    process.exit(2)
  })
