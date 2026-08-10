'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { useDataStore, type Cliente, type Modulo, type Proyecto } from '@/lib/data'
import { transicionModuloValida } from '@/lib/modules/f4f5f6/gates'

const ESTADOS_TALLER = ['por_armar', 'en_armado', 'armado', 'en_calidad'] as const
type EstadoTaller = (typeof ESTADOS_TALLER)[number]

const ETIQUETA_ESTADO: Record<EstadoTaller, string> = {
  por_armar: 'Por armar',
  en_armado: 'En armado',
  armado: 'Armado',
  en_calidad: 'En calidad',
}

const SIGUIENTE_ESTADO: Partial<Record<EstadoTaller, EstadoTaller>> = {
  por_armar: 'en_armado',
  en_armado: 'armado',
  armado: 'en_calidad',
}

const ACCION_AVANZAR: Partial<Record<EstadoTaller, string>> = {
  por_armar: 'Iniciar armado',
  en_armado: 'Completar armado',
  armado: 'Listo para calidad',
}

const BADGE_TONE: Record<EstadoTaller, 'neutral' | 'warning' | 'info' | 'danger'> = {
  por_armar: 'neutral',
  en_armado: 'warning',
  armado: 'info',
  en_calidad: 'warning',
}

interface FilaTaller {
  proyecto: Proyecto
  cliente: Cliente | undefined
  modulo: Modulo
}

export default function TallerPage() {
  const store = useDataStore()
  const version = store.getVersion()

  const filas = useMemo(() => {
    const resultado: FilaTaller[] = []
    store.proyectos.listar().forEach(proyecto => {
      const cliente = proyecto.clienteId ? store.clientes.obtenerPorId(proyecto.clienteId) : undefined
      store.modulos.porProyecto(proyecto.id).forEach(modulo => {
        if (ESTADOS_TALLER.includes(modulo.estado as EstadoTaller)) {
          resultado.push({ proyecto, cliente, modulo })
        }
      })
    })
    return resultado
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, version])

  const agrupadas = useMemo(() => {
    const map = new Map<string, FilaTaller[]>()
    filas.forEach(fila => {
      const grupo = map.get(fila.proyecto.id) ?? []
      grupo.push(fila)
      map.set(fila.proyecto.id, grupo)
    })
    return Array.from(map.values())
  }, [filas])

  const totalesPorEstado = useMemo(() => {
    const counts: Record<EstadoTaller, number> = { por_armar: 0, en_armado: 0, armado: 0, en_calidad: 0 }
    filas.forEach(fila => {
      counts[fila.modulo.estado as EstadoTaller] += 1
    })
    return counts
  }, [filas])

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-text-heading">Fila del Taller</h1>
        <p className="text-sm text-text-muted mt-2">
          Avance de producción por módulo: por armar → en armado → armado → en calidad
        </p>
      </header>

      {/* Resumen por estado */}
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        {ESTADOS_TALLER.map(estado => (
          <div key={estado} className="rounded-lg border border-border-subtle bg-bg-raised p-4">
            <p className="text-xs font-semibold uppercase text-text-muted">{ETIQUETA_ESTADO[estado]}</p>
            <p className="text-2xl font-bold text-text-heading mt-2">{totalesPorEstado[estado]}</p>
          </div>
        ))}
      </div>

      {agrupadas.length === 0 ? (
        <p className="text-sm text-text-muted italic">Sin módulos en la fila del taller.</p>
      ) : (
        agrupadas.map(grupo => {
          const proyecto = grupo[0].proyecto
          const cliente = grupo[0].cliente
          return (
            <section key={proyecto.id} className="mb-6 rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
              <div className="border-b border-border-subtle bg-bg-alt/40 px-4 py-3">
                <h2 className="font-semibold text-text-heading">{proyecto.nombreProyecto}</h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Cliente: {cliente?.nombre ?? '—'} · Obra: {proyecto.direccionObra ?? '—'}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="border-b border-border-subtle text-left px-4 py-2 font-semibold text-text-heading">Módulo</th>
                      <th className="border-b border-border-subtle text-left px-4 py-2 font-semibold text-text-heading">Tipo</th>
                      <th className="border-b border-border-subtle text-center px-4 py-2 font-semibold text-text-heading">Cant.</th>
                      <th className="border-b border-border-subtle text-center px-4 py-2 font-semibold text-text-heading">Horas</th>
                      <th className="border-b border-border-subtle text-center px-4 py-2 font-semibold text-text-heading">Estado</th>
                      <th className="border-b border-border-subtle text-center px-4 py-2 font-semibold text-text-heading">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupo.map(fila => {
                      const estado = fila.modulo.estado as EstadoTaller
                      const siguiente = SIGUIENTE_ESTADO[estado]
                      const puedeAvanzar = !!siguiente && transicionModuloValida(estado, siguiente)
                      return (
                        <tr key={fila.modulo.id} className="border-b border-border-subtle/50 last:border-0">
                          <td className="px-4 py-2.5 font-medium text-text-heading">{fila.modulo.nombre}</td>
                          <td className="px-4 py-2.5 text-text-muted">{fila.modulo.tipoModulo ?? '—'}</td>
                          <td className="px-4 py-2.5 text-center font-mono text-text-heading">{fila.modulo.cantidad}</td>
                          <td className="px-4 py-2.5 text-center font-mono text-text-muted">{fila.modulo.horasEstimadas}h</td>
                          <td className="px-4 py-2.5 text-center">
                            <Badge tone={BADGE_TONE[estado]} dot>
                              {ETIQUETA_ESTADO[estado]}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {puedeAvanzar && siguiente ? (
                              <Button
                                variant={estado === 'armado' ? 'primary' : 'secondary'}
                                size="md"
                                onClick={() => store.modulos.actualizarEstado(fila.modulo.id, siguiente)}
                              >
                                {ACCION_AVANZAR[estado]}
                              </Button>
                            ) : (
                              <span className="text-xs text-text-muted">En espera de calidad</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}
