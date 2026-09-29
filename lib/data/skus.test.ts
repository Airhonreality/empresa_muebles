// Test de los helpers puros de SKU autogenerado del catálogo (t-165).
// Sin React renderer ni DB — patrón node:assert + tsx del repo.
// Ejecutar: npx tsx lib/data/skus.test.ts
import assert from 'node:assert/strict'
import {
  normalizarTokens, abreviarDescripcion, formatearFechaSku, generarSkuBase, generarSkuUnico, esSkuAutogenerado,
} from './skus'

let pasadas = 0
async function test(nombre: string, fn: () => void | Promise<void>): Promise<void> {
  await fn()
  pasadas++
  console.log(`  ok - ${nombre}`)
}

;(async () => {
  await test('normalizarTokens: tildes, ñ, mayúsculas y separadores', () => {
    assert.deepEqual(normalizarTokens('Mueble TV flotante Nogal 1.80m'), ['mueble', 'tv', 'flotante', 'nogal', '1', '80m'])
    assert.deepEqual(normalizarTokens('Bisagra Blum estándar'), ['bisagra', 'blum', 'estandar'])
    assert.deepEqual(normalizarTokens('  Corredera… Full  Extension  '), ['corredera', 'full', 'extension'])
    assert.deepEqual(normalizarTokens('Tablero Niños 18x200'), ['tablero', 'ninos', '18x200'])
  })

  await test('abreviarDescripcion: 3 tokens de hasta 3 letras, sin stopwords', () => {
    assert.equal(abreviarDescripcion('Tablero Roble 18mm'), 'TAB-ROB-18M')
    assert.equal(abreviarDescripcion('Mueble TV flotante Nogal 1.80m'), 'MUE-TV-FLO')
    assert.equal(abreviarDescripcion('Bisagra Blum estándar'), 'BIS-BLU-EST')
    assert.equal(abreviarDescripcion('Corredera Full Extension 45cm'), 'COR-FUL-EXT')
    assert.equal(abreviarDescripcion('Tablero de Roble 18mm'), 'TAB-ROB-18M', 'stopwords de/la se omiten')
    assert.equal(abreviarDescripcion('Mueble TV'), 'MUE-TV', 'token corto pasa completo')
    assert.equal(abreviarDescripcion(''), 'PRD', 'descripción vacía -> fallback de 3 letras')
    // El fallback tiene que cumplir el patrón que declara el propio módulo: con 4 letras
    // ("PROD") el SKU resultante no pasaba esSkuAutogenerado.
    assert.equal(
      esSkuAutogenerado(generarSkuUnico('', new Date(Date.UTC(2026, 8, 23)), [])),
      true,
      'el SKU del fallback debe ser válido según esSkuAutogenerado'
    )
    assert.equal(
      esSkuAutogenerado(generarSkuUnico('de la', new Date(Date.UTC(2026, 8, 23)), [])),
      true,
      'descripción con solo stopwords -> mismo fallback, SKU válido'
    )
  })

  await test('formatearFechaSku: YYMMDD en UTC', () => {
    assert.equal(formatearFechaSku(new Date(Date.UTC(2026, 8, 23))), '260923')
    assert.equal(formatearFechaSku(new Date(Date.UTC(2000, 0, 5))), '000105')
    assert.equal(formatearFechaSku(new Date(Date.UTC(2031, 11, 31))), '311231')
  })

  await test('generarSkuBase: abreviatura + fecha', () => {
    assert.equal(generarSkuBase('Tablero Roble 18mm', new Date(Date.UTC(2026, 8, 23))), 'TAB-ROB-18M-260923')
  })

  await test('generarSkuUnico: base si está libre, sufijo -N ante colisión', () => {
    const f = new Date(Date.UTC(2026, 8, 23))
    assert.equal(generarSkuUnico('Tablero roble', f, ['X-1', 'TAB-ROB-260923']), 'TAB-ROB-260923-2')
    assert.equal(generarSkuUnico('Tablero roble', f, ['TAB-ROB-260923', 'TAB-ROB-260923-2', 'TAB-ROB-260923-3']), 'TAB-ROB-260923-4')
    assert.equal(generarSkuUnico('Nogal 18mm', f, ['TAB-ROB-260923']), 'NOG-18M-260923', 'sin colisión -> base')
    assert.equal(generarSkuUnico('Tablero roble', f, []), 'TAB-ROB-260923')
  })

  await test('esSkuAutogenerado: formato exacto', () => {
    assert.ok(esSkuAutogenerado('TAB-ROB-260923'))
    assert.ok(esSkuAutogenerado('TAB-ROB-18M-260923'))
    assert.ok(esSkuAutogenerado('TAB-ROB-260923-2'))
    assert.ok(!esSkuAutogenerado('AUTO-000045'), 'secuencial legacy no es el formato nuevo')
    assert.ok(!esSkuAutogenerado('tab-rob-260923'), 'minúsculas no valen')
    assert.ok(!esSkuAutogenerado('TAB-ROB-269'), 'fecha corta no vale')
    assert.ok(!esSkuAutogenerado(''), 'vacío no vale')
  })

  console.log(`\n${pasadas} pruebas pasadas`)
})().catch((err) => {
  console.error(err)
  process.exitCode = 1
})