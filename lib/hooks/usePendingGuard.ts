'use client'

import { useCallback, useRef, useState } from 'react'

/** Bloquea la re-entrada de una acción async (crear/guardar/enviar) mientras está en vuelo.
 *  Sin esto, un botón sin feedback visual invita al doble clic y cada clic dispara su propio
 *  INSERT -- el patrón que causó proyectos/clientes/etc. duplicados en el ERP (2026-08-19).
 *  `pendingRef` bloquea de forma síncrona (el re-render de `isPending` llega un tick tarde,
 *  suficiente para que un segundo clic se cuele antes de que el botón se deshabilite). */
export function usePendingGuard() {
  const [isPending, setIsPending] = useState(false)
  const pendingRef = useRef(false)

  const guard = useCallback(async <R,>(fn: () => Promise<R>): Promise<R | undefined> => {
    if (pendingRef.current) return undefined
    pendingRef.current = true
    setIsPending(true)
    try {
      return await fn()
    } finally {
      pendingRef.current = false
      setIsPending(false)
    }
  }, [])

  return { guard, isPending }
}
