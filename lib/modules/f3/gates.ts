// Predicados y derivaciones de los gates de la Fase F3 (disenio_f3_cronograma_gates.md §4).
// Funciones puras: no dependen del store ni del tiempo, se testean en aislamiento.
import type { DesenlaceCheck, DesfaseCronograma, Proyecto, Verificacion } from '../../data/contracts'

/** R1: E-18 Check de schema pre-compras. El paso de `desarrollo` → `aprobado_compras` solo procede cuando existe la verificación aprobada del verificador único DESPUÉS del ingreso a desarrollo. */
export function P18(p: {
  estado: Proyecto['estado']
  verificadorId: string | null
  fechaEntradaDesarrollo: string | null
}, verificaciones: Verificacion[]): boolean {
  if (p.estado !== 'desarrollo') return false
  if (!p.verificadorId) return false
  const v = verificaciones.find((v) =>
    v.tipoGate === 'schema' &&
    v.veredicto === 'aprobado' &&
    v.verificadorId === p.verificadorId
  )
  if (!v) return false
  if (p.fechaEntradaDesarrollo) return v.creadoEn >= p.fechaEntradaDesarrollo
  return true
}

/** R2: E-33 Cambio de cronograma con causa. Requiere causa válida + motivo no vacío + composición causal no vacía. */
export function P33(d: Pick<DesfaseCronograma, 'causa' | 'motivo' | 'composicionCausal'>): boolean {
  const causaValida = d.causa === 'interna' || d.causa === 'externa' || d.causa === 'cambio_contrato'
  return causaValida && d.motivo.length > 0 && d.composicionCausal.length > 0
}

/** R9: el desenlace del check de producción se DERIVA del mínimo de las 3 brechas contra los umbrales configurables. Nunca se asienta a mano. */
export function derivarDesenlace(
  ratios: { ratioInsumos: number; ratioPagos: number; ratioProduccion: number },
  umbrales: { umbralTodoBienPct: number; umbralExtremoPct: number }
): DesenlaceCheck {
  const min = Math.min(ratios.ratioInsumos, ratios.ratioPagos, ratios.ratioProduccion)
  if (min >= umbrales.umbralTodoBienPct) return 'todo_bien'
  if (min >= umbrales.umbralExtremoPct) return 'novedad'
  return 'extremo'
}

/** E-59: reducción de comisión derivada del desenlace final vía parámetros (ambos desenlaces negativos reducen; extremo más que novedad). */
export function derivarReduccionComision(
  desenlace: DesenlaceCheck,
  parametros: { reduccionNovedadPct: number; reduccionExtremoPct: number }
): number {
  switch (desenlace) {
    case 'todo_bien': return 0
    case 'novedad': return parametros.reduccionNovedadPct
    case 'extremo': return parametros.reduccionExtremoPct
  }
}