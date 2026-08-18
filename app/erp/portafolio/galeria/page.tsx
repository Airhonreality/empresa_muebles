'use client'
// Galería por categoría (F09, 2026-08-17, renombrada de "renders conceptuales" — la palabra
// "render" no describe bien esto: es cualquier imagen por categoría, no solo diseños 3D) —
// imágenes que se suman a las fotos reales de Portafolio en la landing pública de esa categoría,
// sin distinción visible entre unas y otras.
import { useMemo, useState } from 'react'
import { Badge } from '@/components/veta/badge'
import { Button, LinkButton } from '@/components/veta/button'
import { ImagePicker } from '@/components/veta/image-picker'
import { useDataStore } from '@/lib/data'
import { TIPOS_ESPACIO, labelTipoEspacio } from '@/lib/catalogos/tipos-espacio'

export default function GaleriaEspaciosPage() {
  const store = useDataStore()
  const version = store.getVersion()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const renders = useMemo(() => store.renderesConceptuales.listar(), [store, version])

  const [tipoEspacio, setTipoEspacio] = useState('')
  const [imagenUrl, setImagenUrl] = useState('')
  const [titulo, setTitulo] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCrear = async () => {
    if (!tipoEspacio || !imagenUrl) {
      setError('Elegí un tipo de espacio y subí una imagen.')
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      await store.renderesConceptuales.crear({ tipoEspacio, imagenUrl, titulo: titulo || null })
      setTipoEspacio('')
      setImagenUrl('')
      setTitulo('')
    } catch (e) {
      setError('Error al guardar: ' + (e as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  const rendersPorTipo = useMemo(() => {
    const mapa = new Map<string, typeof renders>()
    renders.forEach((r) => {
      const grupo = mapa.get(r.tipoEspacio) ?? []
      grupo.push(r)
      mapa.set(r.tipoEspacio, grupo)
    })
    return mapa
  }, [renders])

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-heading">Galería por categoría</h1>
          <p className="text-sm text-text-muted mt-1">
            Imágenes propias por categoría. Se suman a las fotos reales de Portafolio en la landing pública de esa
            categoría — cargá lo que quieras mostrar ahí.
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
        <h2 className="font-semibold text-text-heading">Agregar imagen</h2>
        <div>
          <label className="block text-sm font-medium text-text-heading mb-2">Tipo de espacio *</label>
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
          <label className="block text-sm font-medium text-text-heading mb-2">Título (opcional)</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Concepto cocina en L, roble y granito"
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
            r2Prefix="renders-conceptuales"
          />
        </div>
        <div className="flex justify-end">
          <Button variant="primary" onClick={handleCrear} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Agregar imagen'}
          </Button>
        </div>
      </section>

      <section className="space-y-8">
        {TIPOS_ESPACIO.map((t) => {
          const grupo = rendersPorTipo.get(t.codigo) ?? []
          if (grupo.length === 0) return null
          return (
            <div key={t.codigo}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-3">{t.label}</h3>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {grupo.map((r) => (
                  <div key={r.id} className="rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.imagenUrl} alt={r.titulo ?? labelTipoEspacio(r.tipoEspacio) ?? ''} className="h-40 w-full object-cover" loading="lazy" />
                    <div className="p-3 space-y-2">
                      <p className="text-sm text-text-primary line-clamp-1">{r.titulo ?? 'Sin título'}</p>
                      <div className="flex items-center justify-between">
                        <Badge tone={r.visible ? 'info' : 'neutral'}>{r.visible ? 'Visible' : 'Oculto'}</Badge>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="md"
                            className="h-7 px-2 text-xs"
                            onClick={() => void store.renderesConceptuales.actualizar(r.id, { visible: !r.visible })}
                          >
                            {r.visible ? 'Ocultar' : 'Mostrar'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="md"
                            className="h-7 px-2 text-xs text-red-600"
                            onClick={() => void store.renderesConceptuales.eliminar(r.id)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        {renders.length === 0 && (
          <div className="rounded-sm border border-border-subtle bg-bg-raised py-16 text-center text-text-muted">
            Todavía no hay imágenes cargadas.
          </div>
        )}
      </section>
    </div>
  )
}
