'use server'
// A5 (plan_cotizador_tanstack_query.md): ÚNICA read action del cotizador. Escopa la
// lectura a las 10 colecciones que consume la pantalla `[proyectoId]` — sin el
// fetchSnapshotAction() de ~64 tablas (hydrate.ts) que hacía cada mutación local
// re-hidratar TODO el ERP. CotizadorSnapBridge (A6) la invalida por queryKey.
import { eq, inArray, isNull, and, asc } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import { requireSesionEmpleado } from '@/lib/auth/session'
import type { CotizadorSnapshot } from '../queries/types'
import type { GrupoItemHidratado, ItemVariante } from '@/lib/data/contracts'
import { aplicarContenedoresAEspacios } from '@/lib/data/contenedores'

export async function obtenerSnapshotCotizadorAction(proyectoId: string): Promise<CotizadorSnapshot> {
  // Defensa en profundidad: middleware.ts ya bloquea /erp/** sin sesión, pero esta
  // action lee datos de negocio reales — no cede a visitantes sin cookie de empleado.
  const sesion = await requireSesionEmpleado()
  if (!sesion) throw new Error('No autorizado: se requiere sesión de empleado')

  const [proyecto] = await db.select().from(s.proyectos).where(eq(s.proyectos.id, proyectoId))
  if (!proyecto) {
    return {
      proyecto: null, clientes: [], parametros: [], espacios: [], items: [],
      artefactos: [], catalogo: [], catalogoAcabados: [], proveedores: [], contrato: null, hitos: [],
      gruposItem: [], espacioVarianteAcabados: [],
    }
  }

  const [espacios, contratosRows, catalogo, parametros, clientes, catalogoAcabados, proveedores] = await Promise.all([
    db.select().from(s.espacioVariantes).where(eq(s.espacioVariantes.proyectoId, proyectoId)).orderBy(s.espacioVariantes.orden),
    db.select().from(s.contratos).where(eq(s.contratos.proyectoId, proyectoId)),
    db.select().from(s.productosCatalogo),
    db.select().from(s.parametros),
    db.select().from(s.clientes),
    db.select().from(s.catalogoAcabados),
    db.select().from(s.proveedores),
  ])
  const contrato = contratosRows[0] ?? null

  // Escope de los hijos por los ids de este proyecto — nunca un select global.
  const espacioIds = espacios.map((e) => e.id)
  const [items, artefactos, hitos, gruposItem, espacioVarianteAcabados, contenedores] = await Promise.all([
    espacioIds.length
      ? db.select().from(s.itemsVariante).where(inArray(s.itemsVariante.varianteId, espacioIds)).orderBy(s.itemsVariante.createdAt)
      : [],
    espacioIds.length
      ? db.select().from(s.espaciosArtefactos).where(inArray(s.espaciosArtefactos.espacioVarianteId, espacioIds))
      : [],
    contrato ? db.select().from(s.hitosPago).where(eq(s.hitosPago.contratoId, contrato.id)) : [],
    // t-157 (2026-09-10): grupos de ítems de cotización, escopados a los espacios de este proyecto.
    espacioIds.length
      ? db.select().from(s.gruposItem).where(inArray(s.gruposItem.espacioVarianteId, espacioIds))
      : [],
    // t-172 (2026-09-30): acabados asociados a cada espacio, escopados a los espacios de este proyecto.
    espacioIds.length
      ? db.select().from(s.espacioVarianteAcabados).where(inArray(s.espacioVarianteAcabados.espacioVarianteId, espacioIds))
      : [],
    // 2026-10-29 (Fase 2): descripción/fotos viven en contenedores_descriptivos. Se leen acá y se
    // proyectan sobre cada espacio para no romper a todos los consumidores que usan
    // espacio.descripcion / espacio.fotos* (cotizador, propuesta, contrato, presentación).
    espacioIds.length
      ? db.select().from(s.contenedoresDescriptivos).where(inArray(s.contenedoresDescriptivos.espacioVarianteId, espacioIds))
      : [],
  ])

  return {
    proyecto: proyecto as unknown as CotizadorSnapshot['proyecto'],
    clientes: clientes as unknown as CotizadorSnapshot['clientes'],
    parametros: parametros as unknown as CotizadorSnapshot['parametros'],
    espacios: aplicarContenedoresAEspacios(espacios, contenedores) as unknown as CotizadorSnapshot['espacios'],
    items: items as unknown as CotizadorSnapshot['items'],
    artefactos: artefactos as unknown as CotizadorSnapshot['artefactos'],
    catalogo: catalogo as unknown as CotizadorSnapshot['catalogo'],
    catalogoAcabados: catalogoAcabados as unknown as CotizadorSnapshot['catalogoAcabados'],
    proveedores: proveedores as unknown as CotizadorSnapshot['proveedores'],
    contrato: contrato as unknown as CotizadorSnapshot['contrato'],
    hitos: hitos as unknown as CotizadorSnapshot['hitos'],
    gruposItem: gruposItem as unknown as CotizadorSnapshot['gruposItem'],
    espacioVarianteAcabados: espacioVarianteAcabados as unknown as CotizadorSnapshot['espacioVarianteAcabados'],
  }
}

/** Cargar grupo con ítems, subgrupos y contenedor descriptivo.
 * Resultado: árbol completo para UI (colapsable). */
export async function obtenerGrupoItemHidratado(
  grupoId: string,
): Promise<GrupoItemHidratado | null> {
  return db.transaction(async (tx) => {
    const [grupo] = await tx.select().from(s.gruposItem).where(eq(s.gruposItem.id, grupoId))
    if (!grupo) return null

    // Cargar contenedor descriptivo
    const [contenedor] = await tx
      .select()
      .from(s.contenedoresDescriptivos)
      .where(eq(s.contenedoresDescriptivos.grupoItemId, grupoId))

    // Cargar items directos de este grupo
    const items = await tx
      .select()
      .from(s.itemsVariante)
      .where(eq(s.itemsVariante.grupoItemId, grupoId))
      .orderBy(asc(s.itemsVariante.createdAt))

    // Cargar subgrupos recursivamente
    const subgrupos: GrupoItemHidratado[] = []
    const hijosDirectos = await tx
      .select()
      .from(s.gruposItem)
      .where(eq(s.gruposItem.padreId, grupoId))
      .orderBy(asc(s.gruposItem.orden))

    for (const hijo of hijosDirectos) {
      const subgrupo = await obtenerGrupoItemHidratado(hijo.id)
      if (subgrupo) subgrupos.push(subgrupo)
    }

    return {
      ...grupo,
      contenedor: contenedor || null,
      items: items as unknown as ItemVariante[],
      subgrupos,
    } as GrupoItemHidratado
  })
}

/** Cargar todos los grupos de un espacio (solo root, sin subgrupos anidados en resultado).
 * Para cotizador: muestra grupos "hermanos" dentro del espacio. */
export async function obtenerGruposItemRootDelEspacio(
  espacioVarianteId: string,
): Promise<GrupoItemHidratado[]> {
  const gruposRoot = await db
    .select()
    .from(s.gruposItem)
    .where(
      and(
        eq(s.gruposItem.espacioVarianteId, espacioVarianteId),
        isNull(s.gruposItem.padreId), // Solo root
      ),
    )
    .orderBy(asc(s.gruposItem.orden))

  const resultado: GrupoItemHidratado[] = []
  for (const grupo of gruposRoot) {
    const hidratado = await obtenerGrupoItemHidratado(grupo.id)
    if (hidratado) resultado.push(hidratado)
  }
  return resultado
}