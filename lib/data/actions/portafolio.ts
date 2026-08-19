'use server'
// Server Actions del cluster F-03 (portafolio de proyectos) + testimonios + módulos-artefactos + F-15 (bitácora).
// Porta 1:1 la lógica de lib/data/mock-store.ts. Ver plan_f10_migracion.md §3.1d.
import { eq, count } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import type {
  Portafolio, Testimonio, ModuloArtefacto, TipoModuloArtefacto, FuenteModuloArtefacto, BitacoraArticulo,
} from '../contracts'

// Lectura server-side para páginas públicas (SSR/generateMetadata) que corren fuera de
// <DataStoreProvider> (no hay React ni useDataStore() disponible ahí). Réplica del patrón
// dual DATA_IMPL de lib/auth/session.ts: drizzle consulta directo, mock usa el singleton
// getDataStore() (server-only, no el hook de React) — t-133/t-134.
export async function obtenerPortafolioPorSlugAction(slug: string): Promise<Portafolio | null> {
  if ((process.env.DATA_IMPL ?? 'mock') === 'drizzle') {
    const [row] = await db.select().from(s.portafolio).where(eq(s.portafolio.slug, slug)).limit(1)
    return (row as unknown as Portafolio) ?? null
  }
  const { getDataStore } = await import('@/lib/data/store')
  const store = getDataStore()
  return store.portafolio.listar().find((p) => p.slug === slug) ?? null
}

export async function crearPortafolioAction(data: Partial<Portafolio> & { proyectoId: string; titulo: string; categoriaEspacio: string; slug: string }): Promise<Portafolio> {
  return db.transaction(async (tx) => {
    let orden = data.orden
    if (orden === undefined) {
      const [{ value }] = await tx.select({ value: count() }).from(s.portafolio)
      orden = value
    }
    const [nuevo] = await tx.insert(s.portafolio).values({
      proyectoId: data.proyectoId, titulo: data.titulo, descripcionComercial: data.descripcionComercial ?? null,
      categoriaEspacio: data.categoriaEspacio, espacioVarianteId: data.espacioVarianteId ?? null, materialesDestacados: data.materialesDestacados ?? [],
      precioReferencial: data.precioReferencial ?? null, imagenPortafolioUrl: data.imagenPortafolioUrl ?? null,
      galeriaPortafolioUrl: data.galeriaPortafolioUrl ?? [], barrio: data.barrio ?? null, tipoProyecto: data.tipoProyecto ?? null,
      publicado: data.publicado ?? false, destacado: data.destacado ?? false, orden, slug: data.slug,
    }).returning()
    return nuevo as unknown as Portafolio
  })
}

export async function actualizarPortafolioAction(
  id: string,
  partial: Partial<Pick<Portafolio, 'titulo' | 'descripcionComercial' | 'categoriaEspacio' | 'espacioVarianteId' | 'materialesDestacados' | 'precioReferencial' | 'imagenPortafolioUrl' | 'galeriaPortafolioUrl' | 'barrio' | 'tipoProyecto' | 'destacado' | 'orden'>>
): Promise<Portafolio | null> {
  const [actualizado] = await db.update(s.portafolio).set({ ...partial, updatedAt: new Date().toISOString() }).where(eq(s.portafolio.id, id)).returning()
  return (actualizado as unknown as Portafolio) ?? null
}

export async function publicarPortafolioAction(id: string): Promise<Portafolio | null> {
  const [actualizado] = await db.update(s.portafolio).set({ publicado: true, updatedAt: new Date().toISOString() }).where(eq(s.portafolio.id, id)).returning()
  return (actualizado as unknown as Portafolio) ?? null
}

export async function despublicarPortafolioAction(id: string): Promise<Portafolio | null> {
  const [actualizado] = await db.update(s.portafolio).set({ publicado: false, updatedAt: new Date().toISOString() }).where(eq(s.portafolio.id, id)).returning()
  return (actualizado as unknown as Portafolio) ?? null
}

export async function crearTestimonioAction(data: Partial<Testimonio> & { contenido: string }): Promise<Testimonio> {
  const [nuevo] = await db.insert(s.testimonios).values({
    contenido: data.contenido, nombreAutor: data.nombreAutor ?? null, rating: data.rating ?? null, curado: data.curado ?? false, aprobado: data.aprobado ?? false,
    publicado: data.publicado ?? false, fuente: data.fuente ?? 'GBP', barrio: data.barrio ?? null,
    tipoProyecto: data.tipoProyecto ?? null, urlFuente: data.urlFuente ?? null, fechaPublicacion: data.fechaPublicacion ?? null,
    clienteId: data.clienteId ?? null, proyectoId: data.proyectoId ?? null,
  }).returning()
  return nuevo as unknown as Testimonio
}

export async function actualizarTestimonioAction(id: string, partial: Partial<Testimonio>): Promise<Testimonio | null> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _omit, createdAt: _c, ...rest } = partial as Partial<Testimonio> & { id?: string; createdAt?: string }
  const [actualizado] = await db.update(s.testimonios).set({ ...rest, updatedAt: new Date().toISOString() }).where(eq(s.testimonios.id, id)).returning()
  return (actualizado as unknown as Testimonio) ?? null
}

export async function publicarTestimonioAction(id: string): Promise<Testimonio | null> {
  const [actualizado] = await db.update(s.testimonios).set({ publicado: true, aprobado: true, curado: true, updatedAt: new Date().toISOString() }).where(eq(s.testimonios.id, id)).returning()
  return (actualizado as unknown as Testimonio) ?? null
}

export async function despublicarTestimonioAction(id: string): Promise<Testimonio | null> {
  const [actualizado] = await db.update(s.testimonios).set({ publicado: false, updatedAt: new Date().toISOString() }).where(eq(s.testimonios.id, id)).returning()
  return (actualizado as unknown as Testimonio) ?? null
}

export async function crearModuloArtefactoAction(data: { moduloId: string; tipo: TipoModuloArtefacto; fuente: FuenteModuloArtefacto; url: string }): Promise<ModuloArtefacto> {
  const [nuevo] = await db.insert(s.modulosArtefactos).values(data).returning()
  return nuevo as unknown as ModuloArtefacto
}

export async function crearBitacoraArticuloAction(data: Partial<BitacoraArticulo> & { slug: string; titulo: string; contenidoLargo: string }): Promise<BitacoraArticulo> {
  const now = new Date().toISOString()
  const [nuevo] = await db.insert(s.bitacoraArticulos).values({
    slug: data.slug, titulo: data.titulo, extracto: data.extracto ?? '', contenidoLargo: data.contenidoLargo,
    categoria: data.categoria ?? 'casos_estudio', imagenPortada: data.imagenPortada ?? null,
    fechaPublicacion: data.fechaPublicacion ?? now, autorId: data.autorId ?? null,
    proyectoRelacionadoId: data.proyectoRelacionadoId ?? null, publicado: data.publicado ?? false,
  }).returning()
  return nuevo as unknown as BitacoraArticulo
}

export async function obtenerBitacoraPorSlugAction(slug: string): Promise<BitacoraArticulo | null> {
  if ((process.env.DATA_IMPL ?? 'mock') === 'drizzle') {
    const [row] = await db.select().from(s.bitacoraArticulos).where(eq(s.bitacoraArticulos.slug, slug)).limit(1)
    return (row as unknown as BitacoraArticulo) ?? null
  }
  const { getDataStore } = await import('@/lib/data/store')
  const store = getDataStore()
  // Asumiendo que el store tiene la colección de bitacora (si no, fallará de forma limpia)
  if (!store.bitacoraArticulos) return null
  return store.bitacoraArticulos.listar().find((p) => p.slug === slug) ?? null
}

export async function listarBitacoraAction(): Promise<BitacoraArticulo[]> {
  if ((process.env.DATA_IMPL ?? 'mock') === 'drizzle') {
    const rows = await db.select().from(s.bitacoraArticulos).orderBy(s.bitacoraArticulos.fechaPublicacion)
    return rows as unknown as BitacoraArticulo[]
  }
  const { getDataStore } = await import('@/lib/data/store')
  const store = getDataStore()
  if (!store.bitacoraArticulos) return []
  return store.bitacoraArticulos.listar()
}

