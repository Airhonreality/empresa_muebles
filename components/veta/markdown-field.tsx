'use client'

import dynamic from 'next/dynamic'
import {
  bold,
  italic,
  link,
  orderedListCommand,
  quote,
  title1,
  title2,
  title3,
  unorderedListCommand,
} from '@uiw/react-md-editor/commands'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
  loading: () => (
    <div className="grid h-40 place-items-center rounded-sm border border-border-subtle bg-bg-alt text-xs text-text-muted">
      Cargando editor…
    </div>
  ),
})

const COMANDOS = [
  title1,
  title2,
  title3,
  bold,
  italic,
  unorderedListCommand,
  orderedListCommand,
  quote,
  link,
]

export interface MarkdownFieldProps {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  helpText?: string
  height?: number
  disabled?: boolean
}

/**
 * Editor markdown básico (H1-H3, negritas, cursivas, listas, cita y enlace) sobre
 * `@uiw/react-md-editor`. `next/dynamic` con `ssr:false` porque el editor toca el DOM
 * (textarea/selección) y no debe entrar en el render del servidor.
 *
 * El contenido se guarda como markdown tal cual; el render final usa
 * `<MarkdownContent>` (react-markdown, sin HTML crudo).
 */
export function MarkdownField({
  label,
  value,
  onChange,
  placeholder,
  helpText,
  height = 160,
  disabled,
}: MarkdownFieldProps) {
  return (
    <div className="veta-md-editor flex flex-col gap-1" data-color-mode="light">
      {(label || helpText) && (
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          {label ? <span className="text-[11px] text-text-muted">{label}</span> : <span />}
          <span className="text-[10px] uppercase tracking-[0.08em] text-text-muted/70">Markdown</span>
        </div>
      )}
      <MDEditor
        value={value}
        onChange={(next) => onChange(next ?? '')}
        preview="edit"
        height={height}
        visibleDragbar={false}
        commands={COMANDOS}
        placeholder={placeholder}
        disabled={disabled}
      />
      {helpText && <p className="text-[11px] leading-4 text-text-muted">{helpText}</p>}
    </div>
  )
}
