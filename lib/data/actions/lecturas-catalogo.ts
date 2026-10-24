'use server'

import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import { requireSesionEmpleado } from '@/lib/auth/session'
import type { CatalogoSnapshot } from '../queries/catalogo-types'

export async function obtenerSnapshotCatalogoAction(): Promise<CatalogoSnapshot> {
  const sesion = await requireSesionEmpleado()
  if (!sesion) throw new Error('No autorizado: se requiere sesión de empleado')

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
}
