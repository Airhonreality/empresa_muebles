'use client'

import { useState } from 'react'
import { Modal } from '@/components/veta/modal'
import { Button } from '@/components/veta/button'
import { EntityFields, type EntityFieldSpec } from '@/components/veta/entity-fields'
import { useDataStore, type Proveedor } from '@/lib/data'
import { CuentasBancariasProveedorModal } from '@/components/veta/cuentas-bancarias-proveedor-modal'
import { usePendingGuard } from '@/lib/hooks/usePendingGuard'

export interface ProveedorFormValues {
  nombre: string
  nit: string
  categoria: string
  descripcion: string
  contactoNombre: string
  contactoCargo: string
  email: string
  whatsapp: string
  telefonoComercial: string
  telefonoAlterno: string
  direccionDespacho: string
  ciudad: string
  medioPago: string
  diasEntregaDefault: string
  transportadora: string
  tarifaFlete: string
}

const EMPTY_FORM: ProveedorFormValues = {
  nombre: '',
  nit: '',
  categoria: '',
  descripcion: '',
  contactoNombre: '',
  contactoCargo: '',
  email: '',
  whatsapp: '',
  telefonoComercial: '',
  telefonoAlterno: '',
  direccionDespacho: '',
  ciudad: '',
  medioPago: '',
  diasEntregaDefault: '',
  transportadora: '',
  tarifaFlete: '',
}

function formFromProveedor(p: Proveedor): ProveedorFormValues {
  return {
    nombre: p.nombre,
    nit: p.nit ?? '',
    categoria: p.categoria ?? '',
    descripcion: p.descripcion ?? '',
    contactoNombre: p.contactoNombre ?? '',
    contactoCargo: p.contactoCargo ?? '',
    email: p.email ?? '',
    whatsapp: p.whatsapp ?? '',
    telefonoComercial: p.telefonoComercial ?? '',
    telefonoAlterno: p.telefonoAlterno ?? '',
    direccionDespacho: p.direccionDespacho ?? '',
    ciudad: p.ciudad ?? '',
    medioPago: p.medioPago ?? '',
    diasEntregaDefault: p.diasEntregaDefault != null ? String(p.diasEntregaDefault) : '',
    transportadora: p.transportadora ?? '',
    tarifaFlete: p.tarifaFlete ?? '',
  }
}

const CAMPOS_IDENTIDAD: EntityFieldSpec<ProveedorFormValues>[] = [
  { key: 'nombre', label: 'Nombre / razón social', placeholder: 'Ej. Maderas del Llano S.A.S', required: true, colSpan: 'full' },
]

const CAMPOS_FISCALES: EntityFieldSpec<ProveedorFormValues>[] = [
  { key: 'nit', label: 'NIT' },
  { key: 'categoria', label: 'Categoría', placeholder: 'Ej. Maderas, Herrajes' },
]

const CAMPOS_CONTACTO_PERSONA: EntityFieldSpec<ProveedorFormValues>[] = [
  { key: 'contactoNombre', label: 'Persona de contacto', placeholder: 'Ej. Ana Gómez' },
  { key: 'contactoCargo', label: 'Cargo', placeholder: 'Ej. Ventas' },
]

const CAMPOS_CONTACTO: EntityFieldSpec<ProveedorFormValues>[] = [
  { key: 'email', label: 'Correo', type: 'email' },
  { key: 'whatsapp', label: 'WhatsApp', type: 'tel' },
  { key: 'telefonoComercial', label: 'Teléfono comercial', type: 'tel' },
  { key: 'telefonoAlterno', label: 'Teléfono alterno', type: 'tel' },
  { key: 'ciudad', label: 'Ciudad' },
]

const CAMPOS_LOGISTICA_1: EntityFieldSpec<ProveedorFormValues>[] = [
  { key: 'direccionDespacho', label: 'Dirección de despacho', colSpan: 'full' },
]

const CAMPOS_LOGISTICA_2: EntityFieldSpec<ProveedorFormValues>[] = [
  { key: 'medioPago', label: 'Medio de pago', placeholder: 'Ej. transferencia' },
  { key: 'transportadora', label: 'Transportadora', placeholder: 'Ej. Coordinadora' },
]

const CAMPOS_ENTREGA: EntityFieldSpec<ProveedorFormValues>[] = [
  { key: 'diasEntregaDefault', label: 'Días de entrega (default)', kind: 'number', min: 0 },
  { key: 'tarifaFlete', label: 'Tarifa de flete', kind: 'money' },
]

function parseNum(s: string | null | undefined): number {
  if (!s) return 0
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

export interface ProveedorFormModalProps {
  open: boolean
  onClose: () => void
  /** Si viene, el mismo modal edita; si no, crea. */
  proveedor?: Proveedor | null
  onSaved?: (proveedor: Proveedor) => void
}

export function ProveedorFormModal({ open, onClose, proveedor, onSaved }: ProveedorFormModalProps) {
  const store = useDataStore()
  const [form, setForm] = useState<ProveedorFormValues>(() =>
    proveedor ? formFromProveedor(proveedor) : EMPTY_FORM
  )
  const [error, setError] = useState<string | null>(null)
  const [cuentasModalAbierto, setCuentasModalAbierto] = useState(false)
  const { guard, isPending } = usePendingGuard()

  const setCampo = <K extends keyof ProveedorFormValues>(campo: K, valor: ProveedorFormValues[K]) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  const guardar = async () => {
    if (!form.nombre.trim()) {
      setError('El nombre del proveedor es obligatorio')
      return
    }
    if (parseNum(form.diasEntregaDefault) < 0) {
      setError('Los días de entrega no pueden ser negativos')
      return
    }

    const payload = {
      nombre: form.nombre.trim(),
      nit: form.nit.trim() || null,
      categoria: form.categoria.trim() || null,
      descripcion: form.descripcion.trim() || null,
      contactoNombre: form.contactoNombre.trim() || null,
      contactoCargo: form.contactoCargo.trim() || null,
      email: form.email.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      telefonoComercial: form.telefonoComercial.trim() || null,
      telefonoAlterno: form.telefonoAlterno.trim() || null,
      direccionDespacho: form.direccionDespacho.trim() || null,
      ciudad: form.ciudad.trim() || null,
      medioPago: form.medioPago.trim() || null,
      diasEntregaDefault: form.diasEntregaDefault.trim() ? parseNum(form.diasEntregaDefault) : null,
      transportadora: form.transportadora.trim() || null,
      tarifaFlete: form.tarifaFlete.trim() || null,
    }

    const resultado = proveedor
      ? await store.proveedores.actualizar(proveedor.id, payload)
      : await store.proveedores.crear(payload)

    if (!resultado) {
      setError('No se pudo guardar el proveedor')
      return
    }

    setError(null)
    onSaved?.(resultado)
    onClose()
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={proveedor ? 'Editar proveedor' : 'Nuevo proveedor'}
        maxWidthClassName="max-w-2xl"
      >
        <div className="space-y-3">
        <EntityFields fields={CAMPOS_IDENTIDAD} values={form} onChange={setCampo} />
        <label className="flex flex-col gap-1">
          <span className="text-xs text-text-muted">Descripción</span>
          <textarea
            value={form.descripcion}
            onChange={(e) => setCampo('descripcion', e.target.value)}
            rows={3}
            placeholder="Qué vende, condiciones, contactos alternos, notas de negociación..."
            className="resize-y rounded-sm border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-heading focus:border-brand focus:shadow-ring-focus focus:outline-none"
          />
        </label>
        <EntityFields className="grid grid-cols-2 gap-3" fields={CAMPOS_FISCALES} values={form} onChange={setCampo} />
        <div className="border-t border-border-subtle pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Contacto</p>
          <EntityFields className="grid grid-cols-2 gap-3" fields={CAMPOS_CONTACTO_PERSONA} values={form} onChange={setCampo} />
        </div>
        <EntityFields className="grid grid-cols-2 gap-3" fields={CAMPOS_CONTACTO} values={form} onChange={setCampo} />
        <EntityFields fields={CAMPOS_LOGISTICA_1} values={form} onChange={setCampo} />
        <EntityFields className="grid grid-cols-2 gap-3" fields={CAMPOS_LOGISTICA_2} values={form} onChange={setCampo} />
        <EntityFields className="grid grid-cols-2 gap-3" fields={CAMPOS_ENTREGA} values={form} onChange={setCampo} />

        {error && (
          <p role="alert" className="rounded-sm border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3">
            <div>
              {proveedor && (
                <Button variant="ghost" size="md" className="text-xs" onClick={() => setCuentasModalAbierto(true)}>
                  Cuentas bancarias
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="md" onClick={onClose}>
                Cancelar
              </Button>
              <Button variant="primary" size="md" onClick={() => guard(guardar)} disabled={isPending} loading={isPending}>
                {proveedor ? 'Guardar cambios' : 'Crear proveedor'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {cuentasModalAbierto && proveedor && (
        <CuentasBancariasProveedorModal
          open={true}
          proveedor={proveedor}
          onClose={() => setCuentasModalAbierto(false)}
        />
      )}
    </>
  )
}
