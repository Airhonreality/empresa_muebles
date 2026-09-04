'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, Send, StickyNote } from 'lucide-react'
import { Button } from '@/components/veta/button'
import { SlideActual } from '@/components/veta/SlidesPresentacion'
import type { TipoSlide, CategoriaNotaReunion } from '@/lib/data'

interface ModalPresentadorProps {
  proyectoId: string
  slides: TipoSlide[]
  onCrearNota: (data: {
    proyectoId: string
    espacioVarianteId: string | null
    categoria: CategoriaNotaReunion
    contenido: string
  }) => Promise<void>
  onCerrar: () => void
}

const LABELS_CATEGORIA: Record<CategoriaNotaReunion, string> = {
  requisito_cliente: 'Requisito del cliente',
  cambio_diseno: 'Cambio de diseno',
  cambio_presupuesto: 'Cambio de presupuesto',
  acuerdo: 'Acuerdo',
  libre: 'Nota libre',
}

const EMOJI_CATEGORIA: Record<CategoriaNotaReunion, string> = {
  requisito_cliente: 'Requisito',
  cambio_diseno: 'Diseno',
  cambio_presupuesto: 'Presupuesto',
  acuerdo: 'Acuerdo',
  libre: 'Libre',
}

export function ModalPresentador({ proyectoId, slides, onCrearNota, onCerrar }: ModalPresentadorProps) {
  const [indiceActual, setIndiceActual] = useState(0)
  const [categoria, setCategoria] = useState<CategoriaNotaReunion>('libre')
  const [contenido, setContenido] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [panelNotasAbierto, setPanelNotasAbierto] = useState(false)
  const [notasSesion, setNotasSesion] = useState<Array<{
    categoria: CategoriaNotaReunion
    contenido: string
    espacioNombre: string | null
  }>>([])

  const slideActual = slides[indiceActual]

  const ir = useCallback((nuevoIndice: number) => {
    setIndiceActual(nuevoIndice)
  }, [])

  // Emitir al tab de propuesta publica via BroadcastChannel
  useEffect(() => {
    if (!slideActual) return
    const espacioId =
      slideActual.tipo === 'espacio_portada' ||
      slideActual.tipo === 'espacio_galeria' ||
      slideActual.tipo === 'espacio_items'
        ? slideActual.espacio.id
        : null
    if (espacioId && typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const canal = new BroadcastChannel(`presentacion-${proyectoId}`)
      canal.postMessage({ tipo: 'ir_a', espacioId })
      canal.close()
    }
  }, [indiceActual, proyectoId, slideActual])

  // Navegar con teclado (flechas + Escape)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') ir(Math.min(indiceActual + 1, slides.length - 1))
      if (e.key === 'ArrowLeft')  ir(Math.max(indiceActual - 1, 0))
      if (e.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [indiceActual, slides.length, onCerrar, ir])

  const espacioActual =
    slideActual?.tipo === 'espacio_portada' ||
    slideActual?.tipo === 'espacio_galeria' ||
    slideActual?.tipo === 'espacio_items'
      ? slideActual.espacio
      : null

  const handleGuardarNota = useCallback(async () => {
    if (!contenido.trim()) return
    setGuardando(true)
    try {
      await onCrearNota({
        proyectoId,
        espacioVarianteId: espacioActual?.id ?? null,
        categoria,
        contenido: contenido.trim(),
      })
      setNotasSesion((prev) => [
        ...prev,
        { categoria, contenido: contenido.trim(), espacioNombre: espacioActual?.nombreEspacio ?? null },
      ])
      setContenido('')
    } finally {
      setGuardando(false)
    }
  }, [contenido, categoria, espacioActual, proyectoId, onCrearNota])

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col" role="dialog" aria-modal="true">

      {/* AREA PRINCIPAL: el slide visual ocupa todo el espacio disponible */}
      <div className="flex-1 relative overflow-hidden bg-zinc-900 min-h-0">
        {slideActual ? (
          <SlideActual slide={slideActual} />
        ) : (
          <div className="h-full flex items-center justify-center text-white/20 text-lg">
            Sin slides
          </div>
        )}

        {/* Barra de progreso + boton cerrar superpuestos arriba */}
        <div className="absolute top-0 inset-x-0 flex items-center gap-3 px-4 pt-3 pb-6 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex gap-1 flex-1 overflow-hidden">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                  i === indiceActual ? 'bg-amber-400' : i < indiceActual ? 'bg-white/50' : 'bg-white/15'
                }`}
              />
            ))}
          </div>
          <span className="text-white/50 text-xs tabular-nums shrink-0">
            {indiceActual + 1} / {slides.length}
          </span>
          <button
            onClick={onCerrar}
            className="text-white/40 hover:text-white/90 transition-colors ml-2"
            aria-label="Terminar presentacion"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Zonas de toque invisibles para avanzar/retroceder */}
        <button
          className="absolute inset-y-0 left-0 w-1/4"
          onClick={() => ir(Math.max(indiceActual - 1, 0))}
          disabled={indiceActual === 0}
          aria-label="Slide anterior"
        />
        <button
          className="absolute inset-y-0 right-0 w-1/4"
          onClick={() => ir(Math.min(indiceActual + 1, slides.length - 1))}
          disabled={indiceActual === slides.length - 1}
          aria-label="Slide siguiente"
        />
      </div>

      {/* BARRA INFERIOR: controles del presentador */}
      <div className="shrink-0 bg-zinc-900 border-t border-white/10">

        {/* Panel de notas colapsable */}
        {panelNotasAbierto && (
          <div className="px-4 pt-3 pb-3 border-b border-white/10 flex flex-col gap-3">
            {notasSesion.length > 0 && (
              <div className="flex gap-2 flex-wrap max-h-20 overflow-y-auto">
                {notasSesion.map((nota, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs max-w-xs min-w-0">
                    <span className="text-amber-400">{EMOJI_CATEGORIA[nota.categoria]}</span>
                    {nota.espacioNombre && <span className="text-white/30 ml-1">- {nota.espacioNombre}</span>}
                    <p className="text-white/70 mt-0.5 truncate">{nota.contenido}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 items-end">
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaNotaReunion)}
                className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-xs shrink-0 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
              >
                {(Object.keys(LABELS_CATEGORIA) as CategoriaNotaReunion[]).map((cat) => (
                  <option key={cat} value={cat} className="bg-zinc-900">
                    {LABELS_CATEGORIA[cat]}
                  </option>
                ))}
              </select>
              <textarea
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void handleGuardarNota()
                }}
                placeholder={`Nota${espacioActual ? ` - ${espacioActual.nombreEspacio}` : ''}... (Ctrl+Enter para guardar)`}
                rows={2}
                className="flex-1 bg-white/5 border border-white/10 text-white placeholder-white/25 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-amber-400/50"
              />
              <button
                onClick={() => void handleGuardarNota()}
                disabled={!contenido.trim() || guardando}
                className="shrink-0 h-10 w-10 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-40 flex items-center justify-center transition-colors"
                aria-label="Guardar nota"
              >
                <Send className="h-4 w-4 text-zinc-900" />
              </button>
            </div>
          </div>
        )}

        {/* Fila principal de controles */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="md"
            onClick={() => ir(Math.max(indiceActual - 1, 0))}
            disabled={indiceActual === 0}
            className="text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Numeracion de slides cercanos */}
          <div className="flex-1 flex items-center gap-1.5 overflow-hidden justify-center">
            {slides.map((_, i) => {
              if (Math.abs(i - indiceActual) > 3) return null
              return (
                <button
                  key={i}
                  onClick={() => ir(i)}
                  className={`shrink-0 transition-all duration-200 rounded text-xs font-mono px-2.5 py-1 ${
                    i === indiceActual
                      ? 'bg-amber-400 text-zinc-900 font-bold scale-110'
                      : 'bg-white/10 text-white/50 hover:bg-white/20'
                  }`}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>

          <Button
            variant="ghost"
            size="md"
            onClick={() => ir(Math.min(indiceActual + 1, slides.length - 1))}
            disabled={indiceActual === slides.length - 1}
            className="text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          <div className="w-px h-6 bg-white/10 shrink-0" />

          <button
            onClick={() => setPanelNotasAbierto((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              panelNotasAbierto
                ? 'bg-amber-400/20 text-amber-400'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            <StickyNote className="h-4 w-4" />
            Notas
            {notasSesion.length > 0 && (
              <span className="bg-amber-400 text-zinc-900 rounded-full px-1.5 font-bold text-[10px]">
                {notasSesion.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}