import assert from 'node:assert/strict'
import { exigirPuedeAsignarRol } from './invitaciones'
import { NoAutorizadoError } from './errors'

async function run(): Promise<void> {
  const casos: [string, () => void][] = [
    ['admin invita a admin -> permitido', () => {
      assert.doesNotThrow(() => exigirPuedeAsignarRol('admin', 'admin'))
    }],
    ['no admin invita a admin -> NoAutorizadoError', () => {
      assert.throws(() => exigirPuedeAsignarRol('finanzas', 'admin'), NoAutorizadoError)
      assert.throws(() => exigirPuedeAsignarRol('comercial', 'admin'), NoAutorizadoError)
    }],
    ['no admin invita a un rol no admin -> permitido', () => {
      assert.doesNotThrow(() => exigirPuedeAsignarRol('comercial', 'taller'))
    }],
  ]
  let fallos = 0
  for (const [nombre, prueba] of casos) {
    try {
      prueba()
      console.log(`ok - ${nombre}`)
    } catch (err) {
      fallos++
      console.error(`FAIL - ${nombre}: ${(err as Error).message}`)
    }
  }
  if (fallos > 0) process.exitCode = 1
  else console.log(`invitaciones.test.ts: ${casos.length} casos ok`)
}

void run()
