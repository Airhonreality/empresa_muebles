'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useStoreChange } from '@/lib/data'
import { cotizadorListaKeys } from './cotizador-lista-compat'

const TABLAS_LISTA = new Set<string>(['proyectos', 'clientes'])

export function CotizadorListaSnapBridge() {
  const qc = useQueryClient()
  const storeChange = useStoreChange()

  useEffect(() => {
    const relevante = storeChange.tablas.length === 0
      || storeChange.tablas.some((tabla) => TABLAS_LISTA.has(tabla))
    if (!relevante) return
    const timer = setTimeout(() => {
      void qc.invalidateQueries({ queryKey: cotizadorListaKeys.all })
    }, 300)
    return () => clearTimeout(timer)
  }, [qc, storeChange])

  return null
}
