'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, type ChangeEvent } from 'react'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { LinkButton } from '@/components/veta/button'
import { ImagePicker } from '@/components/veta/image-picker'
import { useDataStore } from '@/lib/data'

export default function ProyectoPortafolioPage() {
  const params = useParams()
  const router = useRouter()
  const proyectoId = params.proyectoId as string
  const store = useDataStore()

  const proyecto = store.proyectos.obtenerPorId(proyectoId)
  // Portafolio entry linked to this proyecto (if exists)
  const portafolioEntry = store.portafolio.listar().find(p => p.proyectoId === proyectoId) ?? null

  // Form state
  const [form, setForm] = useState<{
    titulo: string
    descripcionComercial: string
    categoriaEspacio: string
    materialesDestacados: string
    precioReferencial: string
    barrio: string
    tipoProyecto: string
    imagenPortafolioUrl: string
    galeriaPortafolioUrl: string[]
    publicado: boolean
    destacado: boolean
    orden: number
    slug: string
  }>({
    titulo: portafolioEntry?.titulo ?? proyecto?.nombreProyecto ?? '',
    descripcionComercial: portafolioEntry?.descripcionComercial ?? '',
    categoriaEspacio: portafolioEntry?.categoriaEspacio ?? '',
    materialesDestacados: portafolioEntry?.materialesDestacados?.join(', ') ?? '',
    precioReferencial: portafolioEntry?.precioReferencial ?? '',
    barrio: portafolioEntry?.barrio ?? '',
    tipoProyecto: portafolioEntry?.tipoProyecto ?? '',
    imagenPortafolioUrl: portafolioEntry?.imagenPortafolioUrl ?? '',
    galeriaPortafolioUrl: portafolioEntry?.galeriaPortafolioUrl ?? [],
    publicado: portafolioEntry?.publicado ?? false,
    destacado: portafolioEntry?.destacado ?? false,
    orden: portafolioEntry?.orden ?? 0,
    slug: portafolioEntry?.slug ?? '',
  })

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Categorías de espacio (F-09)
  const categoriasEspacio = [
    'cocina',
    'closet',
    'centro_entretenimiento',
    'estudio_home_office',
    'cava_bar',
    'consola_recibidor',
    'pisos_madera',
  ]

  const tiposProyecto = [
    'Residencial',
    'Comercial',
    'Oficina',
    'Hotel',
    'Otro',
  ]

  if (!proyecto) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-text-muted">Proyecto no encontrado</p>
        <p className="text-xs font-mono mt-2">{proyectoId}</p>
      </div>
    )
  }

  const handleChange = (field: string, value: string | boolean | number) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleMaterialesChange = (value: string) => {
    setForm(prev => ({ ...prev, materialesDestacados: value }))
  }

  const handleSubmit = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const materiales = form.materialesDestacados
        .split(',')
        .map(m => m.trim())
        .filter(m => m.length > 0)

      const slug = form.slug || form.titulo.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

       const data = {
         proyectoId,
         titulo: form.titulo,
         descripcionComercial: form.descripcionComercial || null,
         categoriaEspacio: form.categoriaEspacio,
         materialesDestacados: materiales,
         precioReferencial: form.precioReferencial || null,
         imagenPortafolioUrl: form.imagenPortafolioUrl || null,
         galeriaPortafolioUrl: form.galeriaPortafolioUrl,
         barrio: form.barrio || null,
         tipoProyecto: form.tipoProyecto || null,
         publicado: form.publicado,
         destacado: form.destacado,
         orden: form.orden,
         slug,
       }

      if (portafolioEntry) {
        // Update existing
        await store.portafolio.actualizar(portafolioEntry.id, data)
      } else {
        // Create new
        await store.portafolio.crear(data)
      }

      // Force re-render by navigating away and back (or just notify)
      router.refresh()
    } catch (e) {
      setError('Error al guardar: ' + (e as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublicarToggle = async () => {
    if (!portafolioEntry) return
    if (portafolioEntry.publicado) {
      await store.portafolio.despublicar(portafolioEntry.id)
    } else {
      await store.portafolio.publicar(portafolioEntry.id)
    }
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-text-heading">
              Publicar en Portafolio Web
            </h1>
            <p className="text-sm text-text-muted mt-1">
              {proyecto.nombreProyecto} · {proyectoId}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={form.publicado ? 'info' : 'neutral'} dot>
              {form.publicado ? 'Publicado' : 'No publicado'}
            </Badge>
            {portafolioEntry && (
               <Button
                 variant={form.publicado ? 'secondary' : 'primary'}
                 onClick={handlePublicarToggle}
                 disabled={isSaving}
                 className="text-xs px-3 py-1.5"
               >
                 {form.publicado ? 'Ocultar del portafolio' : 'Publicar en portafolio'}
               </Button>
            )}
          </div>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 rounded-sm border border-red-500 bg-red-500/10 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="space-y-6">
        {/* Titulo */}
        <div>
          <label className="block text-sm font-medium text-text-heading mb-2">
            Título *
          </label>
           <input
             type="text"
             value={form.titulo}
             onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('titulo', e.target.value)}
             placeholder="Ej: Cocina integral en roble — Chicó"
             required
             className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
           />
        </div>

        {/* Descripción Comercial */}
        <div>
          <label className="block text-sm font-medium text-text-heading mb-2">
            Descripción comercial
          </label>
           <textarea
             value={form.descripcionComercial}
             onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleChange('descripcionComercial', e.target.value)}
             placeholder="Descripción breve para el portafolio público..."
             rows={3}
             className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 py-2 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
           />
        </div>

        {/* Categoría y Tipo */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-text-heading mb-2">
              Categoría de espacio *
            </label>
             <select
               value={form.categoriaEspacio}
               onChange={(e: ChangeEvent<HTMLSelectElement>) => handleChange('categoriaEspacio', e.target.value)}
               required
               className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
             >
               <option value="">Seleccionar categoría</option>
               {categoriasEspacio.map(cat => (
                 <option key={cat} value={cat}>
                   {cat.replace('_', ' ')}
                 </option>
               ))}
             </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-heading mb-2">
              Tipo de proyecto
            </label>
             <select
               value={form.tipoProyecto}
               onChange={(e: ChangeEvent<HTMLSelectElement>) => handleChange('tipoProyecto', e.target.value)}
               className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
             >
               <option value="">Seleccionar tipo</option>
               {tiposProyecto.map(tipo => (
                 <option key={tipo} value={tipo}>{tipo}</option>
               ))}
             </select>
          </div>
        </div>

        {/* Barrio */}
        <div>
          <label className="block text-sm font-medium text-text-heading mb-2">
            Barrio (ubicación real, no inventado — I-049)
          </label>
           <input
             type="text"
             value={form.barrio}
             onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('barrio', e.target.value)}
             placeholder="Ej: Chicó, Chapinero, Rosales"
             className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
           />
        </div>

        {/* Materiales destacados */}
        <div>
          <label className="block text-sm font-medium text-text-heading mb-2">
            Materiales destacados (separados por coma)
          </label>
           <input
             type="text"
             value={form.materialesDestacados}
             onChange={(e: ChangeEvent<HTMLInputElement>) => handleMaterialesChange(e.target.value)}
             placeholder="Ej: Roble, Granito, Acero inoxidable"
             className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
           />
        </div>

        {/* Precio referencial */}
        <div>
          <label className="block text-sm font-medium text-text-heading mb-2">
            Precio referencial (F-03 R2: rango estimado, nunca cifra exacta)
          </label>
           <input
             type="text"
             value={form.precioReferencial}
             onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('precioReferencial', e.target.value)}
             placeholder="Ej: desde $8.000.000 COP"
             className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
           />
        </div>

        {/* Imagen principal (opcional: puede ser la primera de la galería) */}
        <div>
          <label className="block text-sm font-medium text-text-heading mb-2">
            URL de imagen principal (opcional)
          </label>
           <input
             type="text"
             value={form.imagenPortafolioUrl}
             onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('imagenPortafolioUrl', e.target.value)}
             placeholder="Ej: https://r2.cloud/portafolio/cocina-diaz-hero.jpg"
             className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
           />
          <p className="text-xs text-text-muted mt-1">
            Si no se especifica, se usará la primera imagen de la galería.
          </p>
        </div>

        {/* Galería de imágenes (subida automática a R2) */}
        <div>
          <label className="block text-sm font-medium text-text-heading mb-2">
            Galería de imágenes (máx. 10)
          </label>
          <ImagePicker
            label="Arrastrar imágenes aquí o hacer clic para seleccionar"
            value={form.galeriaPortafolioUrl}
            onChange={(urls) => setForm(prev => ({ ...prev, galeriaPortafolioUrl: urls.slice(0, 10) }))}
            multiple={true}
            uploadToR2={true}
            r2Prefix="portafolio"
          />
          <p className="text-xs text-text-muted mt-1">
            Las imágenes se subirán automáticamente a R2. Máximo 10 imágenes.
          </p>
        </div>

        {/* Orden y Destacado */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-text-heading mb-2">
              Orden (menor = primero en el grid)
            </label>
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

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-text-heading mb-2">
            Slug (URL amigable)
          </label>
           <input
             type="text"
             value={form.slug}
             onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('slug', e.target.value)}
             placeholder="Ej: cocina-compacta-diaz"
             className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
           />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-4">
          <LinkButton href={`/erp/proyectos/${proyectoId}`} variant="secondary">
            Volver al proyecto
          </LinkButton>
          <Button type="submit" disabled={isSaving} variant="primary">
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>

      {/* Existing Portafolio Info */}
      {portafolioEntry && (
        <section className="mt-8 rounded-lg border border-border-subtle bg-bg-raised p-6">
          <h3 className="font-semibold text-text-heading mb-4">Información actual del portafolio</h3>
          <div className="text-sm space-y-2">
            <p><span className="text-text-muted">ID:</span> {portafolioEntry.id}</p>
            <p><span className="text-text-muted">Proyecto:</span> {portafolioEntry.proyectoId}</p>
            <p><span className="text-text-muted">Publicado:</span> {portafolioEntry.publicado ? 'Sí' : 'No'}</p>
            <p><span className="text-text-muted">Destacado:</span> {portafolioEntry.destacado ? 'Sí' : 'No'}</p>
            <p><span className="text-text-muted">Orden:</span> {portafolioEntry.orden}</p>
            <p><span className="text-text-muted">Creado:</span> {new Date(portafolioEntry.createdAt).toLocaleString('es-CO')}</p>
          </div>
        </section>
      )}
    </div>
  )
}
