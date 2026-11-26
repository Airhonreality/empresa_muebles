// lib/asistente/operaciones.ts
// Niveles 1 y 2 de la capa de acciones (diseno_capa_acciones_asistente §2).
//   Nivel 1 — dominioOperaciones: operaciones de UN dominio que el permiso de la sesión permite.
//   Nivel 2 — ejecutarOperacion: valida argumentos contra el esquema. Lectura: ejecuta (truncada).
//             Escritura: crea una PROPUESTA y nunca ejecuta. Quien ejecuta es la confirmación.
// Seguridad: el filtro por permiso se aplica en ambos niveles (el modelo no puede pedir por nombre
// una operación que no le ofrecieron). La identidad sale de la sesión, nunca de los argumentos.
import { z } from 'zod'
import { zodToJsonSchema } from './esquema-json'
import type { SesionEmpleado } from '../auth/session'
import { PERMISOS_POR_ROL } from './permisos'
import { ejecutarHerramienta, type DefinicionAsistente } from './herramientas'
import { crearPropuesta, type DepsPropuestas } from './propuestas'

export const MENSAJE_NO_DISPONIBLE = 'Esa operación no está disponible para tu rol.'

export const esquemaDominioOperaciones = z.object({
  dominio: z.string().trim().min(1, 'Indica el dominio').max(60),
})

export const esquemaEjecutar = z.object({
  dominio: z.string().trim().min(1, 'Indica el dominio').max(60),
  operacion: z.string().trim().min(1, 'Indica la operación').max(60),
  argumentos: z.record(z.string(), z.unknown()).optional(),
})

export interface OperacionDescrita {
  operacion: string
  descripcion: string
  esEscritura: boolean
  /** JSON Schema de los argumentos, para que el modelo sepa qué enviar. */
  esquema: Record<string, unknown>
}

function permitidasDe(usuario: SesionEmpleado, registro: readonly DefinicionAsistente[]): DefinicionAsistente[] {
  const permisos = PERMISOS_POR_ROL[usuario.rol] ?? []
  return registro.filter((h) => permisos.includes(h.permiso))
}

/** Nivel 1. Un dominio sin operaciones permitidas responde igual que uno inexistente (no revela nada). */
export function dominioOperaciones(
  dominio: string,
  usuario: SesionEmpleado,
  registro: readonly DefinicionAsistente[],
): { dominio: string; operaciones: OperacionDescrita[] } {
  const operaciones = permitidasDe(usuario, registro)
    .filter((h) => h.dominio === dominio)
    .map((h) => ({
      operacion: h.operacion,
      descripcion: h.descripcion,
      esEscritura: h.esEscritura,
      esquema: zodToJsonSchema(h.esquema),
    }))
  return { dominio, operaciones }
}

export interface DepsOperaciones {
  registro: readonly DefinicionAsistente[]
  propuestas: DepsPropuestas
  /** Conversación donde se guarda la propuesta. Se llama solo al crear una propuesta. */
  conversacionId: () => Promise<string>
}

export interface PropuestaCreada {
  id: string
  herramienta: string
  resumen: string
  venceEn: string
}

export interface ResultadoOperacion {
  /** Texto que recibe el modelo. */
  texto: string
  /** Presente solo cuando la operación fue de escritura y quedó como propuesta pendiente. */
  propuesta?: PropuestaCreada
}

/**
 * Nivel 2. Errores de entrada, de permiso y de operación inexistente lanzan Error: el bucle los
 * devuelve al modelo como texto para que pueda corregirse. Nunca ejecuta una escritura.
 */
export async function ejecutarOperacion(
  entradaCruda: unknown,
  usuario: SesionEmpleado,
  deps: DepsOperaciones,
): Promise<ResultadoOperacion> {
  const entrada = esquemaEjecutar.safeParse(entradaCruda)
  if (!entrada.success) {
    throw new Error(`Entrada inválida para ejecutar: ${entrada.error.issues.map((i) => i.message).join('; ')}`)
  }
  const { dominio, operacion } = entrada.data
  const nombre = `${dominio}.${operacion}`
  // Inexistente y no permitida dan el mismo mensaje.
  const def = permitidasDe(usuario, deps.registro).find((h) => h.nombre === nombre)
  if (!def) throw new Error(MENSAJE_NO_DISPONIBLE)

  if (!def.esEscritura) {
    return { texto: await ejecutarHerramienta(def, entrada.data.argumentos ?? {}, usuario) }
  }

  const validada = def.esquema.safeParse(entrada.data.argumentos ?? {})
  if (!validada.success) {
    throw new Error(`Argumentos inválidos para ${nombre}: ${validada.error.issues.map((i) => i.message).join('; ')}`)
  }
  const resumen = def.resumir ? await def.resumir(validada.data, usuario) : `Operación ${nombre}`
  const conversacionId = await deps.conversacionId()
  const { id, venceEn } = await crearPropuesta(
    { usuario, conversacionId, herramienta: def.nombre, entradaCruda: validada.data, resumen },
    deps.propuestas,
  )
  return {
    texto:
      `Propuesta creada, pendiente de confirmación del empleado. id ${id}. Resumen: ${resumen}. ` +
      'La operación AÚN NO está realizada: no la des por hecha; pide al empleado que la revise y confirme en el chat.',
    propuesta: { id, herramienta: def.nombre, resumen, venceEn: venceEn.toISOString() },
  }
}
