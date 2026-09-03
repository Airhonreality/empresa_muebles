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

console.log('useCotizadorStore.test.ts: OK')
