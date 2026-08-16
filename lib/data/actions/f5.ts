'use server'
// Server Actions del cluster F5: taller, calidad, instalación, entrega, garantía.
// Porta 1:1 la lógica de lib/data/mock-store.ts. Ver plan_f10_migracion.md §3.1d.
import { eq, and, desc } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import { P24, rangoInstalacionValido, dentroGarantiaContractual } from '@/lib/modules/f4f5f6/gates'
import type {
  OrdenTrabajo, TipoOrdenTrabajo, PedidoWeb, CitacionCalidad, Reproceso, OrigenReproceso,
  Instalacion, ActaEntrega, CasoGarantia, CitaGarantia, EstadoProyecto,
} from '../contracts'

async function setProyectoEstado(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], id: string, estado: EstadoProyecto): Promise<void> {
  const [actual] = await tx.select().from(s.proyectos).where(eq(s.proyectos.id, id))
  if (!actual) return
  await tx.update(s.proyectos).set({ estado, updatedAt: new Date().toISOString() }).where(eq(s.proyectos.id, id))
  await tx.insert(s.proyectosEstadosHistorial).values({
    proyectoId: id, estadoAnterior: actual.estado, estadoNuevo: estado, cambiadoPor: null, razon: null,
  })
}

export async function crearOrdenTrabajoAction(data: { proyectoId: string; tipo: TipoOrdenTrabajo; pedidoWebId?: string | null }): Promise<OrdenTrabajo> {
  const [nuevo] = await db.insert(s.ordenesTrabajo).values({
    proyectoId: data.proyectoId, pedidoWebId: data.pedidoWebId ?? null, tipo: data.tipo, estado: 'abierta',
    codigoOrden: `OT-${Date.now()}`,
  }).returning()
  return nuevo as unknown as OrdenTrabajo
}

export async function crearPedidoWebAction(data: { clienteId: string; totalPedido: string }): Promise<PedidoWeb> {
  const [nuevo] = await db.insert(s.pedidosWeb).values({
    clienteId: data.clienteId, proyectoId: null, estado: 'nuevo', totalPedido: data.totalPedido,
  }).returning()
  return nuevo as unknown as PedidoWeb
}

export async function actualizarEstadoPedidoWebAction(id: string, estado: string): Promise<PedidoWeb | null> {
  const [actualizado] = await db.update(s.pedidosWeb).set({ estado }).where(eq(s.pedidosWeb.id, id)).returning()
  return (actualizado as unknown as PedidoWeb) ?? null
}

export async function engancharPedidoWebAction(id: string, proyectoId: string): Promise<PedidoWeb | null> {
  if (!proyectoId) return null
  return db.transaction(async (tx) => {
    const [actual] = await tx.select().from(s.pedidosWeb).where(eq(s.pedidosWeb.id, id))
    if (!actual) return null
    if (actual.estado === 'enganchado') return actual as unknown as PedidoWeb
    const [actualizado] = await tx.update(s.pedidosWeb).set({ estado: 'enganchado', proyectoId }).where(eq(s.pedidosWeb.id, id)).returning()
    await tx.insert(s.ordenesTrabajo).values({
      proyectoId, pedidoWebId: id, tipo: 'produccion', estado: 'abierta', codigoOrden: `OT-${Date.now()}`,
    })
    return actualizado as unknown as PedidoWeb
  })
}

export async function crearCitacionCalidadAction(data: { proyectoId: string; modulosIds: string[]; fecha: string }): Promise<CitacionCalidad> {
  const [nuevo] = await db.insert(s.citacionesCalidad).values({
    proyectoId: data.proyectoId, modulosIds: data.modulosIds, estado: 'citada', fecha: data.fecha,
  }).returning()
  return nuevo as unknown as CitacionCalidad
}

export async function crearReprocesoAction(data: { proyectoId: string; origen: OrigenReproceso; moduloId?: string | null; culpable?: string | null; granularidad?: 'modulo' | 'componente' | null; descripcion?: string | null }): Promise<Reproceso> {
  const [nuevo] = await db.insert(s.reprocesos).values({
    proyectoId: data.proyectoId, origen: data.origen, moduloId: data.moduloId ?? null, culpable: data.culpable ?? null,
    granularidad: data.granularidad ?? null, descripcion: data.descripcion ?? null, estado: 'abierto',
  }).returning()
  return nuevo as unknown as Reproceso
}

export async function programarInstalacionAction(data: { proyectoId: string; rangoFechaInicio: string; rangoFechaFin: string }): Promise<Instalacion | null> {
  if (!rangoInstalacionValido(data.rangoFechaInicio, data.rangoFechaFin)) return null
  const [nuevo] = await db.insert(s.instalaciones).values({
    proyectoId: data.proyectoId, rangoFechaInicio: data.rangoFechaInicio, rangoFechaFin: data.rangoFechaFin, estado: 'programada',
  }).returning()
  return nuevo as unknown as Instalacion
}

export async function iniciarInstalacionAction(id: string): Promise<Instalacion | null> {
  return db.transaction(async (tx) => {
    const [inst] = await tx.select().from(s.instalaciones).where(eq(s.instalaciones.id, id))
    if (!inst) return null
    const [proyecto] = await tx.select().from(s.proyectos).where(eq(s.proyectos.id, inst.proyectoId))
    if (!proyecto) return null
    const citaciones = await tx.select().from(s.citacionesCalidad).where(eq(s.citacionesCalidad.proyectoId, inst.proyectoId))
    const verifs = await tx.select().from(s.verificaciones).where(eq(s.verificaciones.proyectoId, inst.proyectoId))
    if (!P24(proyecto, citaciones, verifs)) return null
    const checksBuenos = await tx.select().from(s.checksProduccion).where(and(
      eq(s.checksProduccion.proyectoId, inst.proyectoId), eq(s.checksProduccion.desenlaceFinal, 'todo_bien'),
    )).orderBy(desc(s.checksProduccion.createdAt)).limit(1)
    const adelantadaPor = checksBuenos[0]?.id ?? null
    const [actualizado] = await tx.update(s.instalaciones).set({
      estado: 'en_curso', adelantadaPor, updatedAt: new Date().toISOString(),
    }).where(eq(s.instalaciones.id, id)).returning()
    await setProyectoEstado(tx, inst.proyectoId, 'en_instalacion')
    return actualizado as unknown as Instalacion
  })
}

export async function marcarInstaladaAction(id: string): Promise<Instalacion | null> {
  return db.transaction(async (tx) => {
    const [inst] = await tx.select().from(s.instalaciones).where(eq(s.instalaciones.id, id))
    if (!inst) return null
    const [actualizado] = await tx.update(s.instalaciones).set({ estado: 'instalada', updatedAt: new Date().toISOString() }).where(eq(s.instalaciones.id, id)).returning()
    await setProyectoEstado(tx, inst.proyectoId, 'instalado')
    return actualizado as unknown as Instalacion
  })
}

export async function marcarFallidaInstalacionAction(id: string, motivo: string): Promise<Instalacion | null> {
  return db.transaction(async (tx) => {
    const [inst] = await tx.select().from(s.instalaciones).where(eq(s.instalaciones.id, id))
    if (!inst) return null
    const [actualizado] = await tx.update(s.instalaciones).set({ estado: 'fallida', updatedAt: new Date().toISOString() }).where(eq(s.instalaciones.id, id)).returning()
    await tx.insert(s.reprocesos).values({ proyectoId: inst.proyectoId, origen: 'instalacion', descripcion: motivo, estado: 'abierto' })
    return actualizado as unknown as Instalacion
  })
}

export async function generarActaEntregaAction(proyectoId: string, data?: { holguraOperativaDias?: number; fotos?: string[]; observaciones?: string | null }): Promise<ActaEntrega | null> {
  return db.transaction(async (tx) => {
    const [instalada] = await tx.select().from(s.instalaciones).where(and(eq(s.instalaciones.proyectoId, proyectoId), eq(s.instalaciones.estado, 'instalada')))
    if (!instalada) return null
    const [nuevo] = await tx.insert(s.actasEntrega).values({
      proyectoId, pdfUrl: `https://r2.mock/actas/${proyectoId}.pdf`, estado: 'generada',
      holguraOperativaDias: data?.holguraOperativaDias ?? 12, fotos: data?.fotos ?? [], observaciones: data?.observaciones ?? null,
    }).returning()
    return nuevo as unknown as ActaEntrega
  })
}

export async function enviarActaEntregaAction(id: string): Promise<ActaEntrega | null> {
  const [actual] = await db.select().from(s.actasEntrega).where(eq(s.actasEntrega.id, id))
  if (!actual || !actual.pdfUrl) return null
  const [actualizado] = await db.update(s.actasEntrega).set({ estado: 'enviada', updatedAt: new Date().toISOString() }).where(eq(s.actasEntrega.id, id)).returning()
  return actualizado as unknown as ActaEntrega
}

export async function firmarActaEntregaAction(id: string): Promise<ActaEntrega | null> {
  return db.transaction(async (tx) => {
    const [actual] = await tx.select().from(s.actasEntrega).where(eq(s.actasEntrega.id, id))
    if (!actual) return null
    const [actualizado] = await tx.update(s.actasEntrega).set({ estado: 'firmada', updatedAt: new Date().toISOString() }).where(eq(s.actasEntrega.id, id)).returning()
    await setProyectoEstado(tx, actual.proyectoId, 'entregado')
    return actualizado as unknown as ActaEntrega
  })
}

export async function reportarCasoGarantiaAction(data: { proyectoId: string; moduloId?: string | null; clienteId?: string | null; descripcion: string; fotos?: string[] }): Promise<CasoGarantia | null> {
  return db.transaction(async (tx) => {
    const [proyecto] = await tx.select().from(s.proyectos).where(eq(s.proyectos.id, data.proyectoId))
    if (!proyecto || proyecto.estado !== 'entregado') return null
    const fotos = data.fotos ?? []
    if (fotos.length > 5) return null
    const historial = await tx.select().from(s.proyectosEstadosHistorial).where(and(
      eq(s.proyectosEstadosHistorial.proyectoId, data.proyectoId), eq(s.proyectosEstadosHistorial.estadoNuevo, 'entregado'),
    )).orderBy(desc(s.proyectosEstadosHistorial.createdAt)).limit(1)
    const fechaEntrega = historial[0]?.createdAt ?? proyecto.updatedAt
    const now = new Date().toISOString()
    const [nuevo] = await tx.insert(s.casosGarantia).values({
      proyectoId: data.proyectoId, moduloId: data.moduloId ?? null, clienteId: data.clienteId ?? proyecto.clienteId,
      descripcion: data.descripcion, fotos, estado: 'reportado',
      dentroGarantiaContractual: dentroGarantiaContractual(fechaEntrega, now, proyecto.garantiaAnios ?? 2),
      fechaReporte: now,
    }).returning()
    return nuevo as unknown as CasoGarantia
  })
}

export async function diagnosticarCasoGarantiaAction(id: string, diagnostico: string): Promise<CasoGarantia | null> {
  if (diagnostico.trim().length === 0) return null
  const [actualizado] = await db.update(s.casosGarantia).set({ diagnostico, estado: 'diagnosticado', updatedAt: new Date().toISOString() }).where(eq(s.casosGarantia.id, id)).returning()
  return (actualizado as unknown as CasoGarantia) ?? null
}

export async function crearOrdenReparacionAction(id: string): Promise<CasoGarantia | null> {
  return db.transaction(async (tx) => {
    const [caso] = await tx.select().from(s.casosGarantia).where(eq(s.casosGarantia.id, id))
    if (!caso) return null
    await tx.insert(s.ordenesTrabajo).values({ proyectoId: caso.proyectoId, tipo: 'garantia', estado: 'abierta', codigoOrden: `OT-${Date.now()}` })
    const [actualizado] = await tx.update(s.casosGarantia).set({ estado: 'en_reparacion', updatedAt: new Date().toISOString() }).where(eq(s.casosGarantia.id, id)).returning()
    return actualizado as unknown as CasoGarantia
  })
}

export async function dispararReprocesoGarantiaAction(id: string): Promise<CasoGarantia | null> {
  return db.transaction(async (tx) => {
    const [caso] = await tx.select().from(s.casosGarantia).where(eq(s.casosGarantia.id, id))
    if (!caso || !caso.dentroGarantiaContractual) return null
    await tx.insert(s.reprocesos).values({
      proyectoId: caso.proyectoId, origen: 'garantia', moduloId: caso.moduloId,
      granularidad: caso.moduloId ? 'modulo' : null, descripcion: caso.descripcion, estado: 'abierto',
    })
    const [actualizado] = await tx.update(s.casosGarantia).set({ estado: 'en_reparacion', updatedAt: new Date().toISOString() }).where(eq(s.casosGarantia.id, id)).returning()
    return actualizado as unknown as CasoGarantia
  })
}

export async function resolverCasoGarantiaAction(id: string, solucionAplicada: string): Promise<CasoGarantia | null> {
  if (solucionAplicada.trim().length === 0) return null
  const [actualizado] = await db.update(s.casosGarantia).set({ solucionAplicada, estado: 'resuelto', updatedAt: new Date().toISOString() }).where(eq(s.casosGarantia.id, id)).returning()
  return (actualizado as unknown as CasoGarantia) ?? null
}

export async function cerrarCasoGarantiaAction(id: string): Promise<CasoGarantia | null> {
  const [actualizado] = await db.update(s.casosGarantia).set({ estado: 'cerrado', updatedAt: new Date().toISOString() }).where(eq(s.casosGarantia.id, id)).returning()
  return (actualizado as unknown as CasoGarantia) ?? null
}

export async function agendarCitaGarantiaAction(data: { casoId: string; proyectoId: string; fecha: string }): Promise<CitaGarantia> {
  const [nuevo] = await db.insert(s.citasGarantia).values(data).returning()
  return nuevo as unknown as CitaGarantia
}
