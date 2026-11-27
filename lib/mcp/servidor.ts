// lib/mcp/servidor.ts
// Servidor MCP del asistente (t-200 §6). Transporte Streamable HTTP en modo sin estado: cada
// petición HTTP crea su propio servidor y su propio transporte, así que la autenticación se aplica
// en CADA petición y ningún estado sobrevive entre llamadas.
//
// Orden de la seguridad, en cada petición:
//  1. Bearer token. Sin token o con token inválido/revocado/de usuario inactivo → 401, y no se
//     registra ni se ejecuta ninguna herramienta.
//  2. La sesión (usuario y rol) sale de la base en esa llamada (verificarTokenMcp).
//  3. Solo tres herramientas fijas: dominios, operaciones, ejecutar. Todas filtran por permiso y canal
//     'mcp' (lib/asistente/herramientas.ts). Las escrituras solo crean propuestas.
//  4. Máximo MAX_LLAMADAS_POR_PETICION llamadas a herramientas por petición.
import { z } from 'zod'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import type { SesionEmpleado } from '../auth/session'
import { NoAutorizadoError } from '../auth/errors'
import { ErrorProcedencia, ErrorRevalidacion } from '../asistente/errores'
import { catalogoDominios, Procedencia, type DefinicionAsistente } from '../asistente/herramientas'
import { dominioOperaciones, ejecutarOperacion } from '../asistente/operaciones'
import { ErrorPropuesta, type DepsPropuestas, type RepositorioPropuestas } from '../asistente/propuestas'
import { verificarTokenMcp, type DepsVerificacionMcp } from './tokens'
import { acotarElementos, MAX_CARACTERES_RESULTADO, MAX_LLAMADAS_POR_PETICION } from './limites'

export interface DepsMcp {
  /** Repositorio de tokens, reloj y cargador de usuario (ver tokens.ts). */
  tokens: DepsVerificacionMcp
  /** Registro completo de operaciones del asistente (lib/asistente/registro.ts). */
  registro: readonly DefinicionAsistente[]
  propuestas: RepositorioPropuestas
  /** Crea una conversación para guardar las propuestas de una petición MCP. */
  crearConversacion: (usuarioId: string) => Promise<string>
  ahora: () => Date
}

/** Mensajes de validación que lanzan las operaciones del registro. Cualquier otro error se oculta. */
const MENSAJES_DE_OPERACION = /^(Entrada inválida|Argumentos inválidos|Esa operación no está disponible|La operación ".*" es de escritura)/

const MENSAJE_NO_AUTORIZADO = 'Token MCP inválido, revocado o ausente.'
const MENSAJE_ERROR_GENERICO = 'No se pudo completar la operación.'

const esquemaDominio = z.object({ dominio: z.string().trim().min(1).max(60) })
const esquemaEjecutar = z.object({
  dominio: z.string().trim().min(1).max(60),
  operacion: z.string().trim().min(1).max(60),
  argumentos: z.record(z.string(), z.unknown()).optional(),
})

/** Definición de las tres herramientas fijas (JSON Schema para el cliente MCP). */
export const HERRAMIENTAS_MCP = [
  {
    name: 'dominios',
    description: 'Lista los dominios del ERP a los que tienes acceso (clientes, catalogo, cotizacion, finanzas, ayuda, propuestas). Empieza por aquí.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'operaciones',
    description: 'Lista las operaciones de un dominio, con su descripción y el JSON Schema de sus argumentos.',
    inputSchema: {
      type: 'object',
      properties: { dominio: { type: 'string', description: 'Nombre del dominio devuelto por dominios.' } },
      required: ['dominio'],
      additionalProperties: false,
    },
  },
  {
    name: 'ejecutar',
    description:
      'Ejecuta una operación. Las lecturas devuelven datos. Las escrituras devuelven una PROPUESTA: no se escriben hasta que se confirma con ejecutar("propuestas","confirmar",{id}).',
    inputSchema: {
      type: 'object',
      properties: {
        dominio: { type: 'string' },
        operacion: { type: 'string' },
        argumentos: { type: 'object', description: 'Argumentos de la operación según operaciones(dominio).' },
      },
      required: ['dominio', 'operacion'],
      additionalProperties: false,
    },
  },
] as const

interface ResultadoHerramienta {
  texto: string
  esError: boolean
}

function error(texto: string): ResultadoHerramienta {
  return { texto, esError: true }
}

/** Ejecuta una herramienta fija para una sesión ya autenticada. Nunca lanza: los errores vuelven como texto. */
export async function ejecutarHerramientaMcp(
  nombre: string,
  argumentos: unknown,
  sesion: SesionEmpleado,
  deps: DepsMcp,
  alcance: { conversacionId: () => Promise<string>; procedencia: Procedencia },
): Promise<ResultadoHerramienta> {
  try {
    if (nombre === 'dominios') {
      return { texto: JSON.stringify(catalogoDominios(sesion, deps.registro, 'mcp')), esError: false }
    }
    if (nombre === 'operaciones') {
      const { dominio } = esquemaDominio.parse(argumentos ?? {})
      return { texto: JSON.stringify(dominioOperaciones(dominio, sesion, deps.registro, 'mcp')), esError: false }
    }
    if (nombre === 'ejecutar') {
      const entrada = esquemaEjecutar.parse(argumentos ?? {})
      const depsPropuestas: DepsPropuestas = { repo: deps.propuestas, ahora: deps.ahora, registro: deps.registro }
      const r = await ejecutarOperacion(entrada, sesion, {
        registro: deps.registro,
        propuestas: depsPropuestas,
        conversacionId: alcance.conversacionId,
        procedencia: alcance.procedencia,
        canal: 'mcp',
      })
      return { texto: acotarElementos(r.texto).slice(0, MAX_CARACTERES_RESULTADO), esError: false }
    }
    return error(`Herramienta desconocida: ${nombre}. Usa dominios, operaciones o ejecutar.`)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return error(`Argumentos inválidos: ${err.issues.map((i) => i.message).join('; ')}`)
    }
    if (err instanceof NoAutorizadoError || err instanceof ErrorPropuesta || err instanceof ErrorProcedencia || err instanceof ErrorRevalidacion) {
      // Errores de dominio (permiso, procedencia, propuesta, revalidación): mensaje pensado para el cliente.
      return error(err.message)
    }
    if (err instanceof Error && MENSAJES_DE_OPERACION.test(err.message)) {
      // Errores de validación de ejecutarOperacion/ejecutarHerramienta (mensajes escritos para el modelo).
      return error(err.message)
    }
    console.error(`[mcp] error en herramienta ${nombre}`, err instanceof Error ? err.name : 'desconocido')
    return error(MENSAJE_ERROR_GENERICO)
  }
}

/** Extrae el token del encabezado Authorization: Bearer <token>. null si no viene o está mal formado. */
export function tokenDeCabecera(request: Request): string | null {
  const cabecera = request.headers.get('authorization')
  if (!cabecera) return null
  const m = /^Bearer\s+(\S+)$/i.exec(cabecera.trim())
  return m ? m[1] : null
}

function respuesta401(): Response {
  return new Response(JSON.stringify({ error: MENSAJE_NO_AUTORIZADO }), {
    status: 401,
    headers: { 'Content-Type': 'application/json', 'WWW-Authenticate': 'Bearer', 'Cache-Control': 'no-store' },
  })
}

/** Atiende una petición MCP. Sin token válido responde 401 sin tocar el registro ni la base de operaciones. */
export async function manejarMcp(request: Request, deps: DepsMcp): Promise<Response> {
  const token = tokenDeCabecera(request)
  if (!token) return respuesta401()
  const sesion = await verificarTokenMcp(token, deps.tokens)
  if (!sesion) return respuesta401()

  const procedencia = new Procedencia()
  let conversacion: Promise<string> | null = null
  const conversacionId = () => {
    conversacion ??= deps.crearConversacion(sesion.usuarioId)
    return conversacion
  }
  let llamadas = 0

  const servidor = new Server({ name: 'veta-erp-asistente', version: '1.0.0' }, { capabilities: { tools: {} } })
  servidor.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [...HERRAMIENTAS_MCP] }))
  servidor.setRequestHandler(CallToolRequestSchema, async (req) => {
    llamadas += 1
    if (llamadas > MAX_LLAMADAS_POR_PETICION) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Límite de ${MAX_LLAMADAS_POR_PETICION} llamadas por petición alcanzado.` }],
      }
    }
    const r = await ejecutarHerramientaMcp(req.params.name, req.params.arguments, sesion, deps, { conversacionId, procedencia })
    return { isError: r.esError, content: [{ type: 'text', text: r.texto }] }
  })

  const transporte = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })
  await servidor.connect(transporte)
  return transporte.handleRequest(request)
}
