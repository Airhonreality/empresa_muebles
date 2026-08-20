'use client'

import { useEffect, useRef, useState } from 'react'

/** Buffer local para inputs que persisten al servidor en cada cambio (cantidad, precio, etc.).
 *  El valor visible responde al instante al tipeo -- nunca lo pisa un re-render mientras el
 *  usuario edita -- y el commit real (`onCommit`) se dispara recién tras `delayMs` de pausa o
 *  al perder foco, no en cada tecla. Sin esto, un input controlado directo por el store global
 *  (que re-renderiza en cualquier mutación o ciclo de polling) revierte lo que el usuario acaba
 *  de escribir a mitad del round-trip al servidor -- el bug real detrás de "los inputs del ERP
 *  no reaccionan" (2026-08-20): cada tecla disparaba su propio SELECT+UPDATE contra Neon sin
 *  buffer local, así que cualquier re-render en el medio pisaba el tecleo en curso. */
export function useDebouncedInput(
  value: string,
  onCommit: (value: string) => void,
  delayMs = 500,
) {
  const [local, setLocal] = useState(value)
  const editingRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onCommitRef = useRef(onCommit)
  const lastSentRef = useRef(value)
  onCommitRef.current = onCommit

  useEffect(() => {
    lastSentRef.current = value
    if (!editingRef.current) setLocal(value)
  }, [value])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  function flush(v: string): void {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    editingRef.current = false
    if (v !== lastSentRef.current) {
      lastSentRef.current = v
      onCommitRef.current(v)
    }
  }

  function onChangeLocal(v: string): void {
    editingRef.current = true
    setLocal(v)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => flush(v), delayMs)
  }

  function onBlurLocal(): void {
    flush(local)
  }

  return { local, onChangeLocal, onBlurLocal }
}
