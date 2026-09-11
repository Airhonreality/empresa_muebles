'use server'
// Server Actions de Renders Conceptuales (F09, 2026-08-17) — diseños propios, no proyectos
// reales entregados. Solo escritura desde el ERP (gateado por middleware.ts); la lectura pública
// vive en lib/data/actions/public.ts (obtenerGaleriaEspacioAction).
import { eq, count, desc } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import { sanitizarUrlIndividual } from '@/lib/r2/sanitize'
import type { RenderConceptual } from '../contracts'

export async function crearRenderConceptualAction(data: { tipoEspacio: string; imagenUrl: string; titulo?: string | null }): Promise<RenderConceptual> {
  const [{ value }] = await db.select({ value: count() }).from(s.rendersConceptuales)
  const [nuevo] = await db.insert(s.rendersConceptuales).values({
    tipoEspacio: data.tipoEspacio,
    imagenUrl: sanitizarUrlIndividual(data.imagenUrl) ?? '',
    titulo: data.titulo ?? null,
    visible: true,
    orden: value,
  }).returning()
  return nuevo as unknown as RenderConceptual
}

export async function actualizarRenderConceptualAction(
  id: string,
  partial: Partial<Pick<RenderConceptual, 'tipoEspacio' | 'imagenUrl' | 'titulo' | 'visible' | 'orden'>>
): Promise<RenderConceptual | null> {
  const sanitized = { ...partial };
  if (partial.imagenUrl !== undefined) sanitized.imagenUrl = sanitizarUrlIndividual(partial.imagenUrl) ?? '';
  const [actualizado] = await db.update(s.rendersConceptuales).set(sanitized).where(eq(s.rendersConceptuales.id, id)).returning()
  return (actualizado as unknown as RenderConceptual) ?? null
}

export async function eliminarRenderConceptualAction(id: string): Promise<boolean> {
  const eliminados = await db.delete(s.rendersConceptuales).where(eq(s.rendersConceptuales.id, id)).returning({ id: s.rendersConceptuales.id })
  return eliminados.length > 0
}

// Lectura completa para el admin de galería (migración TanStack Query, Fase 2): el mock
// (lib/data/drizzle-impl.ts, store.renderesConceptuales.listar()) devuelve más reciente primero;
// replicamos ese orden acá para no cambiar el comportamiento visible de la pantalla.
export async function listarRendersConceptualesAction(): Promise<RenderConceptual[]> {
  const rows = await db.select().from(s.rendersConceptuales).orderBy(desc(s.rendersConceptuales.createdAt))
  return rows as unknown as RenderConceptual[]
}
