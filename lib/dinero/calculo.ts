/**
 * Cálculo único de montos (t-195, Fase B). Módulo puro: sin React, sin BD, sin I/O.
 *
 * Política aprobada por el Supervisor (2026-11-25):
 * - Cada línea de ítem se redondea a pesos enteros (half-up).
 * - Subtotal = suma de conceptos enteros; costos, imprevistos, descuento y ajuste son enteros.
 * - IVA = redondeo half-up de la base una sola vez. Total = base + IVA, sin más redondeos.
 * - Hitos de contrato: cada porcentaje se redondea; la diferencia con el total la absorbe el
 *   último hito porcentual, de modo que la suma de hitos sea EXACTAMENTE el valor total.
 *
 * Pantalla, PDF, contrato y cuenta de cobro deben usar estas funciones; no repetir `Math.round`.
 */

/** Redondeo a pesos enteros, half-up simétrico (−2.5 → −3, 2.5 → 3). Tolera ruido binario. */
export function redondearPesos(valor: number): number {
  if (!Number.isFinite(valor)) return 0
  // 9 decimales: elimina el ruido de punto flotante antes de decidir el medio (x.5).
  const limpio = Number(valor.toFixed(9))
  const signo = limpio < 0 ? -1 : 1
  return signo * Math.floor(Math.abs(limpio) + 0.5)
}

/** Número seguro a partir de texto de BD o de formulario; no válido -> 0. */
export function aNumero(valor: string | number | null | undefined): number {
  if (valor === null || valor === undefined || valor === '') return 0
  const n = typeof valor === 'number' ? valor : Number(valor)
  return Number.isFinite(n) ? n : 0
}

/** Total de una línea de ítem: cantidad × precio, redondeado a pesos. */
export function calcularTotalLinea(cantidad: string | number, precioUnitario: string | number): number {
  return redondearPesos(aNumero(cantidad) * aNumero(precioUnitario))
}

export interface EntradaTotalesCotizacion {
  /** Suma de totales de línea de materiales (ya redondeados por línea). */
  materiales: number
  /** Mano de obra: jornadas × tarifa por rol, sumada por concepto. */
  manoObra: number
  costosOperativos: number
  imprevistos: number
  descuento: number
  ajuste: number
  aplicaIva: boolean
  porcentajeIva: number
}

export interface TotalesCotizacion {
  subtotal: number
  iva: number
  total: number
}

/** Totales de la cotización. Todos los conceptos se redondean a pesos antes de sumar. */
export function calcularTotalesCotizacion(e: EntradaTotalesCotizacion): TotalesCotizacion {
  const subtotal =
    redondearPesos(e.materiales) +
    redondearPesos(e.manoObra) +
    redondearPesos(e.costosOperativos) +
    redondearPesos(e.imprevistos) -
    redondearPesos(e.descuento) +
    redondearPesos(e.ajuste)
  const iva = e.aplicaIva ? redondearPesos(subtotal * (e.porcentajeIva / 100)) : 0
  return { subtotal, iva, total: subtotal + iva }
}

export type TipoHito = 'percentage' | 'fixed'

export interface HitoMonto {
  tipo: TipoHito
  /** Porcentaje (si tipo = percentage) o monto en pesos (si tipo = fixed). */
  valor: number
}

/**
 * Monto en pesos de cada hito. Los porcentajes se redondean; la diferencia contra el total la
 * absorbe el último hito porcentual, así la suma de los montos iguala `valorTotal` exactamente.
 * Si no hay hitos porcentuales, los montos fijos se devuelven tal cual (la validación de suma
 * vive en contrato-validacion, no aquí).
 */
export function repartirHitos(valorTotal: number, hitos: HitoMonto[]): number[] {
  const total = redondearPesos(valorTotal)
  const montos = hitos.map((h) =>
    h.tipo === 'percentage' ? redondearPesos((total * aNumero(h.valor)) / 100) : redondearPesos(aNumero(h.valor)),
  )
  let ultimoPorcentual = -1
  hitos.forEach((h, i) => {
    if (h.tipo === 'percentage') ultimoPorcentual = i
  })
  // Solo se absorbe un error de REDONDEO: como máximo 1 peso por hito porcentual. Una diferencia
  // mayor no es redondeo (p. ej. fijos + 100%): se deja tal cual para que la validación la reporte.
  const error = total - montos.reduce((s, m) => s + m, 0)
  const maxRedondeo = hitos.filter((h) => h.tipo === 'percentage').length
  if (ultimoPorcentual >= 0 && error !== 0 && Math.abs(error) <= maxRedondeo) {
    montos[ultimoPorcentual] += error
  }
  return montos
}
