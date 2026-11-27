// Pruebas de las operaciones de propuestas (t-200 paso 5): listar solo las propias; confirmar y
// cancelar solo en el canal MCP (el chat no las ofrece ni las ejecuta); idempotencia.
import assert from 'node:assert/strict'
import type { SesionEmpleado } from '../../auth/session'
import { ejecutarOperacion, MENSAJE_NO_DISPONIBLE, type DepsOperaciones } from '../operaciones'
import { ejecutarHerramienta, operacionesDelCanal, Procedencia, type DefinicionAsistente, type DefinicionLectura } from '../herramientas'
import { crearPropuesta } from '../propuestas'
import { depsRegistroFalsos, mundoFalso, repoPropuestasFalso, type MundoFalso } from '../__pruebas__/prueba-registro'
import { crearOperaciones } from '../registro'
import type { RepositorioPropuestas } from '../propuestas'

const CLIENTE_EXISTENTE = '11111111-1111-4111-8111-111111111111'
const AHORA = new Date('2026-11-27T15:00:00.000Z')

function sesionDe(usuarioId: string): SesionEmpleado {
  return { usuarioId, personaId: null, nombre: usuarioId, email: `${usuarioId}@prueba.test`, rol: 'admin' }
}

/** Registro cuyo almacén de propuestas es `repo`: así la escritura de la prueba y la del registro coinciden. */
function registroCon(repo: RepositorioPropuestas, m: MundoFalso = mundoFalso()): DefinicionAsistente[] {
  return crearOperaciones({ ...depsRegistroFalsos(m), propuestas: repo })
}

function opL(reg: DefinicionAsistente[], nombre: string): DefinicionLectura {
  return op(reg, nombre) as DefinicionLectura
}

function op(reg: DefinicionAsistente[], nombre: string): DefinicionAsistente {
  const def = reg.find((h) => h.nombre === nombre)
  assert.ok(def, `falta ${nombre}`)
  return def
}

const casos: Array<[string, () => Promise<void>]> = [
  ['propuestas.listar devuelve solo las propias, pendientes por defecto', async () => {
    const repo = repoPropuestasFalso()
    const reg = registroCon(repo)
    const deps = { repo, ahora: () => AHORA, registro: reg }
    const yo = sesionDe('u-1')
    const otro = sesionDe('u-2')
    await crearPropuesta({ usuario: yo, conversacionId: 'c1', herramienta: 'clientes.crear', datos: { entrada: { nombre: 'A' } }, resumen: 'Crear A' }, deps)
    await crearPropuesta({ usuario: otro, conversacionId: 'c2', herramienta: 'clientes.crear', datos: { entrada: { nombre: 'B' } }, resumen: 'Crear B' }, deps)
    const r = await ejecutarHerramienta(op(reg, 'propuestas.listar'), {}, yo) as string
    const datos = JSON.parse(r) as { resultados: Array<{ resumen: string }> }
    assert.deepEqual(datos.resultados.map((x) => x.resumen), ['Crear A'])
  }],
  ['propuestas.listar: el estado tiene que estar en la lista (vencida no se expone)', async () => {
    const reg = registroCon(repoPropuestasFalso())
    await assert.rejects(ejecutarHerramienta(op(reg, 'propuestas.listar'), { estado: 'vencida' }, sesionDe('u-1')), /Entrada inválida/)
  }],
  ['confirmar y cancelar no están en el canal chat: el modelo no las ve ni las puede pedir', async () => {
    const reg = registroCon(repoPropuestasFalso())
    const chat = operacionesDelCanal(sesionDe('u-1'), reg).map((h) => h.nombre)
    assert.ok(chat.includes('propuestas.listar'))
    assert.ok(!chat.includes('propuestas.confirmar'))
    assert.ok(!chat.includes('propuestas.cancelar'))
    const deps: DepsOperaciones = {
      registro: reg,
      propuestas: { repo: repoPropuestasFalso(), ahora: () => AHORA, registro: reg },
      conversacionId: async () => 'c1',
      procedencia: new Procedencia(),
    }
    await assert.rejects(
      ejecutarOperacion({ dominio: 'propuestas', operacion: 'confirmar', argumentos: { id: CLIENTE_EXISTENTE } }, sesionDe('u-1'), deps),
      (e: unknown) => e instanceof Error && e.message === MENSAJE_NO_DISPONIBLE,
    )
  }],
  ['MCP: confirmar ejecuta la escritura una vez; segunda confirmación no escribe', async () => {
    const m = mundoFalso({ clientes: [] })
    const repo = repoPropuestasFalso()
    const reg = registroCon(repo, m)
    const deps = { repo, ahora: () => AHORA, registro: reg }
    const yo = sesionDe('u-1')
    const { id } = await crearPropuesta({
      usuario: yo, conversacionId: 'c1', herramienta: 'clientes.crear', datos: { entrada: { nombre: 'Ana Ruiz' } }, resumen: 'Crear Ana Ruiz',
    }, deps)
    const primera = await opL(reg, 'propuestas.confirmar').ejecutar({ id }, yo, { procedencia: new Procedencia() }) as { estado: string; sinCambios: boolean }
    assert.equal(primera.estado, 'ejecutada')
    assert.equal(primera.sinCambios, false)
    assert.equal(m.clientes.filter((c) => c.nombre === 'Ana Ruiz').length, 1)
    const segunda = await opL(reg, 'propuestas.confirmar').ejecutar({ id }, yo, { procedencia: new Procedencia() }) as { sinCambios: boolean }
    assert.equal(segunda.sinCambios, true)
    assert.equal(m.clientes.filter((c) => c.nombre === 'Ana Ruiz').length, 1)
  }],
  ['MCP: cancelar una pendiente la cancela; cancelar otra vez no cambia nada', async () => {
    const repo = repoPropuestasFalso()
    const reg = registroCon(repo)
    const deps = { repo, ahora: () => AHORA, registro: reg }
    const yo = sesionDe('u-1')
    const { id } = await crearPropuesta({ usuario: yo, conversacionId: 'c1', herramienta: 'clientes.crear', datos: { entrada: { nombre: 'X' } }, resumen: 'x' }, deps)
    const r1 = await opL(reg, 'propuestas.cancelar').ejecutar({ id }, yo, { procedencia: new Procedencia() }) as { estado: string }
    assert.equal(r1.estado, 'cancelada')
    const r2 = await opL(reg, 'propuestas.cancelar').ejecutar({ id }, yo, { procedencia: new Procedencia() }) as { sinCambios: boolean }
    assert.equal(r2.sinCambios, true)
  }],
  ['MCP: no se puede confirmar la propuesta de otro usuario', async () => {
    const repo = repoPropuestasFalso()
    const reg = registroCon(repo)
    const deps = { repo, ahora: () => AHORA, registro: reg }
    const { id } = await crearPropuesta({ usuario: sesionDe('u-1'), conversacionId: 'c1', herramienta: 'clientes.crear', datos: { entrada: { nombre: 'X' } }, resumen: 'x' }, deps)
    await assert.rejects(
      opL(reg, 'propuestas.confirmar').ejecutar({ id }, sesionDe('u-2'), { procedencia: new Procedencia() }),
      (e: unknown) => e instanceof Error && /pertenece a otro usuario/.test(e.message),
    )
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
