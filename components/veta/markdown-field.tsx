'use client'

import { useCallback, useRef, useState } from 'react'
import {
  Bold,
  Code,
  Edit2,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
} from 'lucide-react'

import { MarkdownContent } from '@/components/veta/markdown-content'

export interface MarkdownFieldProps {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  helpText?: string
  height?: number
  disabled?: boolean
}

type Comando = {
  icon: React.ElementType
  antes: string
  despues: string
  bloque: boolean
  label: string
}

const COMANDOS: Comando[] = [
  { icon: Heading1, antes: '# ', despues: '', bloque: true, label: 'Título 1' },
  { icon: Heading2, antes: '## ', despues: '', bloque: true, label: 'Título 2' },
  { icon: Heading3, antes: '### ', despues: '', bloque: true, label: 'Título 3' },
  { icon: Bold, antes: '**', despues: '**', bloque: false, label: 'Negrita' },
  { icon: Italic, antes: '*', despues: '*', bloque: false, label: 'Cursiva' },
  { icon: Quote, antes: '> ', despues: '', bloque: true, label: 'Cita' },
  { icon: List, antes: '- ', despues: '', bloque: true, label: 'Lista' },
  { icon: ListOrdered, antes: '1. ', despues: '', bloque: true, label: 'Lista numerada' },
  { icon: Code, antes: '`', despues: '`', bloque: false, label: 'Código' },
  { icon: Link, antes: '[', despues: '(url)', bloque: false, label: 'Enlace' },
]

/**
 * Editor markdown propio: toolbar minimalista (iconos de Lucide) + textarea con
 * los estilos de Veta + vista previa. Nada de @uiw, nada de CSS ajeno.
 *
 * `insertar` gestiona la selección del textarea para envolver o prefixear texto
 * según el comando. Los saltos de línea se respetan tal cual; el render final
 * usa `<MarkdownContent>` (react-markdown, sin HTML crudo).
 */
export function MarkdownField({
  label,
  value,
  onChange,
  placeholder,
  helpText,
  height = 150,
  disabled,
}: MarkdownFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [preview, setPreview] = useState(false)

  const insertar = useCallback(
    (antes: string, despues: string, bloque: boolean) => {
      const el = textareaRef.current
      if (!el) return
      const { selectionStart: inicio, selectionEnd: fin, value: texto } = el
      const seleccion = texto.slice(inicio, fin)

      let nuevo: string
      let pos: number
      if (bloque) {
        const lineas = seleccion.length ? seleccion.split('\n') : ['']
        const prefijadas = lineas.map((linea) => (linea.length ? antes + linea : linea)).join('\n')
        nuevo = texto.slice(0, inicio) + prefijadas + texto.slice(fin)
        pos = inicio + prefijadas.length
      } else {
        nuevo = texto.slice(0, inicio) + antes + seleccion + despues + texto.slice(fin)
        pos = inicio + antes.length + seleccion.length + despues.length
      }

      el.value = nuevo
      el.focus()
      el.setSelectionRange(pos, pos)
      onChange(nuevo)
    },
    [onChange]
  )

  return (
    <div className="veta-md-editor flex flex-col gap-2" data-color-mode="light">
      {(label || helpText) && (
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          {label ? <span className="text-[11px] text-text-muted">{label}</span> : <span />}
          <span className="text-[10px] uppercase tracking-[0.08em] text-text-muted/70">Markdown</span>
        </div>
      )}

      <div className="rounded border border-border-subtle bg-bg-paper flex flex-col">
        {!preview ? (
          <>
            <div className="veta-md-toolbar">
              <div className="veta-md-toolbar-left">
                {COMANDOS.map((cmd, i) => (
                  <button
                    key={i}
                    type="button"
                    title={cmd.label}
                    disabled={disabled}
                    onClick={() =>
                      insertar(cmd.antes, cmd.despues, cmd.bloque)
                    }
                    className="flex shrink-0 items-center justify-center w-6 h-6 rounded-sm text-[11px] text-text-muted hover:text-text-heading hover:bg-bg-surface transition-colors duration-fast disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <cmd.icon size={13} />
                  </button>
                ))}
              </div>
              <button
                type="button"
                title="Vista previa"
                disabled={disabled}
                onClick={() => setPreview(true)}
                className="flex shrink-0 items-center justify-center w-6 h-6 rounded-sm text-[10px] text-text-muted hover:text-text-heading hover:bg-bg-surface transition-colors duration-fast disabled:opacity-40"
              >
                <Eye size={13} />
              </button>
            </div>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              rows={Math.max(4, Math.round(height / 20))}
              className="w-full border-none bg-transparent px-2 py-2 text-xs text-text-heading focus:ring-0 outline-none resize-none"
              spellCheck={false}
            />
          </>
        ) : (
          <>
            <div className="veta-md-toolbar">
              <span className="text-[10px] uppercase tracking-[0.08em] text-text-muted">Vista previa</span>
              <div className="flex-1" />
              <button
                type="button"
                title="Editar"
                onClick={() => setPreview(false)}
                className="flex shrink-0 items-center justify-center w-6 h-6 rounded-sm text-[10px] text-text-muted hover:text-text-heading hover:bg-bg-surface transition-colors duration-fast"
              >
                <Edit2 size={13} />
              </button>
            </div>
            <div className="veta-md-preview">
              <MarkdownContent value={value} variant="propuesta" />
            </div>
          </>
        )}
      </div>

      {helpText && <p className="text-[11px] leading-4 text-text-muted">{helpText}</p>}
    </div>
  )
}
