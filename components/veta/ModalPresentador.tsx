'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, Send } from 'lucide-react'
import { Button } from '@/components/veta/button'
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
  requisito_cliente: '📋 Requisito del cliente',
  cambio_diseno: '✏️ Cambio de diseño',
  cambio_presupuesto: '💰 Cambio de presupuesto',
  acuerdo: '🤝 Acuerdo',
  libre: '📝 Nota libre',
}

export function ModalPresentador({ proyectoId, slides, onCrearNota, onCerrar }: ModalPresentadorProps) {
  const [indiceActual, setIndiceActual] = useState(0)
  const [categoria, setCategoria] = useState<CategoriaNotaReunion>('libre')
  const [contenido, setContenido] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [notasSesion, setNotasSesion] = useState<Array<{ categoria: CategoriaNotaReunion; contenido: string; espacioNombre: string | null }>>([])

  const slideActual = slides[indiceActual]

  // Emitir al tab de propuesta pública vía BroadcastChannel
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

  // Navegar con teclado (← →)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIndiceActual((i) => Math.min(i + 1, slides.length - 1))
      if (e.key === 'ArrowLeft') setIndiceActual((i) => Math.max(i - 1, 0))
      if (e.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [slides.length, onCerrar])

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

  // Descripción textual del slide actual (preview en panel)
  function describirSlide(slide: TipoSlide): string {
    switch (slide.tipo) {
      case 'portada_proyecto': return `Portada: ${slide.proyecto.nombreProyecto}`
      case 'espacio_portada': return `${slide.espacio.nombreEspacio} — Portada (${slide.indice}/${slide.total})`
      case 'espacio_galeria': return `${slide.espacio.nombreEspacio} — Galería (${slide.fotos.length} fotos)`
      case 'espacio_items': return `${slide.espacio.nombreEspacio} — Qué incluye · ${slide.items.length} ítems · ${slide.subtotal}`
      case 'resumen_breakdown': return `Resumen — ${slide.espacios.length} espacios · Total: ${slide.totalGeneral}`
      case 'cierre': return `Cierre — ${slide.proyecto.nombreProyecto}`
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex" role="dialog" aria-modal="true">
      {/* COLUMNA IZQUIERDA — preview + controles de navegación */}
      <div className="flex flex-col items-center justify-center w-[38%] border-r border-white/10 p-8 gap-6">
        {/* Preview textual del slide */}
        <div className="w-full bg-white/5 rounded-xl p-5 min-h-[140px] flex items-center justify-center text-center">
          <p className="text-white/90 text-base font-medium leading-relaxed">
            {slideActual ? describirSlide(slideActual) : '—'}
          </p>
        </div>

        {/* Indicador de posición */}
        <p className="text-white/40 text-sm">
          Slide {indiceActual + 1} de {slides.length}
        </p>

        {/* Barra de progreso */}
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 transition-all duration-300"
            style={{ width: `${slides.length > 0 ? ((indiceActual + 1) / slides.length) * 100 : 0}%` }}
          />
        </div>

        {/* Controles ◀ ▶ */}
        <div className="flex gap-4 items-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setIndiceActual((i) => Math.max(i - 1, 0))}
            disabled={indiceActual === 0}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setIndiceActual((i) => Math.min(i + 1, slides.length - 1))}
            disabled={indiceActual === slides.length - 1}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Siguiente
            <ChevronRight className="h-5 w-5 ml-1" />
          </Button>
        </div>

        {/* Botón cerrar */}
        <button
          onClick={onCerrar}
          className="mt-4 flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors"
        >
          <X className="h-4 w-4" /> Terminar presentación
        </button>
      </div>

      {/* COLUMNA DERECHA — panel de captura de notas */}
      <div className="flex flex-col w-[62%] p-8 gap-4 overflow-y-auto">
        <h2 className="text-white font-semibold text-lg">
          📝 Notas de reunión
          {espacioActual && (
            <span className="ml-2 text-white/40 font-normal text-sm">
              · {espacioActual.nombreEspacio}
            </span>
          )}
        </h2>

        {/* Selector de categoría */}
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value as CategoriaNotaReunion)}
          className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
        >
          {(Object.keys(LABELS_CATEGORIA) as CategoriaNotaReunion[]).map((cat) => (
            <option key={cat} value={cat} className="bg-zinc-900">
              {LABELS_CATEGORIA[cat]}
            </option>
          ))}
        </select>

        {/* Textarea de contenido */}
        <textarea
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void handleGuardarNota()
          }}
          placeholder="Escribe la nota... (Ctrl+Enter para guardar)"
          rows={4}
          className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/50"
        />

        <Button
          onClick={() => void handleGuardarNota()}
          disabled={!contenido.trim() || guardando}
          className="self-end"
        >
          <Send className="h-4 w-4 mr-2" />
          {guardando ? 'Guardando…' : 'Agregar nota'}
        </Button>

        {/* Lista de notas de esta sesión */}
        {notasSesion.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-white/40 text-xs uppercase tracking-wider">
              Notas de esta sesión ({notasSesion.length})
            </p>
            {notasSesion.map((nota, i) => (
              <div key={i} className="bg-white/5 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-amber-400 text-xs">{LABELS_CATEGORIA[nota.categoria]}</span>
                  {nota.espacioNombre && (
                    <span className="text-white/30 text-xs">· {nota.espacioNombre}</span>
                  )}
                </div>
                <p className="text-white/80 text-sm">{nota.contenido}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
