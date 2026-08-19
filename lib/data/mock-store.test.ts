// Test de round-trip del mock store (M-07, contrato de reactividad).
// Verifica lo que qa.md exige para tareas de "datos": escritura y lectura
// verificadas, sin pasar por React ni por el navegador. Corre en segundos y
// reemplaza el bucle manual de "cambio algo, abro el navegador, ¿se ve?".
// Ejecutar: npx tsx lib/data/mock-store.test.ts
import assert from 'node:assert/strict'
import { createMockStore } from './mock-store'
import { SHOP_CATEGORIAS } from '@/lib/data'

let pasadas = 0
async function test(nombre: string, fn: () => void | Promise<void>): Promise<void> {
  await fn()
  pasadas++
  console.log(`  ok - ${nombre}`)
}

// IIFE async: tsx transpila a CJS por defecto (sin "type":"module" en package.json),
// que no admite top-level await. El bloque entero de pruebas corre adentro.
;(async () => {

await test('proyectos: crear -> listar lo incluye', async () => {
  const store = createMockStore()
  const antes = store.proyectos.listar().length
  const nuevo = await store.proyectos.crear({ nombreProyecto: 'Proyecto Test' })
  assert.equal(store.proyectos.listar().length, antes + 1)
  assert.equal(store.proyectos.obtenerPorId(nuevo.id)?.nombreProyecto, 'Proyecto Test')
})

await test('proyectos: actualizarEstado -> obtenerPorId refleja el nuevo estado y queda en el historial', async () => {
  const store = createMockStore()
  const p = await store.proyectos.crear({ nombreProyecto: 'X', estado: 'activa' })
  await store.proyectos.actualizarEstado(p.id, 'enviada')
  assert.equal(store.proyectos.obtenerPorId(p.id)?.estado, 'enviada')
  const historial = store.proyectos.historialEstado(p.id)
  assert.equal(historial.length, 1)
  assert.equal(historial[0].estadoAnterior, 'activa')
  assert.equal(historial[0].estadoNuevo, 'enviada')
})

await test('proyectos.actualizarEstado: transición válida según transiciones_proyecto -> tiene éxito y estado cambia', async () => {
  const store = createMockStore()
  const p = await store.proyectos.crear({ nombreProyecto: 'Transición válida', estado: 'activa' })
  // activa → enviada es válida según el parámetro
  const resultado = await store.proyectos.actualizarEstado(p.id, 'enviada')
  assert.ok(resultado, 'la transición válida debe retornar el proyecto')
  assert.equal(store.proyectos.obtenerPorId(p.id)?.estado, 'enviada')
  const historial = store.proyectos.historialEstado(p.id)
  assert.equal(historial.length, 1)
  assert.equal(historial[0].estadoNuevo, 'enviada')
})

await test('proyectos.actualizarEstado: transición inválida según transiciones_proyecto -> devuelve null sin cambiar estado', async () => {
  const store = createMockStore()
  const p = await store.proyectos.crear({ nombreProyecto: 'Transición inválida', estado: 'activa' })
  // activa → entregado NO es válida según el parámetro (solo permite enviada, perdida, cancelada)
  const resultado = await store.proyectos.actualizarEstado(p.id, 'entregado')
  assert.equal(resultado, null, 'la transición inválida debe retornar null')
  assert.equal(store.proyectos.obtenerPorId(p.id)?.estado, 'activa', 'el estado NO debe cambiar')
  const historial = store.proyectos.historialEstado(p.id)
  assert.equal(historial.length, 0, 'no debe crear entrada de historial para transición rechazada')
})

await test('proyectos: actualizarParametrosFinancieros -> obtenerPorId refleja aplicaIva y porcentajeIva', async () => {
  const store = createMockStore()
  const p = await store.proyectos.crear({ nombreProyecto: 'X', aplicaIva: false, porcentajeIva: '0' })
  assert.equal(store.proyectos.obtenerPorId(p.id)?.aplicaIva, false)
  assert.equal(store.proyectos.obtenerPorId(p.id)?.porcentajeIva, '0')

  await store.proyectos.actualizarParametrosFinancieros(p.id, { aplicaIva: true, porcentajeIva: '19' })
  assert.equal(store.proyectos.obtenerPorId(p.id)?.aplicaIva, true)
  assert.equal(store.proyectos.obtenerPorId(p.id)?.porcentajeIva, '19')
})

await test('clientes: crear -> listar lo incluye', async () => {
  const store = createMockStore()
  const antes = store.clientes.listar().length
  const c = await store.clientes.crear({ nombre: 'Cliente Test' })
  assert.equal(store.clientes.listar().length, antes + 1)
  assert.equal(store.clientes.obtenerPorId(c.id)?.nombre, 'Cliente Test')
})

await test('espacios: crear -> porProyecto lo incluye', async () => {
  const store = createMockStore()
  const p = await store.proyectos.crear({ nombreProyecto: 'X' })
  const esp = await store.espacios.crear({ proyectoId: p.id, nombreEspacio: 'Cocina' })
  const listados = store.espacios.porProyecto(p.id)
  assert.equal(listados.length, 1)
  assert.equal(listados[0].id, esp.id)
})

await test('espacios: actualizar (renombrar) -> porProyecto refleja el nombre nuevo (regresión del síntoma reportado)', async () => {
  const store = createMockStore()
  const p = await store.proyectos.crear({ nombreProyecto: 'X' })
  const esp = await store.espacios.crear({ proyectoId: p.id, nombreEspacio: 'Nombre Viejo' })
  await store.espacios.actualizar(esp.id, { nombreEspacio: 'Nombre Nuevo' })
  const [leido] = store.espacios.porProyecto(p.id)
  assert.equal(leido.nombreEspacio, 'Nombre Nuevo')
})

await test('espacios: actualizarJornadas -> se refleja en la lectura', async () => {
  const store = createMockStore()
  const p = await store.proyectos.crear({ nombreProyecto: 'X' })
  const esp = await store.espacios.crear({ proyectoId: p.id, nombreEspacio: 'Cocina' })
  await store.espacios.actualizarJornadas(esp.id, { jornadasDesarrolloTecnico: '2', jornadasEnsamblajeTaller: '3', jornadasInstalacionObra: '1' })
  const [leido] = store.espacios.porProyecto(p.id)
  assert.equal(leido.jornadasDesarrolloTecnico, '2')
  assert.equal(leido.jornadasEnsamblajeTaller, '3')
  assert.equal(leido.jornadasInstalacionObra, '1')
})

await test('items: crear/actualizar/eliminar -> round-trip completo', async () => {
  const store = createMockStore()
  const p = await store.proyectos.crear({ nombreProyecto: 'X' })
  const esp = await store.espacios.crear({ proyectoId: p.id, nombreEspacio: 'Cocina' })
  const item = await store.items.crear({ varianteId: esp.id, catalogoId: null, cantidad: '1' })
  assert.equal(store.items.porVariante(esp.id).length, 1)

  await store.items.actualizar(item.id, { cantidad: '5' })
  assert.equal(store.items.porVariante(esp.id)[0].cantidad, '5')

  assert.equal(await store.items.eliminar(item.id), true)
  // D-09c (2026-08-10): eliminar() sigue siendo soft-delete (anulado=true) internamente, pero porVariante()
  // ya no devuelve ítems anulados -- antes un ítem "eliminado" seguía sumando en subtotales y apareciendo
  // en la propuesta pública que ve el cliente. El filtro vive acá, no en cada pantalla que lee porVariante().
  assert.equal(store.items.porVariante(esp.id).length, 0)
})

await test('artefactos: crear/actualizar -> round-trip', async () => {
  const store = createMockStore()
  const p = await store.proyectos.crear({ nombreProyecto: 'X' })
  const esp = await store.espacios.crear({ proyectoId: p.id, nombreEspacio: 'Cocina' })
  const art = await store.artefactos.crear({ espacioVarianteId: esp.id, categoria: 'determinante', tipoSpecifique: 'Impresora' })
  assert.equal(store.artefactos.porEspacio(esp.id).length, 1)

  await store.artefactos.actualizar(art.id, { ubicacion: 'Isla central' })
  assert.equal(store.artefactos.porEspacio(esp.id)[0].ubicacion, 'Isla central')
})

await test('parametros: actualizar crea la clave si no existe, y la actualiza si ya existe', async () => {
  const store = createMockStore()
  assert.equal(store.parametros.obtenerPorClave('clave_nueva'), undefined)
  await store.parametros.actualizar('clave_nueva', { valorTexto: '10' })
  assert.equal(store.parametros.obtenerPorClave('clave_nueva')?.valorTexto, '10')

  await store.parametros.actualizar('clave_nueva', { valorTexto: '20' })
  assert.equal(store.parametros.obtenerPorClave('clave_nueva')?.valorTexto, '20')
  assert.equal(store.parametros.listar().filter(p => p.clave === 'clave_nueva').length, 1)
})

await test('contratos: crear -> porProyecto y hitos.porContrato reflejan lo creado', async () => {
  const store = createMockStore()
  const p = await store.proyectos.crear({ nombreProyecto: 'X' })
  const contrato = await store.contratos.crear({
    proyectoId: p.id,
    codigoContrato: 'CTR-TEST',
    valorTotal: '1000',
    hitos: [{ tipo: 'percentage', monto: '50', razon: 'Anticipo' }, { tipo: 'percentage', monto: '50', razon: 'Entrega' }],
  })
  assert.equal(store.contratos.porProyecto(p.id)?.id, contrato.id)
  assert.equal(store.hitos.porContrato(contrato.id).length, 2)
})

await test('subscribe: notifica en cada mutación y deja de notificar tras desuscribirse', async () => {
  const store = createMockStore()
  let llamadas = 0
  const unsubscribe = store.subscribe(() => { llamadas++ })

  await store.proyectos.crear({ nombreProyecto: 'X' })
  assert.equal(llamadas, 1)

  await store.clientes.crear({ nombre: 'Y' })
  assert.equal(llamadas, 2)

  unsubscribe()
  await store.proyectos.crear({ nombreProyecto: 'Z' })
  assert.equal(llamadas, 2, 'no debe notificar después de desuscribirse')
})

await test('espacios.duplicar (vacío, mismo espacio): agrega variante alternativa en blanco, no activa', async () => {
  const store = createMockStore()
  const p = await store.proyectos.crear({ nombreProyecto: 'X' })
  const original = await store.espacios.crear({ proyectoId: p.id, nombreEspacio: 'Cocina', descripcion: 'Original' })
  const copia = await store.espacios.duplicar(original.id, { vacio: true })

  assert.ok(copia)
  assert.equal(copia!.nombreEspacio, 'Cocina')
  assert.equal(copia!.descripcion, null)
  assert.equal(copia!.activa, false, 'una variante nueva no debe robarle la actividad a la original')
  assert.equal(store.espacios.porProyecto(p.id).length, 2)
  // La original sigue activa e intacta.
  assert.equal(store.espacios.porProyecto(p.id).find(e => e.id === original.id)?.activa, true)
})

await test('espacios.duplicar (clonado, mismo espacio): copia campos y clona items + artefactos', async () => {
  const store = createMockStore()
  const p = await store.proyectos.crear({ nombreProyecto: 'X' })
  const original = await store.espacios.crear({ proyectoId: p.id, nombreEspacio: 'Cocina', descripcion: 'Roble macizo' })
  await store.items.crear({ varianteId: original.id, catalogoId: null, cantidad: '2', precioUnitario: '1000' })
  await store.artefactos.crear({ espacioVarianteId: original.id, categoria: 'electrodomestico', tipoSpecifique: 'Nevera' })

  const copia = await store.espacios.duplicar(original.id, { vacio: false })

  assert.ok(copia)
  assert.equal(copia!.descripcion, 'Roble macizo')
  assert.equal(copia!.nombreVariante, `${original.nombreVariante} (copia)`)
  assert.equal(store.items.porVariante(copia!.id).length, 1, 'debe clonar los items de la variante origen')
  assert.equal(store.artefactos.porEspacio(copia!.id).length, 1, 'debe clonar los artefactos de la variante origen')
  // Los clones son independientes: no comparten id con el origen.
  assert.notEqual(store.items.porVariante(copia!.id)[0].id, store.items.porVariante(original.id)[0].id)
})

await test('espacios.duplicar (nuevoNombreEspacio): crea un grupo de espacio independiente, activo', async () => {
  const store = createMockStore()
  const p = await store.proyectos.crear({ nombreProyecto: 'X' })
  const original = await store.espacios.crear({ proyectoId: p.id, nombreEspacio: 'Cocina' })
  const nuevoEspacio = await store.espacios.duplicar(original.id, { vacio: true, nuevoNombreEspacio: 'Cocina (copia)' })

  assert.ok(nuevoEspacio)
  assert.equal(nuevoEspacio!.nombreEspacio, 'Cocina (copia)')
  assert.equal(nuevoEspacio!.activa, true, 'un grupo de espacio nuevo e independiente debe nacer activo')
})

await test('espacios.marcarActiva: activa el objetivo y desactiva a las demás variantes del mismo grupo', async () => {
  const store = createMockStore()
  const p = await store.proyectos.crear({ nombreProyecto: 'X' })
  const a = await store.espacios.crear({ proyectoId: p.id, nombreEspacio: 'Cocina' })
  const b = (await store.espacios.duplicar(a.id, { vacio: true }))!
  assert.equal(a.activa === true, true)

  await store.espacios.marcarActiva(b.id)

  const [aLeida, bLeida] = store.espacios.porProyecto(p.id)
  assert.equal(aLeida.activa, false)
  assert.equal(bLeida.activa, true)
})

await test('items: esReferencial/fuenteReferencial/grupoReferencial hacen round-trip', async () => {
  const store = createMockStore()
  const p = await store.proyectos.crear({ nombreProyecto: 'X' })
  const esp = await store.espacios.crear({ proyectoId: p.id, nombreEspacio: 'Cocina' })
  const item = await store.items.crear({
    varianteId: esp.id, catalogoId: null, cantidad: '3', precioUnitario: '450000',
    esReferencial: true, fuenteReferencial: 'obra_civil', grupoReferencial: 'Ventanas',
  })

  const [leido] = store.items.porVariante(esp.id)
  assert.equal(leido.esReferencial, true)
  assert.equal(leido.fuenteReferencial, 'obra_civil')
  assert.equal(leido.grupoReferencial, 'Ventanas')
  assert.equal(item.totalLinea, '1350000', 'totalLinea debe derivarse de cantidad × precioUnitario al crear')

  await store.items.actualizar(item.id, { cantidad: '5' })
  assert.equal(store.items.porVariante(esp.id)[0].totalLinea, '2250000', 'totalLinea debe re-derivarse al actualizar cantidad')
})

await test('getVersion: cambia con cada mutación, no cambia con solo lecturas', async () => {
  const store = createMockStore()
  const v0 = store.getVersion()
  store.proyectos.listar()
  store.clientes.listar()
  assert.equal(store.getVersion(), v0, 'leer no debe incrementar la versión')

  await store.proyectos.crear({ nombreProyecto: 'X' })
  assert.equal(store.getVersion(), v0 + 1)
})

// --- F3: capa de datos ---

await test('f3 cronogramas: crear -> porProyecto lo incluye', async () => {
  const store = createMockStore()
  const p = await store.proyectos.crear({ nombreProyecto: 'F3 Proyecto', estado: 'desarrollo' })
  const crog = await store.cronogramas.crear({ proyectoId: p.id })
  assert.equal(store.cronogramas.porProyecto(p.id)?.id, crog.id)
  assert.equal(store.cronogramas.obtenerPorId(crog.id)?.proyectoId, p.id)
})

await test('f3 cronograma etapas: crear -> porCronograma las lista', async () => {
  const store = createMockStore()
  const e = await store.cronogramaEtapas.crear({ cronogramaId: 'test-crog-999', linea: 'interna', etapa: 'compras', fechaIdeal: '2026-08-15', fechaReal: '2026-08-15', estado: 'pendiente' })
  assert.equal(store.cronogramaEtapas.porCronograma('test-crog-999').length, 1)
  assert.equal(store.cronogramaEtapas.porCronograma('test-crog-999')[0].id, e.id)
})

await test('f3 desfase aplicar: P33 inválido (sin motivo) no crea el desfase', async () => {
  const store = createMockStore()
  const r = await store.desfases.aplicar('mock-proj11', { causa: 'externa', composicionCausal: [{ origen: 'P', aporteDias: 1 }], motivo: '', diasDesfase: 3 })
  assert.equal(r, null)
})

await test('f3 desfase aplicar: recalcula SOLO línea interna; contractual inmutable (I-034)', async () => {
  const store = createMockStore()
  // Uso el cronograma del fixture proj11 (mock-crog02), sin desfases previos aplicados por el usuario.
  const crog = store.cronogramas.porProyecto('mock-proj11')!
  const antesContractual = store.cronogramaEtapas.porCronograma(crog.id).find(e => e.linea === 'contractual' && e.etapa === 'compras')!
  const antesInterna = store.cronogramaEtapas.porCronograma(crog.id).find(e => e.linea === 'interna' && e.etapa === 'compras')!
  const contractualInicial = antesContractual.fechaReal
  const internaInicial = antesInterna.fechaReal

  const desfase = await store.desfases.aplicar('mock-proj11', { causa: 'externa', composicionCausal: [{ origen: 'Proveedor', aporteDias: 3 }], motivo: 'Demora de despacho', diasDesfase: 5 })
  assert.ok(desfase)

  const etapas = store.cronogramaEtapas.porCronograma(crog.id)
  const contractual = etapas.find(e => e.linea === 'contractual' && e.etapa === 'compras')!
  const interna = etapas.find(e => e.linea === 'interna' && e.etapa === 'compras')!
  assert.equal(contractual.fechaReal, contractualInicial, 'contractual debe permanecer inmutable')
  assert.notEqual(interna.fechaReal, internaInicial, 'interna debe recalcularse')
})

await test('f3 checks: crear deriva desenlace del mínimo de ratios (R9)', async () => {
  const store = createMockStore()
  const c = await store.checks.crear('mock-proj10', { ratioInsumos: 0.80, ratioPagos: 0.98, ratioProduccion: 0.98 })
  assert.equal(c.desenlaceSugerido, 'novedad')
  const c2 = await store.checks.crear('mock-proj10', { ratioInsumos: 0.60, ratioPagos: 0.98, ratioProduccion: 0.98 })
  assert.equal(c2.desenlaceSugerido, 'extremo')
})

await test('f3 checks: confirmar exige override_justificacion si difiere de la sugerencia (R10)', async () => {
  const store = createMockStore()
  const c = await store.checks.crear('mock-proj10', { ratioInsumos: 0.60, ratioPagos: 0.98, ratioProduccion: 0.98 }) // extremo
  assert.equal(await store.checks.confirmar(c.id, { desenlaceFinal: 'novedad' }), null, 'sin justificación no se confirma')
  const ok = await store.checks.confirmar(c.id, { desenlaceFinal: 'novedad', overrideJustificacion: 'Proveedor local ya despachó' })
  assert.ok(ok)
  assert.equal(ok!.desenlaceFinal, 'novedad')
  assert.equal(ok!.comisionesReducidasPct, 0.50)
})

await test('f3 comunicaciones: solo permitidas tras desenlace todo_bien (R4)', async () => {
  const store = createMockStore()
  assert.equal(await store.comunicaciones.crear('mock-proj10', { contenido: 'Adelanto' }), null, 'sin check todo_bien no se comunica adelanto')
  const p = await store.proyectos.crear({ nombreProyecto: 'F3 Bien', estado: 'armado' })
  const c = await store.checks.crear(p.id, { ratioInsumos: 0.97, ratioPagos: 0.98, ratioProduccion: 0.98 })
  await store.checks.confirmar(c.id, { desenlaceFinal: 'todo_bien' })
  const com = await store.comunicaciones.crear(p.id, { contenido: 'Posible adelanto en 15 días' })
  assert.ok(com)
  assert.equal(com!.tipo, 'adelanto')
})

await test('f3 schemas: crear versiona +1; veredicto aprobado mueve proyecto (E-18, R1/R6)', async () => {
  const store = createMockStore()
  const p = await store.proyectos.crear({ nombreProyecto: 'F3 Gate', estado: 'desarrollo', comercialVendedorId: 'mock-p02', verificadorId: 'mock-p02', fechaEntradaDesarrollo: '2026-08-01T00:00:00.000Z' })
  const s1 = await store.schemas.crear(p.id)
  const s2 = await store.schemas.crear(p.id)
  assert.equal(s1.version, 1)
  assert.equal(s2.version, 2)

  const v = await store.verificaciones.emitirVeredicto({ proyectoId: p.id, tipoGate: 'schema', veredicto: 'aprobado', verificadorId: 'mock-p02' })
  assert.ok(v)
  assert.equal(store.proyectos.obtenerPorId(p.id)?.estado, 'aprobado_compras')
})

await test('f3 veredicto: rechaza si el verificador no es el único del proyecto (R6 guard server)', async () => {
  const store = createMockStore()
  const p = await store.proyectos.crear({ nombreProyecto: 'F3 Guard', estado: 'desarrollo', comercialVendedorId: 'mock-p02', verificadorId: 'mock-p02', fechaEntradaDesarrollo: '2026-08-01T00:00:00.000Z' })
  const v = await store.verificaciones.emitirVeredicto({ proyectoId: p.id, tipoGate: 'schema', veredicto: 'aprobado', verificadorId: 'mock-p99' })
  assert.equal(v, null)
  assert.equal(store.proyectos.obtenerPorId(p.id)?.estado, 'desarrollo', 'el proyecto no debe avanzar')
})

await test('f3 retoma: guardar persiste y la anomalía dispara cambio de contrato (E-16)', async () => {
  const store = createMockStore()
  const p = await store.proyectos.crear({ nombreProyecto: 'F3 Retoma', estado: 'en_contrato' })
  const r = await store.retomas.guardar(p.id, { medidas: { m1: { alto: 100 } }, anomaliaDetectada: true })
  assert.equal(store.retomas.porProyecto(p.id)?.id, r.id)
  const cambios = store.cambiosContrato.porProyecto(p.id)
  assert.equal(cambios.length, 1)
  assert.equal(cambios[0].disparaDesfase, true)
})

await test('f3 equipo: personas/roles round-trip y asignación de rol', async () => {
  const store = createMockStore()
  const antes = store.personas.listar().length
  const persona = await store.personas.crear({ nombre: 'Nuevo Empleado' })
  assert.equal(store.personas.listar().length, antes + 1)
  const rol = await store.personasRoles.asignar(persona.id, 'compras')
  assert.equal(store.personasRoles.activos().some(r => r.id === rol.id), true)
})

await test('f3 producto/gates: modulos y estimaciones por proyecto', async () => {
  const store = createMockStore()
  assert.equal(store.modulos.porProyecto('mock-proj12').length, 4)
  assert.equal(store.estimaciones.porProyecto('mock-proj10')?.factorCrecimiento, 1.15)
  assert.equal(store.estimaciones.porProyecto('mock-proj11'), undefined)
})

// --- F5: Taller, calidad, instalación, entrega, garantía ---

await test('f5 modulos.actualizarEstado: avanza por_armar->en_armado->armado->en_calidad, rechaza saltos', async () => {
  const store = createMockStore()
  const [modulo] = store.modulos.porProyecto('mock-proj13')
  assert.equal(modulo.estado, 'por_armar')

  assert.equal(await store.modulos.actualizarEstado(modulo.id, 'armado'), null, 'no debe permitir saltar estados')
  const avanzado = await store.modulos.actualizarEstado(modulo.id, 'en_armado')
  assert.ok(avanzado)
  assert.equal(avanzado!.estado, 'en_armado')
  assert.equal((await store.modulos.actualizarEstado(avanzado!.id, 'armado'))?.estado, 'armado')
})

await test('f5 citaciones + veredicto calidad: sin citación no se puede aprobar (P-17 R1/R2)', async () => {
  const store = createMockStore()
  const p = await store.proyectos.crear({ nombreProyecto: 'F5 Calidad', estado: 'armado', verificadorId: 'mock-p02' })
  const v = await store.verificaciones.emitirVeredicto({ proyectoId: p.id, tipoGate: 'calidad', veredicto: 'aprobado', verificadorId: 'mock-p02' })
  assert.equal(v, null, 'sin citación previa no se puede emitir veredicto')

  await store.citacionesCalidad.crear({ proyectoId: p.id, modulosIds: ['mock-mod201'], fecha: new Date().toISOString() })
  const v2 = await store.verificaciones.emitirVeredicto({ proyectoId: p.id, tipoGate: 'calidad', veredicto: 'aprobado', verificadorId: 'mock-p02' })
  assert.ok(v2)
  assert.equal(store.proyectos.obtenerPorId(p.id)?.estado, 'armado', 'R4: el proyecto NO cambia de estado al aprobar calidad')
})

await test('f5 veredicto calidad rechazado: crea reproceso origen=calidad (E-54)', async () => {
  const store = createMockStore()
  const p = await store.proyectos.crear({ nombreProyecto: 'F5 Rechazo', estado: 'armado', verificadorId: 'mock-p02' })
  await store.citacionesCalidad.crear({ proyectoId: p.id, modulosIds: [], fecha: new Date().toISOString() })
  const antes = store.reprocesos.porProyecto(p.id).length
  await store.verificaciones.emitirVeredicto({ proyectoId: p.id, tipoGate: 'calidad', veredicto: 'rechazado', verificadorId: 'mock-p02' })
  const reprocesos = store.reprocesos.porProyecto(p.id)
  assert.equal(reprocesos.length, antes + 1)
  assert.equal(reprocesos[reprocesos.length - 1].origen, 'calidad')
})

await test('f5 instalaciones.programar: rechaza rangos >5 días (R40)', async () => {
  const store = createMockStore()
  assert.equal(await store.instalaciones.programar({ proyectoId: 'mock-proj12', rangoFechaInicio: '2026-08-10', rangoFechaFin: '2026-08-20' }), null)
  const ok = await store.instalaciones.programar({ proyectoId: 'mock-proj12', rangoFechaInicio: '2026-08-10', rangoFechaFin: '2026-08-14' })
  assert.ok(ok)
  assert.equal(ok!.estado, 'programada')
})

await test('f5 instalaciones.iniciar: guard P24 -- exige veredicto de calidad aprobado tras la citación', async () => {
  const store = createMockStore()
  const p = await store.proyectos.crear({ nombreProyecto: 'F5 Instala', estado: 'armado', verificadorId: 'mock-p02' })
  const inst = (await store.instalaciones.programar({ proyectoId: p.id, rangoFechaInicio: '2026-08-10', rangoFechaFin: '2026-08-12' }))!
  assert.equal(await store.instalaciones.iniciar(inst.id), null, 'sin gate de calidad aprobado no debe iniciar')

  await store.citacionesCalidad.crear({ proyectoId: p.id, modulosIds: [], fecha: new Date().toISOString() })
  await store.verificaciones.emitirVeredicto({ proyectoId: p.id, tipoGate: 'calidad', veredicto: 'aprobado', verificadorId: 'mock-p02' })
  const iniciada = await store.instalaciones.iniciar(inst.id)
  assert.ok(iniciada)
  assert.equal(iniciada!.estado, 'en_curso')
  assert.equal(store.proyectos.obtenerPorId(p.id)?.estado, 'en_instalacion')
})

await test('f5 instalaciones.marcarInstalada -> proyecto pasa a instalado; marcarFallida crea reproceso', async () => {
  const store = createMockStore()
  const inst = (await store.instalaciones.programar({ proyectoId: 'mock-proj05', rangoFechaInicio: '2026-08-10', rangoFechaFin: '2026-08-11' }))!
  const instalada = await store.instalaciones.marcarInstalada(inst.id)
  assert.equal(instalada!.estado, 'instalada')
  assert.equal(store.proyectos.obtenerPorId('mock-proj05')?.estado, 'instalado')

  const inst2 = (await store.instalaciones.programar({ proyectoId: 'mock-proj04', rangoFechaInicio: '2026-08-10', rangoFechaFin: '2026-08-11' }))!
  const antes = store.reprocesos.porProyecto('mock-proj04').length
  await store.instalaciones.marcarFallida(inst2.id, 'Medidas de obra no coinciden')
  assert.equal(store.reprocesos.porProyecto('mock-proj04').length, antes + 1)
})

await test('f5 instalaciones R4: iniciar sin check todo_bien -> adelantadaPor=null', async () => {
  const store = createMockStore()
  const p = await store.proyectos.crear({ nombreProyecto: 'F5 Sin Adelanto', estado: 'armado', verificadorId: 'mock-p02' })
  const inst = (await store.instalaciones.programar({ proyectoId: p.id, rangoFechaInicio: '2026-08-10', rangoFechaFin: '2026-08-12' }))!

  await store.citacionesCalidad.crear({ proyectoId: p.id, modulosIds: [], fecha: new Date().toISOString() })
  await store.verificaciones.emitirVeredicto({ proyectoId: p.id, tipoGate: 'calidad', veredicto: 'aprobado', verificadorId: 'mock-p02' })

  const iniciada = await store.instalaciones.iniciar(inst.id)
  assert.ok(iniciada)
  assert.equal(iniciada!.adelantadaPor, null, 'sin check todo_bien, adelantadaPor debe ser null')
})

await test('f5 instalaciones R4: iniciar con check todo_bien -> adelantadaPor=checkId (adelantada)', async () => {
  const store = createMockStore()
  const p = await store.proyectos.crear({ nombreProyecto: 'F5 Con Adelanto', estado: 'armado', verificadorId: 'mock-p02' })

  // Crear un check con todo_bien.
  const check = await store.checks.crear(p.id, { ratioInsumos: 0.97, ratioPagos: 0.98, ratioProduccion: 0.98 })
  await store.checks.confirmar(check.id, { desenlaceFinal: 'todo_bien' })

  // Programar instalación.
  const inst = (await store.instalaciones.programar({ proyectoId: p.id, rangoFechaInicio: '2026-08-10', rangoFechaFin: '2026-08-12' }))!
  assert.equal(inst.adelantadaPor, null, 'al programar, adelantadaPor debe ser null (se asigna al iniciar)')

  // Cumplir P24: citación + veredicto de calidad aprobado.
  await store.citacionesCalidad.crear({ proyectoId: p.id, modulosIds: [], fecha: new Date().toISOString() })
  await store.verificaciones.emitirVeredicto({ proyectoId: p.id, tipoGate: 'calidad', veredicto: 'aprobado', verificadorId: 'mock-p02' })

  // Iniciar: debe detectar el check todo_bien y asignar adelantadaPor.
  const iniciada = await store.instalaciones.iniciar(inst.id)
  assert.ok(iniciada)
  assert.equal(iniciada!.adelantadaPor, check.id, 'con check todo_bien, adelantadaPor debe ser el id del check')
  assert.equal(iniciada!.estado, 'en_curso')
})

await test('f5 actasEntrega: solo genera si hay instalación instalada; firmar mueve proyecto a entregado (E-26)', async () => {
  const store = createMockStore()
  assert.equal(await store.actasEntrega.generar('mock-proj12'), null, 'sin instalación instalada no debe generar')

  const inst = (await store.instalaciones.programar({ proyectoId: 'mock-proj12', rangoFechaInicio: '2026-08-10', rangoFechaFin: '2026-08-11' }))!
  await store.instalaciones.marcarInstalada(inst.id)
  const acta = await store.actasEntrega.generar('mock-proj12')
  assert.ok(acta)
  assert.equal(acta!.estado, 'generada')

  await store.actasEntrega.enviar(acta!.id)
  const firmada = await store.actasEntrega.firmar(acta!.id)
  assert.equal(firmada!.estado, 'firmada')
  assert.equal(store.proyectos.obtenerPorId('mock-proj12')?.estado, 'entregado')
})

await test('f5 casosGarantia.reportar: exige proyecto entregado y calcula dentroGarantiaContractual (R1/R2)', async () => {
  const store = createMockStore()
  assert.equal(await store.casosGarantia.reportar({ proyectoId: 'mock-proj05', descripcion: 'Falla' }), null, 'proj05 no está entregado aún')

  // mock-proj06 ya está entregado en fixtures, con garantiaAnios=2.
  const caso = await store.casosGarantia.reportar({ proyectoId: 'mock-proj06', descripcion: 'Cajón no cierra', fotos: ['a.jpg'] })
  assert.ok(caso)
  assert.equal(caso!.estado, 'reportado')
  assert.equal(caso!.dentroGarantiaContractual, true)
  assert.equal(store.casosGarantia.porProyecto('mock-proj06').some(c => c.id === caso!.id), true)
})

await test('f5 casosGarantia.reportar: rechaza más de 5 fotos (R4)', async () => {
  const store = createMockStore()
  const r = await store.casosGarantia.reportar({ proyectoId: 'mock-proj06', descripcion: 'Falla', fotos: ['a', 'b', 'c', 'd', 'e', 'f'] })
  assert.equal(r, null)
})

await test('f5 casosGarantia: flujo completo diagnosticar -> orden reparación -> resolver -> cerrar', async () => {
  const store = createMockStore()
  const caso = (await store.casosGarantia.reportar({ proyectoId: 'mock-proj06', descripcion: 'Bisagra suelta' }))!
  await store.casosGarantia.diagnosticar(caso.id, 'Bisagra requiere ajuste')
  assert.equal(store.casosGarantia.porProyecto('mock-proj06').find(c => c.id === caso.id)?.estado, 'diagnosticado')

  const antesOT = store.ordenesTrabajo.porProyecto('mock-proj06').length
  await store.casosGarantia.crearOrdenReparacion(caso.id)
  assert.equal(store.ordenesTrabajo.porProyecto('mock-proj06').length, antesOT + 1)
  assert.equal(store.casosGarantia.porProyecto('mock-proj06').find(c => c.id === caso.id)?.estado, 'en_reparacion')

  await store.casosGarantia.resolver(caso.id, 'Bisagra reemplazada')
  assert.equal(store.casosGarantia.porProyecto('mock-proj06').find(c => c.id === caso.id)?.estado, 'resuelto')
  await store.casosGarantia.cerrar(caso.id)
  assert.equal(store.casosGarantia.porProyecto('mock-proj06').find(c => c.id === caso.id)?.estado, 'cerrado')
})

await test('f5 citasGarantia: agendar -> porCaso lo incluye', async () => {
  const store = createMockStore()
  const cita = await store.citasGarantia.agendar({ casoId: 'mock-gar01', proyectoId: 'mock-proj06', fecha: '2026-08-10T09:00:00.000Z' })
  assert.equal(store.citasGarantia.porCaso('mock-gar01').some(c => c.id === cita.id), true)
})

// --- F6: Finanzas ---

await test('f6 cuentasFinancieras.disponible: recalcula siempre desde cuentas - obligaciones pendientes', async () => {
  const store = createMockStore()
  const disponibleInicial = store.cuentasFinancieras.disponible()
  await store.cuentasFinancieras.crear({ nombre: 'Caja chica', tipo: 'caja', saldoActual: '1000000' })
  assert.equal(store.cuentasFinancieras.disponible(), disponibleInicial + 1000000)
})

await test('f6 obligacionesPendientes.registrarPago: mueve a parcial y luego a pagado, crea movimiento (R3)', async () => {
  const store = createMockStore()
  const cuenta = await store.cuentasFinancieras.crear({ nombre: 'Cuenta Test', tipo: 'banco', saldoActual: '5000000' })
  const obl = await store.obligacionesPendientes.crear({ descripcion: 'Prueba', origen: 'proveedor', montoTotal: '1000000', fechaVencimiento: '2026-09-01' })

  const parcial = await store.obligacionesPendientes.registrarPago(obl.id, { monto: '400000', cuentaId: cuenta.id })
  assert.equal(parcial!.estado, 'parcial')
  assert.equal(parcial!.montoPagado, '400000')

  const pagado = await store.obligacionesPendientes.registrarPago(obl.id, { monto: '600000', cuentaId: cuenta.id })
  assert.equal(pagado!.estado, 'pagado')
  assert.equal(store.movimientosFinancieros.porCuenta(cuenta.id).length, 2)
})

await test('f6 caja.autorizarPago: paga si hay caja disponible (E-20)', async () => {
  const store = createMockStore()
  const cuenta = await store.cuentasFinancieras.crear({ nombre: 'Cuenta OC', tipo: 'banco', saldoActual: '10000000' })
  const prov = await store.proveedores.crear({ nombre: 'Proveedor Test' })
  const oc = await store.ordenesCompra.crear({ proveedorId: prov.id, montoTotal: '2000000', estado: 'en_pago' })

  const mov = await store.caja.autorizarPago({ ordenCompraId: oc.id, cuentaId: cuenta.id })
  assert.ok(mov)
  assert.equal(store.ordenesCompra.listar().find(o => o.id === oc.id)?.estado, 'pagada')
})

await test('f6 caja.autorizarPago: bloquea si la caja es insuficiente y registra registros_gate_caja (R2)', async () => {
  const store = createMockStore()
  const cuenta = await store.cuentasFinancieras.crear({ nombre: 'Cuenta Corta', tipo: 'banco', saldoActual: '100' })
  const prov = await store.proveedores.crear({ nombre: 'Proveedor Caro' })
  const oc = await store.ordenesCompra.crear({ proveedorId: prov.id, montoTotal: '999999999', estado: 'en_pago' })

  const antesRegistros = store.registrosGateCaja.porOrdenCompra(oc.id).length
  const mov = await store.caja.autorizarPago({ ordenCompraId: oc.id, cuentaId: cuenta.id })
  assert.equal(mov, null)
  assert.equal(store.ordenesCompra.listar().find(o => o.id === oc.id)?.estado, 'en_pago', 'la OC no debe cambiar de estado en el bloqueo')
  assert.equal(store.registrosGateCaja.porOrdenCompra(oc.id).length, antesRegistros + 1)
})

await test('f6 proveedores + cuentasCobroProveedor: crear genera obligación origen=proveedor automáticamente (R2)', async () => {
  const store = createMockStore()
  const prov = await store.proveedores.crear({ nombre: 'Proveedor Cuentas' })
  const antesObl = store.obligacionesPendientes.listar().length

  assert.equal(await store.cuentasCobroProveedor.crear({ proveedorId: prov.id, concepto: 'Materiales', valor: '500000', firmaDigital: '', fechaEmision: '2026-08-10' }), null, 'R4: firma digital requerida')

  const cuenta = await store.cuentasCobroProveedor.crear({ proveedorId: prov.id, concepto: 'Materiales', valor: '500000', firmaDigital: 'firma-x', fechaEmision: '2026-08-10' })
  assert.ok(cuenta)
  assert.equal(cuenta!.estado, 'emitida')
  assert.equal(store.obligacionesPendientes.listar().length, antesObl + 1)

  const oc = await store.ordenesCompra.crear({ proveedorId: prov.id, montoTotal: '500000' })
  const otroProv = await store.proveedores.crear({ nombre: 'Otro Proveedor' })
  const ocOtro = await store.ordenesCompra.crear({ proveedorId: otroProv.id, montoTotal: '500000' })
  assert.equal(await store.cuentasCobroProveedor.vincularOC(cuenta!.id, ocOtro.id), null, 'R3: proveedor de la cuenta y de la OC deben coincidir')
  const vinculada = await store.cuentasCobroProveedor.vincularOC(cuenta!.id, oc.id)
  assert.equal(vinculada!.estado, 'vinculada')
})

// --- F-02: Tienda web ---

await test('f2 categorias + productosTienda: crear -> visibles() solo muestra visibleEnTienda=true (R1)', async () => {
  const store = createMockStore()
  const catg = SHOP_CATEGORIAS.COCINAS
  const producto = await store.productosTienda.crear({ catalogoId: 'mock-p01', categoria: catg, valorTienda: '300000', visibleEnTienda: false })
  assert.equal(store.productosTienda.visibles().some(p => p.id === producto.id), false)

  await store.productosTienda.actualizar(producto.id, { visibleEnTienda: true })
  assert.equal(store.productosTienda.visibles().some(p => p.id === producto.id), true)
})

await test('p27 productosTiendaComponentes: un producto de tienda se compone de N componentes del catálogo (disenio_p27 §6.2)', async () => {
  const store = createMockStore()
  const catg = SHOP_CATEGORIAS.COMEDO
  const producto = await store.productosTienda.crear({ catalogoId: 'mock-p01', categoria: catg, valorTienda: '500000' })

  const c1 = await store.productosTiendaComponentes.crear({ productoTiendaId: producto.id, catalogoId: 'mock-p01', cantidad: '2' })
  const c2 = await store.productosTiendaComponentes.crear({ productoTiendaId: producto.id, catalogoId: 'mock-p03', cantidad: '8' })
  assert.equal(store.productosTiendaComponentes.porProductoTienda(producto.id).length, 2)

  await store.productosTiendaComponentes.eliminar(c1.id)
  const restantes = store.productosTiendaComponentes.porProductoTienda(producto.id)
  assert.equal(restantes.length, 1)
  assert.equal(restantes[0].id, c2.id)
})

await test('f2 catalogoAcabados + catalogoProductoAcabados + acabadosMuestras: round-trip', async () => {
  const store = createMockStore()
  const acabado = await store.catalogoAcabados.crear({ nombre: 'Roble oscuro' })
  const puente = await store.catalogoProductoAcabados.crear({ productoCatalogoId: 'mock-p01', acabadoId: acabado.id, esDefault: true })
  assert.equal(store.catalogoProductoAcabados.porProducto('mock-p01').some(c => c.id === puente.id), true)

  const muestra = await store.acabadosMuestras.crear({ acabadoId: acabado.id, imagenMuestraUrl: 'https://x/img.jpg' })
  assert.equal(store.acabadosMuestras.porAcabado(acabado.id).some(m => m.id === muestra.id), true)
})

// --- P-27: Catálogo diseño-desarrollo ---

await test('p27 catalogo.crear: rechaza sku duplicado (R1) y precio directo > público (R3)', async () => {
  const store = createMockStore()
  assert.equal(await store.catalogo.crear({ sku: 'TAB-ROB-18', descripcion: 'Dup', unidadMedida: 'ud' }), null, 'sku duplicado del fixture')
  assert.equal(await store.catalogo.crear({ sku: 'NUEVO-1', descripcion: 'X', unidadMedida: 'ud', precioDirecto: '100', precioPublico: '50' }), null, 'directo > público')

  const nuevo = await store.catalogo.crear({ sku: 'NUEVO-2', descripcion: 'Producto nuevo', unidadMedida: 'ud', precioDirecto: '50', precioPublico: '100' })
  assert.ok(nuevo)
  assert.equal(nuevo!.anulado, false)
})

await test('p27 catalogo.actualizar: publicar exige precioPublico + imagenUrl (R5); eliminar es soft-delete (R8)', async () => {
  const store = createMockStore()
  const nuevo = (await store.catalogo.crear({ sku: 'NUEVO-3', descripcion: 'Sin imagen', unidadMedida: 'ud', precioPublico: '100' }))!
  assert.equal(await store.catalogo.actualizar(nuevo.id, { publicadoWeb: true }), null, 'sin imagenUrl no debe poder publicarse')

  const publicado = await store.catalogo.actualizar(nuevo.id, { publicadoWeb: true, imagenUrl: 'https://x/img.jpg' })
  assert.equal(publicado!.publicadoWeb, true)

  // t-139 (R5 ampliada): publicar con solo galería (sin imagenUrl) también es válido.
  const soloGaleria = (await store.catalogo.crear({ sku: 'NUEVO-4', descripcion: 'Con galería', unidadMedida: 'ud', precioPublico: '100', galeriaImagenesUrl: ['https://x/g1.jpg', 'https://x/g2.jpg'] }))!
  const pubGaleria = await store.catalogo.actualizar(soloGaleria.id, { publicadoWeb: true })
  assert.equal(pubGaleria!.publicadoWeb, true, 'publicar con galería y sin imagenUrl debe ser válido')

  assert.equal(await store.catalogo.eliminar(nuevo.id), true)
  assert.equal(store.catalogo.obtenerPorId(nuevo.id)?.anulado, true, 'eliminar no borra, solo marca anulado')
})

await test('p27 catalogo: round-trip galeriaImagenesUrl (crear -> leer -> actualizar -> leer) [t-139]', async () => {
  const store = createMockStore()
  const creado = (await store.catalogo.crear({ sku: 'RT-1', descripcion: 'Round trip', unidadMedida: 'ud', precioPublico: '100', imagenUrl: 'https://x/portada.jpg', galeriaImagenesUrl: ['https://x/g1.jpg'] }))!
  assert.deepEqual(creado.galeriaImagenesUrl, ['https://x/g1.jpg'])
  assert.deepEqual(store.catalogo.obtenerPorId(creado.id)!.galeriaImagenesUrl, ['https://x/g1.jpg'])

  const actualizado = (await store.catalogo.actualizar(creado.id, { galeriaImagenesUrl: ['https://x/g2.jpg', 'https://x/g3.jpg'] }))!
  assert.deepEqual(actualizado!.galeriaImagenesUrl, ['https://x/g2.jpg', 'https://x/g3.jpg'])
  assert.equal(actualizado!.imagenUrl, 'https://x/portada.jpg', 'actualizar solo la galería no debe tocar imagenUrl')
  assert.equal(store.catalogo.obtenerPorId(creado.id)!.galeriaImagenesUrl.length, 2)
})

await test('p27 catalogo.buscar: búsqueda resiliente (tildes, tokens AND, fuzzy Opción A) [t-141]', () => {
  const store = createMockStore()
  const sku = 'MES-TV-NOG'
  // Tilde: "nogál" encuentra "Nogal" (normalización NFD).
  assert.equal(store.catalogo.buscar('nogál').some(c => c.sku === sku), true)
  // Tokens AND en orden distinto: "tv nogal" encuentra "Mueble TV flotante Nogal 1.80m".
  assert.equal(store.catalogo.buscar('tv nogal').some(c => c.sku === sku), true)
  // Typo (fuzzy, Opción A): "mogal" ~ "nogal" (1 edición, token >= 4).
  assert.equal(store.catalogo.buscar('mogal').some(c => c.sku === sku), true)
  // Sin coincidencia -> vacío.
  assert.equal(store.catalogo.buscar('zzz-inexistente').length, 0)
})

// --- F-03: Portafolio de proyectos ---

await test('f3-portafolio: publicados() ordena destacado DESC luego orden ASC, filtra publicado=true (R1/R4)', async () => {
  const store = createMockStore()
  const publicados = store.portafolio.publicados()
  assert.equal(publicados.every(p => p.publicado), true)
  assert.equal(publicados[0].destacado, true, 'el fixture destacado debe ir primero')

  const nuevo = await store.portafolio.crear({ proyectoId: 'mock-proj09', titulo: 'Biblioteca Vargas', categoriaEspacio: 'estudio', slug: 'biblioteca-vargas' })
  assert.equal(store.portafolio.publicados().some(p => p.id === nuevo.id), false, 'no publicado por defecto')

  const publicado = await store.portafolio.publicar(nuevo.id)
  assert.equal(publicado!.publicado, true)
  assert.equal(store.portafolio.porSlug('biblioteca-vargas')?.id, nuevo.id)

  await store.portafolio.despublicar(nuevo.id)
  assert.equal(store.portafolio.publicados().some(p => p.id === nuevo.id), false)
})

await test('dc1 testimonios: crear con nombreAutor -> publicados() filtra publicado=true (R1)', async () => {
  const store = createMockStore()
  const sinPublicar = await store.testimonios.crear({ contenido: 'Borrador interno', nombreAutor: 'Anónimo', rating: 5, fuente: 'GBP' })
  assert.equal(store.testimonios.publicados().some(t => t.id === sinPublicar.id), false, 'no publicado por defecto')
  assert.equal(sinPublicar.nombreAutor, 'Anónimo', 'nombreAutor hace round-trip en crear')

  const publicado = await store.testimonios.publicar(sinPublicar.id)
  assert.equal(publicado!.publicado, true)
  assert.equal(publicado!.aprobado, true)
  assert.equal(store.testimonios.publicados().some(t => t.id === sinPublicar.id), true, 'publicar lo expone')

  const actualizado = await store.testimonios.actualizar(sinPublicar.id, { nombreAutor: 'Glenda Danuro' })
  assert.equal(actualizado!.nombreAutor, 'Glenda Danuro', 'nombreAutor hace round-trip en actualizar')

  await store.testimonios.despublicar(sinPublicar.id)
  assert.equal(store.testimonios.publicados().some(t => t.id === sinPublicar.id), false, 'despublicar lo oculta')
})

await test('f3-portafolio: modulosArtefactos round-trip por módulo', async () => {
  const store = createMockStore()
  const antes = store.modulosArtefactos.porModulo('mock-mod102').length
  const art = await store.modulosArtefactos.crear({ moduloId: 'mock-mod102', tipo: 'imagen', fuente: 'dedicado_proyecto', url: 'https://x/foto.jpg' })
  assert.equal(store.modulosArtefactos.porModulo('mock-mod102').length, antes + 1)
  assert.equal(store.modulosArtefactos.porModulo('mock-mod102').some(m => m.id === art.id), true)
})

// --- F4: Compras (P-13/P-14/P-15) ---

await test('f4 pedidosWeb.enganchar: crea ordenes_trabajo(tipo=produccion, pedidoWebId) y no duplica en reintento (R1/R2/E-44)', async () => {
  const store = createMockStore()
  const pedido = await store.pedidosWeb.crear({ clienteId: 'mock-c01', totalPedido: '500000' })
  assert.equal(store.pedidosWeb.listar().some(p => p.id === pedido.id), true)

  const otAntes = store.ordenesTrabajo.porProyecto('mock-proj10').length
  const enganchado = await store.pedidosWeb.enganchar(pedido.id, 'mock-proj10')
  assert.equal(enganchado!.estado, 'enganchado')
  assert.equal(enganchado!.proyectoId, 'mock-proj10')
  assert.equal(store.ordenesTrabajo.porProyecto('mock-proj10').length, otAntes + 1)

  // Reintento: no crea una segunda orden de trabajo.
  await store.pedidosWeb.enganchar(pedido.id, 'mock-proj10')
  assert.equal(store.ordenesTrabajo.porProyecto('mock-proj10').length, otAntes + 1)
})

await test('f4 itemsOrdenCompra: D-04 exactamente una vía — catálogo o especificación a pedido, nunca ambas ni ninguna', async () => {
  const store = createMockStore()
  assert.equal(await store.itemsOrdenCompra.crear({ ordenCompraId: 'mock-oc02', cantidadEsperada: 1 }), null, 'ninguna vía debe rechazarse')
  assert.equal(await store.itemsOrdenCompra.crear({ ordenCompraId: 'mock-oc02', productoCatalogoId: 'mock-p01', especificacion: 'Tablero a medida', cantidadEsperada: 1 }), null, 'ambas vías debe rechazarse')

  const viaPedido = await store.itemsOrdenCompra.crear({ ordenCompraId: 'mock-oc02', especificacion: 'Vidrio templado 8mm cortado a medida 1.20x0.80', cantidadEsperada: 2 })
  assert.equal(viaPedido!.productoCatalogoId, null)
  assert.equal(viaPedido!.especificacion, 'Vidrio templado 8mm cortado a medida 1.20x0.80')
})

await test('f4 itemsOrdenCompra.crearDesdeSugeridos: crea todos los ítems sugeridos por derivarListaCompraSugerida de una vez (D-04 vía 1)', async () => {
  const store = createMockStore()
  const antes = store.itemsOrdenCompra.porOrdenCompra('mock-oc02').length
  const creados = await store.itemsOrdenCompra.crearDesdeSugeridos('mock-oc02', [
    { productoCatalogoId: 'mock-p01', cantidad: 5 },
    { productoCatalogoId: 'mock-p02', cantidad: 3 },
  ])
  assert.equal(creados.length, 2)
  assert.equal(store.itemsOrdenCompra.porOrdenCompra('mock-oc02').length, antes + 2)
})

await test('f4 ordenesCompra.crear: C-01 crea una obligacionPendiente(origen=proveedor) automáticamente, en la misma operación', async () => {
  const store = createMockStore()
  const antes = store.obligacionesPendientes.listar().length
  const oc = await store.ordenesCompra.crear({ proveedorId: 'mock-prov01', montoTotal: '500000' })
  const obligaciones = store.obligacionesPendientes.listar()
  assert.equal(obligaciones.length, antes + 1)
  const nueva = obligaciones.find(o => o.proveedorId === 'mock-prov01' && o.montoTotal === '500000')
  assert.equal(nueva?.origen, 'proveedor')
  assert.equal(nueva?.estado, 'pendiente')
  assert.equal(nueva?.proyectoId, oc.proyectoId)
})

await test('f4 itemsOrdenCompra + recepcionesMaterial: 3/3 checks marca recibido_verificado y transiciona la OC (E-21)', async () => {
  const store = createMockStore()
  const item = (await store.itemsOrdenCompra.crear({ ordenCompraId: 'mock-oc02', productoCatalogoId: 'mock-p01', cantidadEsperada: 10 }))!
  assert.equal(store.itemsOrdenCompra.porOrdenCompra('mock-oc02').some(i => i.id === item.id), true)

  const recepcion = await store.recepcionesMaterial.crear({ ordenCompraId: 'mock-oc02', proyectoId: 'mock-proj11' })
  assert.equal(recepcion.estado, 'pendiente')

  const parcial = await store.recepcionesMaterial.actualizarChecks(recepcion.id, { checkPedidoBien: true, checkDespachoBien: true, checkMaterial: false })
  assert.equal(parcial, null, 'checks incompletos sin descripción de defecto deben rechazarse')

  const defectuosa = await store.recepcionesMaterial.actualizarChecks(recepcion.id, { checkPedidoBien: true, checkDespachoBien: true, checkMaterial: false, descripcionDefecto: 'Tablero rayado' })
  assert.equal(defectuosa!.estado, 'recibido_defectuoso')

  const completa = await store.recepcionesMaterial.actualizarChecks(recepcion.id, { checkPedidoBien: true, checkDespachoBien: true, checkMaterial: true })
  assert.equal(completa!.estado, 'recibido_verificado')
  assert.equal(store.ordenesCompra.listar().find(o => o.id === 'mock-oc02')?.estado, 'recibida_verificada')

  // D-04 (re-auditoría 2026-08-10): antes recibidoCantidad/sinDefectos se quedaban en 0/false para
  // siempre -- 3/3 verificado debe reflejarse también en cada ítem de la OC, no solo en la OC.
  const itemActualizado = store.itemsOrdenCompra.porOrdenCompra('mock-oc02').find(i => i.id === item.id)
  assert.equal(itemActualizado?.recibidoCantidad, itemActualizado?.cantidadEsperada)
  assert.equal(itemActualizado?.sinDefectos, true)
})

await test('f4 herramientas.reponer: crea OC operativa (proyectoId=null) y no duplica si ya hay una abierta (R1/R2/E-45)', async () => {
  const store = createMockStore()
  const herramienta = await store.herramientas.crear({ nombre: 'Taladro', valor: '400000', proveedorId: 'mock-prov02' })
  assert.equal(store.herramientas.listar().some(h => h.id === herramienta.id), true)

  const primera = (await store.herramientas.reponer(herramienta.id))!
  assert.equal(primera.ordenCompra.proyectoId, null)
  assert.equal(primera.herramienta.estadoOperativo, 'necesita_reposicion')

  const segunda = (await store.herramientas.reponer(herramienta.id))!
  assert.equal(segunda.ordenCompra.id, primera.ordenCompra.id, 'no debe crear una segunda OC mientras la primera sigue abierta')
})

await test('f4 herramientas.reponer: sin proveedor asignado no crea una OC con proveedorId vacío (D-05, re-auditoría 2026-08-10)', async () => {
  const store = createMockStore()
  const herramienta = await store.herramientas.crear({ nombre: 'Escuadra', valor: '50000' })
  assert.equal(herramienta.proveedorId, null)
  assert.equal(await store.herramientas.reponer(herramienta.id), null)
})

// --- F7: Documentación del proyecto (P-26) ---

await test('f7 documentosProyecto: crear (R2 alojador drive_veta_erp sin subida real) + eliminar round-trip', async () => {
  const store = createMockStore()
  const antes = store.documentosProyecto.porProyecto('mock-proj10').length

  const rechazado = await store.documentosProyecto.crear({ proyectoId: 'mock-proj10', etapa: 'produccion', alojador: 'r2', url: '', nombre: 'Sin url' })
  assert.equal(rechazado, null)

  const drive = await store.documentosProyecto.crear({ proyectoId: 'mock-proj10', etapa: 'cotizacion', alojador: 'drive_veta_erp', url: 'https://drive.google.com/mock/nuevo', nombre: 'Render SDK' })
  assert.equal(drive!.alojador, 'drive_veta_erp')
  assert.equal(store.documentosProyecto.porProyecto('mock-proj10').length, antes + 1)

  assert.equal(await store.documentosProyecto.eliminar(drive!.id), true)
  assert.equal(store.documentosProyecto.porProyecto('mock-proj10').length, antes)
})

// --- D-08a: Perfil de Persona / Proveedor ---

await test('d08a personas.obtenerPorId + actualizar: round-trip de fotoUrl/email (C-02)', async () => {
  const store = createMockStore()
  assert.equal(store.personas.obtenerPorId('mock-p01')?.nombre, 'Javier García')
  assert.equal(store.personas.obtenerPorId('no-existe'), undefined)

  const actualizada = await store.personas.actualizar('mock-p01', { fotoUrl: 'https://r2.mock/personas/p01.jpg', email: 'nuevo@vetadeoro.co' })
  assert.equal(actualizada!.fotoUrl, 'https://r2.mock/personas/p01.jpg')
  assert.equal(actualizada!.email, 'nuevo@vetadeoro.co')
  assert.equal(await store.personas.actualizar('no-existe', { email: 'x' }), null)
})

await test('d08a proveedores.obtenerPorId + obligacionesPendientes.porPersona/porProveedor: filtros de saldos pendientes', async () => {
  const store = createMockStore()
  assert.equal(store.proveedores.obtenerPorId('mock-prov01')?.nombre, 'Maderas del Llano S.A.S')
  assert.equal(store.proveedores.obtenerPorId('no-existe'), undefined)

  const obligacionesPersona = store.obligacionesPendientes.porPersona('mock-p02')
  assert.equal(obligacionesPersona.every(o => o.personaId === 'mock-p02'), true)
  assert.equal(obligacionesPersona.length > 0, true, 'fixture obl02 (comisión Laura) debe aparecer')

  const obligacionesProveedor = store.obligacionesPendientes.porProveedor('mock-prov01')
  assert.equal(obligacionesProveedor.every(o => o.proveedorId === 'mock-prov01'), true)
  assert.equal(obligacionesProveedor.length > 0, true, 'fixture obl03 (OC-2026-0011) debe aparecer')
})

// --- P-21 Fix: integridad financiera — OC → obligación → pago sincronizado ---

await test('p21 ordenesCompra.crear crea ObligacionPendiente vinculada con ordenCompraId', async () => {
  const store = createMockStore()
  const proveedor = store.proveedores.listar()[0]
  const oc = await store.ordenesCompra.crear({
    proveedorId: proveedor.id,
    montoTotal: '500000',
    mecanicaPago: 'unico',
  })
  // Verificar que la obligación creada está vinculada a esta OC.
  const obligaciones = store.obligacionesPendientes.porProveedor(proveedor.id)
  const oblVinculada = obligaciones.find(o => o.ordenCompraId === oc.id)
  assert.ok(oblVinculada, 'debe existir una obligación con ordenCompraId vinculada a la OC')
  assert.equal(oblVinculada!.estado, 'pendiente')
  assert.equal(oblVinculada!.montoPagado, '0')
})

await test('p21 caja.autorizarPago actualiza montoPagado y estado de la obligación vinculada', async () => {
  const store = createMockStore()
  const proveedor = store.proveedores.listar()[0]
  const cuenta = store.cuentasFinancieras.listar()[0]

  // Crear OC y ponerla en estado en_pago (normalmente se hace via otro flujo).
  const oc = await store.ordenesCompra.crear({
    proveedorId: proveedor.id,
    montoTotal: '500000',
    mecanicaPago: 'unico',
  })
  await store.ordenesCompra.actualizarEstado(oc.id, 'en_pago')

  // Obtener la obligación vinculada.
  const oblAntes = store.obligacionesPendientes.listar().find(o => o.ordenCompraId === oc.id)
  assert.ok(oblAntes, 'debe existir la obligación antes del pago')
  assert.equal(oblAntes!.montoPagado, '0')
  assert.equal(oblAntes!.estado, 'pendiente')

  // Autorizar el pago.
  const movimiento = await store.caja.autorizarPago({
    ordenCompraId: oc.id,
    cuentaId: cuenta.id,
    medioPago: 'transferencia',
  })
  assert.ok(movimiento, 'autorizarPago debe retornar un movimiento')

  // Verificar que la obligación se actualizó.
  const oblDespues = store.obligacionesPendientes.listar().find(o => o.ordenCompraId === oc.id)
  assert.ok(oblDespues, 'obligación debe seguir existiendo')
  assert.equal(oblDespues!.montoPagado, '500000', 'montoPagado debe incrementarse')
  assert.equal(oblDespues!.estado, 'pagado', 'estado debe cambiar a pagado')
})

// --- P-23 Fix: integridad financiera — CuentaCobro → obligación → pago validado ---

await test('p23 cuentasCobroProveedor.crear crea ObligacionPendiente vinculada con obligacionId', async () => {
  const store = createMockStore()
  const proveedor = store.proveedores.listar()[0]

  const cuenta = await store.cuentasCobroProveedor.crear({
    proveedorId: proveedor.id,
    concepto: 'Factura adicional',
    valor: '250000',
    firmaDigital: 'sig123',
    fechaEmision: '2026-08-10',
    fechaVencimiento: '2026-08-20',
  })
  assert.ok(cuenta, 'crear debe retornar la cuenta')
  assert.ok(cuenta!.obligacionId, 'obligacionId debe estar asignado')

  // Verificar que la obligación existe y está vinculada.
  const obligacion = store.obligacionesPendientes.listar().find(o => o.id === cuenta!.obligacionId)
  assert.ok(obligacion, 'debe existir la obligación')
  assert.equal(obligacion!.proveedorId, proveedor.id)
  assert.equal(obligacion!.estado, 'pendiente')
})

await test('p23 cuentasCobroProveedor.marcarPagada rechaza si obligacionId es null (data legacy)', async () => {
  const store = createMockStore()
  const proveedor = store.proveedores.listar()[0]
  const cuenta = await store.cuentasCobroProveedor.crear({
    proveedorId: proveedor.id,
    concepto: 'Factura',
    valor: '100000',
    firmaDigital: 'sig',
    fechaEmision: '2026-08-10',
  })
  assert.ok(cuenta, 'crear cuenta debe tener éxito')

  // Intentar marcar pagada sin que haya movimiento → debe fallar.
  const resultado = await store.cuentasCobroProveedor.marcarPagada(cuenta!.id)
  assert.equal(resultado, null, 'marcarPagada debe rechazar si no hay movimiento para la obligación')
})

await test('p23 cuentasCobroProveedor.marcarPagada valida movimiento de su obligación específica', async () => {
  const store = createMockStore()
  const proveedor = store.proveedores.listar()[0]
  const cuentaFinanciera = store.cuentasFinancieras.listar()[0]

  // Crear una cuenta de cobro (sin OC) → crea su propia obligación con obligacionId.
  const cuenta = await store.cuentasCobroProveedor.crear({
    proveedorId: proveedor.id,
    concepto: 'Factura independiente',
    valor: '200000',
    firmaDigital: 'sig-factura',
    fechaEmision: '2026-08-10',
  })
  assert.ok(cuenta, 'crear cuenta debe tener éxito')
  assert.ok(cuenta!.obligacionId, 'debe tener obligacionId asignado')

  // Intentar marcar pagada sin pago → debe fallar.
  let resultado = await store.cuentasCobroProveedor.marcarPagada(cuenta!.id)
  assert.equal(resultado, null, 'marcarPagada debe rechazar sin movimiento')

  // Pagar la obligación específica de la cuenta vía obligacionesPendientes.registrarPago
  // (esto crea un movimiento con obligacionId).
  const obligacion = store.obligacionesPendientes.listar().find(o => o.id === cuenta!.obligacionId)
  assert.ok(obligacion, 'debe existir la obligación de la cuenta')

  await store.obligacionesPendientes.registrarPago(cuenta!.obligacionId!, {
    monto: cuenta!.valor,
    cuentaId: cuentaFinanciera.id,
  })

  // Ahora marcar pagada debe tener éxito.
  resultado = await store.cuentasCobroProveedor.marcarPagada(cuenta!.id)
  assert.ok(resultado, 'marcarPagada debe tener éxito después del pago')
  assert.equal(resultado!.estado, 'pagada')
})

await test('comunicaciones: crear con visibleAlCliente -> visiblesAlCliente filtra correctamente (R4)', async () => {
  const store = createMockStore()

  // Buscar un proyecto que ya tenga un check con desenlaceFinal='todo_bien' en las fixtures
  // (necesario porque crear comunicación requiere que exista un checkBueno)
  let proyectoConCheck: string | null = null
  for (const proj of store.proyectos.listar()) {
    const checksDelProyecto = store.checks.porProyecto(proj.id)
    if (checksDelProyecto.some(c => c.desenlaceFinal === 'todo_bien')) {
      proyectoConCheck = proj.id
      break
    }
  }
  assert.ok(proyectoConCheck, 'debe existir un proyecto con check "todo_bien" en las fixtures')

  // Contar cuántas comunicaciones visibles existen antes (para verificar incremento)
  const visiblesAntes = store.comunicaciones.visiblesAlCliente(proyectoConCheck!)
  const countAntesVisible = visiblesAntes.length

  // Crear dos comunicaciones: una visible, una no visible
  const com1 = await store.comunicaciones.crear(proyectoConCheck!, {
    contenido: 'Comunicación visible para el cliente',
    visibleAlCliente: true,
  })
  assert.ok(com1, 'crear comunicación visible debe tener éxito')
  assert.equal(com1!.visibleAlCliente, true, 'debe tener visibleAlCliente=true')

  const com2 = await store.comunicaciones.crear(proyectoConCheck!, {
    contenido: 'Comunicación interna (no visible)',
    visibleAlCliente: false,
  })
  assert.ok(com2, 'crear comunicación no visible debe tener éxito')
  assert.equal(com2!.visibleAlCliente, false, 'debe tener visibleAlCliente=false')

  // porProyecto debe retornar ambas
  const todas = store.comunicaciones.porProyecto(proyectoConCheck!)
  assert.equal(todas.length, countAntesVisible + 2, 'porProyecto debe incluir ambas (visible e invisible)')

  // visiblesAlCliente debe retornar solo la visible (la invisible no aparece)
  const visibles = store.comunicaciones.visiblesAlCliente(proyectoConCheck!)
  assert.equal(visibles.length, countAntesVisible + 1, 'visiblesAlCliente debe incluir solo la comunicación visible')
  assert.ok(visibles.some(c => c.id === com1!.id), 'comunicación visible debe estar en el filtrado')
  assert.ok(!visibles.some(c => c.id === com2!.id), 'comunicación invisible NO debe estar en el filtrado')
})

console.log(`\n${pasadas} pruebas OK.`)

})()
