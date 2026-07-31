'use client'

import { Trash2, Plus, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { COP } from './utils'

export interface PaymentMilestone {
  id: string
  type: 'percentage' | 'fixed'
  amount: number
  date?: string
  reason?: string
}

export const STANDARD_MILESTONES: PaymentMilestone[] = [
  { id: '1', type: 'percentage', amount: 50, reason: 'Anticipo inicial' },
  { id: '2', type: 'percentage', amount: 25, reason: 'Al momento de instalación' },
  { id: '3', type: 'percentage', amount: 25, reason: 'Pago final' }
]

function isStandardShape(milestones: PaymentMilestone[]): boolean {
  if (milestones.length !== STANDARD_MILESTONES.length) return false
  return milestones.every((m, i) =>
    m.type === STANDARD_MILESTONES[i].type && m.amount === STANDARD_MILESTONES[i].amount
  )
}

interface PaymentScheduleCalculatorProps {
  totalContract: number
  milestones: PaymentMilestone[]
  onChange: (milestones: PaymentMilestone[]) => void
}

// Componente totalmente controlado: no guarda estado propio.
// La fuente de verdad es siempre `milestones` (prop del padre).
export function PaymentScheduleCalculator({
  totalContract,
  milestones,
  onChange
}: PaymentScheduleCalculatorProps) {
  const useStandard = isStandardShape(milestones)

  // Calcular suma total de los hitos
  const totalMilestones = milestones.reduce((acc, m) => {
    if (m.type === 'percentage') {
      return acc + (totalContract * m.amount) / 100
    }
    return acc + m.amount
  }, 0)

  const difference = totalContract - totalMilestones
  const isValid = Math.abs(difference) < 0.01
  const isOver = difference < -0.01

  const handleAddMilestone = () => {
    const newId = String(Math.max(...milestones.map(m => parseInt(m.id) || 0), 0) + 1)
    onChange([
      ...milestones,
      { id: newId, type: 'percentage', amount: 10, reason: '' }
    ])
  }

  const handleRemoveMilestone = (id: string) => {
    if (milestones.length > 1) {
      onChange(milestones.filter(m => m.id !== id))
    }
  }

  const handleUpdateMilestone = (id: string, updates: Partial<PaymentMilestone>) => {
    onChange(milestones.map(m => (m.id === id ? { ...m, ...updates } : m)))
  }

  const applyStandard = () => {
    onChange(STANDARD_MILESTONES.map(m => ({ ...m })))
  }

  return (
    <div className="space-y-4">
      {/* Modo actual (derivado de los datos) + acción de reset */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`px-3 py-1.5 rounded-lg font-semibold text-xs border ${
            useStandard
              ? 'bg-amber-100 text-amber-800 border-amber-300'
              : 'bg-stone-100 text-stone-600 border-stone-200'
          }`}
        >
          {useStandard ? 'Anticipos Estándar (50-25-25)' : 'Plan Personalizado'}
        </span>
        {!useStandard && (
          <button
            type="button"
            onClick={applyStandard}
            className="px-3 py-1.5 rounded-lg font-semibold text-xs bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-150 transition-colors"
          >
            Restablecer a Estándar
          </button>
        )}
      </div>

      {/* Milestones list */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {milestones.map((milestone, idx) => (
          <div
            key={milestone.id}
            className="bg-white rounded-lg border border-stone-200/60 p-3 space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] uppercase tracking-widest font-bold text-stone-400">
                Hito {idx + 1}
              </span>
              {milestones.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveMilestone(milestone.id)}
                  className="p-1 rounded hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10px]">
              {/* Type selector */}
              <div className="col-span-1">
                <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold block mb-1">
                  Tipo
                </label>
                <select
                  value={milestone.type}
                  onChange={e => handleUpdateMilestone(milestone.id, {
                    type: e.target.value as 'percentage' | 'fixed'
                  })}
                  className="w-full px-2 py-1.5 border border-stone-200 rounded text-stone-700 text-[10px]"
                >
                  <option value="percentage">%</option>
                  <option value="fixed">Valor Fijo</option>
                </select>
              </div>

              {/* Amount input */}
              <div className="col-span-1">
                <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold block mb-1">
                  {milestone.type === 'percentage' ? 'Porcentaje' : 'Monto'}
                </label>
                <input
                  type="number"
                  value={milestone.amount}
                  onChange={e => handleUpdateMilestone(milestone.id, {
                    amount: parseFloat(e.target.value) || 0
                  })}
                  min={0}
                  max={milestone.type === 'percentage' ? 100 : undefined}
                  step={milestone.type === 'percentage' ? 1 : 1000}
                  className="w-full px-2 py-1.5 border border-stone-200 rounded text-stone-700 text-[10px]"
                />
              </div>

              {/* Display value */}
              <div className="col-span-1">
                <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold block mb-1">
                  Total Hito
                </label>
                <div className="px-2 py-1.5 border border-stone-200/40 rounded bg-stone-50 text-stone-700 font-semibold">
                  {COP(milestone.type === 'percentage'
                    ? (totalContract * milestone.amount) / 100
                    : milestone.amount)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold block mb-1">
                  Fecha Límite
                </label>
                <input
                  type="date"
                  value={milestone.date || ''}
                  onChange={e => handleUpdateMilestone(milestone.id, { date: e.target.value })}
                  className="w-full px-2 py-1.5 border border-stone-200 rounded text-stone-700 text-[9px]"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold block mb-1">
                  Razón / Descripción
                </label>
                <input
                  type="text"
                  value={milestone.reason || ''}
                  onChange={e => handleUpdateMilestone(milestone.id, { reason: e.target.value })}
                  className="w-full px-2 py-1.5 border border-stone-200 rounded text-stone-700 text-[9px]"
                  placeholder="Ej: Anticipo, entrega parcial..."
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add milestone button */}
      <button
        type="button"
        onClick={handleAddMilestone}
        className="w-full py-2 border border-dashed border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
      >
        <Plus size={14} />
        Agregar Hito
      </button>

      {/* Status bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px] font-bold">
          <span className="text-stone-600">Suma Total de Hitos:</span>
          <span className={isValid ? 'text-green-700' : isOver ? 'text-red-700' : 'text-orange-700'}>
            {COP(totalMilestones)}
          </span>
        </div>

        <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              isValid ? 'bg-green-500' : isOver ? 'bg-red-500' : 'bg-orange-500'
            }`}
            style={{ width: `${Math.min((totalMilestones / (totalContract || 1)) * 100, 100)}%` }}
          />
        </div>

        {isValid ? (
          <div className="flex items-start gap-2 text-green-700 bg-green-50 p-2.5 rounded-lg border border-green-200/60 text-[9px]">
            <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
            <p className="font-medium">Suma correcta: los hitos cubren exactamente el valor total del contrato.</p>
          </div>
        ) : isOver ? (
          <div className="flex items-start gap-2 text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-200/60 text-[9px]">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <p className="font-medium">
              EXCESO: Los hitos suman {COP(Math.abs(difference))} más que el total del contrato.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2 text-orange-700 bg-orange-50 p-2.5 rounded-lg border border-orange-200/60 text-[9px]">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <p className="font-medium">
              FALTANTE: Faltan {COP(difference)} para completar el total del contrato.
            </p>
          </div>
        )}

        <div className="flex gap-2 text-[9px] text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
          <Info size={12} className="shrink-0 mt-0.5" />
          <p>
            {useStandard
              ? 'Modo anticipos estándar. Edita cualquier campo para pasar a un plan personalizado.'
              : 'Diseña tu propio cronograma de pagos. La suma de hitos debe ser exacta.'}
          </p>
        </div>
      </div>
    </div>
  )
}
