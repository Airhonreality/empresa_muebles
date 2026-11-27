// Segunda barrera del chat (t-200 C1): cada operación exige el permiso base Y puedeUsarChat.
import assert from 'node:assert/strict'
import type { SesionEmpleado } from '../auth/session'
import type { RolCanonico } from '../data/contracts'
import { MENSAJE_NO_DISPONIBLE, ejecutarOperacion } from './operaciones'
import { Procedencia, operacionesDelCanal, tienePermiso } from './herramientas'
import { MATRIZ_CHAT, puedeDescontarChat, puedeUsarChat } from './matriz-chat'
import { mundoFalso, registroFalso, repoPropuestasFalso, type MundoFalso } from './__pruebas__/prueba-registro'

function sesionCon(rol: RolCanonico): SesionEmpleado {
  return { usuarioId: 'u-1', personaId: null, nombre: 'Prueba', email: 'p@prueba.test', rol }
}

function nombresVisibles(rol: RolCanonico): string[] {
  const registro = registroFalso(mundoFalso())
  return operacionesDelCanal(sesionCon(rol), registro).map((h) => h.nombre)
}

const casos: Array<[string, () => Promise<void>]> = [
  ['comercial ve búsqueda de clientes y crear cotización', async () => {
    const nombres = nombresVisibles('comercial')
    assert.ok(nombres.includes('clientes.buscar'))
    assert.ok(nombres.includes('cotizacion.crear_completa'))
  }],
  ['taller no ve operaciones de finanzas ni de cotización', async () => {
    const nombres = nombresVisibles('taller')
    assert.equal(nombres.filter((n) => n.startsWith('finanzas.')).length, 0)
    assert.equal(nombres.filter((n) => n.startsWith('cotizacion.')).length, 0)
  }],
  ['finanzas no ve cotización (sí ve finanzas)', async () => {
    const nombres = nombresVisibles('finanzas')
    assert.equal(nombres.filter((n) => n.startsWith('cotizacion.')).length, 0)
    assert.ok(nombres.some((n) => n.startsWith('finanzas.')))
  }],
  ['admin ve todas las operaciones del chat', async () => {
    const registro = registroFalso(mundoFalso())
    const todas = registro.filter((h) => h.canales.includes('chat')).map((h) => h.nombre).sort()
    assert.deepEqual(nombresVisibles('admin').sort(), todas)
  }],
  ['descuento y precio libre solo para admin', async () => {
    assert.equal(puedeDescontarChat('admin'), true)
    for (const rol of ['comercial', 'desarrollador', 'compras', 'taller', 'finanzas', 'supervisora_qa'] as const) {
      assert.equal(puedeDescontarChat(rol), false, `${rol} no debe descontar`)
    }
  }],
  ['la matriz del chat no concede permisos fuera del original (taller no tiene cotizador ni finanzas)', async () => {
    assert.equal(puedeUsarChat('taller', 'cotizador:leer'), false)
    assert.equal(puedeUsarChat('taller', 'finanzas:leer'), false)
    assert.equal(puedeUsarChat('finanzas', 'cotizador:leer'), false)
    assert.equal(puedeUsarChat('comercial', 'finanzas:leer'), false)
  }],
  ['el permiso base sigue siendo necesario: la matriz del chat sola no basta', async () => {
    const { conPermisosRestringidos } = await import('./__pruebas__/prueba-permisos')
    const registro = registroFalso(mundoFalso())
    const def = registro.find((h) => h.nombre === 'clientes.buscar')!
    await conPermisosRestringidos('comercial', ['erp:acceso'], () => {
      assert.equal(tienePermiso(sesionCon('comercial'), def), false)
    })
    assert.equal(tienePermiso(sesionCon('comercial'), def), true)
  }],
  ['ejecutar rechaza una operación fuera de la matriz del chat aunque el nombre sea correcto', async () => {
    const mundo: MundoFalso = mundoFalso()
    const registro = registroFalso(mundo)
    const repo = repoPropuestasFalso()
    await assert.rejects(
      ejecutarOperacion(
        { dominio: 'finanzas', operacion: 'cuentas', argumentos: {} },
        sesionCon('taller'),
        { registro, propuestas: { repo, ahora: () => new Date(), registro }, conversacionId: async () => 'c-1', procedencia: new Procedencia() },
      ),
      (e: unknown) => e instanceof Error && e.message === MENSAJE_NO_DISPONIBLE,
    )
    assert.equal(mundo.llamadas['finanzas.cuentas'] ?? 0, 0)
  }],
  ['todos los roles canónicos tienen entrada en la matriz del chat', async () => {
    for (const rol of ['admin', 'comercial', 'desarrollador', 'compras', 'taller', 'finanzas', 'supervisora_qa'] as const) {
      assert.ok(Array.isArray(MATRIZ_CHAT[rol]), `falta ${rol}`)
    }
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
