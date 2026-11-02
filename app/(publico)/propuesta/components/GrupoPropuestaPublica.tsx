'use client'

import type { GrupoItemCalculado, GrupoItemHidratado } from '@/lib/data/contracts'
import { calcularGrupoConSubgrupos, type ParametrosManoObra } from '@/lib/data/queries/grupo-calculado'
import { useState } from 'react'
import Image from 'next/image'

interface Props {
  grupo: GrupoItemCalculado
  parametros: ParametrosManoObra
}

export function GrupoPropuestaPublica({ grupo, parametros }: Props) {
  const [expandido, setExpandido] = useState(false)

  // Tomar primera foto de diseño si existe
  const fotoPrincipal = grupo.contenedor?.fotosDisenio?.[0]

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-4 p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
        onClick={() => setExpandido(!expandido)}
      >
        {/* Imagen */}
        {fotoPrincipal && (
          <div className="relative w-24 h-24 flex-shrink-0">
            <Image
              src={fotoPrincipal}
              alt={grupo.nombre}
              fill
              className="object-cover rounded"
            />
          </div>
        )}

        {/* Info */}
        <div className="flex-1">
          <h3 className="font-bold text-lg">{grupo.nombre}</h3>
          {grupo.contenedor?.descripcion && <p className="text-sm text-gray-600">{grupo.contenedor.descripcion}</p>}
          <p className="text-xs text-gray-500 mt-1">{grupo.items.length} artículos</p>
        </div>

        {/* Precio */}
        <div className="text-right">
          <p className="text-xl font-bold text-green-700">${grupo.precioPublicoGrupo}</p>
          <p className="text-xs text-gray-500">Grupo</p>
        </div>
      </div>

      {/* Expandible */}
      {expandido && (
        <div className="border-t p-4 bg-white">
          {/* Items dentro del grupo */}
          <div className="mb-4">
            <h4 className="font-semibold text-sm mb-2">Artículos incluidos:</h4>
            <ul className="space-y-1 text-sm">
              {grupo.items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>{item.nombrePersonalizado || 'Artículo'} (x{item.cantidad})</span>
                  <span>${item.totalLinea || '0'}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Desglose de precios */}
          <div className="border-t pt-2 space-y-1 text-sm">
            <p className="flex justify-between">
              <span>Subtotal artículos:</span>
              <span>${grupo.sumaItemsNeto}</span>
            </p>
            <p className="flex justify-between">
              <span>+ IVA:</span>
              <span>${(parseFloat(grupo.sumaItemsConIVA) - parseFloat(grupo.sumaItemsNeto)).toFixed(2)}</span>
            </p>
            <p className="flex justify-between">
              <span>+ Mano de obra:</span>
              <span>${grupo.valorManoObraEstimada}</span>
            </p>
            <p className="flex justify-between font-bold border-t pt-1">
              <span>Total grupo:</span>
              <span>${grupo.precioPublicoGrupo}</span>
            </p>
          </div>

          {/* Subgrupos */}
          {grupo.subgrupos && grupo.subgrupos.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <h4 className="font-semibold text-sm mb-2">Componentes:</h4>
              {(grupo.subgrupos as GrupoItemHidratado[]).map((sub) => {
                const subCalculado = calcularGrupoConSubgrupos(sub, parametros)
                return (
                  <div key={sub.id} className="ml-4 border-l-2 border-gray-300 pl-4 mb-3">
                    <GrupoPropuestaPublica grupo={subCalculado} parametros={parametros} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
