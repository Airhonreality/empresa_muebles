// Test del historial de acciones deshacibles (t-179). Sin DB, sin React.
// Ejecutar: npx tsx lib/data/queries/historial-deshacer.test.ts
import assert from 'node:assert/strict'
import {
  registrarAccionDeshacer,
  deshacerUltimaAccion,
  hayAccionesPorDeshacer,
  _limpiarHistorialDeshacer,
  patchInverso,
} from './historial-deshacer'

let pasadas = 0
async function test(nombre: string, fn: () => void | Promise<void>): Promise<void> {
  await fn()
  pasadas++
  console.log(`  ok - ${nombre}`)
}

;(async () => {
  await test('deshacerUltimaAccion sin nada registrado -> null', async () => {
    _limpiarHistorialDeshacer('p1')
    assert.equal(await deshacerUltimaAccion('p1'), null)
  })

  await test('hayAccionesPorDeshacer refleja si la pila tiene algo', async () => {
    _limpiarHistorialDeshacer('p1')
    assert.equal(hayAccionesPorDeshacer('p1'), false)
    registrarAccionDeshacer('p1', { descripcion: 'Crear ítem', deshacer: async () => {} })
    assert.equal(hayAccionesPorDeshacer('p1'), true)
  })

  await test('deshacerUltimaAccion ejecuta la función de deshacer y devuelve la descripción', async () => {
    _limpiarHistorialDeshacer('p1')
    let ejecutado = false
    registrarAccionDeshacer('p1', { descripcion: 'Editar ítem', deshacer: async () => { ejecutado = true } })
    const desc = await deshacerUltimaAccion('p1')
    assert.equal(desc, 'Editar ítem')
    assert.equal(ejecutado, true)
  })

  await test('deshacerUltimaAccion es LIFO (la más reciente primero)', async () => {
    _limpiarHistorialDeshacer('p1')
    const orden: string[] = []
    registrarAccionDeshacer('p1', { descripcion: 'A', deshacer: async () => { orden.push('A') } })
    registrarAccionDeshacer('p1', { descripcion: 'B', deshacer: async () => { orden.push('B') } })
    await deshacerUltimaAccion('p1')
    await deshacerUltimaAccion('p1')
    assert.deepEqual(orden, ['B', 'A'])
  })

  await test('deshacer deja la pila vacía después de agotarla', async () => {
    _limpiarHistorialDeshacer('p1')
    registrarAccionDeshacer('p1', { descripcion: 'A', deshacer: async () => {} })
    await deshacerUltimaAccion('p1')
    assert.equal(hayAccionesPorDeshacer('p1'), false)
    assert.equal(await deshacerUltimaAccion('p1'), null)
  })

  await test('las pilas de proyectos distintos no se mezclan', async () => {
    _limpiarHistorialDeshacer('p1')
    _limpiarHistorialDeshacer('p2')
    registrarAccionDeshacer('p1', { descripcion: 'solo-p1', deshacer: async () => {} })
    assert.equal(hayAccionesPorDeshacer('p2'), false)
    assert.equal(await deshacerUltimaAccion('p2'), null)
    assert.equal(hayAccionesPorDeshacer('p1'), true)
  })

  await test('un deshacer que falla propaga el error y no se vuelve a registrar', async () => {
    _limpiarHistorialDeshacer('p1')
    registrarAccionDeshacer('p1', { descripcion: 'falla', deshacer: async () => { throw new Error('boom') } })
    await assert.rejects(() => deshacerUltimaAccion('p1'), /boom/)
    assert.equal(hayAccionesPorDeshacer('p1'), false, 'la acción ya salió de la pila aunque falló')
  })

  await test('patchInverso: toma de "anterior" solo las claves presentes en el patch', () => {
    const anterior = { cantidad: '2', precioUnitario: '1000', nombrePersonalizado: 'Viejo' }
    const patch = { cantidad: '9', nombrePersonalizado: 'Nuevo' }
    const inverso = patchInverso(anterior, patch)
    assert.deepEqual(inverso, { cantidad: '2', nombrePersonalizado: 'Viejo' })
    assert.ok(!('precioUnitario' in inverso), 'no toca claves fuera del patch')
  })

  await test('patchInverso: patch vacío da un inverso vacío', () => {
    assert.deepEqual(patchInverso({ a: 1 }, {}), {})
  })

  console.log(`\n${pasadas} pruebas pasadas`)
})().catch((err) => {
  console.error(err)
  process.exit(1)
})
