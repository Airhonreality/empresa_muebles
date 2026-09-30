/**
 * t-173: el plazo pactado se imprime desde el número, nunca desde un texto libre.
 *
 * Antes este archivo testeaba el cálculo de la fecha de entrega por días hábiles con calendario
 * de festivos (y `feriados-colombia.test.ts` testeaba ese calendario). Los dos quedaron borrados
 * junto con la feature: la fecha de entrega ahora se escribe en el modal. Lo que queda es esta
 * función, y lo que tiene que seguir guaranteeing es que "8" nunca se imprima como "4 a 5".
 */
import assert from 'node:assert/strict'

import { textoPlazoSemanas } from './contrato-fechas'

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

console.log('contrato-fechas.test.ts OK')
