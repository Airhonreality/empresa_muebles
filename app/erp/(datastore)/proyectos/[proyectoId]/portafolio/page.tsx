'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, type ChangeEvent } from 'react'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { LinkButton } from '@/components/veta/button'
import { ImagePicker } from '@/components/veta/image-picker'
import { useDataStore, type Portafolio } from '@/lib/data'
import { TIPOS_ESPACIO, labelTipoEspacio, nombreBaseTituloTipoEspacio } from '@/lib/catalogos/tipos-espacio'
import { usePendingGuard } from '@/lib/hooks/usePendingGuard'
import { slugify } from '@/lib/utils/slug'

const TIPOS_PROYECTO = ['Residencial', 'Comercial', 'Oficina', 'Hotel', 'Otro']

// --- Helpers de nomenclatura (ley de nomenclatura pública High-Ticket):
// título = `[Espacio] [Inicial]. — [Barrio]`. La inicial es la primera letra del apellido del
// cliente (protege privacidad, ver arnes/nucleo/nomenclatura_proyectos.md).

/** Extrae la inicial de un título ya formado ("Cocina G. — Rosales" -> "G."). */
function inicialClienteDeTitulo(titulo: string | null | undefined): string | null {
  if (!titulo) return null
  const match = titulo.match(/([A-ZÁÉÍÓÚÑ][a-záéíóúñ]*)\.\s*[—–-]/)
  return match ? `${match[1]}.` : null
}

/** Deriva una inicial desde un nombre/alias libre (p. ej. nombre del proyecto). */
function inicialDelNombre(nombre: string | null | undefined): string {
  if (!nombre) return ''
  const match = nombre.match(/\b([A-ZÁÉÍÓÚÑ])\b/)
  return match ? `${match[1]}.` : ''
}

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

  // --- Nomenclatura automática (ley de nomenclatura pública High-Ticket):
  // `[Espacio] [Inicial]. — [Barrio]`, ej. "Cocina G. — Rosales". El título se compone en vivo
  // desde categoría + inicial del cliente + barrio, en vez de tipearlo a mano (2026-08-31).
  // La inicial se extrae del título existente al editar (regex) o del nombre del proyecto.
  const categoriaInicial = entrada?.categoriaEspacio ?? ''
  const esCategoriaDelCatalogo = TIPOS_ESPACIO.some((t) => t.codigo === categoriaInicial)
  const [form, setForm] = useState({
    // titulo se calcula; se conserva solo para override manual (avanzado)
    sobreescribirTitulo: false,
    tituloManual: '',
    descripcionComercial: entrada?.descripcionComercial ?? '',
    categoriaEspacio: categoriaInicial,
    esEspacioCustom: Boolean(categoriaInicial && !esCategoriaDelCatalogo),
    nombreEspacioCustom: (entrada && !esCategoriaDelCatalogo) ? (entrada.titulo.match(/^(.*?)\s+[A-ZÁÉÍÓÚÑ]\./)?.[1]?.trim() ?? null) : null,
    inicialCliente: inicialClienteDeTitulo(entrada?.titulo) ?? inicialDelNombre(nombreProyectoDefault),
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

  const nombreBaseTitulo = form.esEspacioCustom
    ? (form.nombreEspacioCustom ?? '')
    : (nombreBaseTituloTipoEspacio(form.categoriaEspacio) ?? form.categoriaEspacio)

  const tituloGenerado = `${nombreBaseTitulo} ${form.inicialCliente}. — ${form.barrio}`.trim()

  const handleChange = (field: string, value: string | boolean | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!form.categoriaEspacio) {
      setError('La categoría de espacio es obligatoria.')
      return
    }
    if (form.esEspacioCustom && !form.nombreEspacioCustom?.trim()) {
      setError('Escribe el nombre de la categoría personalizada.')
      return
    }
    if (!form.inicialCliente.trim()) {
      setError('Escribe la inicial del cliente (ej. "G.") para componer el título.')
      return
    }
    if (!form.barrio?.trim()) {
      setError('Escribe el barrio (ubicación real) para componer el título.')
      return
    }
    const tituloFinal = form.sobreescribirTitulo ? form.tituloManual.trim() : tituloGenerado
    // Para categorías personalizadas, el código persistible es un slug del nombre base del título
    // (p. ej. "Cocina Compacta" -> "cocina-compacta"), que además alimenta la URL pública.
    const categoriaFinal = form.esEspacioCustom
      ? slugify(form.nombreEspacioCustom ?? '') || slugify(form.categoriaEspacio) || 'espacio'
      : form.categoriaEspacio
    setIsSaving(true)
    setError(null)
    try {
      const materiales = form.materialesDestacados.split(',').map((m) => m.trim()).filter((m) => m.length > 0)
      const data = {
        proyectoId,
        titulo: tituloFinal,
        descripcionComercial: form.descripcionComercial || null,
        categoriaEspacio: categoriaFinal,
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

      {/* Título público — se genera automáticamente con la ley de nomenclatura High-Ticket:
          `[Espacio] [Inicial]. — [Barrio]` (ej. "Cocina G. — Rosales"). Se compone en vivo desde
          categoría + inicial del cliente + barrio; el override manual queda como opción avanzada. */}
      <div className="rounded-md border border-brand/30 bg-brand/5 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-text-heading">Título público (auto-generado) *</label>
          <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={form.sobreescribirTitulo}
              onChange={(e) => handleChange('sobreescribirTitulo', e.target.checked)}
              className="h-4 w-4 rounded-sm border-border-subtle text-gold-600 focus:ring-gold-500"
            />
            Editar manualmente
          </label>
        </div>

        {form.sobreescribirTitulo ? (
          <input
            type="text"
            value={form.tituloManual}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('tituloManual', e.target.value)}
            placeholder="Ej: Cocina G. — Rosales"
            className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
          />
        ) : (
          <div className="rounded-sm border border-border-default bg-bg-paper px-4 py-3 text-lg font-display font-semibold text-text-heading">
            {tituloGenerado || <span className="text-sm font-normal text-text-muted">Completa categoría, inicial y barrio para generar el título.</span>}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Categoría del espacio *</label>
            <select
              value={form.esEspacioCustom ? '__custom__' : form.categoriaEspacio}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                const val = e.target.value
                if (val === '__custom__') {
                  setForm((prev) => ({ ...prev, esEspacioCustom: true, categoriaEspacio: prev.categoriaEspacio || '__custom__' }))
                } else {
                  setForm((prev) => ({ ...prev, esEspacioCustom: false, categoriaEspacio: val }))
                }
              }}
              className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
            >
              <option value="">Seleccionar categoría</option>
              {TIPOS_ESPACIO.map((t) => (
                <option key={t.codigo} value={t.codigo}>{t.label}</option>
              ))}
              <option value="__custom__">+ Nueva categoría personalizada...</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Inicial del cliente *</label>
            <input
              type="text"
              value={form.inicialCliente}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('inicialCliente', e.target.value)}
              placeholder="Ej: G."
              className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Barrio (ubicación real) *</label>
            <input
              type="text"
              value={form.barrio}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('barrio', e.target.value)}
              placeholder="Ej: Rosales"
              className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
            />
          </div>
        </div>

        {form.esEspacioCustom && (
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Nombre de la categoría personalizada (para el título) *</label>
            <input
              type="text"
              value={form.nombreEspacioCustom ?? ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('nombreEspacioCustom', e.target.value)}
              placeholder="Ej: Cocina Compacta, Proyecto Integral, Tocador"
              className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
            />
            <p className="text-xs text-text-muted mt-1">
              Esta categoría personalizada aún no tiene landing pública propia. Las landings se definen por separado cuando una categoría acumula suficientes recursos.
            </p>
          </div>
        )}
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

      {/* Jerarquía UX invertida (2026-08-28): El campo principal es la categoría del espacio.
          El vínculo a un espacio cotizado es secundario (útil para proyectos viejos). */}
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

      <div>
        <label className="block text-sm font-medium text-text-heading mb-2">Vincular a espacio cotizado (Opcional, proyectos nuevos)</label>
        <select
          value={form.espacioVarianteId}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            const espacioId = e.target.value
            const espacio = espaciosAgrupados.find((es) => es.id === espacioId)
            setForm((prev) => {
              const tipo = espacio?.tipoEspacio
              const enCatalogo = tipo ? TIPOS_ESPACIO.some((t) => t.codigo === tipo) : false
              return {
                ...prev,
                espacioVarianteId: espacioId,
                // Al vincular un espacio cotizado que ya tiene tipo en el catálogo, se sugiere su
                // categoría automáticamente (comportamiento previo). Si el tipo no está en el
                // catálogo, se pasa a modo personalizado y se sugiere su nombre.
                ...(tipo && enCatalogo ? { categoriaEspacio: tipo, esEspacioCustom: false } : {}),
                ...(tipo && !enCatalogo ? { categoriaEspacio: tipo, esEspacioCustom: true, nombreEspacioCustom: tipo } : {}),
              }
            })
          }}
          className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
        >
          <option value="">Sin vincular (Creación de galería libre)</option>
          {espaciosAgrupados.map((es) => (
            <option key={es.id} value={es.id}>
              {es.nombreEspacio}{es.tipoEspacio ? ` — ${labelTipoEspacio(es.tipoEspacio)}` : ' — sin tipo'}
            </option>
          ))}
        </select>
        {form.espacioVarianteId && (
          <p className="text-xs text-text-muted mt-1">Si seleccionas un espacio, se sugerirá su categoría automáticamente.</p>
        )}
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
        <label className="block text-sm font-medium text-text-heading mb-2">Galería de imágenes (máx. 10) y Portada</label>
        <ImagePicker
          label="Arrastrar imágenes aquí o hacer clic para seleccionar"
          value={form.galeriaPortafolioUrl}
          onChange={(urls) => {
            const nuevasUrls = urls.slice(0, 10)
            setForm((prev) => {
              const mantienePortada = prev.imagenPortafolioUrl && nuevasUrls.includes(prev.imagenPortafolioUrl)
              return { 
                ...prev, 
                galeriaPortafolioUrl: nuevasUrls,
                imagenPortafolioUrl: mantienePortada ? prev.imagenPortafolioUrl : ''
              }
            })
          }}
          multiple={true}
          uploadToR2={true}
          r2Prefix="portafolio"
          hideGrid={true}
        />
        <p className="text-xs text-text-muted mt-2">Las imágenes se subirán automáticamente a R2. Abajo puedes borrar fotos o elegir cuál será la portada.</p>
        
        {form.galeriaPortafolioUrl.length > 0 && (
          <div className="mt-5 rounded-md border border-border-subtle bg-bg-paper p-4">
            <label className="block text-sm font-medium text-text-heading mb-3">Haz clic en una imagen para establecerla como Portada:</label>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-5">
              {form.galeriaPortafolioUrl.map((url, index) => {
                const isPortada = form.imagenPortafolioUrl ? form.imagenPortafolioUrl === url : index === 0;
                return (
                  <div
                    key={url}
                    onClick={() => handleChange('imagenPortafolioUrl', url)}
                    className={`group relative aspect-square overflow-hidden rounded-md border-2 transition-all cursor-pointer ${
                      isPortada ? 'border-brand ring-2 ring-brand/20 ring-offset-2 ring-offset-bg-paper' : 'border-transparent hover:border-brand/50'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Imagen ${index + 1}`} className="h-full w-full object-cover" />
                    {isPortada && (
                      <div className="pointer-events-none absolute inset-0 bg-brand/10 flex items-start justify-start p-2">
                        <span className="inline-flex items-center rounded-sm bg-brand px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
                          Portada
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const nuevasUrls = form.galeriaPortafolioUrl.filter(u => u !== url);
                        setForm(prev => {
                          const mantienePortada = prev.imagenPortafolioUrl && nuevasUrls.includes(prev.imagenPortafolioUrl)
                          return {
                            ...prev,
                            galeriaPortafolioUrl: nuevasUrls,
                            imagenPortafolioUrl: mantienePortada ? prev.imagenPortafolioUrl : ''
                          }
                        })
                      }}
                      aria-label="Quitar imagen"
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-sm leading-none text-white opacity-0 transition-opacity duration-fast hover:bg-red-600 group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
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
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        {entradasProyecto.length === 0 && !formularioAbierto && (
          <div className="col-span-full rounded-sm border border-border-subtle bg-bg-raised py-12 text-center text-text-muted">
            Este proyecto todavía no tiene ningún espacio en el portafolio.
          </div>
        )}
        {entradasProyecto.map((entrada) => {
          const imagenUrl = entrada.imagenPortafolioUrl || entrada.galeriaPortafolioUrl[0]
          return (
            <div key={entrada.id} className="flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-bg-raised shadow-sm transition-shadow hover:shadow-md">
              <div className="relative h-48 w-full bg-bg-paper">
                {imagenUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagenUrl} alt={entrada.titulo} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-text-muted">Sin foto de portada</div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                  <Badge tone={entrada.publicado ? 'info' : 'neutral'}>{entrada.publicado ? 'Publicado' : 'Borrador'}</Badge>
                  {entrada.destacado && <Badge tone="warning">Destacado</Badge>}
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <p className="font-display font-semibold text-text-heading text-lg leading-tight mb-1">{entrada.titulo}</p>
                <p className="text-sm text-brand font-medium mb-4">{labelTipoEspacio(entrada.categoriaEspacio) ?? entrada.categoriaEspacio}</p>
                
                <div className="mt-auto flex gap-3 pt-2">
                  <Button
                    variant="secondary"
                    size="md"
                    className="flex-1"
                    onClick={() => { setEntradaEditandoId(entrada.id); setFormularioAbierto(true) }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    className="flex-1"
                    onClick={() => void (entrada.publicado ? store.portafolio.despublicar(entrada.id) : store.portafolio.publicar(entrada.id))}
                  >
                    {entrada.publicado ? 'Ocultar' : 'Publicar'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    className="shrink-0"
                    aria-label={`Eliminar ${entrada.titulo}`}
                    onClick={() => {
                      const confirma = window.confirm(
                        `¿Eliminar "${entrada.titulo}" del portafolio?\n\nEsta acción no se puede deshacer. No afecta al proyecto (${proyecto.nombreProyecto}) ni a sus otros espacios.`
                      )
                      if (confirma) {
                        void store.portafolio.eliminar(entrada.id).then((ok) => {
                          if (ok) router.refresh()
                        })
                      }
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
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
          + Crear Espacio en el Portafolio
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
