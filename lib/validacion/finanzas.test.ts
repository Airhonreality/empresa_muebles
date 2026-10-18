// Test de los schemas Zod de finanzas (t-181). Sin DB ni React.
// Ejecutar: npx tsx lib/validacion/finanzas.test.ts
import assert from 'node:assert/strict'
import { validarEntrada } from './validar'
import { cuentaFinancieraCrearSchema, movimientoManualSchema } from './finanzas'

let pasadas = 0
function test(nombre: string, fn: () => void): void {
  fn()
  pasadas++
  console.log(`  ok - ${nombre}`)
}

function fallaCon(fn: () => void, fragmentoEsperado: string): void {
  assert.throws(fn, (err: unknown) => err instanceof Error && err.message.includes(fragmentoEsperado))
}

const base = {
  tipo: 'salida' as const,
  fecha: '2026-10-17',
  descripcion: 'Compra de herrajes',
  monto: '150000',
  cuentaId: 'cta-1',
}

test('movimientoManualSchema: acepta una salida mínima válida', () => {
  const r = validarEntrada(movimientoManualSchema, base)
  assert.equal(r.tipo, 'salida')
  assert.equal(r.monto, '150000')
})

test('movimientoManualSchema: acepta entrada con proyecto y sin proveedor', () => {
  const r = validarEntrada(movimientoManualSchema, {
    ...base,
    tipo: 'entrada',
    proveedorId: null,
    proyectoId: 'proj-1',
  })
  assert.equal(r.tipo, 'entrada')
  assert.equal(r.proyectoId, 'proj-1')
})

test('movimientoManualSchema: acepta salida con proveedor', () => {
  const r = validarEntrada(movimientoManualSchema, { ...base, proveedorId: 'prov-1' })
  assert.equal(r.proveedorId, 'prov-1')
})

test('movimientoManualSchema: rechaza proveedor en una entrada', () => {
  fallaCon(
    () => validarEntrada(movimientoManualSchema, { ...base, tipo: 'entrada', proveedorId: 'prov-1' }),
    'solo se puede asociar un proveedor a una salida',
  )
})

test('movimientoManualSchema: rechaza monto cero o negativo', () => {
  fallaCon(() => validarEntrada(movimientoManualSchema, { ...base, monto: '0' }), 'mayor que cero')
  fallaCon(() => validarEntrada(movimientoManualSchema, { ...base, monto: '-10' }), 'mayor que cero')
})

test('movimientoManualSchema: rechaza fecha con formato inválido', () => {
  fallaCon(() => validarEntrada(movimientoManualSchema, { ...base, fecha: '17/10/2026' }), 'AAAA-MM-DD')
})

test('cuentaFinancieraCrearSchema: acepta caja con saldo inicial', () => {
  const r = validarEntrada(cuentaFinancieraCrearSchema, {
    nombre: 'Caja principal', tipo: 'caja', saldoInicial: '0',
  })
  assert.equal(r.tipo, 'caja')
})

test('cuentaFinancieraCrearSchema: rechaza tipo desconocido y nombre vacío', () => {
  fallaCon(
    () => validarEntrada(cuentaFinancieraCrearSchema, { nombre: 'X', tipo: 'cripto' }),
    'Invalid option',
  )
  fallaCon(
    () => validarEntrada(cuentaFinancieraCrearSchema, { nombre: '   ', tipo: 'caja' }),
    'no puede estar vacío',
  )
})

console.log(`\n${pasadas} tests de finanzas OK`)
