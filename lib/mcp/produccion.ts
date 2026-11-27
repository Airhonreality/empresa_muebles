// lib/mcp/produccion.ts
// Cableado real del servidor MCP y de la gestión de tokens (solo para app/api/**). Une el registro
// del asistente con la base. Los tests usan lib/mcp/servidor.ts y gestion.ts directamente.
import { REGISTRO_OPERACIONES } from '../asistente/produccion'
import { propuestas as repoPropuestas, conversaciones, procedenciaPersistente } from '../asistente/repositorio'
import type { DepsMcp } from './servidor'
import type { DepsTokensMcp } from './tokens'
import { cargarUsuarioEmpleado, repositorioTokensMcp } from './repositorio-tokens'

const ahora = () => new Date()

export const depsTokensMcp: DepsTokensMcp = { repo: repositorioTokensMcp, ahora }

export const depsMcpProduccion: DepsMcp = {
  tokens: { repo: repositorioTokensMcp, ahora, cargarUsuario: cargarUsuarioEmpleado },
  registro: REGISTRO_OPERACIONES,
  propuestas: repoPropuestas,
  procedenciaPersistente,
  crearConversacion: (usuarioId, titulo) => conversaciones.crear(usuarioId, titulo),
  ahora,
}
