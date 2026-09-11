// Test de los helpers puros del optimistic merge/rollback del cotizador (DEC-5, A6).
// Sin React renderer ni DB — patrón node:assert + tsx del repo.
// Ejecutar: npx tsx lib/data/queries/optimistic.test.ts
import assert from 'node:assert/strict'
import type { CotizadorSnapshot } from './types'
import {
  agregarArtefacto, agregarEspacio, agregarItem, actualizarArtefacto, actualizarEspacio,
  actualizarItem, actualizarProyecto, calcularTotalLinea, construirArtefactoOptimista,
  construirItemOptimista, eliminarEspacio, eliminarItem,
  marcarEspacioActiva, upsertEspacio, upsertItem, fusionarPendientes,
} from './optimistic'
import type { ItemVariante, EspacioVariante } from '../contracts'

let pasadas = 0
async function test(nombre: string, fn: () => void | Promise<void>): Promise<void> {
  await fn()
  pasadas++
  console.log(`  ok - ${nombre}`)
}

function baseSnapshot(overrides = {}): CotizadorSnapshot {
  return {
    proyecto: null,
    clientes: [],
    parametros: [],
    espacios: [],
    items: [],
    artefactos: [],
    catalogo: [],
    catalogoAcabados: [],
    contrato: null,
    hitos: [],
    gruposItem: [],
    ...overrides,
  }
}

function item(id: string, overrides: Partial<ItemVariante> = {}): ItemVariante {
  return {
    id,
    varianteId: 'esp-1',
    catalogoId: null,
    nombrePersonalizado: null,
    cantidad: '1',
    precioUnitario: '1000',
    totalLinea: '1000',
    anulado: false,
    esReferencial: false,
    fuenteReferencial: null,
    grupoReferencial: null,
    comentario: null,
    grupoItemId: null,
    createdAt: '2026-09-05T00:00:00Z',
    updatedAt: '2026-09-05T00:00:00Z',
    ...overrides,
  }
}

function espacio(id: string, overrides: Partial<EspacioVariante> = {}): EspacioVariante {
  return {
    id,
    proyectoId: 'proj-1',
    nombreEspacio: 'Cocina',
    nombreVariante: 'Inicial',
    tipoEspacio: null,
    descripcion: null,
    activa: true,
    visibleEnPropuestaPublica: true,
    orden: 0,
    jornadasDesarrolloTecnico: '0',
    jornadasEnsamblajeTaller: '0',
    jornadasInstalacionObra: '0',
    colores: [],
    fotosEspacio: [],
    fotosDisenio: [],
    fotosReferencia: [],
    ...overrides,
  }
}

;(async () => {
  await test('calcularTotalLinea: cantidad x precio y casos numéricos no-financieros', () => {
    assert.equal(calcularTotalLinea('3', '150000'), '450000')
    assert.equal(calcularTotalLinea('0', '150000'), '0')
    assert.equal(calcularTotalLinea('a', '150000'), '0', 'NaN -> 0, no NaN')
  })

  await test('construirItemOptimista: idi completo con totalLinea derivado y anulado=false', () => {
    const i = construirItemOptimista({ id: 'it-uuid', varianteId: 'esp-1', catalogoId: 'cat-9', cantidad: '2', precioUnitario: '75000' })
    assert.equal(i.id, 'it-uuid')
    assert.equal(i.totalLinea, '150000')
    assert.equal(i.anulado, false)
    assert.equal(i.esReferencial, false)
    assert.ok(i.createdAt && i.updatedAt, 'timestamps presentes')
  })

  await test('agregarItem: appende al snapshot', () => {
    const snap = agregarItem(baseSnapshot(), item('it-1'))
    assert.equal(snap.items.length, 1)
    assert.equal(snap.items[0].id, 'it-1')
  })

  await test('agregarItem: mismo id no duplica (idempotente)', () => {
    let snap = agregarItem(baseSnapshot(), item('it-1'))
    snap = agregarItem(snap, item('it-1'))
    assert.equal(snap.items.length, 1)
  })

  await test('actualizarItem: cantidad re-deriva totalLinea (T3 — edición en vuelo 5/5)', () => {
    const snap = actualizarItem(baseSnapshot({ items: [item('it-1', { cantidad: '1', totalLinea: '1000' })] }), 'it-1', { cantidad: '5' })
    assert.equal(snap.items[0].cantidad, '5')
    assert.equal(snap.items[0].totalLinea, '5000', 'totalLinea se re-deriva de la cantidad nueva')
  })

  await test('actualizarItem: patch sin cantidad/precio NO toca totalLinea', () => {
    const snap = actualizarItem(baseSnapshot({ items: [item('it-1', { cantidad: '2', totalLinea: '2000' })] }), 'it-1', { nombrePersonalizado: 'X' })
    assert.equal(snap.items[0].totalLinea, '2000')
  })

  await test('eliminarItem: soft-delete (anulado=true), la fila queda en el snapshot', () => {
    const snap = eliminarItem(baseSnapshot({ items: [item('it-1'), item('it-2')] }), 'it-1')
    assert.equal(snap.items[0].anulado, true, 'mismo comportamiento que mock items.eliminar')
    assert.equal(snap.items[1].anulado, false)
    assert.equal(snap.items.length, 2, 'soft-delete: la fila permanece en el snapshot')
  })

  await test('upsertItem: reemplaza por id (reconciliación onSuccess)', () => {
    const snap = upsertItem(baseSnapshot({ items: [item('it-1', { cantidad: '1' })] }), item('it-1', { cantidad: '9', totalLinea: '9000' }))
    assert.equal(snap.items.length, 1)
    assert.equal(snap.items[0].cantidad, '9')
  })

  await test('agregarEspacio: orden autogenerado = cantidad previa del proyecto', () => {
    let snap = agregarEspacio(baseSnapshot(), { id: 'esp-1', proyectoId: 'proj-1', nombreEspacio: 'Cocina' })
    assert.equal(snap.espacios[0].orden, 0)
    snap = agregarEspacio(snap, { id: 'esp-2', proyectoId: 'proj-1', nombreEspacio: 'Closet' })
    assert.equal(snap.espacios[1].orden, 1)
  })

  await test('agregarEspacio: mismo id no duplica (idempotente)', () => {
    let snap = agregarEspacio(baseSnapshot(), { id: 'esp-1', proyectoId: 'proj-1', nombreEspacio: 'Cocina' })
    snap = agregarEspacio(snap, { id: 'esp-1', proyectoId: 'proj-1', nombreEspacio: 'Cocina' })
    assert.equal(snap.espacios.length, 1)
  })

  await test('actualizarEspacio: renombrar refleja el nombre nuevo (regresión del síntoma reportado)', () => {
    const snap = actualizarEspacio(baseSnapshot({ espacios: [espacio('esp-1', { nombreEspacio: 'Viejo' })] }), 'esp-1', { nombreEspacio: 'Nuevo' })
    assert.equal(snap.espacios[0].nombreEspacio, 'Nuevo')
  })

  await test('marcarEspacioActiva: activa el objetivo (aplica al menos el objetivo)', () => {
    const snap = marcarEspacioActiva(baseSnapshot({ espacios: [espacio('esp-1'), espacio('esp-2', { activa: false })] }), 'esp-2')
    assert.equal(snap.espacios[1].activa, true)
  })

  await test('eliminarEspacio: cascada — remueve el espacio y sus items', () => {
    const snap = eliminarEspacio(
      baseSnapshot({
        espacios: [espacio('esp-1'), espacio('esp-2')],
        items: [item('it-1', { varianteId: 'esp-1' }), item('it-2', { varianteId: 'esp-2' })],
      }),
      'esp-1',
    )
    assert.equal(snap.espacios.length, 1)
    assert.equal(snap.items.length, 1)
    assert.equal(snap.items[0].varianteId, 'esp-2')
  })

  await test('upsertEspacio: reemplaza por id (reconciliación onSuccess)', () => {
    const snap = upsertEspacio(baseSnapshot({ espacios: [espacio('esp-1')] }), espacio('esp-1', { nombreEspacio: 'Renombrado' }))
    assert.equal(snap.espacios[0].nombreEspacio, 'Renombrado')
  })

  await test('actualizarProyecto: patch de parámetros financieros sobre el proyecto del snapshot', () => {
    const snap = actualizarProyecto(
      baseSnapshot({ proyecto: { id: 'proj-1', nombreProyecto: 'P', clienteId: null, tipoProyecto: 'personalizado', direccionObra: null, descripcionSemantica: null, costosOperativos: '0', imprevistosInstalacion: '0', descuentoComercial: '0', ajusteArbitrario: '0', aplicaIva: false, porcentajeIva: '19', garantiaAnios: 2, diasEntregaEstimados: null, estado: 'activa', createdAt: '2026-01-01', updatedAt: '2026-01-01' } }),
      'proj-1',
      { aplicaIva: true, garantiaAnios: 5 },
    )
    assert.equal(snap.proyecto?.aplicaIva, true)
    assert.equal(snap.proyecto?.garantiaAnios, 5)
  })

  await test('artefactos: agregar/actualizar round-trip optimista', () => {
    const creado = construirArtefactoOptimista({ id: 'art-1', espacioVarianteId: 'esp-1', categoria: 'electrodomestico', tipoSpecifique: 'Horno' })
    let snap = agregarArtefacto(baseSnapshot(), creado)
    assert.equal(snap.artefactos.length, 1)
    snap = actualizarArtefacto(snap, 'art-1', { ubicacion: 'Bajo mesón' })
    assert.equal(snap.artefactos[0].ubicacion, 'Bajo mesón')
  })

  await test('fusionarPendientes: fila optimista ausente del servidor se conserva', () => {
    const snap = fusionarPendientes(baseSnapshot({ items: [item('it-servidor')] }), [item('it-pendiente')])
    assert.equal(snap.items.length, 2)
    assert.ok(snap.items.some((i) => i.id === 'it-pendiente'))
  })

  await test('fusionarPendientes: si el servidor ya trae la fila, gana el servidor (no duplica)', () => {
    const snap = fusionarPendientes(baseSnapshot({ items: [item('it-1', { cantidad: '9' })] }), [item('it-1', { cantidad: '1' })])
    assert.equal(snap.items.length, 1)
    assert.equal(snap.items[0].cantidad, '9', 'la versión del servidor gana sobre la pendiente')
  })

  await test('fusionarPendientes: sin pendientes, devuelve el mismo snapshot (no-op)', () => {
    const base = baseSnapshot({ items: [item('it-1')] })
    const snap = fusionarPendientes(base, [])
    assert.equal(snap, base, 'debe ser el mismo objeto, no una copia')
  })

  console.log(`\n${pasadas} pruebas pasadas`)
})().catch((err) => {
  console.error(err)
  process.exit(1)
})