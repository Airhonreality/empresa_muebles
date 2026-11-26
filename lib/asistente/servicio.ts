// lib/asistente/servicio.ts
// Orquesta un turno completo del asistente: carga la conversación propia, ejecuta el bucle y
// guarda los mensajes. Lógica pura: la persistencia entra por RepositorioConversaciones y el
// bucle por DepsTurno (repositorio.ts es la implementación real).
import type { SesionEmpleado } from '../auth/session'
import { ejecutarTurno, type ConfiguracionTurno, type DepsTurno, type Mensaje } from './bucle'

export class ErrorConversacionNoEncontrada extends Error {
  constructor() {
    super('Conversación no encontrada')
    this.name = 'ErrorConversacionNoEncontrada'
  }
}

export interface ResumenConversacion {
  id: string
  titulo: string
  actualizadaEn: string
}

export interface RepositorioConversaciones {
  /** Últimos mensajes (orden cronológico). null si la conversación no existe o no es del usuario. */
  historial(id: string, usuarioId: string, limite?: number): Promise<Mensaje[] | null>
  crear(usuarioId: string): Promise<string>
  guardarMensajes(conversacionId: string, mensajes: Mensaje[]): Promise<void>
  listar(usuarioId: string): Promise<ResumenConversacion[]>
}

export interface DepsServicio {
  conversaciones: RepositorioConversaciones
  /** Lee la configuración. Puede lanzar ErrorConfiguracionIncompleta. */
  cargarConfiguracion: () => Promise<ConfiguracionTurno>
  turno: DepsTurno
}

export interface ResultadoAtencion {
  respuesta: string
  conversacionId: string
  alerta?: string
}

/**
 * Atiende un mensaje. Orden: (1) conversación propia, (2) configuración y tope, (3) bucle,
 * (4) crear la conversación y guardar. Si el turno falla, no queda una conversación vacía.
 */
export async function atenderMensaje(
  params: { usuario: SesionEmpleado; conversacionId?: string; mensaje: string },
  deps: DepsServicio,
): Promise<ResultadoAtencion> {
  const { usuario, conversacionId, mensaje } = params
  let historial: Mensaje[] = []
  if (conversacionId) {
    const previo = await deps.conversaciones.historial(conversacionId, usuario.usuarioId)
    if (previo === null) throw new ErrorConversacionNoEncontrada()
    historial = previo
  }

  const configuracion = await deps.cargarConfiguracion()
  const resultado = await ejecutarTurno({ usuario, historial, mensaje, configuracion }, deps.turno)

  const id = conversacionId ?? (await deps.conversaciones.crear(usuario.usuarioId))
  await deps.conversaciones.guardarMensajes(id, resultado.mensajesNuevos)
  return { respuesta: resultado.respuesta, conversacionId: id, ...(resultado.alerta ? { alerta: resultado.alerta } : {}) }
}

/** Título de conversación: primeras 8 palabras del primer mensaje, máximo 60 caracteres. */
export function tituloDe(texto: string): string {
  const palabras = texto.trim().split(/\s+/).slice(0, 8).join(' ')
  return palabras.length > 60 ? `${palabras.slice(0, 57)}...` : palabras
}
