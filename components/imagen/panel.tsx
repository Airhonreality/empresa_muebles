'use client'
// Capa 3 (t-200): panel contextual de UN slot. Su contenido depende de la selección:
//   sin selección → datos del slot (cantidad, tope, quitar todas)
//   con selección → acciones sobre esa imagen (ampliar, mover, quitar)
// Los campos declarados por el slot y los atributos base (alt, pie) llegan en P4.
import type { ReactNode } from 'react'

export interface SeleccionInfo {
  url: string
  posicion: number // 1-based
  total: number
  /** Si la imagen ya está en el borde no se puede mover en esa dirección. */
  primera: boolean
  ultima: boolean
}

export interface PanelProps {
  etiqueta: string
  cantidad: number
  max?: number
  seleccion: SeleccionInfo | null
  onAmpliar: () => void
  onMoverAntes: () => void
  onMoverDespues: () => void
  onQuitar: () => void
  onQuitarTodas: () => void
}

const botonBase =
  'inline-flex min-h-[44px] flex-1 items-center justify-center gap-1 rounded-sm border px-3 text-sm transition-colors duration-fast focus-visible:shadow-ring-focus focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40'
const botonNormal = `${botonBase} border-border-subtle text-text-heading hover:bg-bg-alt`
const botonPeligro = `${botonBase} border-red-200 text-red-700 hover:bg-red-50`

export function Panel({
  etiqueta,
  cantidad,
  max,
  seleccion,
  onAmpliar,
  onMoverAntes,
  onMoverDespues,
  onQuitar,
  onQuitarTodas,
}: PanelProps) {
  return (
    <aside
      aria-label={`Controles de ${etiqueta}`}
      className="flex flex-col gap-3 rounded-sm border border-border-subtle bg-bg-alt p-3"
    >
      <header className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium text-text-heading">{etiqueta}</h3>
        <span className="font-mono text-xs text-text-muted">
          {cantidad}
          {max !== undefined ? ` / ${max}` : ''}
        </span>
      </header>

      {seleccion ? (
        <Seccion titulo={`Foto ${seleccion.posicion} de ${seleccion.total}`}>
          <div className="aspect-[4/3] w-full overflow-hidden rounded-sm bg-bg-paper">
            {/* eslint-disable-next-line @next/next/no-img-element -- miniatura de previsualización */}
            <img src={seleccion.url} alt="" className="h-full w-full object-contain" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={onAmpliar} className={botonNormal}>
              Ampliar
            </button>
            <button type="button" onClick={onQuitar} className={botonPeligro}>
              Quitar
            </button>
            <button type="button" onClick={onMoverAntes} disabled={seleccion.primera} className={botonNormal} aria-label="Mover antes">
              ← Antes
            </button>
            <button type="button" onClick={onMoverDespues} disabled={seleccion.ultima} className={botonNormal} aria-label="Mover después">
              Después →
            </button>
          </div>
        </Seccion>
      ) : (
        <Seccion titulo="Ninguna foto seleccionada">
          <p className="text-xs text-text-muted">
            Tocá una foto para moverla, ampliarla o quitarla. Con teclado: Tab, Alt+flechas, Supr.
          </p>
        </Seccion>
      )}

      {cantidad > 0 && (
        <div className="border-t border-border-subtle pt-3">
          <button type="button" onClick={onQuitarTodas} className={`${botonPeligro} w-full`}>
            Quitar todas
          </button>
        </div>
      )}
    </aside>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h4 className="text-xs font-medium uppercase tracking-wide text-text-muted">{titulo}</h4>
      {children}
    </section>
  )
}
