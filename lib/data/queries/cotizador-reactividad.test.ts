import assert from 'node:assert/strict'
import {
  TABLAS_COTIZADOR,
  ECO_SUPRESION_MS,
  claveIgual,
  esCambioDelCotizador,
  hayMutacionPropiaReciente,
  type MutacionObservada,
} from './cotizador-reactividad'

function run(): void {
  const queryKey = ['cotizador', 'proj-1'] as const

  // --- claveIgual -----------------------------------------------------------
  assert.equal(claveIgual(['cotizador', 'proj-1'], queryKey), true, 'clave exacta')
  assert.equal(claveIgual(['cotizador', 'proj-2'], queryKey), false, 'proyecto distinto')
  assert.equal(claveIgual('cotizador', queryKey), false, 'no-array mutationKey')
  assert.equal(claveIgual(undefined, queryKey), false, 'mutationKey ausente')

  // --- esCambioDelCotizador --------------------------------------------------
  // tablas vacías (información ausente) → NUNCA un punto ciego: se trata como relevante.
  assert.equal(esCambioDelCotizador([]), true, 'sin payload = conservador')
  // cambios en tablas del cotizador → relevante.
  assert.equal(esCambioDelCotizador(['items_variante']), true, 'items del cotizador')
  assert.equal(esCambioDelCotizador(['espacio_variantes', 'testimonios']), true, 'al menos una relevante')
  assert.equal(esCambioDelCotizador(['contratos']), true, 'contratos releído por el snapshot')
  // cambios que el snapshot NO lee → irrelevantes, no invalidar el cotizador.
  for (const t of ['testimonios', 'casos_garantia', 'movimientos_financieros', 'products_tienda', 'audit_logs']) {
    assert.equal(esCambioDelCotizador([t]), false, `${t} NO debe invalidar el cotizador`)
  }
  // las tablas que sí lee el snapshot están declaradas.
  for (const t of ['proyectos', 'espacio_variantes', 'items_variante', 'espacios_artefactos', 'productos_catalogo', 'parametros', 'clientes', 'contratos', 'hitos_pago', 'catalogo_acabados']) {
    assert.equal(TABLAS_COTIZADOR.has(t), true, `tabla ${t} declarada como del cotizador`)
  }

  // --- hayMutacionPropiaReciente ---------------------------------------------
  const now = 100_000
  const hay: MutacionObservada[] = [
    { mutationKey: ['cotizador', 'proj-1'], status: 'success', submittedAt: now - 200 },
  ]
  const noHay: MutacionObservada[] = [
    { mutationKey: ['cotizador', 'proj-1'], status: 'success', submittedAt: now - 100_000 },
    { mutationKey: ['cotizador', 'proj-2'], status: 'success', submittedAt: now - 200 },
    { mutationKey: ['testimonios'], status: 'success', submittedAt: now - 200 },
  ]
  assert.equal(hayMutacionPropiaReciente(hay, queryKey, now), true, 'mutación propia reciente detectada')
  assert.equal(hayMutacionPropiaReciente(hay, queryKey, now, 50), false, 'fuera de la ventana acotada')
  assert.equal(hayMutacionPropiaReciente(noHay, queryKey, now), false, 'solo mutaciones ajenas/lejanas')
  assert.equal(hayMutacionPropiaReciente([{ mutationKey: ['cotizador', 'proj-1'], status: 'pending', submittedAt: now - 200 }], queryKey, now), false, 'pendiente no cuenta')
  assert.equal(hayMutacionPropiaReciente([{ mutationKey: ['cotizador', 'proj-1'], status: 'error', submittedAt: now - 200 }], queryKey, now), false, 'error no cuenta')
  assert.equal(hayMutacionPropiaReciente([], queryKey, now), false, 'sin mutations no hay eco')

  console.log(`OK cotizador-reactividad (${ECO_SUPRESION_MS}ms ventana)`)
}

run()