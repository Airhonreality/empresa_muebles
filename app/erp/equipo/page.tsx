'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { CopyField } from '@/components/veta/copy-field'
import { useDataStore } from '@/lib/data'
import {
  crearInvitacionEmpleadoAction,
  listarEstadoCuentasAction,
} from '@/lib/auth/actions'
import type { EstadoCuentaEmpleado } from '@/lib/auth/session'

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const proyectos = useMemo(() => store.proyectos.listar(), [store, version])

  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoEmail, setNuevoEmail] = useState('')
  const [nuevoRolInvitacion, setNuevoRolInvitacion] = useState<RolCanonico>('desarrollador')
  const [crearFormVisible, setCrearFormVisible] = useState(false)
  const [asignarRolActivo, setAsignarRolActivo] = useState<string | null>(null)
  const [nuevoRol, setNuevoRol] = useState<RolCanonico>('desarrollador')

  // D-08b (F10 2026-08-15): estado de cuentas de acceso (sin cuenta / invitación
  // pendiente / activa) por persona — server action saneada, nunca trae passwordHash.
  const [estadoCuentas, setEstadoCuentas] = useState<EstadoCuentaEmpleado[]>([])
  const [enlaceGenerado, setEnlaceGenerado] = useState<{ personaId: string; nombre: string; url: string } | null>(null)
  const [generandoAccesoPara, setGenerandoAccesoPara] = useState<string | null>(null)

  const cargarEstadoCuentas = useCallback(async () => {
    setEstadoCuentas(await listarEstadoCuentasAction())
  }, [])

  useEffect(() => {
    cargarEstadoCuentas()
  }, [cargarEstadoCuentas])

  const personasConRol = personasRolesActivos
    .map((pr) => ({
      personaRol: pr,
      persona: personas.find(p => p.id === pr.personaId),
    }))
    .filter(p => p.persona)

  // P-12 (D-15): candidatos a verificador = personas con rol comercial activo, dedup por personaId.
  const personasComerciales = personasRolesActivos
    .filter(pr => pr.rolId === 'comercial')
    .map(pr => personas.find(p => p.id === pr.personaId))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .filter((p, idx, arr) => arr.findIndex(o => o.id === p.id) === idx)

  const handleCrearPersona = async () => {
    if (!nuevoNombre.trim()) return
    const emailTrim = nuevoEmail.trim()
    const persona = await store.personas.crear({
      nombre: nuevoNombre.trim(),
      email: emailTrim || null,
    })
    await store.personasRoles.asignar(persona.id, nuevoRolInvitacion)

    if (emailTrim) {
      const resultado = await crearInvitacionEmpleadoAction({
        personaId: persona.id,
        email: emailTrim,
        rol: nuevoRolInvitacion,
        nombre: persona.nombre,
      })
      if (resultado.ok && resultado.token) {
        setEnlaceGenerado({
          personaId: persona.id,
          nombre: persona.nombre,
          url: `${window.location.origin}/erp/login/activar?token=${resultado.token}`,
        })
        await cargarEstadoCuentas()
      }
    }

    setNuevoNombre('')
    setNuevoEmail('')
    setNuevoRolInvitacion('desarrollador')
    setCrearFormVisible(false)
  }

  const handleAsignarRol = async (personaId: string) => {
    await store.personasRoles.asignar(personaId, nuevoRol)
    setAsignarRolActivo(null)
  }

  // D-08b: genera (o regenera) el enlace de autoregistro para una persona ya
  // existente — cubre a las personas creadas antes de esta funcionalidad.
  const handleGenerarAcceso = async (persona: { id: string; nombre: string; email: string | null }) => {
    if (!persona.email) return
    setGenerandoAccesoPara(persona.id)
    try {
      const rolActual = personasRolesActivos.find((pr) => pr.personaId === persona.id)?.rolId ?? 'desarrollador'
      const resultado = await crearInvitacionEmpleadoAction({
        personaId: persona.id,
        email: persona.email,
        rol: rolActual,
        nombre: persona.nombre,
      })
      if (resultado.ok && resultado.token) {
        setEnlaceGenerado({
          personaId: persona.id,
          nombre: persona.nombre,
          url: `${window.location.origin}/erp/login/activar?token=${resultado.token}`,
        })
        await cargarEstadoCuentas()
      }
    } finally {
      setGenerandoAccesoPara(null)
    }
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
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-text-heading">Email</span>
              <input
                type="email"
                value={nuevoEmail}
                onChange={(e) => setNuevoEmail(e.target.value)}
                placeholder="Ej: juan@vetadeoro.co"
                className="rounded border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-heading focus:border-gold-400 focus:outline-none"
              />
              <span className="text-xs text-text-muted">
                Si lo completás, se genera de una vez un enlace de autoregistro para que el empleado ponga su propia contraseña.
              </span>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-text-heading">Rol</span>
              <select
                value={nuevoRolInvitacion}
                onChange={(e) => setNuevoRolInvitacion(e.target.value as RolCanonico)}
                className="rounded border border-border-subtle bg-bg-paper px-2 py-2 text-sm text-text-heading focus:border-gold-400 focus:outline-none"
              >
                {Object.entries(ROLES_ETIQUETAS).map(([rol, etiqueta]) => (
                  <option key={rol} value={rol}>{etiqueta}</option>
                ))}
              </select>
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
                onClick={() => { setCrearFormVisible(false); setNuevoNombre(''); setNuevoEmail('') }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Enlace de invitación recién generado (D-08b) — se muestra una sola vez */}
      {enlaceGenerado && (
        <div className="rounded-lg border border-gold-400 bg-bg-raised p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h3 className="font-semibold text-text-heading">Enlace de registro para {enlaceGenerado.nombre}</h3>
              <p className="text-xs text-text-muted mt-1">
                Copialo y envíaselo por el medio que uses (WhatsApp, email). Este enlace no se vuelve a mostrar — si se pierde, generá uno nuevo desde la tarjeta de la persona.
              </p>
            </div>
            <Button variant="ghost" size="md" onClick={() => setEnlaceGenerado(null)}>✕</Button>
          </div>
          <CopyField value={enlaceGenerado.url} />
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
          personasConRol.map(({ personaRol, persona }) => {
            const cuenta = estadoCuentas.find((c) => c.personaId === persona?.id)
            return (
            <div key={personaRol.id} className="rounded-lg border border-border-subtle bg-bg-raised p-4">
              <div className="flex items-center justify-between gap-4">
                <Link href={`/erp/equipo/${persona?.id}`} className="flex-1 hover:opacity-80 transition-opacity">
                  <h3 className="font-semibold text-text-heading hover:text-gold-400">
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
                </Link>

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

              {/* Estado de cuenta de acceso (D-08b) */}
              <div className="mt-3 pt-3 border-t border-border-subtle/50 flex items-center justify-between gap-4">
                {cuenta?.activo ? (
                  <Badge tone="info">Cuenta activa · {cuenta.email}</Badge>
                ) : cuenta ? (
                  <Badge tone="warning">
                    Invitación pendiente{cuenta.inviteTokenExpiraEn ? ` · vence ${new Date(cuenta.inviteTokenExpiraEn).toLocaleDateString('es-CO')}` : ''}
                  </Badge>
                ) : (
                  <Badge tone="neutral">Sin cuenta de acceso</Badge>
                )}
                {!cuenta?.activo && persona && (
                  <Button
                    variant="secondary"
                    size="md"
                    disabled={!persona.email || generandoAccesoPara === persona.id}
                    title={!persona.email ? 'Agregá un email en el perfil de esta persona primero' : undefined}
                    onClick={() => handleGenerarAcceso(persona)}
                  >
                    {generandoAccesoPara === persona.id ? 'Generando…' : cuenta ? 'Reenviar enlace' : 'Generar acceso'}
                  </Button>
                )}
              </div>
            </div>
          )})
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

      {/* P-12 (D-15): designación del verificador único del proyecto (D3/I-035) */}
      <div className="mt-8 p-4 rounded-lg border border-border-subtle bg-bg-raised">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-text-heading">Designar verificador</h3>
            <p className="text-xs text-text-muted mt-1">
              Solo personas con rol comercial. Al designar, la persona queda como verificador único del proyecto (E-18/E-24).
            </p>
          </div>
        </div>
        {personasComerciales.length === 0 ? (
          <p className="text-sm text-text-muted">No hay personas con rol comercial activo. Asigna el rol comercial primero.</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {proyectos.map((proyecto) => (
              <div key={proyecto.id} className="flex flex-wrap items-center gap-2 rounded border border-border-subtle bg-bg-paper px-3 py-2">
                <span className="flex-1 min-w-0 text-sm text-text-heading truncate">{proyecto.nombreProyecto}</span>
                {proyecto.verificadorId && (
                  <span className="text-xs text-text-muted">
                    Verificador: {personas.find(p => p.id === proyecto.verificadorId)?.nombre ?? proyecto.verificadorId}
                  </span>
                )}
                <select
                  value={proyecto.verificadorId ?? ''}
                  onChange={async (e) => {
                    const personaId = e.target.value
                    if (personaId) await store.proyectos.actualizarVerificador(proyecto.id, personaId)
                  }}
                  className="rounded border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
                  aria-label={`Verificador de ${proyecto.nombreProyecto}`}
                >
                  <option value="">Seleccionar...</option>
                  {personasComerciales.map((persona) => (
                    <option key={persona.id} value={persona.id}>{persona.nombre}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
