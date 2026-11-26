import assert from 'node:assert/strict'
import { modeloPorDefecto, obtenerModelo } from './modelo'

const ORIGINAL = process.env.ASISTENTE_MODELO_DEFECTO

function conModelo(valor: string | undefined, fn: () => void): void {
  if (valor === undefined) delete process.env.ASISTENTE_MODELO_DEFECTO
  else process.env.ASISTENTE_MODELO_DEFECTO = valor
  try {
    fn()
  } finally {
    if (ORIGINAL === undefined) delete process.env.ASISTENTE_MODELO_DEFECTO
    else process.env.ASISTENTE_MODELO_DEFECTO = ORIGINAL
  }
}

const casos: Array<[string, () => void]> = [
  ['sin ASISTENTE_MODELO_DEFECTO falla explícitamente', () => {
    conModelo(undefined, () => assert.throws(() => modeloPorDefecto(), /ASISTENTE_MODELO_DEFECTO no definida/))
  }],
  ['valor proveedor/modelo se parsea con modelo que puede tener barras', () => {
    conModelo('openrouter/qwen/qwen3-235b', () => {
      assert.deepEqual(modeloPorDefecto(), { proveedor: 'openrouter', modelo: 'qwen/qwen3-235b' })
    })
  }],
  ['proveedor desconocido falla', () => {
    conModelo('otro/modelo', () => assert.throws(() => modeloPorDefecto(), /inválida/))
  }],
  ['sin modelo falla', () => {
    conModelo('anthropic/', () => assert.throws(() => modeloPorDefecto(), /inválida/))
  }],
  ['obtenerModelo sin clave falla', () => {
    assert.throws(() => obtenerModelo('', 'openrouter', 'x/y'), /Falta la clave/)
  }],
  ['obtenerModelo construye un modelo para cada proveedor (sin red)', () => {
    assert.ok(obtenerModelo('clave-de-prueba', 'openrouter', 'qwen/qwen3-235b'))
    assert.ok(obtenerModelo('clave-de-prueba', 'anthropic', 'claude-x'))
    assert.ok(obtenerModelo('clave-de-prueba', 'google', 'gemini-x'))
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
      console.error(`FALLA - ${nombre}\n${(err as Error).message}`)
    }
  }
  if (fallos > 0) {
    console.error(`${fallos} caso(s) fallaron`)
    process.exitCode = 1
  }
}

void principal()
