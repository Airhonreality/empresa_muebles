'use client'

import { useState } from 'react'
import { type ItemVariante, type ProductoCatalogo } from '@/lib/data'
import { ItemMiniatura } from '@/components/veta/item-miniatura'
import { NumberInput } from '@/components/veta/number-input'
import { MoneyInput } from '@/components/veta/money-input'
import { Button } from '@/components/veta/button'

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function parseNum(s: string | null | undefined): number {
  if (!s) return 0
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

export interface ItemRowProps {
  item: ItemVariante
  producto?: ProductoCatalogo
  isSelected: boolean
  onToggleSelect: (itemId: string, selected: boolean) => void
  onUpdateField: (itemId: string, field: string, value: string) => void
  onDelete: (itemId: string) => Promise<void>
  onEdit: (itemId: string) => void
  onMoveNest: (itemId: string) => void
  onMoveType: (itemId: string, esReferencial: boolean) => void
  isNew?: boolean
}

export function ItemRow({
  item,
  producto,
  isSelected,
  onToggleSelect,
  onUpdateField,
  onDelete,
  onEdit,
  onMoveNest,
  onMoveType,
  isNew,
}: ItemRowProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const cantidadNum = parseNum(item.cantidad)
  const precioNum = parseNum(item.precioUnitario)
  const total = cantidadNum * precioNum

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 text-sm border-b border-border-subtle/50 pb-4 pt-2 sm:pb-2 sm:pt-0 last:pb-0 last:border-0 rounded transition-colors duration-500 ${
        isNew ? 'bg-gold-100/80' : ''
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 sm:gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onToggleSelect(item.id, e.target.checked)}
            aria-label={`Seleccionar ${item.nombrePersonalizado ?? 'ítem'}`}
            className="shrink-0 w-4 h-4 rounded text-gold-500 cursor-pointer"
          />
          <ItemMiniatura producto={producto} fotoUrl={item.fotoUrl} onClick={() => onEdit(item.id)} />
          <div className="flex flex-col min-w-0">
            <span className="text-text-heading text-base sm:text-sm font-medium sm:font-normal truncate">
              {item.nombrePersonalizado ?? producto?.descripcion ?? 'Ítem sin catálogo'}
            </span>
            {producto && <span className="text-xs text-text-muted font-mono truncate">{producto.sku}</span>}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 w-full sm:w-auto mt-3 sm:mt-0 bg-surface-100 sm:bg-transparent p-3 sm:p-0 rounded border border-border-subtle/50 sm:border-0">
        <div className="grid grid-cols-12 sm:flex items-center gap-2 w-full sm:w-auto">
          <div className="col-span-3 sm:w-20">
            <NumberInput
              value={item.cantidad}
              onChange={(v) => onUpdateField(item.id, 'cantidad', v)}
              step={0.1}
              min={0}
              label=""
              className="w-full h-10 sm:h-8 text-right font-mono text-sm"
              aria-label={`Cantidad ${producto?.descripcion ?? item.id}`}
            />
          </div>
          <div className="col-span-1 text-center text-text-muted text-xs">×</div>
          <div className="col-span-4 sm:w-28">
            <MoneyInput
              value={item.precioUnitario}
              onChange={(v) => onUpdateField(item.id, 'precioUnitario', v)}
              label=""
              className="w-full h-10 sm:h-8 text-right font-mono text-sm"
              aria-label={`Precio ${producto?.descripcion ?? item.id}`}
            />
          </div>
          <div className="col-span-4 text-right">
            <span className="font-mono text-sm font-semibold text-text-heading">{formatCOP(total)}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-border-subtle/50 sm:mt-0 sm:pt-0 sm:border-0 flex-shrink-0">
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            aria-label={`Eliminar ${item.nombrePersonalizado ?? 'ítem'}`}
            title="Eliminar"
            className="p-2 sm:p-1 text-text-muted hover:text-red-500 rounded transition-colors duration-fast"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2.5 4h11M6.2 4V2.6h3.6V4M3.8 4l.65 9.3h7.1L12.2 4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6.6 7v4M9.4 7v4" strokeLinecap="round" />
            </svg>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setDropdownOpen(!dropdownOpen)
              }}
              aria-label="Más opciones"
              title="Editar, mover, anidar"
              className="p-2 sm:p-1 text-text-muted hover:text-gold-600 rounded transition-colors duration-fast"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="3" r="1.5" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="8" cy="13" r="1.5" />
              </svg>
            </button>
            {dropdownOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-44 bg-bg-raised border border-border-subtle rounded shadow-md z-20 py-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    onEdit(item.id)
                    setDropdownOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-text-heading hover:bg-bg-alt transition-colors duration-fast"
                >
                  ✏️ Editar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onMoveType(item.id, !item.esReferencial)
                    setDropdownOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-text-heading hover:bg-bg-alt transition-colors duration-fast"
                >
                  ↔ Mover a {item.esReferencial ? 'Ítems' : 'Presupuesto'}
                </button>
                <div className="border-t border-border-subtle my-1" />
                <button
                  type="button"
                  onClick={() => {
                    onMoveNest(item.id)
                    setDropdownOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-text-heading hover:bg-bg-alt transition-colors duration-fast"
                  title="Anidar este item en un grupo"
                >
                  📁 Anidar en grupo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
