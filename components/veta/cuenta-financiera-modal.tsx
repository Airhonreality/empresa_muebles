'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/veta/button'
import { InputField } from '@/components/veta/input-field'
import { Modal } from '@/components/veta/modal'
import { MoneyInput, parseMoney } from '@/components/veta/money-input'
import { useDataStore, type CuentaFinanciera } from '@/lib/data'
import { usePendingGuard } from '@/lib/hooks/usePendingGuard'
import { useToast } from '@/components/veta/toast-provider'

interface CuentaFinancieraModalProps {
  open: boolean
  onClose: () => void
  nombreInicial?: string
  onSaved?: (cuenta: CuentaFinanciera) => void
}

const TIPOS_CUENTA = [
  { value: 'caja', label: 'Caja' },
  { value: 'caja_menor', label: 'Caja menor' },
  { value: 'banco', label: 'Banco' },
  { value: 'billetera_digital', label: 'Billetera digital' },
  { value: 'otro', label: 'Otra' },
] as const

/** t-181 — Alta de cuenta financiera con saldo inicial. Para el flujo simple se usa
 *  una sola “Caja principal”; el formulario sigue disponible si más adelante agregan bancos. */
export function CuentaFinancieraModal({ open, onClose, nombreInicial = 'Caja principal', onSaved }: CuentaFinancieraModalProps) {
  const store = useDataStore()
  const { guard, isPending } = usePendingGuard()
  const { mostrarError } = useToast()

  const [nombre, setNombre] = useState(nombreInicial)
  const [tipo, setTipo] = useState<string>('caja')
  const [saldoInicial, setSaldoInicial] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setNombre(nombreInicial)
    setTipo('caja')
    setSaldoInicial('')
    setError(null)
  }, [open, nombreInicial])

  const handleSubmit = useCallback(() => {
    void guard(async () => {
      setError(null)
      if (!nombre.trim()) {
        setError('El nombre de la cuenta es obligatorio.')
        return
      }
      const promesa = store.cuentasFinancieras.crear({
        id: crypto.randomUUID(),
        nombre: nombre.trim(),
        tipo,
        saldoInicial: String(parseMoney(saldoInicial)),
      })
      onClose()
      void promesa
        .then((cuenta) => onSaved?.(cuenta))
        .catch((e) => mostrarError(e instanceof Error ? e.message : 'No se pudo crear la cuenta.'))
    })
  }, [nombre, tipo, saldoInicial, store, onClose, onSaved, guard, mostrarError])

  return (
    <Modal open={open} onClose={onClose} title="Nueva cuenta financiera">
      <div className="space-y-4">
        <InputField
          label="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Caja principal"
        />

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-text-muted">Tipo</span>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-heading focus:border-brand focus:outline-none"
          >
            {TIPOS_CUENTA.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>

        <MoneyInput
          label="Saldo inicial"
          value={saldoInicial}
          onChange={setSaldoInicial}
          placeholder="0"
        />

        {error && (
          <p role="alert" className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="primary" size="md" loading={isPending} onClick={handleSubmit}>
            Crear cuenta
          </Button>
          <Button variant="ghost" size="md" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
