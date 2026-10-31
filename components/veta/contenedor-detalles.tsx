'use client'

import { MarkdownContent } from '@/components/veta/markdown-content'
import { PhotoGrid } from '@/components/veta/photo-grid'
import type { ContenedorDescriptivo } from '@/lib/data'

interface ContenedorDetallesProps {
  contenedor: ContenedorDescriptivo | null
  /** Título de la sección (ej. "Detalles del grupo" o "Detalles del espacio"). */
  titulo?: string
}

/**
 * Panel de detalles compartido para Espacio y Grupo.
 * Ambos comparten el schema `ContenedorDescriptivo` (tabla polimórfica
 * `contenedores_descriptivos`), por tanto el layout es idéntico: descripción
 * markdown + tres galerías de fotos (espacio, diseño, referencia).
 */
export function ContenedorDetalles({ contenedor, titulo = 'Detalles' }: ContenedorDetallesProps) {
  if (!contenedor) return null

  const tieneContenido = Boolean(
    contenedor.descripcion?.trim() ||
      contenedor.fotosEspacio.length > 0 ||
      contenedor.fotosDisenio.length > 0 ||
      contenedor.fotosReferencia.length > 0
  )

  if (!tieneContenido) return null

  return (
    <section className="mt-4 rounded-lg border border-border-subtle bg-bg-raised p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-3">
        {titulo}
      </h3>

      {contenedor.descripcion?.trim() && (
        <div className="mb-4">
          <MarkdownContent value={contenedor.descripcion} variant="documento" className="mb-3" />
        </div>
      )}

      <div className="space-y-3">
        {contenedor.fotosEspacio.length > 0 && (
          <div>
            <h4 className="text-[10px] font-semibold text-text-muted mb-1">Fotos del espacio</h4>
            <PhotoGrid
              fotos={contenedor.fotosEspacio.map((url) => ({ url, alt: 'Foto del espacio' }))}
            />
          </div>
        )}
        {contenedor.fotosDisenio.length > 0 && (
          <div>
            <h4 className="text-[10px] font-semibold text-text-muted mb-1">Fotos de diseño</h4>
            <PhotoGrid
              fotos={contenedor.fotosDisenio.map((url) => ({ url, alt: 'Foto de diseño' }))}
            />
          </div>
        )}
        {contenedor.fotosReferencia.length > 0 && (
          <div>
            <h4 className="text-[10px] font-semibold text-text-muted mb-1">Fotos de referencia</h4>
            <PhotoGrid
              fotos={contenedor.fotosReferencia.map((url) => ({ url, alt: 'Foto de referencia' }))}
            />
          </div>
        )}
      </div>
    </section>
  )
}
