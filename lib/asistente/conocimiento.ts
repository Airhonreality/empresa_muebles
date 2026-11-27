// lib/asistente/conocimiento.ts
// Base de conocimiento del asistente (plan t-199, pieza II): documentos markdown que explican cómo se
// hacen las cosas en la empresa. Cada documento lleva encabezado YAML obligatorio. Un documento sin
// encabezado válido NO se carga. Un documento con permiso que el usuario no tiene NO se muestra ni se
// devuelve, aunque lo pida por nombre.
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { z } from 'zod'
import type { SesionEmpleado } from '../auth/session'
import { PERMISOS, PERMISOS_POR_ROL, type Permiso } from '../auth/permisos'
import { truncarResultado } from './herramientas'

/** Tamaño máximo de un procedimiento devuelto al modelo (plan t-199 §3.3). */
export const MAX_CARACTERES_PROCEDIMIENTO = 12000
/** Entrada de la herramienta procedimiento_consultar. */
export const esquemaProcedimientoConsultar = z.object({
  tema: z.string().trim().min(2, 'Escribe al menos 2 caracteres').max(120),
})
/** A partir de estos días sin revisión, el índice marca el documento como "por revisar". */
export const DIAS_PARA_REVISAR = 180

export interface Documento {
  /** Ruta relativa a la carpeta raíz, con "/" (ej. cotizaciones/estados.md). */
  ruta: string
  titulo: string
  dueno: string
  revisado: string
  permiso: Permiso
  cuerpo: string
}

const ENCABEZADO = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/

/**
 * Lee un documento con su encabezado. Devuelve null si falta el encabezado, si falta título o dueño,
 * si `revisado` no es una fecha AAAA-MM-DD o si `permiso` no es un permiso conocido.
 */
export function parsearDocumento(ruta: string, texto: string): Documento | null {
  const m = ENCABEZADO.exec(texto)
  if (!m) return null
  const campos: Record<string, string> = {}
  for (const linea of m[1].split(/\r?\n/)) {
    const i = linea.indexOf(':')
    if (i <= 0) continue
    campos[linea.slice(0, i).trim()] = linea.slice(i + 1).trim().replace(/^"(.*)"$/, '$1')
  }
  const { titulo, dueno, revisado, permiso } = campos
  if (!titulo || !dueno) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(revisado ?? '')) return null
  if (!(PERMISOS as readonly string[]).includes(permiso ?? '')) return null
  return { ruta, titulo, dueno, revisado, permiso: permiso as Permiso, cuerpo: m[2].trim() }
}

/** Lee recursivamente los .md de `raiz` (sin INDICE.md) y devuelve solo los válidos. */
export function cargarDocumentos(raiz: string): Documento[] {
  const docs: Documento[] = []
  const recorrer = (dir: string) => {
    for (const nombre of readdirSync(dir, { withFileTypes: true })) {
      const ruta = join(dir, nombre.name)
      if (nombre.isDirectory()) {
        recorrer(ruta)
      } else if (nombre.name.endsWith('.md') && nombre.name !== 'INDICE.md') {
        const doc = parsearDocumento(relative(raiz, ruta).split(sep).join('/'), readFileSync(ruta, 'utf8'))
        if (doc) docs.push(doc)
      }
    }
  }
  recorrer(raiz)
  return docs.sort((a, b) => a.ruta.localeCompare(b.ruta))
}

/** Documentos que el rol de la sesión puede leer. */
export function documentosPermitidos(docs: readonly Documento[], usuario: SesionEmpleado): Documento[] {
  const permisos = PERMISOS_POR_ROL[usuario.rol] ?? []
  return docs.filter((d) => permisos.includes(d.permiso))
}

function diasDesde(fechaIso: string, ahora: Date): number {
  const inicio = Date.parse(`${fechaIso}T00:00:00Z`)
  return Math.floor((ahora.getTime() - inicio) / 86_400_000)
}

/** Índice para el prompt: una línea por documento permitido. Nunca incluye el cuerpo. */
export function indiceProcedimientos(docs: readonly Documento[], usuario: SesionEmpleado, ahora: Date): string {
  return documentosPermitidos(docs, usuario)
    .map((d) => {
      const viejo = diasDesde(d.revisado, ahora) > DIAS_PARA_REVISAR ? ' (por revisar)' : ''
      return `- ${d.ruta}: ${d.titulo}${viejo}`
    })
    .join('\n')
}

const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/**
 * Devuelve el documento que coincide con `tema` (ruta o título), o un mensaje si no hay uno único.
 * Solo busca entre los documentos que el usuario puede leer: los demás no existen para él.
 */
export function consultarProcedimiento(tema: string, usuario: SesionEmpleado, docs: readonly Documento[]): string {
  const visibles = documentosPermitidos(docs, usuario)
  const q = normalizar(tema)
  const sinExtension = (ruta: string) => normalizar(ruta.replace(/\.md$/, ''))
  const exactos = visibles.filter((d) => sinExtension(d.ruta) === q)
  const coincidencias = exactos.length > 0 ? exactos : visibles.filter((d) => normalizar(d.titulo).includes(q) || normalizar(d.ruta).includes(q))
  if (coincidencias.length === 0) return 'No hay un procedimiento con ese tema. Revisa el índice de procedimientos.'
  if (coincidencias.length > 1) {
    return `Varios procedimientos coinciden: ${coincidencias.map((d) => d.titulo).join('; ')}. Pide uno más preciso.`
  }
  const d = coincidencias[0]
  return truncarResultado(`# ${d.titulo}\n\n${d.cuerpo}`, MAX_CARACTERES_PROCEDIMIENTO)
}
