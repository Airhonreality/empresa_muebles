// lib/asistente/herramientas.ts
// Registro de operaciones del asistente (t-198 pieza 3; capa de acciones: diseno_capa_acciones §2).
// Cada operación pertenece a un dominio y se nombra "dominio.operacion". El modelo NO las ve
// planas: ve el mapa de dominios y pide operaciones con dominio_operaciones / ejecutar (operaciones.ts).
// Regla: ninguna operación toca Drizzle directamente. Las de lectura llaman a acciones de
// lib/data/actions/ (lecturas), inyectadas en AccionesLectura para poder probarlas sin base.
// Las de escritura (esEscritura: true) nunca se ejecutan desde el bucle: ejecutarOperacion crea una
// propuesta y solo la confirmación del empleado llama a `ejecutar`.
import { z } from 'zod'
import { PERMISOS_POR_ROL, type Permiso } from './permisos'
import { NoAutorizadoError } from './permisos'
import type { SesionEmpleado } from '../auth/session'
import type { Cliente, Proyecto } from '../data/contracts'
import type { CotizadorListaSnapshot } from '../data/queries/cotizador-lista-types'
import type { ProyectoSnapshot } from '../data/queries/proyecto-types'
import type { FinanzasSnapshot } from '../data/queries/finanzas-types'
import { aNumero } from '../dinero/calculo'
import { operacionCotizacionCrearCompleta, type DepsCotizacion } from './operaciones/cotizacion-completa'

/** Tamaño máximo del resultado que se envía al modelo. Constante fija, no configurable. */
export const MAX_CARACTERES_RESULTADO = 8000

export interface DefinicionHerramienta<I> {
  /** Nombre cualificado "dominio.operacion" (ej. cotizacion.buscar). Identificador único del registro. */
  nombre: string
  /** Dominio de negocio (cotizacion, proyecto, finanzas). */
  dominio: string
  /** Operación dentro del dominio (ej. buscar). */
  operacion: string
  descripcion: string
  permiso: Permiso
  esEscritura: boolean
  esquema: z.ZodType<I>
  /** Solo escrituras: resumen legible para la propuesta. Lo calcula el servidor, nunca el modelo. */
  resumir?: (entrada: I, usuario: SesionEmpleado) => Promise<string>
  ejecutar: (entrada: I, usuario: SesionEmpleado) => Promise<unknown>
}

/**
 * Acciones de lectura que usan las herramientas. En producción se cargan con import dinámico
 * (así los tests que usan acciones falsas no abren conexión ni leen la cookie).
 */
export interface AccionesLectura {
  cotizadorLista: () => Promise<CotizadorListaSnapshot>
  proyecto: (proyectoId: string) => Promise<ProyectoSnapshot>
  finanzas: () => Promise<FinanzasSnapshot>
}

export const accionesErp: AccionesLectura = {
  cotizadorLista: async () =>
    (await import('../data/actions/lecturas-cotizador-lista')).obtenerSnapshotCotizadorListaAction(),
  proyecto: async (proyectoId) =>
    (await import('../data/actions/lecturas-proyecto')).obtenerSnapshotProyectoAction(proyectoId),
  finanzas: async () =>
    (await import('../data/actions/lecturas-finanzas')).obtenerSnapshotFinanzasAction(),
}

const LIMITE_RESULTADOS_LISTA = 20

function nombreCliente(clientes: Cliente[], clienteId: string | null): string | null {
  if (!clienteId) return null
  return clientes.find((c) => c.id === clienteId)?.nombre ?? null
}

function resumenProyecto(p: Proyecto, clientes: Cliente[]) {
  return {
    id: p.id,
    codigo: p.codigo,
    nombreProyecto: p.nombreProyecto,
    estado: p.estado,
    tipoProyecto: p.tipoProyecto,
    cliente: nombreCliente(clientes, p.clienteId),
    creadoEn: p.createdAt,
  }
}

// ── cotizacion_buscar ──────────────────────────────────────────────
const esquemaCotizacionBuscar = z.object({
  texto: z.string().trim().min(2, 'Escribe al menos 2 caracteres').max(120),
})

const cotizacionBuscar = (acciones: AccionesLectura): DefinicionHerramienta<z.infer<typeof esquemaCotizacionBuscar>> => ({
  nombre: 'cotizacion.buscar',
  dominio: 'cotizacion',
  operacion: 'buscar',
  descripcion:
    'Busca cotizaciones por código (ej. COT-2026-11-25-01), nombre del proyecto o nombre del cliente. Devuelve hasta 20 coincidencias.',
  permiso: 'cotizador:leer',
  esEscritura: false,
  esquema: esquemaCotizacionBuscar,
  ejecutar: async ({ texto }) => {
    const snapshot = await acciones.cotizadorLista()
    const buscado = texto.toLocaleLowerCase('es')
    const coincidencias = snapshot.proyectos.filter((p) => {
      const cliente = nombreCliente(snapshot.clientes, p.clienteId) ?? ''
      return (
        p.codigo.toLocaleLowerCase('es').includes(buscado) ||
        p.nombreProyecto.toLocaleLowerCase('es').includes(buscado) ||
        cliente.toLocaleLowerCase('es').includes(buscado)
      )
    })
    return {
      total: coincidencias.length,
      resultados: coincidencias
        .slice(0, LIMITE_RESULTADOS_LISTA)
        .map((p) => ({ ...resumenProyecto(p, snapshot.clientes), proyectoId: p.id })),
    }
  },
})

// ── proyecto_consultar ─────────────────────────────────────────────
const esquemaProyectoConsultar = z.object({
  proyectoId: z.string().uuid('proyectoId debe ser un identificador válido'),
})

const proyectoConsultar = (acciones: AccionesLectura): DefinicionHerramienta<z.infer<typeof esquemaProyectoConsultar>> => ({
  nombre: 'proyecto.consultar',
  dominio: 'proyecto',
  operacion: 'consultar',
  descripcion:
    'Consulta un proyecto por su proyectoId (obtenido con cotizacion_buscar): estado, cliente, espacios y totales básicos.',
  permiso: 'proyectos:leer',
  esEscritura: false,
  esquema: esquemaProyectoConsultar,
  ejecutar: async ({ proyectoId }) => {
    const snapshot = await acciones.proyecto(proyectoId)
    if (!snapshot.proyecto) return { encontrado: false }
    return {
      encontrado: true,
      proyecto: resumenProyecto(snapshot.proyecto, snapshot.cliente ? [snapshot.cliente] : []),
      espacios: snapshot.espacios.map((e) => ({
        nombre: e.nombreEspacio,
        variante: e.nombreVariante,
        tipo: e.tipoEspacio,
      })),
    }
  },
})

// ── caja_saldo ─────────────────────────────────────────────────────
const esquemaCajaSaldo = z.object({})

const cajaSaldo = (acciones: AccionesLectura): DefinicionHerramienta<z.infer<typeof esquemaCajaSaldo>> => ({
  nombre: 'finanzas.saldo_caja',
  dominio: 'finanzas',
  operacion: 'saldo_caja',
  descripcion: 'Devuelve el saldo actual de cada cuenta financiera (caja, bancos) y el total.',
  permiso: 'finanzas:leer',
  esEscritura: false,
  esquema: esquemaCajaSaldo,
  ejecutar: async () => {
    const snapshot = await acciones.finanzas()
    const cuentas = snapshot.cuentas.map((c) => ({
      nombre: c.nombre,
      tipo: c.tipo,
      saldoActual: c.saldoActual,
    }))
    // Dos decimales, sin redondear a pesos: un saldo de caja no puede perder centavos.
    const total = Math.round(snapshot.cuentas.reduce((suma, c) => suma + aNumero(c.saldoActual), 0) * 100) / 100
    return { cuentas, total }
  },
})

/** Definición genérica del registro. La entrada concreta la valida el esquema de cada herramienta. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DefinicionAsistente = DefinicionHerramienta<any>

/** Crea el registro con las acciones indicadas (los tests inyectan acciones falsas). */
export function crearHerramientas(acciones: AccionesLectura): DefinicionAsistente[] {
  return [cotizacionBuscar(acciones), proyectoConsultar(acciones), cajaSaldo(acciones)]
}

/** Descripción de cada dominio para el catálogo que ve el modelo (nivel 1: dominios, no acciones). */
export const DESCRIPCION_DOMINIOS: Record<string, { nombre: string; descripcion: string }> = {
  cotizacion: { nombre: 'Cotizaciones', descripcion: 'Buscar cotizaciones; crear una cotización completa (requiere confirmación del empleado).' },
  proyecto: { nombre: 'Proyectos', descripcion: 'Consultar el detalle de un proyecto: estado, cliente y espacios.' },
  finanzas: { nombre: 'Finanzas', descripcion: 'Saldos de cuentas de caja y bancos.' },
}

export interface DominioCatalogo {
  dominio: string
  nombre: string
  descripcion: string
}

/**
 * Dominios donde la sesión tiene permiso para AL MENOS una operación registrada. Solo nombre y
 * descripción: nunca nombres de operaciones ni datos.
 */
export function catalogoDominios(sesion: SesionEmpleado, registro: readonly DefinicionAsistente[]): DominioCatalogo[] {
  const permisos = PERMISOS_POR_ROL[sesion.rol] ?? []
  const dominios = new Set<string>()
  for (const h of registro) {
    if (permisos.includes(h.permiso)) dominios.add(h.dominio)
  }
  return [...dominios].sort().map((dominio) => ({
    dominio,
    nombre: DESCRIPCION_DOMINIOS[dominio]?.nombre ?? dominio,
    descripcion: DESCRIPCION_DOMINIOS[dominio]?.descripcion ?? '',
  }))
}

/** Registro completo: lectura + escritura. La escritura se conecta a la base en produccion.ts. */
export function crearOperaciones(acciones: AccionesLectura, cotizacion: DepsCotizacion): DefinicionAsistente[] {
  return [...crearHerramientas(acciones), operacionCotizacionCrearCompleta(cotizacion)]
}

/**
 * Operaciones que la sesión puede usar. Se filtra por permiso ANTES de enviar nada al modelo.
 * `habilitadas` (opcional, de la configuración, por nombre "dominio.operacion") solo puede REDUCIR la lista.
 */
export function herramientasPermitidas(
  sesion: SesionEmpleado,
  habilitadas: readonly string[] | undefined,
  registro: readonly DefinicionAsistente[],
): DefinicionAsistente[] {
  const permisos = PERMISOS_POR_ROL[sesion.rol] ?? []
  return registro.filter(
    (h) =>
      permisos.includes(h.permiso) &&
      (habilitadas === undefined || habilitadas.includes(h.nombre)),
  )
}

/** Recorta el texto a MAX_CARACTERES_RESULTADO agregando un aviso visible para el modelo. */
export function truncarResultado(texto: string, max: number = MAX_CARACTERES_RESULTADO): string {
  if (texto.length <= max) return texto
  const aviso = `\n[RESULTADO TRUNCADO: se muestran ${max} de ${texto.length} caracteres. Pide un filtro más preciso.]`
  return texto.slice(0, max - aviso.length) + aviso
}

/**
 * Ejecuta una operación de LECTURA con la entrada cruda del modelo:
 *  1. Verifica el permiso de la sesión (NoAutorizadoError si no lo tiene).
 *  2. Valida la entrada con Zod. Si no cumple, lanza error SIN llamar a la acción.
 *  3. Ejecuta y devuelve el resultado serializado y truncado.
 * Las de escritura NO pasan por aquí: ejecutarOperacion crea propuestas para ellas.
 */
export async function ejecutarHerramienta(
  def: DefinicionAsistente,
  entradaCruda: unknown,
  usuario: SesionEmpleado,
): Promise<string> {
  if (def.esEscritura) {
    throw new Error(`La operación "${def.nombre}" es de escritura: solo se ejecuta con confirmación del empleado.`)
  }
  const permisos = PERMISOS_POR_ROL[usuario.rol] ?? []
  if (!permisos.includes(def.permiso)) {
    throw new NoAutorizadoError(def.permiso)
  }
  const validada = def.esquema.safeParse(entradaCruda)
  if (!validada.success) {
    throw new Error(
      `Entrada inválida para "${def.nombre}": ${validada.error.issues.map((i) => i.message).join('; ')}`,
    )
  }
  const resultado = await def.ejecutar(validada.data, usuario)
  return truncarResultado(JSON.stringify(resultado ?? null))
}
