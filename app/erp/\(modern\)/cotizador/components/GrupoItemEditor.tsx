'use client'

import type { GrupoItemHidratado, GrupoItemCalculado } from '@/lib/data/contracts'
import { calcularGrupoConSubgrupos, type ParametrosManoObra } from '@/lib/data/queries/grupo-calculado'
import { useState } from 'react'

interface Props {
  grupo: GrupoItemHidratado
  parametros: ParametrosManoObra
  onUpdate: (cambios: Partial<typeof grupo>) => Promise<void>
  onConvert: () => void
}

export function GrupoItemEditor({ grupo, parametros, onUpdate, onConvert }: Props) {
  const [expandido, setExpandido] = useState(false)
  const calculado = calcularGrupoConSubgrupos(grupo, parametros)

  return (
    <div className="border rounded-lg p-4 bg-white">
      {/* Header colapsable */}
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandido(!expandido)}>
        <div className="flex-1">
          <h3 className="font-bold">{grupo.nombre}</h3>
          <p className="text-sm text-gray-600">
            {grupo.items.length} ítems · ${calculado.precioPublicoGrupo}
          </p>
        </div>
        <button
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded"
          onClick={(e) => {
            e.stopPropagation()
            onConvert()
          }}
        >
          Convertir a Producto
        </button>
      </div>

      {/* Contenido expandible */}
      {expandido && (
        <div className="mt-4 border-t pt-4">
          {/* Jornadas */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <input
              type="number"
              step="0.5"
              value={grupo.jornadasDesarrolloTecnico}
              onChange={(e) => onUpdate({ jornadasDesarrolloTecnico: e.target.value })}
              placeholder="Jornadas desarrollo"
              className="border rounded px-2 py-1 text-sm"
            />
            <input
              type="number"
              step="0.5"
              value={grupo.jornadasEnsamblajeTaller}
              onChange={(e) => onUpdate({ jornadasEnsamblajeTaller: e.target.value })}
              placeholder="Jornadas ensamblaje"
              className="border rounded px-2 py-1 text-sm"
            />
            <input
              type="number"
              step="0.5"
              value={grupo.jornadasInstalacionObra}
              onChange={(e) => onUpdate({ jornadasInstalacionObra: e.target.value })}
              placeholder="Jornadas instalación"
              className="border rounded px-2 py-1 text-sm"
            />
          </div>

          {/* Resumen de cálculos */}
          <div className="bg-gray-100 p-2 rounded text-sm mb-4">
            <p>Neto ítems: ${calculado.sumaItemsNeto}</p>
            <p>Con IVA: ${calculado.sumaItemsConIVA}</p>
            <p>Mano de obra: ${calculado.valorManoObraEstimada}</p>
            <p className="font-bold">Total grupo: ${calculado.precioPublicoGrupo}</p>
          </div>

          {/* Items del grupo */}
          <div className="space-y-2">
            {grupo.items.map((item) => (
              <div key={item.id} className="border-l-2 border-gray-300 pl-2 text-sm">
                <p>{item.nombrePersonalizado || 'Item sin nombre'}</p>
                <p className="text-gray-600">${item.totalLinea || '0'}</p>
              </div>
            ))}
          </div>

          {/* Subgrupos */}
          {grupo.subgrupos.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <p className="font-semibold text-sm mb-2">Subgrupos:</p>
              {grupo.subgrupos.map((sub) => (
                <GrupoItemEditor key={sub.id} grupo={sub} parametros={parametros} onUpdate={onUpdate} onConvert={onConvert} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
