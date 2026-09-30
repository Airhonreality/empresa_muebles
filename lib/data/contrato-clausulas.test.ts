/**
 * t-170: el ordinal de cada cláusula se calcula, no se escribe a mano. Estos tests fijan la
 * invariante que hace que eso sea seguro: con la penalidad apagada NO puede quedar un hueco en
 * la numeración (la falla tipográfica de "QUINTA y después SÉPTIMA" en un contrato firmado).
 */
import assert from 'node:assert/strict'

import { CLAUSULAS, ordinalesClausulas } from './contrato-clausulas'

const ORDINALES_ESPERADOS = [
  'PRIMERA',
  'SEGUNDA',
  'TERCERA',
  'CUARTA',
  'QUINTA',
  'SEXTA',
  'SÉPTIMA',
  'OCTAVO',
  'NOVENA',
  'DÉCIMA',
  'UNDÉCIMA',
]

/** Con la penalidad prendida el documento tiene las 11 cláusulas, en su orden original. */
{
  const o = ordinalesClausulas(true)

  for (const clave of CLAUSULAS) {
    assert.notEqual(o[clave], null, `${clave} debería estar presente con la penalidad prendida`)
  }
  assert.deepEqual(
    CLAUSULAS.map((c) => o[c]),
    ORDINALES_ESPERADOS,
    'con la penalidad prendida cada clave debe caer en su ordinal original'
  )
}

/** Apagada, la cláusula de penalidad no se imprime y no devuelve un ordinal para citarla. */
{
  const o = ordinalesClausulas(false)

  assert.equal(o.PENALIDAD, null, 'la cláusula de penalidad no debe tener ordinal cuando está apagada')

  for (const clave of CLAUSULAS) {
    if (clave === 'PENALIDAD') continue
    assert.notEqual(o[clave], null, `${clave} debería seguir presente aunque falte la penalidad`)
  }
}

/** La invariante: los ordinales impresos son 1..N, sin huecos y sin repetidos. */
for (const incluyePenalidad of [true, false]) {
  const o = ordinalesClausulas(incluyePenalidad)
  const impresos = CLAUSULAS.map((c) => o[c]).filter((x): x is string => x !== null)

  assert.deepEqual(
    impresos,
    ORDINALES_ESPERADOS.slice(0, impresos.length),
    'los ordinales deben ser la lista de palabras, corrida: nada de huecos ni repetidos'
  )
  assert.equal(
    new Set(impresos).size,
    impresos.length,
    'ningún ordinal puede repetirse: dos cláusulas con el mismo número invalidan las referencias cruzadas'
  )
  assert.equal(
    impresos.length,
    incluyePenalidad ? 11 : 10,
    'apagar una cláusula debe bajar el total en uno, no en dos'
  )
}

/**
 * La trampa de este módulo: con la penalidad apagada, GARANTIA pasa a ser el numeral SEXTA.
 * Si alguien "corrigiera" la clave para que no coincida con su ordinal, la referencia cruzada
 * del numeral de garantía quedaría apuntando a la cláusula equivocada en silencio.
 */
{
  const o = ordinalesClausulas(false)

  assert.equal(o.GARANTIA, 'SEXTA', 'apagada la penalidad, la garantía debe ocupar el numeral SEXTA')
  assert.equal(o.DESMONTE, 'SÉPTIMA')
  assert.equal(o.PAGOS, 'OCTAVO')
  assert.equal(o.CORRESPONSABILIDAD, 'NOVENA')
  assert.equal(o.MERITO, 'DÉCIMA')
  assert.equal(o.OBJETO, 'PRIMERA', 'lo que está antes de la penalidad no se mueve')
  assert.equal(o.PLAZOS, 'TERCERA')
}

console.log('contrato-clausulas.test.ts OK')
