// Test del núcleo puro del autoguardado (coalescencia, serialización, errores).
// Sin React ni DB — patrón node:assert + tsx del repo.
// Ejecutar: npx tsx lib/hooks/autosave-cola.test.ts
import assert from 'node:assert/strict'
import { combinarEstados, crearColaAutosave, mismoValor, type EstadoAutosave } from './autosave-cola'

let pasadas = 0
async function test(nombre: string, fn: () => void | Promise<void>): Promise<void> {
  await fn()
  pasadas++
  console.log(`  ok - ${nombre}`)
}

const dormir = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function montar<T>(valorInicial: T, guardar: (valor: T) => Promise<unknown>, delayMs = 5) {
  const estados: EstadoAutosave[] = []
  const cola = crearColaAutosave<T>({
    valorInicial,
    guardar,
    delayMs,
    onEstado: (estado) => estados.push(estado),
  })
  return { cola, estados }
}

;(async () => {
await test('mismoValor: compara arrays y objetos planos por contenido', () => {
  assert.equal(mismoValor('a', 'a'), true)
  assert.equal(mismoValor([1, 2], [1, 2]), true)
  assert.equal(mismoValor({ a: 'x', b: [1] }, { a: 'x', b: [1] }), true)
  assert.equal(mismoValor({ a: 'x' }, { a: 'y' }), false)
  assert.equal(mismoValor(['a'], ['a', 'b']), false)
  assert.equal(mismoValor(null, undefined), false)
})

await test('combinarEstados: gana el peor estado', () => {
  assert.equal(combinarEstados('saved', 'idle'), 'saved')
  assert.equal(combinarEstados('saved', 'pending'), 'pending')
  assert.equal(combinarEstados('pending', 'error'), 'error')
  assert.equal(combinarEstados('error', 'saving'), 'error')
})

await test('coalescencia: N cambios dentro de la ventana = 1 sola escritura con el último valor', async () => {
  const enviados: string[] = []
  const { cola, estados } = montar('', async (valor) => {
    enviados.push(valor)
  })
  cola.programar('a')
  cola.programar('ab')
  cola.programar('abc')
  await dormir(30)
  assert.deepEqual(enviados, ['abc'])
  assert.equal(estados[0], 'pending')
  assert.deepEqual(estados.slice(-2), ['saving', 'saved'])
})

await test('no escribe si el valor no cambió respecto del último guardado', async () => {
  const enviados: string[] = []
  const { cola, estados } = montar('igual', async (valor) => {
    enviados.push(valor)
  })
  cola.programar('igual')
  await dormir(30)
  assert.deepEqual(enviados, [])
  assert.deepEqual(estados, [], 'sin cambios no hay nada que indicar')
})

await test('flush: guarda de inmediato sin esperar el debounce', async () => {
  const enviados: string[] = []
  const { cola } = montar('', async (valor) => {
    enviados.push(valor)
  })
  cola.programar('ahora')
  cola.flush()
  await dormir(20)
  assert.deepEqual(enviados, ['ahora'])
})

await test('serialización: no hay dos escrituras en vuelo; al terminar se manda el último valor', async () => {
  const enviados: string[] = []
  let resolverPrimera: () => void = () => {}
  let enVuelo = 0
  let maxEnVuelo = 0
  const { cola } = montar('', async (valor) => {
    enVuelo++
    maxEnVuelo = Math.max(maxEnVuelo, enVuelo)
    enviados.push(valor)
    if (enviados.length === 1) {
      await new Promise<void>((resolve) => {
        resolverPrimera = resolve
      })
    }
    enVuelo--
  })
  cola.programar('uno')
  cola.flush()
  await dormir(5)
  cola.programar('dos')
  cola.programar('tres')
  resolverPrimera()
  await dormir(30)
  assert.equal(maxEnVuelo, 1, 'nunca debe haber dos escrituras concurrentes')
  assert.deepEqual(enviados, ['uno', 'tres'])
})

await test('error: reporta error, conserva el draft y reintentar vuelve a guardar', async () => {
  const enviados: string[] = []
  let fallar = true
  const { cola, estados } = montar('', async (valor) => {
    if (fallar) throw new Error('sin red')
    enviados.push(valor)
  })
  cola.programar('dato')
  await dormir(30)
  assert.deepEqual(enviados, [])
  assert.equal(estados.at(-1), 'error')

  fallar = false
  cola.reintentar()
  await dormir(20)
  assert.deepEqual(enviados, ['dato'])
  assert.equal(estados.at(-1), 'saved')
})

await test('dispose: cancela lo agendado y deja de reportar estado', async () => {
  const enviados: string[] = []
  const estados: EstadoAutosave[] = []
  const cola = crearColaAutosave<string>({
    valorInicial: '',
    delayMs: 5,
    guardar: async (valor) => {
      enviados.push(valor)
    },
    onEstado: (estado) => estados.push(estado),
  })
  cola.programar('tarde')
  cola.dispose()
  await dormir(30)
  assert.deepEqual(enviados, [])
  assert.deepEqual(estados, ['pending'])
})

console.log(`\n${pasadas} pruebas pasadas`)
})().catch((err) => {
  console.error(err)
  process.exit(1)
})