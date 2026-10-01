'use client'

import { useState, useMemo } from 'react'
import type { CatalogoAcabado } from '@/lib/data'
import { ImagePicker } from '@/components/veta/image-picker'

export interface AcabadoItem {
  id: string
  nombre: string
  familia?: string | null
  colorHex?: string | null
  imagenTexturaUrl?: string | null
  textura?: string | null
}

/** t-175 (2026-09-30): un acabado del espacio, con su propio texto libre de destino
 *  ("fachadas módulo X", "mesón de isla"). Reemplaza al array plano `(AcabadoItem|string)[]`
 *  que antes se guardaba directo en `espacio_variantes.colores` (jsonb) — ahora persiste contra
 *  la tabla relacional `espacio_variante_acabados` (t-173). */
export interface AcabadoSeleccionado {
  acabado: AcabadoItem
  descripcionUso: string
}

interface AcabadoPickerProps {
  label?: string
  acabadosDisponibles: CatalogoAcabado[]
  value: AcabadoSeleccionado[]
  onChange: (value: AcabadoSeleccionado[]) => void
  /** t-175: alta rápida de un acabado nuevo sin salir de la pantalla ("+ Nuevo acabado").
   *  Si se omite, el botón de alta no aparece (picker de solo-selección). */
  onCrearAcabado?: (data: { nombre: string; marca?: string | null; imagenTexturaUrl?: string | null }) => Promise<CatalogoAcabado>
  className?: string
}

function aItem(a: CatalogoAcabado): AcabadoItem {
  return { id: a.id, nombre: a.nombre, familia: a.familia, colorHex: a.colorHex, imagenTexturaUrl: a.imagenTexturaUrl, textura: a.textura }
}

export function AcabadoPicker({
  label = 'Acabados y Colores del Espacio',
  acabadosDisponibles,
  value,
  onChange,
  onCrearAcabado,
  className = '',
}: AcabadoPickerProps) {
  const [abierto, setAbierto] = useState(false)
  const [filtroTexto, setFiltroTexto] = useState('')
  const [familiaSeleccionada, setFamiliaSeleccionada] = useState<string>('todas')
  const [creando, setCreando] = useState(false)
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [marcaNueva, setMarcaNueva] = useState('')
  const [imagenNueva, setImagenNueva] = useState<string | null>(null)
  const [guardandoNuevo, setGuardandoNuevo] = useState(false)
  const [errorNuevo, setErrorNuevo] = useState<string | null>(null)

  const familias = useMemo(() => {
    const set = new Set<string>()
    acabadosDisponibles.forEach((a) => { if (a.familia) set.add(a.familia) })
    return Array.from(set)
  }, [acabadosDisponibles])

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

  const estaSeleccionado = (id: string) => value.some((v) => v.acabado.id === id)

  const toggleAcabado = (acabado: CatalogoAcabado) => {
    if (estaSeleccionado(acabado.id)) {
      onChange(value.filter((v) => v.acabado.id !== acabado.id))
    } else {
      onChange([...value, { acabado: aItem(acabado), descripcionUso: '' }])
    }
  }

  const quitar = (id: string) => onChange(value.filter((v) => v.acabado.id !== id))

  const actualizarDestino = (id: string, descripcionUso: string) =>
    onChange(value.map((v) => (v.acabado.id === id ? { ...v, descripcionUso } : v)))

  const handleCrearNuevo = async () => {
    const nombre = nombreNuevo.trim()
    if (!nombre || !onCrearAcabado) return
    setGuardandoNuevo(true)
    setErrorNuevo(null)
    try {
      const creado = await onCrearAcabado({
        nombre,
        marca: marcaNueva.trim() || null,
        imagenTexturaUrl: imagenNueva,
      })
      onChange([...value, { acabado: aItem(creado), descripcionUso: '' }])
      setNombreNuevo('')
      setMarcaNueva('')
      setImagenNueva(null)
      setCreando(false)
    } catch (e) {
      setErrorNuevo(e instanceof Error ? e.message : 'No se pudo crear el acabado.')
    } finally {
      setGuardandoNuevo(false)
    }
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[11px] font-medium text-text-muted">{label}</span>

      {/* Seleccionados — uno por fila, cada uno con su texto libre de destino */}
      <div className="flex flex-col gap-1.5 rounded border border-border-subtle bg-bg-paper p-1.5">
        {value.length === 0 && (
          <span className="text-xs text-text-muted italic px-1">
            Ningún acabado seleccionado aún
          </span>
        )}
        {value.map((sel) => (
          <div
            key={sel.acabado.id}
            className="flex items-center gap-2 rounded border border-border-subtle bg-bg-raised px-2 py-1"
          >
            {sel.acabado.imagenTexturaUrl ? (
              <span
                className="h-5 w-5 shrink-0 rounded-full border border-black/20 bg-cover bg-center"
                style={{ backgroundImage: `url(${sel.acabado.imagenTexturaUrl})` }}
                title={sel.acabado.nombre}
              />
            ) : sel.acabado.colorHex ? (
              <span
                className="h-5 w-5 shrink-0 rounded-full border border-black/20"
                style={{ backgroundColor: sel.acabado.colorHex }}
                title={sel.acabado.colorHex}
              />
            ) : (
              <span className="h-4 w-4 shrink-0 rounded-full bg-stone-300" />
            )}
            <span
              className="shrink-0 max-w-[110px] truncate text-xs font-medium text-text-heading"
              title={sel.acabado.nombre}
            >
              {sel.acabado.nombre}
            </span>
            <input
              type="text"
              value={sel.descripcionUso}
              onChange={(e) => actualizarDestino(sel.acabado.id, e.target.value)}
              placeholder="¿Para qué parte? Ej: fachadas módulo X, mesón de isla"
              className="min-w-0 flex-1 rounded border border-border-subtle bg-bg-paper px-2 py-0.5 text-xs text-text-heading focus:border-brand focus:outline-none"
            />
            <button
              type="button"
              onClick={() => quitar(sel.acabado.id)}
              className="shrink-0 text-text-muted hover:text-red-500 font-bold text-xs leading-none"
              aria-label={`Quitar ${sel.acabado.nombre}`}
            >
              ×
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setAbierto(!abierto)}
          className="self-start rounded px-2 py-0.5 text-xs font-semibold text-gold-600 hover:bg-gold-50 border border-gold-300 transition-colors"
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
              const seleccionado = estaSeleccionado(acabado.id)
              return (
                <button
                  key={acabado.id}
                  type="button"
                  onClick={() => toggleAcabado(acabado)}
                  className={`flex items-center gap-2 rounded border p-1.5 text-left text-xs transition-all ${
                    seleccionado
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

          {/* Alta rápida de un acabado nuevo, sin salir del cotizador (t-175) */}
          {onCrearAcabado && (
            <div className="pt-2 border-t border-border-subtle">
              {!creando ? (
                <button
                  type="button"
                  onClick={() => setCreando(true)}
                  className="text-xs font-semibold text-gold-600 hover:underline"
                >
                  + Nuevo acabado
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={nombreNuevo}
                      onChange={(e) => setNombreNuevo(e.target.value)}
                      placeholder="Nombre (ej: Blanco ártico)"
                      className="flex-1 min-w-[140px] rounded border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-brand focus:outline-none"
                    />
                    <input
                      type="text"
                      value={marcaNueva}
                      onChange={(e) => setMarcaNueva(e.target.value)}
                      placeholder="Marca (opcional)"
                      className="flex-1 min-w-[140px] rounded border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-brand focus:outline-none"
                    />
                  </div>
                  <ImagePicker
                    label="Imagen (opcional)"
                    value={imagenNueva ? [imagenNueva] : []}
                    onChange={(v) => setImagenNueva(v[0] ?? null)}
                    multiple={false}
                    r2Prefix="catalogo/acabados/"
                  />
                  {errorNuevo && (
                    <p className="rounded border border-red-200 bg-red-50 p-1.5 text-xs text-red-600" role="alert">
                      {errorNuevo}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={guardandoNuevo || !nombreNuevo.trim()}
                      onClick={handleCrearNuevo}
                      className="rounded bg-gold-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-gold-600 disabled:opacity-50 transition-colors"
                    >
                      {guardandoNuevo ? 'Creando...' : 'Crear y agregar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCreando(false); setErrorNuevo(null) }}
                      className="rounded border border-border-subtle px-2.5 py-1 text-xs text-text-muted hover:bg-bg-alt"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
