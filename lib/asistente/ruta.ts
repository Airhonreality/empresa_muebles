// lib/asistente/ruta.ts
// Manejadores HTTP del asistente, sin Next.js: reciben la sesión y las dependencias ya resueltas y
// devuelven { status, body }. Las rutas de app/api/asistente/** solo leen la cookie y delegan acá.
// Reglas: nada de claves, prompts de sistema ni trazas en el cuerpo de respuesta. Los errores
// inesperados responden 500 genérico y solo registran nombre y código en el servidor.
import { z } from 'zod'
import type { SesionEmpleado } from '../auth/session'
import { ErrorConfiguracionIncompleta, ErrorTopesNoConfigurados } from './bucle'
import { ErrorSinClavesDisponibles } from './claves'
import { codigoPg } from './errores'
import { ErrorConversacionNoEncontrada, type ResultadoAtencion } from './servicio'
import { ErrorPropuesta, type ResultadoConfirmacion } from './propuestas'
import type { ProveedorAsistente } from './modelo'

export interface Respuesta {
  status: number
  body: Record<string, unknown>
}

export const MENSAJE_SIN_BASE = 'Asistente pendiente de activación de base de datos'
const MENSAJE_GENERICO = 'No se pudo completar la solicitud del asistente.'
const MENSAJE_SIN_SESION = 'Inicia sesión en el ERP para usar el asistente.'
const MENSAJE_SOLO_ADMIN = 'Solo un administrador puede cambiar la configuración del asistente.'

const PROVEEDORES = ['openrouter', 'anthropic', 'google'] as const

export function esAdmin(sesion: SesionEmpleado): boolean {
  return sesion.rol === 'admin'
}

/** Convierte un error en respuesta HTTP. Nunca expone el mensaje de errores no previstos. */
export function respuestaDeError(err: unknown, registrar: (texto: string) => void = (t) => console.error(t)): Respuesta {
  if (err instanceof ErrorConversacionNoEncontrada) return { status: 404, body: { error: err.message } }
  if (err instanceof ErrorTopesNoConfigurados) return { status: 409, body: { error: err.message } }
  if (err instanceof ErrorConfiguracionIncompleta) return { status: 409, body: { error: err.message } }
  if (err instanceof ErrorSinClavesDisponibles) return { status: 503, body: { error: err.message } }
  if (err instanceof ErrorPropuesta) return { status: err.status, body: { error: err.message } }
  if (codigoPg(err) === '42P01') return { status: 503, body: { error: MENSAJE_SIN_BASE } }
  const nombre = err instanceof Error ? err.name : 'desconocido'
  const codigo = codigoPg(err) ?? 'sin_codigo'
  registrar(`[asistente] error no previsto: ${nombre} (${codigo})`)
  return { status: 500, body: { error: MENSAJE_GENERICO } }
}

// ── Turno de chat ───────────────────────────────────────────────────

const esquemaTurno = z.object({
  mensaje: z
    .string()
    .trim()
    .min(1, 'Escribe un mensaje')
    .max(4000, 'El mensaje no puede superar 4.000 caracteres'),
  conversacionId: z.string().uuid('conversacionId inválido').optional(),
})

export type Atender = (p: { usuario: SesionEmpleado; conversacionId?: string; mensaje: string }) => Promise<ResultadoAtencion>

export async function turnoHttp(sesion: SesionEmpleado | null, cuerpo: unknown, atender: Atender): Promise<Respuesta> {
  if (!sesion) return { status: 401, body: { error: MENSAJE_SIN_SESION } }
  const validada = esquemaTurno.safeParse(cuerpo)
  if (!validada.success) {
    return { status: 400, body: { error: validada.error.issues[0]?.message ?? 'Cuerpo inválido' } }
  }
  try {
    const r = await atender({ usuario: sesion, conversacionId: validada.data.conversacionId, mensaje: validada.data.mensaje })
    return {
      status: 200,
      body: { respuesta: r.respuesta, conversacionId: r.conversacionId, ...(r.alerta ? { alerta: r.alerta } : {}) },
    }
  } catch (err) {
    return respuestaDeError(err)
  }
}

// ── Historial ───────────────────────────────────────────────────────

export async function listarConversacionesHttp(
  sesion: SesionEmpleado | null,
  listar: (usuarioId: string) => Promise<unknown>,
): Promise<Respuesta> {
  if (!sesion) return { status: 401, body: { error: MENSAJE_SIN_SESION } }
  try {
    return { status: 200, body: { conversaciones: await listar(sesion.usuarioId) } }
  } catch (err) {
    return respuestaDeError(err)
  }
}

export async function detalleConversacionHttp(
  sesion: SesionEmpleado | null,
  conversacionId: string,
  detalle: (conversacionId: string, usuarioId: string) => Promise<unknown>,
): Promise<Respuesta> {
  if (!sesion) return { status: 401, body: { error: MENSAJE_SIN_SESION } }
  if (!z.string().uuid().safeParse(conversacionId).success) return { status: 400, body: { error: 'conversacionId inválido' } }
  try {
    const d = await detalle(conversacionId, sesion.usuarioId)
    if (d === null) return { status: 404, body: { error: 'Conversación no encontrada' } }
    return { status: 200, body: d as Record<string, unknown> }
  } catch (err) {
    return respuestaDeError(err)
  }
}

// ── Propuestas ──────────────────────────────────────────────────────

export async function resolverPropuestaHttp(
  sesion: SesionEmpleado | null,
  propuestaId: string,
  accion: unknown,
  resolver: (accion: 'confirmar' | 'cancelar', id: string, usuario: SesionEmpleado) => Promise<ResultadoConfirmacion>,
): Promise<Respuesta> {
  if (!sesion) return { status: 401, body: { error: MENSAJE_SIN_SESION } }
  if (!z.string().uuid().safeParse(propuestaId).success) return { status: 400, body: { error: 'propuestaId inválido' } }
  if (accion !== 'confirmar' && accion !== 'cancelar') return { status: 400, body: { error: 'Acción inválida' } }
  try {
    const r = await resolver(accion, propuestaId, sesion)
    return { status: 200, body: { estado: r.estado, sinCambios: r.sinCambios } }
  } catch (err) {
    return respuestaDeError(err)
  }
}

// ── Configuración (solo admin, verificado aquí y no solo en la UI) ──

const esquemaConfigPut = z.object({
  modelo: z.object({ proveedor: z.enum(PROVEEDORES), modelo: z.string().trim().min(1).max(200) }).optional(),
  topes: z
    .object({
      usuarioDiaUsd: z.number().nonnegative().max(100000),
      globalDiaUsd: z.number().nonnegative().max(1000000),
      alertaFraccion: z.number().min(0).max(1),
    })
    .optional(),
  precios: z
    .object({ entradaPorMillon: z.number().nonnegative().max(10000), salidaPorMillon: z.number().nonnegative().max(10000) })
    .optional(),
})

export interface DepsConfiguracion {
  leer: () => Promise<unknown>
  guardar: (clave: 'modelo' | 'topes' | 'precios', valor: unknown, usuarioId: string) => Promise<void>
}

export async function leerConfiguracionHttp(sesion: SesionEmpleado | null, deps: DepsConfiguracion): Promise<Respuesta> {
  if (!sesion) return { status: 401, body: { error: MENSAJE_SIN_SESION } }
  if (!esAdmin(sesion)) return { status: 403, body: { error: MENSAJE_SOLO_ADMIN } }
  try {
    return { status: 200, body: { configuracion: await deps.leer() } as Record<string, unknown> }
  } catch (err) {
    return respuestaDeError(err)
  }
}

export async function guardarConfiguracionHttp(
  sesion: SesionEmpleado | null,
  cuerpo: unknown,
  deps: DepsConfiguracion,
): Promise<Respuesta> {
  if (!sesion) return { status: 401, body: { error: MENSAJE_SIN_SESION } }
  if (!esAdmin(sesion)) return { status: 403, body: { error: MENSAJE_SOLO_ADMIN } }
  const validada = esquemaConfigPut.safeParse(cuerpo)
  if (!validada.success) return { status: 400, body: { error: validada.error.issues[0]?.message ?? 'Cuerpo inválido' } }
  try {
    for (const clave of ['modelo', 'topes', 'precios'] as const) {
      const valor = validada.data[clave]
      if (valor !== undefined) await deps.guardar(clave, valor, sesion.usuarioId)
    }
    return { status: 200, body: { ok: true } }
  } catch (err) {
    return respuestaDeError(err)
  }
}

export interface DepsClaves {
  cifrar: (texto: string) => string
  agregar: (p: { proveedor: ProveedorAsistente; etiqueta: string; claveCifrada: string; ultimos4: string }) => Promise<{
    id: string
    ultimos4: string
    orden: number
  }>
  eliminar: (id: string) => Promise<boolean>
}

const esquemaClaveNueva = z.object({
  proveedor: z.enum(PROVEEDORES),
  etiqueta: z.string().trim().min(1, 'Pon una etiqueta').max(60),
  clave: z.string().trim().min(10, 'La clave parece demasiado corta').max(400),
})

/** Agrega una clave. La respuesta solo trae los últimos 4 caracteres; la clave nunca vuelve. */
export async function agregarClaveHttp(sesion: SesionEmpleado | null, cuerpo: unknown, deps: DepsClaves): Promise<Respuesta> {
  if (!sesion) return { status: 401, body: { error: MENSAJE_SIN_SESION } }
  if (!esAdmin(sesion)) return { status: 403, body: { error: MENSAJE_SOLO_ADMIN } }
  const validada = esquemaClaveNueva.safeParse(cuerpo)
  if (!validada.success) return { status: 400, body: { error: validada.error.issues[0]?.message ?? 'Cuerpo inválido' } }
  const { proveedor, etiqueta, clave } = validada.data
  try {
    const creada = await deps.agregar({
      proveedor,
      etiqueta,
      claveCifrada: deps.cifrar(clave),
      ultimos4: clave.slice(-4),
    })
    return { status: 201, body: { clave: { id: creada.id, proveedor, etiqueta, ultimos4: creada.ultimos4, orden: creada.orden } } }
  } catch (err) {
    return respuestaDeError(err)
  }
}

export async function eliminarClaveHttp(sesion: SesionEmpleado | null, id: string, deps: DepsClaves): Promise<Respuesta> {
  if (!sesion) return { status: 401, body: { error: MENSAJE_SIN_SESION } }
  if (!esAdmin(sesion)) return { status: 403, body: { error: MENSAJE_SOLO_ADMIN } }
  if (!z.string().uuid().safeParse(id).success) return { status: 400, body: { error: 'id inválido' } }
  try {
    const ok = await deps.eliminar(id)
    return ok ? { status: 200, body: { ok: true } } : { status: 404, body: { error: 'Clave no encontrada' } }
  } catch (err) {
    return respuestaDeError(err)
  }
}
