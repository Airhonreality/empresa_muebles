'use client'

import { useState } from 'react'
import { useDataStore } from '@/lib/data'
import type { CatalogoAcabado } from '@/lib/data'
import { Button } from '@/components/veta/button'
import { ImagePicker } from '@/components/veta/image-picker'
import { EntityFields } from '@/components/veta/entity-fields'
import { acabadoFormFields, type AcabadoFormValues } from '@/lib/forms/acabado-form-spec'
import { usePendingGuard } from '@/lib/hooks/usePendingGuard'

interface AcabadoAdminRowProps {
  /** Fila ya persistida en el catálogo — se edita/elimina en sitio. */
  acabado?: CatalogoAcabado
  /** Fila nueva sin guardar (t-174: alta en lote) — imagen ya subida a R2, resto por completar. */
  imagenInicial?: string | null
  /** Solo aplica a filas nuevas: se dispara tras guardar con éxito, para que el padre la saque de la lista de borradores. */
  onGuardado?: () => void
  /** Solo aplica a filas nuevas: descarta el borrador sin persistir nada. */
  onDescartar?: () => void
}

function valoresIniciales(acabado?: CatalogoAcabado): AcabadoFormValues {
  return {
    nombre: acabado?.nombre ?? '',
    marca: acabado?.marca ?? '',
    familia: acabado?.familia ?? '',
    color: acabado?.color ?? '',
    colorHex: acabado?.colorHex ?? '',
    textura: acabado?.textura ?? '',
  }
}

/** Fila editable de la pantalla de administración de acabados (t-174, 2026-09-30). Guarda de
 *  forma independiente del resto de filas (usePendingGuard propio por instancia) — ninguna fila
 *  bloquea a las demás, mismo principio de paralelismo que t-171. */
export function AcabadoAdminRow({ acabado, imagenInicial = null, onGuardado, onDescartar }: AcabadoAdminRowProps) {
  const store = useDataStore()
  const [valores, setValores] = useState<AcabadoFormValues>(() => valoresIniciales(acabado))
  const [imagen, setImagen] = useState<string | null>(acabado?.imagenTexturaUrl ?? imagenInicial)
  const [error, setError] = useState<string | null>(null)
  const { guard, isPending } = usePendingGuard()

  const onChangeCampo = (key: keyof AcabadoFormValues, value: string) => {
    setValores((v) => ({ ...v, [key]: value }))
  }

  const handleGuardar = () => guard(async () => {
    setError(null)
    const nombre = valores.nombre.trim()
    if (!nombre) {
      setError('El nombre es obligatorio.')
      return
    }
    const data = {
      nombre,
      marca: valores.marca.trim() || null,
      familia: valores.familia.trim() || null,
      color: valores.color.trim() || null,
      colorHex: valores.colorHex.trim() || null,
      textura: valores.textura.trim() || null,
      imagenTexturaUrl: imagen,
    }
    try {
      if (acabado) {
        await store.catalogoAcabados.actualizar(acabado.id, data)
      } else {
        await store.catalogoAcabados.crear(data)
        onGuardado?.()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el acabado.')
    }
  })

  const handleEliminar = () => guard(async () => {
    if (!acabado) return
    setError(null)
    const ok = await store.catalogoAcabados.eliminar(acabado.id)
    if (!ok) {
      setError('No se puede eliminar: este acabado está en uso (producto, muestra o cotización).')
    }
  })

  return (
    <div className="flex gap-4 rounded-md border border-border-subtle bg-bg-raised p-4">
      <div className="w-28 shrink-0">
        <ImagePicker
          label="Imagen"
          value={imagen ? [imagen] : []}
          onChange={(v) => setImagen(v[0] ?? null)}
          multiple={false}
          r2Prefix="catalogo/acabados/"
          hideGrid
        />
        {imagen && (
          // eslint-disable-next-line @next/next/no-img-element -- URL dinámica de R2, sin dominio fijo para next/image
          <img
            src={imagen}
            alt=""
            className="mt-2 h-20 w-full rounded border border-border-subtle object-cover"
          />
        )}
      </div>

      <div className="flex-1 space-y-3">
        <EntityFields
          fields={acabadoFormFields}
          values={valores}
          onChange={onChangeCampo}
          className="grid grid-cols-2 gap-3"
        />

        {error && (
          <p className="rounded border border-red-200 bg-red-50 p-1.5 text-xs text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="button" size="sm" loading={isPending} onClick={handleGuardar}>
            {acabado ? 'Guardar cambios' : 'Guardar acabado'}
          </Button>
          {acabado ? (
            <Button type="button" variant="destructive" size="sm" loading={isPending} onClick={handleEliminar}>
              Eliminar
            </Button>
          ) : (
            <Button type="button" variant="ghost" size="sm" onClick={onDescartar} disabled={isPending}>
              Descartar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
