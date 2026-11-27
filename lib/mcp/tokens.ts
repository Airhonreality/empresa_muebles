// lib/mcp/tokens.ts
// Tokens personales del servidor MCP (t-200 §6.2). Lógica pura: la persistencia entra por
// RepositorioTokensMcp (repositorio-tokens.ts es la implementación real con Drizzle).
// Reglas: el token en claro se devuelve UNA sola vez (al crearlo); en base solo va su SHA-256;
// un token revocado o de un usuario inactivo se rechaza en la siguiente llamada; el usuario y su
// rol se resuelven desde la base en cada verificación (nunca desde el token).
import { createHash, randomBytes } from 'node:crypto'
import type { SesionEmpleado } from '../auth/session'

import { ETIQUETA_TOKEN_MAX, PREFIJO_TOKEN_MCP } from './opciones'

export { ETIQUETA_TOKEN_MAX, PREFIJO_TOKEN_MCP }
const BYTES_TOKEN = 32
const LARGO_TOKEN_BASE64URL = Math.ceil((BYTES_TOKEN * 4) / 3) // 43 caracteres sin relleno

export interface FilaTokenMcp {
  id: string
  usuarioId: string
  etiqueta: string
  hash: string
  creadoEn: Date
  ultimoUsoEn: Date | null
  revocadoEn: Date | null
}

export interface RepositorioTokensMcp {
  insertar(fila: Pick<FilaTokenMcp, 'usuarioId' | 'etiqueta' | 'hash' | 'creadoEn'>): Promise<FilaTokenMcp>
  buscarPorHash(hash: string): Promise<FilaTokenMcp | null>
  marcarUso(id: string, cuando: Date): Promise<void>
  /** Revoca solo si la fila es del usuario y no estaba revocada. Devuelve true si cambió algo. */
  revocar(id: string, usuarioId: string, cuando: Date): Promise<boolean>
  listarDeUsuario(usuarioId: string): Promise<FilaTokenMcp[]>
}

/** Usuario de empleado tal como se lee de `usuarios` en cada llamada. null si no puede usarse. */
export type CargarUsuarioEmpleado = (usuarioId: string) => Promise<SesionEmpleado | null>

export interface DepsTokensMcp {
  repo: RepositorioTokensMcp
  ahora: () => Date
}

export interface DepsVerificacionMcp extends DepsTokensMcp {
  cargarUsuario: CargarUsuarioEmpleado
}

/** Vista pública de un token: nunca incluye el hash ni el token en claro. */
export interface TokenMcpVista {
  id: string
  etiqueta: string
  creadoEn: string
  ultimoUsoEn: string | null
  estado: 'activo' | 'revocado'
}

export class ErrorEtiquetaToken extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = 'ErrorEtiquetaToken'
  }
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

/** Forma del token: prefijo fijo y 43 caracteres base64url. Descarta basura antes de tocar la base. */
export function tieneFormatoToken(token: string): boolean {
  if (!token.startsWith(PREFIJO_TOKEN_MCP)) return false
  const cuerpo = token.slice(PREFIJO_TOKEN_MCP.length)
  return cuerpo.length === LARGO_TOKEN_BASE64URL && /^[A-Za-z0-9_-]+$/.test(cuerpo)
}

/** Token nuevo en claro y su hash. Solo el hash debe persistirse. */
export function generarToken(): { token: string; hash: string } {
  const token = PREFIJO_TOKEN_MCP + randomBytes(BYTES_TOKEN).toString('base64url')
  return { token, hash: hashToken(token) }
}

export function validarEtiqueta(etiqueta: string): string {
  const limpia = etiqueta.trim()
  if (limpia.length === 0) throw new ErrorEtiquetaToken('Escribe una etiqueta para identificar el token.')
  if (limpia.length > ETIQUETA_TOKEN_MAX) {
    throw new ErrorEtiquetaToken(`La etiqueta no puede tener más de ${ETIQUETA_TOKEN_MAX} caracteres.`)
  }
  return limpia
}

export interface TokenCreado {
  /** Token en claro. Se muestra una sola vez; no se vuelve a leer ni se registra. */
  token: string
  vista: TokenMcpVista
}

export async function crearTokenMcp(usuarioId: string, etiqueta: string, deps: DepsTokensMcp): Promise<TokenCreado> {
  const etiquetaLimpia = validarEtiqueta(etiqueta)
  const { token, hash } = generarToken()
  const fila = await deps.repo.insertar({ usuarioId, etiqueta: etiquetaLimpia, hash, creadoEn: deps.ahora() })
  return { token, vista: vistaDeToken(fila) }
}

/**
 * Resuelve el usuario de un token válido. null para: formato inválido, token inexistente, revocado,
 * usuario inexistente/inactivo o sin rol de empleado. Nunca lanza por datos del token.
 */
export async function verificarTokenMcp(token: string, deps: DepsVerificacionMcp): Promise<SesionEmpleado | null> {
  if (!tieneFormatoToken(token)) return null
  const fila = await deps.repo.buscarPorHash(hashToken(token))
  if (!fila || fila.revocadoEn !== null) return null
  const sesion = await deps.cargarUsuario(fila.usuarioId)
  if (!sesion) return null
  await deps.repo.marcarUso(fila.id, deps.ahora())
  return sesion
}

export async function revocarTokenMcp(usuarioId: string, id: string, deps: DepsTokensMcp): Promise<boolean> {
  return deps.repo.revocar(id, usuarioId, deps.ahora())
}

export async function listarTokensMcp(usuarioId: string, deps: DepsTokensMcp): Promise<TokenMcpVista[]> {
  const filas = await deps.repo.listarDeUsuario(usuarioId)
  return filas.map(vistaDeToken)
}

export function vistaDeToken(f: FilaTokenMcp): TokenMcpVista {
  return {
    id: f.id,
    etiqueta: f.etiqueta,
    creadoEn: new Date(f.creadoEn).toISOString(),
    ultimoUsoEn: f.ultimoUsoEn ? new Date(f.ultimoUsoEn).toISOString() : null,
    estado: f.revocadoEn ? 'revocado' : 'activo',
  }
}
