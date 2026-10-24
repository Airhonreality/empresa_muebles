'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useStoreChange } from '@/lib/data'
import { catalogoKeys } from './catalogo-compat'

const TABLAS_CATALOGO = new Set<string>([
  'productos_catalogo',
  'productos_tienda',
  'productos_tienda_componentes',
  'proveedores',
])

export function CatalogoSnapBridge() {
  const qc = useQueryClient()
  const storeChange = useStoreChange()

  useEffect(() => {
    const relevante = storeChange.tablas.length === 0
      || storeChange.tablas.some((tabla) => TABLAS_CATALOGO.has(tabla))
    if (!relevante) return
    const timer = setTimeout(() => {
      void qc.invalidateQueries({ queryKey: catalogoKeys.all })
    }, 300)
    return () => clearTimeout(timer)
  }, [qc, storeChange])

  return null
}
