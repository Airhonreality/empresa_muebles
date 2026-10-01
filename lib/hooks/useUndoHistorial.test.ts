// Test de HistorialDeshacer (t-177). Clase pura, sin React -- patrón node:assert + tsx del repo.
// Ejecutar: npx tsx lib/hooks/useUndoHistorial.test.ts
import assert from 'node:assert/strict'
import { HistorialDeshacer } from './useUndoHistorial'

let pasadas = 0
function test(nombre: string, fn: () => void): void {
  fn()
  pasadas++
  console.log(`  ok - ${nombre}`)
}

test('deshacer sin ningún cambio registrado -> null (nada que deshacer)', () => {
  const h = new HistorialDeshacer('100')
  assert.equal(h.deshacer(), null)
})

test('registrar + deshacer vuelve al valor anterior', () => {
  const h = new HistorialDeshacer('1')
  h.registrar('12')
  h.registrar('123')
  assert.equal(h.deshacer(), '12')
  assert.equal(h.deshacer(), '1')
  assert.equal(h.deshacer(), null, 'ya no hay más atrás')
})

test('rehacer después de deshacer vuelve a avanzar', () => {
  const h = new HistorialDeshacer('1')
  h.registrar('12')
  h.registrar('123')
  h.deshacer()
  h.deshacer()
  assert.equal(h.rehacer(), '12')
  assert.equal(h.rehacer(), '123')
  assert.equal(h.rehacer(), null, 'ya no hay más adelante')
})

test('escribir después de deshacer corta la rama hacia adelante (como cualquier editor)', () => {
  const h = new HistorialDeshacer('1')
  h.registrar('12')
  h.registrar('123')
  h.deshacer() // vuelve a '12'
  h.registrar('125') // nueva rama desde '12'
  assert.equal(h.rehacer(), null, 'el "123" original ya no existe, se sobreescribió la rama')
  assert.equal(h.deshacer(), '12')
})

test('registrar el mismo valor consecutivo no crea un paso nuevo', () => {
  const h = new HistorialDeshacer('1')
  h.registrar('1')
  h.registrar('1')
  assert.equal(h.deshacer(), null, 'no se acumularon pasos duplicados')
})

test('el historial tiene un tope (no crece sin límite)', () => {
  const h = new HistorialDeshacer('0')
  for (let i = 1; i <= 60; i++) h.registrar(String(i))
  let pasos = 0
  while (h.deshacer() !== null) pasos++
  assert.ok(pasos < 60, `se esperaba un tope por debajo de 60 pasos, se obtuvieron ${pasos}`)
})

console.log(`\n${pasadas} pruebas pasadas`)
