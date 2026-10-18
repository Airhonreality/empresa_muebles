'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/veta/button'
import { FilePicker } from '@/components/veta/file-picker'
import { InputField } from '@/components/veta/input-field'
import { Modal } from '@/components/veta/modal'
import { MoneyInput, parseMoney } from '@/components/veta/money-input'
import { useDataStore, type CuentaFinanciera } from '@/lib/data'
import { usePendingGuard } from '@/lib/hooks/usePendingGuard'

export type TipoMovimientoManual = 'entrada' | 'salida'

interface MovimientoFinancieroModalProps {
  open: boolean
  onClose: () => void
  tipoInicial?: TipoMovimientoManual
}

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function seleccionarCuenta(cuentas: CuentaFinanciera[]): string {
  return (cuentas.find((c) => c.nombre === 'Caja principal') ?? cuentas[0])?.id ?? ''
}

/** t-181 — Registro manual del libro: entrada (credito) o salida (debito).
 *  Una sola caja por defecto; si hay más de una cuenta, aparece un selector. */
export function MovimientoFinancieroModal({
  open,
  onClose,
  tipoInicial = 'salida',
}: MovimientoFinancieroModalProps) {
  const store = useDataStore()
  const cuentas = store.cuentasFinancieras.listar()
  const proyectos = store.proyectos.listar()
  const proveedores = store.proveedores.listar()
  const { guard, isPending } = usePendingGuard()

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

  useEffect(() => {
    if (!open) return
    setTipo(tipoInicial)
    setFecha(hoyISO())
    setDescripcion('')
    setMonto('')
    setCuentaId(seleccionarCuenta(cuentas))
    setProyectoId('')
    setProveedorId('')
    setComprobantes([])
    setMasOpciones(false)
    setError(null)
    // cuentas cambia al crearse la primera cuenta con el modal abierto; recalcular el default.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tipoInicial, cuentas.length])

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

      try {
        await store.movimientosFinancieros.crear({
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
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo registrar el movimiento.')
      }
    })
  }, [cuentaId, descripcion, monto, tipo, fecha, proyectoId, proveedorId, comprobantes, store, onClose, guard])

  const sinCuentas = cuentas.length === 0
  const titulo = tipo === 'entrada' ? 'Registrar entrada' : 'Registrar salida'

  return (
    <Modal open={open} onClose={onClose} title={titulo}>
      <div className="space-y-4">
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

        {sinCuentas ? (
          <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            No hay cuentas financieras. Crea “Caja principal” antes de registrar movimientos.
          </p>
        ) : cuentas.length === 1 ? (
          <p className="text-sm text-text-muted">
            Cuenta: <span className="font-medium text-text-heading">{cuentas[0].nombre}</span>
          </p>
        ) : (
          <label className="flex flex-col gap-1">
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
              <label className="flex flex-col gap-1">
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

              {tipo === 'salida' && (
                <label className="flex flex-col gap-1">
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
            disabled={sinCuentas}
            onClick={handleSubmit}
          >
            Registrar {tipo}
          </Button>
          <Button variant="ghost" size="md" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
