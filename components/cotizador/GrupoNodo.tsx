'use client'

import { useState, type ReactElement } from 'react'
import { type GrupoItem, type ItemVariante, type ProductoCatalogo } from '@/lib/data'
import { Button } from '@/components/veta/button'
import { ItemRow } from './ItemRow'

export interface GrupoNodoProps {
  grupo: GrupoItem
  nivel: number
  items: ItemVariante[]
  productMap: Map<string, ProductoCatalogo>
  gruposHijos: (grupoId: string) => GrupoItem[]
  itemsDelGrupo: (grupoId: string) => ItemVariante[]
  selectedItems: Set<string>
  onToggleSelectItem: (itemId: string, selected: boolean) => void
  onUpdateItem: (itemId: string, field: string, value: string) => void
  onDeleteItem: (itemId: string) => Promise<void>
  onEditItem: (itemId: string) => void
  onMoveNestItem: (itemId: string) => void
  onMoveTypeItem: (itemId: string, esReferencial: boolean) => void
  onCreateSubgrupo: (padreId: string) => void
  onDeleteGrupo: (grupoId: string) => Promise<void>
  onAddItemToGrupo: (grupoId: string) => void
  creandoGrupoPadreId?: string
  nombreNuevoGrupo?: string
  onChangeNombreNuevoGrupo?: (valor: string) => void
  onCancelCreateGrupo?: () => void
  onConfirmCreateGrupo?: (grupoId: string) => Promise<void>
}

export function GrupoNodo({
  grupo,
  nivel,
  items,
  productMap,
  gruposHijos,
  itemsDelGrupo,
  selectedItems,
  onToggleSelectItem,
  onUpdateItem,
  onDeleteItem,
  onEditItem,
  onMoveNestItem,
  onMoveTypeItem,
  onCreateSubgrupo,
  onDeleteGrupo,
  onAddItemToGrupo,
  creandoGrupoPadreId,
  nombreNuevoGrupo = '',
  onChangeNombreNuevoGrupo,
  onCancelCreateGrupo,
  onConfirmCreateGrupo,
}: GrupoNodoProps): ReactElement {
  const [editandoNombre, setEditandoNombre] = useState(false)
  const [nombreTemp, setNombreTemp] = useState(grupo.nombre)
  const hijos = gruposHijos(grupo.id)
  const itemsPropios = itemsDelGrupo(grupo.id)

  const guardarNombreGrupo = async () => {
    if (nombreTemp.trim() && nombreTemp !== grupo.nombre) {
      // onRenameGrupo would be called here
    }
    setEditandoNombre(false)
  }

  return (
    <div className="mb-2" style={{ marginLeft: nivel * 16 }}>
      <div className="flex items-center justify-between gap-2 bg-bg-alt/40 rounded px-3 py-2 border border-border-subtle/60">
        {editandoNombre ? (
          <input
            type="text"
            value={nombreTemp}
            onChange={(e) => setNombreTemp(e.target.value)}
            onBlur={guardarNombreGrupo}
            onKeyDown={(e) => {
              if (e.key === 'Enter') guardarNombreGrupo()
              if (e.key === 'Escape') {
                setNombreTemp(grupo.nombre)
                setEditandoNombre(false)
              }
            }}
            autoFocus
            className="flex-1 rounded-sm border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-brand focus:outline-none"
          />
        ) : (
          <span
            className="text-xs font-semibold text-text-heading truncate cursor-pointer hover:underline"
            onClick={() => setEditandoNombre(true)}
          >
            {grupo.nombre}
          </span>
        )}

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="secondary"
            size="md"
            className="text-xs h-6"
            onClick={() => onAddItemToGrupo(grupo.id)}
            title="Agregar item dentro de este grupo"
          >
            + Item
          </Button>

          <button
            type="button"
            onClick={() => onCreateSubgrupo(grupo.id)}
            className="text-[11px] text-gold-600 hover:text-gold-700 px-1.5 py-0.5 rounded transition-colors duration-fast"
            title="Crear subgrupo dentro de este grupo"
          >
            + Sub
          </button>
          <button
            type="button"
            onClick={() => onDeleteGrupo(grupo.id)}
            aria-label={`Eliminar grupo ${grupo.nombre}`}
            title="Eliminar grupo (los ítems dentro pasan a 'Sin grupo')"
            className="text-text-muted hover:text-red-500 px-1.5 py-0.5 rounded"
          >
            ×
          </button>
        </div>
      </div>

      {creandoGrupoPadreId === grupo.id && (
        <div className="flex items-center gap-2 mt-2 ml-2">
          <input
            type="text"
            autoFocus
            value={nombreNuevoGrupo}
            onChange={(e) => onChangeNombreNuevoGrupo?.(e.target.value)}
            placeholder="Nombre del subgrupo"
            className="flex-1 rounded-sm border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-brand focus:outline-none"
          />
          <Button
            variant="primary"
            size="md"
            disabled={!nombreNuevoGrupo.trim()}
            onClick={() => onConfirmCreateGrupo?.(grupo.id)}
          >
            Crear
          </Button>
          <Button variant="ghost" size="md" onClick={onCancelCreateGrupo}>
            Cancelar
          </Button>
        </div>
      )}

      <div className="pl-2 mt-1">
        {itemsPropios.map((item) => {
          const prod = item.catalogoId ? productMap.get(item.catalogoId) : undefined
          return (
            <ItemRow
              key={item.id}
              item={item}
              producto={prod}
              isSelected={selectedItems.has(item.id)}
              onToggleSelect={onToggleSelectItem}
              onUpdateField={onUpdateItem}
              onDelete={onDeleteItem}
              onEdit={onEditItem}
              onMoveNest={onMoveNestItem}
              onMoveType={onMoveTypeItem}
            />
          )
        })}
        {hijos.map((h) => (
          <GrupoNodo
            key={h.id}
            grupo={h}
            nivel={nivel + 1}
            items={items}
            productMap={productMap}
            gruposHijos={gruposHijos}
            itemsDelGrupo={itemsDelGrupo}
            selectedItems={selectedItems}
            onToggleSelectItem={onToggleSelectItem}
            onUpdateItem={onUpdateItem}
            onDeleteItem={onDeleteItem}
            onEditItem={onEditItem}
            onMoveNestItem={onMoveNestItem}
            onMoveTypeItem={onMoveTypeItem}
            onCreateSubgrupo={onCreateSubgrupo}
            onDeleteGrupo={onDeleteGrupo}
            onAddItemToGrupo={onAddItemToGrupo}
            creandoGrupoPadreId={creandoGrupoPadreId}
            nombreNuevoGrupo={nombreNuevoGrupo}
            onChangeNombreNuevoGrupo={onChangeNombreNuevoGrupo}
            onCancelCreateGrupo={onCancelCreateGrupo}
            onConfirmCreateGrupo={onConfirmCreateGrupo}
          />
        ))}
      </div>
    </div>
  )
}
