'use client'

import { useState } from 'react'
import { ImagePicker } from '@/components/veta/image-picker'
import { Button } from '@/components/veta/button'
import { actualizarContenedorDescriptivoGrupoAction } from '@/lib/data/actions/core'
import type { ContenedorDescriptivo } from '@/lib/data'

export interface GrupoFotosUploadProps {
  grupoId: string
  contenedor: ContenedorDescriptivo | null
  onUpdate: (contenedor: ContenedorDescriptivo) => void
}

/** 🆕 Fase 3.2 (2026-10-29): UI para cargar fotos en grupos de items */
export function GrupoFotosUpload({ grupoId, contenedor, onUpdate }: GrupoFotosUploadProps) {
  const [expandido, setExpandido] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const handleGuardarFotos = async (tipo: 'fotosEspacio' | 'fotosDisenio' | 'fotosReferencia', urls: string[]) => {
    setGuardando(true)
    try {
      const actualizado = await actualizarContenedorDescriptivoGrupoAction(grupoId, {
        [tipo]: urls,
      })
      if (actualizado) {
        onUpdate(actualizado)
      }
    } catch (error) {
      console.error('Error al actualizar fotos:', error)
    } finally {
      setGuardando(false)
    }
  }

  const fotosEspacio = contenedor?.fotosEspacio ?? []
  const fotosDisenio = contenedor?.fotosDisenio ?? []
  const fotosReferencia = contenedor?.fotosReferencia ?? []

  const totalFotos = fotosEspacio.length + fotosDisenio.length + fotosReferencia.length

  return (
    <div className="border rounded-lg p-3 bg-blue-50">
      <button
        type="button"
        onClick={() => setExpandido(!expandido)}
        className="w-full text-left font-semibold flex justify-between items-center hover:opacity-70"
      >
        <span>📸 Fotos del Grupo {totalFotos > 0 && `(${totalFotos})`}</span>
        <span>{expandido ? '▼' : '▶'}</span>
      </button>

      {expandido && (
        <div className="mt-3 space-y-4">
          {/* Fotos Espacio */}
          <div>
            <label className="block text-sm font-semibold mb-2">Fotos del Espacio</label>
            <ImagePicker
              label="Agregar fotos del espacio"
              value={fotosEspacio}
              onChange={(urls) => handleGuardarFotos('fotosEspacio', urls)}
              multiple={true}
              r2Prefix="cotizador/grupos/espacio/"
              uploadToR2={true}
            />
          </div>

          {/* Fotos Diseño */}
          <div>
            <label className="block text-sm font-semibold mb-2">Fotos de Diseño</label>
            <ImagePicker
              label="Agregar fotos de diseño"
              value={fotosDisenio}
              onChange={(urls) => handleGuardarFotos('fotosDisenio', urls)}
              multiple={true}
              r2Prefix="cotizador/grupos/diseno/"
              uploadToR2={true}
            />
          </div>

          {/* Fotos Referencia */}
          <div>
            <label className="block text-sm font-semibold mb-2">Fotos de Referencia</label>
            <ImagePicker
              label="Agregar fotos de referencia"
              value={fotosReferencia}
              onChange={(urls) => handleGuardarFotos('fotosReferencia', urls)}
              multiple={true}
              r2Prefix="cotizador/grupos/referencia/"
              uploadToR2={true}
            />
          </div>
        </div>
      )}

      {guardando && (
        <p className="text-sm text-gray-600 mt-2 animate-pulse">Guardando fotos...</p>
      )}
    </div>
  )
}
