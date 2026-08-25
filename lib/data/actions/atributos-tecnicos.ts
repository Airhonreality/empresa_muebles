'use server'
// Server Actions de Atributos Técnicos (2026-08-25) — tarjetas del slider "Validación Técnica"
// de cada landing de espacio. Solo escritura desde el ERP (gateado por middleware.ts); la lectura
// pública vive en lib/data/actions/public.ts (obtenerAtributosTecnicosAction).
import { eq, count } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import type { AtributoTecnico } from '../contracts'

export async function crearAtributoTecnicoAction(data: { tipoEspacio: string; titulo: string; cuerpo: string; badge?: string | null; imagenUrl?: string | null }): Promise<AtributoTecnico> {
  const [{ value }] = await db.select({ value: count() }).from(s.atributosTecnicos)
  const [nuevo] = await db.insert(s.atributosTecnicos).values({
    tipoEspacio: data.tipoEspacio,
    titulo: data.titulo,
    cuerpo: data.cuerpo,
    badge: data.badge ?? null,
    imagenUrl: data.imagenUrl ?? null,
    visible: true,
    orden: value,
  }).returning()
  return nuevo as unknown as AtributoTecnico
}

export async function actualizarAtributoTecnicoAction(
  id: string,
  partial: Partial<Pick<AtributoTecnico, 'tipoEspacio' | 'titulo' | 'cuerpo' | 'badge' | 'imagenUrl' | 'visible' | 'orden'>>
): Promise<AtributoTecnico | null> {
  const [actualizado] = await db.update(s.atributosTecnicos).set(partial).where(eq(s.atributosTecnicos.id, id)).returning()
  return (actualizado as unknown as AtributoTecnico) ?? null
}

export async function eliminarAtributoTecnicoAction(id: string): Promise<boolean> {
  const eliminados = await db.delete(s.atributosTecnicos).where(eq(s.atributosTecnicos.id, id)).returning({ id: s.atributosTecnicos.id })
  return eliminados.length > 0
}
