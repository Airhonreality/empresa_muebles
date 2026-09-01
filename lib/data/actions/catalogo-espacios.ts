'use server'
// Server Actions de Catálogo de Espacios Arquitectónicos (t-147, 2026-08-31) — taxonomía
// orgánica de espacios (catalogo_espacios_arquitectonicos), independiente de las landings.
// Solo escritura desde el ERP (gateado por middleware.ts); la lectura pública sería una
// query propia (no hay catálogo público de esta taxonomía aún).
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import * as s from '@/lib/db/schema'
import type { CatalogoEspacioArquitectonico } from '../contracts'

export async function listarCatalogoEspaciosAction(): Promise<CatalogoEspacioArquitectonico[]> {
  const rows = await db.select().from(s.catalogoEspaciosArquitectonicos)
  return rows as unknown as CatalogoEspacioArquitectonico[]
}

export async function crearCatalogoEspacioAction(data: Partial<CatalogoEspacioArquitectonico> & { codigo: string; nombre: string }): Promise<CatalogoEspacioArquitectonico> {
  const [nuevo] = await db.insert(s.catalogoEspaciosArquitectonicos).values({
    codigo: data.codigo,
    nombre: data.nombre,
    descripcion: data.descripcion ?? null,
    unidadBase: data.unidadBase ?? null,
    rangoMinimo: data.rangoMinimo ?? null,
    rangoMaximo: data.rangoMaximo ?? null,
    ejemploTamanio: data.ejemploTamanio ?? null,
    modulosTipicosJson: data.modulosTipicosJson ?? null,
  }).returning()
  return nuevo as unknown as CatalogoEspacioArquitectonico
}

export async function actualizarCatalogoEspacioAction(
  id: string,
  partial: Partial<Pick<CatalogoEspacioArquitectonico, 'codigo' | 'nombre' | 'descripcion' | 'unidadBase' | 'rangoMinimo' | 'rangoMaximo' | 'ejemploTamanio' | 'modulosTipicosJson'>>
): Promise<CatalogoEspacioArquitectonico | null> {
  const [actualizado] = await db.update(s.catalogoEspaciosArquitectonicos).set(partial).where(eq(s.catalogoEspaciosArquitectonicos.id, id)).returning()
  return (actualizado as unknown as CatalogoEspacioArquitectonico) ?? null
}

export async function eliminarCatalogoEspacioAction(id: string): Promise<boolean> {
  const eliminados = await db.delete(s.catalogoEspaciosArquitectonicos).where(eq(s.catalogoEspaciosArquitectonicos.id, id)).returning({ id: s.catalogoEspaciosArquitectonicos.id })
  return eliminados.length > 0
}
