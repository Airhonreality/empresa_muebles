'use client'

import { useCallback, useState } from 'react'
import { useDataStore } from '@/lib/data'
import { ImagePicker } from '@/components/veta/image-picker'
import { AcabadoAdminRow } from '@/components/veta/acabado-admin-row'

interface Borrador {
  /** Solo de uso local (key de React) — nunca se persiste ni se envía al store. */
  localId: string
  imagenTexturaUrl: string | null
}

/** Pantalla de administración de acabados (t-174, 2026-09-30): alta en lote (soltar N imágenes
 *  genera N filas editables prerellenadas) + edición/eliminación de los ya existentes. Lista de
 *  filas concreta, sin grid genérico — decisión explícita de Javier (ver plan_t-174.md). */
export default function AcabadosAdminPage() {
  const store = useDataStore()
  const acabados = store.catalogoAcabados.listar()
  const [borradores, setBorradores] = useState<Borrador[]>([])

  const handleNuevasImagenes = useCallback((urls: string[]) => {
    setBorradores((prev) => [
      ...prev,
      ...urls.map((url) => ({ localId: crypto.randomUUID(), imagenTexturaUrl: url })),
    ])
  }, [])

  const quitarBorrador = useCallback((localId: string) => {
    setBorradores((prev) => prev.filter((b) => b.localId !== localId))
  }, [])

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-text-heading">Catálogo de acabados</h1>
        <p className="mt-1 text-sm text-text-muted">
          Texturas y colores de melamina/mesones, tipados con nombre e imagen — se asocian a uno o
          varios espacios desde el cotizador, cada uno con su propio texto de destino.
        </p>
      </header>

      <div className="mb-6 rounded-md border border-dashed border-border-default p-4">
        <ImagePicker
          label="Soltar o seleccionar imágenes de acabados nuevos"
          value={[]}
          onChange={handleNuevasImagenes}
          multiple
          r2Prefix="catalogo/acabados/"
        />
      </div>

      <div className="space-y-3">
        {borradores.map((b) => (
          <AcabadoAdminRow
            key={b.localId}
            imagenInicial={b.imagenTexturaUrl}
            onGuardado={() => quitarBorrador(b.localId)}
            onDescartar={() => quitarBorrador(b.localId)}
          />
        ))}
        {acabados.map((a) => (
          <AcabadoAdminRow key={a.id} acabado={a} />
        ))}
        {borradores.length === 0 && acabados.length === 0 && (
          <p className="text-sm text-text-muted">Todavía no hay acabados en el catálogo. Soltá una imagen arriba para empezar.</p>
        )}
      </div>
    </div>
  )
}
