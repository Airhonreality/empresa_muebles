'use server'
// A5 (plan_cotizador_tanstack_query.md): ÚNICA read action del cotizador. Escopa la
// lectura a las 10 colecciones que consume la pantalla `[proyectoId]` — sin el
// fetchSnapshotAction() de ~64 tablas (hydrate.ts) que hacía cada mutación local
// re-hidratar TODO el ERP. CotizadorSnapBridge (A6) la invalida por queryKey.
import { eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import { requireSesionEmpleado } from '@/lib/auth/session'
import type { CotizadorSnapshot } from '../queries/types'

export async function obtenerSnapshotCotizadorAction(proyectoId: string): Promise<CotizadorSnapshot> {
  // Defensa en profundidad: middleware.ts ya bloquea /erp/** sin sesión, pero esta
  // action lee datos de negocio reales — no cede a visitantes sin cookie de empleado.
  const sesion = await requireSesionEmpleado()
  if (!sesion) throw new Error('No autorizado: se requiere sesión de empleado')

  const [proyecto] = await db.select().from(s.proyectos).where(eq(s.proyectos.id, proyectoId))
  if (!proyecto) {
    return {
      proyecto: null, clientes: [], parametros: [], espacios: [], items: [],
      artefactos: [], catalogo: [], catalogoAcabados: [], contrato: null, hitos: [],
    }
  }

  const [espacios, contratosRows, catalogo, parametros, clientes, catalogoAcabados] = await Promise.all([
    db.select().from(s.espacioVariantes).where(eq(s.espacioVariantes.proyectoId, proyectoId)).orderBy(s.espacioVariantes.orden),
    db.select().from(s.contratos).where(eq(s.contratos.proyectoId, proyectoId)),
    db.select().from(s.productosCatalogo),
    db.select().from(s.parametros),
    db.select().from(s.clientes),
    db.select().from(s.catalogoAcabados),
  ])
  const contrato = contratosRows[0] ?? null

  // Escope de los hijos por los ids de este proyecto — nunca un select global.
  const espacioIds = espacios.map((e) => e.id)
  const [items, artefactos, hitos] = await Promise.all([
    espacioIds.length
      ? db.select().from(s.itemsVariante).where(inArray(s.itemsVariante.varianteId, espacioIds)).orderBy(s.itemsVariante.createdAt)
      : [],
    espacioIds.length
      ? db.select().from(s.espaciosArtefactos).where(inArray(s.espaciosArtefactos.espacioVarianteId, espacioIds))
      : [],
    contrato ? db.select().from(s.hitosPago).where(eq(s.hitosPago.contratoId, contrato.id)) : [],
  ])

  return {
    proyecto: proyecto as unknown as CotizadorSnapshot['proyecto'],
    clientes: clientes as unknown as CotizadorSnapshot['clientes'],
    parametros: parametros as unknown as CotizadorSnapshot['parametros'],
    espacios: espacios as unknown as CotizadorSnapshot['espacios'],
    items: items as unknown as CotizadorSnapshot['items'],
    artefactos: artefactos as unknown as CotizadorSnapshot['artefactos'],
    catalogo: catalogo as unknown as CotizadorSnapshot['catalogo'],
    catalogoAcabados: catalogoAcabados as unknown as CotizadorSnapshot['catalogoAcabados'],
    contrato: contrato as unknown as CotizadorSnapshot['contrato'],
    hitos: hitos as unknown as CotizadorSnapshot['hitos'],
  }
}