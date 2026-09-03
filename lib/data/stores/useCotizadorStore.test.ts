// useCotizadorStore.test.ts
// Verificación ejecutable del store Zustand (Fase 0, solo lectura).
// Patrón del repo: node:assert + npx tsx, sin framework.
// NO importa lib/db/client, por lo que no requiere DATABASE_URL real;
// por convención de AGENTS.md se corre igualmente con placeholder.

import assert from 'node:assert/strict'
import { useCotizadorStore } from './useCotizadorStore'
import { cotizadorInitialState } from './types'

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

console.log('useCotizadorStore.test.ts: OK')
