// Test de round-trip del mock store (M-07, contrato de reactividad).
// Verifica lo que qa.md exige para tareas de "datos": escritura y lectura
// verificadas, sin pasar por React ni por el navegador. Corre en segundos y
// reemplaza el bucle manual de "cambio algo, abro el navegador, ¿se ve?".
// Ejecutar: npx tsx lib/data/mock-store.test.ts
import assert from 'node:assert/strict'
import { createMockStore } from './mock-store'

let pasadas = 0
function test(nombre: string, fn: () => void): void {
  fn()
  pasadas++
  console.log(`  ok - ${nombre}`)
}

test('proyectos: crear -> listar lo incluye', () => {
  const store = createMockStore()
  const antes = store.proyectos.listar().length
  const nuevo = store.proyectos.crear({ nombreProyecto: 'Proyecto Test' })
  assert.equal(store.proyectos.listar().length, antes + 1)
  assert.equal(store.proyectos.obtenerPorId(nuevo.id)?.nombreProyecto, 'Proyecto Test')
})

test('proyectos: actualizarEstado -> obtenerPorId refleja el nuevo estado y queda en el historial', () => {
  const store = createMockStore()
  const p = store.proyectos.crear({ nombreProyecto: 'X', estado: 'activa' })
  store.proyectos.actualizarEstado(p.id, 'enviada')
  assert.equal(store.proyectos.obtenerPorId(p.id)?.estado, 'enviada')
  const historial = store.proyectos.historialEstado(p.id)
  assert.equal(historial.length, 1)
  assert.equal(historial[0].estadoAnterior, 'activa')
  assert.equal(historial[0].estadoNuevo, 'enviada')
})

test('clientes: crear -> listar lo incluye', () => {
  const store = createMockStore()
  const antes = store.clientes.listar().length
  const c = store.clientes.crear({ nombre: 'Cliente Test' })
  assert.equal(store.clientes.listar().length, antes + 1)
  assert.equal(store.clientes.obtenerPorId(c.id)?.nombre, 'Cliente Test')
})

test('espacios: crear -> porProyecto lo incluye', () => {
  const store = createMockStore()
  const p = store.proyectos.crear({ nombreProyecto: 'X' })
  const esp = store.espacios.crear({ proyectoId: p.id, nombreEspacio: 'Cocina' })
  const listados = store.espacios.porProyecto(p.id)
  assert.equal(listados.length, 1)
  assert.equal(listados[0].id, esp.id)
})

test('espacios: actualizar (renombrar) -> porProyecto refleja el nombre nuevo (regresión del síntoma reportado)', () => {
  const store = createMockStore()
  const p = store.proyectos.crear({ nombreProyecto: 'X' })
  const esp = store.espacios.crear({ proyectoId: p.id, nombreEspacio: 'Nombre Viejo' })
  store.espacios.actualizar(esp.id, { nombreEspacio: 'Nombre Nuevo' })
  const [leido] = store.espacios.porProyecto(p.id)
  assert.equal(leido.nombreEspacio, 'Nombre Nuevo')
})

test('espacios: actualizarJornadas -> se refleja en la lectura', () => {
  const store = createMockStore()
  const p = store.proyectos.crear({ nombreProyecto: 'X' })
  const esp = store.espacios.crear({ proyectoId: p.id, nombreEspacio: 'Cocina' })
  store.espacios.actualizarJornadas(esp.id, { jornadasDesarrolloTecnico: '2', jornadasEnsamblajeTaller: '3', jornadasInstalacionObra: '1' })
  const [leido] = store.espacios.porProyecto(p.id)
  assert.equal(leido.jornadasDesarrolloTecnico, '2')
  assert.equal(leido.jornadasEnsamblajeTaller, '3')
  assert.equal(leido.jornadasInstalacionObra, '1')
})

test('items: crear/actualizar/eliminar -> round-trip completo', () => {
  const store = createMockStore()
  const p = store.proyectos.crear({ nombreProyecto: 'X' })
  const esp = store.espacios.crear({ proyectoId: p.id, nombreEspacio: 'Cocina' })
  const item = store.items.crear({ varianteId: esp.id, catalogoId: null, cantidad: '1' })
  assert.equal(store.items.porVariante(esp.id).length, 1)

  store.items.actualizar(item.id, { cantidad: '5' })
  assert.equal(store.items.porVariante(esp.id)[0].cantidad, '5')

  store.items.eliminar(item.id)
  // eliminar() es soft-delete (anulado=true), no lo saca de porVariante -- contrato explícito del store.
  const [leido] = store.items.porVariante(esp.id)
  assert.equal(leido.anulado, true)
})

test('artefactos: crear/actualizar -> round-trip', () => {
  const store = createMockStore()
  const p = store.proyectos.crear({ nombreProyecto: 'X' })
  const esp = store.espacios.crear({ proyectoId: p.id, nombreEspacio: 'Cocina' })
  const art = store.artefactos.crear({ espacioVarianteId: esp.id, categoria: 'determinante', tipoSpecifique: 'Impresora' })
  assert.equal(store.artefactos.porEspacio(esp.id).length, 1)

  store.artefactos.actualizar(art.id, { ubicacion: 'Isla central' })
  assert.equal(store.artefactos.porEspacio(esp.id)[0].ubicacion, 'Isla central')
})

test('parametros: actualizar crea la clave si no existe, y la actualiza si ya existe', () => {
  const store = createMockStore()
  assert.equal(store.parametros.obtenerPorClave('clave_nueva'), undefined)
  store.parametros.actualizar('clave_nueva', { valorTexto: '10' })
  assert.equal(store.parametros.obtenerPorClave('clave_nueva')?.valorTexto, '10')

  store.parametros.actualizar('clave_nueva', { valorTexto: '20' })
  assert.equal(store.parametros.obtenerPorClave('clave_nueva')?.valorTexto, '20')
  assert.equal(store.parametros.listar().filter(p => p.clave === 'clave_nueva').length, 1)
})

test('contratos: crear -> porProyecto y hitos.porContrato reflejan lo creado', () => {
  const store = createMockStore()
  const p = store.proyectos.crear({ nombreProyecto: 'X' })
  const contrato = store.contratos.crear({
    proyectoId: p.id,
    codigoContrato: 'CTR-TEST',
    valorTotal: '1000',
    hitos: [{ tipo: 'percentage', monto: '50', razon: 'Anticipo' }, { tipo: 'percentage', monto: '50', razon: 'Entrega' }],
  })
  assert.equal(store.contratos.porProyecto(p.id)?.id, contrato.id)
  assert.equal(store.hitos.porContrato(contrato.id).length, 2)
})

test('subscribe: notifica en cada mutación y deja de notificar tras desuscribirse', () => {
  const store = createMockStore()
  let llamadas = 0
  const unsubscribe = store.subscribe(() => { llamadas++ })

  store.proyectos.crear({ nombreProyecto: 'X' })
  assert.equal(llamadas, 1)

  store.clientes.crear({ nombre: 'Y' })
  assert.equal(llamadas, 2)

  unsubscribe()
  store.proyectos.crear({ nombreProyecto: 'Z' })
  assert.equal(llamadas, 2, 'no debe notificar después de desuscribirse')
})

test('espacios.duplicar (vacío, mismo espacio): agrega variante alternativa en blanco, no activa', () => {
  const store = createMockStore()
  const p = store.proyectos.crear({ nombreProyecto: 'X' })
  const original = store.espacios.crear({ proyectoId: p.id, nombreEspacio: 'Cocina', descripcion: 'Original' })
  const copia = store.espacios.duplicar(original.id, { vacio: true })

  assert.ok(copia)
  assert.equal(copia!.nombreEspacio, 'Cocina')
  assert.equal(copia!.descripcion, null)
  assert.equal(copia!.activa, false, 'una variante nueva no debe robarle la actividad a la original')
  assert.equal(store.espacios.porProyecto(p.id).length, 2)
  // La original sigue activa e intacta.
  assert.equal(store.espacios.porProyecto(p.id).find(e => e.id === original.id)?.activa, true)
})

test('espacios.duplicar (clonado, mismo espacio): copia campos y clona items + artefactos', () => {
  const store = createMockStore()
  const p = store.proyectos.crear({ nombreProyecto: 'X' })
  const original = store.espacios.crear({ proyectoId: p.id, nombreEspacio: 'Cocina', descripcion: 'Roble macizo' })
  store.items.crear({ varianteId: original.id, catalogoId: null, cantidad: '2', precioUnitario: '1000' })
  store.artefactos.crear({ espacioVarianteId: original.id, categoria: 'electrodomestico', tipoSpecifique: 'Nevera' })

  const copia = store.espacios.duplicar(original.id, { vacio: false })

  assert.ok(copia)
  assert.equal(copia!.descripcion, 'Roble macizo')
  assert.equal(copia!.nombreVariante, `${original.nombreVariante} (copia)`)
  assert.equal(store.items.porVariante(copia!.id).length, 1, 'debe clonar los items de la variante origen')
  assert.equal(store.artefactos.porEspacio(copia!.id).length, 1, 'debe clonar los artefactos de la variante origen')
  // Los clones son independientes: no comparten id con el origen.
  assert.notEqual(store.items.porVariante(copia!.id)[0].id, store.items.porVariante(original.id)[0].id)
})

test('espacios.duplicar (nuevoNombreEspacio): crea un grupo de espacio independiente, activo', () => {
  const store = createMockStore()
  const p = store.proyectos.crear({ nombreProyecto: 'X' })
  const original = store.espacios.crear({ proyectoId: p.id, nombreEspacio: 'Cocina' })
  const nuevoEspacio = store.espacios.duplicar(original.id, { vacio: true, nuevoNombreEspacio: 'Cocina (copia)' })

  assert.ok(nuevoEspacio)
  assert.equal(nuevoEspacio!.nombreEspacio, 'Cocina (copia)')
  assert.equal(nuevoEspacio!.activa, true, 'un grupo de espacio nuevo e independiente debe nacer activo')
})

test('espacios.marcarActiva: activa el objetivo y desactiva a las demás variantes del mismo grupo', () => {
  const store = createMockStore()
  const p = store.proyectos.crear({ nombreProyecto: 'X' })
  const a = store.espacios.crear({ proyectoId: p.id, nombreEspacio: 'Cocina' })
  const b = store.espacios.duplicar(a.id, { vacio: true })!
  assert.equal(a.activa === true, true)

  store.espacios.marcarActiva(b.id)

  const [aLeida, bLeida] = store.espacios.porProyecto(p.id)
  assert.equal(aLeida.activa, false)
  assert.equal(bLeida.activa, true)
})

test('items: esReferencial/fuenteReferencial/grupoReferencial hacen round-trip', () => {
  const store = createMockStore()
  const p = store.proyectos.crear({ nombreProyecto: 'X' })
  const esp = store.espacios.crear({ proyectoId: p.id, nombreEspacio: 'Cocina' })
  const item = store.items.crear({
    varianteId: esp.id, catalogoId: null, cantidad: '3', precioUnitario: '450000',
    esReferencial: true, fuenteReferencial: 'obra_civil', grupoReferencial: 'Ventanas',
  })

  const [leido] = store.items.porVariante(esp.id)
  assert.equal(leido.esReferencial, true)
  assert.equal(leido.fuenteReferencial, 'obra_civil')
  assert.equal(leido.grupoReferencial, 'Ventanas')
  assert.equal(item.totalLinea, '1350000', 'totalLinea debe derivarse de cantidad × precioUnitario al crear')

  store.items.actualizar(item.id, { cantidad: '5' })
  assert.equal(store.items.porVariante(esp.id)[0].totalLinea, '2250000', 'totalLinea debe re-derivarse al actualizar cantidad')
})

test('getVersion: cambia con cada mutación, no cambia con solo lecturas', () => {
  const store = createMockStore()
  const v0 = store.getVersion()
  store.proyectos.listar()
  store.clientes.listar()
  assert.equal(store.getVersion(), v0, 'leer no debe incrementar la versión')

  store.proyectos.crear({ nombreProyecto: 'X' })
  assert.equal(store.getVersion(), v0 + 1)
})

// --- F3: capa de datos ---

test('f3 cronogramas: crear -> porProyecto lo incluye', () => {
  const store = createMockStore()
  const p = store.proyectos.crear({ nombreProyecto: 'F3 Proyecto', estado: 'desarrollo' })
  const crog = store.cronogramas.crear({ proyectoId: p.id })
  assert.equal(store.cronogramas.porProyecto(p.id)?.id, crog.id)
  assert.equal(store.cronogramas.obtenerPorId(crog.id)?.proyectoId, p.id)
})

test('f3 cronograma etapas: crear -> porCronograma las lista', () => {
  const store = createMockStore()
  const e = store.cronogramaEtapas.crear({ cronogramaId: 'test-crog-999', linea: 'interna', etapa: 'compras', fechaIdeal: '2026-08-15', fechaReal: '2026-08-15', estado: 'pendiente' })
  assert.equal(store.cronogramaEtapas.porCronograma('test-crog-999').length, 1)
  assert.equal(store.cronogramaEtapas.porCronograma('test-crog-999')[0].id, e.id)
})

test('f3 desfase aplicar: P33 inválido (sin motivo) no crea el desfase', () => {
  const store = createMockStore()
  const r = store.desfases.aplicar('mock-proj11', { causa: 'externa', composicionCausal: [{ origen: 'P', aporteDias: 1 }], motivo: '', diasDesfase: 3 })
  assert.equal(r, null)
})

test('f3 desfase aplicar: recalcula SOLO línea interna; contractual inmutable (I-034)', () => {
  const store = createMockStore()
  // Uso el cronograma del fixture proj11 (mock-crog02), sin desfases previos aplicados por el usuario.
  const crog = store.cronogramas.porProyecto('mock-proj11')!
  const antesContractual = store.cronogramaEtapas.porCronograma(crog.id).find(e => e.linea === 'contractual' && e.etapa === 'compras')!
  const antesInterna = store.cronogramaEtapas.porCronograma(crog.id).find(e => e.linea === 'interna' && e.etapa === 'compras')!
  const contractualInicial = antesContractual.fechaReal
  const internaInicial = antesInterna.fechaReal

  const desfase = store.desfases.aplicar('mock-proj11', { causa: 'externa', composicionCausal: [{ origen: 'Proveedor', aporteDias: 3 }], motivo: 'Demora de despacho', diasDesfase: 5 })
  assert.ok(desfase)

  const etapas = store.cronogramaEtapas.porCronograma(crog.id)
  const contractual = etapas.find(e => e.linea === 'contractual' && e.etapa === 'compras')!
  const interna = etapas.find(e => e.linea === 'interna' && e.etapa === 'compras')!
  assert.equal(contractual.fechaReal, contractualInicial, 'contractual debe permanecer inmutable')
  assert.notEqual(interna.fechaReal, internaInicial, 'interna debe recalcularse')
})

test('f3 checks: crear deriva desenlace del mínimo de ratios (R9)', () => {
  const store = createMockStore()
  const c = store.checks.crear('mock-proj10', { ratioInsumos: 0.80, ratioPagos: 0.98, ratioProduccion: 0.98 })
  assert.equal(c.desenlaceSugerido, 'novedad')
  const c2 = store.checks.crear('mock-proj10', { ratioInsumos: 0.60, ratioPagos: 0.98, ratioProduccion: 0.98 })
  assert.equal(c2.desenlaceSugerido, 'extremo')
})

test('f3 checks: confirmar exige override_justificacion si difiere de la sugerencia (R10)', () => {
  const store = createMockStore()
  const c = store.checks.crear('mock-proj10', { ratioInsumos: 0.60, ratioPagos: 0.98, ratioProduccion: 0.98 }) // extremo
  assert.equal(store.checks.confirmar(c.id, { desenlaceFinal: 'novedad' }), null, 'sin justificación no se confirma')
  const ok = store.checks.confirmar(c.id, { desenlaceFinal: 'novedad', overrideJustificacion: 'Proveedor local ya despachó' })
  assert.ok(ok)
  assert.equal(ok!.desenlaceFinal, 'novedad')
  assert.equal(ok!.comisionesReducidasPct, 0.50)
})

test('f3 comunicaciones: solo permitidas tras desenlace todo_bien (R4)', () => {
  const store = createMockStore()
  assert.equal(store.comunicaciones.crear('mock-proj10', { contenido: 'Adelanto' }), null, 'sin check todo_bien no se comunica adelanto')
  const p = store.proyectos.crear({ nombreProyecto: 'F3 Bien', estado: 'armado' })
  const c = store.checks.crear(p.id, { ratioInsumos: 0.97, ratioPagos: 0.98, ratioProduccion: 0.98 })
  store.checks.confirmar(c.id, { desenlaceFinal: 'todo_bien' })
  const com = store.comunicaciones.crear(p.id, { contenido: 'Posible adelanto en 15 días' })
  assert.ok(com)
  assert.equal(com!.tipo, 'adelanto')
})

test('f3 schemas: crear versiona +1; veredicto aprobado mueve proyecto (E-18, R1/R6)', () => {
  const store = createMockStore()
  const p = store.proyectos.crear({ nombreProyecto: 'F3 Gate', estado: 'desarrollo', comercialVendedorId: 'mock-p02', verificadorId: 'mock-p02', fechaEntradaDesarrollo: '2026-08-01T00:00:00.000Z' })
  const s1 = store.schemas.crear(p.id)
  const s2 = store.schemas.crear(p.id)
  assert.equal(s1.version, 1)
  assert.equal(s2.version, 2)

  const v = store.verificaciones.emitirVeredicto({ proyectoId: p.id, tipoGate: 'schema', veredicto: 'aprobado', verificadorId: 'mock-p02' })
  assert.ok(v)
  assert.equal(store.proyectos.obtenerPorId(p.id)?.estado, 'aprobado_compras')
})

test('f3 veredicto: rechaza si el verificador no es el único del proyecto (R6 guard server)', () => {
  const store = createMockStore()
  const p = store.proyectos.crear({ nombreProyecto: 'F3 Guard', estado: 'desarrollo', comercialVendedorId: 'mock-p02', verificadorId: 'mock-p02', fechaEntradaDesarrollo: '2026-08-01T00:00:00.000Z' })
  const v = store.verificaciones.emitirVeredicto({ proyectoId: p.id, tipoGate: 'schema', veredicto: 'aprobado', verificadorId: 'mock-p99' })
  assert.equal(v, null)
  assert.equal(store.proyectos.obtenerPorId(p.id)?.estado, 'desarrollo', 'el proyecto no debe avanzar')
})

test('f3 retoma: guardar persiste y la anomalía dispara cambio de contrato (E-16)', () => {
  const store = createMockStore()
  const p = store.proyectos.crear({ nombreProyecto: 'F3 Retoma', estado: 'en_contrato' })
  const r = store.retomas.guardar(p.id, { medidas: { m1: { alto: 100 } }, anomaliaDetectada: true })
  assert.equal(store.retomas.porProyecto(p.id)?.id, r.id)
  const cambios = store.cambiosContrato.porProyecto(p.id)
  assert.equal(cambios.length, 1)
  assert.equal(cambios[0].disparaDesfase, true)
})

test('f3 equipo: personas/roles round-trip y asignación de rol', () => {
  const store = createMockStore()
  const antes = store.personas.listar().length
  const persona = store.personas.crear({ nombre: 'Nuevo Empleado' })
  assert.equal(store.personas.listar().length, antes + 1)
  const rol = store.personasRoles.asignar(persona.id, 'compras')
  assert.equal(store.personasRoles.activos().some(r => r.id === rol.id), true)
})

test('f3 producto/gates: modulos y estimaciones por proyecto', () => {
  const store = createMockStore()
  assert.equal(store.modulos.porProyecto('mock-proj12').length, 4)
  assert.equal(store.estimaciones.porProyecto('mock-proj10')?.factorCrecimiento, 1.15)
  assert.equal(store.estimaciones.porProyecto('mock-proj11'), undefined)
})

// --- F5: Taller, calidad, instalación, entrega, garantía ---

test('f5 modulos.actualizarEstado: avanza por_armar->en_armado->armado->en_calidad, rechaza saltos', () => {
  const store = createMockStore()
  const [modulo] = store.modulos.porProyecto('mock-proj13')
  assert.equal(modulo.estado, 'por_armar')

  assert.equal(store.modulos.actualizarEstado(modulo.id, 'armado'), null, 'no debe permitir saltar estados')
  const avanzado = store.modulos.actualizarEstado(modulo.id, 'en_armado')
  assert.ok(avanzado)
  assert.equal(avanzado!.estado, 'en_armado')
  assert.equal(store.modulos.actualizarEstado(avanzado!.id, 'armado')?.estado, 'armado')
})

test('f5 citaciones + veredicto calidad: sin citación no se puede aprobar (P-17 R1/R2)', () => {
  const store = createMockStore()
  const p = store.proyectos.crear({ nombreProyecto: 'F5 Calidad', estado: 'armado', verificadorId: 'mock-p02' })
  const v = store.verificaciones.emitirVeredicto({ proyectoId: p.id, tipoGate: 'calidad', veredicto: 'aprobado', verificadorId: 'mock-p02' })
  assert.equal(v, null, 'sin citación previa no se puede emitir veredicto')

  store.citacionesCalidad.crear({ proyectoId: p.id, modulosIds: ['mock-mod201'], fecha: new Date().toISOString() })
  const v2 = store.verificaciones.emitirVeredicto({ proyectoId: p.id, tipoGate: 'calidad', veredicto: 'aprobado', verificadorId: 'mock-p02' })
  assert.ok(v2)
  assert.equal(store.proyectos.obtenerPorId(p.id)?.estado, 'armado', 'R4: el proyecto NO cambia de estado al aprobar calidad')
})

test('f5 veredicto calidad rechazado: crea reproceso origen=calidad (E-54)', () => {
  const store = createMockStore()
  const p = store.proyectos.crear({ nombreProyecto: 'F5 Rechazo', estado: 'armado', verificadorId: 'mock-p02' })
  store.citacionesCalidad.crear({ proyectoId: p.id, modulosIds: [], fecha: new Date().toISOString() })
  const antes = store.reprocesos.porProyecto(p.id).length
  store.verificaciones.emitirVeredicto({ proyectoId: p.id, tipoGate: 'calidad', veredicto: 'rechazado', verificadorId: 'mock-p02' })
  const reprocesos = store.reprocesos.porProyecto(p.id)
  assert.equal(reprocesos.length, antes + 1)
  assert.equal(reprocesos[reprocesos.length - 1].origen, 'calidad')
})

test('f5 instalaciones.programar: rechaza rangos >5 días (R40)', () => {
  const store = createMockStore()
  assert.equal(store.instalaciones.programar({ proyectoId: 'mock-proj12', rangoFechaInicio: '2026-08-10', rangoFechaFin: '2026-08-20' }), null)
  const ok = store.instalaciones.programar({ proyectoId: 'mock-proj12', rangoFechaInicio: '2026-08-10', rangoFechaFin: '2026-08-14' })
  assert.ok(ok)
  assert.equal(ok!.estado, 'programada')
})

test('f5 instalaciones.iniciar: guard P24 -- exige veredicto de calidad aprobado tras la citación', () => {
  const store = createMockStore()
  const p = store.proyectos.crear({ nombreProyecto: 'F5 Instala', estado: 'armado', verificadorId: 'mock-p02' })
  const inst = store.instalaciones.programar({ proyectoId: p.id, rangoFechaInicio: '2026-08-10', rangoFechaFin: '2026-08-12' })!
  assert.equal(store.instalaciones.iniciar(inst.id), null, 'sin gate de calidad aprobado no debe iniciar')

  store.citacionesCalidad.crear({ proyectoId: p.id, modulosIds: [], fecha: new Date().toISOString() })
  store.verificaciones.emitirVeredicto({ proyectoId: p.id, tipoGate: 'calidad', veredicto: 'aprobado', verificadorId: 'mock-p02' })
  const iniciada = store.instalaciones.iniciar(inst.id)
  assert.ok(iniciada)
  assert.equal(iniciada!.estado, 'en_curso')
  assert.equal(store.proyectos.obtenerPorId(p.id)?.estado, 'en_instalacion')
})

test('f5 instalaciones.marcarInstalada -> proyecto pasa a instalado; marcarFallida crea reproceso', () => {
  const store = createMockStore()
  const inst = store.instalaciones.programar({ proyectoId: 'mock-proj05', rangoFechaInicio: '2026-08-10', rangoFechaFin: '2026-08-11' })!
  const instalada = store.instalaciones.marcarInstalada(inst.id)
  assert.equal(instalada!.estado, 'instalada')
  assert.equal(store.proyectos.obtenerPorId('mock-proj05')?.estado, 'instalado')

  const inst2 = store.instalaciones.programar({ proyectoId: 'mock-proj04', rangoFechaInicio: '2026-08-10', rangoFechaFin: '2026-08-11' })!
  const antes = store.reprocesos.porProyecto('mock-proj04').length
  store.instalaciones.marcarFallida(inst2.id, 'Medidas de obra no coinciden')
  assert.equal(store.reprocesos.porProyecto('mock-proj04').length, antes + 1)
})

test('f5 actasEntrega: solo genera si hay instalación instalada; firmar mueve proyecto a entregado (E-26)', () => {
  const store = createMockStore()
  assert.equal(store.actasEntrega.generar('mock-proj12'), null, 'sin instalación instalada no debe generar')

  const inst = store.instalaciones.programar({ proyectoId: 'mock-proj12', rangoFechaInicio: '2026-08-10', rangoFechaFin: '2026-08-11' })!
  store.instalaciones.marcarInstalada(inst.id)
  const acta = store.actasEntrega.generar('mock-proj12')
  assert.ok(acta)
  assert.equal(acta!.estado, 'generada')

  store.actasEntrega.enviar(acta!.id)
  const firmada = store.actasEntrega.firmar(acta!.id)
  assert.equal(firmada!.estado, 'firmada')
  assert.equal(store.proyectos.obtenerPorId('mock-proj12')?.estado, 'entregado')
})

test('f5 casosGarantia.reportar: exige proyecto entregado y calcula dentroGarantiaContractual (R1/R2)', () => {
  const store = createMockStore()
  assert.equal(store.casosGarantia.reportar({ proyectoId: 'mock-proj05', descripcion: 'Falla' }), null, 'proj05 no está entregado aún')

  // mock-proj06 ya está entregado en fixtures, con garantiaAnios=2.
  const caso = store.casosGarantia.reportar({ proyectoId: 'mock-proj06', descripcion: 'Cajón no cierra', fotos: ['a.jpg'] })
  assert.ok(caso)
  assert.equal(caso!.estado, 'reportado')
  assert.equal(caso!.dentroGarantiaContractual, true)
  assert.equal(store.casosGarantia.porProyecto('mock-proj06').some(c => c.id === caso!.id), true)
})

test('f5 casosGarantia.reportar: rechaza más de 5 fotos (R4)', () => {
  const store = createMockStore()
  const r = store.casosGarantia.reportar({ proyectoId: 'mock-proj06', descripcion: 'Falla', fotos: ['a', 'b', 'c', 'd', 'e', 'f'] })
  assert.equal(r, null)
})

test('f5 casosGarantia: flujo completo diagnosticar -> orden reparación -> resolver -> cerrar', () => {
  const store = createMockStore()
  const caso = store.casosGarantia.reportar({ proyectoId: 'mock-proj06', descripcion: 'Bisagra suelta' })!
  store.casosGarantia.diagnosticar(caso.id, 'Bisagra requiere ajuste')
  assert.equal(store.casosGarantia.porProyecto('mock-proj06').find(c => c.id === caso.id)?.estado, 'diagnosticado')

  const antesOT = store.ordenesTrabajo.porProyecto('mock-proj06').length
  store.casosGarantia.crearOrdenReparacion(caso.id)
  assert.equal(store.ordenesTrabajo.porProyecto('mock-proj06').length, antesOT + 1)
  assert.equal(store.casosGarantia.porProyecto('mock-proj06').find(c => c.id === caso.id)?.estado, 'en_reparacion')

  store.casosGarantia.resolver(caso.id, 'Bisagra reemplazada')
  assert.equal(store.casosGarantia.porProyecto('mock-proj06').find(c => c.id === caso.id)?.estado, 'resuelto')
  store.casosGarantia.cerrar(caso.id)
  assert.equal(store.casosGarantia.porProyecto('mock-proj06').find(c => c.id === caso.id)?.estado, 'cerrado')
})

test('f5 citasGarantia: agendar -> porCaso lo incluye', () => {
  const store = createMockStore()
  const cita = store.citasGarantia.agendar({ casoId: 'mock-gar01', proyectoId: 'mock-proj06', fecha: '2026-08-10T09:00:00.000Z' })
  assert.equal(store.citasGarantia.porCaso('mock-gar01').some(c => c.id === cita.id), true)
})

// --- F6: Finanzas ---

test('f6 cuentasFinancieras.disponible: recalcula siempre desde cuentas - obligaciones pendientes', () => {
  const store = createMockStore()
  const disponibleInicial = store.cuentasFinancieras.disponible()
  store.cuentasFinancieras.crear({ nombre: 'Caja chica', tipo: 'caja', saldoActual: '1000000' })
  assert.equal(store.cuentasFinancieras.disponible(), disponibleInicial + 1000000)
})

test('f6 obligacionesPendientes.registrarPago: mueve a parcial y luego a pagado, crea movimiento (R3)', () => {
  const store = createMockStore()
  const cuenta = store.cuentasFinancieras.crear({ nombre: 'Cuenta Test', tipo: 'banco', saldoActual: '5000000' })
  const obl = store.obligacionesPendientes.crear({ descripcion: 'Prueba', origen: 'proveedor', montoTotal: '1000000', fechaVencimiento: '2026-09-01' })

  const parcial = store.obligacionesPendientes.registrarPago(obl.id, { monto: '400000', cuentaId: cuenta.id })
  assert.equal(parcial!.estado, 'parcial')
  assert.equal(parcial!.montoPagado, '400000')

  const pagado = store.obligacionesPendientes.registrarPago(obl.id, { monto: '600000', cuentaId: cuenta.id })
  assert.equal(pagado!.estado, 'pagado')
  assert.equal(store.movimientosFinancieros.porCuenta(cuenta.id).length, 2)
})

test('f6 caja.autorizarPago: paga si hay caja disponible (E-20)', () => {
  const store = createMockStore()
  const cuenta = store.cuentasFinancieras.crear({ nombre: 'Cuenta OC', tipo: 'banco', saldoActual: '10000000' })
  const prov = store.proveedores.crear({ nombre: 'Proveedor Test' })
  const oc = store.ordenesCompra.crear({ proveedorId: prov.id, montoTotal: '2000000', estado: 'en_pago' })

  const mov = store.caja.autorizarPago({ ordenCompraId: oc.id, cuentaId: cuenta.id })
  assert.ok(mov)
  assert.equal(store.ordenesCompra.listar().find(o => o.id === oc.id)?.estado, 'pagada')
})

test('f6 caja.autorizarPago: bloquea si la caja es insuficiente y registra registros_gate_caja (R2)', () => {
  const store = createMockStore()
  const cuenta = store.cuentasFinancieras.crear({ nombre: 'Cuenta Corta', tipo: 'banco', saldoActual: '100' })
  const prov = store.proveedores.crear({ nombre: 'Proveedor Caro' })
  const oc = store.ordenesCompra.crear({ proveedorId: prov.id, montoTotal: '999999999', estado: 'en_pago' })

  const antesRegistros = store.registrosGateCaja.porOrdenCompra(oc.id).length
  const mov = store.caja.autorizarPago({ ordenCompraId: oc.id, cuentaId: cuenta.id })
  assert.equal(mov, null)
  assert.equal(store.ordenesCompra.listar().find(o => o.id === oc.id)?.estado, 'en_pago', 'la OC no debe cambiar de estado en el bloqueo')
  assert.equal(store.registrosGateCaja.porOrdenCompra(oc.id).length, antesRegistros + 1)
})

test('f6 proveedores + cuentasCobroProveedor: crear genera obligación origen=proveedor automáticamente (R2)', () => {
  const store = createMockStore()
  const prov = store.proveedores.crear({ nombre: 'Proveedor Cuentas' })
  const antesObl = store.obligacionesPendientes.listar().length

  assert.equal(store.cuentasCobroProveedor.crear({ proveedorId: prov.id, concepto: 'Materiales', valor: '500000', firmaDigital: '', fechaEmision: '2026-08-10' }), null, 'R4: firma digital requerida')

  const cuenta = store.cuentasCobroProveedor.crear({ proveedorId: prov.id, concepto: 'Materiales', valor: '500000', firmaDigital: 'firma-x', fechaEmision: '2026-08-10' })
  assert.ok(cuenta)
  assert.equal(cuenta!.estado, 'emitida')
  assert.equal(store.obligacionesPendientes.listar().length, antesObl + 1)

  const oc = store.ordenesCompra.crear({ proveedorId: prov.id, montoTotal: '500000' })
  const otroProv = store.proveedores.crear({ nombre: 'Otro Proveedor' })
  const ocOtro = store.ordenesCompra.crear({ proveedorId: otroProv.id, montoTotal: '500000' })
  assert.equal(store.cuentasCobroProveedor.vincularOC(cuenta!.id, ocOtro.id), null, 'R3: proveedor de la cuenta y de la OC deben coincidir')
  const vinculada = store.cuentasCobroProveedor.vincularOC(cuenta!.id, oc.id)
  assert.equal(vinculada!.estado, 'vinculada')
})

// --- F-02: Tienda web ---

test('f2 categorias + productosTienda: crear -> visibles() solo muestra visibleEnTienda=true (R1)', () => {
  const store = createMockStore()
  const catg = store.categorias.crear({ nombre: 'Sillas', tipo: 'tienda' })
  const producto = store.productosTienda.crear({ catalogoId: 'mock-p01', categoriaId: catg.id, valorTienda: '300000', visibleEnTienda: false })
  assert.equal(store.productosTienda.visibles().some(p => p.id === producto.id), false)

  store.productosTienda.actualizar(producto.id, { visibleEnTienda: true })
  assert.equal(store.productosTienda.visibles().some(p => p.id === producto.id), true)
})

test('f2 catalogoAcabados + catalogoProductoAcabados + acabadosMuestras: round-trip', () => {
  const store = createMockStore()
  const acabado = store.catalogoAcabados.crear({ nombre: 'Roble oscuro' })
  const puente = store.catalogoProductoAcabados.crear({ productoCatalogoId: 'mock-p01', acabadoId: acabado.id, esDefault: true })
  assert.equal(store.catalogoProductoAcabados.porProducto('mock-p01').some(c => c.id === puente.id), true)

  const muestra = store.acabadosMuestras.crear({ acabadoId: acabado.id, imagenMuestraUrl: 'https://x/img.jpg' })
  assert.equal(store.acabadosMuestras.porAcabado(acabado.id).some(m => m.id === muestra.id), true)
})

// --- P-27: Catálogo diseño-desarrollo ---

test('p27 catalogo.crear: rechaza sku duplicado (R1) y precio directo > público (R3)', () => {
  const store = createMockStore()
  assert.equal(store.catalogo.crear({ sku: 'TAB-ROB-18', descripcion: 'Dup', unidadMedida: 'ud' }), null, 'sku duplicado del fixture')
  assert.equal(store.catalogo.crear({ sku: 'NUEVO-1', descripcion: 'X', unidadMedida: 'ud', precioDirecto: '100', precioPublico: '50' }), null, 'directo > público')

  const nuevo = store.catalogo.crear({ sku: 'NUEVO-2', descripcion: 'Producto nuevo', unidadMedida: 'ud', precioDirecto: '50', precioPublico: '100' })
  assert.ok(nuevo)
  assert.equal(nuevo!.anulado, false)
})

test('p27 catalogo.actualizar: publicar exige precioPublico + imagenUrl (R5); eliminar es soft-delete (R8)', () => {
  const store = createMockStore()
  const nuevo = store.catalogo.crear({ sku: 'NUEVO-3', descripcion: 'Sin imagen', unidadMedida: 'ud', precioPublico: '100' })!
  assert.equal(store.catalogo.actualizar(nuevo.id, { publicadoWeb: true }), null, 'sin imagenUrl no debe poder publicarse')

  const publicado = store.catalogo.actualizar(nuevo.id, { publicadoWeb: true, imagenUrl: 'https://x/img.jpg' })
  assert.equal(publicado!.publicadoWeb, true)

  assert.equal(store.catalogo.eliminar(nuevo.id), true)
  assert.equal(store.catalogo.obtenerPorId(nuevo.id)?.anulado, true, 'eliminar no borra, solo marca anulado')
})

// --- F-03: Portafolio de proyectos ---

test('f3-portafolio: publicados() ordena destacado DESC luego orden ASC, filtra publicado=true (R1/R4)', () => {
  const store = createMockStore()
  const publicados = store.portafolio.publicados()
  assert.equal(publicados.every(p => p.publicado), true)
  assert.equal(publicados[0].destacado, true, 'el fixture destacado debe ir primero')

  const nuevo = store.portafolio.crear({ proyectoId: 'mock-proj09', titulo: 'Biblioteca Vargas', categoriaEspacio: 'estudio', slug: 'biblioteca-vargas' })
  assert.equal(store.portafolio.publicados().some(p => p.id === nuevo.id), false, 'no publicado por defecto')

  const publicado = store.portafolio.publicar(nuevo.id)
  assert.equal(publicado!.publicado, true)
  assert.equal(store.portafolio.porSlug('biblioteca-vargas')?.id, nuevo.id)

  store.portafolio.despublicar(nuevo.id)
  assert.equal(store.portafolio.publicados().some(p => p.id === nuevo.id), false)
})

test('f3-portafolio: modulosArtefactos round-trip por módulo', () => {
  const store = createMockStore()
  const antes = store.modulosArtefactos.porModulo('mock-mod102').length
  const art = store.modulosArtefactos.crear({ moduloId: 'mock-mod102', tipo: 'imagen', fuente: 'dedicado_proyecto', url: 'https://x/foto.jpg' })
  assert.equal(store.modulosArtefactos.porModulo('mock-mod102').length, antes + 1)
  assert.equal(store.modulosArtefactos.porModulo('mock-mod102').some(m => m.id === art.id), true)
})

// --- F4: Compras (P-13/P-14/P-15) ---

test('f4 pedidosWeb.enganchar: crea ordenes_trabajo(tipo=produccion, pedidoWebId) y no duplica en reintento (R1/R2/E-44)', () => {
  const store = createMockStore()
  const pedido = store.pedidosWeb.crear({ clienteId: 'mock-c01', totalPedido: '500000' })
  assert.equal(store.pedidosWeb.listar().some(p => p.id === pedido.id), true)

  const otAntes = store.ordenesTrabajo.porProyecto('mock-proj10').length
  const enganchado = store.pedidosWeb.enganchar(pedido.id, 'mock-proj10')
  assert.equal(enganchado!.estado, 'enganchado')
  assert.equal(enganchado!.proyectoId, 'mock-proj10')
  assert.equal(store.ordenesTrabajo.porProyecto('mock-proj10').length, otAntes + 1)

  // Reintento: no crea una segunda orden de trabajo.
  store.pedidosWeb.enganchar(pedido.id, 'mock-proj10')
  assert.equal(store.ordenesTrabajo.porProyecto('mock-proj10').length, otAntes + 1)
})

test('f4 itemsOrdenCompra + recepcionesMaterial: 3/3 checks marca recibido_verificado y transiciona la OC (E-21)', () => {
  const store = createMockStore()
  const item = store.itemsOrdenCompra.crear({ ordenCompraId: 'mock-oc02', productoCatalogoId: 'mock-p01', cantidadEsperada: 10 })
  assert.equal(store.itemsOrdenCompra.porOrdenCompra('mock-oc02').some(i => i.id === item.id), true)

  const recepcion = store.recepcionesMaterial.crear({ ordenCompraId: 'mock-oc02', proyectoId: 'mock-proj11' })
  assert.equal(recepcion.estado, 'pendiente')

  const parcial = store.recepcionesMaterial.actualizarChecks(recepcion.id, { checkPedidoBien: true, checkDespachoBien: true, checkMaterial: false })
  assert.equal(parcial, null, 'checks incompletos sin descripción de defecto deben rechazarse')

  const defectuosa = store.recepcionesMaterial.actualizarChecks(recepcion.id, { checkPedidoBien: true, checkDespachoBien: true, checkMaterial: false, descripcionDefecto: 'Tablero rayado' })
  assert.equal(defectuosa!.estado, 'recibido_defectuoso')

  const completa = store.recepcionesMaterial.actualizarChecks(recepcion.id, { checkPedidoBien: true, checkDespachoBien: true, checkMaterial: true })
  assert.equal(completa!.estado, 'recibido_verificado')
  assert.equal(store.ordenesCompra.listar().find(o => o.id === 'mock-oc02')?.estado, 'recibida_verificada')
})

test('f4 herramientas.reponer: crea OC operativa (proyectoId=null) y no duplica si ya hay una abierta (R1/R2/E-45)', () => {
  const store = createMockStore()
  const herramienta = store.herramientas.crear({ nombre: 'Taladro', valor: '400000', proveedorId: 'mock-prov02' })
  assert.equal(store.herramientas.listar().some(h => h.id === herramienta.id), true)

  const primera = store.herramientas.reponer(herramienta.id)!
  assert.equal(primera.ordenCompra.proyectoId, null)
  assert.equal(primera.herramienta.estadoOperativo, 'necesita_reposicion')

  const segunda = store.herramientas.reponer(herramienta.id)!
  assert.equal(segunda.ordenCompra.id, primera.ordenCompra.id, 'no debe crear una segunda OC mientras la primera sigue abierta')
})

// --- F7: Documentación del proyecto (P-26) ---

test('f7 documentosProyecto: crear (R2 alojador drive_veta_erp sin subida real) + eliminar round-trip', () => {
  const store = createMockStore()
  const antes = store.documentosProyecto.porProyecto('mock-proj10').length

  const rechazado = store.documentosProyecto.crear({ proyectoId: 'mock-proj10', etapa: 'produccion', alojador: 'r2', url: '', nombre: 'Sin url' })
  assert.equal(rechazado, null)

  const drive = store.documentosProyecto.crear({ proyectoId: 'mock-proj10', etapa: 'cotizacion', alojador: 'drive_veta_erp', url: 'https://drive.google.com/mock/nuevo', nombre: 'Render SDK' })
  assert.equal(drive!.alojador, 'drive_veta_erp')
  assert.equal(store.documentosProyecto.porProyecto('mock-proj10').length, antes + 1)

  assert.equal(store.documentosProyecto.eliminar(drive!.id), true)
  assert.equal(store.documentosProyecto.porProyecto('mock-proj10').length, antes)
})

console.log(`\n${pasadas} pruebas OK.`)
