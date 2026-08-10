'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { ImagePicker } from '@/components/veta/image-picker'
import { useDataStore, type EstadoActaEntrega } from '@/lib/data'

const ETIQUETA_ESTADO: Record<EstadoActaEntrega, string> = {
  generada: 'Generada',
  enviada: 'Enviada',
  firmada: 'Firmada',
}

const BADGE_TONE: Record<EstadoActaEntrega, 'neutral' | 'warning' | 'info' | 'danger'> = {
  generada: 'neutral',
  enviada: 'warning',
  firmada: 'info',
}

export default function EntregaPage() {
  const params = useParams()
  const router = useRouter()
  const proyectoId = params.proyectoId as string
  const store = useDataStore()
  const version = store.getVersion()

  const proyecto = store.proyectos.obtenerPorId(proyectoId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const instalaciones = useMemo(() => proyecto ? store.instalaciones.porProyecto(proyectoId) : [], [proyectoId, store, version])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const acta = useMemo(() => proyecto ? store.actasEntrega.porProyecto(proyectoId) : undefined, [proyectoId, store, version])

  const [holgura, setHolgura] = useState('12')
  const [observaciones, setObservaciones] = useState('')
  const [fotos, setFotos] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  if (!proyecto) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-text-muted">Proyecto no encontrado</p>
      </div>
    )
  }

  const instalada = instalaciones.some(i => i.estado === 'instalada')

  const parseNum = (s: string): number => {
    const n = Number(s)
    return Number.isFinite(n) ? n : 0
  }

  const handleGenerar = () => {
    setError(null)
    if (!instalada) {
      setError('No se puede generar el acta: la instalación no está marcada como "Instalada" (R1).')
      return
    }
    const holguraDias = parseNum(holgura)
    if (holguraDias <= 0) {
      setError('La holgura operativa debe ser un número mayor a 0 días.')
      return
    }
    const resultado = store.actasEntrega.generar(proyectoId, {
      holguraOperativaDias: holguraDias,
      fotos,
      observaciones: observaciones.trim() || null,
    })
    if (!resultado) {
      setError('No se pudo generar el acta: se requiere una instalación "Instalada" previa.')
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-heading">Acta de Entrega — Cierre E-26</h1>
          <p className="text-sm text-text-muted mt-1">{proyecto.nombreProyecto}</p>
        </div>
        <Button variant="ghost" size="md" onClick={() => router.back()}>
          ← Volver
        </Button>
      </header>

      {!acta ? (
        /* --- Generar acta --- */
        <section className="mb-6 rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
          <div className="border-b border-border-subtle px-4 py-3">
            <h2 className="font-semibold text-text-heading">Generar acta de entrega</h2>
          </div>
          <div className="px-4 py-4 space-y-3">
            {!instalada && (
              <div className="rounded border border-amber-300 bg-amber-50/80 p-3 text-sm text-amber-800">
                No se puede generar el acta: el proyecto no tiene una instalación marcada como &quot;Instalada&quot; (R1).
              </div>
            )}

            <label className="flex flex-col gap-1">
              <span className="text-xs text-text-muted">Holgura operativa (días)* — default 12</span>
              <input
                type="number"
                min="1"
                value={holgura}
                onChange={(e) => setHolgura(e.target.value)}
                className="w-full max-w-xs rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-text-muted">Observaciones</span>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
                placeholder="Ej. Se entregan llaves de los cajones y remanente de tableros"
                className="rounded border border-border-subtle bg-bg-raised px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
              />
            </label>
            <ImagePicker label="Fotos de entrega" value={fotos} onChange={setFotos} />

            {error && (
              <div className="rounded border border-red-300 bg-red-50/80 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button variant="primary" size="md" disabled={!instalada} onClick={handleGenerar}>
              Generar acta (PDF)
            </Button>
          </div>
        </section>
      ) : (
        /* --- Acta existente --- */
        <section className="mb-6 rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
          <div className="border-b border-border-subtle px-4 py-3 flex items-center justify-between gap-2">
            <h2 className="font-semibold text-text-heading">Acta de entrega</h2>
            <Badge tone={BADGE_TONE[acta.estado]} dot>
              {ETIQUETA_ESTADO[acta.estado]}
            </Badge>
          </div>
          <div className="px-4 py-4 space-y-3">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-text-muted">PDF</dt>
                <dd>
                  {acta.pdfUrl ? (
                    <a
                      href={acta.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-mono text-brand underline underline-offset-2"
                    >
                      {acta.pdfUrl}
                    </a>
                  ) : (
                    <span className="text-sm text-text-muted">Sin PDF</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">Holgura operativa</dt>
                <dd className="text-sm font-mono text-text-heading">{acta.holguraOperativaDias} días</dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">Estado del proyecto</dt>
                <dd className="text-sm text-text-heading">{proyecto.estado.replace(/_/g, ' ')}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">Creada</dt>
                <dd className="text-sm text-text-muted">{new Date(acta.createdAt).toLocaleDateString('es-CO')}</dd>
              </div>
            </dl>

            {acta.observaciones && (
              <p className="text-sm text-text-muted">
                Observaciones: <span className="text-text-heading">{acta.observaciones}</span>
              </p>
            )}

            {acta.fotos.length > 0 && (
              <div>
                <p className="text-xs text-text-muted mb-2">Fotos de entrega ({acta.fotos.length})</p>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {acta.fotos.map((url) => (
                    <div key={url} className="aspect-square overflow-hidden rounded-sm border border-border-subtle bg-bg-paper">
                      {/* eslint-disable-next-line @next/next/no-img-element -- URLs mock/blob: temporales, no assets estáticos optimizables */}
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {acta.estado === 'generada' && (
              <div className="pt-1">
                <Button variant="primary" size="md" onClick={() => store.actasEntrega.enviar(acta.id)}>
                  Enviar al cliente
                </Button>
              </div>
            )}

            {acta.estado === 'enviada' && (
              <div className="space-y-2 pt-1">
                <p className="text-xs text-text-muted">
                  Firma digital diferida (compartida con E-13): por ahora se registra manualmente.
                </p>
                <Button variant="primary" size="md" onClick={() => store.actasEntrega.firmar(acta.id)}>
                  Registrar como firmada
                </Button>
              </div>
            )}

            {acta.estado === 'firmada' && (
              <p className="text-sm text-text-muted italic pt-1">
                Acta firmada. El proyecto pasó a estado &quot;Entregado&quot; (E-26).
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
