'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Badge } from '@/components/veta/badge'
import { Button, LinkButton } from '@/components/veta/button'
import { ImagePicker } from '@/components/veta/image-picker'
import { useDataStore, type OrigenObligacion, type EstadoObligacion } from '@/lib/data'
import { formatCurrency } from '@/lib/utils/format'

type RolCanonico = 'admin' | 'comercial' | 'desarrollador' | 'compras' | 'taller' | 'finanzas' | 'supervisora_qa'

// D-08a (re-auditoría 2026-08-10): mismas etiquetas que app/erp/finanzas/obligaciones/page.tsx --
// acá se mostraban origen/estado crudos ("comision", "pendiente" sin capitalizar) y los montos con
// `${...toLocaleString(..., {minimumFractionDigits: 2})}` a mano, con 2 decimales -- inconsistente
// con el resto del ERP, que siempre usa formatCurrency() (0 decimales, símbolo de moneda correcto).
const ORIGEN_OBLIGACION_LABELS: Record<OrigenObligacion, string> = {
  contrato_hito: 'Cobro cliente',
  proveedor: 'Pago proveedor',
  comision: 'Comisión',
  nomina: 'Nómina',
  diseno_3d: 'Diseño 3D',
  arriendo: 'Arriendo',
}

const ESTADO_OBLIGACION_LABELS: Record<EstadoObligacion, string> = {
  pendiente: 'Pendiente',
  parcial: 'Parcial',
  pagado: 'Pagado',
  atrasada: 'Atrasada',
}

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

export default function PersonaPerfilPage() {
  const params = useParams()
  const store = useDataStore()
  store.getVersion()

  const personaId = params.personaId as string

  const persona = useMemo(() => store.personas.obtenerPorId(personaId), [store, personaId])
  const rolesActuales = useMemo(() => {
    const todos = store.personasRoles.activos()
    return todos.filter(pr => pr.personaId === personaId)
  }, [store, personaId])
  const obligacionesPendientes = useMemo(
    () => store.obligacionesPendientes.porPersona(personaId),
    [store, personaId]
  )

  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    nombre: persona?.nombre || '',
    documento: persona?.documento || '',
    telefono: persona?.telefono || '',
    email: persona?.email || '',
    fotoUrl: persona?.fotoUrl ? [persona.fotoUrl] : [],
    direccion: persona?.direccion || '',
    referencia1Nombre: persona?.referencia1Nombre || '',
    referencia1Relacion: persona?.referencia1Relacion || '',
    referencia1Telefono: persona?.referencia1Telefono || '',
    referencia2Nombre: persona?.referencia2Nombre || '',
    referencia2Relacion: persona?.referencia2Relacion || '',
    referencia2Telefono: persona?.referencia2Telefono || '',
  })
  // F10 (2026-08-17): guardar podía fallar en silencio (ej. documento duplicado, ahora con
  // constraint único en el schema) sin mostrar nada — se tragaba la excepción sin más.
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  if (!persona) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-6">
        <div className="rounded-lg border border-border-subtle bg-bg-paper p-8 text-center">
          <p className="text-text-muted mb-4">Persona no encontrada</p>
          <LinkButton href="/erp/equipo" variant="ghost">Volver a Equipo</LinkButton>
        </div>
      </div>
    )
  }

  const handleGuardar = async () => {
    setGuardando(true)
    setErrorGuardar(null)
    try {
      const updated = await store.personas.actualizar(personaId, {
        nombre: formData.nombre.trim(),
        documento: formData.documento.trim() || null,
        telefono: formData.telefono.trim() || null,
        email: formData.email.trim() || null,
        fotoUrl: formData.fotoUrl[0] || null,
        direccion: formData.direccion.trim() || null,
        referencia1Nombre: formData.referencia1Nombre.trim() || null,
        referencia1Relacion: formData.referencia1Relacion.trim() || null,
        referencia1Telefono: formData.referencia1Telefono.trim() || null,
        referencia2Nombre: formData.referencia2Nombre.trim() || null,
        referencia2Relacion: formData.referencia2Relacion.trim() || null,
        referencia2Telefono: formData.referencia2Telefono.trim() || null,
      })
      if (updated) {
        setEditMode(false)
        setFormData({
          nombre: updated.nombre,
          documento: updated.documento || '',
          telefono: updated.telefono || '',
          email: updated.email || '',
          fotoUrl: updated.fotoUrl ? [updated.fotoUrl] : [],
          direccion: updated.direccion || '',
          referencia1Nombre: updated.referencia1Nombre || '',
          referencia1Relacion: updated.referencia1Relacion || '',
          referencia1Telefono: updated.referencia1Telefono || '',
          referencia2Nombre: updated.referencia2Nombre || '',
          referencia2Relacion: updated.referencia2Relacion || '',
          referencia2Telefono: updated.referencia2Telefono || '',
        })
      }
    } catch (err) {
      setErrorGuardar(
        err instanceof Error && err.message === 'documento_duplicado'
          ? 'Ya existe otro empleado con ese documento.'
          : 'No se pudo guardar. Intentá de nuevo.'
      )
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <LinkButton href="/erp/equipo" variant="ghost" size="md">← Volver</LinkButton>
          <h1 className="font-display text-3xl font-semibold text-text-heading mt-4">
            {persona.nombre}
          </h1>
          <p className="text-sm text-text-muted mt-2">
            Perfil de empleado
          </p>
        </div>
        <Button
          variant={editMode ? 'ghost' : 'primary'}
          size="md"
          onClick={() => {
            if (editMode) {
              setFormData({
                nombre: persona.nombre,
                documento: persona.documento || '',
                telefono: persona.telefono || '',
                email: persona.email || '',
                fotoUrl: persona.fotoUrl ? [persona.fotoUrl] : [],
                direccion: persona.direccion || '',
                referencia1Nombre: persona.referencia1Nombre || '',
                referencia1Relacion: persona.referencia1Relacion || '',
                referencia1Telefono: persona.referencia1Telefono || '',
                referencia2Nombre: persona.referencia2Nombre || '',
                referencia2Relacion: persona.referencia2Relacion || '',
                referencia2Telefono: persona.referencia2Telefono || '',
              })
            }
            setEditMode(!editMode)
          }}
        >
          {editMode ? 'Cancelar' : 'Editar'}
        </Button>
      </div>

      {/* Contenido */}
      <div className="space-y-6">
        {/* Sección de datos de contacto */}
        <div className="rounded-lg border border-border-subtle bg-bg-raised p-6">
          <h2 className="font-semibold text-text-heading mb-4">Datos de contacto</h2>

          {editMode ? (
            <div className="space-y-4">
              {/* Foto */}
              <ImagePicker
                label="Foto de perfil"
                value={formData.fotoUrl}
                onChange={(v) => setFormData({ ...formData, fotoUrl: v })}
                multiple={false}
              />

              {/* Nombre */}
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-text-heading">Nombre*</span>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre completo"
                  className="rounded border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-heading focus:border-gold-400 focus:outline-none"
                />
              </label>

              {/* Documento */}
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-text-heading">Documento</span>
                <input
                  type="text"
                  value={formData.documento}
                  onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                  placeholder="Cédula o documento de identidad"
                  className="rounded border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-heading focus:border-gold-400 focus:outline-none"
                />
              </label>

              {/* Teléfono */}
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-text-heading">Teléfono</span>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="Ej: +57 300 123 4567"
                  className="rounded border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-heading focus:border-gold-400 focus:outline-none"
                />
              </label>

              {/* Email */}
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-text-heading">Email</span>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ej: nombre@example.com"
                  className="rounded border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-heading focus:border-gold-400 focus:outline-none"
                />
              </label>

              {/* Dirección */}
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-text-heading">Dirección</span>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Dirección de residencia"
                  className="rounded border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-heading focus:border-gold-400 focus:outline-none"
                />
              </label>

              {/* Botones */}
              {errorGuardar && (
                <p className="text-xs text-red-500">{errorGuardar}</p>
              )}
              <div className="flex items-center gap-2 pt-4">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleGuardar}
                  disabled={!formData.nombre.trim() || guardando}
                >
                  {guardando ? 'Guardando…' : 'Guardar'}
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => { setEditMode(false); setErrorGuardar(null) }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Foto en vista lectura */}
              {persona.fotoUrl && (
                <div className="flex justify-center mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={persona.fotoUrl}
                    alt={persona.nombre}
                    className="h-32 w-32 rounded-full border-4 border-gold-200 object-cover"
                  />
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-text-muted mb-1">Documento</p>
                  <p className="text-sm text-text-heading">
                    {persona.documento || '(no registrado)'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-text-muted mb-1">Teléfono</p>
                  <p className="text-sm text-text-heading">
                    {persona.telefono || '(no registrado)'}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold uppercase text-text-muted mb-1">Email</p>
                  <p className="text-sm text-text-heading">
                    {persona.email || '(no registrado)'}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold uppercase text-text-muted mb-1">Dirección</p>
                  <p className="text-sm text-text-heading">
                    {persona.direccion || '(no registrado)'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Referencias personales (F10 2026-08-15) */}
        <div className="rounded-lg border border-border-subtle bg-bg-raised p-6">
          <h2 className="font-semibold text-text-heading mb-4">Referencias personales</h2>

          {editMode ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {([1, 2] as const).map((n) => {
                const keyNombre = n === 1 ? 'referencia1Nombre' : 'referencia2Nombre'
                const keyRelacion = n === 1 ? 'referencia1Relacion' : 'referencia2Relacion'
                const keyTelefono = n === 1 ? 'referencia1Telefono' : 'referencia2Telefono'
                return (
                  <div key={n} className="space-y-3">
                    <p className="text-xs font-semibold uppercase text-text-muted">Referencia {n}</p>
                    <label className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-text-heading">Nombre</span>
                      <input
                        type="text"
                        value={formData[keyNombre]}
                        onChange={(e) => setFormData({ ...formData, [keyNombre]: e.target.value })}
                        placeholder="Nombre completo"
                        className="rounded border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-heading focus:border-gold-400 focus:outline-none"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-text-heading">Relación</span>
                      <input
                        type="text"
                        value={formData[keyRelacion]}
                        onChange={(e) => setFormData({ ...formData, [keyRelacion]: e.target.value })}
                        placeholder="Ej: hermano, amigo, jefe anterior"
                        className="rounded border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-heading focus:border-gold-400 focus:outline-none"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-text-heading">Teléfono</span>
                      <input
                        type="tel"
                        value={formData[keyTelefono]}
                        onChange={(e) => setFormData({ ...formData, [keyTelefono]: e.target.value })}
                        placeholder="Ej: +57 300 123 4567"
                        className="rounded border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-heading focus:border-gold-400 focus:outline-none"
                      />
                    </label>
                  </div>
                )
              })}
            </div>
          ) : !persona.referencia1Nombre && !persona.referencia2Nombre ? (
            <p className="text-sm text-text-muted">Sin referencias registradas</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { nombre: persona.referencia1Nombre, relacion: persona.referencia1Relacion, telefono: persona.referencia1Telefono },
                { nombre: persona.referencia2Nombre, relacion: persona.referencia2Relacion, telefono: persona.referencia2Telefono },
              ]
                .filter((ref) => ref.nombre)
                .map((ref, idx) => (
                  <div key={idx} className="rounded border border-border-subtle bg-bg-paper p-3">
                    <p className="text-sm font-semibold text-text-heading">{ref.nombre}</p>
                    <p className="text-xs text-text-muted mt-1">
                      {ref.relacion || '(relación no registrada)'} · {ref.telefono || '(sin teléfono)'}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Roles activos */}
        <div className="rounded-lg border border-border-subtle bg-bg-raised p-6">
          <h2 className="font-semibold text-text-heading mb-4">Roles activos</h2>
          {rolesActuales.length === 0 ? (
            <p className="text-sm text-text-muted">Sin roles asignados</p>
          ) : (
            <div className="space-y-2">
              {rolesActuales.map((pr) => (
                <div key={pr.id} className="flex items-center gap-2">
                  <Badge tone={ROLES_TONE[pr.rolId as RolCanonico]}>
                    {ROLES_ETIQUETAS[pr.rolId as RolCanonico]}
                  </Badge>
                  <span className="text-xs text-text-muted">
                    Desde {new Date(pr.desde).toLocaleDateString('es-CO')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saldos pendientes */}
        <div className="rounded-lg border border-border-subtle bg-bg-raised p-6">
          <h2 className="font-semibold text-text-heading mb-4">Saldos pendientes (comisiones)</h2>
          {obligacionesPendientes.length === 0 ? (
            <p className="text-sm text-text-muted">Sin saldos pendientes</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="px-2 py-2 text-left font-semibold text-text-heading">Descripción</th>
                    <th className="px-2 py-2 text-left font-semibold text-text-heading">Origen</th>
                    <th className="px-2 py-2 text-right font-semibold text-text-heading">Monto Total</th>
                    <th className="px-2 py-2 text-right font-semibold text-text-heading">Pagado</th>
                    <th className="px-2 py-2 text-left font-semibold text-text-heading">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {obligacionesPendientes.map((oblig) => (
                    <tr key={oblig.id} className="border-b border-border-subtle hover:bg-bg-alt">
                      <td className="px-2 py-2 text-text-heading">{oblig.descripcion}</td>
                      <td className="px-2 py-2 text-text-muted text-xs">{ORIGEN_OBLIGACION_LABELS[oblig.origen]}</td>
                      <td className="px-2 py-2 text-right text-text-heading">
                        {formatCurrency(oblig.montoTotal)}
                      </td>
                      <td className="px-2 py-2 text-right text-text-heading">
                        {formatCurrency(oblig.montoPagado)}
                      </td>
                      <td className="px-2 py-2">
                        <Badge
                          tone={
                            oblig.estado === 'pagado' ? 'info' :
                            oblig.estado === 'atrasada' ? 'danger' :
                            'warning'
                          }
                        >
                          {ESTADO_OBLIGACION_LABELS[oblig.estado]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
