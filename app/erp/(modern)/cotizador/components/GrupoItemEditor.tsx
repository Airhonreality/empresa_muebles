'use client'

import type { GrupoItemHidratado, GrupoItemCalculado } from '@/lib/data/contracts'
import { calcularGrupoConSubgrupos, type ParametrosManoObra } from '@/lib/data/queries/grupo-calculado'
import { duplicarGrupoAction, actualizarGrupoItemAction, eliminarGrupoItemAction } from '@/lib/data/actions/core'
import { useState } from 'react'

interface Props {
  grupo: GrupoItemHidratado
  parametros: ParametrosManoObra
  onUpdate: (cambios: Partial<GrupoItemHidratado>) => Promise<void>
  onConvert: () => void
  onRefresh?: () => void
}

export function GrupoItemEditor({ grupo, parametros, onUpdate, onConvert, onRefresh }: Props) {
  const [expandido, setExpandido] = useState(false)
  const [editandoNombre, setEditandoNombre] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState(grupo.nombre)
  const [mostrarDetalles, setMostrarDetalles] = useState(false)
  const [cargando, setCargando] = useState(false)
  const calculado = calcularGrupoConSubgrupos(grupo, parametros)

  const handleGuardarNombre = async () => {
    if (!nuevoNombre.trim()) {
      setNuevoNombre(grupo.nombre)
      setEditandoNombre(false)
      return
    }
    setCargando(true)
    try {
      await onUpdate({ nombre: nuevoNombre })
      setEditandoNombre(false)
    } finally {
      setCargando(false)
    }
  }

  const handleClonar = async () => {
    if (!confirm('¿Clonar este grupo y sus ítems?')) return
    setCargando(true)
    try {
      const clonado = await duplicarGrupoAction(grupo.id)
      if (clonado) {
        onRefresh?.()
      }
    } catch (error) {
      console.error('Error al clonar grupo:', error)
      alert('Error al clonar el grupo')
    } finally {
      setCargando(false)
    }
  }

  const handlePublicar = async () => {
    if (grupo.estado === 'permanente') return
    setCargando(true)
    try {
      await onUpdate({ estado: 'permanente' })
    } catch (error) {
      console.error('Error al publicar grupo:', error)
      alert('Error al publicar el grupo')
    } finally {
      setCargando(false)
    }
  }

  const handleEliminar = async () => {
    if (!confirm('¿Eliminar grupo? Sus ítems se desagruparán.')) return
    setCargando(true)
    try {
      const resultado = await eliminarGrupoItemAction(grupo.id)
      if (resultado) {
        onRefresh?.()
      }
    } catch (error) {
      console.error('Error al eliminar grupo:', error)
      alert('Error al eliminar el grupo')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      {/* Header con Toolbar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          {/* Nombre editable o display */}
          <div className="flex-1">
            {editandoNombre ? (
              <input
                type="text"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                onBlur={handleGuardarNombre}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGuardarNombre()
                  if (e.key === 'Escape') {
                    setNuevoNombre(grupo.nombre)
                    setEditandoNombre(false)
                  }
                }}
                disabled={cargando}
                autoFocus
                className="border rounded px-2 py-1 font-bold text-lg w-full"
              />
            ) : (
              <h3 className="font-bold text-lg cursor-pointer hover:text-blue-600" onClick={() => setEditandoNombre(true)}>
                {grupo.nombre}
              </h3>
            )}
            <p className="text-sm text-gray-600">
              {grupo.items.length} ítems · ${calculado.precioPublicoGrupo} · {grupo.estado === 'permanente' ? '✓ Publicado' : 'Temporal'}
            </p>
          </div>

          {/* Toolbar - 6 botones */}
          <div className="flex gap-2 ml-4">
            <button
              onClick={handleClonar}
              disabled={cargando}
              title="Clonar grupo"
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clonar
            </button>
            <button
              onClick={() => setEditandoNombre(true)}
              disabled={cargando || editandoNombre}
              title="Editar nombre"
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Editar
            </button>
            <button
              onClick={handlePublicar}
              disabled={cargando || grupo.estado === 'permanente' || grupo.productoCatalogoId !== null}
              title={grupo.productoCatalogoId ? 'No puede publicar un grupo convertido' : grupo.estado === 'permanente' ? 'Ya está publicado' : 'Publicar grupo'}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Publicar
            </button>
            <button
              onClick={() => setMostrarDetalles(!mostrarDetalles)}
              disabled={cargando}
              title="Ver detalles"
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Detalles
            </button>
            <button
              onClick={(e) => {
                e.preventDefault()
                onConvert()
              }}
              disabled={cargando}
              title="Convertir a producto"
              className="px-3 py-1 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Convertir
            </button>
            <button
              onClick={handleEliminar}
              disabled={cargando}
              title="Eliminar grupo"
              className="px-3 py-1 text-sm bg-red-100 text-red-600 hover:bg-red-200 border border-red-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Eliminar
            </button>
          </div>
        </div>

        {/* Panel de Detalles (colapsable) */}
        {mostrarDetalles && <TablaDetalles grupo={calculado} />}
      </div>

      {/* Título colapsable para el contenido */}
      <div
        className="flex items-center justify-between cursor-pointer border-t pt-3 hover:bg-gray-50"
        onClick={() => setExpandido(!expandido)}
      >
        <span className="text-sm text-gray-600 font-semibold">
          {expandido ? '▼' : '▶'} {expandido ? 'Ocultar' : 'Mostrar'} detalles técnicos y contenido
        </span>
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
                <GrupoItemEditor key={sub.id} grupo={sub} parametros={parametros} onUpdate={onUpdate} onConvert={onConvert} onRefresh={onRefresh} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Componente de tabla de detalles técnicos del grupo.
 * Muestra parámetros, jornadas, mano de obra y cálculos de precio.
 */
function TablaDetalles({ grupo }: { grupo: GrupoItemCalculado }) {
  const ivaMonto = (
    parseFloat(grupo.sumaItemsConIVA || '0') - parseFloat(grupo.sumaItemsNeto || '0')
  ).toFixed(2)

  return (
    <div className="bg-gray-50 rounded p-3 mb-4 text-sm border border-gray-200">
      <table className="w-full text-left">
        <tbody>
          <tr className="border-b">
            <td className="font-semibold py-2 pr-4 text-gray-700 w-1/2">Nombre</td>
            <td className="py-2">{grupo.nombre}</td>
          </tr>
          <tr className="border-b">
            <td className="font-semibold py-2 pr-4 text-gray-700">Estado</td>
            <td className="py-2">
              <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                grupo.estado === 'permanente'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {grupo.estado === 'permanente' ? '✓ Permanente' : 'Temporal'}
              </span>
            </td>
          </tr>
          <tr className="border-b">
            <td className="font-semibold py-2 pr-4 text-gray-700">Ítems</td>
            <td className="py-2">{grupo.items.length}</td>
          </tr>
          <tr className="border-b">
            <td className="font-semibold py-2 pr-4 text-gray-700">Jornadas Desarrollo</td>
            <td className="py-2">{grupo.jornadasDesarrolloTecnico} h</td>
          </tr>
          <tr className="border-b">
            <td className="font-semibold py-2 pr-4 text-gray-700">Jornadas Ensamblaje</td>
            <td className="py-2">{grupo.jornadasEnsamblajeTaller} h</td>
          </tr>
          <tr className="border-b">
            <td className="font-semibold py-2 pr-4 text-gray-700">Jornadas Instalación</td>
            <td className="py-2">{grupo.jornadasInstalacionObra} h</td>
          </tr>
          <tr className="border-b">
            <td className="font-semibold py-2 pr-4 text-gray-700">Mano de Obra</td>
            <td className="py-2">${grupo.valorManoObraEstimada}</td>
          </tr>
          <tr className="border-b">
            <td className="font-semibold py-2 pr-4 text-gray-700">Subtotal Ítems (Neto)</td>
            <td className="py-2">${grupo.sumaItemsNeto}</td>
          </tr>
          <tr className="border-b">
            <td className="font-semibold py-2 pr-4 text-gray-700">IVA</td>
            <td className="py-2">${ivaMonto}</td>
          </tr>
          <tr className="bg-blue-50">
            <td className="font-bold py-2 pr-4 text-gray-900">Total Grupo</td>
            <td className="py-2 font-bold text-blue-700">${grupo.precioPublicoGrupo}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
