'use client'

import { useEffect, useState } from 'react'

/**
 * Resuelve una media query de forma segura en el servidor (renderiza `false` en el
 * primer render para evitar mismatch de hidratación; el valor real se establece tras
 * el montaje en el cliente).
 */
export function useMediaQuery(query: string): boolean {
  const [value, setValue] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setValue(e.matches)
    setValue(mql.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])
  return value
}

/**
 * Breakpoint de decisión del plan Cotizador Responsive:
 *  Móvil   = < sm   (max-width: 639px)
 *  Escritorio = ≥ sm  (min-width: 640px)
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 639px)')
}
