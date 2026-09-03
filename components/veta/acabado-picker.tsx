'use client'

import { useState, useMemo } from 'react'
import type { CatalogoAcabado } from '@/lib/data'

export interface AcabadoItem {
  id?: string
  nombre: string
  familia?: string | null
  colorHex?: string | null
  imagenTexturaUrl?: string | null
  textura?: string | null
}

interface AcabadoPickerProps {
  label?: string
  acabadosDisponibles: CatalogoAcabado[]
  value: (AcabadoItem | string)[]
  onChange: (acabados: AcabadoItem[]) => void
  className?: string
}

export function AcabadoPicker({
  label = 'Acabados y Colores del Espacio',
  acabadosDisponibles,
  value,
  onChange,
  className = '',
}: AcabadoPickerProps) {
  const [abierto, setAbierto] = useState(false)
  const [filtroTexto, setFiltroTexto] = useState('')
  const [familiaSeleccionada, setFamiliaSeleccionada] = useState<string>('todas')
  const [customTexto, setCustomTexto] = useState('')

  // Normalizar valor a AcabadoItem[]
  const seleccionados = useMemo<AcabadoItem[]>(() => {
    return (value ?? []).map((v) => {
      if (typeof v === 'string') {
        // Buscar si coincide con alguno del catálogo
        const encontrado = acabadosDisponibles.find(
          (a) => a.nombre.toLowerCase() === v.toLowerCase()
        )
        if (encontrado) {
          return {
            id: encontrado.id,
            nombre: encontrado.nombre,
            familia: encontrado.familia,
            colorHex: encontrado.colorHex,
            imagenTexturaUrl: encontrado.imagenTexturaUrl,
            textura: encontrado.textura,
          }
        }
        return { nombre: v }
      }
      return v
    })
  }, [value, acabadosDisponibles])

  // Familias únicas para filtro
  const familias = useMemo(() => {
    const setFams = new Set<string>()
    acabadosDisponibles.forEach((a) => {
      if (a.familia) setFams.add(a.familia)
    })
    return Array.from(setFams)
  }, [acabadosDisponibles])

  // Acabados filtrados
  const acabadosFiltrados = useMemo(() => {
    return acabadosDisponibles.filter((a) => {
      const coincideFam = familiaSeleccionada === 'todas' || a.familia === familiaSeleccionada
      const coincideTxt =
        !filtroTexto.trim() ||
        a.nombre.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        (a.color && a.color.toLowerCase().includes(filtroTexto.toLowerCase()))
      return coincideFam && coincideTxt
    })
  }, [acabadosDisponibles, familiaSeleccionada, filtroTexto])

  const toggleAcabado = (acabado: CatalogoAcabado) => {
    const yaExiste = seleccionados.some(
      (s) => s.id === acabado.id || s.nombre.toLowerCase() === acabado.nombre.toLowerCase()
    )
    if (yaExiste) {
      onChange(
        seleccionados.filter(
          (s) => s.id !== acabado.id && s.nombre.toLowerCase() !== acabado.nombre.toLowerCase()
        )
      )
    } else {
      onChange([
        ...seleccionados,
        {
          id: acabado.id,
          nombre: acabado.nombre,
          familia: acabado.familia,
          colorHex: acabado.colorHex,
          imagenTexturaUrl: acabado.imagenTexturaUrl,
          textura: acabado.textura,
        },
      ])
    }
  }

  const quitar = (nombre: string) => {
    onChange(seleccionados.filter((s) => s.nombre !== nombre))
  }

  const agregarCustom = () => {
    const limpio = customTexto.trim()
    if (!limpio) return
    if (seleccionados.some((s) => s.nombre.toLowerCase() === limpio.toLowerCase())) return
    onChange([...seleccionados, { nombre: limpio }])
    setCustomTexto('')
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[11px] font-medium text-text-muted">{label}</span>

      {/* Chips seleccionados */}
      <div className="flex flex-wrap items-center gap-1.5 min-h-[34px] rounded border border-border-subtle bg-bg-paper p-1.5">
        {seleccionados.map((item) => (
          <span
            key={item.nombre}
            className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-raised px-2.5 py-0.5 text-xs text-text-heading shadow-2xs"
          >
            {item.imagenTexturaUrl ? (
              <span
                className="h-3.5 w-3.5 rounded-full border border-black/20 bg-cover bg-center shrink-0"
                style={{ backgroundImage: `url(${item.imagenTexturaUrl})` }}
                title={item.nombre}
              />
            ) : item.colorHex ? (
              <span
                className="h-3.5 w-3.5 rounded-full border border-black/20 shrink-0"
                style={{ backgroundColor: item.colorHex }}
                title={item.colorHex}
              />
            ) : (
              <span className="h-3 w-3 rounded-full bg-stone-300 shrink-0" />
            )}
            <span className="font-medium text-[11px]">{item.nombre}</span>
            {item.familia && (
              <span className="text-[9px] text-text-muted uppercase tracking-wider">
                ({item.familia})
              </span>
            )}
            <button
              type="button"
              onClick={() => quitar(item.nombre)}
              className="ml-0.5 text-text-muted hover:text-red-500 font-bold text-xs leading-none"
              aria-label={`Quitar ${item.nombre}`}
            >
              ×
            </button>
          </span>
        ))}

        {seleccionados.length === 0 && (
          <span className="text-xs text-text-muted italic px-1">
            Ningún acabado seleccionado aún
          </span>
        )}

        <button
          type="button"
          onClick={() => setAbierto(!abierto)}
          className="ml-auto rounded px-2 py-0.5 text-xs font-semibold text-gold-600 hover:bg-gold-50 border border-gold-300 transition-colors"
        >
          {abierto ? '▲ Cerrar Catálogo' : '+ Elegir Acabados'}
        </button>
      </div>

      {/* Desplegable interactivo de selección de catálogo */}
      {abierto && (
        <div className="rounded border border-gold-400/50 bg-bg-raised p-3 shadow-md space-y-3 mt-1">
          {/* Filtros de búsqueda */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Buscar tono, madera o código..."
              className="flex-1 rounded border border-border-subtle bg-bg-paper px-2.5 py-1 text-xs text-text-heading focus:border-brand focus:outline-none"
            />
            {familias.length > 0 && (
              <select
                value={familiaSeleccionada}
                onChange={(e) => setFamiliaSeleccionada(e.target.value)}
                className="rounded border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-brand focus:outline-none"
              >
                <option value="todas">Todas las familias</option>
                {familias.map((fam) => (
                  <option key={fam} value={fam}>
                    {fam}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Grilla visual de muestras */}
          <div className="max-h-48 overflow-y-auto grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 p-1">
            {acabadosFiltrados.map((acabado) => {
              const estaSeleccionado = seleccionados.some(
                (s) => s.id === acabado.id || s.nombre.toLowerCase() === acabado.nombre.toLowerCase()
              )
              return (
                <button
                  key={acabado.id}
                  type="button"
                  onClick={() => toggleAcabado(acabado)}
                  className={`flex items-center gap-2 rounded border p-1.5 text-left text-xs transition-all ${
                    estaSeleccionado
                      ? 'border-gold-500 bg-gold-50/50 ring-1 ring-gold-400'
                      : 'border-border-subtle bg-bg-paper hover:border-gold-300'
                  }`}
                >
                  {acabado.imagenTexturaUrl ? (
                    <div
                      className="h-7 w-7 shrink-0 rounded border border-border-subtle bg-cover bg-center"
                      style={{ backgroundImage: `url(${acabado.imagenTexturaUrl})` }}
                    />
                  ) : acabado.colorHex ? (
                    <div
                      className="h-7 w-7 shrink-0 rounded border border-border-subtle"
                      style={{ backgroundColor: acabado.colorHex }}
                    />
                  ) : (
                    <div className="h-7 w-7 shrink-0 rounded bg-stone-200" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text-heading truncate text-[11px]">
                      {acabado.nombre}
                    </p>
                    {acabado.familia && (
                      <p className="text-[10px] text-text-muted truncate">{acabado.familia}</p>
                    )}
                  </div>
                </button>
              )
            })}

            {acabadosFiltrados.length === 0 && (
              <p className="col-span-full py-4 text-center text-xs text-text-muted italic">
                No se encontraron acabados con ese filtro.
              </p>
            )}
          </div>

          {/* Entrada de color libre / personalizado */}
          <div className="flex items-center gap-2 pt-2 border-t border-border-subtle text-xs">
            <span className="text-text-muted shrink-0 text-[11px]">Otro tono no catalogado:</span>
            <input
              type="text"
              value={customTexto}
              onChange={(e) => setCustomTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  agregarCustom()
                }
              }}
              placeholder="Ej: Poliuretano Gris Nube Mate"
              className="flex-1 rounded border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-brand focus:outline-none"
            />
            <button
              type="button"
              onClick={agregarCustom}
              className="rounded border border-border-subtle px-2.5 py-1 font-medium text-text-muted hover:bg-bg-alt text-xs"
            >
              + Agregar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
