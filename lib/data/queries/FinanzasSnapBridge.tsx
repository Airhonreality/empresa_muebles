'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useStoreChange } from '@/lib/data'
import { esCambioDeFinanzas } from './finanzas-reactividad'
import { finanzasKeys } from './queryKeys'

export function FinanzasSnapBridge() {
  const qc = useQueryClient()
  const storeChange = useStoreChange()

  useEffect(() => {
    if (!esCambioDeFinanzas(storeChange.tablas)) return
    const timer = setTimeout(() => {
      void qc.invalidateQueries({ queryKey: finanzasKeys.all })
    }, 300)
    return () => clearTimeout(timer)
  }, [qc, storeChange])

  return null
}
