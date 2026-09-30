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
  actualizarCliente, upsertCliente, actualizarContrato, upsertContrato,
  revertirItem, revertirEspacio, revertirArtefacto, revertirProyecto, revertirCliente, revertirContrato,
} from './optimistic'
import type { ItemVariante, EspacioVariante, Cliente, Contrato } from '../contracts'

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
    fotoUrl: null,
    marca: null,
    referencia: null,
    color: null,
    dimensiones: null,
    acabado: null,
    espesor: null,
    camposPersonalizados: [],
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
    const creado = construirArtefactoOptimista({
      id: 'art-1', espacioVarianteId: 'esp-1', categoria: 'electrodomestico', tipoSpecifique: 'Horno',
      descripcion: 'Horno de empotrar 60cm', fotoUrls: ['https://r2.dev/a.jpg', 'https://r2.dev/b.jpg'],
      archivosUrls: ['https://r2.dev/ficha.pdf'],
    })
    let snap = agregarArtefacto(baseSnapshot(), creado)
    assert.equal(snap.artefactos.length, 1)
    assert.deepEqual(snap.artefactos[0].fotoUrls, ['https://r2.dev/a.jpg', 'https://r2.dev/b.jpg'])
    assert.deepEqual(snap.artefactos[0].archivosUrls, ['https://r2.dev/ficha.pdf'])
    assert.equal(snap.artefactos[0].descripcion, 'Horno de empotrar 60cm')
    snap = actualizarArtefacto(snap, 'art-1', { ubicacion: 'Bajo mesón', fotoUrls: ['https://r2.dev/c.jpg'] })
    assert.equal(snap.artefactos[0].ubicacion, 'Bajo mesón')
    assert.deepEqual(snap.artefactos[0].fotoUrls, ['https://r2.dev/c.jpg'])
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

  // --- t-166: cliente y contrato ---

  function cliente(id: string, over: Partial<Cliente> = {}): Cliente {
    return { id, nombre: 'Ana', documento: null, telefono: null, email: null, domicilio: null, ...over } as Cliente
  }

  function contrato(id: string, over: Partial<Contrato> = {}): Contrato {
    return {
      id, proyectoId: 'p1', codigoContrato: 'CTR-1', fechaContrato: '2026-09-29',
      valorTotal: '1000', estado: 'borrador', garantiaAnios: 2,
      plazoSemanas: 7, plazoEjecucionTexto: '7 semanas hábiles',
      fechaEntregaMaxima: '2026-11-20', holguraDias: 8, objetoItems: null, alcanceSuministros: null,
      anexoPropuestaIdentificacion: null, aplicaClausulaPenalidad: true,
      aplicaPenalidadDefinitiva: true, especificacionesEstructura: null,
      especificacionesHerrajes: null, especificacionesMesones: null, especificacionesDesmonte: null,
      contratanteDomicilio: null, emailAsunto: null, emailCuerpo: null,
      createdAt: '2026-09-01', updatedAt: '2026-09-01', ...over,
    }
  }

  await test('t-166 actualizarCliente: parchea solo el cliente indicado', () => {
    const snap = actualizarCliente(baseSnapshot({ clientes: [cliente('c1'), cliente('c2', { nombre: 'Luis' })] }), 'c1', { telefono: '300' })
    assert.equal(snap.clientes[0].telefono, '300')
    assert.equal(snap.clientes[0].nombre, 'Ana', 'no pisa los campos no enviados')
    assert.equal(snap.clientes[1].telefono, null, 'no toca el resto de la lista')
  })

  await test('t-166 actualizarCliente: id inexistente no-op (no inventa filas)', () => {
    const base = baseSnapshot({ clientes: [cliente('c1')] })
    assert.equal(actualizarCliente(base, 'no-existe', { telefono: '300' }), base)
  })

  await test('t-166 upsertCliente: inserta si no está y reemplaza si está', () => {
    const conUno = upsertCliente(baseSnapshot(), cliente('c1'))
    assert.equal(conUno.clientes.length, 1)
    const conDos = upsertCliente(conUno, cliente('c2'))
    assert.equal(conDos.clientes.length, 2)
    const reemplazado = upsertCliente(conDos, cliente('c1', { nombre: 'Ana María' }))
    assert.equal(reemplazado.clientes.length, 2, 'no duplica')
    assert.equal(reemplazado.clientes[0].nombre, 'Ana María')
  })

  await test('t-166 actualizarContrato: parchea encabezado y regenera hitos en base 1', () => {
    const base = baseSnapshot({ contrato: contrato('ctr-1') })
    const snap = actualizarContrato(base, 'ctr-1', { valorTotal: '2500' }, [
      { tipo: 'percentage', monto: '60', razon: 'Anticipo' },
      { tipo: 'percentage', monto: '40', razon: 'Entrega' },
    ])
    assert.equal(snap.contrato?.valorTotal, '2500')
    assert.equal(snap.hitos.length, 2)
    assert.deepEqual(snap.hitos.map((h) => h.orden), [1, 2])
    assert.equal(snap.hitos[0].montoOPorcentaje, '60')
  })

  await test('t-166 actualizarContrato: sin `hitos` deja el plan de pagos intacto', () => {
    const base = baseSnapshot({
      contrato: contrato('ctr-1'),
      hitos: [{ id: 'h1', contratoId: 'ctr-1', orden: 1, tipo: 'percentage', montoOPorcentaje: '100', razon: 'Unico' }],
    })
    const snap = actualizarContrato(base, 'ctr-1', { valorTotal: '9' })
    assert.equal(snap.contrato?.valorTotal, '9')
    assert.equal(snap.hitos.length, 1, 'los hitos sobreviven')
  })

  await test('t-166 actualizarContrato: si no hay contrato en el snapshot, no-op', () => {
    const base = baseSnapshot()
    assert.equal(actualizarContrato(base, 'ctr-1', { valorTotal: '1' }), base)
  })

  await test('t-166 actualizarContrato: hitos [] deja el plan vacío (borrar todos los hitos)', () => {
    const base = baseSnapshot({
      contrato: contrato('ctr-1'),
      hitos: [{ id: 'h1', contratoId: 'ctr-1', orden: 1, tipo: 'percentage', montoOPorcentaje: '100', razon: 'Unico' }],
    })
    assert.equal(actualizarContrato(base, 'ctr-1', { valorTotal: '9' }, []).hitos.length, 0)
  })

  await test('t-166 upsertContrato: guarda el contrato en el snapshot', () => {
    const snap = upsertContrato(baseSnapshot(), contrato('ctr-1', { valorTotal: '777' }))
    assert.equal(snap.contrato?.id, 'ctr-1')
    assert.equal(snap.contrato?.valorTotal, '777')
  })

  // --- t-169: deshacer dirigido sobre el snapshot ACTUAL (no sobre uno viejo capturado antes
  // de que otra mutación concurrente tocara el cache) — fix de la condición de carrera de
  // factory.ts que causó la pérdida de ítems reportada 2026-09-30. ---

  await test('revertirItem: deshace una creación (no existía en previo) quitándolo del actual, sin tocar al resto', () => {
    const previo = baseSnapshot({ items: [item('it-viejo')] })
    const actual = baseSnapshot({ items: [item('it-viejo'), item('it-nuevo-fallido'), item('it-hermano-exitoso')] })
    const snap = revertirItem(actual, 'it-nuevo-fallido', previo)
    assert.equal(snap.items.length, 2)
    assert.ok(!snap.items.some((i) => i.id === 'it-nuevo-fallido'))
    assert.ok(snap.items.some((i) => i.id === 'it-hermano-exitoso'), 'no pisa el ítem de la mutación hermana que sí tuvo éxito')
  })

  await test('revertirItem: deshace una actualización restaurando los valores de previo', () => {
    const previo = baseSnapshot({ items: [item('it-1', { cantidad: '2', totalLinea: '2000' })] })
    const actual = baseSnapshot({ items: [item('it-1', { cantidad: '99', totalLinea: '99000' }), item('it-hermano')] })
    const snap = revertirItem(actual, 'it-1', previo)
    assert.equal(snap.items.find((i) => i.id === 'it-1')?.cantidad, '2')
    assert.ok(snap.items.some((i) => i.id === 'it-hermano'), 'no pisa al hermano')
  })

  await test('revertirItem: deshace un soft-delete (anulado vuelve a false)', () => {
    const previo = baseSnapshot({ items: [item('it-1', { anulado: false })] })
    const actual = baseSnapshot({ items: [item('it-1', { anulado: true })] })
    const snap = revertirItem(actual, 'it-1', previo)
    assert.equal(snap.items[0].anulado, false)
  })

  await test('revertirItem: id sin cambios en ninguno de los dos snapshots es no-op', () => {
    const previo = baseSnapshot()
    const actual = baseSnapshot({ items: [item('it-x')] })
    const snap = revertirItem(actual, 'it-inexistente', previo)
    assert.equal(snap, actual)
  })

  await test('revertirEspacio: deshace creación sin tocar espacios hermanos', () => {
    const previo = baseSnapshot({ espacios: [espacio('esp-1')] })
    const actual = baseSnapshot({ espacios: [espacio('esp-1'), espacio('esp-fallido'), espacio('esp-hermano')] })
    const snap = revertirEspacio(actual, 'esp-fallido', previo)
    assert.equal(snap.espacios.length, 2)
    assert.ok(snap.espacios.some((e) => e.id === 'esp-hermano'))
  })

  await test('revertirArtefacto: deshace creación sin tocar artefactos hermanos', () => {
    const art = construirArtefactoOptimista({ id: 'art-1', espacioVarianteId: 'esp-1', categoria: 'electrodomestico' })
    const previo = baseSnapshot()
    const actual = baseSnapshot({ artefactos: [art] })
    const snap = revertirArtefacto(actual, 'art-1', previo)
    assert.equal(snap.artefactos.length, 0)
  })

  await test('revertirProyecto: restaura el proyecto completo de previo', () => {
    const proyectoBase = { id: 'proj-1', nombreProyecto: 'P', clienteId: null, tipoProyecto: 'personalizado' as const, direccionObra: null, descripcionSemantica: null, costosOperativos: '0', imprevistosInstalacion: '0', descuentoComercial: '0', ajusteArbitrario: '0', aplicaIva: false, porcentajeIva: '19', garantiaAnios: 2, diasEntregaEstimados: null, estado: 'activa' as const, createdAt: '2026-01-01', updatedAt: '2026-01-01' }
    const previo = baseSnapshot({ proyecto: proyectoBase })
    const actual = baseSnapshot({ proyecto: { ...proyectoBase, aplicaIva: true, garantiaAnios: 99 } })
    const snap = revertirProyecto(actual, 'proj-1', previo)
    assert.equal(snap.proyecto?.aplicaIva, false)
    assert.equal(snap.proyecto?.garantiaAnios, 2)
  })

  await test('revertirCliente: restaura el cliente sin tocar al resto de la lista', () => {
    const previo = baseSnapshot({ clientes: [cliente('c1', { telefono: null })] })
    const actual = baseSnapshot({ clientes: [cliente('c1', { telefono: '999' }), cliente('c2', { nombre: 'Luis' })] })
    const snap = revertirCliente(actual, 'c1', previo)
    assert.equal(snap.clientes.find((c) => c.id === 'c1')?.telefono, null)
    assert.equal(snap.clientes.find((c) => c.id === 'c2')?.nombre, 'Luis')
  })

  await test('revertirContrato: restaura contrato e hitos juntos', () => {
    const hitosPrevios = [{ id: 'h1', contratoId: 'ctr-1', orden: 1, tipo: 'percentage' as const, montoOPorcentaje: '100', razon: 'Unico' }]
    const previo = baseSnapshot({ contrato: contrato('ctr-1', { valorTotal: '1000' }), hitos: hitosPrevios })
    const actual = baseSnapshot({ contrato: contrato('ctr-1', { valorTotal: '99999' }), hitos: [] })
    const snap = revertirContrato(actual, 'ctr-1', previo)
    assert.equal(snap.contrato?.valorTotal, '1000')
    assert.equal(snap.hitos.length, 1)
  })

  console.log(`\n${pasadas} pruebas pasadas`)
})().catch((err) => {
  console.error(err)
  process.exit(1)
})