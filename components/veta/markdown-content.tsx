'use client'

import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'

export type MarkdownVariant = 'propuesta' | 'documento' | 'compacto'

export interface MarkdownContentProps {
  value: string | null | undefined
  variant?: MarkdownVariant
  className?: string
}

/**
 * Render de solo lectura para descripciones markdown (espacios, grupos y documentos).
 *
 * - `remark-gfm`: listas, tablas, tachado y enlaces automáticos.
 * - `remark-breaks`: un salto de línea simple se respeta como salto visual; así las
 *   descripciones legacy (texto plano con `\n`) siguen viéndose igual que antes.
 * - NO usa `rehype-raw`: el HTML crudo del texto se ignora, nunca se inyecta.
 *
 * El estilo vive en `app/globals.css` (`.veta-md`) y en el CSS de impresión de cada
 * documento; acá solo se elige la variante.
 */
export function MarkdownContent({ value, variant = 'documento', className }: MarkdownContentProps) {
  const texto = value?.trim()
  if (!texto) return null

  return (
    <div className={['veta-md', `veta-md--${variant}`, className].filter(Boolean).join(' ')}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{texto}</ReactMarkdown>
    </div>
  )
}
