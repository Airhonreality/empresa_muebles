/**
 * t-168: tests de los requisitos pendientes del modal de contrato.
 * Patrón del repo: `node:assert` + `npx tsx`, sin runner (ver AGENTS.md).
 *
 *   npx tsx lib/data/contrato-validacion.test.ts
 *
 * La red de seguridad acá no es "el mensaje está bien escrito" sino dos invariantes:
 *
 * 1. NINGUNA condición se relaja. La tabla `CASOS` reproduce una por una las condiciones de
 *    `esValido` en `app/erp/cotizador/ContratoModal.tsx`. Si alguien afloja una para que el
 *    botón pase, esta tabla falla. (t-169: `tieneCliente` dejó de ser condición propia; el
 *    requisito es que el nombre del contratante no esté vacío. El alcance de suministros
 *    "Suministra Veta / Suministra el Contratante" también dejó de ser requisito: salía vacío
 *    y ya no se imprime — el alcance es la lista de ítems del numeral PRIMERO.)
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
    fechaEntregaMaxima: '2026-11-20',
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

// Las condiciones de esValido, una por caso. Cada una tiene que producir AL MENOS un
// requisito pendiente, y el campo que nombra es el que la condición controla.
// t-169: `tieneCliente` ya NO es una condición por sí sola — el requisito es que el nombre del
// contratante no esté vacío (un nombre escrito a mano se crea y se vincula al guardar). El caso
// "sin cliente vinculado" pasó a ser "sin cliente vinculado Y sin nombre", que es el deadlock
// real que había.
const CASOS: { nombre: string; over: Partial<EntradaValidacionContrato>; campo: CampoContrato }[] = [
  { nombre: 'sin cliente vinculado ni nombre escrito', over: { tieneCliente: false, nombreCliente: '   ' }, campo: 'cliente' },
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
  // t-173: la fecha de entrega es requisito. Sin ella el contrato sale sin fecha, y sin fecha
  // no hay contra qué aplicar la retención del 5 %.
  { nombre: 'fecha de entrega vacía', over: { fechaEntregaMaxima: '' }, campo: 'fechaEntregaMaxima' },
  { nombre: 'fecha de entrega con texto', over: { fechaEntregaMaxima: 'en dos semanas' }, campo: 'fechaEntregaMaxima' },
  { nombre: 'fecha de entrega incompleta', over: { fechaEntregaMaxima: '2026-11' }, campo: 'fechaEntregaMaxima' },
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
  // Las 3 condiciones del bug reportado: cliente sin nombre, sin anexo y sin plazo.
  // t-169: el caso del cliente se dispara con el NOMBRE vacío, que es lo que hoy exige la regla
  // (un cliente no vinculado pero con nombre escrito ya es válido: se crea al guardar).
  const e = entrada({ nombreCliente: '   ', anexoPropuestaIdentificacion: '', plazoSemanas: '' })
  const p = requisitosPendientes(e)
  assert.equal(p.length, 3, `deben aparecer los 3 requisitos incumplidos, no solo el primero: ${JSON.stringify(p)}`)
  assert.deepEqual(
    p.map((r) => r.campo),
    ['cliente', 'plazoSemanas', 'anexoPropuestaIdentificacion'],
    'deben venir todos, en el orden en que se revisa el formulario',
  )
}

{
  // Todo vacío a la vez: 5 campos marcados, cada uno con mensaje.
  // t-169: `nombreCliente: '   '` (y no `tieneCliente: false`) dispara el requisito de cliente,
  // porque la regla actual exige el NOMBRE, no el vínculo previo del proyecto.
  const e = entrada({
    tieneCliente: false,
    nombreCliente: '   ',
    valorTotal: '',
    cantidadHitos: 0,
    sumaHitos: 0,
    plazoSemanas: '',
    anexoPropuestaIdentificacion: '',
  })
  const p = requisitosPendientes(e)
  assert.equal(p.length, 5, `los 5 campos que bloquean deben reportarse: ${JSON.stringify(p)}`)
  assert.equal(new Set(p.map((r) => r.campo)).size, 5, 'no debe repetir el mismo campo con dos textos')
}

// ── 5. El caso que causa el bloqueo permanente: cadena vacía, no null ───────────────────

{
  // Lo que llega de la base cuando el campo se guardó vacío con .trim() (core.ts:298-299).
  // Antes el default (?? PLANTILLA) no caía y el botón quedaba muerto para siempre.
  const p = pendientes({ anexoPropuestaIdentificacion: '' })
  assert.equal(p.length, 1)
  assert.equal(esContratoValido(entrada({ anexoPropuestaIdentificacion: '' })), false)
}

// ── 6. 0 hitos no produce dos mensajes para el mismo problema ──────────────────────────

{
  const p = pendientes({ cantidadHitos: 0, sumaHitos: 0 })
  const deHitos = p.filter((r) => r.campo === 'hitos')
  assert.equal(deHitos.length, 1, `con 0 hitos hay un solo problema, no dos: ${JSON.stringify(deHitos)}`)
  assert.match(deHitos[0].mensaje, /hay 0/, 'el mensaje dice cuántos hitos hay')
}

// ── 7. t-169: un proyecto SIN cliente vinculado no es un callejón sin salida ──────────
//
// El bug reportado: el modal exigía `tieneCliente` (= el proyecto ya traía cliente) y solo
// sabía EDITAR un cliente existente. Con un proyecto sin `clienteId` los campos del
// contratante eran inertes y el botón quedaba deshabilitado para siempre: era imposible
// generar el contrato desde esa pantalla. La validación tiene que admitir el nombre escrito
// a mano, porque ese cliente se crea y se vincula al guardar.

{
  // El nombre escrito a mano DESBLOQUEA: es lo que se crea al guardar.
  assert.equal(
    esContratoValido(entrada({ tieneCliente: false })),
    true,
    'un nombre de cliente escrito a mano debe habilitar el guardado (se crea al guardar)',
  )

  // Pero sin cliente vinculado Y sin nombre, el requisito sigue existiendo.
  const p = pendientes({ tieneCliente: false, nombreCliente: '   ' })
  assert.ok(
    p.some((r) => r.campo === 'cliente'),
    `sin cliente vinculado ni nombre debe reclamar el cliente: ${JSON.stringify(p)}`,
  )

  // El mensaje tiene que decir qué hacer, no solo qué falta.
  const msg = p.find((r) => r.campo === 'cliente')!.mensaje
  assert.match(msg, /crear|vincular/i, `el mensaje dice la acción posible: ${msg}`)
}

console.log('contrato-validacion.test.ts — todo en verde')
