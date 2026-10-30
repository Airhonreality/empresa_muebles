'use client'

import { useEffect, useRef, useState } from 'react'
import { crearColaAutosave, type ColaAutosave, type EstadoAutosave } from './autosave-cola'

export { combinarEstados } from './autosave-cola'
export type { EstadoAutosave } from './autosave-cola'

/**
 * Autoguardado de un draft (una "sección" del formulario = un valor = un patch).
 *
 * - Debounce trailing `delayMs` (700 ms por defecto) → N teclas = 1 request.
 * - Flush inmediato al desmontar, al ocultar la pestaña (visibilitychange/pagehide) y cuando
 *   el caller lo pide (`flush`, ej. botón "Listo").
 * - Una sola escritura en vuelo por instancia; si el usuario sigue escribiendo, al terminar
 *   se manda el último valor (nunca dos requests concurrentes).
 * - No guarda el valor inicial ni valores idénticos al último guardado.
 * - En error, el draft local se conserva y queda `reintentar()`.
 *
 * El `guardar` puede cambiar de identidad en cada render (closures): se lee por ref, así el
 * hook no re-agenda por eso.
 */
export function useAutosave<T>({
  valor,
  guardar,
  delayMs = 700,
  activo = true,
}: {
  valor: T
  guardar: (valor: T) => Promise<unknown>
  delayMs?: number
  activo?: boolean
}): { estado: EstadoAutosave; flush: () => void; reintentar: () => void } {
  const [estado, setEstado] = useState<EstadoAutosave>('idle')
  const guardarRef = useRef(guardar)
  guardarRef.current = guardar

  const colaRef = useRef<ColaAutosave<T> | null>(null)
  if (!colaRef.current) {
    colaRef.current = crearColaAutosave<T>({
      valorInicial: valor,
      delayMs,
      guardar: (v) => guardarRef.current(v),
      onEstado: setEstado,
    })
  }

  useEffect(() => {
    if (activo) colaRef.current?.programar(valor)
  }, [valor, activo])

  useEffect(() => {
    const cola = colaRef.current
    const flush = () => cola?.flush()
    const alOcultarPestania = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    document.addEventListener('visibilitychange', alOcultarPestania)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', alOcultarPestania)
      window.removeEventListener('pagehide', flush)
      // Colapsó la tarjeta/se cerró la sección: lo último escrito no puede quedarse en el aire.
      flush()
      cola?.dispose()
    }
  }, [])

  return {
    estado,
    flush: () => colaRef.current?.flush(),
    reintentar: () => colaRef.current?.reintentar(),
  }
}
