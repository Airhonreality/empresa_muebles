import assert from 'node:assert/strict'
import { ejecutarAccion, esAccionProtegida, type ObtenerSesion } from './accion'
import { NoAutenticadoError, NoAutorizadoError } from './errors'
import { PERMISOS, PERMISOS_POR_ROL } from './permisos'
import type { SesionEmpleado } from './session'

function sesionCon(rol: SesionEmpleado['rol']): SesionEmpleado {
  return { usuarioId: 'u-1', personaId: null, nombre: 'Prueba', email: 'p@prueba.test', rol }
}

function fuenteSesion(sesion: SesionEmpleado | null): { fuente: ObtenerSesion; llamadas: () => number } {
  let n = 0
  return {
    fuente: async () => {
      n++
      return sesion
    },
    llamadas: () => n,
  }
}

async function lanza(promesa: Promise<unknown>, clase: new (...a: never[]) => Error): Promise<Error> {
  try {
    await promesa
  } catch (err) {
    assert.ok(err instanceof clase, `esperaba ${clase.name}, llegó ${(err as Error)?.name}`)
    return err as Error
  }
  assert.fail(`esperaba que lanzara ${clase.name}`)
}

async function run(): Promise<void> {
  const casos: [string, () => Promise<void>][] = [
    ['sin sesión -> NoAutenticadoError (no devuelve null)', async () => {
      const { fuente } = fuenteSesion(null)
      let ejecutada = false
      const f = ejecutarAccion(fuente, { permiso: 'finanzas:leer' }, async () => { ejecutada = true; return 'x' })
      await lanza(f(), NoAutenticadoError)
      assert.equal(ejecutada, false)
    }],
    ['rol sin permiso -> NoAutorizadoError y no ejecuta fn', async () => {
      // La matriz real es decisión pendiente: la prueba quita el permiso en memoria y lo restaura,
      // así el mecanismo se verifica sin depender del contenido de la matriz.
      const { PERMISOS_POR_ROL } = await import('./permisos')
      const original = PERMISOS_POR_ROL.comercial
      PERMISOS_POR_ROL.comercial = original.filter((p) => p !== 'finanzas:escribir')
      try {
        const { fuente } = fuenteSesion(sesionCon('comercial'))
        let ejecutada = false
        const f = ejecutarAccion(fuente, { permiso: 'finanzas:escribir' }, async () => { ejecutada = true; return 'x' })
        await lanza(f(), NoAutorizadoError)
        assert.equal(ejecutada, false)
      } finally {
        PERMISOS_POR_ROL.comercial = original
      }
    }],
    ['rol desconocido (cookie vieja) -> NoAutorizadoError', async () => {
      const { fuente } = fuenteSesion({ ...sesionCon('admin'), rol: 'rol_inexistente' as SesionEmpleado['rol'] })
      const f = ejecutarAccion(fuente, { permiso: 'erp:acceso' }, async () => 'x')
      await lanza(f(), NoAutorizadoError)
    }],
    ['con permiso -> ejecuta fn y devuelve su resultado, con argumentos', async () => {
      const { fuente } = fuenteSesion(sesionCon('finanzas'))
      const f = ejecutarAccion(fuente, { permiso: 'finanzas:escribir' }, async (a: number, b: string) => `${a}-${b}`)
      assert.equal(await f(7, 'ok'), '7-ok')
    }],
    ['admin tiene todos los permisos', async () => {
      for (const permiso of PERMISOS) {
        assert.ok(PERMISOS_POR_ROL.admin.includes(permiso), `admin sin ${permiso}`)
      }
    }],
    ['pública con motivo -> ejecuta sin sesión (no consulta la sesión)', async () => {
      const { fuente, llamadas } = fuenteSesion(null)
      const f = ejecutarAccion(fuente, { publica: true, motivo: 'sitio público' }, async () => 'publico')
      assert.equal(await f(), 'publico')
      assert.equal(llamadas(), 0)
    }],
    ['pública con motivo vacío -> error al declarar (no al llamar)', async () => {
      assert.throws(
        () => ejecutarAccion(async () => null, { publica: true, motivo: '   ' }, async () => 'x'),
        /motivo no vacío/,
      )
    }],
    ['pública sin motivo (undefined) -> error al declarar', async () => {
      assert.throws(
        () => ejecutarAccion(async () => null, { publica: true, motivo: undefined as unknown as string }, async () => 'x'),
        /motivo no vacío/,
      )
    }],
    ['la función envuelta queda marcada y la marca no es enumerable', async () => {
      const { fuente } = fuenteSesion(sesionCon('admin'))
      const f = ejecutarAccion(fuente, { permiso: 'erp:acceso' }, async () => 'x')
      assert.equal(esAccionProtegida(f), true)
      assert.equal(esAccionProtegida(async () => 'x'), false)
      assert.deepEqual(Object.keys(f), [])
    }],
  ]

  let fallos = 0
  for (const [nombre, caso] of casos) {
    try {
      await caso()
      console.log(`ok - ${nombre}`)
    } catch (err) {
      fallos++
      console.error(`FALLA - ${nombre}\n  ${(err as Error).message}`)
    }
  }
  if (fallos > 0) {
    console.error(`${fallos} caso(s) fallaron`)
    process.exitCode = 1
  } else {
    console.log(`accion.test.ts: ${casos.length} casos ok`)
  }
}

void run()
