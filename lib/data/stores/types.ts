// Tipos compartidos para stores Zustand por dominio.
// Derivados de contracts.ts pero adaptados a slices independientes.
// Estos tipos son independientes del DataStore monolítico y permiten
// selecciones granulares por componente.

import { Proyecto, Cliente, EspacioVariante, ItemVariante, ProductoCatalogo, Contrato, HitoPago, CuentaFinanciera, MovimientoFinanciero, ObligacionPendiente, Parametro } from '../contracts'

// Estado inicial vacío (se hidratará desde DataStoreProvider o mock-store)
export interface CotizadorState {
  /** Items de las variantes del proyecto actual */
  items: ItemVariante[]
  /** Espacios del proyecto actual */
  espacios: EspacioVariante[]
  /** Jornadas por espacio */
  jornadasMap: Record<string, { dev: string; ens: string; inst: string }>
  /** Estado de grupos expandidos */
  gruposExpandidos: Set<string>
  /** Catálogo de productos (lectura para productMap en la cotización) */
  catalogo: ProductoCatalogo[]
  /** Parámetros del sistema (contratos tarifas jornadas, etc.) */
  parametros: Parametro[]
  /** Flag de carga/pending */
  isPending: {
    crearEspacio: boolean
    crearItem: boolean
    [key: string]: boolean
  }
  /** Versión del store (para useSyncExternalStore por dominio) */
  version: number
}

export interface ComercialState {
  proyectos: Proyecto[]
  clientes: Cliente[]
  contratos: Contrato[]
  hitos: HitoPago[]
}

export interface FinanzasState {
  cuentasFinancieras: CuentaFinanciera[]
  movimientosFinancieros: MovimientoFinanciero[]
  obligacionesPendientes: ObligacionPendiente[]
}

export interface SharedState {
  parametros: Parametro[]
  catalogo: ProductoCatalogo[]
}

/** Estado inicial vacío del store de cotizador. Se hidratará desde DataStoreProvider o mock-store. */
export const cotizadorInitialState = (): CotizadorState => ({
  items: [],
  espacios: [],
  jornadasMap: {},
  gruposExpandidos: new Set(),
  catalogo: [],
  parametros: [],
  isPending: {
    crearEspacio: false,
    crearItem: false,
  },
  version: 0,
})