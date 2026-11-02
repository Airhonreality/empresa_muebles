import { num } from '@/lib/data/actions/mappers'
import type { GrupoItemHidratado, GrupoItemCalculado } from '@/lib/data/contracts'

/** Parámetros financieros de mano de obra (vienen de parametros.ts). */
export interface ParametrosManoObra {
  tasaManoObraDesarrollo: number // $/hora
  tasaManoObraEnsamblaje: number
  tasaManoObraInstalacion: number
  porcentajeIva: number // 0-100 (ej: 19)
}

/** Calcula totales de grupo: suma items + mano de obra + IVA. */
export function calcularGrupoItemCalculado(
  grupo: GrupoItemHidratado,
  parametros: ParametrosManoObra,
): GrupoItemCalculado {
  // 1. Suma de items (neto)
  const sumaItemsNeto = grupo.items.reduce((acc, item) => {
    return acc + num(item.precioUnitario) * num(item.cantidad)
  }, 0)

  // 2. Aplicar IVA
  const tasaIva = parametros.porcentajeIva / 100
  const sumaItemsConIva = sumaItemsNeto * (1 + tasaIva)

  // 3. Mano de obra: jornadas × tasa horaria
  const valorManoObra =
    num(grupo.jornadasDesarrolloTecnico) * parametros.tasaManoObraDesarrollo +
    num(grupo.jornadasEnsamblajeTaller) * parametros.tasaManoObraEnsamblaje +
    num(grupo.jornadasInstalacionObra) * parametros.tasaManoObraInstalacion

  // 4. Total grupo = items con IVA + mano de obra
  const precioPublicoGrupo = sumaItemsConIva + valorManoObra

  return {
    ...grupo,
    sumaItemsNeto: String(sumaItemsNeto.toFixed(2)),
    sumaItemsConIVA: String(sumaItemsConIva.toFixed(2)),
    valorManoObraEstimada: String(valorManoObra.toFixed(2)),
    precioPublicoGrupo: String(precioPublicoGrupo.toFixed(2)),
  } as GrupoItemCalculado
}

/** Calcula precios de subgrupos recursivamente. */
export function calcularGrupoConSubgrupos(
  grupo: GrupoItemHidratado,
  parametros: ParametrosManoObra,
): GrupoItemCalculado {
  const calculado = calcularGrupoItemCalculado(grupo, parametros)
  // Recalcular subgrupos también
  calculado.subgrupos = grupo.subgrupos.map((sub) =>
    calcularGrupoConSubgrupos(sub, parametros),
  )
  return calculado as GrupoItemCalculado
}
