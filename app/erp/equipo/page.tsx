'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { Busqueda } from '@/components/veta/busqueda'
import { CopyField } from '@/components/veta/copy-field'
import { Modal } from '@/components/veta/modal'
import { useDataStore } from '@/lib/data'
import { coincide } from '@/lib/search/normalizar'
import {
  crearInvitacionEmpleadoAction,
  listarEstadoCuentasAction,
} from '@/lib/auth/actions'
import type { EstadoCuentaEmpleado } from '@/lib/auth/session'
import type { PersonaRol, Persona } from '@/lib/data'

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
  const [nuevoRolesInvitacion, setNuevoRolesInvitacion] = useState<RolCanonico[]>(['desarrollador'])
  const [crearFormVisible, setCrearFormVisible] = useState(false)
  const [asignarRolActivo, setAsignarRolActivo] = useState<string | null>(null)
  const [nuevosRoles, setNuevosRoles] = useState<RolCanonico[]>([])

  // F10 (2026-08-17): estado del form de creación — guard de doble-submit + error visible
  // (antes "Guardar" no se deshabilitaba durante el await y los errores se tragaban en silencio).
  const [creandoPersona, setCreandoPersona] = useState(false)
  const [errorCrear, setErrorCrear] = useState<string | null>(null)
  const [confirmarDuplicado, setConfirmarDuplicado] = useState(false)

  // F10 (2026-08-17): búsqueda/filtro — la lista sin esto se vuelve inmanejable pasados ~15 empleados.
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState<RolCanonico | ''>('')
  const [mostrarInactivos, setMostrarInactivos] = useState(false)

  // F10 (2026-08-17): key genérica ("desactivar:<id>", "quitar:<id>:<rol>", "reactivar:<id>")
  // para deshabilitar el botón puntual en vuelo sin un state distinto por acción.
  const [procesando, setProcesando] = useState<string | null>(null)
  const [confirmDesactivar, setConfirmDesactivar] = useState<{ id: string; nombre: string } | null>(null)
  const [confirmQuitarRol, setConfirmQuitarRol] = useState<{ personaId: string; rolId: RolCanonico; nombre: string; etiqueta: string } | null>(null)

  // D-08b (F10 2026-08-15): estado de cuentas de acceso (sin cuenta / invitación
  // pendiente / activa) por persona — server action saneada, nunca trae passwordHash.
  const [estadoCuentas, setEstadoCuentas] = useState<EstadoCuentaEmpleado[]>([])
  const [enlaceGenerado, setEnlaceGenerado] = useState<{ personaId: string; nombre: string; url: string } | null>(null)
  const [generandoAccesoPara, setGenerandoAccesoPara] = useState<string | null>(null)
  const [errorAcceso, setErrorAcceso] = useState<Record<string, string>>({})

  const cargarEstadoCuentas = useCallback(async () => {
    setEstadoCuentas(await listarEstadoCuentasAction())
  }, [])

  useEffect(() => {
    cargarEstadoCuentas()
  }, [cargarEstadoCuentas])

  // Agrupado por persona ACTIVA (no por personaRol, y no derivado de personasRolesActivos):
  // una persona con varios roles muestra una sola tarjeta con un badge por rol, y una persona
  // sin ningún rol activo (ej. tras "Quitar rol" sobre su único rol) sigue apareciendo en vez
  // de desaparecer de la lista como si estuviera desactivada.
  const personasConRoles: { persona: Persona; roles: PersonaRol[] }[] = personas
    .filter((p) => p.activo)
    .filter((p) => !busqueda.trim() || coincide(busqueda, [p.nombre, p.email ?? '', p.documento ?? '', p.telefono ?? '']))
    .filter((p) => !filtroRol || personasRolesActivos.some((pr) => pr.personaId === p.id && pr.rolId === filtroRol))
    .map((persona) => ({ persona, roles: personasRolesActivos.filter((pr) => pr.personaId === persona.id) }))

  const personasInactivas = personas.filter((p) => !p.activo)

  const toggleRol = (lista: RolCanonico[], setLista: (r: RolCanonico[]) => void, rol: RolCanonico) => {
    setLista(lista.includes(rol) ? lista.filter(r => r !== rol) : [...lista, rol])
  }

  // P-12 (D-15): candidatos a verificador = personas con rol comercial activo, dedup por personaId.
  const personasComerciales = personasRolesActivos
    .filter(pr => pr.rolId === 'comercial')
    .map(pr => personas.find(p => p.id === pr.personaId))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .filter((p, idx, arr) => arr.findIndex(o => o.id === p.id) === idx)

  const handleCrearPersona = async () => {
    const nombreTrim = nuevoNombre.trim()
    if (!nombreTrim || nuevoRolesInvitacion.length === 0) return

    const posibleDuplicado = personas.some(
      (p) => p.activo && p.nombre.trim().toLowerCase() === nombreTrim.toLowerCase()
    )
    if (posibleDuplicado && !confirmarDuplicado) {
      setErrorCrear(`Ya existe un empleado activo llamado "${nombreTrim}". Volvé a apretar "Guardar" si igual querés crear otro.`)
      setConfirmarDuplicado(true)
      return
    }

    setCreandoPersona(true)
    setErrorCrear(null)
    try {
      const emailTrim = nuevoEmail.trim()
      const persona = await store.personas.crear({
        nombre: nombreTrim,
        email: emailTrim || null,
      })
      for (const rol of nuevoRolesInvitacion) {
        await store.personasRoles.asignar(persona.id, rol)
      }

      if (emailTrim) {
        const resultado = await crearInvitacionEmpleadoAction({
          personaId: persona.id,
          email: emailTrim,
          rol: nuevoRolesInvitacion[0],
          nombre: persona.nombre,
        })
        if (resultado.ok && resultado.token) {
          setEnlaceGenerado({
            personaId: persona.id,
            nombre: persona.nombre,
            url: `${window.location.origin}/erp/login/activar?token=${resultado.token}`,
          })
          await cargarEstadoCuentas()
        } else {
          setErrorCrear(`${persona.nombre} se creó, pero ese email ya está en uso por otra cuenta de acceso — corregilo desde "Editar acceso" en su tarjeta.`)
        }
      }

      setNuevoNombre('')
      setNuevoEmail('')
      setNuevoRolesInvitacion(['desarrollador'])
      setConfirmarDuplicado(false)
      setCrearFormVisible(false)
    } catch (err) {
      setErrorCrear(
        err instanceof Error && err.message === 'documento_duplicado'
          ? 'Ya existe un empleado con ese documento.'
          : 'No se pudo crear el empleado. Intentá de nuevo.'
      )
    } finally {
      setCreandoPersona(false)
    }
  }

  const handleAsignarRoles = async (personaId: string) => {
    setProcesando(`rol:${personaId}`)
    try {
      for (const rol of nuevosRoles) {
        await store.personasRoles.asignar(personaId, rol)
      }
      setAsignarRolActivo(null)
      setNuevosRoles([])
    } finally {
      setProcesando(null)
    }
  }

  const handleQuitarRol = async () => {
    if (!confirmQuitarRol) return
    const { personaId, rolId } = confirmQuitarRol
    setProcesando(`quitar:${personaId}:${rolId}`)
    try {
      await store.personasRoles.desasignar(personaId, rolId)
    } finally {
      setProcesando(null)
      setConfirmQuitarRol(null)
    }
  }

  const handleDesactivar = async () => {
    if (!confirmDesactivar) return
    setProcesando(`desactivar:${confirmDesactivar.id}`)
    try {
      await store.personas.desactivar(confirmDesactivar.id)
    } finally {
      setProcesando(null)
      setConfirmDesactivar(null)
    }
  }

  const handleReactivar = async (id: string) => {
    setProcesando(`reactivar:${id}`)
    try {
      await store.personas.reactivar(id)
    } finally {
      setProcesando(null)
    }
  }

  // D-08b: genera (o regenera/edita) el enlace de autoregistro para una persona —
  // sirve tanto para "Generar acceso" (primera vez) como "Editar acceso" (cuenta ya
  // activa, ej. corregir un email con typo: F10 2026-08-17, item 1+4 del lote Equipo).
  const handleGenerarAcceso = async (persona: { id: string; nombre: string; email: string | null }) => {
    if (!persona.email) return
    setGenerandoAccesoPara(persona.id)
    setErrorAcceso((prev) => { const next = { ...prev }; delete next[persona.id]; return next })
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
      } else {
        setErrorAcceso((prev) => ({ ...prev, [persona.id]: 'Ese email ya está en uso por la cuenta de acceso de otra persona.' }))
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
                onChange={(e) => { setNuevoNombre(e.target.value); setConfirmarDuplicado(false); setErrorCrear(null) }}
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
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-text-heading">Rol{nuevoRolesInvitacion.length > 1 ? 'es' : ''}</span>
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(ROLES_ETIQUETAS).map(([rol, etiqueta]) => (
                  <label key={rol} className="flex items-center gap-2 text-sm text-text-heading">
                    <input
                      type="checkbox"
                      checked={nuevoRolesInvitacion.includes(rol as RolCanonico)}
                      onChange={() => toggleRol(nuevoRolesInvitacion, setNuevoRolesInvitacion, rol as RolCanonico)}
                    />
                    {etiqueta}
                  </label>
                ))}
              </div>
              {nuevoRolesInvitacion.length === 0 && (
                <span className="text-xs text-red-500">Elegí al menos un rol</span>
              )}
            </div>
            {errorCrear && (
              <p className="text-xs text-red-500">{errorCrear}</p>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="md"
                onClick={handleCrearPersona}
                disabled={!nuevoNombre.trim() || nuevoRolesInvitacion.length === 0 || creandoPersona}
              >
                {creandoPersona ? 'Guardando…' : confirmarDuplicado ? 'Crear igual' : 'Guardar'}
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() => { setCrearFormVisible(false); setNuevoNombre(''); setNuevoEmail(''); setNuevoRolesInvitacion(['desarrollador']); setErrorCrear(null); setConfirmarDuplicado(false) }}
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

      {/* Buscador / filtro / ver inactivos (F10 2026-08-17) */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Busqueda
          valor={busqueda}
          onChange={setBusqueda}
          placeholder="Buscar por nombre, correo o documento..."
          label="Buscar empleado"
          className="flex-1 min-w-[180px]"
        />
        <select
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value as RolCanonico | '')}
          className="rounded border border-border-subtle bg-bg-paper px-2 py-2 text-sm text-text-heading focus:border-gold-400 focus:outline-none"
        >
          <option value="">Todos los roles</option>
          {Object.entries(ROLES_ETIQUETAS).map(([rol, etiqueta]) => (
            <option key={rol} value={rol}>{etiqueta}</option>
          ))}
        </select>
        <Button
          variant={mostrarInactivos ? 'secondary' : 'ghost'}
          size="md"
          onClick={() => setMostrarInactivos((v) => !v)}
        >
          {mostrarInactivos ? 'Ver activos' : `Ver inactivos (${personasInactivas.length})`}
        </Button>
      </div>

      {/* Lista de personas con roles */}
      {mostrarInactivos ? (
        <div className="space-y-3">
          {personasInactivas.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border-subtle bg-bg-paper p-8 text-center">
              <p className="text-text-muted">No hay empleados desactivados</p>
            </div>
          ) : (
            personasInactivas.map((persona) => (
              <div key={persona.id} className="rounded-lg border border-dashed border-border-subtle bg-bg-paper p-4 opacity-80">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-text-muted line-through">{persona.nombre || '(sin nombre)'}</h3>
                    <p className="text-xs text-text-muted mt-1">Empleado desactivado</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="md"
                    disabled={procesando === `reactivar:${persona.id}`}
                    onClick={() => handleReactivar(persona.id)}
                  >
                    {procesando === `reactivar:${persona.id}` ? 'Reactivando…' : 'Reactivar'}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
      <div className="space-y-3">
        {personasConRoles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-subtle bg-bg-paper p-8 text-center">
            <p className="text-text-muted mb-4">
              {busqueda || filtroRol ? 'Ningún empleado activo coincide con el filtro' : 'No hay empleados activos'}
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => setCrearFormVisible(true)}
            >
              Crear primer empleado
            </Button>
          </div>
        ) : (
          personasConRoles.map(({ persona, roles }) => {
            const cuenta = estadoCuentas.find((c) => c.personaId === persona.id)
            const rolesDisponibles = (Object.keys(ROLES_ETIQUETAS) as RolCanonico[])
              .filter((rol) => !roles.some((r) => r.rolId === rol))
            return (
            <div key={persona.id} className="rounded-lg border border-border-subtle bg-bg-raised p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <Link href={`/erp/equipo/${persona.id}`} className="hover:opacity-80 transition-opacity">
                    <h3 className="inline font-semibold text-text-heading hover:text-gold-400">
                      {persona.nombre || '(sin nombre)'}
                    </h3>
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {roles.length === 0 ? (
                      <span className="text-xs text-text-muted">(sin roles activos)</span>
                    ) : roles.map((personaRol) => {
                      const rolLabel = ROLES_ETIQUETAS[personaRol.rolId as RolCanonico]
                      const key = `quitar:${persona.id}:${personaRol.rolId}`
                      return (
                        <span key={personaRol.id} className="inline-flex items-center gap-1">
                          <Badge tone={ROLES_TONE[personaRol.rolId as RolCanonico]}>{rolLabel}</Badge>
                          <button
                            type="button"
                            title={`Quitar rol ${rolLabel}`}
                            disabled={procesando === key}
                            onClick={() => setConfirmQuitarRol({ personaId: persona.id, rolId: personaRol.rolId as RolCanonico, nombre: persona.nombre, etiqueta: rolLabel })}
                            className="text-text-muted hover:text-red-500 text-xs leading-none disabled:opacity-40"
                          >
                            ✕
                          </button>
                        </span>
                      )
                    })}
                    {roles[0] && (
                      <p className="text-xs text-text-muted">
                        Desde: {new Date(roles[0].desde).toLocaleDateString('es-CO')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Asignar otro rol */}
                  {asignarRolActivo === persona.id ? (
                    <div className="flex items-start gap-2">
                      <div className="grid gap-1">
                        {rolesDisponibles.length === 0 ? (
                          <span className="text-xs text-text-muted">Ya tiene todos los roles</span>
                        ) : rolesDisponibles.map((rol) => (
                          <label key={rol} className="flex items-center gap-2 text-xs text-text-heading">
                            <input
                              type="checkbox"
                              checked={nuevosRoles.includes(rol)}
                              onChange={() => toggleRol(nuevosRoles, setNuevosRoles, rol)}
                            />
                            {ROLES_ETIQUETAS[rol]}
                          </label>
                        ))}
                      </div>
                      <Button
                        variant="primary"
                        size="md"
                        disabled={nuevosRoles.length === 0 || procesando === `rol:${persona.id}`}
                        onClick={() => handleAsignarRoles(persona.id)}
                      >
                        ✓
                      </Button>
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() => { setAsignarRolActivo(null); setNuevosRoles([]) }}
                      >
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={() => { setAsignarRolActivo(persona.id); setNuevosRoles([]) }}
                    >
                      Asignar otro rol
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="md"
                    disabled={procesando === `desactivar:${persona.id}`}
                    onClick={() => setConfirmDesactivar({ id: persona.id, nombre: persona.nombre })}
                  >
                    Desactivar
                  </Button>
                </div>
              </div>

              {/* Estado de cuenta de acceso (D-08b) */}
              <div className="mt-3 pt-3 border-t border-border-subtle/50">
                <div className="flex items-center justify-between gap-4">
                  {cuenta?.activo ? (
                    <Badge tone="info">Cuenta activa · {cuenta.email}</Badge>
                  ) : cuenta ? (
                    <Badge tone="warning">
                      Invitación pendiente{cuenta.inviteTokenExpiraEn ? ` · vence ${new Date(cuenta.inviteTokenExpiraEn).toLocaleDateString('es-CO')}` : ''}
                    </Badge>
                  ) : (
                    <Badge tone="neutral">Sin cuenta de acceso</Badge>
                  )}
                  <Button
                    variant="secondary"
                    size="md"
                    disabled={!persona.email || generandoAccesoPara === persona.id}
                    title={!persona.email ? 'Agregá un email en el perfil de esta persona primero' : undefined}
                    onClick={() => handleGenerarAcceso(persona)}
                  >
                    {generandoAccesoPara === persona.id ? 'Generando…' : cuenta?.activo ? 'Editar acceso' : cuenta ? 'Reenviar enlace' : 'Generar acceso'}
                  </Button>
                </div>
                {errorAcceso[persona.id] && (
                  <p className="text-xs text-red-500 mt-2">{errorAcceso[persona.id]}</p>
                )}
              </div>
            </div>
          )})
        )}
      </div>
      )}

      {/* Confirmación: quitar rol (F10 2026-08-17) */}
      <Modal
        open={confirmQuitarRol !== null}
        onClose={() => setConfirmQuitarRol(null)}
        title="Quitar rol"
      >
        <div className="space-y-4">
          <p>
            ¿Quitarle el rol <strong>{confirmQuitarRol?.etiqueta}</strong> a <strong>{confirmQuitarRol?.nombre}</strong>?
            Va a perder los permisos asociados a ese rol.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="md" onClick={handleQuitarRol}>Quitar rol</Button>
            <Button variant="ghost" size="md" onClick={() => setConfirmQuitarRol(null)}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* Confirmación: desactivar empleado (F10 2026-08-17) */}
      <Modal
        open={confirmDesactivar !== null}
        onClose={() => setConfirmDesactivar(null)}
        title="Desactivar empleado"
      >
        <div className="space-y-4">
          <p>
            ¿Desactivar a <strong>{confirmDesactivar?.nombre}</strong>? Deja de aparecer en la lista de empleados
            activos y pierde todos sus roles (podés reactivarlo y reasignarle roles después desde &quot;Ver inactivos&quot;).
          </p>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="md" onClick={handleDesactivar}>Desactivar</Button>
            <Button variant="ghost" size="md" onClick={() => setConfirmDesactivar(null)}>Cancelar</Button>
          </div>
        </div>
      </Modal>

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
