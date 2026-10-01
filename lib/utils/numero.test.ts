// Test del parser agnóstico de separador decimal (t-175). Sin DB, sin React.
// Ejecutar: npx tsx lib/utils/numero.test.ts
import assert from 'node:assert/strict'
import { normalizarNumeroTexto, parseNumeroFlexible } from './numero'

let pasadas = 0
function test(nombre: string, fn: () => void): void {
  fn()
  pasadas++
  console.log(`  ok - ${nombre}`)
}

test('texto vacío -> cadena vacía', () => {
  assert.equal(normalizarNumeroTexto(''), '')
})

test('solo dígitos -> igual', () => {
  assert.equal(normalizarNumeroTexto('45'), '45')
})

test('coma única como decimal (es-CO): "4,5" -> "4.5"', () => {
  assert.equal(normalizarNumeroTexto('4,5'), '4.5')
})

test('punto único como decimal (en-US): "4.5" -> "4.5"', () => {
  assert.equal(normalizarNumeroTexto('4.5'), '4.5')
})

test('coma repetida = separador de miles, se descarta: "1,234,567" -> "1234567"', () => {
  assert.equal(normalizarNumeroTexto('1,234,567'), '1234567')
})

test('punto repetido = separador de miles, se descarta: "1.234.567" -> "1234567"', () => {
  assert.equal(normalizarNumeroTexto('1.234.567'), '1234567')
})

test('ambos presentes, coma a la derecha es decimal (es-CO): "1.234,56" -> "1234.56"', () => {
  assert.equal(normalizarNumeroTexto('1.234,56'), '1234.56')
})

test('ambos presentes, punto a la derecha es decimal (en-US): "1,234.56" -> "1234.56"', () => {
  assert.equal(normalizarNumeroTexto('1,234.56'), '1234.56')
})

test('separador decimal sin dígitos después: "4," -> "4"', () => {
  assert.equal(normalizarNumeroTexto('4,'), '4')
})

test('separador decimal sin dígitos antes: ",5" -> "0.5"', () => {
  assert.equal(normalizarNumeroTexto(',5'), '0.5')
})

test('caracteres no numéricos se descartan: "4,5 jornadas" -> "4.5"', () => {
  assert.equal(normalizarNumeroTexto('4,5 jornadas'), '4.5')
})

test('sin dígitos en absoluto -> cadena vacía', () => {
  assert.equal(normalizarNumeroTexto('abc'), '')
})

test('parseNumeroFlexible: convierte a number, agnóstico al separador', () => {
  assert.equal(parseNumeroFlexible('4,5'), 4.5)
  assert.equal(parseNumeroFlexible('4.5'), 4.5)
  assert.equal(parseNumeroFlexible('1.234.567'), 1234567)
})

test('parseNumeroFlexible: texto vacío o inválido -> 0, nunca NaN', () => {
  assert.equal(parseNumeroFlexible(''), 0)
  assert.equal(parseNumeroFlexible('abc'), 0)
})

console.log(`\n${pasadas} pruebas pasadas`)
