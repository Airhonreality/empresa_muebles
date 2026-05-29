'use client'

/**
 * DataBrowser — Universal Schema Explorer v2
 *
 * Features:
 *   1. Inline cell editing (click → edit in place → blur/Enter saves)
 *   2. Column visibility toggle + freeze first column (sticky)
 *   3. Quick-add row (+ button → empty row at bottom → Enter saves)
 *   4. Relation label resolution (batch fetch, show human name not UUID)
 *   5. Universal useRecordFilter hook (exported, reusable anywhere)
 *   6. Column reordering (dnd-kit drag handles in headers)
 *   7. Multi-select + bulk delete
 *   8. Row height variants (compact / normal / tall)
 *
 * AXIOMATIC_CONTRACT:
 * - MUST: Write only via POST /api/vault (action: WRITE | REMOVE)
 * - NEVER: Import from Zustand stores (standalone specialized component)
 */

import React, {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react'
import Link from 'next/link'
import type { DataItem } from '@agnostic/core'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, horizontalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  AlignJustify, ArrowLeft, Check, ChevronDown, ChevronUp, ChevronsUpDown,
  Columns3, Eye, EyeOff, FilePlus2, GripHorizontal, LayoutGrid, Minus, Plus,
  RefreshCw, Save, Search, SlidersHorizontal, Square, Table2, Trash2, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SchemaField {
  key: string
  label: string
  type: string
  options?: { label: string; value: string }[]
  config?: { relation?: { entity: string; displayField?: string } }
  width?: 'full' | 'half' | 'third'
  isPrimary?: boolean
  placeholder?: string
  readOnly?: boolean
}

export interface Schema {
  name: string
  label?: string
  fields: SchemaField[]
}

export interface DataBrowserProps {
  schemaName: string
  schema: Schema
  initialRecords: DataItem[]
  initialView?: 'sheets' | 'cards' | 'form'
  onBack?: () => void
  className?: string
}

type RowHeight = 'compact' | 'normal' | 'tall'
const ROW_PY: Record<RowHeight, string> = {
  compact: 'py-1',
  normal:  'py-2',
  tall:    'py-3.5',
}

// ─── useRecordFilter — universal, exportable ──────────────────────────────────

export interface FilterState {
  global: string
  columns: Record<string, string>
}

export function useRecordFilter(
  records: DataItem[],
  fields: SchemaField[],
  filter: FilterState,
): DataItem[] {
  return useMemo(() => {
    return records.filter(r => {
      if (filter.global) {
        const q = filter.global.toLowerCase()
        const hit = fields.some(f =>
          String((r.data as any)[f.key] ?? '').toLowerCase().includes(q)
        )
        if (!hit) return false
      }
      for (const [key, fv] of Object.entries(filter.columns)) {
        if (!fv) continue
        if (!String((r.data as any)[key] ?? '').toLowerCase().includes(fv.toLowerCase()))
          return false
      }
      return true
    })
  }, [records, fields, filter])
}

// ─── useBatchRelationResolver ─────────────────────────────────────────────────
// Fetches all related entity data once on mount.
// Returns: { [entity]: { [id]: displayLabel } }

function useBatchRelationResolver(
  schema: Schema,
  records: DataItem[],
): Record<string, Record<string, string>> {
  const [labels, setLabels] = useState<Record<string, Record<string, string>>>({})

  useEffect(() => {
    const relFields = schema.fields.filter(f => f.type === 'relation')
    if (!relFields.length) return

    const entities = [...new Set(relFields.map(f => f.config?.relation?.entity).filter(Boolean) as string[])]

    Promise.all(
      entities.map(async entity => {
        try {
          const res = await fetch(`/api/vault?namespace=${entity}`)
          const json = await res.json()
          const recs: DataItem[] = json.records ?? []
          const map: Record<string, string> = {}
          for (const rec of recs) {
            const d = rec.data as any
            // Pick best display field: nombre > name > title > label > first string value
            const relField = relFields.find(f => f.config?.relation?.entity === entity)
            const df = relField?.config?.relation?.displayField
            const label = (df && d[df])
              || d.nombre || d.name || d.title || d.label
              || Object.values(d).find((v): v is string => typeof v === 'string' && v.length > 0)
              || rec.id.slice(0, 8)
            map[rec.id] = String(label)
          }
          return [entity, map] as [string, Record<string, string>]
        } catch {
          return [entity, {}] as [string, Record<string, string>]
        }
      })
    ).then(entries => setLabels(Object.fromEntries(entries)))
  }, [schema, records.length]) // re-resolve if record count changes

  return labels
}

// ─── CellValue ────────────────────────────────────────────────────────────────

function CellValue({
  value, field, relLabels,
}: {
  value: unknown
  field: SchemaField
  relLabels?: Record<string, Record<string, string>>
}) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-muted-foreground/25 text-xs select-none">—</span>
  }

  if (field.type === 'boolean') {
    return value
      ? <Check size={13} className="text-emerald-500 shrink-0" />
      : <X size={13} className="text-muted-foreground/30 shrink-0" />
  }

  if (field.type === 'select') {
    const opt = field.options?.find(o => o.value === value)
    return (
      <span className="inline-block px-1.5 py-0.5 rounded text-[11px] bg-muted font-medium leading-none">
        {opt?.label ?? String(value)}
      </span>
    )
  }

  if (field.type === 'date') {
    try {
      return <span>{new Date(String(value)).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
    } catch { return <span>{String(value)}</span> }
  }

  if (field.type === 'relation') {
    const entity = field.config?.relation?.entity
    const id = String(value)
    const label = entity ? relLabels?.[entity]?.[id] : undefined
    if (label) {
      return (
        <span className="inline-flex items-center gap-1">
          <span className="text-[9px] text-muted-foreground/30 font-mono shrink-0">#</span>
          <span className="truncate">{label}</span>
        </span>
      )
    }
    // Fallback: short ID
    return (
      <span className="font-mono text-[11px] text-muted-foreground/50 bg-muted px-1 rounded">
        {id.slice(0, 8)}
      </span>
    )
  }

  if (field.type === 'object') {
    return <span className="text-[11px] text-muted-foreground italic font-mono">{'{…}'}</span>
  }

  if (field.type === 'array_of_objects') {
    const count = Array.isArray(value) ? value.length : 0
    return (
      <span className="inline-block px-1.5 py-0.5 rounded text-[11px] bg-muted font-medium leading-none">
        {count} {count === 1 ? 'ítem' : 'ítems'}
      </span>
    )
  }

  const str = String(value)
  return (
    <span className="truncate block" title={str.length > 80 ? str : undefined}>
      {str.length > 80 ? str.slice(0, 80) + '…' : str}
    </span>
  )
}

// ─── InlineCellEditor ─────────────────────────────────────────────────────────
// Renders the appropriate input when a cell is in edit mode

function InlineCellEditor({
  field, value, onCommit, onCancel,
}: {
  field: SchemaField
  value: unknown
  onCommit: (v: unknown) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLInputElement & HTMLSelectElement & HTMLTextAreaElement>(null)

  useEffect(() => { ref.current?.focus(); ref.current?.select?.() }, [])

  const commit = () => onCommit(draft)
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && field.type !== 'textarea') commit()
    if (e.key === 'Escape') onCancel()
  }

  const base = 'w-full px-2 py-1 text-sm border border-primary rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary'

  if (field.type === 'boolean') {
    return (
      <button
        autoFocus
        onClick={() => onCommit(!draft)}
        onBlur={onCancel}
        className={cn('flex items-center gap-1 px-2 py-1 text-xs rounded border transition-colors',
          draft ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-input bg-muted')}
      >
        {draft ? <Check size={12} /> : <X size={12} />}
        {draft ? 'Sí' : 'No'}
      </button>
    )
  }

  if (field.type === 'select') {
    return (
      <select
        ref={ref as any}
        value={String(draft ?? '')}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={onKey}
        className={base}
      >
        <option value="">—</option>
        {field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    )
  }

  if (field.type === 'number') {
    return (
      <input
        ref={ref as any}
        type="number"
        value={draft === null || draft === undefined ? '' : String(draft)}
        onChange={e => setDraft(e.target.value === '' ? null : Number(e.target.value))}
        onBlur={commit}
        onKeyDown={onKey}
        className={base}
      />
    )
  }

  if (field.type === 'date') {
    return (
      <input
        ref={ref as any}
        type="date"
        value={String(draft ?? '')}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={onKey}
        className={base}
      />
    )
  }

  // Default: text
  return (
    <input
      ref={ref as any}
      type="text"
      value={String(draft ?? '')}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={onKey}
      className={base}
    />
  )
}

// ─── SortableColHeader ────────────────────────────────────────────────────────

function SortableColHeader({
  id, children, width, onMouseDown,
}: {
  id: string
  children: React.ReactNode
  width: number
  onMouseDown: (e: React.MouseEvent) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    width,
    minWidth: width,
  }

  return (
    <th
      ref={setNodeRef}
      style={style}
      className="relative group text-left font-medium text-[11px] text-muted-foreground uppercase tracking-wider border-b border-r border-border/40 select-none bg-muted/90 backdrop-blur-sm"
    >
      <div className="flex items-center gap-1 px-3 py-2 pr-7">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-40 hover:!opacity-80 cursor-grab active:cursor-grabbing shrink-0 transition-opacity touch-none"
          title="Arrastrar para reordenar"
        >
          <GripHorizontal size={10} />
        </button>
        {children}
      </div>
      {/* Resize handle */}
      <div
        onMouseDown={onMouseDown}
        className="absolute right-0 top-0 w-4 h-full cursor-col-resize flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <div className="w-px h-4 bg-border group-hover:bg-primary/60 rounded-full transition-colors" />
      </div>
    </th>
  )
}

// ─── SheetsView ───────────────────────────────────────────────────────────────

interface SheetsViewProps {
  schema: Schema
  schemaName: string
  records: DataItem[]
  searchQuery: string
  onRefresh: () => Promise<void>
}

function SheetsView({ schema, schemaName, records, searchQuery, onRefresh }: SheetsViewProps) {
  // ── View prefs ───────────────────────────────────────────────────────────────
  const allFields = schema.fields.filter(f => f.type !== 'object' && f.type !== 'array_of_objects')
  const [colOrder,  setColOrder]  = useState<string[]>(() => allFields.map(f => f.key))
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set())
  const [colWidths,  setColWidths]  = useState<Record<string, number>>({})
  const [rowHeight,  setRowHeight]  = useState<RowHeight>('normal')
  const [showColMenu, setShowColMenu] = useState(false)

  // ── Sort / filter ────────────────────────────────────────────────────────────
  const [sortField, setSortField]   = useState<string | null>(null)
  const [sortDir,   setSortDir]     = useState<'asc' | 'desc'>('asc')
  const [colFilters, setColFilters] = useState<Record<string, string>>({})
  const [showFilters, setShowFilters] = useState(false)

  // ── Inline edit ──────────────────────────────────────────────────────────────
  const [editingCell, setEditingCell] = useState<{ rowId: string; fieldKey: string } | null>(null)
  const [savingCell,  setSavingCell]  = useState<string | null>(null) // `${rowId}__${key}`

  // ── Multi-select ─────────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // ── Quick-add ────────────────────────────────────────────────────────────────
  const [addingRow, setAddingRow]   = useState(false)
  const [newRowData, setNewRowData] = useState<Record<string, unknown>>({})
  const [savingNew,  setSavingNew]  = useState(false)

  // ── Relation labels ───────────────────────────────────────────────────────────
  const relLabels = useBatchRelationResolver(schema, records)

  // ── dnd-kit sensors ──────────────────────────────────────────────────────────
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 5 },
  }))

  // ── Derived fields ────────────────────────────────────────────────────────────
  const visibleFields = useMemo(() => {
    const ordered = colOrder
      .map(key => allFields.find(f => f.key === key))
      .filter((f): f is SchemaField => !!f && !hiddenCols.has(f.key))
    // Append any new fields not yet in colOrder
    for (const f of allFields) {
      if (!colOrder.includes(f.key) && !hiddenCols.has(f.key)) ordered.push(f)
    }
    return ordered.slice(0, 12)
  }, [allFields, colOrder, hiddenCols])

  // ── Filtering ─────────────────────────────────────────────────────────────────
  const filterState: FilterState = { global: searchQuery, columns: colFilters }
  const filtered = useRecordFilter(records, allFields, filterState)

  // ── Sorting ───────────────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    if (!sortField) return filtered
    return [...filtered].sort((a, b) => {
      const av = String((a.data as any)[sortField] ?? '')
      const bv = String((b.data as any)[sortField] ?? '')
      const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortField, sortDir])

  const hasFilter = Object.values(colFilters).some(Boolean)

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleSort = (key: string) => {
    if (sortField === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(key); setSortDir('asc') }
  }

  const startResize = (e: React.MouseEvent, fieldKey: string) => {
    e.preventDefault(); e.stopPropagation()
    const startX = e.clientX
    const startW = colWidths[fieldKey] ?? 160
    const onMove = (ev: MouseEvent) =>
      setColWidths(p => ({ ...p, [fieldKey]: Math.max(60, startW + ev.clientX - startX) }))
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (over && active.id !== over.id) {
      setColOrder(prev => {
        const from = prev.indexOf(String(active.id))
        const to   = prev.indexOf(String(over.id))
        return from >= 0 && to >= 0 ? arrayMove(prev, from, to) : prev
      })
    }
  }

  const commitCell = async (recordId: string, fieldKey: string, value: unknown) => {
    const ck = `${recordId}__${fieldKey}`
    setSavingCell(ck)
    setEditingCell(null)
    const record = records.find(r => r.id === recordId)
    if (!record) { setSavingCell(null); return }
    const newData = { ...(record.data as object), [fieldKey]: value }
    await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'WRITE', namespace: schemaName, record: { id: recordId, data: newData } }),
    })
    await onRefresh()
    setSavingCell(null)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    // Tri-state: ANY selected → clear all. NONE selected → select all visible.
    // Never escalates from partial to full — prevents accidental mass-delete.
    if (selectedIds.size > 0) setSelectedIds(new Set())
    else setSelectedIds(new Set(sorted.map(r => r.id)))
  }

  const bulkDelete = async () => {
    const n = selectedIds.size
    // Two-step confirmation: native dialog + type-to-confirm for bulk ops ≥ 5
    const confirmed = n >= 5
      ? window.prompt(
          `⚠️ Vas a eliminar ${n} registros de forma permanente.\n\nEscribe ELIMINAR para confirmar:`
        ) === 'ELIMINAR'
      : window.confirm(
          `¿Eliminar ${n} registro${n !== 1 ? 's' : ''}?\n\nEsta acción no se puede deshacer.`
        )
    if (!confirmed) return
    setBulkDeleting(true)
    const results = await Promise.allSettled([...selectedIds].map(id =>
      fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REMOVE', namespace: schemaName, id }),
      })
    ))
    const failed = results.filter(r => r.status === 'rejected').length
    if (failed > 0) console.error(`[DataBrowser] ${failed} registros no pudieron eliminarse`)
    setSelectedIds(new Set())
    await onRefresh()
    setBulkDeleting(false)
  }

  const saveNewRow = async () => {
    if (!Object.values(newRowData).some(v => v !== '' && v !== null && v !== undefined)) return
    setSavingNew(true)
    await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'WRITE', namespace: schemaName,
        record: { id: crypto.randomUUID(), data: newRowData },
      }),
    })
    await onRefresh()
    setNewRowData({})
    setSavingNew(false)
    // Keep addingRow open for rapid entry
  }

  const rowPy = ROW_PY[rowHeight]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Sub-toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-1.5 border-b border-border/30 bg-muted/10 text-xs shrink-0 flex-wrap">
        <span className="text-muted-foreground tabular-nums">
          {sorted.length !== records.length
            ? `${sorted.length} / ${records.length}`
            : `${records.length} registro${records.length !== 1 ? 's' : ''}`}
        </span>

        {selectedIds.size > 0 && (
          <button
            onClick={bulkDelete}
            disabled={bulkDeleting}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 transition-colors"
          >
            <Trash2 size={10} />
            {bulkDeleting ? '…' : `Eliminar ${selectedIds.size}`}
          </button>
        )}

        <div className="flex-1" />

        {hasFilter && (
          <button onClick={() => setColFilters({})} className="flex items-center gap-1 text-destructive hover:underline">
            <X size={10} /> Limpiar filtros
          </button>
        )}

        {/* Row height */}
        <div className="flex items-center gap-px border border-border rounded overflow-hidden">
          {(['compact', 'normal', 'tall'] as RowHeight[]).map(h => (
            <button
              key={h}
              onClick={() => setRowHeight(h)}
              title={h}
              className={cn('px-1.5 py-1 transition-colors', rowHeight === h ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted')}
            >
              <AlignJustify size={h === 'compact' ? 9 : h === 'normal' ? 11 : 13} />
            </button>
          ))}
        </div>

        {/* Column visibility */}
        <div className="relative">
          <button
            onClick={() => setShowColMenu(v => !v)}
            className={cn('flex items-center gap-1.5 px-2 py-1 rounded border transition-colors',
              hiddenCols.size > 0 ? 'border-primary/50 bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}
          >
            <Columns3 size={11} />
            Columnas {hiddenCols.size > 0 && `(${hiddenCols.size} ocultas)`}
          </button>
          {showColMenu && (
            <div className="absolute right-0 top-full mt-1 bg-background border border-border rounded-lg shadow-xl z-30 py-1.5 min-w-44">
              {allFields.map(f => (
                <button
                  key={f.key}
                  onClick={() => setHiddenCols(prev => {
                    const next = new Set(prev)
                    next.has(f.key) ? next.delete(f.key) : next.add(f.key)
                    return next
                  })}
                  className="flex items-center gap-2.5 w-full px-3 py-1.5 text-xs hover:bg-muted transition-colors text-left"
                >
                  {hiddenCols.has(f.key)
                    ? <EyeOff size={11} className="text-muted-foreground/50" />
                    : <Eye    size={11} className="text-primary/70" />}
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filters */}
        <button
          onClick={() => setShowFilters(v => !v)}
          className={cn('flex items-center gap-1.5 px-2 py-1 rounded border transition-colors',
            showFilters || hasFilter ? 'border-primary/50 bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}
        >
          <SlidersHorizontal size={11} />
          Filtros {hasFilter && `(${Object.values(colFilters).filter(Boolean).length})`}
        </button>

        {/* Quick-add toggle */}
        <button
          onClick={() => setAddingRow(v => !v)}
          className={cn('flex items-center gap-1.5 px-2 py-1 rounded border transition-colors',
            addingRow ? 'border-primary/50 bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}
        >
          <Plus size={11} />
          Agregar fila
        </button>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto" onClick={() => setShowColMenu(false)}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <table className="text-sm border-collapse" style={{ tableLayout: 'auto', minWidth: '100%' }}>

            <colgroup>
              {/* Checkbox col */}
              <col style={{ width: 36, minWidth: 36 }} />
              {visibleFields.map(f => (
                <col key={f.key} style={{ width: colWidths[f.key] ?? 160 }} />
              ))}
              {/* Actions col */}
              <col style={{ width: 40 }} />
            </colgroup>

            <thead className="sticky top-0 z-20">
              <SortableContext items={visibleFields.map(f => f.key)} strategy={horizontalListSortingStrategy}>
                <tr>
                  {/* Checkbox header */}
                  <th className="border-b border-r border-border/40 bg-muted/90 backdrop-blur-sm px-2 py-2 text-center">
                    <button
                      onClick={toggleSelectAll}
                      title={selectedIds.size > 0 ? 'Deseleccionar todo' : 'Seleccionar todo'}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {selectedIds.size === 0
                        ? <Square size={13} />
                        : selectedIds.size === sorted.length
                          ? <Check size={13} className="text-primary" />
                          : <Minus size={13} className="text-amber-500" />  /* partial — deselects on click */}
                    </button>
                  </th>

                  {visibleFields.map((field, fi) => {
                    const isSorted = sortField === field.key
                    const isFirst  = fi === 0
                    return (
                      <SortableColHeader
                        key={field.key}
                        id={field.key}
                        width={colWidths[field.key] ?? 160}
                        onMouseDown={e => startResize(e, field.key)}
                      >
                        <button
                          onClick={() => handleSort(field.key)}
                          className={cn('flex items-center gap-1 flex-1 truncate min-w-0 hover:text-foreground transition-colors',
                            isFirst && 'font-semibold text-foreground/80')}
                        >
                          <span className="truncate">{field.label}</span>
                          {isSorted
                            ? sortDir === 'asc'
                              ? <ChevronUp size={11} className="shrink-0 text-primary" />
                              : <ChevronDown size={11} className="shrink-0 text-primary" />
                            : <ChevronsUpDown size={11} className="shrink-0 opacity-0 group-hover:opacity-40 transition-opacity" />}
                        </button>
                      </SortableColHeader>
                    )
                  })}

                  <th className="border-b border-border/40 bg-muted/90 backdrop-blur-sm" />
                </tr>
              </SortableContext>

              {/* Filter row */}
              {showFilters && (
                <tr className="bg-background/95 border-b border-border/40">
                  <th /> {/* checkbox col */}
                  {visibleFields.map(field => (
                    <th key={field.key} className="px-2 py-1.5 border-r border-border/20 font-normal">
                      <input
                        type="text"
                        value={colFilters[field.key] ?? ''}
                        onChange={e => setColFilters(p => ({ ...p, [field.key]: e.target.value }))}
                        placeholder={`${field.label}…`}
                        className="w-full px-2 py-1 text-xs rounded border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
                      />
                    </th>
                  ))}
                  <th />
                </tr>
              )}
            </thead>

            <tbody>
              {sorted.map((record, i) => {
                const isSelected = selectedIds.has(record.id)
                return (
                  <tr
                    key={record.id}
                    className={cn(
                      'border-b border-border/20 transition-colors group/row',
                      i % 2 === 0 ? 'bg-background' : 'bg-muted/5',
                      isSelected ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/20',
                    )}
                  >
                    {/* Checkbox */}
                    <td className={cn('px-2 text-center border-r border-border/15', rowPy)}>
                      <button
                        onClick={() => toggleSelect(record.id)}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {isSelected
                          ? <Check size={13} className="text-primary" />
                          : <Square size={13} className="opacity-0 group-hover/row:opacity-40" />}
                      </button>
                    </td>

                    {visibleFields.map((field, fi) => {
                      const cellKey  = `${record.id}__${field.key}`
                      const isEditing = editingCell?.rowId === record.id && editingCell?.fieldKey === field.key
                      const isSaving  = savingCell === cellKey
                      const isFirst   = fi === 0
                      const val       = (record.data as any)[field.key]
                      const isReadOnly = field.readOnly || field.type === 'object' || field.type === 'array_of_objects' || field.type === 'relation'

                      return (
                        <td
                          key={field.key}
                          className={cn(
                            'border-r border-border/15 overflow-hidden',
                            rowPy, 'px-2',
                            isFirst && 'font-medium sticky left-0 z-5 bg-inherit',
                            isSaving && 'opacity-50',
                            !isReadOnly && !isEditing && 'cursor-pointer hover:bg-primary/5',
                          )}
                          onClick={() => {
                            if (isEditing || isReadOnly) return
                            setEditingCell({ rowId: record.id, fieldKey: field.key })
                          }}
                        >
                          {isEditing ? (
                            <InlineCellEditor
                              field={field}
                              value={val}
                              onCommit={v => commitCell(record.id, field.key, v)}
                              onCancel={() => setEditingCell(null)}
                            />
                          ) : (
                            <CellValue value={val} field={field} relLabels={relLabels} />
                          )}
                        </td>
                      )
                    })}

                    {/* Row actions */}
                    <td className={cn('px-1 text-center', rowPy)}>
                      <button
                        onClick={async e => {
                          e.stopPropagation()
                          if (!confirm('¿Eliminar?')) return
                          await fetch('/api/vault', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'REMOVE', namespace: schemaName, id: record.id }),
                          })
                          await onRefresh()
                        }}
                        className="p-1 rounded text-muted-foreground/0 group-hover/row:text-muted-foreground/40 hover:!text-destructive hover:bg-destructive/10 transition-all"
                        title="Eliminar"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                )
              })}

              {/* ── Quick-add row ──────────────────────────────────────────────── */}
              {addingRow && (
                <tr className="border-b border-primary/30 bg-primary/[0.02]">
                  <td className={cn('px-2 text-center border-r border-border/15', rowPy)}>
                    <Plus size={12} className="text-primary/40 mx-auto" />
                  </td>
                  {visibleFields.map((field, fi) => {
                    const isLast = fi === visibleFields.length - 1
                    return (
                      <td key={field.key} className={cn('px-2 border-r border-border/15', rowPy)}>
                        {field.type === 'boolean' ? (
                          <button
                            onClick={() => setNewRowData(p => ({ ...p, [field.key]: !p[field.key] }))}
                            className="text-xs px-2 py-0.5 rounded border border-input bg-background"
                          >
                            {newRowData[field.key] ? 'Sí' : 'No'}
                          </button>
                        ) : field.type === 'select' ? (
                          <select
                            value={String(newRowData[field.key] ?? '')}
                            onChange={e => setNewRowData(p => ({ ...p, [field.key]: e.target.value }))}
                            className="w-full px-2 py-0.5 text-xs rounded border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="">—</option>
                            {field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        ) : (
                          <input
                            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                            value={String(newRowData[field.key] ?? '')}
                            onChange={e => setNewRowData(p => ({ ...p, [field.key]: e.target.value }))}
                            placeholder={field.label}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && isLast) saveNewRow()
                              if (e.key === 'Escape') { setAddingRow(false); setNewRowData({}) }
                            }}
                            className="w-full px-2 py-0.5 text-xs rounded border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/40"
                          />
                        )}
                      </td>
                    )
                  })}
                  <td className={cn('px-1 text-center', rowPy)}>
                    <button
                      onClick={saveNewRow}
                      disabled={savingNew}
                      className="p-1 rounded text-primary/60 hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Guardar (Enter)"
                    >
                      {savingNew ? <RefreshCw size={12} className="animate-spin" /> : <Check size={12} />}
                    </button>
                  </td>
                </tr>
              )}

              {sorted.length === 0 && !addingRow && (
                <tr>
                  <td colSpan={visibleFields.length + 2} className="py-20 text-center text-muted-foreground text-sm">
                    {records.length === 0
                      ? 'Sin registros. Usa "Agregar fila" o el botón + para crear el primero.'
                      : 'Ningún registro coincide con los filtros activos.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </DndContext>
      </div>
    </div>
  )
}

// ─── CardsView ────────────────────────────────────────────────────────────────

interface CardsViewProps {
  schema: Schema
  records: DataItem[]
  searchQuery: string
  onOpen: (record: DataItem) => void
  onNew: () => void
}

function CardsView({ schema, records, searchQuery, onOpen, onNew }: CardsViewProps) {
  const primaryField   = schema.fields.find(f => f.isPrimary) ?? schema.fields[0]
  const secondaryFields = schema.fields
    .filter(f => f !== primaryField && f.type !== 'object' && f.type !== 'array_of_objects')
    .slice(0, 3)

  const filtered = !searchQuery ? records : records.filter(r => {
    const q = searchQuery.toLowerCase()
    return schema.fields.some(f => String((r.data as any)[f.key] ?? '').toLowerCase().includes(q))
  })

  return (
    <div className="flex-1 overflow-auto p-5">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
        <button
          onClick={onNew}
          className="h-36 rounded-xl border-2 border-dashed border-border/40 flex flex-col items-center justify-center gap-2.5 text-muted-foreground hover:border-primary/50 hover:text-primary/70 transition-all duration-200 group"
        >
          <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus size={16} />
          </div>
          <span className="text-xs font-medium tracking-wide">Nuevo registro</span>
        </button>

        {filtered.map(record => {
          const primaryVal = primaryField ? String((record.data as any)[primaryField.key] ?? '') : record.id
          return (
            <button
              key={record.id}
              onClick={() => onOpen(record)}
              className="h-36 rounded-xl border border-border/60 p-3.5 text-left hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-1.5 group bg-background"
            >
              <div className="text-sm font-semibold leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                {primaryVal || <span className="text-muted-foreground/50 font-normal italic text-xs">Sin título</span>}
              </div>
              <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                {secondaryFields.map(f => {
                  const val = (record.data as any)[f.key]
                  if (!val && val !== 0 && val !== false) return null
                  return (
                    <div key={f.key} className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <span className="font-medium opacity-60 shrink-0">{f.label}:</span>
                      <CellValue value={val} field={f} />
                    </div>
                  )
                })}
              </div>
              <div className="text-[10px] text-muted-foreground/25 font-mono mt-auto pt-1 border-t border-border/20">
                {record.id.slice(0, 8)}
              </div>
            </button>
          )
        })}
      </div>
      {filtered.length === 0 && records.length > 0 && (
        <p className="text-center text-muted-foreground text-sm py-16">
          Ningún registro coincide con la búsqueda.
        </p>
      )}
    </div>
  )
}

// ─── FormView ─────────────────────────────────────────────────────────────────

interface FormViewProps {
  schema: Schema
  record: DataItem | null
  schemaName: string
  onSaved: () => void
  onCancel: () => void
  onDeleted: () => void
}

function FieldInput({ field, value, onChange }: { field: SchemaField; value: unknown; onChange: (v: unknown) => void }) {
  const base = 'w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring transition-colors placeholder:text-muted-foreground/50'

  if (field.readOnly) {
    return (
      <div className="px-3 py-2 text-sm rounded-md border border-input bg-muted/30 text-muted-foreground">
        {value != null ? String(value) : <span className="italic opacity-50">Sin valor</span>}
      </div>
    )
  }
  if (field.type === 'boolean') {
    return (
      <button type="button" onClick={() => onChange(!value)}
        className={cn('flex items-center gap-2 px-3 py-2 text-sm rounded-md border transition-colors',
          value ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-input bg-background text-muted-foreground hover:border-muted-foreground')}>
        {value ? <Check size={14} /> : <X size={14} />}
        {value ? 'Sí' : 'No'}
      </button>
    )
  }
  if (field.type === 'select') {
    return (
      <select value={String(value ?? '')} onChange={e => onChange(e.target.value)} className={base}>
        <option value="">— Sin selección —</option>
        {field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    )
  }
  if (field.type === 'textarea') {
    return (
      <textarea value={String(value ?? '')} onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder} rows={3} className={cn(base, 'resize-none')} />
    )
  }
  if (field.type === 'number') {
    return (
      <input type="number" value={value == null ? '' : String(value)}
        onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
        placeholder={field.placeholder ?? '0'} className={base} />
    )
  }
  if (field.type === 'date') {
    return <input type="date" value={String(value ?? '')} onChange={e => onChange(e.target.value)} className={base} />
  }
  if (field.type === 'object' || field.type === 'array_of_objects') {
    const sv = typeof value === 'string' ? value : JSON.stringify(value ?? (field.type === 'object' ? {} : []), null, 2)
    return (
      <textarea value={sv} onChange={e => { try { onChange(JSON.parse(e.target.value)) } catch { onChange(e.target.value) } }}
        rows={5} className={cn(base, 'resize-y font-mono text-xs')} />
    )
  }
  return (
    <input type="text" value={String(value ?? '')} onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder} className={base} />
  )
}

function FormView({ schema, record, schemaName, onSaved, onCancel, onDeleted }: FormViewProps) {
  const isNew = !record
  const [formData, setFormData] = useState<Record<string, unknown>>(() =>
    isNew ? {} : { ...(record.data as Record<string, unknown>) }
  )
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: string, v: unknown) => setFormData(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'WRITE', namespace: schemaName, record: { id: record?.id ?? crypto.randomUUID(), data: formData } }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'Error')
      onSaved()
    } catch (e: any) {
      setError(e.message)
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirmDel) { setConfirmDel(true); setTimeout(() => setConfirmDel(false), 4000); return }
    setDeleting(true)
    await fetch('/api/vault', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'REMOVE', namespace: schemaName, id: record!.id }) })
    onDeleted()
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{isNew ? 'Nuevo registro' : 'Editar registro'}</h2>
            {!isNew && <p className="text-xs text-muted-foreground font-mono mt-0.5 select-all">{record.id}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isNew && (
              <button onClick={handleDelete} disabled={deleting}
                className={cn('px-3 py-1.5 text-xs rounded-md border transition-all',
                  confirmDel ? 'border-destructive bg-destructive text-destructive-foreground font-medium animate-pulse'
                             : 'border-border text-muted-foreground hover:text-destructive hover:border-destructive/50')}>
                {deleting ? '…' : confirmDel ? '¿Confirmar?' : 'Eliminar'}
              </button>
            )}
            <button onClick={onCancel} className="px-3 py-1.5 text-xs rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60">
              <Save size={12} />
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>

        {error && <div className="mb-4 px-3 py-2 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs">{error}</div>}

        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          {schema.fields.map(field => (
            <div key={field.key} className={cn('flex flex-col gap-1.5', field.width === 'half' || field.width === 'third' ? 'col-span-1' : 'col-span-2')}>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{field.label}</label>
              <FieldInput field={field} value={formData[field.key]} onChange={v => set(field.key, v)} />
            </div>
          ))}
        </div>
        {schema.fields.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-12">Este schema no tiene campos definidos.</p>
        )}
      </div>
    </div>
  )
}

// ─── DataBrowser (main) ───────────────────────────────────────────────────────

export function DataBrowser({
  schemaName, schema, initialRecords, initialView = 'sheets', onBack, className,
}: DataBrowserProps) {
  const [records, setRecords] = useState<DataItem[]>(initialRecords)
  const [view, setView]       = useState<'sheets' | 'cards' | 'form'>(initialView)
  const [search, setSearch]   = useState('')
  const [selectedRecord, setSelectedRecord] = useState<DataItem | null>(null)
  const [isLoading, setIsLoading]           = useState(false)
  const [returnView, setReturnView]         = useState<'sheets' | 'cards'>('sheets')

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/vault?namespace=${schemaName}`)
      const json = await res.json()
      setRecords(json.records ?? [])
    } catch (e) { console.error('[DataBrowser] refresh:', e) }
    finally { setIsLoading(false) }
  }, [schemaName])

  const openRecord = (record: DataItem) => {
    setSelectedRecord(record)
    if (view !== 'form') setReturnView(view as 'sheets' | 'cards')
    setView('form')
  }

  const openNew = () => {
    setSelectedRecord(null)
    if (view !== 'form') setReturnView(view as 'sheets' | 'cards')
    setView('form')
  }

  const handleSaved = async () => { await refresh(); setView(returnView); setSelectedRecord(null) }
  const handleDeleted = async () => { await refresh(); setView(returnView); setSelectedRecord(null) }

  const switchView = (v: 'sheets' | 'cards' | 'form') => {
    if (v === 'form') openNew()
    else { setView(v); setReturnView(v) }
  }

  const title = schema.label || schema.name
  const tabs = [
    { key: 'sheets', Icon: Table2,    label: 'Tabla' },
    { key: 'cards',  Icon: LayoutGrid, label: 'Tarjetas' },
    { key: 'form',   Icon: FilePlus2,  label: 'Formulario' },
  ] as const

  return (
    <div className={cn('flex flex-col overflow-hidden bg-background text-foreground', className ?? 'h-screen')}>

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <header className="shrink-0 border-b border-border/50 bg-background">
        <div className="flex items-center gap-2 px-4 h-11">
          {onBack ? (
            <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors p-1 -ml-1 rounded">
              <ArrowLeft size={15} />
            </button>
          ) : (
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors p-1 -ml-1 rounded">
              <ArrowLeft size={15} />
            </Link>
          )}
          <div className="h-4 w-px bg-border/60" />
          <span className="text-sm font-semibold tracking-tight truncate max-w-[160px]">{title}</span>
          <span className="text-[11px] text-muted-foreground bg-muted rounded px-1.5 py-0.5 font-mono leading-none shrink-0">
            {records.length}
          </span>

          <div className="flex-1" />

          <nav className="flex items-center rounded-lg border border-border/50 bg-muted/30 p-0.5 gap-0.5">
            {tabs.map(({ key, Icon, label }) => (
              <button key={key} onClick={() => switchView(key)}
                className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all',
                  view === key ? 'bg-background shadow-sm text-foreground font-medium' : 'text-muted-foreground hover:text-foreground')}>
                <Icon size={12} />
                <span className="hidden sm:block">{label}</span>
              </button>
            ))}
          </nav>

          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar…"
              className="pl-7 pr-2.5 py-1.5 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring w-32 focus:w-44 transition-all duration-200" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={11} />
              </button>
            )}
          </div>

          <button onClick={openNew}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all shrink-0">
            <Plus size={12} /><span>Nuevo</span>
          </button>

          <button onClick={refresh} disabled={isLoading} title="Actualizar"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40">
            <RefreshCw size={13} className={cn(isLoading && 'animate-spin')} />
          </button>
        </div>
      </header>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {view === 'sheets' && (
          <SheetsView
            schema={schema}
            schemaName={schemaName}
            records={records}
            searchQuery={search}
            onRefresh={refresh}
          />
        )}
        {view === 'cards' && (
          <CardsView schema={schema} records={records} searchQuery={search} onOpen={openRecord} onNew={openNew} />
        )}
        {view === 'form' && (
          <FormView schema={schema} record={selectedRecord} schemaName={schemaName}
            onSaved={handleSaved} onCancel={() => setView(returnView)} onDeleted={handleDeleted} />
        )}
      </main>
    </div>
  )
}
