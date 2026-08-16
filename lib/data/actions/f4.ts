'use server'
// Server Actions del cluster F4: compras (ítems de OC, recepción de material, herramientas).
// Porta 1:1 la lógica de lib/data/mock-store.ts. Ver plan_f10_migracion.md §3.1d.
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import type {
  ItemOrdenCompra, RecepcionMaterial, EstadoRecepcionMaterial, Herramienta, EstadoOperativoHerramienta, OrdenCompra,
} from '../contracts'

export async function crearItemOrdenCompraAction(data: { ordenCompraId: string; productoCatalogoId?: string | null; especificacion?: string | null; cantidadEsperada: number }): Promise<ItemOrdenCompra | null> {
  const tieneProducto = !!data.productoCatalogoId
  const tieneEspecificacion = !!data.especificacion && data.especificacion.trim().length > 0
  if (tieneProducto === tieneEspecificacion) return null
  const [nuevo] = await db.insert(s.itemsOrdenCompra).values({
    ordenCompraId: data.ordenCompraId, productoCatalogoId: data.productoCatalogoId ?? null,
    especificacion: data.especificacion ?? null, cantidadEsperada: data.cantidadEsperada,
  }).returning()
  return nuevo as unknown as ItemOrdenCompra
}

export async function crearItemsOrdenCompraDesdeSugeridosAction(ordenCompraId: string, sugeridos: { productoCatalogoId: string; cantidad: number }[]): Promise<ItemOrdenCompra[]> {
  if (sugeridos.length === 0) return []
  const nuevos = await db.insert(s.itemsOrdenCompra).values(sugeridos.map(sg => ({
    ordenCompraId, productoCatalogoId: sg.productoCatalogoId, cantidadEsperada: sg.cantidad,
  }))).returning()
  return nuevos as unknown as ItemOrdenCompra[]
}

export async function crearRecepcionMaterialAction(data: { ordenCompraId: string; proyectoId?: string | null }): Promise<RecepcionMaterial> {
  const [nuevo] = await db.insert(s.recepcionesMaterial).values({
    ordenCompraId: data.ordenCompraId, proyectoId: data.proyectoId ?? null,
  }).returning()
  return nuevo as unknown as RecepcionMaterial
}

export async function actualizarChecksRecepcionAction(id: string, data: { checkPedidoBien: boolean; checkDespachoBien: boolean; checkMaterial: boolean; descripcionDefecto?: string | null }): Promise<RecepcionMaterial | null> {
  return db.transaction(async (tx) => {
    const [actual] = await tx.select().from(s.recepcionesMaterial).where(eq(s.recepcionesMaterial.id, id))
    if (!actual) return null
    const completa = data.checkPedidoBien && data.checkDespachoBien && data.checkMaterial
    if (!completa && (!data.descripcionDefecto || data.descripcionDefecto.trim().length === 0)) return null
    const estado: EstadoRecepcionMaterial = completa ? 'recibido_verificado' : 'recibido_defectuoso'
    const [actualizado] = await tx.update(s.recepcionesMaterial).set({
      checkPedidoBien: data.checkPedidoBien, checkDespachoBien: data.checkDespachoBien, checkMaterial: data.checkMaterial,
      descripcionDefecto: data.descripcionDefecto ?? null, estado,
    }).where(eq(s.recepcionesMaterial.id, id)).returning()

    if (completa) {
      await tx.update(s.ordenesCompra).set({ estado: 'recibida_verificada', updatedAt: new Date().toISOString() }).where(eq(s.ordenesCompra.id, actual.ordenCompraId))
      const items = await tx.select().from(s.itemsOrdenCompra).where(eq(s.itemsOrdenCompra.ordenCompraId, actual.ordenCompraId))
      for (const it of items) {
        await tx.update(s.itemsOrdenCompra).set({ recibidoCantidad: it.cantidadEsperada, sinDefectos: true }).where(eq(s.itemsOrdenCompra.id, it.id))
      }
    }
    return actualizado as unknown as RecepcionMaterial
  })
}

export async function crearHerramientaAction(data: { nombre: string; valor: string; fotoUrl?: string | null; proveedorId?: string | null }): Promise<Herramienta> {
  const [nuevo] = await db.insert(s.herramientas).values({
    nombre: data.nombre, estadoOperativo: 'operativa', valor: data.valor,
    fotoUrl: data.fotoUrl ?? null, proveedorId: data.proveedorId ?? null,
  }).returning()
  return nuevo as unknown as Herramienta
}

export async function actualizarEstadoHerramientaAction(id: string, estado: EstadoOperativoHerramienta): Promise<Herramienta | null> {
  const [actualizado] = await db.update(s.herramientas).set({ estadoOperativo: estado }).where(eq(s.herramientas.id, id)).returning()
  return (actualizado as unknown as Herramienta) ?? null
}

export async function reponerHerramientaAction(id: string): Promise<{ herramienta: Herramienta; ordenCompra: OrdenCompra } | null> {
  return db.transaction(async (tx) => {
    const [herramienta] = await tx.select().from(s.herramientas).where(eq(s.herramientas.id, id))
    if (!herramienta) return null

    if (herramienta.ordenCompraReposicionId) {
      const [existente] = await tx.select().from(s.ordenesCompra).where(eq(s.ordenesCompra.id, herramienta.ordenCompraReposicionId))
      if (existente && existente.estado !== 'cancelada' && existente.estado !== 'rechazada' && existente.estado !== 'pagada') {
        return { herramienta: herramienta as unknown as Herramienta, ordenCompra: existente as unknown as OrdenCompra }
      }
    }

    if (!herramienta.proveedorId) return null

    const [nuevaOC] = await tx.insert(s.ordenesCompra).values({
      codigoOrden: `OC-${Date.now()}`, proveedorId: herramienta.proveedorId, montoTotal: herramienta.valor,
      estado: 'solicitada', mecanicaPago: 'unico',
    }).returning()
    const [herramientaActualizada] = await tx.update(s.herramientas).set({
      estadoOperativo: 'necesita_reposicion', ordenCompraReposicionId: nuevaOC.id,
    }).where(eq(s.herramientas.id, id)).returning()

    return { herramienta: herramientaActualizada as unknown as Herramienta, ordenCompra: nuevaOC as unknown as OrdenCompra }
  })
}
