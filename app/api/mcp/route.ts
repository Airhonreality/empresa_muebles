import { manejarMcp } from '@/lib/mcp/servidor'
import { depsMcpProduccion } from '@/lib/mcp/produccion'

// Servidor MCP (Streamable HTTP, sin estado). La autenticación es el Bearer token personal del
// usuario; no usa la cookie de sesión del ERP. Sin token válido responde 401 sin ejecutar nada.
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export const POST = (request: Request) => manejarMcp(request, depsMcpProduccion)
export const GET = (request: Request) => manejarMcp(request, depsMcpProduccion)
export const DELETE = (request: Request) => manejarMcp(request, depsMcpProduccion)
