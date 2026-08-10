'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { useDataStore } from '@/lib/data'

export default function DesarrolloPage() {
  const params = useParams()
  const router = useRouter()
  const proyectoId = params.proyectoId as string
  const store = useDataStore()
  const version = store.getVersion()

  const proyecto = store.proyectos.obtenerPorId(proyectoId)
  const usuario = store.auth.usuarioActual()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const schemas = useMemo(() => proyecto ? store.schemas.porProyecto(proyectoId) : [], [proyectoId, store, version])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const verificaciones = useMemo(() => proyecto ? store.verificaciones.porProyecto(proyectoId) : [], [proyectoId, store, version])

  const schemaActual = schemas.length > 0 ? schemas.sort((a, b) => b.version - a.version)[0] : null
  const bomActual = schemaActual ? store.bom.porSchema(schemaActual.id) : []
  const verificacionSchema = verificaciones.find(v => v.tipoGate === 'schema')

  const [rechazoDiagnostico, setRechazoDiagnostico] = useState('')
  const [procesando, setProcesando] = useState(false)

  // Guard R6: verificador único
  const puedeAprobar = proyecto?.verificadorId === usuario.id

  if (!proyecto) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-text-muted">Proyecto no encontrado</p>
      </div>
    )
  }

  const handleCrearSchema = () => {
    const nuevoSchema = store.schemas.crear(proyectoId)
    store.bom.crear({
      schemaId: nuevoSchema.id,
      productoId: null,
      cantidad: '1',
      unidad: 'unidad',
      origen: 'desarrollo',
      homologable: true,
    })
  }

  const handleAprobar = () => {
    if (!schemaActual || !puedeAprobar) return
    setProcesando(true)
    try {
      store.verificaciones.emitirVeredicto({
        proyectoId,
        tipoGate: 'schema',
        veredicto: 'aprobado',
        verificadorId: usuario.id,
      })
      store.schemas.actualizarEstado(schemaActual.id, 'aprobado_compras')
      setTimeout(() => setProcesando(false), 500)
    } catch (err) {
      console.error('Error aprobando schema:', err)
      setProcesando(false)
    }
  }

  const handleRechazar = () => {
    if (!schemaActual || !rechazoDiagnostico.trim()) return
    setProcesando(true)
    try {
      store.verificaciones.emitirVeredicto({
        proyectoId,
        tipoGate: 'schema',
        veredicto: 'rechazado',
        verificadorId: usuario.id,
      })
      store.schemas.actualizarEstado(schemaActual.id, 'en_reproceso')
      setRechazoDiagnostico('')
      setTimeout(() => setProcesando(false), 500)
    } catch (err) {
      console.error('Error rechazando schema:', err)
      setProcesando(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-text-heading">
              Esquema y Veredicto
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

      {/* Esquema actual */}
      {schemaActual ? (
        <div className="rounded-lg border border-border-subtle bg-bg-raised p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-text-heading">
                Esquema v{schemaActual.version}
              </h3>
              <p className="text-sm text-text-muted mt-1">
                Creado: {new Date(schemaActual.createdAt).toLocaleDateString('es-CO')}
              </p>
            </div>
            <Badge tone={
              schemaActual.estado === 'aprobado_compras' ? 'info' :
              schemaActual.estado === 'para_revision' ? 'warning' :
              schemaActual.estado === 'en_reproceso' ? 'danger' :
              'neutral'
            }>
              {schemaActual.estado}
            </Badge>
          </div>

          {/* BOM */}
          {bomActual.length > 0 && (
            <div className="mt-4 p-4 bg-bg-alt rounded border border-border-subtle/50">
              <p className="text-xs font-semibold uppercase text-text-muted mb-3">
                Materiales (BOM)
              </p>
              <div className="space-y-2">
                {bomActual.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm border-b border-border-subtle/30 pb-2 last:border-0">
                    <span className="text-text-heading">
                      {item.cantidad} {item.unidad}
                    </span>
                    <span className="text-xs text-text-muted">
                      Origen: {item.origen} {item.homologable ? '(homologable)' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border-subtle bg-bg-paper p-6 mb-6 text-center">
          <p className="text-text-muted mb-4">No hay esquema aún</p>
          <Button
            variant="primary"
            size="md"
            onClick={handleCrearSchema}
          >
            + Crear esquema
          </Button>
        </div>
      )}

      {/* Veredicto E-18 */}
      {schemaActual && schemaActual.estado === 'para_revision' && (
        <div className="rounded-lg border border-border-subtle bg-bg-raised p-6 mb-6">
          <h3 className="font-semibold text-text-heading mb-4">
            Veredicto del Gate (E-18)
          </h3>

          {/* Guard info */}
          {!puedeAprobar && (
            <div className="mb-4 p-3 rounded bg-amber-50/80 border border-amber-200 text-amber-800 text-sm">
              <p>
                Solo el verificador único (comercial vendedor) puede aprobar este esquema.
                {proyecto.verificadorId ? ` Verificador actual: ${proyecto.verificadorId.slice(0, 8)}...` : ' Sin verificador asignado.'}
              </p>
            </div>
          )}

          {/* Botón Aprobar */}
          {verificacionSchema?.veredicto !== 'aprobado' && (
            <div className="space-y-3">
              <Button
                variant="primary"
                size="md"
                onClick={handleAprobar}
                disabled={!puedeAprobar || procesando}
                title={!puedeAprobar ? 'Solo el verificador único puede aprobar' : undefined}
              >
                {procesando ? 'Aprobando...' : 'Aprobar esquema'}
              </Button>
            </div>
          )}

          {/* Botón Rechazar */}
          {verificacionSchema?.veredicto !== 'rechazado' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-text-heading mb-2">
                  Diagnóstico de rechazo (obligatorio)
                </label>
                <textarea
                  value={rechazoDiagnostico}
                  onChange={(e) => setRechazoDiagnostico(e.target.value)}
                  placeholder="Describe las razones del rechazo y qué debe corregirse..."
                  rows={4}
                  className="w-full rounded border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-heading focus:border-gold-400 focus:outline-none"
                />
              </div>
              <Button
                variant="ghost"
                size="md"
                onClick={handleRechazar}
                disabled={!rechazoDiagnostico.trim() || procesando}
              >
                {procesando ? 'Rechazando...' : 'Rechazar esquema'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Verificación completada */}
      {verificacionSchema && (
        <div className="rounded-lg border border-border-subtle bg-bg-raised p-6">
          <h3 className="font-semibold text-text-heading mb-3">Última verificación</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">
                Tipo de gate: {verificacionSchema.tipoGate}
              </p>
              <p className="text-sm text-text-muted mt-1">
                Fecha: {new Date(verificacionSchema.creadoEn).toLocaleDateString('es-CO')}
              </p>
            </div>
            <Badge tone={verificacionSchema.veredicto === 'aprobado' ? 'info' : 'danger'}>
              {verificacionSchema.veredicto}
            </Badge>
          </div>
        </div>
      )}
    </div>
  )
}
