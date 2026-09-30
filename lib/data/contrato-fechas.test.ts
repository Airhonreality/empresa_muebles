/**
 * t-173: el plazo pactado se imprime desde el número, nunca desde un texto libre.
 *
 * Antes este archivo testeaba el cálculo de la fecha de entrega por días hábiles con calendario
 * de festivos (y `feriados-colombia.test.ts` testeaba ese calendario). Los dos quedaron borrados
 * junto con la feature: la fecha de entrega ahora se escribe en el modal. Lo que queda es esta
 * función, y lo que tiene que seguir guaranteeing es que "8" nunca se imprima como "4 a 5".
 */
import assert from 'node:assert/strict'

import { textoPlazoSemanas, sugerirFechaEntrega } from './contrato-fechas'

// Entero positivo → semanas hábiles.
assert.equal(textoPlazoSemanas(1), '1 semana hábil')
assert.equal(textoPlazoSemanas(2), '2 semanas hábiles')
assert.equal(textoPlazoSemanas(8), '8 semanas hábiles')
assert.equal(textoPlazoSemanas(52), '52 semanas hábiles')

// Sin número utilizable devuelve null, para que quien imprima elija su fallback en vez de
// inventar un plazo. El "4 a 5" que venía del default histórico es exactamente eso: una
// invención que después se negociaba.
for (const malo of [null, undefined, 0, -3, 4.5, NaN, '8' as unknown as number]) {
  assert.equal(textoPlazoSemanas(malo), null, `${String(malo)} no debe producir texto`)
}

// ── Fecha de entrega sugerida: cuenta lunes a viernes, sin depender de nada externo ──────
//
// t-175: 2026-10-02 es viernes. Una semana hábil son 5 días, así que 1 semana desde un viernes
// tiene que caer en el viernes siguiente: los dos fines de semana del medio no se cuentan, pero sí
// se saltan.
assert.equal(sugerirFechaEntrega('2026-10-02', 1), '2026-10-09')
assert.equal(sugerirFechaEntrega('2026-10-02', 2), '2026-10-16')
assert.equal(sugerirFechaEntrega('2026-10-02', 8), '2026-11-27')

// Desde un lunes, 1 semana es el lunes siguiente.
assert.equal(sugerirFechaEntrega('2026-10-05', 1), '2026-10-12')
// Firmado un fin de semana, el plazo arranca el lunes: los 5 días hábiles son lunes a viernes y
// la entrega cae el viernes 9. Es decir, firmar el viernes o el sábado da la misma fecha: una
// firma en fin de semana no "gasta" días hábiles, que es lo correcto para un plazo de días hábiles.
assert.equal(sugerirFechaEntrega('2026-10-03', 1), '2026-10-09')
assert.equal(sugerirFechaEntrega('2026-10-04', 1), '2026-10-09')

// Cruza el cambio de año: 2 semanas hábiles desde el 22 de diciembre de 2026.
assert.equal(sugerirFechaEntrega('2026-12-22', 2), '2027-01-05')

// La fecha NUNCA cae en sábado ni en domingo, que es el error más fácil de cometer al contar a
// mano y el más visible en un documento firmado.
for (let plazo = 1; plazo <= 60; plazo++) {
  const r = sugerirFechaEntrega('2026-09-30', plazo)
  assert.ok(r, `plazo ${plazo} tiene que producir fecha`)
  const dow = new Date(`${r}T00:00:00Z`).getUTCDay()
  assert.ok(dow !== 0 && dow !== 6, `plazo ${plazo} cayó en fin de semana: ${r}`)
}

// Sin fecha de firma o sin plazo entero no hay sugerencia: se devuelve null y el modal deja el
// campo vacío para que lo escriba la persona, en vez de inventar una fecha.
for (const malo of [null, undefined, '', '   ', '2026-13-01', '2026-02-31', '02/10/2026', '2026-10']) {
  assert.equal(sugerirFechaEntrega(malo, 8), null, `fecha '${String(malo)}' no debe producir fecha`)
}
for (const malo of [null, undefined, 0, -1, 2.5, NaN]) {
  assert.equal(sugerirFechaEntrega('2026-10-02', malo), null, `plazo '${String(malo)}' no debe producir fecha`)
}

// Un plazo enorme no debe dejar el cursor girando: la función corta y devuelve null.
assert.equal(sugerirFechaEntrega('2026-10-02', 1_000_000), null)

console.log('contrato-fechas.test.ts OK')
