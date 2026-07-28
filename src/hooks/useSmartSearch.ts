import { useState, useCallback, useMemo } from 'react'

export interface SearchableItem {
  id: string
  [key: string]: any
}

export interface SmartSearchResult<T extends SearchableItem> {
  item: T
  relevance: number
  type: 'recent' | 'frequent' | 'match'
}

interface SearchHistory {
  id: string
  query: string
  timestamp: number
  context: string
}

interface ItemUsage {
  id: string
  count: number
  lastUsed: number
  context: string
}

const STORAGE_KEY_HISTORY = 'smart-search-history'
const STORAGE_KEY_USAGE = 'smart-search-usage'
const MAX_HISTORY = 20
const MAX_USAGE_ITEMS = 50  // Limitar items rastreados para evitar saturar localStorage
const MAX_RESULTS = 8

// Fuzzy search implementation
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const indicator = a[j - 1] === b[i - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i][j - 1] + 1,
        matrix[i - 1][j] + 1,
        matrix[i - 1][j - 1] + indicator
      )
    }
  }
  return matrix[b.length][a.length]
}

function calculateFuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase()
  const t = target.toLowerCase()

  if (t === q) return 1
  if (t.includes(q)) return 0.9

  const distance = levenshtein(q, t)
  const maxLen = Math.max(q.length, t.length)
  const similarity = 1 - distance / maxLen

  return Math.max(0, similarity)
}

export function useSmartSearch<T extends SearchableItem>(
  items: T[],
  context: string,
  searchFields: (keyof T)[] = []
) {
  const [query, setQuery] = useState('')
  const [history, setHistory] = useState<SearchHistory[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HISTORY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const [usage, setUsage] = useState<Record<string, ItemUsage>>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USAGE)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })

  const saveToHistory = useCallback((q: string) => {
    if (!q.trim()) return
    const newEntry: SearchHistory = {
      id: crypto.randomUUID(),
      query: q,
      timestamp: Date.now(),
      context,
    }
    setHistory((prev) => {
      const filtered = prev.filter(h => h.query !== q || h.context !== context)
      const updated = [newEntry, ...filtered].slice(0, MAX_HISTORY)
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated))
      }
      return updated
    })
  }, [context])

  const trackUsage = useCallback((itemId: string) => {
    setUsage((prev) => {
      const item = prev[itemId] || { id: itemId, count: 0, lastUsed: 0, context }
      let updated = {
        ...prev,
        [itemId]: {
          ...item,
          count: item.count + 1,
          lastUsed: Date.now(),
          context,
        },
      }

      // Si excedemos MAX_USAGE_ITEMS, eliminar el item menos usado
      if (Object.keys(updated).length > MAX_USAGE_ITEMS) {
        const sortedByUsage = Object.entries(updated)
          .sort(([, a], [, b]) => a.lastUsed - b.lastUsed)
        const toRemove = sortedByUsage[0][0]
        delete updated[toRemove]
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_USAGE, JSON.stringify(updated))
      }
      return updated
    })
  }, [context])

  const results: {
    matches: SmartSearchResult<T>[]
    recentlyUsed: SmartSearchResult<T>[]
    suggestions: string[]
  } = useMemo(() => {
    const q = query.trim().toLowerCase()

    // Sin query: devuelve items usados recientemente + histórico de búsquedas
    if (!q) {
      const recentlyUsed = Object.values(usage)
        .filter(u => u.context === context)
        .sort((a, b) => b.lastUsed - a.lastUsed)
        .slice(0, 5)

      const recentlyUsedResults = recentlyUsed
        .map(u => {
          const item = items.find(i => i.id === u.id)
          return item
            ? { item, relevance: 1, type: 'recent' as const }
            : null
        })
        .filter(Boolean) as SmartSearchResult<T>[]

      return {
        matches: [] as SmartSearchResult<T>[],
        recentlyUsed: recentlyUsedResults,
        suggestions: history
          .filter(h => h.context === context)
          .slice(0, 5)
          .map(h => h.query),
      }
    }

    const matches = items
      .map((item) => {
        let maxScore = 0
        if (searchFields.length > 0) {
          for (const field of searchFields) {
            const val = String(item[field] || '').toLowerCase()
            const score = calculateFuzzyScore(q, val)
            maxScore = Math.max(maxScore, score)
          }
        } else {
          // Si no hay campos especificados, busca en todos los valores string
          for (const key in item) {
            const val = String(item[key] || '').toLowerCase()
            const score = calculateFuzzyScore(q, val)
            maxScore = Math.max(maxScore, score)
          }
        }

        // Bonus si el item fue usado recientemente
        const itemUsage = usage[item.id]
        if (itemUsage && itemUsage.context === context) {
          maxScore *= 1.1
        }

        const resultType: 'match' | 'frequent' = maxScore > 0.6 ? 'match' : 'frequent'
        return {
          item,
          relevance: maxScore,
          type: resultType,
        }
      })
      .filter(r => r.relevance > 0.4)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, MAX_RESULTS)

    return {
      matches,
      recentlyUsed: [],
      suggestions: history
        .filter(h => h.context === context && h.query.includes(q))
        .slice(0, 3)
        .map(h => h.query),
    }
  }, [query, items, context, usage, history, searchFields])

  return {
    query,
    setQuery,
    results,
    saveToHistory,
    trackUsage,
    history: history.filter(h => h.context === context),
    usage,
  }
}
