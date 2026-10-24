'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useStoreChange } from '@/lib/data'
import { proyectoKeys } from './queryKeys'

const TABLAS_PROYECTO = new Set<string>([
  'proyectos',
  'clientes',
  'espacio_variantes',
  'items_variante',
  'espacios_artefactos',
  'modulos',
  'cronogramas',
  'cronograma_etapas',
  'desfases_cronograma',
  'verificaciones',
  'recepciones_material',
  'citaciones_calidad',
  'reprocesos',
  'instalaciones',
  'actas_entrega',
  'obligaciones_pendientes',
  'ordenes_compra',
  'notas_reunion',
  'modulos_artefactos',
  'productos_catalogo',
  'cuentas_financieras',
])

export function ProyectoSnapBridge({ proyectoId }: { proyectoId: string }) {
  const qc = useQueryClient()
  const storeChange = useStoreChange()

  useEffect(() => {
    const relevante = storeChange.tablas.length === 0
      || storeChange.tablas.some((tabla) => TABLAS_PROYECTO.has(tabla))
    if (!relevante) return
    const timer = setTimeout(() => {
      void qc.invalidateQueries({ queryKey: proyectoKeys.detalle(proyectoId) })
    }, 300)
    return () => clearTimeout(timer)
  }, [qc, storeChange, proyectoId])

  return null
}
