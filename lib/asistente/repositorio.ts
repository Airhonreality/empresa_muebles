// lib/asistente/repositorio.ts
// Implementación Drizzle de las interfaces del asistente (claves, uso) y carga de configuración.
// Es el ÚNICO archivo del asistente que toca la base. No se prueba con base real: los tests usan mocks.
import { and, asc, eq, gte, sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import { z } from 'zod'
import { descifrar } from './cifrado'
import type { ClaveRegistro, EventoRotacion, RepositorioClaves } from './claves'
import { HERRAMIENTAS } from './herramientas'
import { modeloPorDefecto, obtenerModelo, type ProveedorAsistente } from './modelo'
import type { ConfiguracionTurno, DepsTurno, LlamadaRegistro, RepositorioUso } from './bucle'
import type { DepsPropuestas, EstadoPropuesta, Propuesta, RepositorioPropuestas } from './propuestas'

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
  precios: z.object({ entradaPorMillon: z.number().nonnegative(), salidaPorMillon: z.number().nonnegative() }),
})

/**
 * Lee configuracion_asistente (una fila por clave: modelo, temperatura, topes, precios, ...).
 * Sin valores por defecto ocultos: precios son obligatorios; si falta `topes`, la configuración
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
  return {
    ...cfg,
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
export function depsProduccion(): DepsTurno {
  return {
    claves,
    uso,
    descifrar,
    construirModelo: obtenerModelo,
    herramientas: HERRAMIENTAS,
    ahora: () => new Date(),
    esperar: (ms) => new Promise((resolver) => setTimeout(resolver, ms)),
  }
}

