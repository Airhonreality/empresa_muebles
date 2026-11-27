// lib/asistente/propuestas.ts
// Propuestas de escritura con confirmación (t-200 paso 2). Una escritura NUNCA se ejecuta desde el bucle:
// crea una propuesta pendiente con los datos que devolvió `preparar`. Solo la confirmación del mismo
// usuario la ejecuta (`confirmar` revalida y escribe). Lógica pura: la persistencia entra por
// RepositorioPropuestas (repositorio.ts es la implementación real).
import type { SesionEmpleado } from '../auth/session'
import { tienePermisoRol, type DefinicionAsistente } from './herramientas'
import { ErrorRevalidacion } from './errores'

export const HORAS_VENCIMIENTO = 48

export type EstadoPropuesta = 'pendiente' | 'ejecutada' | 'fallida' | 'cancelada' | 'vencida'

export interface Propuesta {
  id: string
  conversacionId: string
  usuarioId: string
  herramienta: string
  /** Datos que devolvió `preparar` (incluyen la entrada validada y el total del resumen). */
  entrada: unknown
  resumen: string
  estado: EstadoPropuesta
  venceEn: Date
}

export interface RepositorioPropuestas {
  insertar(p: Omit<Propuesta, 'id' | 'estado'>): Promise<string>
  obtener(id: string): Promise<Propuesta | null>
  /** Cambia el estado SOLO si la fila sigue en `desde`. Devuelve true si la fila se cambió. */
  cambiarEstado(id: string, desde: EstadoPropuesta, nuevo: EstadoPropuesta, resueltaEn: Date): Promise<boolean>
  /**
   * Vuelve una propuesta `ejecutada` a `pendiente` con datos y resumen nuevos (revalidación fallida).
   * Solo si sigue en `ejecutada`. Devuelve true si se reabrió.
   */
  reabrir(id: string, datos: unknown, resumen: string): Promise<boolean>
  /** Propuestas del usuario en uno de los estados indicados, las más recientes primero. */
  listarDeUsuario(usuarioId: string, estados: readonly EstadoPropuesta[], limite: number): Promise<Propuesta[]>
}

export interface DepsPropuestas {
  repo: RepositorioPropuestas
  ahora: () => Date
  /** Registro de operaciones (incluye las de escritura). */
  registro: readonly DefinicionAsistente[]
}

export type CodigoErrorPropuesta = 'NO_ENCONTRADA' | 'NO_PERTENECE' | 'SIN_PERMISO' | 'NO_ES_ESCRITURA' | 'ENTRADA_INVALIDA'

export class ErrorPropuesta extends Error {
  readonly codigo: CodigoErrorPropuesta
  readonly status: number
  constructor(codigo: CodigoErrorPropuesta, mensaje: string, status: number) {
    super(mensaje)
    this.name = 'ErrorPropuesta'
    this.codigo = codigo
    this.status = status
  }
}

/**
 * Crea una propuesta pendiente. `datos` lo produjo `preparar` (ya validado contra el servidor).
 * Devuelve el id de la propuesta y su fecha de vencimiento.
 */
export async function crearPropuesta(
  params: { usuario: SesionEmpleado; conversacionId: string; herramienta: string; datos: unknown; resumen: string },
  deps: DepsPropuestas,
): Promise<{ id: string; venceEn: Date }> {
  const def = deps.registro.find((h) => h.nombre === params.herramienta)
  if (!def) throw new ErrorPropuesta('NO_ENCONTRADA', `Operación desconocida: ${params.herramienta}`, 400)
  if (!def.esEscritura) throw new ErrorPropuesta('NO_ES_ESCRITURA', `"${def.nombre}" no es de escritura.`, 400)
  const venceEn = new Date(deps.ahora().getTime() + HORAS_VENCIMIENTO * 3600_000)
  const id = await deps.repo.insertar({
    conversacionId: params.conversacionId,
    usuarioId: params.usuario.usuarioId,
    herramienta: def.nombre,
    entrada: params.datos,
    resumen: params.resumen,
    venceEn,
  })
  return { id, venceEn }
}

async function propuestaDeEsUsuario(id: string, usuario: SesionEmpleado, deps: DepsPropuestas): Promise<Propuesta> {
  const p = await deps.repo.obtener(id)
  if (!p) throw new ErrorPropuesta('NO_ENCONTRADA', 'La propuesta no existe.', 404)
  // Se comprueba el dueño ANTES de revelar el estado a otra sesión.
  if (p.usuarioId !== usuario.usuarioId) {
    throw new ErrorPropuesta('NO_PERTENECE', 'Esta propuesta pertenece a otro usuario.', 403)
  }
  return p
}

export interface ResultadoConfirmacion {
  estado: EstadoPropuesta
  resultado?: unknown
  /** true si la propuesta ya estaba resuelta y no se hizo nada. */
  sinCambios: boolean
}

/**
 * Confirma y ejecuta una propuesta. Idempotente: la transición pendiente -> ejecutada/fallida
 * se hace con una actualización condicionada al estado, así que solo una llamada ejecuta.
 * Si la revalidación falla (ErrorRevalidacion), la propuesta vuelve a `pendiente` con el resumen nuevo.
 */
export async function confirmarPropuesta(id: string, usuario: SesionEmpleado, deps: DepsPropuestas): Promise<ResultadoConfirmacion> {
  const p = await propuestaDeEsUsuario(id, usuario, deps)
  if (p.estado !== 'pendiente') return { estado: p.estado, sinCambios: true }

  const ahora = deps.ahora()
  if (ahora.getTime() >= p.venceEn.getTime()) {
    await deps.repo.cambiarEstado(id, 'pendiente', 'vencida', ahora)
    const actual = await deps.repo.obtener(id)
    return { estado: actual?.estado ?? 'vencida', sinCambios: true }
  }

  // Validaciones previas al reclamo: si la propuesta no puede ejecutarse, no se marca como ejecutada.
  const def = deps.registro.find((h) => h.nombre === p.herramienta)
  if (!def) throw new ErrorPropuesta('NO_ENCONTRADA', `Operación desconocida: ${p.herramienta}`, 400)
  if (!def.esEscritura) throw new ErrorPropuesta('NO_ES_ESCRITURA', `"${def.nombre}" no es de escritura.`, 400)
  if (!tienePermisoRol(usuario.rol, def.permiso)) {
    throw new ErrorPropuesta('SIN_PERMISO', `Sin permiso "${def.permiso}" para esta acción.`, 403)
  }

  // Reclamo atómico: si otra confirmación llegó primero, esta no ejecuta nada.
  const reclamada = await deps.repo.cambiarEstado(id, 'pendiente', 'ejecutada', ahora)
  if (!reclamada) {
    const actual = await deps.repo.obtener(id)
    return { estado: actual?.estado ?? 'ejecutada', sinCambios: true }
  }

  try {
    const resultado = await def.confirmar(p.entrada, usuario)
    return { estado: 'ejecutada', resultado, sinCambios: false }
  } catch (err) {
    if (err instanceof ErrorRevalidacion) {
      // Nada se escribió. La propuesta vuelve a pendiente con el resumen nuevo para que el empleado la revise.
      await deps.repo.reabrir(id, err.datosNuevos, err.resumenNuevo)
      throw err
    }
    // Ya reclamada: si la ejecución falla, queda marcada como fallida (no se reintenta sola).
    await deps.repo.cambiarEstado(id, 'ejecutada', 'fallida', deps.ahora())
    throw err
  }
}

/** Cancela una propuesta pendiente. Si ya estaba resuelta, no hace nada. */
export async function cancelarPropuesta(id: string, usuario: SesionEmpleado, deps: DepsPropuestas): Promise<ResultadoConfirmacion> {
  const p = await propuestaDeEsUsuario(id, usuario, deps)
  if (p.estado !== 'pendiente') return { estado: p.estado, sinCambios: true }
  const cambiada = await deps.repo.cambiarEstado(id, 'pendiente', 'cancelada', deps.ahora())
  return { estado: cambiada ? 'cancelada' : (await deps.repo.obtener(id))?.estado ?? 'cancelada', sinCambios: !cambiada }
}
