'use client'

import { useState } from 'react'
import { type ItemVariante, type ProductoCatalogo } from '@/lib/data'
import { ItemMiniatura } from '@/components/veta/item-miniatura'
import { NumberInput } from '@/components/veta/number-input'
import { MoneyInput } from '@/components/veta/money-input'
import { Button } from '@/components/veta/button'
import { Edit, Trash2, MoreVertical } from 'lucide-react'
import { useIsMobile } from '@/lib/hooks/useMediaQuery'

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
  const isMobile = useIsMobile()
  const cantidadNum = parseNum(item.cantidad)
  const precioNum = parseNum(item.precioUnitario)
  const total = cantidadNum * precioNum

  return (
    <div
      className={`border-b border-border-subtle/50 pb-3 pt-2 sm:pb-2 sm:pt-0 last:pb-0 last:border-0 rounded transition-colors sm:hover:bg-bg-alt/30 ${
        isNew ? 'bg-gold-100/80' : ''
      } ${dropdownOpen ? 'z-50' : ''} ${isMobile ? 'sm:z-50' : ''}`}
      style={{ position: dropdownOpen ? 'relative' : undefined }}
    >
      {/* Fila superior: miniatura + nombre + subtotal a la derecha */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <ItemMiniatura producto={producto} fotoUrl={item.fotoUrl} onClick={() => onEdit(item.id)} />
          <div className="min-w-0 flex flex-col">
            <span className="text-text-heading font-medium truncate sm:text-base">
              {item.nombrePersonalizado ?? producto?.descripcion ?? 'Ítem sin catálogo'}
            </span>
          </div>
        </div>
        <div className="flex items-end gap-2 text-right sm:ml-auto">
          <span className="font-mono font-semibold text-sm sm:text-base">{formatCOP(total)}</span>
        </div>
      </div>

      {/* Fila inferior: cantidad, precio, acciones en el mismo tramo */}
      <div className="mt-2 sm:mt-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
        <div className="flex items-center gap-1 w-full sm:w-auto flex-wrap">
          {/* Cantidad: stepper móvil / NumberInput escritorio */}
          <div className="flex items-center gap-1 min-w-[110px] sm:min-w-[90px]">
            {isMobile ? (
              <div className="flex items-center justify-between gap-1 w-full border rounded border-border-subtle bg-bg-paper">
                <button
                  type="button"
                  onClick={() => {
                    const n = Math.max(0, parseNum(item.cantidad) - 1)
                    void onUpdateField(item.id, 'cantidad', String(n))
                  }}
                  disabled={parseNum(item.cantidad) <= 0}
                  aria-label={`Disminuir cantidad de ${producto?.descripcion ?? item.id}`}
                  className="p-1 text-sm text-text-muted hover:text-gold-600 hover:bg-bg-alt rounded-l disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  −
                </button>
                <span className="font-mono text-xs sm:text-sm text-text-primary w-8 text-center select-none">
                  {item.cantidad}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const n = parseNum(item.cantidad) + 1
                    void onUpdateField(item.id, 'cantidad', String(n))
                  }}
                  aria-label={`Aumentar cantidad de ${producto?.descripcion ?? item.id}`}
                  className="p-1 text-sm text-text-muted hover:text-gold-600 hover:bg-bg-alt rounded-r"
                >
                  +
                </button>
              </div>
            ) : (
              <NumberInput
                value={item.cantidad}
                onChange={(v) => onUpdateField(item.id, 'cantidad', v)}
                step={0.1}
                min={0}
                label=""
                className="w-full text-right font-mono text-xs sm:text-sm"
                aria-label={`Cantidad ${producto?.descripcion ?? item.id}`}
              />
            )}
          </div>
          <span className="text-text-muted text-xs sm:text-sm mx-0.5">×</span>
          <div className="min-w-[110px] sm:min-w-[120px]">
            <MoneyInput
              value={item.precioUnitario}
              onChange={(v) => onUpdateField(item.id, 'precioUnitario', v)}
              label=""
              className="w-full text-right font-mono text-xs sm:text-sm"
              aria-label={`Precio ${producto?.descripcion ?? item.id}`}
            />
          </div>
        </div>

        {/* Acciones en el espacio libre inferior (Editar + Eliminar / ⋮) */}
        <div className="mt-1 sm:mt-0 ml-auto sm:ml-0 flex items-center gap-1 sm:flex-shrink-0">
          <button
            type="button"
            onClick={() => onEdit(item.id)}
            aria-label={`Editar ${item.nombrePersonalizado ?? 'ítem'}`}
            title="Editar ítem"
            className="p-1.5 text-text-muted hover:text-gold-600 hover:bg-bg-alt rounded transition-colors duration-fast"
          >
            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen) }}
              aria-label="Más opciones"
              title="Editar, mover, anidar"
              className="p-1.5 text-text-muted hover:text-gold-600 hover:bg-bg-alt rounded transition-colors duration-fast"
            >
              <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-bg-raised border border-border-subtle rounded shadow-md z-50 py-1" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => { onEdit(item.id); setDropdownOpen(false) }}
                  className="w-full text-left px-4 py-2 text-xs text-text-heading hover:bg-bg-alt transition-colors duration-fast"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => { onMoveType(item.id, !item.esReferencial); setDropdownOpen(false) }}
                  className="w-full text-left px-4 py-2 text-xs text-text-heading hover:bg-bg-alt transition-colors duration-fast"
                >
                  ↔ Mover a {item.esReferencial ? 'Ítems' : 'Presupuesto'}
                </button>
                <div className="border-t border-border-subtle my-1" />
                <button
                  type="button"
                  onClick={() => { onMoveNest(item.id); setDropdownOpen(false) }}
                  className="w-full text-left px-4 py-2 text-xs text-text-heading hover:bg-bg-alt transition-colors duration-fast"
                  title="Anidar este item en un grupo"
                >
                  Anidar en grupo
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            aria-label={`Eliminar ${item.nombrePersonalizado ?? 'ítem'}`}
            title="Eliminar"
            className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 rounded transition-colors duration-fast"
          >
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
