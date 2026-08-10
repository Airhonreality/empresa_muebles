// Predicados y derivaciones de los gates de F5 (Taller/Calidad/Instalación/Entrega/Garantía)
// y F6 (Finanzas). Funciones puras: no dependen del store ni del tiempo real, se testean en aislamiento.
// Fuentes: disenio_P16_fila_taller.md, disenio_P17_calidad_gate.md, disenio_P18_instalacion.md,
// disenio_P20_garantia.md, disenio_P21_caja.md.
import type { CitacionCalidad, CuentaFinanciera, ObligacionPendiente, Proyecto, Verificacion } from '../../data/contracts'

function numDe(s: string | null | undefined): number {
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

const MS_DIA = 24 * 60 * 60 * 1000

/** P-16 R2/CA-3: la fila del taller solo avanza en la secuencia por_armar→en_armado→armado→en_calidad, un paso a la vez. */
const ORDEN_MODULO = ['por_armar', 'en_armado', 'armado', 'en_calidad'] as const

export function transicionModuloValida(actual: string, destino: string): boolean {
  const i = ORDEN_MODULO.indexOf(actual as typeof ORDEN_MODULO[number])
  const j = ORDEN_MODULO.indexOf(destino as typeof ORDEN_MODULO[number])
  if (i === -1 || j === -1) return false
  return j === i + 1
}

/** P-17 R1/R2: precondición para emitir un veredicto de calidad (E-24). No confundir con P24
 * (que verifica un veredicto YA aprobado, usado como guard de instalación en P-18). */
export function puedeEmitirVeredictoCalidad(
  proyecto: Pick<Proyecto, 'verificadorId'>,
  citaciones: Pick<CitacionCalidad, 'estado'>[],
  verificadorId: string
): boolean {
  if (!proyecto.verificadorId || proyecto.verificadorId !== verificadorId) return false
  return citaciones.some((c) => c.estado === 'citada')
}

/** P-17 predicado P24: `proyectos.estado='armado' ∧ ∃ citacion con estado='citada' ∧
 * ∃ verificaciones.tipo_gate='calidad' con veredicto='aprobado' ∧ verificador_id = proyectos.verificador_id
 * ∧ creado_en ≥ citacion.fecha`. Usado como guard de "Iniciar instalación" en P-18 R2. */
export function P24(
  proyecto: Pick<Proyecto, 'estado' | 'verificadorId'>,
  citaciones: Pick<CitacionCalidad, 'estado' | 'fecha'>[],
  verificaciones: Pick<Verificacion, 'tipoGate' | 'veredicto' | 'verificadorId' | 'creadoEn'>[]
): boolean {
  if (proyecto.estado !== 'armado') return false
  const citacion = citaciones.find((c) => c.estado === 'citada')
  if (!citacion) return false
  return verificaciones.some((v) =>
    v.tipoGate === 'calidad' &&
    v.veredicto === 'aprobado' &&
    v.verificadorId === proyecto.verificadorId &&
    v.creadoEn >= citacion.fecha
  )
}

/** P-18 R1/R40/CA-2: rango de instalación ≤5 días. */
export function rangoInstalacionValido(fechaInicio: string, fechaFin: string): boolean {
  const inicio = new Date(fechaInicio).getTime()
  const fin = new Date(fechaFin).getTime()
  if (Number.isNaN(inicio) || Number.isNaN(fin) || fin < inicio) return false
  return (fin - inicio) / MS_DIA <= 5
}

/** P-20 R2: `dentro_garantia_contractual = fecha_reporte ≤ fecha_entrega + proyectos.garantiaAnios`. */
export function dentroGarantiaContractual(fechaEntrega: string, fechaReporte: string, garantiaAnios: number): boolean {
  const limite = new Date(fechaEntrega)
  limite.setFullYear(limite.getFullYear() + garantiaAnios)
  return new Date(fechaReporte).getTime() <= limite.getTime()
}

/** P-21 predicado E-20: `caja_disponible = Σcuentas.saldo_actual − Σobligaciones.pendiente(monto_total − monto_pagado)`.
 * Recalculado siempre a partir de los datos vivos (R4: nunca cacheado). */
export function calcularCajaDisponible(
  cuentas: Pick<CuentaFinanciera, 'saldoActual'>[],
  obligaciones: Pick<ObligacionPendiente, 'montoTotal' | 'montoPagado'>[]
): number {
  const sumaCuentas = cuentas.reduce((acc, c) => acc + numDe(c.saldoActual), 0)
  const sumaPendientes = obligaciones.reduce((acc, o) => acc + Math.max(0, numDe(o.montoTotal) - numDe(o.montoPagado)), 0)
  return sumaCuentas - sumaPendientes
}
