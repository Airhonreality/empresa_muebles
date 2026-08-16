'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { ImagePicker } from '@/components/veta/image-picker'
import { useDataStore } from '@/lib/data'

export default function RetomaPage() {
  const params = useParams()
  const router = useRouter()
  const proyectoId = params.proyectoId as string
  const store = useDataStore()
  const version = store.getVersion()

  const proyecto = store.proyectos.obtenerPorId(proyectoId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const retomaExistente = useMemo(() => proyecto ? store.retomas.porProyecto(proyectoId) : undefined, [proyectoId, store, version])

  const [medidas, setMedidas] = useState<Record<string, unknown>>({})
  const [fotos, setFotos] = useState<string[]>([])
  const [anomaliaDetectada, setAnomaliaDetectada] = useState(false)
  const [guardando, setGuardando] = useState(false)

  // Cargar retoma existente
  useEffect(() => {
    if (retomaExistente) {
      setMedidas(retomaExistente.medidas ?? {})
      setFotos(retomaExistente.fotos ?? [])
      setAnomaliaDetectada(retomaExistente.anomaliaDetectada ?? false)
    }
  }, [retomaExistente])

  const handleGuardar = useCallback(async () => {
    if (!proyecto) return
    setGuardando(true)
    try {
      await store.retomas.guardar(proyectoId, {
        medidas: Object.keys(medidas).length > 0 ? medidas : undefined,
        fotos,
        anomaliaDetectada,
      })
      // Auto-save feedback
      setTimeout(() => setGuardando(false), 500)
    } catch (err) {
      console.error('Error guardando retoma:', err)
      setGuardando(false)
    }
  }, [proyectoId, store, proyecto, medidas, fotos, anomaliaDetectada])

  // Auto-save con debounce de 2 segundos
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!proyecto) return
      try {
        await store.retomas.guardar(proyectoId, {
          medidas: Object.keys(medidas).length > 0 ? medidas : undefined,
          fotos,
          anomaliaDetectada,
        })
      } catch (err) {
        console.error('Error en auto-save de retoma:', err)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [medidas, fotos, anomaliaDetectada, proyecto, proyectoId, store])

  if (!proyecto) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-text-muted">Proyecto no encontrado</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-text-heading">
              Retoma de Medidas
            </h1>
            <p className="text-sm text-text-muted mt-2">
              {proyecto.nombreProyecto}
            </p>
          </div>
          <Button
            variant="ghost"
            size="md"
            onClick={() => router.back()}
          >
            ← Volver
          </Button>
        </div>
      </header>

      {/* Form */}
      <div className="rounded-lg border border-border-subtle bg-bg-raised p-6 space-y-6">
        {/* Medidas */}
        <div>
          <label className="block text-sm font-semibold text-text-heading mb-2">
            Medidas
          </label>
          <p className="text-xs text-text-muted mb-3">
            Registra las medidas tomadas en obra (libre).
          </p>
          <textarea
            value={JSON.stringify(medidas, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value)
                setMedidas(parsed)
              } catch {
                setMedidas({ texto: e.target.value })
              }
            }}
            rows={6}
            placeholder={`{\n  "módulo_1": {\n    "largo": "250cm",\n    "ancho": "180cm",\n    "alto": "85cm"\n  }\n}`}
            className="w-full rounded border border-border-subtle bg-bg-paper px-3 py-2 font-mono text-xs text-text-heading focus:border-gold-400 focus:outline-none"
          />
        </div>

        {/* Fotos */}
        <div>
          <ImagePicker
            label="Fotos de la retoma"
            value={fotos}
            onChange={setFotos}
            multiple={true}
          />
        </div>

        {/* Anomalía */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded border border-border-subtle hover:bg-bg-alt/50 transition-colors duration-fast">
            <input
              type="checkbox"
              checked={anomaliaDetectada}
              onChange={(e) => setAnomaliaDetectada(e.target.checked)}
              className="w-4 h-4 rounded border-border-subtle cursor-pointer"
            />
            <div className="flex-1">
              <span className="text-sm font-semibold text-text-heading">
                Anomalía detectada
              </span>
              <p className="text-xs text-text-muted mt-1">
                Al marcar esto, se registra un cambio de contrato que puede afectar el cronograma.
              </p>
            </div>
          </label>
        </div>

        {/* Estado */}
        {retomaExistente && (
          <div className="pt-4 border-t border-border-subtle">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-text-muted">Última actualización</p>
                <p className="text-sm text-text-heading mt-1">
                  {new Date(retomaExistente.updatedAt).toLocaleString('es-CO')}
                </p>
              </div>
              {anomaliaDetectada && (
                <Badge tone="warning" dot>Anomalía registrada</Badge>
              )}
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex items-center gap-2 pt-4 border-t border-border-subtle">
          <Button
            variant="primary"
            size="md"
            onClick={handleGuardar}
            disabled={guardando}
          >
            {guardando ? 'Guardando...' : 'Guardar retoma'}
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}
