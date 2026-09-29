/**
 * t-168: tests de los requisitos pendientes del modal de contrato.
 * Patrón del repo: `node:assert` + `npx tsx`, sin runner (ver AGENTS.md).
 *
 *   npx tsx lib/data/contrato-validacion.test.ts
 *
 * La red de seguridad acá no es "el mensaje está bien escrito" sino dos invariantes:
 *
 * 1. NINGUNA condición se relaja. La tabla `CASOS` reproduce una por una las 9 condiciones de
 *    `esValido` en `app/erp/cotizador/ContratoModal.tsx`. Si alguien afloja una para que el
 *    botón pase, esta tabla falla.
 * 2. Se devuelven TODOS los requisitos incumplidos, no solo el primero. El motivo de negocio
 *    es que el usuario no tenga que corregir de a uno en ida y vuelta.
 */

import assert from 'node:assert/strict'
import {
  requisitosPendientes,
  esContratoValido,
  type EntradaValidacionContrato,
  type CampoContrato,
} from './contrato-validacion'

// ── Base válida: si esto no pasa, las pruebas de "no relajar" no significan nada ────────

function entrada(over: Partial<EntradaValidacionContrato> = {}): EntradaValidacionContrato {
  return {
    tieneCliente: true,
    nombreCliente: 'Yuly Viviana Gómez Gaitán',
    valorTotal: '73078700',
    cantidadHitos: 4,
    todosPorcentaje: true,
    sumaHitos: 100,
    plazoSemanas: '8',
    alcanceSuministros: 'Suministra Veta Dorada:\n- Mobiliario a medida',
    anexoPropuestaIdentificacion: 'Propuesta «Cocina integral» — versión 1 — 4 páginas',
    ...over,
  }
}

function pendientes(over: Partial<EntradaValidacionContrato> = {}) {
  return requisitosPendientes(entrada(over))
}

// ── 1. La base válida pasa ────────────────────────────────────────────────────────────

{
  const e = entrada()
  assert.deepEqual(requisitosPendientes(e), [], 'una entrada completa no debe tener requisitos pendientes')
  assert.equal(esContratoValido(e), true, 'una entrada completa debe ser válida')
}

// ── 2. Cada condición por separado, contra la línea 402 del modal ─────────────────────

// Las 9 condiciones de esValido, una por caso. Cada una tiene que producir AL MENOS un
// requisito pendiente, y el campo que nombra es el que la condición controla.
const CASOS: { nombre: string; over: Partial<EntradaValidacionContrato>; campo: CampoContrato }[] = [
  { nombre: 'sin cliente vinculado', over: { tieneCliente: false }, campo: 'cliente' },
  { nombre: 'nombre del cliente vacío', over: { nombreCliente: '   ' }, campo: 'cliente' },
  { nombre: 'valor total 0', over: { valorTotal: '0' }, campo: 'valorTotal' },
  { nombre: 'valor total NaN', over: { valorTotal: 'abc' }, campo: 'valorTotal' },
  { nombre: 'sin hitos', over: { cantidadHitos: 0, sumaHitos: 0 }, campo: 'hitos' },
  { nombre: 'un solo hito', over: { cantidadHitos: 1, sumaHitos: 100 }, campo: 'hitos' },
  {
    nombre: 'hitos por porcentaje que no suman 100',
    over: { cantidadHitos: 2, sumaHitos: 85 },
    campo: 'hitos',
  },
  { nombre: 'plazo vacío', over: { plazoSemanas: '' }, campo: 'plazoSemanas' },
  { nombre: 'plazo no numérico', over: { plazoSemanas: 'ocho' }, campo: 'plazoSemanas' },
  { nombre: 'plazo 0', over: { plazoSemanas: '0' }, campo: 'plazoSemanas' },
  { nombre: 'plazo negativo', over: { plazoSemanas: '-3' }, campo: 'plazoSemanas' },
  { nombre: 'alcance vacío', over: { alcanceSuministros: '' }, campo: 'alcanceSuministros' },
  { nombre: 'alcance solo espacios', over: { alcanceSuministros: '   \n  ' }, campo: 'alcanceSuministros' },
  {
    nombre: 'anexo vacío',
    over: { anexoPropuestaIdentificacion: '' },
    campo: 'anexoPropuestaIdentificacion',
  },
]

for (const c of CASOS) {
  const e = entrada(c.over)
  const p = requisitosPendientes(e)
  assert.ok(p.length > 0, `${c.nombre}: debe producir al menos un requisito pendiente`)
  assert.ok(
    p.some((r) => r.campo === c.campo),
    `${c.nombre}: debe nombrar el campo '${c.campo}', obtener ${JSON.stringify(p.map((r) => r.campo))}`,
  )
  assert.equal(esContratoValido(e), false, `${c.nombre}: el contrato NO debe ser válido`)
  for (const r of p) {
    assert.ok(r.mensaje.trim().length > 0, `${c.nombre}: el requisito '${r.campo}' no puede tener mensaje vacío`)
  }
}

// ── 3. No relajar: casos que ANTES también fallaban y siguen fallando ──────────────────

{
  // hitos de monto fijo: la suma NO tiene que dar 100 (misma excepción de antes del t-166).
  const e = entrada({ todosPorcentaje: false, cantidadHitos: 2, sumaHitos: 0 })
  assert.equal(esContratoValido(e), true, 'con hitos de monto fijo la suma no se valida contra 100')
}
{
  const e = entrada({ cantidadHitos: 2, sumaHitos: 99.999 })
  assert.equal(esContratoValido(e), true, 'tolerancia de 0.01: 99.999 es 100 a efectos de la regla')
}
{
  const e = entrada({ cantidadHitos: 2, sumaHitos: 100.011 })
  assert.equal(esContratoValido(e), false, 'más allá de la tolerancia de 0.01, no es válido')
}
{
  // HALLAZGO PREEXISTENTE (t-168, no corregido acá a propósito): el plazo se parsea con
  // `parseInt`, que TRUNCA. O sea que "8.5" pasa la validación y el contrato queda con 8
  // semanas sin avisarle al usuario. El comentario del código dice "tiene que ser entero",
  // pero `parseInt` hace entero cualquier decimal antes de que el `isInteger` lo vea.
  // No se corrige en esta tarea porque endurecer la validación puede bloquear un contrato
  // que hoy sí se genera: es un cambio de comportamiento, no de retroalimentación. Registrado
  // en t-168 §hallazgos_colaterales para decidir aparte.
  const e = entrada({ plazoSemanas: '8.5' })
  assert.equal(esContratoValido(e), true, 'comportamiento actual: parseInt trunca 8.5 a 8 y pasa')
  assert.equal(parseInt('8.5', 10), 8, 'la causa es parseInt, no la regla de validación')
}

// ── 4. Devuelve TODOS los pendientes, no solo el primero ───────────────────────────────

{
  // Las 4 condiciones del bug reportado: cliente vacío, sin alcance, sin anexo y sin plazo.
  const e = entrada({ tieneCliente: false, alcanceSuministros: '', anexoPropuestaIdentificacion: '', plazoSemanas: '' })
  const p = requisitosPendientes(e)
  assert.equal(p.length, 4, `deben aparecer los 4 requisitos incumplidos, no solo el primero: ${JSON.stringify(p)}`)
  assert.deepEqual(
    p.map((r) => r.campo),
    ['cliente', 'plazoSemanas', 'alcanceSuministros', 'anexoPropuestaIdentificacion'],
    'deben venir todos, en el orden en que se revisa el formulario',
  )
}

{
  // Todo vacío a la vez: 6 campos marcados, cada uno con mensaje.
  const e = entrada({
    tieneCliente: false,
    valorTotal: '',
    cantidadHitos: 0,
    sumaHitos: 0,
    plazoSemanas: '',
    alcanceSuministros: '',
    anexoPropuestaIdentificacion: '',
  })
  const p = requisitosPendientes(e)
  assert.equal(p.length, 6, `los 6 campos que bloquean deben reportarse: ${JSON.stringify(p)}`)
  assert.equal(new Set(p.map((r) => r.campo)).size, 6, 'no debe repetir el mismo campo con dos textos')
}

// ── 5. El caso que causa el bloqueo permanente: cadena vacía, no null ───────────────────

{
  // Lo que llega de la base cuando el campo se guardó vacío con .trim() (core.ts:298-299).
  // Antes el default (?? PLANTILLA) no caía y el botón quedaba muerto para siempre.
  const p = pendientes({ alcanceSuministros: '', anexoPropuestaIdentificacion: '' })
  assert.equal(p.length, 2)
  assert.equal(esContratoValido(entrada({ alcanceSuministros: '' })), false)
}

// ── 6. 0 hitos no produce dos mensajes para el mismo problema ──────────────────────────

{
  const p = pendientes({ cantidadHitos: 0, sumaHitos: 0 })
  const deHitos = p.filter((r) => r.campo === 'hitos')
  assert.equal(deHitos.length, 1, `con 0 hitos hay un solo problema, no dos: ${JSON.stringify(deHitos)}`)
  assert.match(deHitos[0].mensaje, /hay 0/, 'el mensaje dice cuántos hitos hay')
}

console.log('contrato-validacion.test.ts — todo en verde')
