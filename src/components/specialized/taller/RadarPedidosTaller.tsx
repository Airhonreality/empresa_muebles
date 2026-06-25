'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Truck, CheckCircle2, Clock, PackageCheck, AlertCircle } from 'lucide-react'

interface CompraMaterial {
  id: string;
  data: {
    descripcion?: string;
    cantidad?: number;
    unidad_medida?: string;
    costo_real_compra?: number;
    estado?: 'solicitado' | 'en_transito' | 'recibido';
    origen_proyecto?: string;
    fecha_compra?: string;
  }
}

export default function RadarPedidosTaller() {
  const [pedidos, setPedidos] = useState<CompraMaterial[]>([])
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const cargarPedidos = () => {
    fetch('/api/vault?namespace=compras_materiales')
      .then(r => r.json())
      .then(d => setPedidos(d.records || []))
      .catch(() => toast.error('Error cargando radar logístico'))
  }

  useEffect(() => {
    cargarPedidos()
    const int = setInterval(cargarPedidos, 10000)
    return () => clearInterval(int)
  }, [])

  const actualizarEstado = async (id: string, nuevoEstado: string) => {
    setLoadingId(id)
    try {
      const ped = pedidos.find(p => p.id === id)
      if (!ped) return

      const newData = { ...ped.data, estado: nuevoEstado }
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'WRITE',
          namespace: 'compras_materiales',
          record: { id, data: newData }
        })
      })

      if (!res.ok) throw new Error('Error en servidor')

      toast.success(nuevoEstado === 'recibido' ? '✅ Material confirmado en almacén de taller' : '🚚 Despacho confirmado por proveedor')
      cargarPedidos()
    } catch {
      toast.error('No se pudo actualizar el estado logístico')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-base font-black text-stone-800 tracking-tight flex items-center gap-2">
          <Truck className="w-5 h-5 text-amber-600" /> Radar de Pedidos en Tránsito
        </h3>
        <Button variant="ghost" size="sm" onClick={cargarPedidos} className="text-xs text-stone-500">
          Actualizar
        </Button>
      </div>

      {pedidos.length === 0 ? (
        <Card className="bg-stone-50/50 border-dashed border-2">
          <CardContent className="p-8 text-center text-stone-400 text-sm flex flex-col items-center gap-2">
            <PackageCheck className="w-8 h-8 text-stone-300 animate-bounce" />
            <p>No hay pedidos pendientes de entrega.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pedidos.map((ped) => {
            const estado = ped.data.estado || 'solicitado'
            const isRecibido = estado === 'recibido'

            return (
              <Card key={ped.id} className={`transition-all border-l-4 ${
                isRecibido ? 'border-l-green-500 bg-green-50/20 opacity-75' :
                estado === 'en_transito' ? 'border-l-blue-500 bg-white shadow-md' :
                'border-l-amber-500 bg-white shadow-sm'
              }`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="font-black text-stone-800 text-sm block">
                        {ped.data.cantidad} {ped.data.unidad_medida || 'unds'} · {ped.data.descripcion || 'Ítem'}
                      </span>
                      <span className="text-[11px] font-bold text-amber-700 block mt-0.5">
                        📦 {ped.data.origen_proyecto || 'Stock Taller General'}
                      </span>
                    </div>
                    <Badge variant={isRecibido ? 'default' : 'secondary'} className={`text-[10px] font-black uppercase ${
                      isRecibido ? 'bg-green-600 text-white' :
                      estado === 'en_transito' ? 'bg-blue-600 text-white animate-pulse' :
                      'bg-stone-200 text-stone-700'
                    }`}>
                      {estado}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t text-xs text-stone-500">
                    <span className="font-mono font-bold">${Number(ped.data.costo_real_compra || 0).toLocaleString()}</span>
                    
                    {!isRecibido && (
                      <Button
                        size="sm"
                        disabled={loadingId === ped.id}
                        onClick={() => actualizarEstado(ped.id, estado === 'solicitado' ? 'en_transito' : 'recibido')}
                        className={`h-8 px-3 font-bold text-xs shadow-sm ${
                          estado === 'solicitado' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                          'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {loadingId === ped.id ? '⏳...' : estado === 'solicitado' ? (
                          <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Confirmar Despacho</span>
                        ) : (
                          <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Confirmar Llegada</span>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
