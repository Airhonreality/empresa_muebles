import assert from 'node:assert/strict'

import { CLAUSULAS, ordinalesClausulas } from './contrato-clausulas'

/** Las cuatro combinaciones de los dos switches: los ordinales no pueden tener huecos ni pisarse. */
const COMBINACIONES = [
  { penalidad: true, penalidadDefinitiva: true },
  { penalidad: true, penalidadDefinitiva: false },
  { penalidad: false, penalidadDefinitiva: true },
  { penalidad: false, penalidadDefinitiva: false },
] as const

for (const imprime of COMBINACIONES) {
  const o = ordinalesClausulas(imprime)
  const etiqueta = `penalidad=${imprime.penalidad} definitiva=${imprime.penalidadDefinitiva}`

  // Toda clave tiene ordinal, y toda clave apagada tiene `null` (no una palabra): una referencia
  // cruzada a una cláusula ausente tiene que desaparecer del texto, no quedar apuntando al aire.
  for (const clave of CLAUSULAS) {
    const v = o[clave]
    if (v === null) {
      assert.ok(
        (clave === 'PENALIDAD' && !imprime.penalidad)
          || (clave === 'PENALIDAD_DEFINITIVA' && !imprime.penalidadDefinitiva),
        `${clave} dio null sin estar apagada (${etiqueta})`,
      )
    } else {
      assert.equal(typeof v, 'string', `${clave} tiene que dar palabra o null (${etiqueta})`)
      assert.ok(v.length > 0, `${clave} dio ordinal vacío (${etiqueta})`)
    }
  }

  // Ningún ordinal repetido: un numeral repetido en un documento firmado se lee como error.
  const impresos = CLAUSULAS.map((c) => o[c]).filter((v): v is string => v !== null)
  assert.equal(
    new Set(impresos).size,
    impresos.length,
    `hay ordinales repetidos (${etiqueta}): ${impresos.join(', ')}`,
  )

  // Ningún hueco: la posición en el texto y el ordinal tienen que coincidir.
  impresos.forEach((palabra, i) => {
    assert.equal(
      palabra,
      ['PRIMERA', 'SEGUNDA', 'TERCERA', 'CUARTA', 'QUINTA', 'SEXTA', 'SÉPTIMA', 'OCTAVA',
        'NOVENA', 'DÉCIMA', 'UNDÉCIMA', 'DUODÉCIMA'][i],
      `posición ${i + 1} no coincide con el ordinal (${etiqueta})`,
    )
  })
}

// t-176: los dos switches son independientes. Este es el punto de la cláusula aparte: apagar la
// penalidad del 5 % NO puede borrar la del 10 %, porque esa es la que permite cobrarle al
// Contratante que no paga el anticipo.
const ambas = ordinalesClausulas({ penalidad: true, penalidadDefinitiva: true })
assert.equal(ambas.PENALIDAD, 'SEXTA')
assert.equal(ambas.PENALIDAD_DEFINITIVA, 'SÉPTIMA')
assert.equal(ambas.GARANTIA, 'OCTAVA')

const sinCinco = ordinalesClausulas({ penalidad: false, penalidadDefinitiva: true })
assert.equal(sinCinco.PENALIDAD, null)
assert.equal(sinCinco.PENALIDAD_DEFINITIVA, 'SEXTA')
assert.equal(sinCinco.GARANTIA, 'SÉPTIMA')

const sinDiez = ordinalesClausulas({ penalidad: true, penalidadDefinitiva: false })
assert.equal(sinDiez.PENALIDAD, 'SEXTA')
assert.equal(sinDiez.PENALIDAD_DEFINITIVA, null)
assert.equal(sinDiez.GARANTIA, 'SÉPTIMA')

const sinNinguna = ordinalesClausulas({ penalidad: false, penalidadDefinitiva: false })
assert.equal(sinNinguna.PENALIDAD, null)
assert.equal(sinNinguna.PENALIDAD_DEFINITIVA, null)
assert.equal(sinNinguna.GARANTIA, 'SEXTA')

console.log('contrato-clausulas.test.ts OK')
