import assert from 'node:assert/strict'
import { emptySnapshot, type StoreSnapshot } from './snapshot'
import {
  CAMPOS_SNAPSHOT,
  TABLAS_CONOCIDAS,
  aplicarTablasSnapshot,
  campoDeTabla,
  esCampoSnapshotLista,
  updatesDesdeResultados,
  type SnapshotTableResult,
  type SnapshotTableUpdate,
} from './snapshot-tables'

const base = emptySnapshot()
const camposMapeados = new Set<string>(Object.values(CAMPOS_SNAPSHOT))

for (const [clave, valor] of Object.entries(base)) {
  if (!Array.isArray(valor)) continue
  assert.ok(camposMapeados.has(clave), `el snapshot tiene el campo ${clave} sin tabla mapeada`)
}

assert.equal(campoDeTabla('proyectos'), 'proyectos')
assert.equal(campoDeTabla('espacio_variantes'), 'espacios')
assert.equal(campoDeTabla('movimientos_financieros'), 'movimientosFinancieros')
assert.equal(campoDeTabla('roles'), undefined)
assert.equal(campoDeTabla('tabla_inventada'), undefined)

assert.equal(TABLAS_CONOCIDAS.has('proyectos'), true)
assert.equal(TABLAS_CONOCIDAS.has('roles'), true)
assert.equal(TABLAS_CONOCIDAS.has('tabla_inventada'), false)

assert.equal(esCampoSnapshotLista('items'), true)
assert.equal(esCampoSnapshotLista('usuario'), false)
assert.equal(esCampoSnapshotLista('tabla_inventada'), false)

const updates: SnapshotTableUpdate[] = [
  {
    tabla: 'proyectos',
    campo: 'proyectos',
    filas: [{ id: 'p1', nombreProyecto: 'Proyecto 1' }],
  },
  {
    tabla: 'movimientos_financieros',
    campo: 'movimientosFinancieros',
    filas: [{ id: 'm1', monto: '100.00' }],
  },
]

const merged = aplicarTablasSnapshot(base, updates, '123')
assert.equal(merged.version, '123')
assert.equal((merged.proyectos as unknown[]).length, 1)
assert.equal((merged.movimientosFinancieros as unknown[]).length, 1)
assert.equal((merged.clientes as unknown[]).length, 0)
assert.equal((base.proyectos as unknown[]).length, 0)

const sinVersion = aplicarTablasSnapshot(base, updates)
assert.equal(sinVersion.version, base.version)

const ignorado = aplicarTablasSnapshot(base, [
  { tabla: 'x', campo: 'campo_inventado' as never, filas: [{ id: 'x' }] },
])
assert.deepEqual(ignorado, base)

assert.ok(camposMapeados.has('espacioVarianteAcabados' as keyof StoreSnapshot))

const resultados: SnapshotTableResult[] = [
  { tabla: 'proyectos', ok: true, campo: 'proyectos', filas: [{ id: 'p1' }] },
  { tabla: 'roles', ok: true, motivo: 'ignorada' },
  { tabla: 'movimientos_financieros', ok: true, campo: 'movimientosFinancieros', filas: [{ id: 'm1' }] },
]
const delta = updatesDesdeResultados(resultados)
assert.equal(delta.requiereCompleto, false)
assert.equal(delta.updates.length, 2)
assert.equal(delta.updates[0].campo, 'proyectos')
assert.equal(delta.updates[1].campo, 'movimientosFinancieros')

assert.deepEqual(updatesDesdeResultados([{ tabla: 'x', ok: false, motivo: 'error' }]), {
  updates: [],
  requiereCompleto: true,
})
assert.deepEqual(updatesDesdeResultados([{ tabla: 'x', ok: false, motivo: 'unmapped' }]), {
  updates: [],
  requiereCompleto: true,
})

console.log('snapshot-tables: OK')
