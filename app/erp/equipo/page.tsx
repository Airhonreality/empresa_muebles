'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { useDataStore } from '@/lib/data'

type RolCanonico = 'admin' | 'comercial' | 'desarrollador' | 'compras' | 'taller' | 'finanzas' | 'supervisora_qa'

const ROLES_ETIQUETAS: Record<RolCanonico, string> = {
  admin: 'Administrador',
  comercial: 'Comercial',
  desarrollador: 'Desarrollador',
  compras: 'Compras',
  taller: 'Taller',
  finanzas: 'Finanzas',
  supervisora_qa: 'Supervisora QA',
}

const ROLES_TONE: Record<RolCanonico, 'info' | 'warning' | 'danger' | 'neutral'> = {
  admin: 'danger',
  comercial: 'info',
  desarrollador: 'info',
  compras: 'warning',
  taller: 'neutral',
  finanzas: 'warning',
  supervisora_qa: 'danger',
}

export default function EquipoPage() {
  const store = useDataStore()
  const version = store.getVersion()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const personasRolesActivos = useMemo(() => store.personasRoles.activos(), [store, version])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const personas = useMemo(() => store.personas.listar(), [store, version])

  const [nuevoNombre, setNuevoNombre] = useState('')
  const [crearFormVisible, setCrearFormVisible] = useState(false)
  const [asignarRolActivo, setAsignarRolActivo] = useState<string | null>(null)
  const [nuevoRol, setNuevoRol] = useState<RolCanonico>('desarrollador')

  const personasConRol = personasRolesActivos
    .map((pr) => ({
      personaRol: pr,
      persona: personas.find(p => p.id === pr.personaId),
    }))
    .filter(p => p.persona)

  const handleCrearPersona = () => {
    if (!nuevoNombre.trim()) return
    store.personas.crear({
      nombre: nuevoNombre.trim(),
    })
    setNuevoNombre('')
    setCrearFormVisible(false)
  }

  const handleAsignarRol = (personaId: string) => {
    store.personasRoles.asignar(personaId, nuevoRol)
    setAsignarRolActivo(null)
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-text-heading">
              Equipo
            </h1>
            <p className="text-sm text-text-muted mt-2">
              Gestión de personas y roles activos
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => setCrearFormVisible(true)}
          >
            + Crear empleado
          </Button>
        </div>
      </header>

      {/* Form crear empleado */}
      {crearFormVisible && (
        <div className="rounded-lg border border-border-subtle bg-bg-raised p-6 mb-6">
          <h3 className="font-semibold text-text-heading mb-4">Nuevo empleado</h3>
          <div className="space-y-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-text-heading">Nombre*</span>
              <input
                type="text"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder="Ej: Juan Pérez"
                className="rounded border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-heading focus:border-gold-400 focus:outline-none"
              />
            </label>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="md"
                onClick={handleCrearPersona}
                disabled={!nuevoNombre.trim()}
              >
                Guardar
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() => { setCrearFormVisible(false); setNuevoNombre('') }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de personas con roles */}
      <div className="space-y-3">
        {personasConRol.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-subtle bg-bg-paper p-8 text-center">
            <p className="text-text-muted mb-4">No hay empleados con roles asignados</p>
            <Button
              variant="primary"
              size="md"
              onClick={() => setCrearFormVisible(true)}
            >
              Crear primer empleado
            </Button>
          </div>
        ) : (
          personasConRol.map(({ personaRol, persona }) => (
            <div key={personaRol.id} className="rounded-lg border border-border-subtle bg-bg-raised p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-text-heading">
                    {persona?.nombre || '(sin nombre)'}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge tone={ROLES_TONE[personaRol.rolId as RolCanonico]}>
                      {ROLES_ETIQUETAS[personaRol.rolId as RolCanonico]}
                    </Badge>
                    <p className="text-xs text-text-muted">
                      Desde: {new Date(personaRol.desde).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                </div>

                {/* Asignar otro rol */}
                {asignarRolActivo === personaRol.personaId ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={nuevoRol}
                      onChange={(e) => setNuevoRol(e.target.value as RolCanonico)}
                      className="rounded border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
                    >
                      {Object.entries(ROLES_ETIQUETAS).map(([rol, etiqueta]) => (
                        <option key={rol} value={rol}>{etiqueta}</option>
                      ))}
                    </select>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => handleAsignarRol(personaRol.personaId)}
                    >
                      ✓
                    </Button>
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={() => setAsignarRolActivo(null)}
                    >
                      ✕
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => { setAsignarRolActivo(personaRol.personaId); setNuevoRol('desarrollador') }}
                  >
                    Asignar otro rol
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info sobre roles */}
      <div className="mt-8 p-4 rounded-lg border border-border-subtle/50 bg-bg-paper">
        <p className="text-xs font-semibold uppercase text-text-muted mb-2">Roles disponibles</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(ROLES_ETIQUETAS).map(([rol, etiqueta]) => (
            <div key={rol} className="flex items-center gap-2 text-sm">
              <Badge tone={ROLES_TONE[rol as RolCanonico]}>{etiqueta}</Badge>
              <span className="text-text-muted font-mono text-xs">{rol}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
