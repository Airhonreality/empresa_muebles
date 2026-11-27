// Pruebas del núcleo del registro (herramientas.ts): permisos, canales, procedencia y truncado.
import assert from 'node:assert/strict'
import { z } from 'zod'
import type { SesionEmpleado } from '../auth/session'
import { NoAutorizadoError } from '../auth/errors'
import { ErrorProcedencia } from './errores'
import {
  catalogoDominios,
  ejecutarHerramienta,
  herramientasPermitidas,
  MAX_CARACTERES_RESULTADO,
  Procedencia,
  tienePermiso,
  truncarResultado,
  type DefinicionAsistente,
} from './herramientas'
import { conPermisosRestringidos } from './prueba-permisos'

function sesionCon(rol: SesionEmpleado['rol']): SesionEmpleado {
  return { usuarioId: 'u-1', personaId: null, nombre: 'Prueba', email: 'p@prueba.test', rol }
}

let llamadas = 0
const lectura = (over: Partial<DefinicionAsistente> = {}): DefinicionAsistente => ({
  nombre: 'finanzas.prueba',
  dominio: 'finanzas',
  operacion: 'prueba',
  descripcion: 'prueba',
  permiso: 'finanzas:leer',
  canales: ['chat'],
  esEscritura: false,
  esquema: z.strictObject({ n: z.number().int().optional() }),
  ejecutar: async () => {
    llamadas++
    return { ok: true }
  },
  ...over,
} as DefinicionAsistente)

const casos: Array<[string, () => Promise<void>]> = [
  ['truncarResultado deja el texto igual si cabe', async () => {
    assert.equal(truncarResultado('corto'), 'corto')
  }],
  ['truncarResultado recorta al límite y avisa al modelo', async () => {
    const largo = 'x'.repeat(MAX_CARACTERES_RESULTADO + 500)
    const r = truncarResultado(largo)
    assert.ok(r.length <= MAX_CARACTERES_RESULTADO)
    assert.match(r, /RESULTADO TRUNCADO/)
  }],
  ['ejecutarHerramienta trunca un resultado grande a MAX_CARACTERES_RESULTADO', async () => {
    const def = lectura({ ejecutar: async () => ({ texto: 'y'.repeat(20000) }) })
    const r = await ejecutarHerramienta(def, {}, sesionCon('admin'))
    assert.ok(r.length <= MAX_CARACTERES_RESULTADO)
  }],
  ['permiso denegado: NoAutorizadoError y la acción no se llama', async () => {
    llamadas = 0
    await conPermisosRestringidos('comercial', ['clientes:leer'], () =>
      assert.rejects(ejecutarHerramienta(lectura(), {}, sesionCon('comercial')), NoAutorizadoError),
    )
    assert.equal(llamadas, 0)
  }],
  ['entrada inválida no llama a la acción', async () => {
    llamadas = 0
    await assert.rejects(ejecutarHerramienta(lectura(), { n: 'no-numero' }, sesionCon('admin')), /Entrada inválida/)
    assert.equal(llamadas, 0)
  }],
  ['una operación de escritura no se ejecuta como lectura', async () => {
    const escritura = { ...lectura(), esEscritura: true, preparar: async () => ({ resumen: '', datos: {} }), confirmar: async () => ({}) } as unknown as DefinicionAsistente
    await assert.rejects(ejecutarHerramienta(escritura, {}, sesionCon('admin')), /solo se ejecuta con confirmación/)
  }],
  ['herramientasPermitidas: la configuración solo puede reducir la lista', async () => {
    const reg = [lectura({ nombre: 'finanzas.a' }), lectura({ nombre: 'finanzas.b' })]
    const nombres = herramientasPermitidas(sesionCon('admin'), ['finanzas.a', 'no.existe'], reg).map((h) => h.nombre)
    assert.deepEqual(nombres, ['finanzas.a'])
    assert.equal(herramientasPermitidas(sesionCon('admin'), undefined, reg).length, 2)
  }],
  ['las operaciones de canal MCP no se ofrecen en el chat', async () => {
    const reg = [lectura({ nombre: 'finanzas.a' }), lectura({ nombre: 'finanzas.solo_mcp', canales: ['mcp'] })]
    assert.deepEqual(herramientasPermitidas(sesionCon('admin'), undefined, reg).map((h) => h.nombre), ['finanzas.a'])
  }],
  ['una operación no disponible para el usuario no aparece (disponible = false)', async () => {
    const reg = [lectura({ nombre: 'finanzas.a', disponible: () => false })]
    assert.deepEqual(herramientasPermitidas(sesionCon('admin'), undefined, reg), [])
  }],
  ['catalogoDominios: solo dominios con alguna operación permitida, sin nombres de operaciones', async () => {
    const reg = [lectura({ nombre: 'finanzas.a', dominio: 'finanzas' }), lectura({ nombre: 'clientes.b', dominio: 'clientes', permiso: 'clientes:leer' })]
    const dominios = await conPermisosRestringidos('comercial', ['clientes:leer'], () => catalogoDominios(sesionCon('comercial'), reg))
    assert.deepEqual(dominios.map((d) => d.dominio), ['clientes'])
    assert.ok(!JSON.stringify(catalogoDominios(sesionCon('admin'), reg)).includes('finanzas.a'))
  }],
  ['tienePermiso sigue la matriz única', async () => {
    assert.equal(tienePermiso(sesionCon('admin'), lectura()), true)
    await conPermisosRestringidos('taller', [], () => assert.equal(tienePermiso(sesionCon('taller'), lectura()), false))
  }],
  ['Procedencia: un id no registrado se rechaza con ErrorProcedencia', async () => {
    const p = new Procedencia()
    assert.throws(() => p.exigir('cliente', 'c-1', 'cliente'), ErrorProcedencia)
    p.registrar('cliente', ['c-1'])
    assert.doesNotThrow(() => p.exigir('cliente', 'c-1', 'cliente'))
    assert.equal(p.tiene('producto', 'c-1'), false, 'un id de cliente no vale como producto')
  }],
]

async function principal(): Promise<void> {
  let fallos = 0
  for (const [nombre, fn] of casos) {
    try {
      await fn()
      console.log(`ok - ${nombre}`)
    } catch (err) {
      fallos++
      console.log(`FALLA - ${nombre}\n${(err as Error).message}`)
    }
  }
  if (fallos > 0) process.exit(1)
}

void principal()
