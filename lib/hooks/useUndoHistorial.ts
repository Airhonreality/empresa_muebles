'use client'
import { useRef } from 'react'

const LIMITE_HISTORIAL = 50

/**
 * Historial de deshacer/rehacer manual (t-177, diagnóstico de UI del cotizador 2026-09-30).
 *
 * Un input de texto controlado por React que NO transforma lo que el usuario escribe (como
 * `InputField`) ya tiene undo nativo del navegador gratis: el Ctrl+Z del navegador opera sobre
 * el buffer interno del elemento DOM, que coincide con lo que React muestra.
 *
 * Pero `MoneyInput`/`NumberInput` filtran cada tecla con una regex (solo dejan pasar dígitos/
 * separadores) y le devuelven al input un valor DISTINTO al que el usuario tecleó -- eso
 * desincroniza el undo nativo (el DOM recuerda la tecla real, React muestra la versión
 * filtrada). Esta clase reemplaza ese undo roto por uno propio, manual, consistente.
 *
 * Es una estructura mutable plana (sin React) a propósito -- no necesita disparar un re-render
 * por sí misma: el componente ya re-renderiza cuando aplica el valor devuelto por `deshacer`/
 * `rehacer` al estado real del input. Eso la hace trivial de testear con `node:assert`.
 */
export class HistorialDeshacer {
  private historial: string[]
  private posicion: number

  constructor(valorInicial: string) {
    this.historial = [valorInicial]
    this.posicion = 0
  }

  /** Se llama en cada cambio real del usuario (NUNCA al aplicar un deshacer/rehacer, o se crea
   *  un loop: cada deshacer registraría un paso nuevo hacia adelante). */
  registrar(valor: string): void {
    if (this.historial[this.posicion] === valor) return
    const base = this.historial.slice(0, this.posicion + 1)
    this.historial = [...base, valor].slice(-LIMITE_HISTORIAL)
    this.posicion = this.historial.length - 1
  }

  /** Devuelve el valor al que hay que volver, o `null` si no hay nada que deshacer. */
  deshacer(): string | null {
    if (this.posicion === 0) return null
    this.posicion -= 1
    return this.historial[this.posicion]
  }

  /** Devuelve el valor al que hay que avanzar, o `null` si no hay nada que rehacer. */
  rehacer(): string | null {
    if (this.posicion >= this.historial.length - 1) return null
    this.posicion += 1
    return this.historial[this.posicion]
  }
}

/** Una instancia estable de `HistorialDeshacer` por input, creada una sola vez. */
export function useUndoHistorial(valorInicial: string): HistorialDeshacer {
  const ref = useRef<HistorialDeshacer | null>(null)
  if (!ref.current) ref.current = new HistorialDeshacer(valorInicial)
  return ref.current
}

/** Atajo compartido: Ctrl+Z / Cmd+Z deshace, Ctrl+Shift+Z / Cmd+Shift+Z / Ctrl+Y rehace. */
export function detectarAtajoDeshacer(e: React.KeyboardEvent): 'deshacer' | 'rehacer' | null {
  const mod = e.ctrlKey || e.metaKey
  if (!mod) return null
  const tecla = e.key.toLowerCase()
  if (tecla === 'z') return e.shiftKey ? 'rehacer' : 'deshacer'
  if (tecla === 'y') return 'rehacer'
  return null
}
