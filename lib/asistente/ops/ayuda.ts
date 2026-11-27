// lib/asistente/ops/ayuda.ts
// Operación ayuda.procedimiento (t-200 paso 2). El parámetro `tema` es un enum generado desde
// conocimiento/asistente/INDICE.md, filtrado por los documentos que el usuario puede leer. Así el modelo
// no escribe texto libre para buscar y no ve nombres de documentos que su rol no puede leer.
import { z } from 'zod'
import type { SesionEmpleado } from '../../auth/session'
import { consultarProcedimiento, documentosPermitidos, type Documento } from '../conocimiento'
import type { DefinicionAsistente } from '../herramientas'

/** Rutas enlazadas en el índice (`[titulo](ruta.md)`), en el orden del índice, sin repetidas. */
export function rutasDeIndice(indice: string): string[] {
  const rutas = [...indice.matchAll(/\]\(([^)\s]+\.md)\)/g)].map((m) => m[1])
  return [...new Set(rutas)]
}

/** Rutas del índice que además son documentos válidos y cargables. Nunca inventa rutas. */
export function temasDeIndice(indice: string, documentos: readonly Documento[]): string[] {
  const cargables = new Set(documentos.map((d) => d.ruta))
  return rutasDeIndice(indice).filter((r) => cargables.has(r))
}

export function operacionAyuda(documentos: readonly Documento[], indice: string): DefinicionAsistente[] {
  const temas = temasDeIndice(indice, documentos)
  if (temas.length === 0) return []
  const esquemaDeTemas = (lista: string[]) => z.strictObject({ tema: z.enum(lista as [string, ...string[]]) })

  // Por usuario: solo los temas que puede leer. Sin temas visibles la operación no se ofrece (`disponible`).
  const esquemaPara = (usuario: SesionEmpleado) => {
    const visibles = new Set(documentosPermitidos(documentos, usuario).map((d) => d.ruta))
    return esquemaDeTemas(temas.filter((t) => visibles.has(t)))
  }

  return [
    {
      nombre: 'ayuda.procedimiento',
      dominio: 'ayuda',
      operacion: 'procedimiento',
      descripcion:
        'Lee un procedimiento de la empresa (cómo se hace algo) completo. El tema es la ruta del índice de procedimientos del prompt.',
      permiso: 'erp:acceso',
      canales: ['chat'],
      esEscritura: false,
      esquema: esquemaDeTemas(temas),
      esquemaPara,
      disponible: (usuario) => documentosPermitidos(documentos, usuario).length > 0,
      ejecutar: async ({ tema }, usuario) => ({
        texto: consultarProcedimiento(tema, usuario, documentos),
      }),
    },
  ]
}
