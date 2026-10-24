'use client'

import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { CuentaFinancieraModal } from '@/components/veta/cuenta-financiera-modal'
import { FilePicker } from '@/components/veta/file-picker'
import { InputField } from '@/components/veta/input-field'
import { Modal } from '@/components/veta/modal'
import { MoneyInput, parseMoney } from '@/components/veta/money-input'
import { ProveedorFormModal } from '@/components/veta/proveedor-form-modal'
import { ProyectoRapidoModal } from '@/components/veta/proyecto-rapido-modal'
import { useDataStore, type CuentaFinanciera, type MovimientoFinanciero } from '@/lib/data'
import { usePendingGuard } from '@/lib/hooks/usePendingGuard'
import { useToast } from '@/components/veta/toast-provider'

export type TipoMovimientoManual = 'entrada' | 'salida'

interface MovimientoFinancieroModalProps {
  open: boolean
  onClose: () => void
  tipoInicial?: TipoMovimientoManual
  /** Si viene, el modal edita ese movimiento en vez de crear uno nuevo. */
  movimiento?: MovimientoFinanciero | null
  onSaved?: (movimiento: MovimientoFinanciero) => void
}

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function seleccionarCuenta(cuentas: CuentaFinanciera[]): string {
  return (cuentas.find((c) => c.nombre === 'Caja principal') ?? cuentas[0])?.id ?? ''
}

function tipoDeMovimiento(mov: MovimientoFinanciero): TipoMovimientoManual {
  return mov.tipo === 'credito' ? 'entrada' : 'salida'
}

/** t-181 — Registro manual del libro: entrada (credito) o salida (debito).
 *  Una sola caja por defecto; si hay más de una cuenta, aparece un selector.
 *  Los desplegables de proyecto y proveedor permiten crear la entidad en el mismo modal
 *  (patrón de modales anidados), y el proveedor se puede completar después editando el
 *  movimiento ya registrado. */
export function MovimientoFinancieroModal({
  open,
  onClose,
  tipoInicial = 'salida',
  movimiento = null,
  onSaved,
}: MovimientoFinancieroModalProps) {
  const store = useDataStore()
  const cuentas = store.cuentasFinancieras.listar()
  const proyectos = store.proyectos.listar()
  const proveedores = store.proveedores.listar()
  const { guard, isPending } = usePendingGuard()
  const { mostrarError } = useToast()

  const editando = Boolean(movimiento)
  const [tipo, setTipo] = useState<TipoMovimientoManual>(tipoInicial)
  const [fecha, setFecha] = useState(hoyISO())
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [cuentaId, setCuentaId] = useState('')
  const [proyectoId, setProyectoId] = useState('')
  const [proveedorId, setProveedorId] = useState('')
  const [comprobantes, setComprobantes] = useState<string[]>([])
  const [masOpciones, setMasOpciones] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [proveedorModalAbierto, setProveedorModalAbierto] = useState(false)
  const [proyectoModalAbierto, setProyectoModalAbierto] = useState(false)
  const [cuentaModalAbierto, setCuentaModalAbierto] = useState(false)

  useEffect(() => {
    if (!open) return
    if (movimiento) {
      const tipoMov = tipoDeMovimiento(movimiento)
      setTipo(tipoMov)
      setFecha(movimiento.fecha)
      setDescripcion(movimiento.descripcion)
      setMonto(movimiento.monto)
      setCuentaId(movimiento.cuentaOrigenId ?? movimiento.cuentaDestinoId ?? seleccionarCuenta(cuentas))
      setProyectoId(movimiento.proyectoId ?? '')
      setProveedorId(movimiento.proveedorId ?? '')
      setComprobantes(movimiento.comprobanteUrl ? [movimiento.comprobanteUrl] : [])
      setMasOpciones(Boolean(movimiento.proyectoId || movimiento.proveedorId))
    } else {
      setTipo(tipoInicial)
      setFecha(hoyISO())
      setDescripcion('')
      setMonto('')
      setCuentaId(seleccionarCuenta(cuentas))
      setProyectoId('')
      setProveedorId('')
      setComprobantes([])
      setMasOpciones(false)
    }
    setError(null)
    setProveedorModalAbierto(false)
    setProyectoModalAbierto(false)
    setCuentaModalAbierto(false)
    // Solo reiniciar al abrir o cambiar de movimiento; si cambia la lista de cuentas
    // (ej. se creó una desde el modal anidado) no se debe borrar lo que el usuario escribió.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, movimiento?.id])

  // Si el usuario crea la primera cuenta desde el modal anidado, seleccionarla sin resetear el form.
  useEffect(() => {
    if (!open || cuentaId || cuentas.length === 0) return
    setCuentaId(seleccionarCuenta(cuentas))
  }, [open, cuentaId, cuentas])

  const handleTipo = useCallback((nuevo: TipoMovimientoManual) => {
    setTipo(nuevo)
    if (nuevo === 'entrada') setProveedorId('')
    setError(null)
  }, [])

  const handleSubmit = useCallback(() => {
    void guard(async () => {
      setError(null)
      if (!cuentaId) {
        setError('Primero crea una cuenta financiera.')
        return
      }
      if (!descripcion.trim()) {
        setError('La descripción es obligatoria.')
        return
      }
      if (parseMoney(monto) <= 0) {
        setError('El monto debe ser mayor que cero.')
        return
      }

      if (movimiento) {
        const promesa = store.movimientosFinancieros.actualizar(movimiento.id, {
          fecha,
          descripcion: descripcion.trim(),
          monto,
          proyectoId: proyectoId || null,
          proveedorId: tipo === 'salida' ? proveedorId || null : null,
          comprobanteUrl: comprobantes[0] ?? null,
        })
        onClose()
        void promesa
          .then((actualizado) => {
            if (!actualizado) {
              mostrarError('No se encontró el movimiento a editar.')
              return
            }
            onSaved?.(actualizado)
          })
          .catch((e) => mostrarError(e instanceof Error ? e.message : 'No se pudo guardar el movimiento.'))
      } else {
        const promesa = store.movimientosFinancieros.crear({
          id: crypto.randomUUID(),
          tipo,
          fecha,
          descripcion: descripcion.trim(),
          monto,
          cuentaId,
          proyectoId: proyectoId || null,
          proveedorId: tipo === 'salida' ? proveedorId || null : null,
          comprobanteUrl: comprobantes[0] ?? null,
        })
        onClose()
        void promesa
          .then((creado) => onSaved?.(creado))
          .catch((e) => mostrarError(e instanceof Error ? e.message : 'No se pudo registrar el movimiento.'))
      }
    })
  }, [cuentaId, descripcion, monto, tipo, fecha, proyectoId, proveedorId, comprobantes, store, movimiento, onSaved, onClose, guard, mostrarError])

  const sinCuentas = cuentas.length === 0
  const cuentaActual = cuentas.find((c) => c.id === cuentaId)
  const titulo = editando
    ? 'Editar movimiento'
    : tipo === 'entrada'
      ? 'Registrar entrada'
      : 'Registrar salida'

  return (
    <>
      <Modal open={open} onClose={onClose} title={titulo}>
        <div className="space-y-4">
          {editando ? (
            <div className="flex items-center gap-2">
              <Badge tone={tipo === 'salida' ? 'danger' : 'info'} dot>
                {tipo === 'salida' ? 'Salida' : 'Entrada'}
              </Badge>
              <span className="text-xs text-text-muted">El tipo y la cuenta no se modifican.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={tipo === 'entrada' ? 'primary' : 'secondary'}
                size="md"
                onClick={() => handleTipo('entrada')}
              >
                Entrada
              </Button>
              <Button
                variant={tipo === 'salida' ? 'primary' : 'secondary'}
                size="md"
                onClick={() => handleTipo('salida')}
              >
                Salida
              </Button>
            </div>
          )}

          {editando ? (
            <p className="text-sm text-text-muted">
              Cuenta: <span className="font-medium text-text-heading">{cuentaActual?.nombre ?? '—'}</span>
            </p>
          ) : sinCuentas ? (
            <div className="space-y-2 rounded border border-amber-200 bg-amber-50 px-3 py-3">
              <p className="text-sm text-amber-800">
                No hay cuentas financieras. Crea “Caja principal” antes de registrar movimientos.
              </p>
              <Button variant="primary" size="md" onClick={() => setCuentaModalAbierto(true)}>
                Crear caja principal
              </Button>
            </div>
          ) : cuentas.length === 1 ? (
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-text-muted">
                Cuenta: <span className="font-medium text-text-heading">{cuentas[0].nombre}</span>
              </p>
              <Button variant="ghost" size="sm" onClick={() => setCuentaModalAbierto(true)}>
                + Nueva cuenta
              </Button>
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <label className="flex flex-1 flex-col gap-1">
                <span className="text-sm font-medium text-text-muted">Cuenta</span>
                <select
                  value={cuentaId}
                  onChange={(e) => setCuentaId(e.target.value)}
                  className="min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-heading focus:border-brand focus:outline-none"
                >
                  {cuentas.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </label>
              <Button variant="secondary" size="md" onClick={() => setCuentaModalAbierto(true)}>
                + Crear
              </Button>
            </div>
          )}

          <InputField
            label="Fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />

          <InputField
            label="Descripción"
            placeholder={tipo === 'entrada' ? 'Ej. Anticipo contrato Cocina Pérez' : 'Ej. Compra de herrajes'}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />

          <MoneyInput label="Monto" value={monto} onChange={setMonto} placeholder="0" />

          <FilePicker
            label="Comprobante de pago (opcional)"
            value={comprobantes}
            onChange={setComprobantes}
            accept="image/*,application/pdf"
            multiple={false}
            r2Prefix="finanzas/comprobantes"
          />

          <div className="rounded border border-border-subtle bg-bg-alt/40">
            <button
              type="button"
              onClick={() => setMasOpciones((v) => !v)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-text-muted hover:text-text-heading"
            >
              <span>Más opciones</span>
              <span className={`text-xs transition-transform duration-fast ${masOpciones ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {masOpciones && (
              <div className="space-y-3 border-t border-border-subtle px-3 py-3">
                <div className="flex items-end gap-2">
                  <label className="flex flex-1 flex-col gap-1">
                    <span className="text-xs text-text-muted">Proyecto (opcional)</span>
                    <select
                      value={proyectoId}
                      onChange={(e) => setProyectoId(e.target.value)}
                      className="min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-sm text-text-heading focus:border-brand focus:outline-none"
                    >
                      <option value="">Sin proyecto</option>
                      {proyectos.map((p) => (
                        <option key={p.id} value={p.id}>{p.codigo} — {p.nombreProyecto}</option>
                      ))}
                    </select>
                  </label>
                  <Button variant="secondary" size="md" onClick={() => setProyectoModalAbierto(true)}>
                    + Crear
                  </Button>
                </div>

                {tipo === 'salida' && (
                  <div className="flex items-end gap-2">
                    <label className="flex flex-1 flex-col gap-1">
                      <span className="text-xs text-text-muted">Proveedor (opcional)</span>
                      <select
                        value={proveedorId}
                        onChange={(e) => setProveedorId(e.target.value)}
                        className="min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-sm text-text-heading focus:border-brand focus:outline-none"
                      >
                        <option value="">Sin proveedor</option>
                        {proveedores.map((p) => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                    </label>
                    <Button variant="secondary" size="md" onClick={() => setProveedorModalAbierto(true)}>
                      + Crear
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <p role="alert" className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              variant="primary"
              size="md"
              loading={isPending}
              disabled={sinCuentas && !editando}
              onClick={handleSubmit}
            >
              {editando ? 'Guardar cambios' : `Registrar ${tipo}`}
            </Button>
            <Button variant="ghost" size="md" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      <ProveedorFormModal
        open={proveedorModalAbierto}
        onClose={() => setProveedorModalAbierto(false)}
        onSaved={(proveedor) => {
          setProveedorId(proveedor.id)
          setMasOpciones(true)
        }}
      />

      <ProyectoRapidoModal
        open={proyectoModalAbierto}
        onClose={() => setProyectoModalAbierto(false)}
        onSaved={(proyecto) => {
          setProyectoId(proyecto.id)
          setMasOpciones(true)
        }}
      />

      <CuentaFinancieraModal
        open={cuentaModalAbierto}
        onClose={() => setCuentaModalAbierto(false)}
        onSaved={(cuenta) => setCuentaId(cuenta.id)}
      />
    </>
  )
}
