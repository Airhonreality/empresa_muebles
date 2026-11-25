import assert from 'node:assert/strict'
import { autorDeDecision } from './autoria'
import { NoAutenticadoError } from './errors'
import type { SesionEmpleado } from './session'

function sesion(personaId: string | null): SesionEmpleado {
  return { usuarioId: 'usuario-cuenta-1', personaId, nombre: 'Prueba', email: 'p@prueba.test', rol: 'comercial' }
}

async function run(): Promise<void> {
  const casos: [string, () => void][] = [
    ['la autoría es la persona de la sesión, no el usuarioId de la cuenta', () => {
      assert.equal(autorDeDecision(sesion('persona-7')), 'persona-7')
    }],
    ['sin sesión -> NoAutenticadoError', () => {
      assert.throws(() => autorDeDecision(null), NoAutenticadoError)
    }],
    ['cuenta sin persona asociada -> error (no se atribuye a nadie)', () => {
      assert.throws(() => autorDeDecision(sesion(null)), /no tiene persona asociada/)
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
  else console.log(`autoria.test.ts: ${casos.length} casos ok`)
}

void run()
