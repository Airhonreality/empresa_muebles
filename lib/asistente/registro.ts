// lib/asistente/registro.ts
// Composición del registro de operaciones del asistente (t-200). Es el único punto que junta los
// dominios. El chat interno y, más adelante, el servidor MCP consumen este mismo arreglo.
import type { Documento } from './conocimiento'
import type { DefinicionAsistente } from './herramientas'
import { accionesErp, lecturasErpTemporales, type AccionesLectura } from './ops/erp'
import { operacionAyuda } from './ops/ayuda'
import { operacionCotizacionCrearCompleta, type DepsCotizacion } from './operaciones/cotizacion-completa'

export interface DepsRegistro {
  acciones: AccionesLectura
  cotizacion: DepsCotizacion
  /** Base de conocimiento ya cargada y validada. */
  documentos: readonly Documento[]
  /** Texto de conocimiento/asistente/INDICE.md (fuente del enum de procedimientos). */
  indice: string
}

export function crearOperaciones(deps: DepsRegistro): DefinicionAsistente[] {
  return [
    ...lecturasErpTemporales(deps.acciones),
    operacionCotizacionCrearCompleta(deps.cotizacion),
    ...operacionAyuda(deps.documentos, deps.indice),
  ]
}

export { accionesErp }
