'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, type ChangeEvent } from 'react'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { LinkButton } from '@/components/veta/button'
import { ImagePicker } from '@/components/veta/image-picker'
import { useDataStore, type Portafolio } from '@/lib/data'
import { TIPOS_ESPACIO, labelTipoEspacio } from '@/lib/catalogos/tipos-espacio'
import { usePendingGuard } from '@/lib/hooks/usePendingGuard'

const TIPOS_PROYECTO = ['Residencial', 'Comercial', 'Oficina', 'Hotel', 'Otro']

interface FormularioEntradaPortafolioProps {
  proyectoId: string
  nombreProyectoDefault: string
  entrada: Portafolio | null
  espaciosAgrupados: { id: string; nombreEspacio: string; tipoEspacio: string | null }[]
  onGuardado: () => void
  onCancelar: () => void
}

function FormularioEntradaPortafolio({ proyectoId, nombreProyectoDefault, entrada, espaciosAgrupados, onGuardado, onCancelar }: FormularioEntradaPortafolioProps) {
  const store = useDataStore()
  const [form, setForm] = useState({
    titulo: entrada?.titulo ?? nombreProyectoDefault,
    descripcionComercial: entrada?.descripcionComercial ?? '',
    categoriaEspacio: entrada?.categoriaEspacio ?? '',
    espacioVarianteId: entrada?.espacioVarianteId ?? '',
    materialesDestacados: entrada?.materialesDestacados?.join(', ') ?? '',
    precioReferencial: entrada?.precioReferencial ?? '',
    barrio: entrada?.barrio ?? '',
    tipoProyecto: entrada?.tipoProyecto ?? '',
    imagenPortafolioUrl: entrada?.imagenPortafolioUrl ?? '',
    galeriaPortafolioUrl: entrada?.galeriaPortafolioUrl ?? [],
    publicado: entrada?.publicado ?? false,
    destacado: entrada?.destacado ?? false,
    orden: entrada?.orden ?? 0,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { guard: guardGuardarPortafolio, isPending: guardandoPortafolio } = usePendingGuard()

  const handleChange = (field: string, value: string | boolean | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!form.titulo || !form.categoriaEspacio) {
      setError('Título y categoría de espacio son obligatorios.')
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      const materiales = form.materialesDestacados.split(',').map((m) => m.trim()).filter((m) => m.length > 0)
      const data = {
        proyectoId,
        titulo: form.titulo,
        descripcionComercial: form.descripcionComercial || null,
        categoriaEspacio: form.categoriaEspacio,
        espacioVarianteId: form.espacioVarianteId || null,
        materialesDestacados: materiales,
        precioReferencial: form.precioReferencial || null,
        imagenPortafolioUrl: form.imagenPortafolioUrl || null,
        galeriaPortafolioUrl: form.galeriaPortafolioUrl,
        barrio: form.barrio || null,
        tipoProyecto: form.tipoProyecto || null,
        publicado: form.publicado,
        destacado: form.destacado,
        orden: form.orden,
      }
      if (entrada) {
        await store.portafolio.actualizar(entrada.id, data)
      } else {
        await store.portafolio.crear(data)
      }
      onGuardado()
    } catch (e) {
      setError('Error al guardar: ' + (e as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); guardGuardarPortafolio(handleSubmit) }} className="space-y-6 rounded-lg border border-border-subtle bg-bg-raised p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-text-heading">{entrada ? 'Editar galería' : 'Nueva galería de este proyecto'}</h2>
        <Button type="button" variant="ghost" size="md" onClick={onCancelar} disabled={isSaving}>
          Cancelar
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-sm border border-red-500 bg-red-500/10 text-red-600 text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-heading mb-2">Título *</label>
        <input
          type="text"
          value={form.titulo}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('titulo', e.target.value)}
          placeholder="Ej: Cocina integral en roble — Chicó"
          required
          className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-heading mb-2">Descripción comercial</label>
        <textarea
          value={form.descripcionComercial}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleChange('descripcionComercial', e.target.value)}
          placeholder="Descripción breve para el portafolio público..."
          rows={3}
          className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 py-2 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
        />
      </div>

      {/* Espacio de origen (F-09, 2026-08-17): al elegir uno, categoriaEspacio se hereda de
          su tipoEspacio en vez de tiparse dos veces. En proyectos migrados sin espacios reales
          completos, se deja "Sin vincular" y la categoría se tipea a mano — cada galería es
          independiente, no exige que el proyecto tenga un espacio real para existir. */}
      <div>
        <label className="block text-sm font-medium text-text-heading mb-2">Espacio de origen</label>
        <select
          value={form.espacioVarianteId}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            const espacioId = e.target.value
            const espacio = espaciosAgrupados.find((es) => es.id === espacioId)
            setForm((prev) => ({
              ...prev,
              espacioVarianteId: espacioId,
              categoriaEspacio: espacio?.tipoEspacio ?? prev.categoriaEspacio,
            }))
          }}
          className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
        >
          <option value="">Sin vincular (entrada manual)</option>
          {espaciosAgrupados.map((es) => (
            <option key={es.id} value={es.id}>
              {es.nombreEspacio}{es.tipoEspacio ? ` — ${labelTipoEspacio(es.tipoEspacio)}` : ' — sin tipo'}
            </option>
          ))}
        </select>
        {form.espacioVarianteId && (
          <p className="text-xs text-text-muted mt-1">Categoría heredada de este espacio — puedes cambiarla abajo si hace falta.</p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-text-heading mb-2">Categoría de espacio *</label>
          <select
            value={form.categoriaEspacio}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => handleChange('categoriaEspacio', e.target.value)}
            required
            className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
          >
            <option value="">Seleccionar categoría</option>
            {TIPOS_ESPACIO.map((t) => (
              <option key={t.codigo} value={t.codigo}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-heading mb-2">Tipo de proyecto</label>
          <select
            value={form.tipoProyecto}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => handleChange('tipoProyecto', e.target.value)}
            className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
          >
            <option value="">Seleccionar tipo</option>
            {TIPOS_PROYECTO.map((tipo) => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-heading mb-2">Barrio (ubicación real, no inventado — I-049)</label>
        <input
          type="text"
          value={form.barrio}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('barrio', e.target.value)}
          placeholder="Ej: Chicó, Chapinero, Rosales"
          className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-heading mb-2">Materiales destacados (separados por coma)</label>
        <input
          type="text"
          value={form.materialesDestacados}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('materialesDestacados', e.target.value)}
          placeholder="Ej: Roble, Granito, Acero inoxidable"
          className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-heading mb-2">Precio referencial (F-03 R2: rango estimado, nunca cifra exacta)</label>
        <input
          type="text"
          value={form.precioReferencial}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('precioReferencial', e.target.value)}
          placeholder="Ej: desde $8.000.000 COP"
          className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-heading mb-2">URL de imagen principal (opcional)</label>
        <input
          type="text"
          value={form.imagenPortafolioUrl}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('imagenPortafolioUrl', e.target.value)}
          placeholder="Ej: https://r2.cloud/portafolio/cocina-diaz-hero.jpg"
          className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
        />
        <p className="text-xs text-text-muted mt-1">Si no se especifica, se usará la primera imagen de la galería.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-heading mb-2">Galería de imágenes (máx. 10)</label>
        <ImagePicker
          label="Arrastrar imágenes aquí o hacer clic para seleccionar"
          value={form.galeriaPortafolioUrl}
          onChange={(urls) => setForm((prev) => ({ ...prev, galeriaPortafolioUrl: urls.slice(0, 10) }))}
          multiple={true}
          uploadToR2={true}
          r2Prefix="portafolio"
        />
        <p className="text-xs text-text-muted mt-1">Las imágenes se subirán automáticamente a R2. Máximo 10 imágenes.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-text-heading mb-2">Orden (menor = primero en el grid)</label>
          <input
            type="number"
            value={form.orden}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('orden', parseInt(e.target.value) || 0)}
            min={0}
            className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.destacado}
              onChange={(e) => handleChange('destacado', e.target.checked)}
              className="h-4 w-4 rounded-sm border-border-subtle text-gold-600 focus:ring-gold-500"
            />
            <span className="text-sm font-medium text-text-heading">Destacado</span>
          </label>
        </div>
      </div>

      {/* URL pública — generada automáticamente server-side desde categoría + barrio (hallazgo
          2026-08-21: un slug tipeado a mano rompió la URL pública de un proyecto real). */}
      <div>
        <label className="block text-sm font-medium text-text-heading mb-2">URL pública</label>
        {entrada ? (
          <a
            href={`/portafolio/${entrada.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-brand underline underline-offset-2 hover:text-brand-hover"
          >
            /portafolio/{entrada.slug}
          </a>
        ) : (
          <p className="text-sm text-text-muted">Se genera automáticamente al guardar (categoría + barrio).</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-4">
        <Button type="submit" disabled={isSaving || guardandoPortafolio} loading={guardandoPortafolio} variant="primary">
          {isSaving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  )
}

export default function ProyectoPortafolioPage() {
  const params = useParams()
  const router = useRouter()
  const proyectoId = params.proyectoId as string
  const store = useDataStore()

  const proyecto = store.proyectos.obtenerPorId(proyectoId)

  // Un proyecto puede tener varios tipos de espacio (cocina + closet + ...) — cada uno con su
  // propia galería curada de portafolio. La tabla nunca tuvo restricción de unicidad por
  // proyectoId; el límite de "una sola entrada" era solo de esta pantalla (2026-08-25).
  // useDataStore() ya suscribe este componente a los cambios del store (useSyncExternalStore) —
  // no hace falta memoizar este filtro, son pocas entradas por proyecto.
  const entradasProyecto = store.portafolio.listar()
    .filter((p) => p.proyectoId === proyectoId)
    .sort((a, b) => a.orden - b.orden)

  const espaciosProyecto = store.espacios.porProyecto(proyectoId)
  const espaciosAgrupados = Array.from(
    espaciosProyecto.reduce((mapa, e) => {
      const actual = mapa.get(e.nombreEspacio)
      if (!actual || (e.activa && !actual.activa)) mapa.set(e.nombreEspacio, e)
      return mapa
    }, new Map<string, typeof espaciosProyecto[number]>()).values()
  )

  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [entradaEditandoId, setEntradaEditandoId] = useState<string | null>(null)

  if (!proyecto) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-text-muted">Proyecto no encontrado</p>
        <p className="text-xs font-mono mt-2">{proyectoId}</p>
      </div>
    )
  }

  const entradaEditando = entradaEditandoId ? entradasProyecto.find((e) => e.id === entradaEditandoId) ?? null : null

  const cerrarFormulario = () => {
    setFormularioAbierto(false)
    setEntradaEditandoId(null)
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-text-heading">Publicar en Portafolio Web</h1>
            <p className="text-sm text-text-muted mt-1">{proyecto.nombreProyecto} · {proyectoId}</p>
          </div>
          <LinkButton href={`/erp/proyectos/${proyectoId}`} variant="secondary">
            Volver al proyecto
          </LinkButton>
        </div>
        <p className="text-sm text-text-muted mt-3">
          Un proyecto puede mostrar varios tipos de espacio en el portafolio público — una galería curada por cada
          uno (cocina, closet, etc.), cada una con su propia categoría, título y fotos.
        </p>
      </header>

      {/* Listado de galerías ya creadas para este proyecto */}
      <section className="space-y-3 mb-6">
        {entradasProyecto.length === 0 && !formularioAbierto && (
          <div className="rounded-sm border border-border-subtle bg-bg-raised py-10 text-center text-text-muted">
            Este proyecto todavía no tiene ninguna galería de portafolio.
          </div>
        )}
        {entradasProyecto.map((entrada) => {
          const imagenUrl = entrada.imagenPortafolioUrl || entrada.galeriaPortafolioUrl[0]
          return (
            <div key={entrada.id} className="flex items-center gap-4 rounded-lg border border-border-subtle bg-bg-raised p-4">
              <div className="h-16 w-24 shrink-0 overflow-hidden rounded-sm bg-bg-paper">
                {imagenUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagenUrl} alt={entrada.titulo} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-text-muted">Sin foto</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-text-primary truncate">{entrada.titulo}</p>
                <p className="text-xs text-text-muted">{labelTipoEspacio(entrada.categoriaEspacio) ?? entrada.categoriaEspacio}</p>
              </div>
              <Badge tone={entrada.publicado ? 'info' : 'neutral'}>{entrada.publicado ? 'Publicado' : 'Sin publicar'}</Badge>
              {entrada.destacado && <Badge tone="warning">Destacado</Badge>}
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => { setEntradaEditandoId(entrada.id); setFormularioAbierto(true) }}
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => void (entrada.publicado ? store.portafolio.despublicar(entrada.id) : store.portafolio.publicar(entrada.id))}
                >
                  {entrada.publicado ? 'Despublicar' : 'Publicar'}
                </Button>
              </div>
            </div>
          )
        })}
      </section>

      {!formularioAbierto && (
        <Button
          variant="primary"
          onClick={() => { setEntradaEditandoId(null); setFormularioAbierto(true) }}
        >
          + Agregar galería de otro espacio
        </Button>
      )}

      {formularioAbierto && (
        <FormularioEntradaPortafolio
          key={entradaEditandoId ?? 'nuevo'}
          proyectoId={proyectoId}
          nombreProyectoDefault={proyecto.nombreProyecto}
          entrada={entradaEditando}
          espaciosAgrupados={espaciosAgrupados}
          onGuardado={() => { cerrarFormulario(); router.refresh() }}
          onCancelar={cerrarFormulario}
        />
      )}
    </div>
  )
}
