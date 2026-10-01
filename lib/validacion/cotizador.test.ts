// Test de los schemas Zod del borde de escritura del cotizador (t-172, Lote 1 crítico del plan
// archivado plan_zod_validacion_runtime.md). Sin DB, sin React — patrón node:assert + tsx del
// repo. Ejecutar: npx tsx lib/validacion/cotizador.test.ts
import assert from 'node:assert/strict'
import { validarEntrada } from './validar'
import {
  itemCrearSchema, itemActualizarSchema, espacioCrearSchema, espacioActualizarSchema,
  jornadasSchema, parametrosFinancierosSchema, clienteCrearSchema, clienteActualizarSchema,
} from './cotizador'

let pasadas = 0
function test(nombre: string, fn: () => void): void {
  fn()
  pasadas++
  console.log(`  ok - ${nombre}`)
}

function fallaCon(fn: () => void, fragmentoEsperado: string): void {
  assert.throws(fn, (err: unknown) => err instanceof Error && err.message.includes(fragmentoEsperado))
}

test('itemCrearSchema: acepta un payload mínimo válido', () => {
  const r = validarEntrada(itemCrearSchema, { varianteId: 'esp-1', catalogoId: 'cat-1', cantidad: '3' })
  assert.equal(r.cantidad, '3')
  assert.equal(r.catalogoId, 'cat-1')
})

test('itemCrearSchema: catalogoId null es válido (ítem sin catálogo vinculado)', () => {
  const r = validarEntrada(itemCrearSchema, { varianteId: 'esp-1', catalogoId: null, cantidad: '1' })
  assert.equal(r.catalogoId, null)
})

test('itemCrearSchema: cantidad no-numérica se rechaza con mensaje claro', () => {
  fallaCon(() => validarEntrada(itemCrearSchema, { varianteId: 'esp-1', catalogoId: null, cantidad: 'abc' }), 'cantidad')
})

test('itemCrearSchema: cantidad negativa se rechaza', () => {
  fallaCon(() => validarEntrada(itemCrearSchema, { varianteId: 'esp-1', catalogoId: null, cantidad: '-5' }), 'cantidad')
})

test('itemCrearSchema: varianteId vacío se rechaza (requerido)', () => {
  fallaCon(() => validarEntrada(itemCrearSchema, { varianteId: '', catalogoId: null, cantidad: '1' }), 'varianteId')
})

test('itemCrearSchema: fuenteReferencial fuera del enum se rechaza', () => {
  fallaCon(() => validarEntrada(itemCrearSchema, { varianteId: 'esp-1', catalogoId: null, cantidad: '1', fuenteReferencial: 'inventado' }), 'fuenteReferencial')
})

test('itemActualizarSchema: patch parcial vacío es válido (no cambia nada)', () => {
  const r = validarEntrada(itemActualizarSchema, {})
  assert.deepEqual(r, {})
})

test('itemActualizarSchema: precioUnitario negativo se rechaza', () => {
  fallaCon(() => validarEntrada(itemActualizarSchema, { precioUnitario: '-1' }), 'precioUnitario')
})

test('espacioCrearSchema: nombreEspacio vacío (solo espacios) se rechaza', () => {
  fallaCon(() => validarEntrada(espacioCrearSchema, { proyectoId: 'proj-1', nombreEspacio: '   ' }), 'nombreEspacio')
})

test('espacioCrearSchema: payload mínimo válido pasa', () => {
  const r = validarEntrada(espacioCrearSchema, { proyectoId: 'proj-1', nombreEspacio: 'Cocina' })
  assert.equal(r.nombreEspacio, 'Cocina')
})

test('espacioActualizarSchema: jornadas inválidas en el patch de espacio se rechazan', () => {
  fallaCon(() => validarEntrada(espacioActualizarSchema, { nombreEspacio: 'X', activa: 'si' as unknown as boolean }), 'activa')
})

test('jornadasSchema: exige los tres campos (no es parcial)', () => {
  fallaCon(() => validarEntrada(jornadasSchema, { jornadasDesarrolloTecnico: '1', jornadasEnsamblajeTaller: '1' }), 'jornadasInstalacionObra')
})

test('jornadasSchema: los tres campos numéricos no-negativos pasan', () => {
  const r = validarEntrada(jornadasSchema, { jornadasDesarrolloTecnico: '2', jornadasEnsamblajeTaller: '1', jornadasInstalacionObra: '0' })
  assert.equal(r.jornadasInstalacionObra, '0')
})

test('parametrosFinancierosSchema: porcentajeIva no-numérico se rechaza ANTES del clamp del server', () => {
  fallaCon(() => validarEntrada(parametrosFinancierosSchema, { porcentajeIva: 'mucho' }), 'porcentajeIva')
})

test('parametrosFinancierosSchema: valores dentro de rango normal pasan (el clamp de 0-100 sigue siendo responsabilidad de la acción)', () => {
  const r = validarEntrada(parametrosFinancierosSchema, { porcentajeIva: '19', aplicaIva: true, garantiaAnios: 2 })
  assert.equal(r.porcentajeIva, '19')
  assert.equal(r.garantiaAnios, 2)
})

test('parametrosFinancierosSchema: patch vacío es válido', () => {
  assert.deepEqual(validarEntrada(parametrosFinancierosSchema, {}), {})
})

test('clienteCrearSchema: nombre vacío se rechaza', () => {
  fallaCon(() => validarEntrada(clienteCrearSchema, { nombre: '' }), 'nombre')
})

test('clienteCrearSchema: nombre válido con el resto de campos null pasa', () => {
  const r = validarEntrada(clienteCrearSchema, { nombre: 'Ana', documento: null, telefono: null, email: null, domicilio: null })
  assert.equal(r.nombre, 'Ana')
})

test('clienteActualizarSchema: patch de un solo campo es válido', () => {
  const r = validarEntrada(clienteActualizarSchema, { telefono: '3001234567' })
  assert.equal(r.telefono, '3001234567')
})

test('clienteActualizarSchema: nombre en blanco en el patch se rechaza (no se puede vaciar el nombre)', () => {
  fallaCon(() => validarEntrada(clienteActualizarSchema, { nombre: '   ' }), 'nombre')
})

test('validarEntrada: el mensaje de error incluye la ruta del campo que falló', () => {
  try {
    validarEntrada(itemCrearSchema, { varianteId: 'esp-1', catalogoId: null, cantidad: 'x' })
    assert.fail('debía lanzar')
  } catch (err) {
    assert.ok(err instanceof Error)
    assert.match(err.message, /^Entrada inválida: cantidad/)
  }
})

console.log(`\n${pasadas} pruebas pasadas`)
