'use client'

import { useEffect, useState } from 'react'

/** Patrón A.3 (m06): retrasa la propagación de un valor que cambia rápido
 *  (búsqueda/filtros). Devuelve el valor estable tras `delayMs` de quietud. */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}