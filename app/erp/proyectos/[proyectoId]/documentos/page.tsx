'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { Modal } from '@/components/veta/modal'
import { ImagePicker } from '@/components/veta/image-picker'
import { useDataStore, type DocumentoProyecto, type MacroFaseProyecto, type AlojadorDocumento } from '@/lib/data'

const MACRO_FASES: MacroFaseProyecto[] = ['pre_venta', 'cotizacion', 'produccion', 'instalacion', 'post_venta']

const ETAPA_LABELS: Record<MacroFaseProyecto, string> = {
  pre_venta: 'Pre-venta',
  cotizacion: 'Cotización',
  produccion: 'Producción',
  instalacion: 'Instalación',
  post_venta: 'Post-venta',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
}

type Tab = 'imagen' | 'drive'

export default function DocumentosPage() {
  const params = useParams()
  const router = useRouter()
  const proyectoId = params.proyectoId as string
  const store = useDataStore()
  const version = store.getVersion()

  const proyecto = store.proyectos.obtenerPorId(proyectoId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const documentos = useMemo(() => proyecto ? store.documentosProyecto.porProyecto(proyectoId) : [], [proyectoId, store, version])

  const [modalAbierto, setModalAbierto] = useState(false)
  const [tab, setTab] = useState<Tab>('imagen')
  const [etapa, setEtapa] = useState<MacroFaseProyecto>('pre_venta')
  const [nombre, setNombre] = useState('')
  const [imagenes, setImagenes] = useState<string[]>([])
  const [urlDrive, setUrlDrive] = useState('')
  const [idAEliminar, setIdAEliminar] = useState<string | null>(null)

  if (!proyecto) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-text-muted">Proyecto no encontrado</p>
      </div>
    )
  }

  const documentosPorEtapa = MACRO_FASES.map(fase => ({
    fase,
    items: documentos.filter(d => d.etapa === fase),
  })).filter(grupo => grupo.items.length > 0)

  const handleSubmitImagen = async () => {
    if (imagenes.length === 0) return
    await store.documentosProyecto.crear({
      proyectoId,
      etapa,
      alojador: 'r2',
      url: imagenes[0],
      nombre: nombre || `Imagen ${ETAPA_LABELS[etapa]}`,
    })
    resetForm()
    setModalAbierto(false)
  }

  const handleSubmitDrive = async () => {
    if (!urlDrive.trim()) return
    await store.documentosProyecto.crear({
      proyectoId,
      etapa,
      alojador: 'drive_veta_erp',
      url: urlDrive.trim(),
      nombre: nombre || `Enlace Drive ${ETAPA_LABELS[etapa]}`,
    })
    resetForm()
    setModalAbierto(false)
  }

  const handleEliminar = async () => {
    if (!idAEliminar) return
    await store.documentosProyecto.eliminar(idAEliminar)
    setIdAEliminar(null)
  }

  const resetForm = () => {
    setTab('imagen')
    setEtapa('pre_venta')
    setNombre('')
    setImagenes([])
    setUrlDrive('')
  }

  const alojadorTone = (alojador: AlojadorDocumento): 'info' | 'neutral' =>
    alojador === 'r2' ? 'info' : 'neutral'

  const alojadorLabel = (alojador: AlojadorDocumento): string =>
    alojador === 'r2' ? 'Imagen (R2)' : 'Enlace de Drive'

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-heading">Documentación del proyecto</h1>
          <p className="text-sm text-text-muted mt-1">{proyecto.nombreProyecto}</p>
        </div>
        <Button variant="ghost" size="md" onClick={() => router.back()}>
          ← Volver
        </Button>
      </header>

      <section className="mb-6 flex justify-end">
        <Button variant="primary" size="md" onClick={() => { resetForm(); setModalAbierto(true) }}>
          Agregar documento
        </Button>
      </section>

      {documentos.length === 0 ? (
        <section className="rounded-lg border border-border-subtle bg-bg-raised p-8 text-center">
          <p className="text-sm text-text-muted italic">Sin documentos cargados. Usá &quot;Agregar documento&quot; para subir imágenes o pegar enlaces de Drive.</p>
        </section>
      ) : (
        <div className="space-y-8">
          {documentosPorEtapa.map(({ fase, items }) => (
            <section key={fase} className="rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
              <div className="border-b border-border-subtle px-4 py-3">
                <h2 className="font-semibold text-text-heading">{ETAPA_LABELS[fase]}</h2>
              </div>
              <div className="p-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((doc: DocumentoProyecto) => (
                    <div key={doc.id} className="rounded border border-border-subtle bg-bg-alt/30 overflow-hidden">
                      {doc.alojador === 'r2' ? (
                        <div className="aspect-video bg-bg-paper">
                          {/* eslint-disable-next-line @next/next/no-img-element -- URL mock/blob: temporal, no asset estático optimizable */}
                          <img src={doc.url} alt={doc.nombre} className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="aspect-video flex items-center justify-center bg-bg-paper">
                          <span className="text-4xl">🔗</span>
                        </div>
                      )}
                      <div className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-text-heading line-clamp-1">{doc.nombre}</p>
                          <Badge tone={alojadorTone(doc.alojador)}>
                            {alojadorLabel(doc.alojador)}
                          </Badge>
                        </div>
                        <p className="text-xs text-text-muted">{formatDate(doc.createdAt)}</p>
                        <Button
                          variant="destructive"
                          size="md"
                          className="w-full"
                          onClick={() => setIdAEliminar(doc.id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

      <Modal open={modalAbierto} onClose={() => setModalAbierto(false)} title="Agregar documento">
        <div className="space-y-4">
          <div className="flex gap-2 border-b border-border-subtle">
            <button
              type="button"
              onClick={() => setTab('imagen')}
              className={`px-4 py-2 text-sm font-medium transition-colors duration-fast border-b-2 -mb-px ${
                tab === 'imagen'
                  ? 'border-gold-400 text-text-heading'
                  : 'border-transparent text-text-muted hover:text-text-heading'
              }`}
            >
              Imagen (R2)
            </button>
            <button
              type="button"
              onClick={() => setTab('drive')}
              className={`px-4 py-2 text-sm font-medium transition-colors duration-fast border-b-2 -mb-px ${
                tab === 'drive'
                  ? 'border-gold-400 text-text-heading'
                  : 'border-transparent text-text-muted hover:text-text-heading'
              }`}
            >
              Enlace de Drive
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="doc-nombre" className="text-sm font-medium text-text-muted">Nombre (opcional)</label>
            <input
              id="doc-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Fotos de armado, texturas SketchUp..."
              className="min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-sm text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="doc-etapa" className="text-sm font-medium text-text-muted">Etapa</label>
            <select
              id="doc-etapa"
              value={etapa}
              onChange={(e) => setEtapa(e.target.value as MacroFaseProyecto)}
              className="min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-sm text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
            >
              {MACRO_FASES.map(f => (
                <option key={f} value={f}>{ETAPA_LABELS[f]}</option>
              ))}
            </select>
          </div>

          {tab === 'imagen' ? (
            <div className="space-y-3">
              <ImagePicker
                label="Subir imagen"
                value={imagenes}
                onChange={setImagenes}
                multiple={false}
              />
              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  size="md"
                  disabled={imagenes.length === 0}
                  onClick={handleSubmitImagen}
                >
                  Guardar imagen
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col gap-2">
                <label htmlFor="doc-url-drive" className="text-sm font-medium text-text-muted">URL de Google Drive</label>
                <input
                  id="doc-url-drive"
                  type="url"
                  value={urlDrive}
                  onChange={(e) => setUrlDrive(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-sm text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
                />
              </div>
              <p className="text-xs text-text-muted">
                Pegá el enlace de la carpeta o archivo de Drive ya sincronizado localmente. El sistema no verifica que el enlace sea válido.
              </p>
              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  size="md"
                  disabled={!urlDrive.trim()}
                  onClick={handleSubmitDrive}
                >
                  Guardar enlace
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal open={idAEliminar !== null} onClose={() => setIdAEliminar(null)} title="Eliminar documento">
        <div className="space-y-4">
          <p className="text-sm text-text-muted">¿Estás seguro de que querés eliminar este documento? Esta acción no se puede deshacer.</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="md" onClick={() => setIdAEliminar(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" size="md" onClick={handleEliminar}>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
