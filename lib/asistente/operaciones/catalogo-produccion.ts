// lib/asistente/operaciones/catalogo-produccion.ts
// Adaptador Drizzle del catálogo para el asistente (solo lectura de productos vigentes).
import { and, eq, isNotNull } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import type { PuertoCatalogo } from '../ops/catalogo'

export const catalogoDb: PuertoCatalogo = {
  async productosVigentes() {
    // Vigente = no anulado y con precio público (sin precio no se puede cotizar).
    return db
      .select({
        id: s.productosCatalogo.id,
        descripcion: s.productosCatalogo.descripcion,
        sku: s.productosCatalogo.sku,
        categoria: s.productosCatalogo.categoriaComercial,
        precioPublico: s.productosCatalogo.precioPublico,
        unidad: s.productosCatalogo.unidadMedida,
      })
      .from(s.productosCatalogo)
      .where(and(eq(s.productosCatalogo.anulado, false), isNotNull(s.productosCatalogo.precioPublico)))
      .then((filas) => filas.map((f) => ({ ...f, precioPublico: f.precioPublico ?? '0' })))
  },
}
