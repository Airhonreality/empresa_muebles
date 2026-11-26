// lib/asistente/repositorio.ts
// Implementación Drizzle de las interfaces del asistente (claves, uso) y carga de configuración.
// Es el ÚNICO archivo del asistente que toca la base. No se prueba con base real: los tests usan mocks.
import { and, asc, desc, eq, gte, inArray, sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import { z } from 'zod'
import { descifrar } from './cifrado'
import { codigoPg } from './errores'
import type { ClaveRegistro, EventoRotacion, RepositorioClaves } from './claves'
import { modeloPorDefecto, obtenerModelo, type ProveedorAsistente } from './modelo'
import { ErrorConfiguracionIncompleta, type ConfiguracionTurno, type DepsTurno, type LlamadaRegistro, type Mensaje, type RepositorioUso } from './bucle'
import type { DepsPropuestas, EstadoPropuesta, Propuesta, RepositorioPropuestas } from './propuestas'
import { tituloDe, type RepositorioConversaciones, type ResumenConversacion } from './servicio'

const claves: RepositorioClaves = {
  async listarClaves(): Promise<ClaveRegistro[]> {
    const filas = await db.select().from(s.proveedoresAsistente).orderBy(asc(s.proveedoresAsistente.orden))
    return filas.map((f) => ({
      id: f.id,
      proveedor: f.proveedor as ProveedorAsistente,
      etiqueta: f.etiqueta,
      claveCifrada: f.claveCifrada,
      orden: f.orden,
      estado: f.estado,
      enfriadaHasta: f.enfriadaHasta ? new Date(f.enfriadaHasta) : null,
    }))
  },
  async enfriar(id: string, hasta: Date): Promise<void> {
    await db
      .update(s.proveedoresAsistente)
      .set({ estado: 'enfriada', enfriadaHasta: hasta.toISOString(), actualizadaEn: new Date().toISOString() })
      .where(eq(s.proveedoresAsistente.id, id))
  },
  async invalidar(id: string): Promise<void> {
    await db
      .update(s.proveedoresAsistente)
      .set({ estado: 'invalida', enfriadaHasta: null, actualizadaEn: new Date().toISOString() })
      .where(eq(s.proveedoresAsistente.id, id))
  },
  async registrarRotacion(ev: EventoRotacion): Promise<void> {
    await db.insert(s.llamadasHerramientaAsistente).values({
      usuarioId: ev.usuarioId,
      tipo: 'rotacion_clave',
      proveedorClaveId: ev.proveedorClaveId,
      detalle: ev.detalle,
    })
  },
}

const uso: RepositorioUso = {
  async gastoDelDia(usuarioId: string | null): Promise<number> {
    const t = s.llamadasHerramientaAsistente
    const condiciones = [eq(t.tipo, 'modelo'), gte(t.creadaEn, sql`date_trunc('day', now())`)]
    if (usuarioId !== null) condiciones.push(eq(t.usuarioId, usuarioId))
    const [fila] = await db
      .select({ total: sql<string>`coalesce(sum(${t.costoEstimado}), 0)` })
      .from(t)
      .where(and(...condiciones))
    return Number(fila?.total ?? 0)
  },
  async registrarLlamada(l: LlamadaRegistro): Promise<void> {
    await db.insert(s.llamadasHerramientaAsistente).values({
      usuarioId: l.usuarioId,
      tipo: l.tipo,
      herramienta: l.herramienta ?? null,
      proveedorClaveId: l.proveedorClaveId ?? null,
      modelo: l.modelo ?? null,
      entradaResumen: l.entradaResumen ?? null,
      resultadoResumen: l.resultadoResumen ?? null,
      tokensEntrada: l.tokensEntrada ?? null,
      tokensSalida: l.tokensSalida ?? null,
      costoEstimado: l.costoEstimado !== undefined ? l.costoEstimado.toFixed(6) : null,
      duracionMs: l.duracionMs ?? null,
    })
  },
}

const esquemaConfiguracion = z.object({
  modelo: z.object({ proveedor: z.enum(['openrouter', 'anthropic', 'google']), modelo: z.string().min(1) }).optional(),
  temperatura: z.number().min(0).max(2).optional(),
  instruccionesAdicionales: z.string().max(1000).optional(),
  herramientasHabilitadas: z.array(z.string()).optional(),
  topes: z
    .object({ usuarioDiaUsd: z.number().nonnegative(), globalDiaUsd: z.number().nonnegative(), alertaFraccion: z.number().min(0).max(1) })
    .optional(),
  precios: z.object({ entradaPorMillon: z.number().nonnegative(), salidaPorMillon: z.number().nonnegative() }).optional(),
})

/**
 * Lee configuracion_asistente (una fila por clave: modelo, temperatura, topes, precios, ...).
 * Sin valores por defecto ocultos: precios son obligatorios (ErrorConfiguracionIncompleta si faltan); si falta `topes`, la configuración
 * vuelve sin topes y ejecutarTurno rechaza el turno con ErrorTopesNoConfigurados. Si falta `modelo`,
 * se usa ASISTENTE_MODELO_DEFECTO (que también falla explícitamente si no existe).
 */
export async function cargarConfiguracion(): Promise<ConfiguracionTurno> {
  const filas = await db.select().from(s.configuracionAsistente)
  const crudo: Record<string, unknown> = Object.fromEntries(filas.map((f) => [f.clave, f.valor]))
  const validada = esquemaConfiguracion.safeParse(crudo)
  if (!validada.success) {
    throw new Error(`Configuración del asistente incompleta o inválida: ${validada.error.issues.map((i) => i.path.join('.')).join(', ')}`)
  }
  const cfg = validada.data
  if (!cfg.precios) throw new ErrorConfiguracionIncompleta('Configura los precios del modelo en Configuración del asistente')
  return {
    ...cfg,
    precios: cfg.precios,
    modelo: cfg.modelo ?? modeloPorDefecto(),
  }
}

const propuestas: RepositorioPropuestas = {
  async insertar(p): Promise<string> {
    const [fila] = await db
      .insert(s.propuestasAsistente)
      .values({
        conversacionId: p.conversacionId,
        usuarioId: p.usuarioId,
        herramienta: p.herramienta,
        entrada: p.entrada as object,
        resumen: p.resumen,
        venceEn: p.venceEn.toISOString(),
      })
      .returning({ id: s.propuestasAsistente.id })
    return fila.id
  },
  async obtener(id: string): Promise<Propuesta | null> {
    const [f] = await db.select().from(s.propuestasAsistente).where(eq(s.propuestasAsistente.id, id))
    if (!f) return null
    return {
      id: f.id,
      conversacionId: f.conversacionId,
      usuarioId: f.usuarioId,
      herramienta: f.herramienta,
      entrada: f.entrada,
      resumen: f.resumen,
      estado: f.estado as EstadoPropuesta,
      venceEn: new Date(f.venceEn),
    }
  },
  async cambiarEstado(id: string, desde: EstadoPropuesta, nuevo: EstadoPropuesta, resueltaEn: Date): Promise<boolean> {
    // Condición sobre el estado actual: dos confirmaciones simultáneas no pueden ganar las dos.
    const filas = await db
      .update(s.propuestasAsistente)
      .set({ estado: nuevo, resueltaEn: resueltaEn.toISOString() })
      .where(and(eq(s.propuestasAsistente.id, id), eq(s.propuestasAsistente.estado, desde)))
      .returning({ id: s.propuestasAsistente.id })
    return filas.length > 0
  },
}

/** Dependencias reales para confirmar/cancelar propuestas (bloque E las usa). */
export function depsPropuestasProduccion(registro: DepsPropuestas['registro']): DepsPropuestas {
  return { repo: propuestas, ahora: () => new Date(), registro }
}

/** Dependencias reales para ejecutarTurno. La ruta HTTP (bloque E) las usa. */
export function depsProduccion(registro: DepsTurno['herramientas']): DepsTurno {
  return {
    claves,
    uso,
    descifrar,
    construirModelo: obtenerModelo,
    herramientas: registro,
    propuestas,
    ahora: () => new Date(),
    esperar: (ms) => new Promise((resolver) => setTimeout(resolver, ms)),
  }
}


const TAMANO_HISTORIAL_MODELO = 40

/** Conversaciones del usuario. Toda consulta filtra por usuarioId: un id ajeno devuelve null. */
export const conversaciones: RepositorioConversaciones = {
  async historial(id: string, usuarioId: string, limite = TAMANO_HISTORIAL_MODELO): Promise<Mensaje[] | null> {
    const [propia] = await db
      .select({ id: s.conversacionesAsistente.id })
      .from(s.conversacionesAsistente)
      .where(and(eq(s.conversacionesAsistente.id, id), eq(s.conversacionesAsistente.usuarioId, usuarioId)))
    if (!propia) return null
    const filas = await db
      .select({ rol: s.mensajesAsistente.rol, contenido: s.mensajesAsistente.contenido })
      .from(s.mensajesAsistente)
      .where(eq(s.mensajesAsistente.conversacionId, id))
      .orderBy(desc(s.mensajesAsistente.creadoEn))
      .limit(limite)
    return filas
      .reverse()
      .map((f) => ({ rol: f.rol as Mensaje['rol'], contenido: String(f.contenido) }))
  },
  async crear(usuarioId: string): Promise<string> {
    const [fila] = await db
      .insert(s.conversacionesAsistente)
      .values({ usuarioId })
      .returning({ id: s.conversacionesAsistente.id })
    return fila.id
  },
  async guardarMensajes(conversacionId: string, mensajes: Mensaje[]): Promise<void> {
    // creado_en se fija por mensaje (1 ms de diferencia) para que el orden sea estable al releer.
    const base = Date.now()
    await db.insert(s.mensajesAsistente).values(
      mensajes.map((m, i) => ({
        conversacionId,
        rol: m.rol,
        contenido: m.contenido,
        creadoEn: new Date(base + i).toISOString(),
      })),
    )
    await db
      .update(s.conversacionesAsistente)
      .set({ actualizadaEn: new Date().toISOString() })
      .where(eq(s.conversacionesAsistente.id, conversacionId))
  },
  async listar(usuarioId: string): Promise<ResumenConversacion[]> {
    const lista = await db
      .select({ id: s.conversacionesAsistente.id, actualizadaEn: s.conversacionesAsistente.actualizadaEn })
      .from(s.conversacionesAsistente)
      .where(eq(s.conversacionesAsistente.usuarioId, usuarioId))
      .orderBy(desc(s.conversacionesAsistente.actualizadaEn))
      .limit(50)
    if (lista.length === 0) return []
    // Título automático: primeras palabras del primer mensaje del usuario.
    const primeros = await db
      .select({ conversacionId: s.mensajesAsistente.conversacionId, contenido: s.mensajesAsistente.contenido })
      .from(s.mensajesAsistente)
      .where(and(inArray(s.mensajesAsistente.conversacionId, lista.map((c) => c.id)), eq(s.mensajesAsistente.rol, 'usuario')))
      .orderBy(asc(s.mensajesAsistente.creadoEn))
    const titulos = new Map<string, string>()
    for (const m of primeros) {
      if (!titulos.has(m.conversacionId)) titulos.set(m.conversacionId, tituloDe(String(m.contenido)))
    }
    return lista.map((c) => ({
      id: c.id,
      titulo: titulos.get(c.id) ?? 'Conversación nueva',
      actualizadaEn: c.actualizadaEn,
    }))
  },
}


/** Propuestas pendientes y vigentes de una conversación del usuario (null si no es suya). */
export async function propuestasPendientes(conversacionId: string, usuarioId: string) {
  const [propia] = await db
    .select({ id: s.conversacionesAsistente.id })
    .from(s.conversacionesAsistente)
    .where(and(eq(s.conversacionesAsistente.id, conversacionId), eq(s.conversacionesAsistente.usuarioId, usuarioId)))
  if (!propia) return null
  return db
    .select({
      id: s.propuestasAsistente.id,
      herramienta: s.propuestasAsistente.herramienta,
      resumen: s.propuestasAsistente.resumen,
      venceEn: s.propuestasAsistente.venceEn,
    })
    .from(s.propuestasAsistente)
    .where(and(eq(s.propuestasAsistente.conversacionId, conversacionId), eq(s.propuestasAsistente.estado, 'pendiente')))
}

/** Vista de configuración para el panel de administración. Nunca incluye claves en claro. */
export async function leerConfiguracionAdmin() {
  const filas = await db.select().from(s.configuracionAsistente)
  const valores = Object.fromEntries(filas.map((f) => [f.clave, f.valor]))
  const claves = await db
    .select({
      id: s.proveedoresAsistente.id,
      proveedor: s.proveedoresAsistente.proveedor,
      etiqueta: s.proveedoresAsistente.etiqueta,
      ultimos4: s.proveedoresAsistente.claveUltimos4,
      estado: s.proveedoresAsistente.estado,
      orden: s.proveedoresAsistente.orden,
    })
    .from(s.proveedoresAsistente)
    .orderBy(asc(s.proveedoresAsistente.orden))
  return { modelo: valores.modelo ?? null, topes: valores.topes ?? null, precios: valores.precios ?? null, claves }
}

/** Guarda una fila de configuracion_asistente (clave única). Upsert. */
export async function guardarValorConfiguracion(clave: string, valor: unknown, usuarioId: string): Promise<void> {
  await db
    .insert(s.configuracionAsistente)
    .values({ clave, valor: valor as object, actualizadaPor: usuarioId })
    .onConflictDoUpdate({
      target: s.configuracionAsistente.clave,
      set: { valor: valor as object, actualizadaPor: usuarioId, actualizadaEn: new Date().toISOString() },
    })
}

/** Agrega una clave de proveedor ya cifrada. La clave en claro nunca llega acá. */
export async function agregarClaveProveedor(p: {
  proveedor: ProveedorAsistente
  etiqueta: string
  claveCifrada: string
  ultimos4: string
}): Promise<{ id: string; ultimos4: string; orden: number }> {
  const [ultima] = await db
    .select({ orden: sql<number>`coalesce(max(${s.proveedoresAsistente.orden}), 0)` })
    .from(s.proveedoresAsistente)
  const orden = Number(ultima?.orden ?? 0) + 1
  const [fila] = await db
    .insert(s.proveedoresAsistente)
    .values({ proveedor: p.proveedor, etiqueta: p.etiqueta, claveCifrada: p.claveCifrada, claveUltimos4: p.ultimos4, orden })
    .returning({ id: s.proveedoresAsistente.id })
  return { id: fila.id, ultimos4: p.ultimos4, orden }
}

/**
 * Elimina una clave. Si ya tiene llamadas registradas (FK), no se borra: se desactiva y se borra
 * su material cifrado, así el historial de uso sigue íntegro y la clave deja de existir.
 */
export async function eliminarClaveProveedor(id: string): Promise<boolean> {
  try {
    const borradas = await db
      .delete(s.proveedoresAsistente)
      .where(eq(s.proveedoresAsistente.id, id))
      .returning({ id: s.proveedoresAsistente.id })
    return borradas.length > 0
  } catch (err) {
    if (codigoPg(err) !== '23503') throw err
    const act = await db
      .update(s.proveedoresAsistente)
      .set({ estado: 'desactivada', claveCifrada: '', claveUltimos4: '****', actualizadaEn: new Date().toISOString() })
      .where(eq(s.proveedoresAsistente.id, id))
      .returning({ id: s.proveedoresAsistente.id })
    return act.length > 0
  }
}
