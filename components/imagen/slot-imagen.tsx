'use client'
// Composición de las capas del módulo de imágenes (t-200) para UN slot.
// Frontera de datos: recibe y devuelve `string[]` (forma persistida actual). La forma con
// atributos base y valores llega en P4, con checkpoint propio (D2).
import { useCallback, useMemo, useRef, useState } from 'react'
import type { ImagenItem, SlotImagen } from '@/lib/imagen/tipos'
import { aUrls, insertar, moverRelativo, quitar } from '@/lib/imagen/operaciones'
import { GalleryOverlay } from '@/components/veta/gallery-lightbox'
import { Cargador, type EntradaImagen } from './cargador'
import { Coleccion, type SubidaEnCurso } from './coleccion'
import { Panel, type SeleccionInfo } from './panel'
import { asegurarUrlR2, crearSubidaR2 } from './adaptador-r2'

export interface SlotImagenProps {
  slot: Pick<SlotImagen, 'id' | 'etiqueta' | 'multiple' | 'max'>
  value: string[]
  onChange: (urls: string[]) => void
  /** Prefijo de almacenamiento en R2 para este slot. */
  r2Prefix: string
  /** Subidas simultáneas máximas. */
  concurrencia?: number
}

const generarId = () => crypto.randomUUID()

export function SlotImagen({ slot, value, onChange, r2Prefix, concurrencia = 2 }: SlotImagenProps) {
  // Ids estables por URL: sin esto, cada render generaría ids nuevos y la selección se perdería.
  const idsPorUrl = useRef(new Map<string, string>())
  const items: ImagenItem[] = useMemo(
    () =>
      value.map((url) => {
        let id = idsPorUrl.current.get(url)
        if (!id) { id = generarId(); idsPorUrl.current.set(url, id) }
        return { clienteId: id, url, base: {}, valores: {} }
      }),
    [value],
  )

  const valorRef = useRef(items)
  valorRef.current = items

  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null)
  const [pendientes, setPendientes] = useState<SubidaEnCurso[]>([])
  const [error, setError] = useState<string | null>(null)
  const [ampliarIdx, setAmpliarIdx] = useState<number | null>(null)

  const subir = useMemo(() => crearSubidaR2(r2Prefix), [r2Prefix])
  const lleno = slot.max !== undefined && items.length + pendientes.length >= slot.max
  const seleccionIdx = items.findIndex((it) => it.clienteId === seleccionadoId)

  /** Aplica una operación pura sobre la colección más reciente y persiste solo URLs. */
  const aplicar = useCallback(
    (nuevaColeccion: ImagenItem[]) => {
      valorRef.current = nuevaColeccion
      onChange(aUrls(nuevaColeccion))
    },
    [onChange],
  )

  /** Procesa entradas: archivos se suben a R2, URLs externas se clonan a R2. Concurrencia limitada. */
  const ingresar = useCallback(
    async (entradas: EntradaImagen[]) => {
      setError(null)
      const trabajos = entradas.map((entrada) => async () => {
        const id = generarId()
        const nombre = entrada.tipo === 'archivo' ? entrada.archivo.name : entrada.url
        const objectUrl = entrada.tipo === 'archivo' ? URL.createObjectURL(entrada.archivo) : ''
        if (entrada.tipo === 'archivo') setPendientes((p) => [...p, { id, objectUrl, nombre }])
        try {
          const url = entrada.tipo === 'archivo'
            ? await subir(entrada.archivo)
            : await asegurarUrlR2(entrada.url, r2Prefix)
          if (slot.multiple) {
            aplicar(insertar(valorRef.current, [url], slot, generarId))
          } else {
            aplicar(insertar([], [url], slot, generarId))
          }
        } catch (err) {
          setError(`No se pudo subir ${nombre}: ${err instanceof Error ? err.message : 'fallo de conexión'}`)
        } finally {
          if (entrada.tipo === 'archivo') {
            setPendientes((p) => p.filter((x) => x.id !== id))
            URL.revokeObjectURL(objectUrl)
          }
        }
      })
      await ejecutarLimitado(trabajos, concurrencia)
    },
    [aplicar, concurrencia, r2Prefix, slot, subir],
  )

  const seleccion: SeleccionInfo | null =
    seleccionIdx >= 0
      ? {
          url: items[seleccionIdx].url,
          posicion: seleccionIdx + 1,
          total: items.length,
          primera: seleccionIdx === 0,
          ultima: seleccionIdx === items.length - 1,
        }
      : null

  return (
    <section className="flex flex-col gap-3 rounded-sm border border-border-subtle bg-bg-paper p-3">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="flex min-w-0 flex-col gap-3">
          <Cargador
            onIngresar={ingresar}
            activo={!lleno || !slot.multiple}
            ayuda={slot.multiple ? undefined : 'Arrastrá una foto aquí, pegala (Ctrl+V) o elegí un archivo. Reemplaza la actual.'}
          />
          {error && (
            <p role="alert" className="rounded-sm border border-red-200 bg-red-50 p-2 text-xs text-red-700">
              {error}
            </p>
          )}
          <Coleccion
            etiqueta={slot.etiqueta}
            items={items}
            pendientes={pendientes}
            seleccionadoId={seleccionadoId}
            onSeleccionar={(id) => setSeleccionadoId((actual) => (actual === id ? null : id))}
            onMoverRelativo={(id, delta) => aplicar(moverRelativo(items, id, delta))}
            onQuitar={(id) => {
              aplicar(quitar(items, id))
              setSeleccionadoId((actual) => (actual === id ? null : actual))
            }}
            onAmpliar={(id) => setAmpliarIdx(items.findIndex((it) => it.clienteId === id))}
          />
        </div>

        <Panel
          etiqueta={slot.etiqueta}
          cantidad={items.length}
          max={slot.max}
          seleccion={seleccion}
          onAmpliar={() => seleccion && setAmpliarIdx(seleccionIdx)}
          onMoverAntes={() => seleccionadoId && aplicar(moverRelativo(items, seleccionadoId, -1))}
          onMoverDespues={() => seleccionadoId && aplicar(moverRelativo(items, seleccionadoId, 1))}
          onQuitar={() => {
            if (!seleccionadoId) return
            aplicar(quitar(items, seleccionadoId))
            setSeleccionadoId(null)
          }}
          onQuitarTodas={() => {
            aplicar([])
            setSeleccionadoId(null)
          }}
        />
      </div>

      {ampliarIdx !== null && ampliarIdx >= 0 && (
        <GalleryOverlay
          imagenes={items.map((it, i) => ({ url: it.url, alt: `${slot.etiqueta} ${i + 1}`, id: it.clienteId }))}
          initialIndex={ampliarIdx}
          onClose={() => setAmpliarIdx(null)}
        />
      )}
    </section>
  )
}

/** Ejecuta funciones async con como máximo `limite` en vuelo a la vez. */
async function ejecutarLimitado(trabajos: Array<() => Promise<void>>, limite: number): Promise<void> {
  let siguiente = 0
  const worker = async () => {
    while (siguiente < trabajos.length) {
      const trabajo = trabajos[siguiente++]
      await trabajo()
    }
  }
  await Promise.all(Array.from({ length: Math.min(limite, trabajos.length) }, worker))
}
