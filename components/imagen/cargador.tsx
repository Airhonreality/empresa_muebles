'use client'
// Capa 1 (t-200): cargador. Captura entradas crudas (archivos, pegado, arrastre, URL) y las
// entrega. No conoce colecciones, orden ni almacenamiento: no tiene grilla ni estado de slot.
import { useId, useState, type ClipboardEvent, type DragEvent } from 'react'

export type EntradaImagen = { tipo: 'archivo'; archivo: File } | { tipo: 'url'; url: string }

export interface CargadorProps {
  onIngresar: (entradas: EntradaImagen[]) => void
  /** false = el cargador no acepta nada (ej. el slot está lleno). */
  activo?: boolean
  /** Texto de ayuda visible en la zona. */
  ayuda?: string
}

export function Cargador({ onIngresar, activo = true, ayuda }: CargadorProps) {
  const idCampo = useId()
  const [arrastrando, setArrastrando] = useState(false)
  const [borrador, setBorrador] = useState('')

  const archivosDe = (lista: FileList | File[] | null | undefined): EntradaImagen[] =>
    Array.from(lista ?? [])
      .filter((f) => f.type.startsWith('image/'))
      .map((archivo) => ({ tipo: 'archivo' as const, archivo }))

  const enviarUrl = () => {
    const url = borrador.trim()
    if (!url) return
    onIngresar([{ tipo: 'url', url }])
    setBorrador('')
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setArrastrando(false)
    if (!activo) return
    const archivos = archivosDe(e.dataTransfer.files)
    if (archivos.length > 0) return onIngresar(archivos)
    const texto = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain')
    if (texto.trim()) onIngresar([{ tipo: 'url', url: texto.trim() }])
  }

  const onPaste = (e: ClipboardEvent<HTMLDivElement>) => {
    if (!activo) return
    const archivos = archivosDe(Array.from(e.clipboardData.items).map((it) => it.getAsFile()).filter((f): f is File => f !== null))
    if (archivos.length > 0) return onIngresar(archivos)
    const texto = e.clipboardData.getData('text').trim()
    if (texto) onIngresar([{ tipo: 'url', url: texto }])
  }

  const inputArchivo = (
    <input
      id={`${idCampo}-archivo`}
      type="file"
      accept="image/*"
      multiple
      className="hidden"
      disabled={!activo}
      onChange={(e) => {
        const archivos = archivosDe(e.target.files)
        if (archivos.length > 0) onIngresar(archivos)
        e.target.value = ''
      }}
      data-testid="cargador-archivo"
    />
  )

  return (
    <div className="flex flex-col gap-2">
      <div
        role="group"
        tabIndex={activo ? 0 : -1}
        aria-disabled={!activo}
        onDragOver={(e) => { e.preventDefault(); if (activo) setArrastrando(true) }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={onDrop}
        onPaste={onPaste}
        className={`flex min-h-[72px] flex-wrap items-center justify-center gap-3 rounded-sm border-2 border-dashed px-4 py-3 text-center transition-colors duration-fast focus:outline-none focus:shadow-ring-focus ${
          arrastrando ? 'border-gold-400 bg-bg-alt' : 'border-border-subtle'
        } ${activo ? '' : 'opacity-50'}`}
      >
        <p className="text-xs text-text-muted">{ayuda ?? 'Arrastrá fotos aquí, pegalas (Ctrl+V) o elegí archivos'}</p>
        {inputArchivo}
        <label
          htmlFor={`${idCampo}-archivo`}
          className={`inline-flex min-h-[44px] cursor-pointer items-center rounded-sm border border-border-subtle px-4 text-sm text-text-heading transition-colors duration-fast hover:bg-bg-alt ${
            activo ? '' : 'pointer-events-none opacity-50'
          }`}
        >
          Elegir fotos
        </label>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => { e.preventDefault(); if (activo) enviarUrl() }}
      >
        <label htmlFor={`${idCampo}-url`} className="sr-only">Pegar enlace de imagen</label>
        <input
          id={`${idCampo}-url`}
          type="url"
          inputMode="url"
          value={borrador}
          onChange={(e) => setBorrador(e.target.value)}
          placeholder="https://…"
          disabled={!activo}
          className="min-h-[44px] flex-1 rounded-sm border border-border-subtle bg-bg-paper px-3 text-sm text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
        />
        <button
          type="submit"
          disabled={!activo || borrador.trim() === ''}
          className="min-h-[44px] rounded-sm border border-border-subtle px-4 text-sm text-text-heading transition-colors duration-fast hover:bg-bg-alt disabled:opacity-40"
        >
          Agregar enlace
        </button>
      </form>
    </div>
  )
}
