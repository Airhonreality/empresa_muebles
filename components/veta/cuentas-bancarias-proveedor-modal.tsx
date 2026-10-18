'use client'

import { useState } from 'react'
import { Modal } from '@/components/veta/modal'
import { Button } from '@/components/veta/button'
import { Badge } from '@/components/veta/badge'
import {
  useDataStore,
  type Proveedor,
  type ProveedorCuentaBancaria,
  type TipoCuentaProveedor,
  type TipoLlaveProveedor,
} from '@/lib/data'
import { usePendingGuard } from '@/lib/hooks/usePendingGuard'

const TIPO_LABELS: Record<TipoCuentaProveedor, string> = {
  banco: 'Cuenta bancaria',
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  bre_b: 'Llave Bre-B',
  otro: 'Otro medio',
}

const TIPO_LLAVE_LABELS: Record<TipoLlaveProveedor, string> = {
  telefono: 'Teléfono',
  email: 'Correo',
  documento: 'Documento',
  alfanumerica: 'Llave alfanumérica',
}

interface FormCuenta {
  tipo: TipoCuentaProveedor
  alias: string
  bancoId: string
  tipoCuenta: string
  numeroCuenta: string
  titular: string
  documentoTitular: string
  tipoLlave: TipoLlaveProveedor
  llave: string
  esPrincipal: boolean
  activa: boolean
  notas: string
}

const FORM_INICIAL: FormCuenta = {
  tipo: 'banco',
  alias: '',
  bancoId: '',
  tipoCuenta: 'ahorros',
  numeroCuenta: '',
  titular: '',
  documentoTitular: '',
  tipoLlave: 'telefono',
  llave: '',
  esPrincipal: false,
  activa: true,
  notas: '',
}

function formDesdeCuenta(c: ProveedorCuentaBancaria): FormCuenta {
  return {
    tipo: c.tipo,
    alias: c.alias ?? '',
    bancoId: c.bancoId ?? '',
    tipoCuenta: c.tipoCuenta ?? 'ahorros',
    numeroCuenta: c.numeroCuenta ?? '',
    titular: c.titular ?? '',
    documentoTitular: c.documentoTitular ?? '',
    tipoLlave: c.tipoLlave ?? 'telefono',
    llave: c.llave ?? '',
    esPrincipal: c.esPrincipal,
    activa: c.activa,
    notas: c.notas ?? '',
  }
}

function mask(valor: string | null): string {
  if (!valor) return '—'
  if (valor.length <= 4) return valor
  return `${'•'.repeat(Math.min(8, valor.length - 4))}${valor.slice(-4)}`
}

/** Muestra el número/llave principal de la cuenta según su tipo. */
function referenciaCuenta(c: ProveedorCuentaBancaria): string {
  return c.tipo === 'banco' ? mask(c.numeroCuenta) : `${TIPO_LLAVE_LABELS[c.tipoLlave ?? 'telefono']}: ${mask(c.llave)}`
}

export interface CuentasBancariasProveedorModalProps {
  open: boolean
  proveedor: Proveedor
  onClose: () => void
}

export function CuentasBancariasProveedorModal({ open, proveedor, onClose }: CuentasBancariasProveedorModalProps) {
  const store = useDataStore()
  const cuentas = store.proveedoresCuentasBancarias.porProveedor(proveedor.id)
  const { guard, isPending } = usePendingGuard()

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState<FormCuenta | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Alta rápida de banco desde el mismo select: el catálogo `bancos` es editable,
  // los nombres no viven hardcodeados en este formulario.
  const [creandoBanco, setCreandoBanco] = useState(false)
  const [nuevoBancoNombre, setNuevoBancoNombre] = useState('')
  const [nuevoBancoCodigo, setNuevoBancoCodigo] = useState('')

  const bancos = store.bancos.listar()
  const bancosPorId = new Map(bancos.map((b) => [b.id, b]))

  const setCampo = <K extends keyof FormCuenta>(campo: K, valor: FormCuenta[K]) => {
    setForm((prev) => (prev ? { ...prev, [campo]: valor } : prev))
  }

  const iniciarNueva = () => {
    setEditandoId(null)
    setForm({ ...FORM_INICIAL })
    setError(null)
    setCreandoBanco(false)
  }

  const iniciarEdicion = (cuenta: ProveedorCuentaBancaria) => {
    setEditandoId(cuenta.id)
    setForm(formDesdeCuenta(cuenta))
    setError(null)
  }

  const cancelarForm = () => {
    setEditandoId(null)
    setForm(null)
    setError(null)
    setCreandoBanco(false)
    setNuevoBancoNombre('')
    setNuevoBancoCodigo('')
  }

  const validar = (): string | null => {
    if (!form) return null
    if (form.tipo === 'banco') {
      if (!form.bancoId) return 'Selecciona un banco'
      if (!form.numeroCuenta.trim()) return 'El número de cuenta es obligatorio'
      if (!form.titular.trim()) return 'El titular es obligatorio'
      return null
    }
    if (form.tipo === 'nequi' || form.tipo === 'daviplata') {
      if (!form.llave.trim()) return 'El celular asociado es obligatorio'
      if (!form.titular.trim()) return 'El titular es obligatorio'
      return null
    }
    if (form.tipo === 'bre_b') {
      if (!form.llave.trim()) return 'La llave Bre-B es obligatoria'
      if (!form.titular.trim()) return 'El titular es obligatorio'
      return null
    }
    if (!form.alias.trim() && !form.numeroCuenta.trim() && !form.llave.trim()) {
      return 'Indica al menos un alias, número o llave'
    }
    return null
  }

  const guardar = async () => {
    if (!form) return
    const errorValidacion = validar()
    if (errorValidacion) {
      setError(errorValidacion)
      return
    }

    const payload = {
      tipo: form.tipo,
      alias: form.alias.trim() || null,
      bancoId: form.tipo === 'banco' ? (form.bancoId || null) : null,
      tipoCuenta: form.tipo === 'banco' ? (form.tipoCuenta || null) : null,
      numeroCuenta: form.tipo === 'banco' ? (form.numeroCuenta.trim() || null) : null,
      titular: form.titular.trim() || null,
      documentoTitular: form.documentoTitular.trim() || null,
      tipoLlave: form.tipo === 'banco' ? null : form.tipoLlave,
      llave: form.tipo === 'banco' ? null : (form.llave.trim() || null),
      esPrincipal: form.esPrincipal,
      activa: form.activa,
      notas: form.notas.trim() || null,
    }

    if (editandoId) {
      await store.proveedoresCuentasBancarias.actualizar(editandoId, payload)
    } else {
      await store.proveedoresCuentasBancarias.crear({ ...payload, proveedorId: proveedor.id })
    }

    setError(null)
    cancelarForm()
  }

  const eliminar = async (cuenta: ProveedorCuentaBancaria) => {
    const nombreBanco = cuenta.bancoId ? bancosPorId.get(cuenta.bancoId)?.nombre : null
    if (!window.confirm(`¿Eliminar la cuenta "${cuenta.alias || nombreBanco || TIPO_LABELS[cuenta.tipo]}"?`)) return
    await store.proveedoresCuentasBancarias.eliminar(cuenta.id)
  }

  const esLlave = form?.tipo === 'nequi' || form?.tipo === 'daviplata' || form?.tipo === 'bre_b'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Cuentas bancarias · ${proveedor.nombre}`}
      maxWidthClassName="max-w-3xl"
    >
      <div className="space-y-4">
        <p className="text-xs text-text-muted">
          Cuentas y llaves de pago del proveedor. La marcada como principal se propone por defecto
          para consignaciones. Puedes tener varias: banco, Nequi, Daviplata, Bre-B u otro medio.
        </p>

        {form ? (
          <div className="space-y-3 rounded-sm border border-border-subtle bg-bg-alt/30 p-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-text-muted">Tipo*</span>
                <select
                  value={form.tipo}
                  onChange={(e) => setCampo('tipo', e.target.value as TipoCuentaProveedor)}
                  className="min-h-[40px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-sm text-text-heading focus:border-brand focus:outline-none"
                >
                  {(Object.keys(TIPO_LABELS) as TipoCuentaProveedor[]).map((t) => (
                    <option key={t} value={t}>{TIPO_LABELS[t]}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-text-muted">Alias</span>
                <input
                  value={form.alias}
                  onChange={(e) => setCampo('alias', e.target.value)}
                  placeholder="Ej. Bancolombia ahorros"
                  className="min-h-[40px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-sm text-text-heading focus:border-brand focus:outline-none"
                />
              </label>
            </div>

            {form.tipo === 'banco' ? (
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-text-muted">Banco*</span>
                  <select
                    value={form.bancoId}
                    onChange={(e) => {
                      if (e.target.value === '__crear_banco__') {
                        setCreandoBanco(true)
                        return
                      }
                      setCampo('bancoId', e.target.value)
                    }}
                    className="min-h-[40px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-sm text-text-heading focus:border-brand focus:outline-none"
                  >
                    <option value="">Seleccionar banco...</option>
                    {bancos.filter((b) => b.activo).map((b) => (
                      <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                    <option value="__crear_banco__">+ Crear banco...</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-text-muted">Tipo de cuenta</span>
                  <select
                    value={form.tipoCuenta}
                    onChange={(e) => setCampo('tipoCuenta', e.target.value)}
                    className="min-h-[40px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-sm text-text-heading focus:border-brand focus:outline-none"
                  >
                    <option value="ahorros">Ahorros</option>
                    <option value="corriente">Corriente</option>
                  </select>
                </label>
                <label className="col-span-2 flex flex-col gap-1">
                  <span className="text-xs text-text-muted">Número de cuenta*</span>
                  <input
                    value={form.numeroCuenta}
                    onChange={(e) => setCampo('numeroCuenta', e.target.value)}
                    placeholder="Número de cuenta para consignación"
                    className="min-h-[40px] rounded-sm border border-border-subtle bg-bg-paper px-3 font-mono text-sm text-text-heading focus:border-brand focus:outline-none"
                  />
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {form.tipo === 'bre_b' && (
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-text-muted">Tipo de llave</span>
                    <select
                      value={form.tipoLlave}
                      onChange={(e) => setCampo('tipoLlave', e.target.value as TipoLlaveProveedor)}
                      className="min-h-[40px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-sm text-text-heading focus:border-brand focus:outline-none"
                    >
                      {(Object.keys(TIPO_LLAVE_LABELS) as TipoLlaveProveedor[]).map((t) => (
                        <option key={t} value={t}>{TIPO_LLAVE_LABELS[t]}</option>
                      ))}
                    </select>
                  </label>
                )}
                <label className={`flex flex-col gap-1 ${form.tipo === 'bre_b' ? '' : 'col-span-2'}`}>
                  <span className="text-xs text-text-muted">
                    {form.tipo === 'bre_b' ? 'Llave*' : 'Celular asociado*'}
                  </span>
                  <input
                    value={form.llave}
                    onChange={(e) => setCampo('llave', e.target.value)}
                    placeholder={form.tipo === 'bre_b' ? 'Llave Bre-B' : 'Ej. 3209876543'}
                    className="min-h-[40px] rounded-sm border border-border-subtle bg-bg-paper px-3 font-mono text-sm text-text-heading focus:border-brand focus:outline-none"
                  />
                </label>
              </div>
            )}

            {creandoBanco && (
              <div className="space-y-2 rounded-sm border border-gold-300 bg-gold-50/30 p-3">
                <p className="text-xs font-medium text-text-heading">Crear banco en el catálogo</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={nuevoBancoNombre}
                    onChange={(e) => setNuevoBancoNombre(e.target.value)}
                    placeholder="Nombre (ej. Banco de Bogotá)"
                    className="min-h-[40px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-sm text-text-heading focus:border-brand focus:outline-none"
                  />
                  <input
                    value={nuevoBancoCodigo}
                    onChange={(e) => setNuevoBancoCodigo(e.target.value)}
                    placeholder="Código ACH (opcional)"
                    className="min-h-[40px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-sm text-text-heading focus:border-brand focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="md" className="text-xs" onClick={() => setCreandoBanco(false)}>
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    className="text-xs"
                    disabled={!nuevoBancoNombre.trim()}
                    onClick={async () => {
                      const nuevo = await store.bancos.crear({
                        nombre: nuevoBancoNombre.trim(),
                        codigo: nuevoBancoCodigo.trim() || null,
                      })
                      setCampo('bancoId', nuevo.id)
                      setNuevoBancoNombre('')
                      setNuevoBancoCodigo('')
                      setCreandoBanco(false)
                    }}
                  >
                    Crear y asociar
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-text-muted">Titular*</span>
                <input
                  value={form.titular}
                  onChange={(e) => setCampo('titular', e.target.value)}
                  className="min-h-[40px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-sm text-text-heading focus:border-brand focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-text-muted">Documento del titular</span>
                <input
                  value={form.documentoTitular}
                  onChange={(e) => setCampo('documentoTitular', e.target.value)}
                  className="min-h-[40px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-sm text-text-heading focus:border-brand focus:outline-none"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-text-muted">Notas</span>
              <textarea
                value={form.notas}
                onChange={(e) => setCampo('notas', e.target.value)}
                rows={2}
                className="resize-y rounded-sm border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-heading focus:border-brand focus:outline-none"
                placeholder="Ej. usar solo para anticipos; pagos menores a $1.000.000"
              />
            </label>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-text-heading">
                <input
                  type="checkbox"
                  checked={form.esPrincipal}
                  onChange={(e) => setCampo('esPrincipal', e.target.checked)}
                  className="rounded border border-border-subtle"
                />
                Cuenta principal
              </label>
              <label className="flex items-center gap-2 text-sm text-text-heading">
                <input
                  type="checkbox"
                  checked={form.activa}
                  onChange={(e) => setCampo('activa', e.target.checked)}
                  className="rounded border border-border-subtle"
                />
                Activa
              </label>
              {esLlave && (
                <span className="text-xs text-text-muted">Se muestra el último tramo de la llave por seguridad.</span>
              )}
            </div>

            {error && (
              <p role="alert" className="rounded-sm border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 border-t border-border-subtle pt-3">
              <Button variant="ghost" size="md" onClick={cancelarForm}>Cancelar</Button>
              <Button variant="primary" size="md" onClick={() => guard(guardar)} disabled={isPending} loading={isPending}>
                {editandoId ? 'Guardar cambios' : 'Agregar cuenta'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {cuentas.length === 0 ? (
              <p className="rounded-sm border border-dashed border-border-subtle px-4 py-6 text-center text-sm text-text-muted italic">
                Este proveedor todavía no tiene cuentas registradas.
              </p>
            ) : (
              <div className="space-y-2">
                {cuentas.map((c) => (
                  <div
                    key={c.id}
                    className={`flex flex-col gap-2 rounded-sm border p-3 sm:flex-row sm:items-center sm:justify-between ${
                      c.activa ? 'border-border-subtle bg-bg-paper' : 'border-border-subtle/60 bg-bg-alt/30 opacity-70'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-text-heading">
                          {c.alias || (c.bancoId ? bancosPorId.get(c.bancoId)?.nombre : null) || TIPO_LABELS[c.tipo]}
                        </span>
                        <Badge tone="neutral">{TIPO_LABELS[c.tipo]}</Badge>
                        {c.esPrincipal && <Badge tone="info" dot>Principal</Badge>}
                        {!c.activa && <Badge tone="danger">Inactiva</Badge>}
                      </div>
                      <p className="mt-1 font-mono text-xs text-text-muted">{referenciaCuenta(c)}</p>
                      <p className="text-xs text-text-muted">
                        {[c.titular, c.tipo === 'banco' ? c.tipoCuenta : null].filter(Boolean).join(' · ')}
                      </p>
                      {c.notas && <p className="mt-1 text-xs text-text-muted italic">{c.notas}</p>}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button variant="ghost" size="md" className="text-xs" onClick={() => iniciarEdicion(c)}>
                        Editar
                      </Button>
                      <Button variant="ghost" size="md" className="text-xs text-red-600" onClick={() => eliminar(c)}>
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between border-t border-border-subtle pt-3">
              <Button variant="ghost" size="md" onClick={onClose}>Cerrar</Button>
              <Button variant="primary" size="md" onClick={iniciarNueva}>+ Agregar cuenta</Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
