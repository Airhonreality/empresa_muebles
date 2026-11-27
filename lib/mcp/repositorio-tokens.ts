// lib/mcp/repositorio-tokens.ts
// Implementación real (Drizzle) de RepositorioTokensMcp y del cargador de usuario para el servidor MCP.
// Toda consulta de listado y revocación filtra por usuario_id: un id ajeno nunca se ve ni se toca.
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import type { SesionEmpleado } from '../auth/session'
import type { FilaTokenMcp, RepositorioTokensMcp } from './tokens'

function aFila(f: typeof s.tokensMcp.$inferSelect): FilaTokenMcp {
  return {
    id: f.id,
    usuarioId: f.usuarioId,
    etiqueta: f.etiqueta,
    hash: f.hash,
    creadoEn: new Date(f.creadoEn),
    ultimoUsoEn: f.ultimoUsoEn ? new Date(f.ultimoUsoEn) : null,
    revocadoEn: f.revocadoEn ? new Date(f.revocadoEn) : null,
  }
}

export const repositorioTokensMcp: RepositorioTokensMcp = {
  async insertar(fila) {
    const [f] = await db
      .insert(s.tokensMcp)
      .values({
        usuarioId: fila.usuarioId,
        etiqueta: fila.etiqueta,
        hash: fila.hash,
        creadoEn: fila.creadoEn.toISOString(),
      })
      .returning()
    return aFila(f)
  },
  async buscarPorHash(hash) {
    const [f] = await db.select().from(s.tokensMcp).where(eq(s.tokensMcp.hash, hash))
    return f ? aFila(f) : null
  },
  async marcarUso(id, cuando) {
    await db.update(s.tokensMcp).set({ ultimoUsoEn: cuando.toISOString() }).where(eq(s.tokensMcp.id, id))
  },
  async revocar(id, usuarioId, cuando) {
    const filas = await db
      .update(s.tokensMcp)
      .set({ revocadoEn: cuando.toISOString() })
      .where(and(eq(s.tokensMcp.id, id), eq(s.tokensMcp.usuarioId, usuarioId), isNull(s.tokensMcp.revocadoEn)))
      .returning({ id: s.tokensMcp.id })
    return filas.length > 0
  },
  async listarDeUsuario(usuarioId) {
    const filas = await db
      .select()
      .from(s.tokensMcp)
      .where(eq(s.tokensMcp.usuarioId, usuarioId))
      .orderBy(s.tokensMcp.creadoEn)
    return filas.map(aFila)
  },
}

/**
 * Usuario de empleado activo, leído de la base en cada llamada MCP. Mismo criterio que el login
 * (tipo empleado y activo), pero SIN el valor por defecto de rol: sin rol no hay sesión.
 */
export async function cargarUsuarioEmpleado(usuarioId: string): Promise<SesionEmpleado | null> {
  const [u] = await db
    .select({
      id: s.usuarios.id,
      email: s.usuarios.email,
      nombre: s.usuarios.nombre,
      personaId: s.usuarios.personaId,
      rolEmpleado: s.usuarios.rolEmpleado,
      tipo: s.usuarios.tipo,
      activo: s.usuarios.activo,
    })
    .from(s.usuarios)
    .where(eq(s.usuarios.id, usuarioId))
  if (!u || !u.activo || u.tipo !== 'empleado' || !u.rolEmpleado) return null
  return {
    usuarioId: u.id,
    personaId: u.personaId,
    nombre: u.nombre,
    email: u.email,
    rol: u.rolEmpleado,
  }
}
