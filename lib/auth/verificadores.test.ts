import assert from 'node:assert/strict'
import { esVerificadorValido, exigirVerificadorValido, type EmpleadoVerificable } from './verificadores'

const EMPLEADOS: EmpleadoVerificable[] = [
  { personaId: 'persona-comercial', activo: true, rol: 'comercial' },
  { personaId: 'persona-taller', activo: true, rol: 'taller' },
  { personaId: 'persona-inactiva', activo: false, rol: 'comercial' },
  { personaId: null, activo: true, rol: 'comercial' },
]

async function run(): Promise<void> {
  const casos: [string, () => void][] = [
    ['comercial activo con persona -> válido', () => {
      assert.equal(esVerificadorValido(EMPLEADOS, 'persona-comercial'), true)
    }],
    ['persona de empleado con rol no verificador (taller) -> inválido', () => {
      assert.equal(esVerificadorValido(EMPLEADOS, 'persona-taller'), false)
    }],
    ['comercial desactivado -> inválido', () => {
      assert.equal(esVerificadorValido(EMPLEADOS, 'persona-inactiva'), false)
    }],
    ['id que no corresponde a ningún empleado -> inválido', () => {
      assert.equal(esVerificadorValido(EMPLEADOS, 'persona-inventada'), false)
    }],
    ['cadena vacía nunca coincide con una cuenta sin persona -> inválido', () => {
      assert.equal(esVerificadorValido(EMPLEADOS, ''), false)
    }],
    ['sin empleados -> inválido', () => {
      assert.equal(esVerificadorValido([], 'persona-comercial'), false)
    }],
  ]

  // Sin base de datos (DATA_IMPL=mock) la regla no se puede comprobar: debe fallar cerrado, nunca aceptar.
  process.env.DATA_IMPL = 'mock'
  let fallosAsync = 0
  try {
    await assert.rejects(exigirVerificadorValido('persona-comercial'), /sin base de datos/)
    console.log('ok - exigirVerificadorValido en mock falla cerrado')
  } catch (err) {
    fallosAsync++
    console.error(`FAIL - exigirVerificadorValido en mock falla cerrado: ${(err as Error).message}`)
  }

  let fallos = fallosAsync
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
  else console.log(`verificadores.test.ts: ${casos.length + 1} casos ok`)
}

void run()
