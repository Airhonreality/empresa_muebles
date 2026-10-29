'use client'

import type { GrupoItemCalculado } from '@/lib/data/contracts'
import { convertirGrupoAProductoAction } from '@/lib/data/actions/core'
import { useState } from 'react'

interface Props {
  grupo: GrupoItemCalculado | null
  abierto: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ConvertirGrupoAProductoModal({ grupo, abierto, onClose, onSuccess }: Props) {
  const [nombre, setNombre] = useState(grupo?.nombre || '')
  const [categoria, setCategoria] = useState('')
  const [cargando, setCargando] = useState(false)

  if (!abierto || !grupo) return null

  const handleConvertir = async () => {
    if (!nombre.trim()) {
      alert('Ingresa nombre del producto')
      return
    }

    setCargando(true)
    try {
      await convertirGrupoAProductoAction(grupo.id, {
        nombreProducto: nombre,
        descripcion: grupo.contenedor?.descripcion ?? undefined,
        precioPublico: grupo.precioPublicoGrupo,
        categoria: categoria || undefined,
      })
      onSuccess()
      onClose()
    } catch (error) {
      alert('Error: ' + String(error))
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Convertir a Producto del Catálogo</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Nombre del Producto</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border rounded px-2 py-1"
              placeholder="Ej: Isla Central Granito"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Categoría (opcional)</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full border rounded px-2 py-1">
              <option value="">--Seleccionar--</option>
              <option value="Cocinas">Cocinas</option>
              <option value="Closets">Closets</option>
              <option value="Estudios">Estudios</option>
              <option value="Comedores">Comedores</option>
              <option value="Baños">Baños</option>
            </select>
          </div>

          <div className="bg-gray-100 p-3 rounded text-sm">
            <p>
              <strong>SKU:</strong> GRUPO-{grupo.id.substring(0, 8).toUpperCase()}
            </p>
            <p>
              <strong>Items:</strong> {grupo.items.length}
            </p>
            <p>
              <strong>Precio público:</strong> ${grupo.precioPublicoGrupo}
            </p>
            {grupo.contenedor?.fotosDisenio.length ? <p>✅ Tiene fotos</p> : <p>❌ Sin fotos</p>}
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
            disabled={cargando}
          >
            Cancelar
          </button>
          <button
            onClick={handleConvertir}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            disabled={cargando}
          >
            {cargando ? 'Convirtiendo...' : 'Archivar & Crear'}
          </button>
        </div>
      </div>
    </div>
  )
}
