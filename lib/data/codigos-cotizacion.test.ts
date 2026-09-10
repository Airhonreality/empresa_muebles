// Test de los helpers puros de código amigable de cotización (t-150).
// Sin React renderer ni DB — patrón node:assert + tsx del repo.
// Ejecutar: npx tsx lib/data/codigos-cotizacion.test.ts
import assert from 'node:assert/strict'
import {
  formatearFechaDiaria, prefijoCodigoFecha, generarCodigoCotizacion,
  secuenciaDesdeCodigo, esCodigoCotizacionValido,
} from './codigos-cotizacion'

let pasadas = 0
async function test(nombre: string, fn: () => void | Promise<void>): Promise<void> {
  await fn()
  pasadas++
  console.log(`  ok - ${nombre}`)
}

;(async () => {
  await test('formatearFechaDiaria: pad de mes/día a dos dígitos', () => {
    assert.equal(formatearFechaDiaria(new Date(2026, 8, 10)), '2026-09-10')
    assert.equal(formatearFechaDiaria(new Date(2026, 0, 5)), '2026-01-05')
  })

  await test('prefijoCodigoFecha: COT-fecha sin secuencia', () => {
    assert.equal(prefijoCodigoFecha(new Date(2026, 8, 10)), 'COT-2026-09-10')
  })

  await test('generarCodigoCotizacion: secuencia con padding de mínimo tres dígitos', () => {
    assert.equal(generarCodigoCotizacion(new Date(2026, 8, 10), 1), 'COT-2026-09-10-001')
    assert.equal(generarCodigoCotizacion(new Date(2026, 8, 10), 42), 'COT-2026-09-10-042')
  })

  await test('generarCodigoCotizacion: secuencia >= 100 no se trunca (regresión lpad)', () => {
    assert.equal(generarCodigoCotizacion(new Date(2026, 8, 10), 112), 'COT-2026-09-10-112')
    assert.equal(generarCodigoCotizacion(new Date(2026, 8, 10), 137), 'COT-2026-09-10-137')
    assert.equal(generarCodigoCotizacion(new Date(2026, 8, 10), 1000), 'COT-2026-09-10-1000')
  })

  await test('generarCodigoCotizacion: secuencia 0 o negativa sube a 1', () => {
    assert.equal(generarCodigoCotizacion(new Date(2026, 8, 10), 0), 'COT-2026-09-10-001')
    assert.equal(generarCodigoCotizacion(new Date(2026, 8, 10), -3), 'COT-2026-09-10-001')
  })

  await test('secuenciaDesdeCodigo: extrae el número', () => {
    assert.equal(secuenciaDesdeCodigo('COT-2026-09-10-007'), 7)
    assert.equal(secuenciaDesdeCodigo('COT-2026-09-10-137'), 137)
  })

  await test('secuenciaDesdeCodigo: null para formatos inválidos', () => {
    assert.equal(secuenciaDesdeCodigo('COT-2026-9-10-07'), null)
    assert.equal(secuenciaDesdeCodigo('CTR-2026-09-10-07'), null)
    assert.equal(secuenciaDesdeCodigo(''), null)
  })

  await test('esCodigoCotizacionValido: valida el formato exacto', () => {
    assert.ok(esCodigoCotizacionValido('COT-2026-09-10-001'))
    assert.ok(esCodigoCotizacionValido('COT-2026-09-10-01'))
    assert.ok(!esCodigoCotizacionValido('COT-2026-09-10-1'))
    assert.ok(!esCodigoCotizacionValido('cot-2026-09-10-01'))
    assert.ok(!esCodigoCotizacionValido('COT-2026-99-10-01'))
  })

  console.log(`\n${pasadas} pruebas pasadas`)
})().catch((err) => {
  console.error(err)
  process.exitCode = 1
})