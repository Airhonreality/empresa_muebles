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

/**
 * Acciones de mutación optimista del cotizador (Fase 2 · ZN-003).
 * Cada acción aplica el cambio en el estado local de Zustand de inmediato
 * (< 16ms), delega la persistencia real a `persistir` (Server Action del
 * DataStore) y, si esta falla, restaura automáticamente el snapshot previo.
 * Ninguna firma usa `any`.
 */
export interface CotizadorActions {
  /** Reemplaza el estado completo (hidratación desde DataStoreProvider o mock-store). */
  hidratar: (estado: Partial<CotizadorState>) => void
  /** Incrementa `version` para invalidar suscripciones por versión. */
  avisarCambio: () => void
  /** Restaura el estado inicial. */
  resetear: () => void

  /** Inserta un ítem temporal optimista; al resolver se reemplaza por el ítem confirmado del servidor. */
  crearItemOptimistic: (
    itemData: Omit<ItemVariante, 'id' | 'createdAt' | 'updatedAt' | 'totalLinea'>,
    persistir: () => Promise<ItemVariante>,
  ) => Promise<ItemVariante>

  /** Actualiza un ítem de forma optimista; true si la persistencia resolvió. */
  actualizarItemOptimistic: (
    id: string,
    cambios: Partial<ItemVariante>,
    persistir: () => Promise<ItemVariante | null>,
  ) => Promise<boolean>

  /** Elimina una variante (y sus ítems) de forma optimista con rollback en error. */
  eliminarVariante: (
    id: string,
    persistir: () => Promise<boolean>,
  ) => Promise<boolean>

  /** Renombra una variante de forma optimista con rollback en error. */
  renombrarVariante: (
    id: string,
    nuevoNombre: string,
    persistir: () => Promise<EspacioVariante | null>,
  ) => Promise<boolean>
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