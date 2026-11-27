// Pruebas de las operaciones de búsqueda (t-200 paso 3): entrada, enums, salida y procedencia.
import assert from 'node:assert/strict'
import { estadoProyecto } from '../../db/schema'
import { TIPOS_ESPACIO } from '../../catalogos/tipos-espacio'
import type { SesionEmpleado } from '../../auth/session'
import { NoAutorizadoError } from '../../auth/errors'
import { ejecutarHerramienta, Procedencia, catalogoDominios, herramientasPermitidas, type DefinicionAsistente } from '../herramientas'
import { conPermisosRestringidos } from '../__pruebas__/prueba-permisos'
import { mundoFalso, registroFalso, type MundoFalso } from '../__pruebas__/prueba-registro'
import { ESTADOS_PROYECTO } from './cotizacion'
import { ETIQUETA_SUBTOTAL_MATERIALES } from '../etiquetas'
import { zodToJsonSchema } from '../esquema-json'

const CLI_GARCIA = '11111111-1111-4111-8111-111111111111'
const CLI_OTRO = '22222222-2222-4222-8222-222222222222'
const PROD_COCINA = '33333333-3333-4333-8333-333333333333'
const PROY_1 = '44444444-4444-4444-8444-444444444444'
const PROY_2 = '55555555-5555-4555-8555-555555555555'
const CUENTA = '66666666-6666-4666-8666-666666666666'
const NO_EXISTE = '77777777-7777-4777-8777-777777777777'

function sesionCon(rol: SesionEmpleado['rol']): SesionEmpleado {
  return { usuarioId: 'u-1', personaId: null, nombre: 'Prueba', email: 'p@prueba.test', rol }
}

function mundoBase(): MundoFalso {
  return mundoFalso({
    clientes: [
      { id: CLI_GARCIA, nombre: 'María García', documento: '1020304050', telefono: '3001112233' },
      { id: CLI_OTRO, nombre: 'Juan Pérez', documento: null, telefono: null },
    ],
    productos: [
      { id: PROD_COCINA, descripcion: 'Gabinete base 60 cm', sku: 'GB-60', categoria: 'Cocinas', precioPublico: '250000', unidad: 'ud' },
    ],
    proyectos: [
      { id: PROY_1, codigo: 'COT-2026-11-25-01', nombreProyecto: 'Cocina Márquez', estado: 'cotizado', clienteId: CLI_GARCIA, clienteNombre: 'María García', creadoEn: '2026-11-25T10:00:00Z' },
      { id: PROY_2, codigo: 'COT-2026-11-26-01', nombreProyecto: 'Closet Pérez', estado: 'borrador', clienteId: CLI_OTRO, clienteNombre: 'Juan Pérez', creadoEn: '2026-11-26T10:00:00Z' },
    ],
    materiales: new Map([[PROY_1, 500000]]),
    detalles: new Map([[PROY_1, {
      id: PROY_1, codigo: 'COT-2026-11-25-01', nombreProyecto: 'Cocina Márquez', estado: 'cotizado', direccionObra: null,
      aplicaIva: true, porcentajeIva: '19', cliente: { id: CLI_GARCIA, nombre: 'María García' },
      espacios: [{ id: 'esp-1', nombre: 'Cocina', tipoEspacio: 'cocina', items: [{ productoId: PROD_COCINA, nombre: null, cantidad: '2', precioUnitario: '250000', totalLinea: '500000' }] }],
    }]]),
    cuentas: [{ id: CUENTA, nombre: 'Caja menor', tipo: 'caja_menor', saldoActual: '150000' }],
  })
}

function op(registro: DefinicionAsistente[], nombre: string): DefinicionAsistente {
  const def = registro.find((h) => h.nombre === nombre)
  assert.ok(def, `falta ${nombre}`)
  return def
}

async function ejecutar(registro: DefinicionAsistente[], nombre: string, entrada: unknown, rol: SesionEmpleado['rol'] = 'admin', procedencia = new Procedencia()) {
  const texto = await ejecutarHerramienta(op(registro, nombre), entrada, sesionCon(rol), { procedencia })
  return { datos: JSON.parse(texto), procedencia }
}

const casos: Array<[string, () => Promise<void>]> = [
  ['clientes.buscar encuentra sin acentos ni orden de palabras (garcia maria)', async () => {
    const { datos } = await ejecutar(registroFalso(mundoBase()), 'clientes.buscar', { texto: 'garcia maria' })
    assert.equal(datos.total, 1)
    assert.equal(datos.resultados[0].id, CLI_GARCIA)
    assert.equal(datos.resultados[0].etiqueta, 'María García (1020304050)')
  }],
  ['clientes.buscar registra los ids devueltos en la procedencia', async () => {
    const { procedencia } = await ejecutar(registroFalso(mundoBase()), 'clientes.buscar', { texto: 'juan' })
    assert.ok(procedencia.tiene('cliente', CLI_OTRO))
    assert.ok(!procedencia.tiene('cliente', CLI_GARCIA))
  }],
  ['clientes.buscar: límite fuera del enum (6) se rechaza sin buscar', async () => {
    const mundo = mundoBase()
    await assert.rejects(ejecutar(registroFalso(mundo), 'clientes.buscar', { texto: 'maria', limite: 6 }), /Entrada inválida/)
    assert.equal(mundo.llamadas['clientes.listar'] ?? 0, 0)
  }],
  ['clientes.buscar: texto vacío se rechaza', async () => {
    await assert.rejects(ejecutar(registroFalso(mundoBase()), 'clientes.buscar', { texto: '   ' }), /Entrada inválida/)
  }],
  ['clientes.buscar: campo desconocido se rechaza (esquema estricto)', async () => {
    await assert.rejects(ejecutar(registroFalso(mundoBase()), 'clientes.buscar', { texto: 'maria', clienteId: CLI_OTRO }), /Entrada inválida/)
  }],
  ['catalogo.espacios devuelve exactamente los códigos de tipos-espacio', async () => {
    const { datos } = await ejecutar(registroFalso(mundoBase()), 'catalogo.espacios', {})
    assert.deepEqual(datos.espacios.map((e: { valor: string }) => e.valor), TIPOS_ESPACIO.map((t) => t.codigo))
  }],
  ['catalogo.productos_buscar devuelve precio público y registra el producto', async () => {
    const { datos, procedencia } = await ejecutar(registroFalso(mundoBase()), 'catalogo.productos_buscar', { texto: 'gabinete base' })
    assert.equal(datos.resultados[0].precioPublico, '250000')
    assert.equal(datos.resultados[0].unidad, 'ud')
    assert.ok(procedencia.tiene('producto', PROD_COCINA))
  }],
  ['catalogo.productos_buscar: sin coincidencias -> total 0', async () => {
    const { datos } = await ejecutar(registroFalso(mundoBase()), 'catalogo.productos_buscar', { texto: 'helicoptero' })
    assert.deepEqual(datos, { total: 0, resultados: [] })
  }],
  ['cotizacion.buscar filtra por estado del enum y devuelve subtotal de materiales', async () => {
    const { datos } = await ejecutar(registroFalso(mundoBase()), 'cotizacion.buscar', { estado: 'cotizado' })
    assert.equal(datos.total, 1)
    assert.equal(datos.resultados[0][ETIQUETA_SUBTOTAL_MATERIALES], '500000')
    assert.match(datos.nota, /sin mano de obra/)
  }],
  ['cotizacion.buscar: estado fuera del enum real se rechaza', async () => {
    await assert.rejects(ejecutar(registroFalso(mundoBase()), 'cotizacion.buscar', { estado: 'pagada' }), /Entrada inválida/)
  }],
  ['cotizacion.buscar por código y cliente, registra ids', async () => {
    const { datos, procedencia } = await ejecutar(registroFalso(mundoBase()), 'cotizacion.buscar', { texto: 'COT-2026-11-25' })
    assert.equal(datos.resultados[0].codigo, 'COT-2026-11-25-01')
    assert.ok(procedencia.tiene('cotizacion', PROY_1))
  }],
  ['cotizacion.consultar sin uuid válido se rechaza', async () => {
    await assert.rejects(ejecutar(registroFalso(mundoBase()), 'cotizacion.consultar', { id: 'no-uuid' }), /Entrada inválida/)
  }],
  ['cotizacion.consultar devuelve espacios, productoId y registra los productos', async () => {
    const { datos, procedencia } = await ejecutar(registroFalso(mundoBase()), 'cotizacion.consultar', { id: PROY_1 })
    assert.equal(datos.encontrado, true)
    assert.equal(datos.espacios[0].items[0].productoId, PROD_COCINA)
    assert.equal(datos[ETIQUETA_SUBTOTAL_MATERIALES], '500000')
    assert.ok(procedencia.tiene('producto', PROD_COCINA))
  }],
  ['cotizacion.consultar de un id inexistente responde encontrado false', async () => {
    const { datos } = await ejecutar(registroFalso(mundoBase()), 'cotizacion.consultar', { id: NO_EXISTE })
    assert.deepEqual(datos, { encontrado: false })
  }],
  ['finanzas.cuentas lista cuentas con saldo y registra el id de la cuenta', async () => {
    const { datos, procedencia } = await ejecutar(registroFalso(mundoBase()), 'finanzas.cuentas', {}, 'finanzas')
    assert.equal(datos.cuentas[0].saldo, '150000')
    assert.equal(datos.total, 150000)
    assert.ok(procedencia.tiene('cuenta', CUENTA))
  }],
  ['permiso denegado: la operación no aparece en el mapa del rol ni se ejecuta por nombre', async () => {
    const registro = registroFalso(mundoBase())
    await conPermisosRestringidos('comercial', ['clientes:leer'], async () => {
      assert.ok(!catalogoDominios(sesionCon('comercial'), registro).some((d) => d.dominio === 'finanzas'))
      assert.ok(!herramientasPermitidas(sesionCon('comercial'), undefined, registro).some((h) => h.nombre === 'finanzas.cuentas'))
      await assert.rejects(ejecutar(registro, 'finanzas.cuentas', {}, 'comercial'), NoAutorizadoError)
    })
  }],
  ['las operaciones de búsqueda se convierten a JSON Schema', async () => {
    const json = zodToJsonSchema(op(registroFalso(mundoBase()), 'cotizacion.buscar').esquema) as { properties: Record<string, unknown> }
    assert.ok('estado' in json.properties)
  }],
  ['ESTADOS_PROYECTO es exactamente el enum estado_proyecto de lib/db/schema.ts', async () => {
    assert.deepEqual([...ESTADOS_PROYECTO], [...estadoProyecto.enumValues])
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
