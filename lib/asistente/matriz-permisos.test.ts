// Guarda de la matriz única de permisos (t-200 paso 1): el asistente no tiene matriz propia y toda
// autorización sale de lib/auth/permisos.ts. Prueba estática sobre el código fuente del módulo.
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { PERMISOS, PERMISOS_POR_ROL } from '../auth/permisos'

const RAIZ = join(process.cwd(), 'lib', 'asistente')

function archivosTs(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const ruta = join(dir, e.name)
    if (e.isDirectory()) return archivosTs(ruta)
    return e.name.endsWith('.ts') ? [ruta] : []
  })
}

const casos: Array<[string, () => void]> = [
  ['no existe lib/asistente/permisos.ts (la matriz local se eliminó)', () => {
    assert.equal(existsSync(join(RAIZ, 'permisos.ts')), false)
  }],
  ['ningún archivo del asistente importa una matriz local de permisos', () => {
    // Cualquier import que termine en "permisos" debe resolver a lib/auth/permisos.ts.
    const oficial = join(process.cwd(), 'lib', 'auth', 'permisos')
    const malos: string[] = []
    for (const f of archivosTs(RAIZ)) {
      for (const m of readFileSync(f, 'utf8').matchAll(/from ['"]([^'"]*permisos)['"]/g)) {
        if (!/(^|\/)permisos$/.test(m[1])) continue
        if (resolve(dirname(f), m[1]) !== oficial) malos.push(`${f}: ${m[1]}`)
      }
    }
    assert.deepEqual(malos, [])
  }],
  ['la matriz única cubre todos los roles canónicos', () => {
    for (const rol of ['admin', 'comercial', 'desarrollador', 'compras', 'taller', 'finanzas', 'supervisora_qa'] as const) {
      assert.ok(Array.isArray(PERMISOS_POR_ROL[rol]), `falta el rol ${rol}`)
    }
    assert.ok(PERMISOS.includes('erp:acceso'))
  }],
]

async function principal(): Promise<void> {
  let fallos = 0
  for (const [nombre, fn] of casos) {
    try {
      fn()
      console.log(`ok - ${nombre}`)
    } catch (err) {
      fallos++
      console.log(`FALLA - ${nombre}\n${(err as Error).message}`)
    }
  }
  if (fallos > 0) process.exit(1)
}

void principal()
