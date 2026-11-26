// lib/asistente/herramientas.ts
// Registro de herramientas del asistente (t-198, plan §2 pieza 3).
// Regla: ninguna herramienta toca Drizzle. Cada una llama a una acción de lib/data/actions/
// ya envuelta con protegerAccion, que vuelve a verificar la sesión y el permiso.
// Fase 1: solo lectura. Las de escritura usan esEscritura: true y ejecutarHerramienta las rechaza
// (la confirmación con propuestas es el bloque F).
import { z } from 'zod'
import { PERMISOS_POR_ROL, type Permiso } from '../auth/permisos'
import { NoAutorizadoError } from '../auth/errors'
import type { SesionEmpleado } from '../auth/session'
import type { Cliente, Proyecto } from '../data/contracts'
import type { CotizadorListaSnapshot } from '../data/queries/cotizador-lista-types'
import type { ProyectoSnapshot } from '../data/queries/proyecto-types'
import type { FinanzasSnapshot } from '../data/queries/finanzas-types'
import { aNumero } from '../dinero/calculo'

/** Tamaño máximo del resultado que se envía al modelo. Constante fija, no configurable. */
export const MAX_CARACTERES_RESULTADO = 8000

export interface DefinicionHerramienta<I> {
  nombre: string
  descripcion: string
  permiso: Permiso
  esEscritura: boolean
  esquema: z.ZodType<I>
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
  nombre: 'cotizacion_buscar',
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
  nombre: 'proyecto_consultar',
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
  nombre: 'caja_saldo',
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

/** Registro real de la fase 1 (solo lectura). Las de escritura se agregan en el bloque F. */
export const HERRAMIENTAS: readonly DefinicionAsistente[] = crearHerramientas(accionesErp)

/**
 * Herramientas que la sesión puede usar. Se filtra por permiso ANTES de enviar nada al modelo.
 * `habilitadas` (opcional, de la configuración) solo puede REDUCIR la lista, nunca ampliarla.
 */
export function herramientasPermitidas(
  sesion: SesionEmpleado,
  habilitadas?: readonly string[],
  registro: readonly DefinicionAsistente[] = HERRAMIENTAS,
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
 * Ejecuta una herramienta con la entrada cruda del modelo:
 *  1. Verifica el permiso de la sesión (NoAutorizadoError si no lo tiene).
 *  2. Valida la entrada con Zod. Si no cumple, lanza error SIN llamar a la acción.
 *  3. Ejecuta y devuelve el resultado serializado y truncado.
 */
export async function ejecutarHerramienta(
  def: DefinicionAsistente,
  entradaCruda: unknown,
  usuario: SesionEmpleado,
): Promise<string> {
  if (def.esEscritura) {
    throw new Error(`La herramienta "${def.nombre}" es de escritura y se ejecuta solo con confirmación (bloque F).`)
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
