'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useStoreChange } from '@/lib/data'
import { clientesKeys } from './clientes-compat'

const TABLAS_CLIENTES = new Set<string>([
  'clientes',
  'proyectos',
  'pedidos_web',
  'obligaciones_pendientes',
  'contratos',
  'hitos_pago',
  // t-188: conversiones y su cola offline también alimentan /erp/clientes.
  'leads',
  'eventos_conversion_offline',
])

export function ClientesSnapBridge() {
  const qc = useQueryClient()
  const storeChange = useStoreChange()

  useEffect(() => {
    const relevante = storeChange.tablas.length === 0
      || storeChange.tablas.some((tabla) => TABLAS_CLIENTES.has(tabla))
    if (!relevante) return
    const timer = setTimeout(() => {
      void qc.invalidateQueries({ queryKey: clientesKeys.all })
    }, 300)
    return () => clearTimeout(timer)
  }, [qc, storeChange])

  return null
}
