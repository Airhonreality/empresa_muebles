// lib/asistente/operaciones/cotizaciones-produccion.ts
// Adaptador Drizzle de lectura de cotizaciones (proyectos) para el asistente. Solo lectura.
// Reglas: solo espacios activos (la variante que se cotiza) y solo ítems no anulados y no referenciales.
import { and, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import type { DetalleProyecto, FilaProyectoBusqueda, PuertoCotizaciones } from '../ops/cotizacion'

export const cotizacionesDb: PuertoCotizaciones = {
  async proyectos(): Promise<FilaProyectoBusqueda[]> {
    return db
      .select({
        id: s.proyectos.id,
        codigo: s.proyectos.codigo,
        nombreProyecto: s.proyectos.nombreProyecto,
        estado: s.proyectos.estado,
        clienteId: s.proyectos.clienteId,
        clienteNombre: s.clientes.nombre,
        creadoEn: s.proyectos.createdAt,
      })
      .from(s.proyectos)
      .leftJoin(s.clientes, eq(s.proyectos.clienteId, s.clientes.id))
  },

  async materialesPorProyecto(): Promise<Map<string, number>> {
    const filas = await db
      .select({
        proyectoId: s.espacioVariantes.proyectoId,
        materiales: sql<string>`coalesce(sum(${s.itemsVariante.totalLinea}), 0)`,
      })
      .from(s.itemsVariante)
      .innerJoin(s.espacioVariantes, eq(s.itemsVariante.varianteId, s.espacioVariantes.id))
      .where(and(eq(s.espacioVariantes.activa, true), eq(s.itemsVariante.anulado, false), eq(s.itemsVariante.esReferencial, false)))
      .groupBy(s.espacioVariantes.proyectoId)
    return new Map(filas.map((f) => [f.proyectoId, Number(f.materiales)]))
  },

  async detalle(proyectoId: string): Promise<DetalleProyecto | null> {
    const [p] = await db
      .select({
        id: s.proyectos.id,
        codigo: s.proyectos.codigo,
        nombreProyecto: s.proyectos.nombreProyecto,
        estado: s.proyectos.estado,
        direccionObra: s.proyectos.direccionObra,
        aplicaIva: s.proyectos.aplicaIva,
        porcentajeIva: s.proyectos.porcentajeIva,
        clienteId: s.proyectos.clienteId,
        clienteNombre: s.clientes.nombre,
      })
      .from(s.proyectos)
      .leftJoin(s.clientes, eq(s.proyectos.clienteId, s.clientes.id))
      .where(eq(s.proyectos.id, proyectoId))
    if (!p) return null

    const espacios = await db
      .select({ id: s.espacioVariantes.id, nombre: s.espacioVariantes.nombreEspacio, tipoEspacio: s.espacioVariantes.tipoEspacio })
      .from(s.espacioVariantes)
      .where(and(eq(s.espacioVariantes.proyectoId, proyectoId), eq(s.espacioVariantes.activa, true)))
      .orderBy(s.espacioVariantes.orden)

    const ids = espacios.map((e) => e.id)
    const items = ids.length === 0
      ? []
      : await db
          .select({
            varianteId: s.itemsVariante.varianteId,
            productoId: s.itemsVariante.catalogoId,
            nombre: s.itemsVariante.nombrePersonalizado,
            cantidad: s.itemsVariante.cantidad,
            precioUnitario: s.itemsVariante.precioUnitario,
            totalLinea: s.itemsVariante.totalLinea,
          })
          .from(s.itemsVariante)
          .where(and(inArray(s.itemsVariante.varianteId, ids), eq(s.itemsVariante.anulado, false), eq(s.itemsVariante.esReferencial, false)))

    return {
      id: p.id,
      codigo: p.codigo,
      nombreProyecto: p.nombreProyecto,
      estado: p.estado,
      direccionObra: p.direccionObra,
      aplicaIva: p.aplicaIva,
      porcentajeIva: p.porcentajeIva,
      cliente: p.clienteId && p.clienteNombre ? { id: p.clienteId, nombre: p.clienteNombre } : null,
      espacios: espacios.map((e) => ({
        id: e.id,
        nombre: e.nombre,
        tipoEspacio: e.tipoEspacio,
        items: items
          .filter((i) => i.varianteId === e.id)
          .map((i) => ({
            productoId: i.productoId,
            nombre: i.nombre,
            cantidad: i.cantidad,
            precioUnitario: i.precioUnitario,
            totalLinea: i.totalLinea,
          })),
      })),
    }
  },
}
