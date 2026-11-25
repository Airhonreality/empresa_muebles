'use server'

import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import type { CatalogoSnapshot } from '../queries/catalogo-types'
import { protegerAccion } from '@/lib/auth/accion'

export const obtenerSnapshotCatalogoAction = protegerAccion({ permiso: "catalogo:leer" }, async function obtenerSnapshotCatalogoAction(): Promise<CatalogoSnapshot> {
  const [catalogo, productosTienda, productosTiendaComponentes, proveedores] = await Promise.all([
    db.select().from(s.productosCatalogo),
    db.select().from(s.productosTienda),
    db.select().from(s.productosTiendaComponentes),
    db.select().from(s.proveedores),
  ])

  return {
    catalogo: catalogo as unknown as CatalogoSnapshot['catalogo'],
    productosTienda: productosTienda as unknown as CatalogoSnapshot['productosTienda'],
    productosTiendaComponentes: productosTiendaComponentes as unknown as CatalogoSnapshot['productosTiendaComponentes'],
    proveedores: proveedores as unknown as CatalogoSnapshot['proveedores'],
  }
});
