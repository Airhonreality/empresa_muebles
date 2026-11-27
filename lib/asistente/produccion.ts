// lib/asistente/produccion.ts
// Cableado real del asistente para las rutas de app/api/asistente/**. Es el único punto que une
// los manejadores de ruta.ts con Drizzle (repositorio.ts) y con el cifrado.
import { cifrar } from './cifrado'
import { crearCatalogo, obtenerCatalogoOpenRouter, type CatalogoModelos, type ProveedorConCatalogo } from './catalogo-modelos'
import { crearOperaciones } from './registro'
import { clientesDb } from './operaciones/clientes-produccion'
import { catalogoDb } from './operaciones/catalogo-produccion'
import { cotizacionesDb } from './operaciones/cotizaciones-produccion'
import { finanzasDb } from './operaciones/finanzas-produccion'
import { propuestas as repoPropuestas } from './repositorio'
import { lecturaCotizacionDb, transaccionCotizacionDb } from './operaciones/cotizacion-produccion'
import { cargarDocumentos, type Documento } from './conocimiento'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  agregarClaveProveedor,
  cargarConfiguracion,
  conversaciones,
  depsPropuestasProduccion,
  depsProduccion,
  eliminarClaveProveedor,
  guardarValorConfiguracion,
  leerConfiguracionAdmin,
  propuestasPendientes,
} from './repositorio'
import { cancelarPropuesta, confirmarPropuesta } from './propuestas'
import { atenderMensaje } from './servicio'
import type { SesionEmpleado } from '../auth/session'
import type { DepsCatalogoHttp, DepsClaves, DepsConfiguracion } from './ruta'

const TAMANO_DETALLE = 200

/** Base de conocimiento real (conocimiento/asistente). Si no se puede leer, el asistente sigue sin procedimientos. */
function documentosProduccion(): Documento[] {
  try {
    return cargarDocumentos(join(process.cwd(), 'conocimiento', 'asistente'))
  } catch {
    console.error('[asistente] no se pudo leer conocimiento/asistente; el asistente responde sin procedimientos')
    return []
  }
}
const DOCUMENTOS = documentosProduccion()

/** Texto del índice de procedimientos (fuente del enum de ayuda.procedimiento). Vacío si no se puede leer. */
function indiceProcedimientosTexto(): string {
  try {
    return readFileSync(join(process.cwd(), 'conocimiento', 'asistente', 'INDICE.md'), 'utf8')
  } catch {
    return ''
  }
}

/** Registro real de operaciones. */
export const REGISTRO_OPERACIONES = crearOperaciones({
  clientes: clientesDb,
  catalogo: catalogoDb,
  cotizaciones: cotizacionesDb,
  finanzas: finanzasDb,
  cotizacion: { lectura: lecturaCotizacionDb, transaccion: transaccionCotizacionDb, ahora: () => new Date() },
  documentos: DOCUMENTOS,
  indice: indiceProcedimientosTexto(),
  propuestas: repoPropuestas,
  ahora: () => new Date(),
})

export const atender = (p: { usuario: SesionEmpleado; conversacionId?: string; mensaje: string }) =>
  atenderMensaje(p, { conversaciones, cargarConfiguracion, turno: depsProduccion(REGISTRO_OPERACIONES, DOCUMENTOS) })

export const listar = (usuarioId: string) => conversaciones.listar(usuarioId)

export async function detalle(conversacionId: string, usuarioId: string) {
  const mensajes = await conversaciones.historial(conversacionId, usuarioId, TAMANO_DETALLE)
  if (mensajes === null) return null
  const propuestas = (await propuestasPendientes(conversacionId, usuarioId)) ?? []
  return { mensajes, propuestas }
}

const depsPropuestas = depsPropuestasProduccion(REGISTRO_OPERACIONES)

export const resolverPropuesta = (accion: 'confirmar' | 'cancelar', id: string, usuario: SesionEmpleado) =>
  accion === 'confirmar' ? confirmarPropuesta(id, usuario, depsPropuestas) : cancelarPropuesta(id, usuario, depsPropuestas)

/** Un catálogo en caché por proveedor (1 hora). Anthropic y Google no tienen listado: ver catalogo-modelos.ts. */
const CATALOGOS: Record<ProveedorConCatalogo, CatalogoModelos> = {
  openrouter: crearCatalogo({ obtener: obtenerCatalogoOpenRouter, ahora: () => new Date() }),
}

export const depsConfiguracion: DepsConfiguracion = {
  leer: () => leerConfiguracionAdmin(),
  guardar: (clave, valor, usuarioId) => guardarValorConfiguracion(clave, valor, usuarioId),
  modelos: (proveedor) => CATALOGOS[proveedor].listar(),
  registro: REGISTRO_OPERACIONES,
}

export const depsClaves: DepsClaves = {
  cifrar,
  agregar: (p) => agregarClaveProveedor(p),
  eliminar: (id) => eliminarClaveProveedor(id),
}

export const depsCatalogo: DepsCatalogoHttp = {
  catalogo: (proveedor) => CATALOGOS[proveedor],
}
