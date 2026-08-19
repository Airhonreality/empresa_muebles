'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { coincide, scoreCoincidencia } from '@/lib/search/normalizar'
import { useDebounce } from './useDebounce'

const MAX_HISTORIAL = 20
const MAX_USO = 50

function leerJson<T>(clave: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const crudo = window.localStorage.getItem(clave)
    return crudo ? (JSON.parse(crudo) as T) : fallback
  } catch {
    return fallback
  }
}

function escribirJson(clave: string, valor: unknown): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(clave, JSON.stringify(valor))
  } catch {
    // localStorage lleno/bloqueado: el historial es best-effort, no debe romper la búsqueda.
  }
}

export interface UseSmartSearchOptions<T> {
  items: T[]
  getCampos: (item: T) => string[]
  /** Contexto de búsqueda: aísla historial/uso por pantalla (A.5). Ej. "comercial-kanban".
   *  Clave de historial derivada: `<contexto>-search` — con contexto "comercial-kanban"
   *  produce "comercial-kanban-search" (requisito CA-7 del kanban, disenio_p01 §5.2). */
  contexto?: string
  /** Habilita el fallback fuzzy por typo. Default: true (Opción A, t-141). */
  fuzzy?: boolean
  /** Máximo de resultados devueltos. */
  limite?: number
  /** Milisegundos de debounce para registrar historial (evita escribir en cada tecla). */
  debounceHistorialMs?: number
}

export interface UseSmartSearchResult<T> {
  query: string
  setQuery: (valor: string) => void
  limpiar: () => void
  resultado: T[]
  total: number
  historial: string[]
  /** Items del contexto con uso registrado, ordenados por frecuencia (sugerencias A.5). */
  usoFrecuente: T[]
  registrarUso: (item: T) => void
}

/** Patrón A.5 (m06, adaptado en t-141 por decisión del Supervisor 2026-08-19):
 *  búsqueda inteligente con matcher en capas (normalización + tokens AND + fuzzy acotado),
 *  historial de consultas por contexto en localStorage (max 20) y uso frecuente con
 *  evicción a max 50 items. */
export function useSmartSearch<T extends { id: string }>({
  items,
  getCampos,
  contexto,
  fuzzy = true,
  limite = 200,
  debounceHistorialMs = 400,
}: UseSmartSearchOptions<T>): UseSmartSearchResult<T> {
  const claveHistorial = contexto ? `${contexto}-search` : 'smart-search-history'
  const claveUso = contexto ? `smart-search-usage:${contexto}` : 'smart-search-usage'

  const [query, setQuery] = useState('')
  const [historial, setHistorial] = useState<string[]>(() => leerJson<string[]>(claveHistorial, []))
  const [uso, setUso] = useState<Record<string, number>>(() => leerJson<Record<string, number>>(claveUso, {}))

  // Persistir historial de consultas (best-effort). La clave existe en localStorage apenas el
  // usuario busca algo — requisito CA-7 del kanban (comercial-kanban-search).
  const qDebounced = useDebounce(query.trim(), debounceHistorialMs)
  useEffect(() => {
    if (!qDebounced) return
    setHistorial((prev) => {
      const sinDuplicado = prev.filter((h) => h !== qDebounced)
      const siguiente = [qDebounced, ...sinDuplicado].slice(0, MAX_HISTORIAL)
      escribirJson(claveHistorial, siguiente)
      return siguiente
    })
  }, [qDebounced, claveHistorial])

  const resultado = useMemo(() => {
    const q = query.trim()
    if (!q) return items.slice(0, limite)
    const puntuados = items
      .map((item) => ({ item, campos: getCampos(item) }))
      .map(({ item, campos }) => {
        const base = scoreCoincidencia(q, campos)
        const fuzzyOk = fuzzy && base === 0 && coincide(q, campos, { fuzzy: true })
        const pts = fuzzyOk ? 1 : base
        const bonus = uso[item.id] ? 1 : 0
        return { item, pts: pts + bonus }
      })
      .filter(({ pts }) => pts > 0)
      .sort((a, b) => b.pts - a.pts)
    return puntuados.slice(0, limite).map(({ item }) => item)
  }, [query, items, getCampos, fuzzy, limite, uso])

  const usoFrecuente = useMemo(() => {
    return items
      .map((item) => ({ item, count: uso[item.id] ?? 0 }))
      .filter(({ count }) => count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(({ item }) => item)
  }, [items, uso])

  const registrarUso = useCallback(
    (item: T) => {
      setUso((prev) => {
        const siguiente = { ...prev, [item.id]: (prev[item.id] ?? 0) + 1 }
        const claves = Object.keys(siguiente)
        if (claves.length > MAX_USO) {
          for (const k of claves.slice(0, claves.length - MAX_USO)) delete siguiente[k]
        }
        escribirJson(claveUso, siguiente)
        return siguiente
      })
    },
    [claveUso]
  )

  const limpiar = useCallback(() => setQuery(''), [])

  return { query, setQuery, limpiar, resultado, total: resultado.length, historial, usoFrecuente, registrarUso }
}