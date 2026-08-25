'use client'
// Administración de las tarjetas del slider "Validación Técnica" de cada landing de espacio
// (2026-08-25, reemplaza el objeto estático que vivía en lib/data/espacios-atributos.ts). Mismo
// patrón de pantalla que /erp/portafolio/galeria: alta por categoría + listado agrupado. A
// diferencia de la galería, acá sí se edita contenido existente (título/cuerpo/badge/imagen)
// porque cada tarjeta es una pieza de copy propia, no solo una imagen suelta. Sin campo de
// "folio": el slider público agrupa las tarjetas visibles de a 4 según el orden.
import { useMemo, useState } from 'react'
import { Badge } from '@/components/veta/badge'
import { Button, LinkButton } from '@/components/veta/button'
import { ImagePicker } from '@/components/veta/image-picker'
import { useDataStore, type AtributoTecnico } from '@/lib/data'
import { TIPOS_ESPACIO, labelTipoEspacio } from '@/lib/catalogos/tipos-espacio'
import { usePendingGuard } from '@/lib/hooks/usePendingGuard'

function FilaAtributoTecnico({ atributo }: { atributo: AtributoTecnico }) {
  const store = useDataStore()
  const [editando, setEditando] = useState(false)
  const [titulo, setTitulo] = useState(atributo.titulo)
  const [cuerpo, setCuerpo] = useState(atributo.cuerpo)
  const [badge, setBadge] = useState(atributo.badge ?? '')
  const [imagenUrl, setImagenUrl] = useState(atributo.imagenUrl ?? '')
  const [ordenInput, setOrdenInput] = useState(String(atributo.orden))
  const { guard: guardGuardar, isPending: guardando } = usePendingGuard()

  const commitOrden = () => {
    const valor = parseInt(ordenInput, 10)
    if (!isNaN(valor) && valor !== atributo.orden) {
      void store.atributosTecnicos.actualizar(atributo.id, { orden: valor })
    } else {
      setOrdenInput(String(atributo.orden))
    }
  }

  const handleGuardar = async () => {
    await store.atributosTecnicos.actualizar(atributo.id, {
      titulo,
      cuerpo,
      badge: badge || null,
      imagenUrl: imagenUrl || null,
    })
    setEditando(false)
  }

  if (editando) {
    return (
      <div className="rounded-lg border border-border-subtle bg-bg-raised p-4 space-y-3">
        <div>
          <label className="block text-xs font-medium text-text-heading mb-1">Título</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full min-h-[40px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-sm text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-heading mb-1">Cuerpo</label>
          <textarea
            value={cuerpo}
            onChange={(e) => setCuerpo(e.target.value)}
            rows={3}
            className="w-full rounded-sm border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-heading mb-1">Badge (opcional)</label>
          <input
            type="text"
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            placeholder="Ej: Materiales"
            className="w-full min-h-[40px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-sm text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-heading mb-1">Imagen</label>
          <ImagePicker
            label="Arrastrar imagen aquí o hacer clic para seleccionar"
            value={imagenUrl ? [imagenUrl] : []}
            onChange={(urls) => setImagenUrl(urls[0] ?? '')}
            multiple={false}
            uploadToR2={true}
            r2Prefix="atributos-tecnicos"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="md" onClick={() => setEditando(false)} disabled={guardando}>
            Cancelar
          </Button>
          <Button variant="primary" size="md" onClick={() => guardGuardar(handleGuardar)} disabled={guardando} loading={guardando}>
            Guardar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
      <div className="h-40 w-full bg-bg-paper">
        {atributo.imagenUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={atributo.imagenUrl} alt={atributo.titulo} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-text-muted">Sin imagen</div>
        )}
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-text-primary line-clamp-1">{atributo.titulo}</p>
          {atributo.badge && <Badge tone="neutral">{atributo.badge}</Badge>}
        </div>
        <p className="text-xs text-text-muted line-clamp-2">{atributo.cuerpo}</p>
        <div className="flex items-center justify-between gap-2">
          <Badge tone={atributo.visible ? 'info' : 'neutral'}>{atributo.visible ? 'Visible' : 'Oculto'}</Badge>
          <div className="flex items-center gap-1">
            <label className="text-xs text-text-muted" htmlFor={`orden-${atributo.id}`}>Orden</label>
            <input
              id={`orden-${atributo.id}`}
              type="number"
              value={ordenInput}
              onChange={(e) => setOrdenInput(e.target.value)}
              onBlur={commitOrden}
              className="w-14 rounded-sm border border-border-default bg-bg-paper px-2 py-1 text-xs"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="md" className="h-7 px-2 text-xs" onClick={() => setEditando(true)}>
            Editar
          </Button>
          <Button
            variant="ghost"
            size="md"
            className="h-7 px-2 text-xs"
            onClick={() => void store.atributosTecnicos.actualizar(atributo.id, { visible: !atributo.visible })}
          >
            {atributo.visible ? 'Ocultar' : 'Mostrar'}
          </Button>
          <Button
            variant="ghost"
            size="md"
            className="h-7 px-2 text-xs text-red-600"
            onClick={() => void store.atributosTecnicos.eliminar(atributo.id)}
          >
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AtributosTecnicosPage() {
  const store = useDataStore()
  const version = store.getVersion()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const atributos = useMemo(() => store.atributosTecnicos.listar(), [store, version])

  const [tipoEspacio, setTipoEspacio] = useState('')
  const [titulo, setTitulo] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [badge, setBadge] = useState('')
  const [imagenUrl, setImagenUrl] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { guard: guardCrear, isPending: creando } = usePendingGuard()

  const handleCrear = async () => {
    if (!tipoEspacio || !titulo || !cuerpo || !imagenUrl) {
      setError('Elegí una categoría, cargá una imagen y completá título y cuerpo.')
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      await store.atributosTecnicos.crear({ tipoEspacio, titulo, cuerpo, badge: badge || null, imagenUrl })
      setTitulo('')
      setCuerpo('')
      setBadge('')
      setImagenUrl('')
    } catch (e) {
      setError('Error al guardar: ' + (e as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  const atributosPorTipo = useMemo(() => {
    const mapa = new Map<string, AtributoTecnico[]>()
    atributos.forEach((a) => {
      const grupo = mapa.get(a.tipoEspacio) ?? []
      grupo.push(a)
      mapa.set(a.tipoEspacio, grupo)
    })
    mapa.forEach((grupo) => grupo.sort((a, b) => a.orden - b.orden))
    return mapa
  }, [atributos])

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-heading">Validación técnica</h1>
          <p className="text-sm text-text-muted mt-1">
            Tarjetas del slider &quot;Validación Técnica&quot; en la landing pública de cada categoría de espacio.
            Se agrupan solas de a 4 por folio, según el orden.
          </p>
        </div>
        <LinkButton href="/erp/portafolio" variant="secondary">
          Volver a portafolio
        </LinkButton>
      </header>

      {error && (
        <div className="mb-6 p-4 rounded-sm border border-red-500 bg-red-500/10 text-red-600 text-sm">{error}</div>
      )}

      <section className="mb-10 space-y-4 rounded-lg border border-border-subtle bg-bg-raised p-6">
        <h2 className="font-semibold text-text-heading">Agregar tarjeta</h2>
        <div>
          <label className="block text-sm font-medium text-text-heading mb-2">Categoría *</label>
          <select
            value={tipoEspacio}
            onChange={(e) => setTipoEspacio(e.target.value)}
            className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
          >
            <option value="">Seleccionar categoría</option>
            {TIPOS_ESPACIO.map((t) => (
              <option key={t.codigo} value={t.codigo}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-heading mb-2">Título *</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Estructura Madecor RH"
            className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-heading mb-2">Cuerpo *</label>
          <textarea
            value={cuerpo}
            onChange={(e) => setCuerpo(e.target.value)}
            rows={3}
            placeholder="Descripción técnica breve de este atributo."
            className="w-full rounded-sm border border-border-subtle bg-bg-paper px-3 py-2 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-heading mb-2">Badge (opcional)</label>
          <input
            type="text"
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            placeholder="Ej: Durabilidad"
            className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-heading mb-2">Imagen *</label>
          <ImagePicker
            label="Arrastrar imagen aquí o hacer clic para seleccionar"
            value={imagenUrl ? [imagenUrl] : []}
            onChange={(urls) => setImagenUrl(urls[0] ?? '')}
            multiple={false}
            uploadToR2={true}
            r2Prefix="atributos-tecnicos"
          />
        </div>
        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={() => guardCrear(handleCrear)}
            disabled={isSaving || creando}
            loading={creando}
          >
            {isSaving ? 'Guardando...' : 'Agregar tarjeta'}
          </Button>
        </div>
      </section>

      <section className="space-y-8">
        {TIPOS_ESPACIO.map((t) => {
          const grupo = atributosPorTipo.get(t.codigo) ?? []
          if (grupo.length === 0) return null
          return (
            <div key={t.codigo}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-3">
                {labelTipoEspacio(t.codigo)}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {grupo.map((a) => (
                  <FilaAtributoTecnico key={a.id} atributo={a} />
                ))}
              </div>
            </div>
          )
        })}
        {atributos.length === 0 && (
          <div className="rounded-sm border border-border-subtle bg-bg-raised py-16 text-center text-text-muted">
            Todavía no hay tarjetas cargadas. Mientras una categoría no tenga ninguna, su landing muestra el bloque
            genérico de respaldo.
          </div>
        )}
      </section>
    </div>
  )
}
