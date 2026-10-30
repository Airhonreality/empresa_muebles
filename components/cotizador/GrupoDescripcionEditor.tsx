'use client'

import { useState } from 'react'
import { MarkdownField } from '@/components/veta/markdown-field'
import { useAutosave, type EstadoAutosave } from '@/lib/hooks/autosave'
import {
  actualizarContenedorDescriptivoGrupoAction,
  obtenerContenedorDescriptivoGrupoAction,
} from '@/lib/data/actions/core'

const TEXTO_ESTADO: Record<EstadoAutosave, string> = {
  idle: '',
  pending: 'Cambios sin guardar…',
  saving: 'Guardando…',
  saved: 'Guardado',
  error: 'No se pudo guardar. Reintenta.',
}

function EditorInterno({ grupoId, inicial }: { grupoId: string; inicial: string }) {
  const [descripcion, setDescripcion] = useState(inicial)
  const autosave = useAutosave({
    valor: descripcion,
    guardar: (valor) =>
      actualizarContenedorDescriptivoGrupoAction(grupoId, { descripcion: valor.trim() || null }),
  })

  return (
    <div className="rounded-sm border border-border-subtle bg-bg-paper p-3">
      <MarkdownField
        label="Descripción del grupo"
        value={descripcion}
        onChange={setDescripcion}
        height={150}
        placeholder="Describe el grupo: títulos, listas, negritas…"
        helpText="Se muestra en la propuesta pública y en el PDF, debajo del nombre del grupo."
      />
      <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-text-muted">
        <span className={autosave.estado === 'error' ? 'text-error-text' : undefined}>
          {TEXTO_ESTADO[autosave.estado]}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={autosave.flush}
            className="rounded border border-border-subtle px-2 py-0.5 text-text-muted transition-colors duration-fast hover:bg-bg-alt"
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={autosave.reintentar}
            disabled={autosave.estado !== 'error'}
            className="rounded border border-border-subtle px-2 py-0.5 text-text-muted transition-colors duration-fast hover:bg-bg-alt disabled:opacity-40"
          >
            Reintentar
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Descripción markdown de un grupo de ítems. Se carga bajo demanda al abrir (lectura por
 * `grupoItemId`) y autoguarda con debounce sobre `contenedores_descriptivos`.
 */
export function GrupoDescripcionEditor({ grupoId }: { grupoId: string }) {
  const [abierto, setAbierto] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [inicial, setInicial] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cargar = async () => {
    setCargando(true)
    setError(null)
    try {
      const contenedor = await obtenerContenedorDescriptivoGrupoAction(grupoId)
      setInicial(contenedor?.descripcion ?? '')
    } catch {
      setError('No se pudo cargar la descripción.')
    } finally {
      setCargando(false)
    }
  }

  const alternar = () => {
    if (abierto) {
      setAbierto(false)
      return
    }
    setAbierto(true)
    if (inicial === null && !cargando) void cargar()
  }

  return (
    <div className="ml-2 mt-1">
      <button
        type="button"
        onClick={alternar}
        aria-expanded={abierto}
        className="text-[11px] text-gold-600 transition-colors duration-fast hover:text-gold-700"
      >
        📝 {abierto ? 'Ocultar descripción' : 'Descripción del grupo'}
      </button>

      {abierto && (
        <div className="mt-2">
          {cargando ? (
            <p className="text-[11px] text-text-muted">Cargando descripción…</p>
          ) : error ? (
            <div className="flex items-center gap-2 text-[11px] text-error-text">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => void cargar()}
                className="underline"
              >
                Reintentar
              </button>
            </div>
          ) : inicial !== null ? (
            <EditorInterno grupoId={grupoId} inicial={inicial} />
          ) : null}
        </div>
      )}
    </div>
  )
}
