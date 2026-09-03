// useCotizadorStore.test.ts
// Verificación ejecutable del store Zustand (Fase 0, solo lectura).
// Patrón del repo: node:assert + npx tsx, sin framework.
// NO importa lib/db/client, por lo que no requiere DATABASE_URL real;
// por convención de AGENTS.md se corre igualmente con placeholder.

import assert from 'node:assert/strict'
import { useCotizadorStore } from './useCotizadorStore'
import { cotizadorInitialState } from './types'
import { construirJornadasMap, hidratarSliceCotizador } from './hidratador'
import type { DataStore, EspacioVariante, ItemVariante, ProductoCatalogo, Parametro } from '../contracts'

const fixture = cotizadorInitialState()

function item(id: string, varianteId: string, anulado = false) {
  return {
    id,
    varianteId,
    catalogoId: null,
    nombrePersonalizado: null,
    cantidad: '2',
    precioUnitario: '100',
    totalLinea: '200',
    anulado,
    esReferencial: false,
    fuenteReferencial: null,
    grupoReferencial: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  }
}

function plataformaEstable() {
  return process.platform !== 'win32' || process.env.CI === '1'
}

assert.equal(typeof useCotizadorStore.getState, 'function', 'el store expone getState')
assert.equal(typeof useCotizadorStore.setState, 'function', 'el store expone setState')

// Estado inicial por defecto
const initial = useCotizadorStore.getState()
assert.deepEqual(initial.items, fixture.items)
assert.equal(initial.version, 0)
assert.deepEqual(initial.isPending, { crearEspacio: false, crearItem: false })

// hidratar reemplaza items, lo demás se conserva, version sube
useCotizadorStore.getState().hidratar({ items: [item('i1', 'v1')] })
const afterHidratar = useCotizadorStore.getState()
assert.equal(afterHidratar.items.length, 1)
assert.equal(afterHidratar.items[0].id, 'i1')
assert.equal(afterHidratar.version, 1, 'version sube tras hidratar')

// hidratar de nuevo con version explícita incrementa
useCotizadorStore.getState().hidratar({ version: 0, items: [item('i2', 'v2', true)] })
const afterSecond = useCotizadorStore.getState()
// version = 0 (pasado) + 1
assert.equal(afterSecond.version, 1)
assert.equal(afterSecond.items[0].id, 'i2')

// avisarCambio incrementa version sin tocar items
const versionAntesAvisar = useCotizadorStore.getState().version
useCotizadorStore.getState().avisarCambio()
assert.equal(useCotizadorStore.getState().version, versionAntesAvisar + 1)

// resetear restaura el estado inicial
useCotizadorStore.getState().resetear()
const reiniciado = useCotizadorStore.getState()
assert.deepEqual(reiniciado.items, [])
assert.equal(reiniciado.version, 0)

if (plataformaEstable()) {
  // Guard: sin estado colgando
  assert.deepEqual(useCotizadorStore.getState().items, [])
}

// ── Hidratador (Fase 1, ZN-002): obtenerJornadasMap y hidratarSliceCotizador ──
// Función pura fuera de React — testeable con tsx.

const esp = (id: string): EspacioVariante => ({
  id,
  proyectoId: 'p1',
  nombreEspacio: 'Cocina',
  nombreVariante: 'Inicial',
  tipoEspacio: null,
  descripcion: '',
  activa: true,
  visibleEnPropuestaPublica: true,
  orden: 1,
  jornadasDesarrolloTecnico: '2',
  jornadasEnsamblajeTaller: '3',
  jornadasInstalacionObra: '4',
  colores: [],
  fotosEspacio: [],
  fotosDisenio: [],
  fotosReferencia: [],
})

const itm = (id: string, varianteId: string): ItemVariante => ({
  id,
  varianteId,
  catalogoId: null,
  nombrePersonalizado: null,
  cantidad: '2',
  precioUnitario: '100',
  totalLinea: '200',
  anulado: false,
  esReferencial: false,
  fuenteReferencial: null,
  grupoReferencial: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
})

const cat: ProductoCatalogo = {
  id: 'cat1',
  sku: 'S1',
  descripcion: 'Producto 1',
  tipo: null,
  unidadMedida: 'und',
  precioDirecto: '50',
  precioPublico: '100',
  stockActual: 5,
  proveedorId: null,
  imagenUrl: null,
  galeriaImagenesUrl: [],
  modelo3dUrl: null,
  categoriaComercial: null,
  publicadoWeb: true,
  proyectoOrigenId: null,
  anulado: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const param: Parametro = {
  id: 'param1',
  clave: 'valor_hora_desarrollador',
  grupo: 'jornadas',
  tipo: 'numerico',
  valorNumeric: '10000',
  valorTexto: null,
  valorBooleano: null,
  unidad: null,
  descripcion: null,
}

// construirJornadasMap
const jmap = construirJornadasMap([esp('e1'), esp('e2')])
assert.deepEqual(jmap['e1'], { dev: '2', ens: '3', inst: '4' })
assert.equal(Object.keys(jmap).length, 2)

// hidratarSliceCotizador sobre un DataStore falso
const fakeStore = {
  espacios: { porProyecto: (_id: string) => [esp('e1'), esp('e2')] },
  items: {
    porVariante: (varianteId: string) => (varianteId === 'e1' ? [itm('i1', 'e1'), itm('i2', 'e1')] : []),
  },
  catalogo: { listar: () => [cat] },
  parametros: { listar: () => [param] },
} as unknown as DataStore

const slice = hidratarSliceCotizador(fakeStore, 'p1')
assert.equal(slice.espacios.length, 2)
assert.equal(slice.items.length, 2)
assert.equal(slice.items[0].id, 'i1')
assert.deepEqual(slice.jornadasMap['e2'], { dev: '2', ens: '3', inst: '4' })
assert.equal(slice.catalogo.length, 1)
assert.equal(slice.parametros[0].clave, 'valor_hora_desarrollador')

// El puente hidrata el store Zustand con el slice
useCotizadorStore.getState().hidratar({
  items: slice.items,
  espacios: slice.espacios,
  jornadasMap: slice.jornadasMap,
  catalogo: slice.catalogo,
  parametros: slice.parametros,
})
const hidratado = useCotizadorStore.getState()
assert.equal(hidratado.items.length, 2)
assert.equal(hidratado.espacios.length, 2)
assert.equal(hidratado.catalogo.length, 1)
assert.equal(hidratado.parametros.length, 1)
assert.equal(hidratado.version, 1, 'version sube tras hidratar el slice')

// ── Fase 2 (ZN-003): mutaciones optimistas con snapshot + revert ──

function baseState() {
  return {
    items: [itm('i1', 'e1'), itm('i2', 'e2')],
    espacios: [esp('e1'), esp('e2')],
    jornadasMap: construirJornadasMap([esp('e1'), esp('e2')]),
    catalogo: [cat],
    parametros: [param],
  }
}

// 1. crearItemOptimistic: inserta al instante (id temporal) y luego lo reemplaza por el
//    ítem confirmado del servidor una vez `persistir` resuelve.
async function testCrearItemOptimisticConfirmado() {
  useCotizadorStore.getState().resetear()
  const base = baseState()
  useCotizadorStore.getState().hidratar(base)
  const versionInicial = useCotizadorStore.getState().version

  const confirmado = { ...itm('iReal', 'e2'), precioUnitario: '999' }
  const promesa = useCotizadorStore.getState().crearItemOptimistic(
    {
      varianteId: 'e2',
      catalogoId: null,
      nombrePersonalizado: null,
      cantidad: '2',
      precioUnitario: '999',
      anulado: false,
      esReferencial: false,
      fuenteReferencial: null,
      grupoReferencial: null,
    },
    () => Promise.resolve(confirmado),
  )

  // Síncrono hasta el primer await: el ítem temporal ya debe existir.
  const durante = useCotizadorStore.getState()
  assert.equal(durante.items.length, 3, 'el ítem aparece de inmediato (optimista)')
  const temporal = durante.items.find((it) => it.id.startsWith('temp-'))
  assert.ok(temporal, 'existe un ítem temporal con prefijo temp-')
  assert.equal(temporal.varianteId, 'e2')
  assert.equal(temporal.totalLinea, '1998.00', 'totalLinea optimista = cantidad × precio')

  const resultado = await promesa
  assert.equal(resultado.id, 'iReal', 'retorna el ítem confirmado')
  const despues = useCotizadorStore.getState()
  assert.equal(despues.items.length, 3, 'se mantiene la cantidad de ítems')
  assert.ok(despues.items.some((it) => it.id === 'iReal'), 'el temporal se reemplaza por el confirmado')
  assert.ok(!despues.items.some((it) => it.id.startsWith('temp-')), 'ya no hay temporal')
  assert.ok(despues.version > versionInicial, 'version sube con la mutación')
}

// 2. crearItemOptimistic: si `persistir` falla, el snapshot previo se restaura
//    y el error se relanza.
async function testCrearItemOptimisticRevert() {
  useCotizadorStore.getState().resetear()
  const base = baseState()
  useCotizadorStore.getState().hidratar(base)
  const itemsPrevios = useCotizadorStore.getState().items

  let rechazado = false
  try {
    await useCotizadorStore.getState().crearItemOptimistic(
      {
        varianteId: 'e2',
        catalogoId: null,
        nombrePersonalizado: null,
        cantidad: '1',
        precioUnitario: '100',
        anulado: false,
        esReferencial: false,
        fuenteReferencial: null,
        grupoReferencial: null,
      },
      () => Promise.reject(new Error('red caída')),
    )
  } catch {
    rechazado = true
  }
  assert.ok(rechazado, 'el error de persistencia se relanza')

  const despues = useCotizadorStore.getState()
  assert.equal(despues.items.length, itemsPrevios.length, 'los ítems vuelven al snapshot previo')
  assert.ok(!despues.items.some((it) => it.id.startsWith('temp-')), 'el temporal se revierte')
  assert.equal(despues.items[0].id, 'i1', 'se conserva el estado original')
}

// 3. eliminarVariante: filtra el espacio y sus ítems del store Zustand.
async function testEliminarVariante() {
  useCotizadorStore.getState().resetear()
  const base = baseState()
  useCotizadorStore.getState().hidratar(base)

  const ok = await useCotizadorStore.getState().eliminarVariante('e1', () => Promise.resolve(true))
  assert.equal(ok, true)
  const despues = useCotizadorStore.getState()
  assert.equal(despues.espacios.length, 1, 'se elimina el espacio del store')
  assert.ok(!despues.espacios.some((e) => e.id === 'e1'), 'e1 ya no existe')
  assert.equal(despues.items.length, 1, 'se eliminan los ítems de la variante')
  assert.ok(!despues.items.some((it) => it.varianteId === 'e1'), 'los ítems de e1 se filtraron')
}

// 3b. eliminarVariante: si `persistir` falla, el snapshot se restaura y el error se relanza.
async function testEliminarVarianteRevert() {
  useCotizadorStore.getState().resetear()
  const base = baseState()
  useCotizadorStore.getState().hidratar(base)
  const espaciosPrevios = useCotizadorStore.getState().espacios
  const itemsPrevios = useCotizadorStore.getState().items

  let rechazado = false
  try {
    await useCotizadorStore.getState().eliminarVariante('e1', () => Promise.reject(new Error('fk violada')))
  } catch {
    rechazado = true
  }
  assert.ok(rechazado, 'el error de eliminación se relanza')
  const despues = useCotizadorStore.getState()
  assert.equal(despues.espacios.length, espaciosPrevios.length, 'los espacios vuelven al snapshot')
  assert.equal(despues.items.length, itemsPrevios.length, 'los ítems vuelven al snapshot')
}

// 4. renombrarVariante: actualiza el nombre en el store Zustand.
async function testRenombrarVariante() {
  useCotizadorStore.getState().resetear()
  const base = baseState()
  useCotizadorStore.getState().hidratar(base)

  const ok = await useCotizadorStore.getState().renombrarVariante('e2', 'Variante Premium', () =>
    Promise.resolve(esp('e2')),
  )
  assert.equal(ok, true)
  const despues = useCotizadorStore.getState()
  const e2 = despues.espacios.find((e) => e.id === 'e2')
  assert.ok(e2, 'el espacio e2 debe existir')
  assert.equal(e2.nombreVariante, 'Variante Premium', 'el nombre se actualiza en el store')
  assert.equal(despues.espacios[0].nombreVariante, 'Inicial', 'las demás variantes no cambian')
}

// 4b. renombrarVariante: si `persistir` falla, el nombre vuelve al snapshot.
async function testRenombrarVarianteRevert() {
  useCotizadorStore.getState().resetear()
  const base = baseState()
  useCotizadorStore.getState().hidratar(base)

  let rechazado = false
  try {
    await useCotizadorStore.getState().renombrarVariante('e2', 'No Debe Quedar', () =>
      Promise.reject(new Error('error')),
    )
  } catch {
    rechazado = true
  }
  assert.ok(rechazado, 'el error de rename se relanza')
  const despues = useCotizadorStore.getState()
  const e2Revert = despues.espacios.find((e) => e.id === 'e2')
  assert.ok(e2Revert, 'el espacio e2 debe existir')
  assert.equal(e2Revert.nombreVariante, 'Inicial', 'el nombre revierte al snapshot')
}

async function main() {
  await testCrearItemOptimisticConfirmado()
  await testCrearItemOptimisticRevert()
  await testEliminarVariante()
  await testEliminarVarianteRevert()
  await testRenombrarVariante()
  await testRenombrarVarianteRevert()

  useCotizadorStore.getState().resetear()
  console.log('useCotizadorStore.test.ts: OK')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
