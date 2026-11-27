// lib/mcp/gestion.ts
// Manejadores HTTP de la gestión de tokens MCP (sin Next.js). Solo actúan sobre los tokens de la
// sesión: el id de usuario sale de la sesión, nunca del cuerpo ni de la URL.
import { z } from 'zod'
import type { SesionEmpleado } from '../auth/session'
import { crearTokenMcp, ErrorEtiquetaToken, ETIQUETA_TOKEN_MAX, listarTokensMcp, revocarTokenMcp, type DepsTokensMcp } from './tokens'

export interface RespuestaGestion {
  status: number
  body: Record<string, unknown>
}

const SIN_SESION = { status: 401, body: { error: 'Inicia sesión en el ERP para gestionar tus accesos MCP.' } }
const GENERICO = { status: 500, body: { error: 'No se pudo completar la solicitud.' } }

const esquemaCrear = z.object({ etiqueta: z.string().max(ETIQUETA_TOKEN_MAX * 4) })
const esquemaId = z.uuid('Id de token inválido.')

export async function listarTokensHttp(sesion: SesionEmpleado | null, deps: DepsTokensMcp): Promise<RespuestaGestion> {
  if (!sesion) return SIN_SESION
  try {
    return { status: 200, body: { tokens: await listarTokensMcp(sesion.usuarioId, deps) } }
  } catch (err) {
    console.error('[mcp] error listando tokens', err instanceof Error ? err.name : 'desconocido')
    return GENERICO
  }
}

/** Crea un token. El token en claro viaja SOLO en esta respuesta; no se registra en ningún log. */
export async function crearTokenHttp(sesion: SesionEmpleado | null, cuerpo: unknown, deps: DepsTokensMcp): Promise<RespuestaGestion> {
  if (!sesion) return SIN_SESION
  const entrada = esquemaCrear.safeParse(cuerpo)
  if (!entrada.success) return { status: 400, body: { error: `Etiqueta inválida (máximo ${ETIQUETA_TOKEN_MAX} caracteres).` } }
  try {
    const creado = await crearTokenMcp(sesion.usuarioId, entrada.data.etiqueta, deps)
    return { status: 201, body: { token: creado.token, vista: creado.vista } }
  } catch (err) {
    if (err instanceof ErrorEtiquetaToken) return { status: 400, body: { error: err.message } }
    console.error('[mcp] error creando token', err instanceof Error ? err.name : 'desconocido')
    return GENERICO
  }
}

/** Revoca un token propio. Un id ajeno o inexistente responde 404 (no revela si existe). */
export async function revocarTokenHttp(sesion: SesionEmpleado | null, id: string | null, deps: DepsTokensMcp): Promise<RespuestaGestion> {
  if (!sesion) return SIN_SESION
  const valido = esquemaId.safeParse(id)
  if (!valido.success) return { status: 400, body: { error: 'Id de token inválido.' } }
  try {
    const revocado = await revocarTokenMcp(sesion.usuarioId, valido.data, deps)
    if (!revocado) return { status: 404, body: { error: 'Token no encontrado o ya revocado.' } }
    return { status: 200, body: { ok: true } }
  } catch (err) {
    console.error('[mcp] error revocando token', err instanceof Error ? err.name : 'desconocido')
    return GENERICO
  }
}
