// lib/asistente/registro.ts
// Composición del registro de operaciones del asistente (t-200). Es el único punto que junta los
// dominios. El chat interno y, más adelante, el servidor MCP consumen este mismo arreglo.
import type { Documento } from './conocimiento'
import type { DefinicionAsistente } from './herramientas'
import { operacionAyuda } from './ops/ayuda'
import { operacionesCatalogo, type PuertoCatalogo } from './ops/catalogo'
import { operacionesClientes, type PuertoClientes } from './ops/clientes'
import { operacionesCotizacion, type PuertoCotizaciones } from './ops/cotizacion'
import { operacionesFinanzas, type PuertoFinanzas } from './ops/finanzas'
import { operacionCotizacionCrearCompleta, type DepsCotizacion } from './operaciones/cotizacion-completa'

export interface DepsRegistro {
  clientes: PuertoClientes
  catalogo: PuertoCatalogo
  cotizaciones: PuertoCotizaciones
  finanzas: PuertoFinanzas
  cotizacion: DepsCotizacion
  /** Base de conocimiento ya cargada y validada. */
  documentos: readonly Documento[]
  /** Texto de conocimiento/asistente/INDICE.md (fuente del enum de procedimientos). */
  indice: string
}

export function crearOperaciones(deps: DepsRegistro): DefinicionAsistente[] {
  return [
    ...operacionesClientes(deps.clientes),
    ...operacionesCatalogo(deps.catalogo),
    ...operacionesCotizacion(deps.cotizaciones),
    ...operacionesFinanzas(deps.finanzas),
    operacionCotizacionCrearCompleta(deps.cotizacion),
    ...operacionAyuda(deps.documentos, deps.indice),
  ]
}
