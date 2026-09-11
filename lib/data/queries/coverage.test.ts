// Gate mecánico de cobertura (Fase 1, DP3 del plan de migración sistemática TanStack Query,
// aprobado por Supervisor 2026-09-11). Sin framework, patrón node:assert manual (convención del
// repo, AGENTS.md). Corre con: npx tsx lib/data/queries/coverage.test.ts
//
// Qué garantiza: toda Server Action de lib/data/actions/*.ts aparece en EXACTAMENTE una de las
// listas de coverage-manifest.ts, y toda entrada de esas listas corresponde a una action real.
// Así, una action nueva que alguien agregue sin registrarla rompe el test (no se "cuela"
// invisible); y una entrada obsoleta (rename/eliminación) también rompe el test (no queda basura
// mintiendo sobre cobertura real).
import assert from 'node:assert'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ACCIONES_CON_HOOK, ACCIONES_PENDIENTE_MIGRACION } from './coverage-manifest'

function test(nombre: string, fn: () => void) {
  try {
    fn()
    console.log(`  ok - ${nombre}`)
  } catch (err) {
    console.error(`  FAIL - ${nombre}`)
    throw err
  }
}

function todasLasActionsReales(): string[] {
  const dir = join(__dirname, '..', 'actions')
  const archivos = readdirSync(dir).filter((f) => f.endsWith('.ts'))
  const nombres: string[] = []
  for (const archivo of archivos) {
    const contenido = readFileSync(join(dir, archivo), 'utf-8')
    const matches = contenido.matchAll(/export async function ([a-zA-Z0-9]+Action)\b/g)
    for (const m of matches) nombres.push(m[1])
  }
  return nombres
}

const reales = todasLasActionsReales()
const manifest = [...ACCIONES_CON_HOOK, ...ACCIONES_PENDIENTE_MIGRACION]

test('ninguna action real queda sin registrar en el manifest', () => {
  const faltantes = reales.filter((a) => !manifest.includes(a))
  assert.deepStrictEqual(
    faltantes,
    [],
    `Actions sin registrar (agregalas a ACCIONES_CON_HOOK o ACCIONES_PENDIENTE_MIGRACION en coverage-manifest.ts): ${faltantes.join(', ')}`,
  )
})

test('ninguna entrada del manifest es un nombre obsoleto (ya no existe como action real)', () => {
  const obsoletas = manifest.filter((a) => !reales.includes(a))
  assert.deepStrictEqual(
    obsoletas,
    [],
    `Entradas del manifest que ya no corresponden a ninguna action real (renombrada o eliminada): ${obsoletas.join(', ')}`,
  )
})

test('ninguna action aparece en las dos listas a la vez', () => {
  const duplicadas = ACCIONES_CON_HOOK.filter((a) => ACCIONES_PENDIENTE_MIGRACION.includes(a))
  assert.deepStrictEqual(duplicadas, [], `Actions listadas en ambas listas: ${duplicadas.join(', ')}`)
})

test('reporte de cobertura actual (informativo, no falla)', () => {
  const total = reales.length
  const conHook = ACCIONES_CON_HOOK.length
  const pct = ((conHook / total) * 100).toFixed(1)
  console.log(`    ${conHook}/${total} actions con hook reactivo (${pct}%)`)
})

console.log('\ncoverage.test.ts: todas las pruebas pasaron')
