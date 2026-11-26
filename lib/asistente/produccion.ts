// lib/asistente/produccion.ts
// Cableado real del asistente para las rutas de app/api/asistente/**. Es el único punto que une
// los manejadores de ruta.ts con Drizzle (repositorio.ts) y con el cifrado.
import { cifrar } from './cifrado'
import { HERRAMIENTAS } from './herramientas'
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
import type { DepsClaves, DepsConfiguracion } from './ruta'

const TAMANO_DETALLE = 200

export const atender = (p: { usuario: SesionEmpleado; conversacionId?: string; mensaje: string }) =>
  atenderMensaje(p, { conversaciones, cargarConfiguracion, turno: depsProduccion() })

export const listar = (usuarioId: string) => conversaciones.listar(usuarioId)

export async function detalle(conversacionId: string, usuarioId: string) {
  const mensajes = await conversaciones.historial(conversacionId, usuarioId, TAMANO_DETALLE)
  if (mensajes === null) return null
  const propuestas = (await propuestasPendientes(conversacionId, usuarioId)) ?? []
  return { mensajes, propuestas }
}

const depsPropuestas = depsPropuestasProduccion(HERRAMIENTAS)

export const resolverPropuesta = (accion: 'confirmar' | 'cancelar', id: string, usuario: SesionEmpleado) =>
  accion === 'confirmar' ? confirmarPropuesta(id, usuario, depsPropuestas) : cancelarPropuesta(id, usuario, depsPropuestas)

export const depsConfiguracion: DepsConfiguracion = {
  leer: () => leerConfiguracionAdmin(),
  guardar: (clave, valor, usuarioId) => guardarValorConfiguracion(clave, valor, usuarioId),
}

export const depsClaves: DepsClaves = {
  cifrar,
  agregar: (p) => agregarClaveProveedor(p),
  eliminar: (id) => eliminarClaveProveedor(id),
}
