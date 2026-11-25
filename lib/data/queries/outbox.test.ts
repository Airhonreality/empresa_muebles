// Pruebas de la cola de escrituras (node:assert). Correr con:
//   npx tsx lib/data/queries/outbox.test.ts
import assert from 'node:assert/strict'
import { Outbox, type EscrituraPendiente, type TipoEscritura } from './outbox'

function almacenMemoria(inicial: EscrituraPendiente[] = []) {
  let datos = JSON.parse(JSON.stringify(inicial)) as EscrituraPendiente[]
  return {
    leer: async () => JSON.parse(JSON.stringify(datos)) as EscrituraPendiente[],
    guardar: async (lista: EscrituraPendiente[]) => {
      datos = JSON.parse(JSON.stringify(lista))
    },
    ver: () => datos,
  }
}

const redCaida = () => new TypeError('Failed to fetch')
const rechazo = () => new Error('Entrada inválida: cantidad — debe ser un número no negativo')

// Programador de reintentos manual: el test decide cuándo reintentar.
function programadorManual() {
  const pendientes: Array<() => void> = []
  return {
    programar: (fn: () => void) => {
      pendientes.push(fn)
      return pendientes.length
    },
    dispararUno: () => pendientes.shift()?.(),
    cuantos: () => pendientes.length,
  }
}

async function main() {
  // 1. Confirma en orden y vacía la cola
  {
    const almacen = almacenMemoria()
    const orden: string[] = []
    const ob = new Outbox({
      almacen,
      ejecutar: async (tipo: TipoEscritura, args) => {
        orden.push(`${tipo}:${(args as { n: number }).n}`)
        return { ok: true }
      },
    })
    const r1 = await ob.encolar('crearItem', { n: 1 }, 'p1')
    const r2 = await ob.encolar('actualizarItem', { n: 2 }, 'p1')
    assert.deepEqual(r1, { ok: true })
    assert.deepEqual(r2, { ok: true })
    assert.deepEqual(orden, ['crearItem:1', 'actualizarItem:2'], 'orden FIFO')
    assert.equal(ob.pendientes(), 0)
    assert.equal(almacen.ver().length, 0, 'la cola persistida queda vacía')
  }

  // 2. Fallo de red: no rechaza, conserva la escritura, reintenta y confirma
  {
    const almacen = almacenMemoria()
    const prog = programadorManual()
    let intentos = 0
    const confirmadas: string[] = []
    const ob = new Outbox({
      almacen,
      programar: prog.programar,
      ejecutar: async () => {
        intentos += 1
        if (intentos === 1) throw redCaida()
        return 'ok'
      },
      onConfirmada: (e) => confirmadas.push(e.tipo),
    })
    const promesa = ob.encolar('crearItem', { n: 1 }, 'p1')
    // Esperar a que el primer intento falle y deje la escritura en espera
    await new Promise((r) => setTimeout(r, 0))
    assert.equal(ob.pendientes(), 1, 'la escritura sigue en cola tras el fallo de red')
    assert.equal(almacen.ver()[0].intentosRed, 1, 'se contó el intento de red')
    assert.equal(prog.cuantos(), 1, 'se agendó un reintento')
    prog.dispararUno()
    assert.equal(await promesa, 'ok', 'la promesa resuelve tras el reintento')
    assert.deepEqual(confirmadas, ['crearItem'])
    assert.equal(ob.pendientes(), 0)
  }

  // 3. Rechazo del servidor: sale de la cola, rechaza la promesa, la siguiente sigue
  {
    const almacen = almacenMemoria()
    const rechazadas: string[] = []
    const ejecutadas: number[] = []
    const ob = new Outbox({
      almacen,
      ejecutar: async (_tipo, args) => {
        const n = (args as { n: number }).n
        ejecutadas.push(n)
        if (n === 1) throw rechazo()
        return 'ok'
      },
      onRechazada: (e) => rechazadas.push(e.tipo),
    })
    const p1 = ob.encolar('crearItem', { n: 1 }, 'p1')
    const p2 = ob.encolar('crearItem', { n: 2 }, 'p1')
    await assert.rejects(p1, /Entrada inválida/)
    assert.equal(await p2, 'ok')
    assert.deepEqual(rechazadas, ['crearItem'])
    assert.deepEqual(ejecutadas, [1, 2])
    assert.equal(ob.pendientes(), 0)
  }

  // 4. Una escritura bloqueada por red bloquea las siguientes (no hay escrituras fuera de orden)
  {
    const almacen = almacenMemoria()
    const prog = programadorManual()
    const ejecutadas: number[] = []
    let primera = true
    const ob = new Outbox({
      almacen,
      programar: prog.programar,
      ejecutar: async (_tipo, args) => {
        const n = (args as { n: number }).n
        ejecutadas.push(n)
        if (n === 1 && primera) {
          primera = false
          throw redCaida()
        }
        return 'ok'
      },
    })
    void ob.encolar('crearItem', { n: 1 }, 'p1')
    void ob.encolar('crearItem', { n: 2 }, 'p1')
    await new Promise((r) => setTimeout(r, 0))
    assert.deepEqual(ejecutadas, [1], 'la 2 no se ejecuta mientras la 1 espera red')
    prog.dispararUno()
    await new Promise((r) => setTimeout(r, 0))
    assert.deepEqual(ejecutadas, [1, 1, 2], 'tras reconectar se ejecuta en orden')
  }

  // 5. Persistencia: una cola guardada sobrevive a una recarga (instancia nueva)
  {
    const almacen = almacenMemoria([
      { id: 'a', tipo: 'crearItem', args: { n: 7 }, proyectoId: 'p1', creadaEn: 1, intentosRed: 2 },
    ])
    const ejecutadas: number[] = []
    const ob = new Outbox({
      almacen,
      ejecutar: async (_t, args) => {
        ejecutadas.push((args as { n: number }).n)
        return 'ok'
      },
    })
    await ob.iniciar()
    assert.equal(ob.pendientes(), 1, 'se restauró la escritura pendiente')
    await ob.procesar()
    assert.deepEqual(ejecutadas, [7], 'se reenvió tras la recarga')
    assert.equal(almacen.ver().length, 0)
  }

  console.log('outbox.test.ts: OK')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
