import assert from 'node:assert/strict'
import { NoAutorizadoError } from './permisos'
import type { SesionEmpleado } from '../auth/session'
import type { ProyectoSnapshot } from '../data/queries/proyecto-types'
import {
  MAX_CARACTERES_RESULTADO,
  crearHerramientas,
  ejecutarHerramienta,
  herramientasPermitidas,
  truncarResultado,
  type AccionesLectura,
} from './herramientas'

function sesionCon(rol: SesionEmpleado['rol']): SesionEmpleado {
  return { usuarioId: 'u-1', personaId: null, nombre: 'Prueba', email: 'p@prueba.test', rol }
}

const PROYECTO_ID = '11111111-1111-4111-8111-111111111111'

/** Acciones falsas que cuentan llamadas. Ninguna toca base de datos. */
function accionesFalsas(extra?: Partial<AccionesLectura>) {
  const llamadas = { cotizadorLista: 0, proyecto: 0, finanzas: 0 }
  const acciones: AccionesLectura = {
    cotizadorLista: async () => {
      llamadas.cotizadorLista++
      return {
        proyectos: [
          { id: PROYECTO_ID, codigo: 'COT-2026-11-25-01', nombreProyecto: 'Cocina Juan', estado: 'borrador', tipoProyecto: 'personalizado', clienteId: 'c-1', createdAt: '2026-11-25' } as never,
          { id: 'p-2', codigo: 'COT-2026-11-20-02', nombreProyecto: 'Closet Ana', estado: 'borrador', tipoProyecto: 'personalizado', clienteId: 'c-2', createdAt: '2026-11-20' } as never,
        ],
        clientes: [
          { id: 'c-1', nombre: 'Juan Pérez' } as never,
          { id: 'c-2', nombre: 'Ana López' } as never,
        ],
      }
    },
    proyecto: async () => {
      llamadas.proyecto++
      return { proyecto: null, cliente: null, espacios: [] } as unknown as ProyectoSnapshot
    },
    finanzas: async () => {
      llamadas.finanzas++
      return {
        cuentas: [
          { id: 'k1', nombre: 'Caja menor', tipo: 'caja', saldoInicial: '0', saldoActual: '150000.50', createdAt: '' },
          { id: 'b1', nombre: 'Bancolombia', tipo: 'banco', saldoInicial: '0', saldoActual: '1000000', createdAt: '' },
        ],
      } as never
    },
    ...extra,
  }
  return { acciones, llamadas }
}

function buscar(nombre: string, acciones: AccionesLectura) {
  const def = crearHerramientas(acciones).find((h) => h.nombre === nombre)
  assert.ok(def, `falta la herramienta ${nombre}`)
  return def
}

const casos: Array<[string, () => Promise<void>]> = [
  ['entrada inválida de cotizacion_buscar no llama a la acción', async () => {
    const { acciones, llamadas } = accionesFalsas()
    await assert.rejects(ejecutarHerramienta(buscar('cotizacion_buscar', acciones), { texto: 'a' }, sesionCon('admin')), /Entrada inválida/)
    assert.equal(llamadas.cotizadorLista, 0)
  }],
  ['proyectoId que no es uuid no llama a la acción', async () => {
    const { acciones, llamadas } = accionesFalsas()
    await assert.rejects(ejecutarHerramienta(buscar('proyecto_consultar', acciones), { proyectoId: 'no-uuid' }, sesionCon('admin')), /Entrada inválida/)
    assert.equal(llamadas.proyecto, 0)
  }],
  ['entrada nula se rechaza (no se llama a la acción)', async () => {
    const { acciones, llamadas } = accionesFalsas()
    await assert.rejects(ejecutarHerramienta(buscar('cotizacion_buscar', acciones), null, sesionCon('admin')))
    assert.equal(llamadas.cotizadorLista, 0)
  }],
  ['cotizacion_buscar devuelve solo las coincidencias por nombre de cliente', async () => {
    const { acciones, llamadas } = accionesFalsas()
    const texto = await ejecutarHerramienta(buscar('cotizacion_buscar', acciones), { texto: 'juan' }, sesionCon('comercial'))
    assert.equal(llamadas.cotizadorLista, 1)
    const datos = JSON.parse(texto)
    assert.equal(datos.total, 1)
    assert.equal(datos.resultados[0].codigo, 'COT-2026-11-25-01')
    assert.equal(datos.resultados[0].cliente, 'Juan Pérez')
  }],
  ['caja_saldo suma los saldos de las cuentas', async () => {
    const { acciones } = accionesFalsas()
    const datos = JSON.parse(await ejecutarHerramienta(buscar('caja_saldo', acciones), {}, sesionCon('finanzas')))
    assert.equal(datos.total, 1150000.5)
    assert.equal(datos.cuentas.length, 2)
  }],
  ['usuario sin permiso no recibe caja_saldo (comercial)', async () => {
    const { acciones } = accionesFalsas()
    const nombres = herramientasPermitidas(sesionCon('comercial'), undefined, crearHerramientas(acciones)).map((h) => h.nombre)
    assert.ok(!nombres.includes('caja_saldo'))
    assert.ok(nombres.includes('cotizacion_buscar'))
  }],
  ['usuario sin permiso que llama directo recibe NoAutorizadoError sin tocar la acción', async () => {
    const { acciones, llamadas } = accionesFalsas()
    await assert.rejects(
      ejecutarHerramienta(buscar('caja_saldo', acciones), {}, sesionCon('comercial')),
      NoAutorizadoError,
    )
    assert.equal(llamadas.finanzas, 0)
  }],
  ['herramienta de escritura no se ejecuta en la fase 1', async () => {
    const { acciones, llamadas } = accionesFalsas()
    const escritura = { ...buscar('caja_saldo', acciones), esEscritura: true }
    await assert.rejects(ejecutarHerramienta(escritura, {}, sesionCon('admin')), /escritura/)
    assert.equal(llamadas.finanzas, 0)
  }],
  ['la lista habilitada por configuración solo reduce', async () => {
    const { acciones } = accionesFalsas()
    const nombres = herramientasPermitidas(sesionCon('admin'), ['caja_saldo', 'nombre_que_no_existe'], crearHerramientas(acciones)).map((h) => h.nombre)
    assert.deepEqual(nombres, ['caja_saldo'])
  }],
  ['resultado grande se trunca a 8000 caracteres con aviso', async () => {
    const enorme = 'x'.repeat(50000)
    const { acciones } = accionesFalsas({ finanzas: async () => ({ cuentas: [{ id: 'k', nombre: enorme, tipo: 'caja', saldoInicial: '0', saldoActual: '0', createdAt: '' }] }) as never })
    const texto = await ejecutarHerramienta(buscar('caja_saldo', acciones), {}, sesionCon('finanzas'))
    assert.ok(texto.length <= MAX_CARACTERES_RESULTADO)
    assert.ok(texto.includes('RESULTADO TRUNCADO'))
  }],
  ['truncarResultado no toca textos cortos', async () => {
    assert.equal(truncarResultado('hola'), 'hola')
  }],
  ['proyecto_consultar con proyecto inexistente responde encontrado false', async () => {
    const { acciones } = accionesFalsas()
    const datos = JSON.parse(await ejecutarHerramienta(buscar('proyecto_consultar', acciones), { proyectoId: PROYECTO_ID }, sesionCon('admin')))
    assert.deepEqual(datos, { encontrado: false })
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
      console.error(`FALLA - ${nombre}\n${(err as Error).stack ?? err}`)
    }
  }
  if (fallos > 0) {
    console.error(`${fallos} caso(s) fallaron`)
    process.exitCode = 1
  }
}

void principal()
