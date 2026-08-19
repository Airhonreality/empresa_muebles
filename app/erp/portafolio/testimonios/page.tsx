'use client'
// Testimonios (DC-1 ACTIVA 2026-08-09, checklists SEO #5/#7): gestión central de testimonios.
// Alimenta la sección del Home (listarTestimoniosPublicadosAction → store.testimonios.publicados()).
// Cura: contenido, nombreAutor, rating, fuente, barrio, tipoProyecto, urlFuente y estado
// (publicado/aprobado/curado). La edición de contenido usa la fila en línea (sin modal).
import { useMemo, useState } from 'react'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { Busqueda } from '@/components/veta/busqueda'
import { useDataStore, type Testimonio } from '@/lib/data'
import { coincide } from '@/lib/search/normalizar'

const FUENTES: Array<Testimonio['fuente']> = ['GBP', 'WhatsApp', 'Notion', 'video', 'otro']

function etiquetaFuente(fuente: Testimonio['fuente']): string {
  const map: Record<Testimonio['fuente'], string> = {
    GBP: 'Google',
    WhatsApp: 'WhatsApp',
    Notion: 'Notion',
    video: 'Video',
    otro: 'Otro',
  }
  return map[fuente]
}

const FORM_VACIO = {
  contenido: '',
  nombreAutor: '',
  rating: '5',
  fuente: 'GBP' as Testimonio['fuente'],
  barrio: '',
  tipoProyecto: '',
  urlFuente: '',
}

function FormularioTestimonio({
  inicial,
  onSubmit,
  onCancelar,
}: {
  inicial?: Testimonio
  onSubmit: (data: {
    contenido: string
    nombreAutor: string | null
    rating: number | null
    fuente: Testimonio['fuente']
    barrio: string | null
    tipoProyecto: string | null
    urlFuente: string | null
  }) => void
  onCancelar?: () => void
}) {
  const [form, setForm] = useState({
    contenido: inicial?.contenido ?? FORM_VACIO.contenido,
    nombreAutor: inicial?.nombreAutor ?? FORM_VACIO.nombreAutor,
    rating: String(inicial?.rating ?? FORM_VACIO.rating),
    fuente: inicial?.fuente ?? FORM_VACIO.fuente,
    barrio: inicial?.barrio ?? FORM_VACIO.barrio,
    tipoProyecto: inicial?.tipoProyecto ?? FORM_VACIO.tipoProyecto,
    urlFuente: inicial?.urlFuente ?? FORM_VACIO.urlFuente,
  })

  const set = (campo: keyof typeof form, valor: string) => setForm((f) => ({ ...f, [campo]: valor }))

  const guardar = () => {
    if (!form.contenido.trim()) return
    onSubmit({
      contenido: form.contenido.trim(),
      nombreAutor: form.nombreAutor.trim() || null,
      rating: Number.isFinite(Number(form.rating)) ? Math.min(5, Math.max(1, Number(form.rating))) : null,
      fuente: form.fuente,
      barrio: form.barrio.trim() || null,
      tipoProyecto: form.tipoProyecto.trim() || null,
      urlFuente: form.urlFuente.trim() || null,
    })
  }

  return (
    <div className="rounded-sm border border-border-subtle bg-bg-raised p-4">
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-text-muted">Nombre del autor</label>
      <input
        value={form.nombreAutor}
        onChange={(e) => set('nombreAutor', e.target.value)}
        placeholder="Ej. Glenda Danuro"
        className="mb-3 w-full rounded-sm border border-border-default bg-bg-paper px-3 py-2 text-sm"
      />
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-text-muted">Contenido</label>
      <textarea
        value={form.contenido}
        onChange={(e) => set('contenido', e.target.value)}
        placeholder="Texto textual de la reseña"
        rows={3}
        className="mb-3 w-full rounded-sm border border-border-default bg-bg-paper px-3 py-2 text-sm"
      />
      <div className="mb-3 grid gap-3 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-text-muted">Rating (1-5)</label>
          <input
            type="number"
            min={1}
            max={5}
            value={form.rating}
            onChange={(e) => set('rating', e.target.value)}
            className="w-full rounded-sm border border-border-default bg-bg-paper px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-text-muted">Fuente</label>
          <select
            value={form.fuente}
            onChange={(e) => set('fuente', e.target.value)}
            className="w-full rounded-sm border border-border-default bg-bg-paper px-3 py-2 text-sm"
          >
            {FUENTES.map((f) => (
              <option key={f} value={f}>
                {etiquetaFuente(f)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-text-muted">Barrio</label>
          <input
            value={form.barrio}
            onChange={(e) => set('barrio', e.target.value)}
            placeholder="Ej. Chicó"
            className="w-full rounded-sm border border-border-default bg-bg-paper px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-text-muted">Tipo de proyecto</label>
          <input
            value={form.tipoProyecto}
            onChange={(e) => set('tipoProyecto', e.target.value)}
            placeholder="Ej. Residencial"
            className="w-full rounded-sm border border-border-default bg-bg-paper px-3 py-2 text-sm"
          />
        </div>
      </div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-text-muted">URL fuente</label>
      <input
        value={form.urlFuente}
        onChange={(e) => set('urlFuente', e.target.value)}
        placeholder="https://www.google.com/maps/place/Veta+Dorada"
        className="mb-3 w-full rounded-sm border border-border-default bg-bg-paper px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        <Button variant="primary" size="md" onClick={guardar}>
          {inicial ? 'Guardar cambios' : 'Crear testimonio'}
        </Button>
        {onCancelar && (
          <Button variant="ghost" size="md" onClick={onCancelar}>
            Cancelar
          </Button>
        )}
      </div>
    </div>
  )
}

export default function TestimoniosAdminPage() {
  const store = useDataStore()
  const version = store.getVersion()
  const [busqueda, setBusqueda] = useState('')
  const [filtroPublicado, setFiltroPublicado] = useState<'' | 'publicado' | 'sin_publicar'>('')
  const [creando, setCreando] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const testimonios = useMemo(() => store.testimonios.listar(), [store, version])

  const filtrados = useMemo(() => {
    let resultado = testimonios
    if (busqueda.trim()) {
      resultado = resultado.filter((t) => coincide(busqueda, [t.contenido, t.nombreAutor ?? '', t.barrio ?? '', t.tipoProyecto ?? '']))
    }
    if (filtroPublicado === 'publicado') resultado = resultado.filter((t) => t.publicado)
    if (filtroPublicado === 'sin_publicar') resultado = resultado.filter((t) => !t.publicado)
    return resultado
      .slice()
      .sort((a, b) => (a.fechaPublicacion ?? '').localeCompare(b.fechaPublicacion ?? '') * -1)
  }, [testimonios, busqueda, filtroPublicado])

  const edicion = editandoId ? testimonios.find((t) => t.id === editandoId) : undefined

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-heading">Testimonios</h1>
          <p className="text-sm text-text-muted mt-1">
            Reseñas curadas (Google Business Profile y otras fuentes) que se muestran en el Home.
            Solo los testimonios <span className="font-medium text-text-primary">publicados</span> aparecen en público.
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setCreando(!creando)}>
          {creando ? 'Cancelar' : '+ Nuevo testimonio'}
        </Button>
      </header>

      {creando && (
        <div className="mb-6">
          <FormularioTestimonio
            onSubmit={(data) => {
              void store.testimonios.crear(data)
              setCreando(false)
            }}
            onCancelar={() => setCreando(false)}
          />
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <Busqueda
          valor={busqueda}
          onChange={setBusqueda}
          placeholder="Buscar por autor, contenido, barrio..."
          label="Buscar en testimonios"
          className="w-full sm:w-72"
        />
        <select
          value={filtroPublicado}
          onChange={(e) => setFiltroPublicado(e.target.value as '' | 'publicado' | 'sin_publicar')}
          className="rounded-sm border border-border-default bg-bg-raised px-3 py-2 text-sm"
          aria-label="Filtrar por estado de publicación"
        >
          <option value="">Publicados y sin publicar</option>
          <option value="publicado">Solo publicados</option>
          <option value="sin_publicar">Solo sin publicar</option>
        </select>
      </div>

      {filtrados.length === 0 ? (
        <div className="rounded-sm border border-border-subtle bg-bg-raised py-16 text-center text-text-muted">
          No hay testimonios con estos filtros.
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((t) => {
            const esEdicion = editandoId === t.id
            return (
              <div key={t.id} className="rounded-sm border border-border-subtle bg-bg-raised p-4">
                {esEdicion && edicion ? (
                  <FormularioTestimonio
                    inicial={edicion}
                    onSubmit={(data) => {
                      void store.testimonios.actualizar(t.id, data)
                      setEditandoId(null)
                    }}
                    onCancelar={() => setEditandoId(null)}
                  />
                ) : (
                  <>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <p className="font-medium text-text-primary">{t.nombreAutor ?? 'Sin nombre'}</p>
                      <span className="font-mono text-xs text-text-muted">{t.rating ? `${t.rating}/5` : '—'}</span>
                      <Badge tone="neutral">{etiquetaFuente(t.fuente)}</Badge>
                      {t.publicado ? <Badge tone="info">Publicado</Badge> : <Badge tone="neutral">Sin publicar</Badge>}
                      {t.aprobado && <Badge tone="info">Aprobado</Badge>}
                      {t.curado && <Badge tone="info">Curado</Badge>}
                      {(t.barrio || t.tipoProyecto) && (
                        <span className="text-xs text-text-muted">
                          {[t.barrio, t.tipoProyecto].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </div>
                    <p className="mb-3 text-sm text-text-primary">&ldquo;{t.contenido}&rdquo;</p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" size="md" onClick={() => setEditandoId(t.id)}>
                        Editar
                      </Button>
                      <Button variant="primary" size="md" onClick={() => void store.testimonios.publicar(t.id)}>
                        Publicar
                      </Button>
                      <Button variant="ghost" size="md" onClick={() => void store.testimonios.despublicar(t.id)}>
                        Despublicar
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}