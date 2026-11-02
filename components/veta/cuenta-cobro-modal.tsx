'use client'

import { useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/veta/button'
import { Modal } from '@/components/veta/modal'
import { type Contrato } from '@/lib/data/contracts'
import { type HitoPago } from '@/lib/data/contracts'
import { type Cliente } from '@/lib/data/contracts'
import { type Proyecto } from '@/lib/data/contracts'
import { useToast } from '@/components/veta/toast-provider'

function parseNum(s: string | null | undefined): number {
  if (!s) return 0
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

interface CuentaCobroModalProps {
  open: boolean
  onClose: () => void
  contrato: Contrato
  hitos: HitoPago[]
  cliente: Cliente | undefined
  proyecto: Proyecto
}

export function CuentaCobroModal({
  open,
  onClose,
  contrato,
  hitos,
  cliente,
  proyecto,
}: CuentaCobroModalProps) {
  const { mostrarError } = useToast()

  const [hitoSeleccionado, setHitoSeleccionado] = useState<HitoPago | null>(null)
  const [numeroDocumento, setNumeroDocumento] = useState('')
  const [fechaVencimiento, setFechaVencimiento] = useState('')

  const fechaEmision = useMemo(() => {
    const hoy = new Date()
    return hoy.toISOString().slice(0, 10)
  }, [])

  const generarPDF = useCallback(() => {
    if (!hitoSeleccionado) {
      mostrarError('Selecciona un hito antes de generar la cuenta de cobro.')
      return
    }
    if (!numeroDocumento.trim()) {
      mostrarError('Ingresa un número de documento para la cuenta de cobro.')
      return
    }
    if (!cliente) {
      mostrarError('El proyecto no tiene un cliente vinculado. No se puede generar la cuenta de cobro.')
      return
    }

    // Mismo pipeline que el contrato: página imprimible + window.print(), sin PDF binario.
    const query = new URLSearchParams({
      hitoId: hitoSeleccionado.id,
      numeroDocumento: numeroDocumento.trim(),
      fechaVencimiento: fechaVencimiento || fechaEmision,
    })
    window.open(`/erp/cotizador/${proyecto.id}/cuenta-cobro?${query.toString()}`, '_blank', 'noopener')
    onClose()
  }, [hitoSeleccionado, numeroDocumento, fechaEmision, fechaVencimiento, cliente, proyecto.id, mostrarError, onClose])

  if (!open) return null

  const hitosConMonto = hitos.map((h) => {
    const monto =
      h.tipo === 'percentage'
        ? `${h.montoOPorcentaje}% del total`
        : formatCOP(parseNum(h.montoOPorcentaje))
    return `${h.orden}. ${h.razon} — ${monto}`
  })

  return (
    <Modal open={open} onClose={onClose} title="Generar Cuenta de Cobro" maxWidthClassName="max-w-2xl">
      <div className="space-y-4">
        <p className="text-xs text-text-muted">
          Completa los datos y selecciona el hito. La cuenta de cobro se abrirá en una pestaña nueva lista para imprimir o guardar como PDF.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-heading uppercase tracking-wide">
              Número de documento *
            </label>
            <input
              type="text"
              value={numeroDocumento}
              onChange={(e) => setNumeroDocumento(e.target.value)}
              placeholder="Ej. CC-0001"
              className="rounded border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-heading focus:border-gold-400 focus:outline-none w-full"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-heading uppercase tracking-wide">
              Fecha de vencimiento
            </label>
            <input
              type="date"
              value={fechaVencimiento}
              onChange={(e) => setFechaVencimiento(e.target.value)}
              className="rounded border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-heading focus:border-gold-400 focus:outline-none w-full"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-text-heading uppercase tracking-wide">
            Hito de contrato *
          </label>
          <select
            value={hitoSeleccionado?.id ?? ''}
            onChange={(e) => {
              const hito = hitos.find((h) => h.id === e.target.value)
              setHitoSeleccionado(hito ?? null)
            }}
            className="rounded border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-heading focus:border-gold-400 focus:outline-none w-full"
          >
            <option value="">Seleccionar hito...</option>
            {hitos.map((h) => (
              <option key={h.id} value={h.id}>
                {hitosConMonto[hitos.indexOf(h)]}
              </option>
            ))}
          </select>
          {hitos.length === 0 && (
            <p className="text-xs text-text-muted italic">No hay hitos definidos en este contrato.</p>
          )}
        </div>

        {hitoSeleccionado && (
          <div className="rounded border border-border-subtle bg-bg-alt/50 p-3 space-y-1">
            <p className="text-xs font-semibold text-text-heading uppercase tracking-wide">Resumen del hito</p>
            <p className="text-sm text-text-muted">
              <strong>Contrato:</strong> {contrato.codigoContrato}
            </p>
            <p className="text-sm text-text-muted">
              <strong>Hito {hitoSeleccionado.orden}:</strong> {hitoSeleccionado.razon}
            </p>
            <p className="text-sm text-text-muted">
              <strong>Valor:</strong>{' '}
              {hitoSeleccionado.tipo === 'percentage'
                ? `${hitoSeleccionado.montoOPorcentaje}% del contrato`
                : formatCOP(parseNum(hitoSeleccionado.montoOPorcentaje))}
            </p>
            <p className="text-sm text-text-muted">
              <strong>Valor total contrato:</strong> {formatCOP(parseNum(contrato.valorTotal))}
            </p>
          </div>
        )}

        <div className="pt-2 flex justify-end gap-2">
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={generarPDF}
            disabled={!hitoSeleccionado || !numeroDocumento.trim() || !cliente}
          >
            Abrir e imprimir
          </Button>
        </div>
      </div>
    </Modal>
  )
}
