'use client'
// t-146 (2026-08-31): Entrada de portafolio LIBRE (independiente de un proyecto pero relacionable).
// Wizard de 4 pasos: (1) ¿Asociado a un proyecto? sí/no → (2) tipar el espacio (categoría de landing
// + tipo orgánico) y componer el título auto (ley de nomenclatura pública High-Ticket) → (3) fotos
// (SEO auto) → (4) publicar/despublicar. Con ?id= entra en modo edición de una entrada libre existente.
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState, type ChangeEvent } from 'react'
import { useDataStore, type Portafolio } from '@/lib/data'
import { Button, LinkButton } from '@/components/veta/button'
import { Badge } from '@/components/veta/badge'
import { ImagePicker } from '@/components/veta/image-picker'
import { usePendingGuard } from '@/lib/hooks/usePendingGuard'
import { slugify } from '@/lib/utils/slug'
import { TIPOS_ESPACIO, nombreBaseTituloTipoEspacio } from '@/lib/catalogos/tipos-espacio'

const TIPOS_PROYECTO = ['Residencial', 'Comercial', 'Oficina', 'Hotel', 'Otro']

function inicialClienteDeTitulo(titulo: string | null | undefined): string | null {
  if (!titulo) return null
  const match = titulo.match(/([A-ZÁÉÍÓÚÑ][a-záéíóúñ]*)\.\s*[—–-]/)
  return match ? `${match[1]}.` : null
}

const PASOS = ['Proyecto', 'Espacio', 'Fotos', 'Publicar']

export default function NuevaEntradaPortafolioPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editandoId = searchParams.get('id')
  const store = useDataStore()
  const { guard: guardGuardar, isPending: guardando } = usePendingGuard()

  // Proyectos disponibles para asociar (o liberar) la entrada.
  const proyectos = store.proyectos.listar()
  // Taxonomía orgánica de espacios (independiente de las landings).
  const catalogoOrganico = store.catalogosEspaciosArquitectonicos.listar()

  // En modo edición, cargar la entrada libre existente.
  const entradas = store.portafolio.listar()
  const entradaEditando: Portafolio | null = useMemo(
    () => (editandoId ? entradas.find((e) => e.id === editandoId) ?? null : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editandoId, store.getVersion()]
  )

  const [paso, setPaso] = useState(1)
  const [asociadoAProyecto, setAsociadoAProyecto] = useState<boolean>(Boolean(entradaEditando?.proyectoId))

  const categoriaInicial = entradaEditando?.categoriaEspacio ?? ''
  const esCategoriaDelCatalogo = TIPOS_ESPACIO.some((t) => t.codigo === categoriaInicial)
  const [form, setForm] = useState(() => ({
    proyectoId: entradaEditando?.proyectoId ?? '',
    sobreescribirTitulo: false,
    tituloManual: '',
    descripcionComercial: entradaEditando?.descripcionComercial ?? '',
    categoriaEspacio: categoriaInicial,
    esEspacioCustom: Boolean(categoriaInicial && !esCategoriaDelCatalogo),
    nombreEspacioCustom: (entradaEditando && !esCategoriaDelCatalogo)
      ? (entradaEditando.titulo.match(/^(.*?)\s+[A-ZÁÉÍÓÚÑ]\./)?.[1]?.trim() ?? null)
      : null,
    tipoOrganicoId: '',
    inicialCliente: inicialClienteDeTitulo(entradaEditando?.titulo) ?? '',
    materialesDestacados: entradaEditando?.materialesDestacados?.join(', ') ?? '',
    precioReferencial: entradaEditando?.precioReferencial ?? '',
    barrio: entradaEditando?.barrio ?? '',
    tipoProyecto: entradaEditando?.tipoProyecto ?? '',
    imagenPortafolioUrl: entradaEditando?.imagenPortafolioUrl ?? '',
    galeriaPortafolioUrl: entradaEditando?.galeriaPortafolioUrl ?? [],
    publicado: entradaEditando?.publicado ?? false,
    destacado: entradaEditando?.destacado ?? false,
    orden: entradaEditando?.orden ?? 0,
  }))
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const nombreBaseTitulo = form.esEspacioCustom
    ? (form.nombreEspacioCustom ?? '')
    : (nombreBaseTituloTipoEspacio(form.categoriaEspacio) ?? form.categoriaEspacio)

  const tituloGenerado = `${nombreBaseTitulo} ${form.inicialCliente}. — ${form.barrio}`.trim()

  const handleChange = (field: string, value: string | boolean | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const puedeAvanzar = () => {
    if (paso === 1) return true
    if (paso === 2) return Boolean(form.categoriaEspacio) && Boolean(form.inicialCliente.trim()) && Boolean(form.barrio?.trim())
    if (paso === 3) return true
    return true
  }

  const siguiente = () => {
    if (!puedeAvanzar()) { setError('Completa los campos obligatorios del paso actual para continuar.'); return }
    setError(null)
    setPaso((p) => Math.min(p + 1, 4))
  }
  const anterior = () => { setError(null); setPaso((p) => Math.max(p - 1, 1)) }

  const handleGuardar = async (publicar: boolean) => {
    if (!form.categoriaEspacio) { setError('La categoría de espacio es obligatoria.'); return }
    if (form.esEspacioCustom && !form.nombreEspacioCustom?.trim()) { setError('Escribe el nombre de la categoría personalizada.'); return }
    if (!form.inicialCliente.trim()) { setError('Escribe la inicial del cliente (ej. "G.") para componer el título.'); return }
    if (!form.barrio?.trim()) { setError('Escribe el barrio (ubicación real) para componer el título.'); return }
    const tituloFinal = form.sobreescribirTitulo ? form.tituloManual.trim() : tituloGenerado
    const categoriaFinal = form.esEspacioCustom
      ? slugify(form.nombreEspacioCustom ?? '') || slugify(form.categoriaEspacio) || 'espacio'
      : form.categoriaEspacio
    setIsSaving(true)
    setError(null)
    try {
      const materiales = form.materialesDestacados.split(',').map((m) => m.trim()).filter((m) => m.length > 0)
      const data = {
        proyectoId: (pasoSeleccionaProyecto() && form.proyectoId) ? form.proyectoId : null,
        titulo: tituloFinal,
        descripcionComercial: form.descripcionComercial || null,
        categoriaEspacio: categoriaFinal,
        espacioVarianteId: null,
        materialesDestacados: materiales,
        precioReferencial: form.precioReferencial || null,
        imagenPortafolioUrl: form.imagenPortafolioUrl || null,
        galeriaPortafolioUrl: form.galeriaPortafolioUrl,
        barrio: form.barrio || null,
        tipoProyecto: form.tipoProyecto || null,
        publicado: publicar,
        destacado: form.destacado,
        orden: form.orden,
      }
      if (entradaEditando) {
        await store.portafolio.actualizar(entradaEditando.id, data)
      } else {
        await store.portafolio.crear(data)
      }
      router.push('/erp/portafolio')
      router.refresh()
    } catch (e) {
      setError('Error al guardar: ' + (e as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  function pasoSeleccionaProyecto(): boolean {
    return Boolean(entradaEditando?.proyectoId) || asociadoAProyecto
  }

  const etiquetaTipoOrganico = (id: string): string => {
    const c = catalogoOrganico.find((x) => x.id === id)
    return c ? `${c.codigo} · ${c.nombre}` : ''
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-text-heading">
              {entradaEditando ? 'Editar entrada de portafolio' : 'Nueva entrada de portafolio'}
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Independiente del proyecto pero relacionable a él. Guiado en 4 pasos.
            </p>
          </div>
          <LinkButton href="/erp/portafolio" variant="secondary">Volver</LinkButton>
        </div>

        {/* Stepper */}
        <ol className="mt-5 flex items-center gap-2">
          {PASOS.map((nombre, i) => {
            const n = i + 1
            const activo = n === paso
            const completo = n < paso
            return (
              <li key={nombre} className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    activo ? 'bg-brand text-white' : completo ? 'bg-brand/15 text-brand' : 'bg-bg-alt text-text-muted'
                  }`}
                >
                  {completo ? '✓' : n}
                </span>
                <span className={`text-sm ${activo ? 'font-medium text-text-heading' : 'text-text-muted'}`}>{nombre}</span>
                {n < PASOS.length && <span className="mx-1 h-px w-6 bg-border-default" />}
              </li>
            )
          })}
        </ol>
      </header>

      {error && (
        <div className="mb-4 p-4 rounded-sm border border-red-500 bg-red-500/10 text-red-600 text-sm">{error}</div>
      )}

      {/* PASO 1 — Proyecto */}
      {paso === 1 && (
        <section className="space-y-4 rounded-lg border border-border-subtle bg-bg-raised p-6">
          <h2 className="font-semibold text-text-heading">1 · ¿Asociado a un proyecto?</h2>
          <p className="text-sm text-text-muted">
            Una entrada puede ser <strong>libre</strong> (sin proyecto) o estar <strong>relacionada</strong> a un proyecto
            del ERP. En cualquier caso la entrada es independiente y sobrevive aunque el proyecto cambie.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => { setAsociadoAProyecto(true); handleChange('proyectoId', form.proyectoId || (proyectos[0]?.id ?? '')) }}
              className={`rounded-md border p-4 text-left transition-colors ${asociadoAProyecto ? 'border-brand bg-brand/5 ring-1 ring-brand/30' : 'border-border-subtle hover:border-brand/40'}`}
            >
              <p className="font-medium text-text-heading">Sí, relacionarlo a un proyecto</p>
              <p className="text-xs text-text-muted mt-1">La entrada se agrupa bajo ese proyecto en la gestión central.</p>
            </button>
            <button
              type="button"
              onClick={() => { setAsociadoAProyecto(false); handleChange('proyectoId', '') }}
              className={`rounded-md border p-4 text-left transition-colors ${!asociadoAProyecto ? 'border-brand bg-brand/5 ring-1 ring-brand/30' : 'border-border-subtle hover:border-brand/40'}`}
            >
              <p className="font-medium text-text-heading">No, crear la entrada libre</p>
              <p className="text-xs text-text-muted mt-1">Independiente: aparece bajo la sección Portafolio libre. Útil para muestras o conceptos.</p>
            </button>
          </div>
          {asociadoAProyecto && (
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Proyecto *</label>
              <select
                value={form.proyectoId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => handleChange('proyectoId', e.target.value)}
                className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
              >
                <option value="">Seleccionar proyecto</option>
                {proyectos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombreProyecto}</option>
                ))}
              </select>
              {form.proyectoId && (
                <p className="text-xs text-text-muted mt-2">
                  También puedes gestionar las galerías de este proyecto desde su{' '}
                  <a href={`/erp/proyectos/${form.proyectoId}/portafolio`} className="font-medium text-brand underline hover:text-brand-hover">
                    Mesa de Trabajo de Portafolio
                  </a>.
                </p>
              )}
            </div>
          )}
          <div className="flex justify-end pt-2">
            <Button variant="primary" onClick={siguiente}>Siguiente: Espacio</Button>
          </div>
        </section>
      )}

      {/* PASO 2 — Espacio (categoría + tipo orgánico + título auto) */}
      {paso === 2 && (
        <section className="space-y-5 rounded-lg border border-border-subtle bg-bg-raised p-6">
          <h2 className="font-semibold text-text-heading">2 · Tipar el espacio</h2>

          <div className="rounded-md border border-brand/30 bg-brand/5 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-text-heading">Título público (auto-generado) *</label>
              <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer">
                <input type="checkbox" checked={form.sobreescribirTitulo}
                  onChange={(e) => handleChange('sobreescribirTitulo', e.target.checked)}
                  className="h-4 w-4 rounded-sm border-border-subtle text-gold-600 focus:ring-gold-500" />
                Editar manualmente
              </label>
            </div>
            {form.sobreescribirTitulo ? (
              <input type="text" value={form.tituloManual}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('tituloManual', e.target.value)}
                placeholder="Ej: Cocina G. — Rosales"
                className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus" />
            ) : (
              <div className="rounded-sm border border-border-default bg-bg-paper px-4 py-3 text-lg font-display font-semibold text-text-heading">
                {tituloGenerado || <span className="text-sm font-normal text-text-muted">Completa categoría, inicial y barrio.</span>}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Categoría *</label>
                <select
                  value={form.esEspacioCustom ? '__custom__' : form.categoriaEspacio}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                    const val = e.target.value
                    if (val === '__custom__') setForm((prev) => ({ ...prev, esEspacioCustom: true, categoriaEspacio: prev.categoriaEspacio || '__custom__' }))
                    else setForm((prev) => ({ ...prev, esEspacioCustom: false, categoriaEspacio: val }))
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
                <input type="text" value={form.inicialCliente}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('inicialCliente', e.target.value)}
                  placeholder="Ej: G."
                  className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Barrio *</label>
                <input type="text" value={form.barrio}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('barrio', e.target.value)}
                  placeholder="Ej: Rosales"
                  className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus" />
              </div>
            </div>

            {form.esEspacioCustom && (
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Nombre de la categoría personalizada *</label>
                <input type="text" value={form.nombreEspacioCustom ?? ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('nombreEspacioCustom', e.target.value)}
                  placeholder="Ej: Cocina Compacta, Proyecto Integral, Tocador"
                  className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus" />
                <p className="text-xs text-text-muted mt-1">
                  Esta categoría aún no tiene landing pública propia. Las landings se definen por separado cuando una categoría acumula suficientes recursos.
                </p>
              </div>
            )}
          </div>

          {/* Tipo orgánico — taxonomía que crece, independiente de las landings */}
          <div>
            <label className="block text-sm font-medium text-text-heading mb-1">Tipo de espacio (orgánico, para modular)</label>
            <select
              value={form.tipoOrganicoId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => handleChange('tipoOrganicoId', e.target.value)}
              className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
            >
              <option value="">Sin tipo orgánico</option>
              {catalogoOrganico.map((c) => (
                <option key={c.id} value={c.id}>{c.codigo} · {c.nombre}</option>
              ))}
            </select>
            <p className="text-xs text-text-muted mt-1">
              La taxonomía orgánica crece para tipar la modulación de productos y espacios; NO crea una landing.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Tipo de proyecto</label>
              <select value={form.tipoProyecto}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => handleChange('tipoProyecto', e.target.value)}
                className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus">
                <option value="">Seleccionar tipo</option>
                {TIPOS_PROYECTO.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Precio referencial (rango estimado)</label>
              <input type="text" value={form.precioReferencial}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('precioReferencial', e.target.value)}
                placeholder="Ej: desde $8.000.000 COP"
                className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-heading mb-2">Descripción comercial</label>
            <textarea value={form.descripcionComercial}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleChange('descripcionComercial', e.target.value)}
              placeholder="Descripción breve para el portafolio público..." rows={3}
              className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 py-2 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus" />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-heading mb-2">Materiales destacados (separados por coma)</label>
            <input type="text" value={form.materialesDestacados}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('materialesDestacados', e.target.value)}
              placeholder="Ej: Roble, Granito, Acero inoxidable"
              className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus" />
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={anterior}>← Proyecto</Button>
            <Button variant="primary" onClick={siguiente}>Siguiente: Fotos</Button>
          </div>
        </section>
      )}

      {/* PASO 3 — Fotos */}
      {paso === 3 && (
        <section className="space-y-5 rounded-lg border border-border-subtle bg-bg-raised p-6">
          <h2 className="font-semibold text-text-heading">3 · Añadir fotos</h2>
          <p className="text-sm text-text-muted">
            Las fotos se suben a R2 y su SEO se registra automáticamente (alt desde el título, JSON-LD CreativeWork/ImageObject).
          </p>

          <div className="rounded-md border border-border-subtle bg-bg-paper p-4">
            <label className="block text-sm font-medium text-text-heading mb-2">Galería de imágenes (máx. 10) y Portada</label>
            <ImagePicker
              label="Arrastrar imágenes aquí o hacer clic para seleccionar"
              value={form.galeriaPortafolioUrl}
              onChange={(urls) => {
                const nuevasUrls = urls.slice(0, 10)
                setForm((prev) => {
                  const mantienePortada = prev.imagenPortafolioUrl && nuevasUrls.includes(prev.imagenPortafolioUrl)
                  return { ...prev, galeriaPortafolioUrl: nuevasUrls, imagenPortafolioUrl: mantienePortada ? prev.imagenPortafolioUrl : '' }
                })
              }}
              multiple={true}
              uploadToR2={true}
              r2Prefix="portafolio"
              hideGrid={true}
            />
            <p className="text-xs text-text-muted mt-2">Las imágenes se subirán automáticamente a R2. Abajo puedes borrar fotos o elegir cuál será la portada.</p>

            {form.galeriaPortafolioUrl.length > 0 && (
              <div className="mt-5">
                <label className="block text-sm font-medium text-text-heading mb-3">Haz clic en una imagen para establecerla como Portada:</label>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-5">
                  {form.galeriaPortafolioUrl.map((url, index) => {
                    const isPortada = form.imagenPortafolioUrl ? form.imagenPortafolioUrl === url : index === 0
                    return (
                      <div key={url}
                        onClick={() => handleChange('imagenPortafolioUrl', url)}
                        className={`group relative aspect-square overflow-hidden rounded-md border-2 transition-all cursor-pointer ${
                          isPortada ? 'border-brand ring-2 ring-brand/20 ring-offset-2 ring-offset-bg-paper' : 'border-transparent hover:border-brand/50'
                        }`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Imagen ${index + 1}`} className="h-full w-full object-cover" />
                        {isPortada && (
                          <div className="pointer-events-none absolute inset-0 bg-brand/10 flex items-start justify-start p-2">
                            <span className="inline-flex items-center rounded-sm bg-brand px-2 py-0.5 text-xs font-semibold text-white shadow-sm">Portada</span>
                          </div>
                        )}
                        <button type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            const nuevasUrls = form.galeriaPortafolioUrl.filter((u) => u !== url)
                            setForm((prev) => {
                              const mantienePortada = prev.imagenPortafolioUrl && nuevasUrls.includes(prev.imagenPortafolioUrl)
                              return { ...prev, galeriaPortafolioUrl: nuevasUrls, imagenPortafolioUrl: mantienePortada ? prev.imagenPortafolioUrl : '' }
                            })
                          }}
                          aria-label="Quitar imagen"
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-sm leading-none text-white opacity-0 transition-opacity duration-fast hover:bg-red-600 group-hover:opacity-100">×</button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={anterior}>← Espacio</Button>
            <Button variant="primary" onClick={siguiente}>Siguiente: Publicar</Button>
          </div>
        </section>
      )}

      {/* PASO 4 — Publicar */}
      {paso === 4 && (
        <section className="space-y-5 rounded-lg border border-border-subtle bg-bg-raised p-6">
          <h2 className="font-semibold text-text-heading">4 · Revisar y publicar</h2>

          <div className="rounded-md border border-border-subtle bg-bg-paper p-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Título</span>
              <span className="font-medium text-text-primary text-right">{form.sobreescribirTitulo ? form.tituloManual : tituloGenerado}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Asociación</span>
              <span className="font-medium text-text-primary">{asociadoAProyecto ? 'Proyecto' : 'Libre'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Categoría</span>
              <span className="font-medium text-text-primary">
                {form.esEspacioCustom ? (form.nombreEspacioCustom ?? form.categoriaEspacio) : (form.categoriaEspacio || '—')}
              </span>
            </div>
            {form.tipoOrganicoId && (
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Tipo orgánico</span>
                <span className="font-medium text-text-primary">{etiquetaTipoOrganico(form.tipoOrganicoId)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Fotos</span>
              <span className="font-medium text-text-primary">{form.galeriaPortafolioUrl.length} imagen(es)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Estado</span>
              <Badge tone={form.publicado ? 'info' : 'neutral'}>{form.publicado ? 'Publicado' : 'Borrador'}</Badge>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.destacado}
              onChange={(e) => handleChange('destacado', e.target.checked)}
              className="h-4 w-4 rounded-sm border-border-subtle text-gold-600 focus:ring-gold-500" />
            <span className="text-sm font-medium text-text-heading">Destacado</span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.publicado}
                onChange={(e) => handleChange('publicado', e.target.checked)}
                className="h-4 w-4 rounded-sm border-border-subtle text-gold-600 focus:ring-gold-500" />
              <span className="text-sm font-medium text-text-heading">Publicado en el portafolio web</span>
            </label>
            <div className="flex items-center gap-2">
              <label className="block text-xs font-medium text-text-muted">Orden</label>
              <input type="number" value={form.orden}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('orden', parseInt(e.target.value) || 0)}
                min={0}
                className="w-20 rounded-sm border border-border-default bg-bg-raised px-2 py-1 text-sm outline-none focus:border-brand" />
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={anterior}>← Fotos</Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => guardGuardar(() => handleGuardar(false))} disabled={isSaving || guardando} loading={guardando && !form.publicado}>
                Guardar borrador
              </Button>
              <Button variant="primary" onClick={() => guardGuardar(() => handleGuardar(true))} disabled={isSaving || guardando} loading={guardando && form.publicado}>
                {form.publicado ? 'Guardar y publicar' : 'Guardar y publicar'}
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
