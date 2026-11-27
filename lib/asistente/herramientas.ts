// lib/asistente/herramientas.ts
// Tipos y utilidades del registro de operaciones del asistente (t-200 paso 2).
// El registro completo se arma en registro.ts. Cada operación pertenece a un dominio y se nombra
// "dominio.operacion". El modelo NO ve operaciones planas: ve tres herramientas fijas (dominios,
// operaciones, ejecutar; ver bucle.ts y operaciones.ts).
//
// Dos clases de operación:
// - Lectura: `ejecutar(entrada, usuario, ctx)` devuelve datos. Las búsquedas registran en
//   `ctx.procedencia` los ids que devuelven.
// - Escritura: NUNCA se ejecuta desde el bucle. `preparar` valida, calcula y devuelve un resumen y los
//   datos de la propuesta. `confirmar(datos)` revalida y escribe; solo lo llama la confirmación del
//   empleado (confirmarPropuesta en propuestas.ts).
import { z } from 'zod'
import { PERMISOS_POR_ROL, type Permiso } from '../auth/permisos'
import type { RolCanonico } from '../data/contracts'
import { puedeUsarChat } from './matriz-chat'
import { NoAutorizadoError } from '../auth/errors'
import type { SesionEmpleado } from '../auth/session'
import { ErrorProcedencia } from './errores'

/** Tamaño máximo del resultado que se envía al modelo. Constante fija, no configurable. */
export const MAX_CARACTERES_RESULTADO = 8000

/** Canal donde una operación está disponible. El chat interno nunca ve las de canal solo MCP. */
export type Canal = 'chat' | 'mcp'

/** Tipos de id que el modelo puede usar en una escritura. Cada uno debe venir de una búsqueda. */
export type TipoId = 'cliente' | 'producto' | 'cotizacion' | 'cuenta'

/**
 * Ids que el modelo obtuvo de búsquedas EN ESTE TURNO. Una escritura que referencia un id fuera de
 * este conjunto se rechaza. Alcance: el turno (no la conversación entera): el historial no guarda
 * los resultados de herramientas, y no hay columna nueva donde guardarlos (ver informe t-200).
 */
export class Procedencia {
  private readonly vistos = new Map<TipoId, Set<string>>()

  registrar(tipo: TipoId, ids: readonly string[]): void {
    let conjunto = this.vistos.get(tipo)
    if (!conjunto) {
      conjunto = new Set()
      this.vistos.set(tipo, conjunto)
    }
    for (const id of ids) conjunto.add(id)
  }

  tiene(tipo: TipoId, id: string): boolean {
    return this.vistos.get(tipo)?.has(id) ?? false
  }

  /** Lanza ErrorProcedencia si el id no se obtuvo de una búsqueda. `nombre` va al mensaje para el modelo. */
  exigir(tipo: TipoId, id: string, nombre: string): void {
    if (!this.tiene(tipo, id)) {
      throw new ErrorProcedencia(`El ${nombre} con id ${id} no se obtuvo de una búsqueda en esta conversación. Búscalo primero.`)
    }
  }
}

/** Contexto de una llamada: solo lo que el servidor conoce (nunca lo que escribe el modelo como identidad). */
export interface ContextoOperacion {
  readonly procedencia: Procedencia
}

interface BaseDefinicion<S extends z.ZodType> {
  /** Nombre cualificado "dominio.operacion" (ej. clientes.buscar). Identificador único del registro. */
  nombre: string
  dominio: string
  operacion: string
  /** Español, dirigida al modelo: qué hace, con qué datos y qué devuelve. */
  descripcion: string
  permiso: Permiso
  canales: readonly Canal[]
  /** Esquema Zod 4 de los argumentos. Se convierte a JSON Schema para el modelo. */
  esquema: S
  /**
   * Esquema por usuario, si los valores permitidos dependen de la sesión (p. ej. documentos que
   * puede leer). Así un valor que el usuario no puede usar ni aparece en el esquema que recibe el modelo.
   */
  esquemaPara?: (usuario: SesionEmpleado) => z.ZodType
  /** Si devuelve false, la operación no aparece para ese usuario (ej. no tiene documentos visibles). */
  disponible?: (usuario: SesionEmpleado) => boolean
}

export interface DefinicionLectura<S extends z.ZodType = z.ZodType> extends BaseDefinicion<S> {
  esEscritura: false
  ejecutar: (entrada: z.infer<S>, usuario: SesionEmpleado, ctx: ContextoOperacion) => Promise<unknown>
}

export interface DefinicionEscritura<S extends z.ZodType = z.ZodType> extends BaseDefinicion<S> {
  esEscritura: true
  /** Valida contra el servidor (existencia, procedencia, precios) y devuelve el resumen y los datos de la propuesta. */
  preparar: (entrada: z.infer<S>, usuario: SesionEmpleado, ctx: ContextoOperacion) => Promise<{ resumen: string; datos: unknown }>
  /** Revalida y escribe. Se llama solo desde la confirmación del empleado. Lanza ErrorRevalidacion si cambió algo. */
  confirmar: (datos: unknown, usuario: SesionEmpleado) => Promise<unknown>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DefinicionAsistente = DefinicionLectura<any> | DefinicionEscritura<any>

/** Canal por defecto de las operaciones que el chat interno puede usar. */
export const CANAL_CHAT: Canal = 'chat'

/** Recorta el texto a MAX_CARACTERES_RESULTADO agregando un aviso visible para el modelo. */
export function truncarResultado(texto: string, max: number = MAX_CARACTERES_RESULTADO): string {
  if (texto.length <= max) return texto
  const aviso = `\n[RESULTADO TRUNCADO: se muestran ${max} de ${texto.length} caracteres. Pide un filtro más preciso.]`
  return texto.slice(0, max - aviso.length) + aviso
}

/** Esquema de argumentos que corresponde a este usuario (el general o el suyo). */
export function esquemaDe(def: DefinicionAsistente, usuario: SesionEmpleado): z.ZodType {
  return def.esquemaPara?.(usuario) ?? def.esquema
}

/**
 * ¿Puede el rol usar un permiso desde el chat? Dos barreras: el permiso base (lib/auth/permisos.ts)
 * y la matriz del chat (lib/asistente/matriz-chat.ts). Única comprobación de permiso del registro.
 */
export function tienePermisoRol(rol: RolCanonico, permiso: Permiso): boolean {
  return (PERMISOS_POR_ROL[rol] ?? []).includes(permiso) && puedeUsarChat(rol, permiso)
}

/** ¿Puede el rol de la sesión usar esta operación? */
export function tienePermiso(usuario: SesionEmpleado, def: DefinicionAsistente): boolean {
  return tienePermisoRol(usuario.rol, def.permiso)
}

/** Descripción de cada dominio para el mapa que ve el modelo (nivel 0). */
export const DESCRIPCION_DOMINIOS: Record<string, { nombre: string; descripcion: string }> = {
  clientes: { nombre: 'Clientes', descripcion: 'Buscar clientes; crear un cliente nuevo (requiere confirmación).' },
  catalogo: { nombre: 'Catálogo', descripcion: 'Tipos de espacio y productos del catálogo con precio público.' },
  cotizacion: { nombre: 'Cotizaciones', descripcion: 'Buscar y consultar cotizaciones; crear una cotización completa (requiere confirmación).' },
  finanzas: { nombre: 'Finanzas', descripcion: 'Cuentas y saldos; registrar una entrada o salida de dinero (requiere confirmación).' },
  ayuda: { nombre: 'Procedimientos', descripcion: 'Procedimientos de la empresa: cómo se hacen las cosas.' },
  propuestas: { nombre: 'Propuestas', descripcion: 'Ver tus propuestas pendientes de confirmación.' },
}

export interface DominioCatalogo {
  dominio: string
  nombre: string
  descripcion: string
}

/** Operaciones que la sesión puede usar en un canal: permiso, canal y disponibilidad. */
export function operacionesDelCanal(
  usuario: SesionEmpleado,
  registro: readonly DefinicionAsistente[],
  canal: Canal = CANAL_CHAT,
): DefinicionAsistente[] {
  return registro.filter((h) => tienePermiso(usuario, h) && h.canales.includes(canal) && (h.disponible?.(usuario) ?? true))
}

/**
 * Dominios donde la sesión tiene AL MENOS una operación disponible en el chat. Solo nombre y
 * descripción: nunca nombres de operaciones ni datos.
 */
export function catalogoDominios(sesion: SesionEmpleado, registro: readonly DefinicionAsistente[]): DominioCatalogo[] {
  const dominios = new Set(operacionesDelCanal(sesion, registro).map((h) => h.dominio))
  return [...dominios].sort().map((dominio) => ({
    dominio,
    nombre: DESCRIPCION_DOMINIOS[dominio]?.nombre ?? dominio,
    descripcion: DESCRIPCION_DOMINIOS[dominio]?.descripcion ?? '',
  }))
}

/**
 * Operaciones que la sesión puede usar en el chat. `habilitadas` (configuración, por nombre
 * "dominio.operacion") solo puede REDUCIR la lista.
 */
export function herramientasPermitidas(
  sesion: SesionEmpleado,
  habilitadas: readonly string[] | undefined,
  registro: readonly DefinicionAsistente[],
): DefinicionAsistente[] {
  return operacionesDelCanal(sesion, registro).filter((h) => habilitadas === undefined || habilitadas.includes(h.nombre))
}

/**
 * Ejecuta una operación de LECTURA con la entrada cruda del modelo:
 *  1. Verifica el permiso de la sesión (NoAutorizadoError si no lo tiene).
 *  2. Valida la entrada con Zod. Si no cumple, lanza error SIN llamar a la acción.
 *  3. Ejecuta y devuelve el resultado serializado y truncado.
 */
export async function ejecutarHerramienta(
  def: DefinicionAsistente,
  entradaCruda: unknown,
  usuario: SesionEmpleado,
  ctx: ContextoOperacion = { procedencia: new Procedencia() },
): Promise<string> {
  if (def.esEscritura) {
    throw new Error(`La operación "${def.nombre}" es de escritura: solo se ejecuta con confirmación del empleado.`)
  }
  if (!tienePermiso(usuario, def)) {
    throw new NoAutorizadoError(def.permiso)
  }
  const validada = esquemaDe(def, usuario).safeParse(entradaCruda)
  if (!validada.success) {
    throw new Error(`Entrada inválida para "${def.nombre}": ${validada.error.issues.map((i) => i.message).join('; ')}`)
  }
  const resultado = await def.ejecutar(validada.data, usuario, ctx)
  return truncarResultado(JSON.stringify(resultado ?? null))
}
