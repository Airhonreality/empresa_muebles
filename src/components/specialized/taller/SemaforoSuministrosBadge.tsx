'use client'

import React, { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { PackageCheck, AlertTriangle, PackageX } from 'lucide-react'

interface SemaforoProps {
  proyectoId?: string;
  nombreProyecto?: string;
}

export default function SemaforoSuministrosBadge({ proyectoId, nombreProyecto }: SemaforoProps) {
  const [pedidos, setPedidos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!proyectoId && !nombreProyecto) {
      setLoading(false)
      return
    }

    fetch('/api/vault?namespace=compras_materiales')
      .then(r => r.json())
      .then(d => {
        const records = d.records || []
        const fil = records.filter((p: any) => {
          const orig = p.data?.origen_proyecto || ''
          return (proyectoId && orig.includes(proyectoId)) || (nombreProyecto && orig.toLowerCase().includes(nombreProyecto.toLowerCase()))
        })
        setPedidos(fil)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [proyectoId, nombreProyecto])

  if (loading || (!proyectoId && !nombreProyecto)) return null

  if (pedidos.length === 0) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1 font-bold text-xs px-3 py-1 shadow-sm">
        <PackageX className="w-3.5 h-3.5" /> Suministros: 0% Solicitados
      </Badge>
    )
  }

  const allRecibidos = pedidos.every(p => p.data?.estado === 'recibido')

  if (allRecibidos) {
    return (
      <Badge className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1 font-bold text-xs px-3 py-1 shadow-sm">
        <PackageCheck className="w-3.5 h-3.5" /> Kit 100% en Taller (Listo)
      </Badge>
    )
  }

  const enCamino = pedidos.filter(p => p.data?.estado !== 'recibido').length

  return (
    <Badge className="bg-amber-500 hover:bg-amber-600 text-stone-950 flex items-center gap-1 font-bold text-xs px-3 py-1 shadow-sm animate-pulse" title={`${enCamino} ítems pendientes de entrega en almacén`}>
      <AlertTriangle className="w-3.5 h-3.5" /> En Tránsito ({pedidos.length - enCamino}/{pedidos.length} recibidos)
    </Badge>
  )
}
