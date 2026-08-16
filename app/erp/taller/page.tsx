'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { Modal } from '@/components/veta/modal'
import { useDataStore, type Cliente, type Modulo, type Proyecto, type Instalacion, type CasoGarantia } from '@/lib/data'
import { transicionModuloValida } from '@/lib/modules/f4f5f6/gates'

const ESTADOS_MODULO = ['por_armar', 'en_armado', 'armado', 'en_calidad'] as const
type EstadoModulo = (typeof ESTADOS_MODULO)[number]
type EstadoInstalacion = 'programada' | 'en_curso' | 'instalada' | 'fallida'
type EstadoGarantia = 'reportado' | 'diagnosticado' | 'en_reparacion' | 'resuelto' | 'cerrado'

type EstadoGate = EstadoModulo | EstadoInstalacion | EstadoGarantia | 'instalacion' | 'garantia'

const ETIQUETA_ESTADO: Record<EstadoGate, string> = {
  por_armar: 'Por armar',
  en_armado: 'En armado',
  armado: 'Armado',
  en_calidad: 'En calidad',
  programada: 'Instalación',
  en_curso: 'En curso',
  instalada: 'Instalada',
  fallida: 'Fallida',
  reportado: 'Garantía',
  diagnosticado: 'Diagnosticado',
  en_reparacion: 'En reparación',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
  instalacion: 'Instalación',
  garantia: 'Garantía',
}

const CARDS_GATES: { id: EstadoGate; label: string; icon?: string }[] = [
  { id: 'por_armar', label: 'Por armar' },
  { id: 'en_armado', label: 'En armado' },
  { id: 'armado', label: 'Armado' },
  { id: 'en_calidad', label: 'En calidad' },
  { id: 'instalacion', label: 'Instalación' },
  { id: 'garantia', label: 'Garantía' },
]

const SIGUIENTE_ESTADO: Partial<Record<EstadoModulo, EstadoModulo>> = {
  por_armar: 'en_armado',
  en_armado: 'armado',
  armado: 'en_calidad',
}

const ACCION_AVANZAR: Partial<Record<EstadoModulo, string>> = {
  por_armar: 'Iniciar armado',
  en_armado: 'Completar armado',
  armado: 'Listo para calidad',
}

const BADGE_TONE: Record<EstadoModulo, 'neutral' | 'warning' | 'info' | 'danger'> = {
  por_armar: 'neutral',
  en_armado: 'warning',
  armado: 'info',
  en_calidad: 'warning',
}

interface ResumenProyecto {
  proyecto: Proyecto
  cliente: Cliente | undefined
  modulos: Modulo[]
  instalaciones: Instalacion[]
  casosGarantia: CasoGarantia[]
}

// D-07 (re-auditoría 2026-08-10): `diseno_taller_interaccion.md` pide explícitamente "instalación/
// garantía activa" y cards que "cuentan por estado" -- la implementación original contaba
// instalaciones.length > 0 / casosGarantia.length > 0 sin mirar el estado, así que un proyecto ya
// instalado o con garantía cerrada seguía inflando el conteo/filtro de la fila del taller para
// siempre. Acá se define qué es "activo" para cada uno, según su propia máquina de estados.
const INSTALACION_ACTIVA = new Set<EstadoInstalacion>(['programada', 'en_curso'])
const GARANTIA_ACTIVA = new Set<EstadoGarantia>(['reportado', 'diagnosticado', 'en_reparacion'])

export default function TallerPage() {
  const store = useDataStore()
  const version = store.getVersion()
  const [filtroActivo, setFiltroActivo] = useState<EstadoGate | null>(null)
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<string | null>(null)

  // Agregar datos por proyecto
  const resumenPorProyecto = useMemo(() => {
    const resultado: ResumenProyecto[] = []
    store.proyectos.listar().forEach(proyecto => {
      const cliente = proyecto.clienteId ? store.clientes.obtenerPorId(proyecto.clienteId) : undefined
      const modulos = store.modulos.porProyecto(proyecto.id)
      const modulosTaller = modulos.filter(m => ESTADOS_MODULO.includes(m.estado as EstadoModulo))
      const instalaciones = store.instalaciones.porProyecto(proyecto.id)
      const casosGarantia = store.casosGarantia.porProyecto(proyecto.id)

      // Solo entra a la fila del taller si tiene trabajo pendiente en alguno de los 3 frentes --
      // modulosTaller ya está filtrado a estados activos; instalaciones/casosGarantia se validan
      // igual acá para no listar proyectos 100% resueltos (D-07, re-auditoría 2026-08-10). El
      // detalle del modal sigue mostrando el historial completo, no solo lo activo.
      if (
        modulosTaller.length > 0 ||
        instalaciones.some(i => INSTALACION_ACTIVA.has(i.estado)) ||
        casosGarantia.some(c => GARANTIA_ACTIVA.has(c.estado))
      ) {
        resultado.push({
          proyecto,
          cliente,
          modulos: modulosTaller,
          instalaciones,
          casosGarantia,
        })
      }
    })
    return resultado
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, version])

  // Contar totales por gate
  const totalesPorGate = useMemo(() => {
    const counts: Record<EstadoGate, number> = {
      por_armar: 0,
      en_armado: 0,
      armado: 0,
      en_calidad: 0,
      instalacion: 0,
      garantia: 0,
      programada: 0,
      en_curso: 0,
      instalada: 0,
      fallida: 0,
      reportado: 0,
      diagnosticado: 0,
      en_reparacion: 0,
      resuelto: 0,
      cerrado: 0,
    }

    resumenPorProyecto.forEach(resumen => {
      // Contar módulos por estado
      resumen.modulos.forEach(m => {
        if (ESTADOS_MODULO.includes(m.estado as EstadoModulo)) {
          counts[m.estado as EstadoModulo]++
        }
      })

      // Contar instalaciones activas (programada/en_curso) -- una ya instalada o fallida no es
      // trabajo pendiente para la fila del taller.
      if (resumen.instalaciones.some(i => INSTALACION_ACTIVA.has(i.estado))) {
        counts.instalacion++
      }

      // Contar garantías activas (reportado/diagnosticado/en_reparacion) -- resuelto/cerrado no
      // es trabajo pendiente.
      if (resumen.casosGarantia.some(c => GARANTIA_ACTIVA.has(c.estado))) {
        counts.garantia++
      }
    })

    return counts
  }, [resumenPorProyecto])

  // Filtrar proyectos según el gate activo
  const proyectosFiltrados = useMemo(() => {
    if (!filtroActivo) {
      return resumenPorProyecto
    }

    return resumenPorProyecto.filter(resumen => {
      if (filtroActivo === 'instalacion') {
        return resumen.instalaciones.some(i => INSTALACION_ACTIVA.has(i.estado))
      }
      if (filtroActivo === 'garantia') {
        return resumen.casosGarantia.some(c => GARANTIA_ACTIVA.has(c.estado))
      }
      // Para estados de módulo
      return resumen.modulos.some(m => m.estado === filtroActivo)
    })
  }, [resumenPorProyecto, filtroActivo])

  // Obtener resumen de conteos de un proyecto
  const conteosPorProyecto = (resumen: ResumenProyecto) => {
    const counts: Partial<Record<EstadoModulo, number>> = {
      por_armar: 0,
      en_armado: 0,
      armado: 0,
      en_calidad: 0,
    }
    resumen.modulos.forEach(m => {
      if (ESTADOS_MODULO.includes(m.estado as EstadoModulo)) {
        counts[m.estado as EstadoModulo]!++
      }
    })
    return counts
  }

  const proyectoActual = proyectoSeleccionado
    ? resumenPorProyecto.find(r => r.proyecto.id === proyectoSeleccionado)
    : null

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-text-heading">Fila del Taller</h1>
        <p className="text-sm text-text-muted mt-2">
          Avance de producción: módulos, instalación y garantía
        </p>
      </header>

      {/* Cards de gate como filtros */}
      <div className="grid gap-3 sm:grid-cols-6 mb-8">
        {CARDS_GATES.map(gate => {
          const count = totalesPorGate[gate.id]
          const isActive = filtroActivo === gate.id
          return (
            <button
              key={gate.id}
              onClick={() => setFiltroActivo(isActive ? null : gate.id)}
              className={`rounded-lg border p-4 transition-all ${
                isActive
                  ? 'border-action-primary bg-action-primary/10 ring-2 ring-action-primary/30'
                  : 'border-border-subtle bg-bg-raised hover:border-border-strong'
              }`}
            >
              <p className="text-xs font-semibold uppercase text-text-muted">{gate.label}</p>
              <p className="text-2xl font-bold text-text-heading mt-2">{count}</p>
            </button>
          )
        })}
      </div>

      {/* Lista de proyectos */}
      {proyectosFiltrados.length === 0 ? (
        <p className="text-sm text-text-muted italic">
          {filtroActivo ? 'Sin proyectos en este filtro.' : 'Sin proyectos en la fila del taller.'}
        </p>
      ) : (
        <div className="space-y-3">
          {proyectosFiltrados.map(resumen => {
            const conteos = conteosPorProyecto(resumen)
            return (
              <button
                key={resumen.proyecto.id}
                onClick={() => setProyectoSeleccionado(resumen.proyecto.id)}
                className="w-full text-left rounded-lg border border-border-subtle bg-bg-raised p-4 hover:border-border-strong hover:bg-bg-alt/20 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-heading">{resumen.proyecto.nombreProyecto}</h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      Cliente: {resumen.cliente?.nombre ?? '—'} · Obra: {resumen.proyecto.direccionObra ?? '—'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end items-center">
                    {Object.entries(conteos).map(([estado, count]) => {
                      if (count === 0) return null
                      return (
                        <Badge key={estado} tone={BADGE_TONE[estado as EstadoModulo]} dot>
                          {count}
                        </Badge>
                      )
                    })}
                    {resumen.instalaciones.some(i => INSTALACION_ACTIVA.has(i.estado)) && (
                      <Badge tone="info" dot>
                        Inst.
                      </Badge>
                    )}
                    {resumen.casosGarantia.some(c => GARANTIA_ACTIVA.has(c.estado)) && (
                      <Badge tone="warning" dot>
                        Grt.
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Modal de detalle */}
      {proyectoActual && (
        <Modal
          open={!!proyectoSeleccionado}
          onClose={() => setProyectoSeleccionado(null)}
          title={`${proyectoActual.proyecto.nombreProyecto} - Detalle de módulos`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2 text-xs text-text-muted pb-2 border-b border-border-subtle">
              <div>Módulo</div>
              <div className="text-center">Cant.</div>
              <div className="text-center">Horas</div>
              <div className="text-right">Acción</div>
            </div>

            {proyectoActual.modulos.length === 0 ? (
              <p className="text-sm text-text-muted italic py-4">Sin módulos en taller.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {proyectoActual.modulos.map(modulo => {
                  const estado = modulo.estado as EstadoModulo
                  const siguiente = SIGUIENTE_ESTADO[estado]
                  const puedeAvanzar = !!siguiente && transicionModuloValida(estado, siguiente)
                  return (
                    <div key={modulo.id} className="grid grid-cols-4 gap-2 items-center p-2 bg-bg-alt/50 rounded-md text-sm">
                      <div className="font-medium text-text-heading">
                        {modulo.nombre}
                        <p className="text-xs text-text-muted">{modulo.tipoModulo ?? '—'}</p>
                      </div>
                      <div className="text-center font-mono text-text-heading">{modulo.cantidad}</div>
                      <div className="text-center font-mono text-text-muted">{modulo.horasEstimadas}h</div>
                      <div className="flex justify-end gap-2">
                        <Badge tone={BADGE_TONE[estado]} dot>
                          {ETIQUETA_ESTADO[estado]}
                        </Badge>
                        {puedeAvanzar && siguiente && (
                          <Button
                            variant={estado === 'armado' ? 'primary' : 'secondary'}
                            size="md"
                            onClick={async () => await store.modulos.actualizarEstado(modulo.id, siguiente)}
                          >
                            {ACCION_AVANZAR[estado]}
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Resumen de instalación y garantía */}
            {(proyectoActual.instalaciones.length > 0 || proyectoActual.casosGarantia.length > 0) && (
              <div className="border-t border-border-subtle pt-4 mt-4">
                {proyectoActual.instalaciones.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold uppercase text-text-muted mb-1">Instalación</p>
                    <p className="text-sm text-text-heading">
                      {proyectoActual.instalaciones.length} instalación(es) programada(s)
                    </p>
                  </div>
                )}
                {proyectoActual.casosGarantia.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-text-muted mb-1">Garantía</p>
                    <p className="text-sm text-text-heading">
                      {proyectoActual.casosGarantia.length} caso(s) de garantía
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
