'use client'

/**
 * DataBrowser — Universal Schema Explorer
 *
 * Multi-view interactive CRUD interface for any schema in the system.
 * Mounted at /_data/[schema]. Zero business-domain coupling.
 *
 * Views:
 *   sheets — resizable columns, per-column filters, sort, global search
 *   cards  — card grid, click to open
 *   form   — full CRUD form for all field types
 *
 * AXIOMATIC_CONTRACT:
 * - MUST: Write only via POST /api/vault (action: WRITE | REMOVE)
 * - MUST: Read refreshes via GET /api/vault?namespace={schemaName}
 * - NEVER: Import from Zustand stores (this is a standalone specialized component)
 */

import React, { useCallback, useState } from 'react'
import Link from 'next/link'
import type { DataItem } from '@agnostic/core'
import {
  ArrowLeft, Check, ChevronDown, ChevronUp, ChevronsUpDown,
  FilePlus2, LayoutGrid, Plus, RefreshCw, Save,
  Search, SlidersHorizontal, Table2, Trash2, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Domain Types ──────────────────────────────────────────────────────────────

export interface SchemaField {
  key: string
  label: string
  type: string
  options?: { label: string; value: string }[]
  config?: { relation?: { entity: string; displayField: string } }
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
  /** When provided, the ← button calls this instead of navigating to "/" */
  onBack?: () => void
  /** Override root div class — defaults to "h-screen" for standalone page use */
  className?: string
}

// ─── CellValue ─────────────────────────────────────────────────────────────────
// Renders a field value inside table cells and card previews

function CellValue({ value, field }: { value: unknown; field: SchemaField }) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-muted-foreground/30 text-xs select-none">—</span>
  }

  if (field.type === 'boolean') {
    return value
      ? <Check size={13} className="text-emerald-500 shrink-0" />
      : <X size={13} className="text-muted-foreground/30 shrink-0" />
  }

  if (field.type === 'select') {
    const opt = field.options?.find(o => o.value === value)
    const label = opt?.label ?? String(value)
    return (
      <span className="inline-block px-1.5 py-0.5 rounded text-[11px] bg-muted font-medium leading-none">
        {label}
      </span>
    )
  }

  if (field.type === 'date') {
    try {
      return <span>{new Date(String(value)).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
    } catch {
      return <span>{String(value)}</span>
    }
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

// ─── FieldInput ─────────────────────────────────────────────────────────────────
// Renders the appropriate input control for each field type in the Form view

function FieldInput({
  field, value, onChange,
}: {
  field: SchemaField
  value: unknown
  onChange: (v: unknown) => void
}) {
  const base =
    'w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring transition-colors placeholder:text-muted-foreground/50'

  if (field.readOnly) {
    return (
      <div className="px-3 py-2 text-sm rounded-md border border-input bg-muted/30 text-muted-foreground">
        {value !== undefined && value !== null ? String(value) : <span className="italic opacity-50">Sin valor</span>}
      </div>
    )
  }

  if (field.type === 'boolean') {
    const checked = Boolean(value)
    return (
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-sm rounded-md border transition-colors',
          checked
            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
            : 'border-input bg-background text-muted-foreground hover:border-muted-foreground',
        )}
      >
        {checked ? <Check size={14} /> : <X size={14} />}
        {checked ? 'Sí' : 'No'}
      </button>
    )
  }

  if (field.type === 'select') {
    return (
      <select
        value={String(value ?? '')}
        onChange={e => onChange(e.target.value)}
        className={base}
      >
        <option value="">— Sin selección —</option>
        {field.options?.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    )
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        value={String(value ?? '')}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={3}
        className={cn(base, 'resize-none leading-relaxed')}
      />
    )
  }

  if (field.type === 'number') {
    return (
      <input
        type="number"
        value={value === null || value === undefined ? '' : String(value)}
        onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
        placeholder={field.placeholder ?? '0'}
        className={base}
      />
    )
  }

  if (field.type === 'date') {
    return (
      <input
        type="date"
        value={String(value ?? '')}
        onChange={e => onChange(e.target.value)}
        className={base}
      />
    )
  }

  if (field.type === 'object') {
    const strVal =
      typeof value === 'string'
        ? value
        : JSON.stringify(value ?? {}, null, 2)
    return (
      <textarea
        value={strVal}
        onChange={e => {
          try { onChange(JSON.parse(e.target.value)) } catch { onChange(e.target.value) }
        }}
        placeholder={'{\n  "key": "value"\n}'}
        rows={5}
        className={cn(base, 'resize-y font-mono text-xs leading-relaxed')}
      />
    )
  }

  if (field.type === 'array_of_objects') {
    const strVal =
      typeof value === 'string'
        ? value
        : JSON.stringify(value ?? [], null, 2)
    return (
      <textarea
        value={strVal}
        onChange={e => {
          try { onChange(JSON.parse(e.target.value)) } catch { onChange(e.target.value) }
        }}
        placeholder={'[\n  { "key": "value" }\n]'}
        rows={5}
        className={cn(base, 'resize-y font-mono text-xs leading-relaxed')}
      />
    )
  }

  if (field.type === 'relation') {
    return (
      <input
        type="text"
        value={String(value ?? '')}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder ?? 'ID del registro relacionado'}
        className={base}
      />
    )
  }

  // Default: text
  return (
    <input
      type="text"
      value={String(value ?? '')}
      onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder}
      className={base}
    />
  )
}

// ─── SheetsView ──────────────────────────────────────────────────────────────

interface SheetsViewProps {
  schema: Schema
  records: DataItem[]
  searchQuery: string
  onOpen: (record: DataItem) => void
  onDelete: (id: string) => void
}

function SheetsView({ schema, records, searchQuery, onOpen, onDelete }: SheetsViewProps) {
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [colFilters, setColFilters] = useState<Record<string, string>>({})
  const [colWidths, setColWidths] = useState<Record<string, number>>({})
  const [showFilters, setShowFilters] = useState(false)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  // Columns: skip deeply nested types for readability, max 10 visible
  const visibleFields = schema.fields
    .filter(f => f.type !== 'object' && f.type !== 'array_of_objects')
    .slice(0, 10)

  const handleSort = (key: string) => {
    if (sortField === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(key)
      setSortDir('asc')
    }
  }

  const startResize = (e: React.MouseEvent, fieldKey: string) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startWidth = colWidths[fieldKey] ?? 160

    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX
      setColWidths(prev => ({ ...prev, [fieldKey]: Math.max(60, startWidth + delta) }))
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  // Filter
  const filtered = records.filter(r => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const hit = schema.fields.some(f =>
        String((r.data as any)[f.key] ?? '').toLowerCase().includes(q)
      )
      if (!hit) return false
    }
    for (const [key, fv] of Object.entries(colFilters)) {
      if (!fv) continue
      if (!String((r.data as any)[key] ?? '').toLowerCase().includes(fv.toLowerCase())) return false
    }
    return true
  })

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0
    const av = String((a.data as any)[sortField] ?? '')
    const bv = String((b.data as any)[sortField] ?? '')
    const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' })
    return sortDir === 'asc' ? cmp : -cmp
  })

  const hasAnyFilter = Object.values(colFilters).some(Boolean)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Subheader toolbar */}
      <div className="flex items-center gap-2 px-4 py-1.5 border-b border-border/30 bg-muted/10 text-xs shrink-0">
        <span className="text-muted-foreground tabular-nums">
          {sorted.length !== records.length
            ? `${sorted.length} de ${records.length} registros`
            : `${records.length} registro${records.length !== 1 ? 's' : ''}`}
        </span>
        <div className="flex-1" />
        {hasAnyFilter && (
          <button
            onClick={() => setColFilters({})}
            className="flex items-center gap-1 text-destructive hover:underline transition-colors"
          >
            <X size={10} />
            Limpiar filtros
          </button>
        )}
        <button
          onClick={() => setShowFilters(f => !f)}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded border transition-colors',
            showFilters || hasAnyFilter
              ? 'border-primary/50 bg-primary/5 text-primary'
              : 'border-border text-muted-foreground hover:text-foreground hover:border-border',
          )}
        >
          <SlidersHorizontal size={11} />
          Filtros {hasAnyFilter && `(${Object.values(colFilters).filter(Boolean).length})`}
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm border-collapse" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            {visibleFields.map(f => (
              <col key={f.key} style={{ width: colWidths[f.key] ?? 160 }} />
            ))}
            <col style={{ width: 40 }} />
          </colgroup>

          <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm">
            {/* Column headers */}
            <tr>
              {visibleFields.map(field => {
                const isSorted = sortField === field.key
                return (
                  <th
                    key={field.key}
                    className="relative group text-left font-medium text-[11px] text-muted-foreground uppercase tracking-wider border-b border-r border-border/40 select-none overflow-hidden"
                  >
                    <div className="flex items-center gap-1 px-3 py-2 pr-8">
                      <button
                        onClick={() => handleSort(field.key)}
                        className="flex items-center gap-1 hover:text-foreground transition-colors flex-1 truncate min-w-0"
                      >
                        <span className="truncate">{field.label}</span>
                        {isSorted ? (
                          sortDir === 'asc'
                            ? <ChevronUp size={11} className="shrink-0 text-primary" />
                            : <ChevronDown size={11} className="shrink-0 text-primary" />
                        ) : (
                          <ChevronsUpDown size={11} className="shrink-0 opacity-0 group-hover:opacity-40 transition-opacity" />
                        )}
                      </button>
                    </div>
                    {/* Resize handle */}
                    <div
                      onMouseDown={e => startResize(e, field.key)}
                      className="absolute right-0 top-0 w-4 h-full cursor-col-resize flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <div className="w-px h-4 bg-border group-hover:bg-primary/60 rounded-full transition-colors" />
                    </div>
                  </th>
                )
              })}
              <th className="border-b border-border/40 bg-muted/90" />
            </tr>

            {/* Filter row */}
            {showFilters && (
              <tr className="bg-background border-b border-border/40">
                {visibleFields.map(field => (
                  <th key={field.key} className="px-2 py-1.5 border-r border-border/20 font-normal">
                    <input
                      type="text"
                      value={colFilters[field.key] ?? ''}
                      onChange={e =>
                        setColFilters(prev => ({ ...prev, [field.key]: e.target.value }))
                      }
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
            {sorted.map((record, i) => (
              <tr
                key={record.id}
                className={cn(
                  'border-b border-border/20 cursor-pointer transition-colors group/row',
                  i % 2 === 0 ? 'bg-background' : 'bg-muted/5',
                  'hover:bg-primary/5',
                )}
                onMouseEnter={() => setHoveredRow(record.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => onOpen(record)}
              >
                {visibleFields.map(field => (
                  <td
                    key={field.key}
                    className="px-3 py-2 border-r border-border/15 overflow-hidden text-sm"
                  >
                    <CellValue value={(record.data as any)[field.key]} field={field} />
                  </td>
                ))}
                <td className="px-1 py-1 text-center w-10">
                  {hoveredRow === record.id && (
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        onDelete(record.id)
                      }}
                      className="p-1 rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={visibleFields.length + 1}
                  className="py-20 text-center text-muted-foreground text-sm"
                >
                  {records.length === 0
                    ? 'Sin registros aún. Crea el primero con el botón +'
                    : 'Ningún registro coincide con los filtros activos.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
  const primaryField = schema.fields.find(f => f.isPrimary) ?? schema.fields[0]
  const secondaryFields = schema.fields
    .filter(f => f !== primaryField && f.type !== 'object' && f.type !== 'array_of_objects')
    .slice(0, 3)

  const filtered = !searchQuery
    ? records
    : records.filter(r => {
        const q = searchQuery.toLowerCase()
        return schema.fields.some(f =>
          String((r.data as any)[f.key] ?? '').toLowerCase().includes(q)
        )
      })

  return (
    <div className="flex-1 overflow-auto p-5">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
        {/* New card */}
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
          const primaryVal = primaryField
            ? String((record.data as any)[primaryField.key] ?? '')
            : record.id
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
              <div className="text-[10px] text-muted-foreground/30 font-mono mt-auto pt-1 border-t border-border/20">
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

function FormView({ schema, record, schemaName, onSaved, onCancel, onDeleted }: FormViewProps) {
  const isNew = !record
  const [formData, setFormData] = useState<Record<string, unknown>>(() =>
    isNew ? {} : { ...(record.data as Record<string, unknown>) }
  )
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: string, val: unknown) =>
    setFormData(prev => ({ ...prev, [key]: val }))

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'WRITE',
          namespace: schemaName,
          record: { id: record?.id ?? crypto.randomUUID(), data: formData },
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'Error al guardar')
      onSaved()
    } catch (e: any) {
      setError(e.message ?? 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 4000)
      return
    }
    setDeleting(true)
    try {
      await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REMOVE', namespace: schemaName, id: record!.id }),
      })
      onDeleted()
    } finally {
      setDeleting(false)
    }
  }

  // Grid col-span by field width
  const spanClass = (w?: string) => {
    if (w === 'half' || w === 'third') return 'col-span-1'
    return 'col-span-2'
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {isNew ? 'Nuevo registro' : 'Editar registro'}
            </h2>
            {!isNew && (
              <p className="text-xs text-muted-foreground font-mono mt-0.5 select-all">
                {record.id}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isNew && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-md border transition-all',
                  confirmDelete
                    ? 'border-destructive bg-destructive text-destructive-foreground font-medium animate-pulse'
                    : 'border-border text-muted-foreground hover:text-destructive hover:border-destructive/50',
                )}
              >
                {deleting ? '...' : confirmDelete ? '¿Confirmar?' : 'Eliminar'}
              </button>
            )}

            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-xs rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              Cancelar
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60"
            >
              <Save size={12} />
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs">
            {error}
          </div>
        )}

        {/* Fields grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          {schema.fields.map(field => (
            <div key={field.key} className={cn('flex flex-col gap-1.5', spanClass(field.width))}>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {field.label}
              </label>
              <FieldInput
                field={field}
                value={formData[field.key]}
                onChange={v => set(field.key, v)}
              />
            </div>
          ))}
        </div>

        {/* Empty schema guard */}
        {schema.fields.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-12">
            Este schema no tiene campos definidos.
          </p>
        )}
      </div>
    </div>
  )
}

// ─── DataBrowser (main) ───────────────────────────────────────────────────────

export function DataBrowser({
  schemaName,
  schema,
  initialRecords,
  initialView = 'sheets',
  onBack,
  className,
}: DataBrowserProps) {
  const [records, setRecords] = useState<DataItem[]>(initialRecords)
  const [view, setView] = useState<'sheets' | 'cards' | 'form'>(initialView)
  const [search, setSearch] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<DataItem | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  // Track where to return after closing form
  const [returnView, setReturnView] = useState<'sheets' | 'cards'>('sheets')

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/vault?namespace=${schemaName}`)
      const json = await res.json()
      setRecords(json.records ?? [])
    } catch (e) {
      console.error('[DataBrowser] refresh error:', e)
    } finally {
      setIsLoading(false)
    }
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

  const handleSaved = async () => {
    await refresh()
    setView(returnView)
    setSelectedRecord(null)
  }

  const handleDeleted = async () => {
    await refresh()
    setView(returnView)
    setSelectedRecord(null)
  }

  const handleDeleteRow = async (id: string) => {
    if (!confirm('¿Eliminar este registro?')) return
    await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'REMOVE', namespace: schemaName, id }),
    })
    await refresh()
  }

  const switchView = (v: 'sheets' | 'cards' | 'form') => {
    if (v === 'form') {
      openNew()
    } else {
      setView(v)
      setReturnView(v)
    }
  }

  const title = schema.label || schema.name

  const tabs = [
    { key: 'sheets', Icon: Table2, label: 'Tabla' },
    { key: 'cards', Icon: LayoutGrid, label: 'Tarjetas' },
    { key: 'form', Icon: FilePlus2, label: 'Formulario' },
  ] as const

  return (
    <div className={cn('flex flex-col overflow-hidden bg-background text-foreground', className ?? 'h-screen')}>
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="shrink-0 border-b border-border/50 bg-background">
        <div className="flex items-center gap-2 px-4 h-11">
          {/* Breadcrumb — Link when standalone, button when embedded */}
          {onBack ? (
            <button
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 -ml-1 rounded"
            >
              <ArrowLeft size={15} />
            </button>
          ) : (
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors p-1 -ml-1 rounded"
            >
              <ArrowLeft size={15} />
            </Link>
          )}
          <div className="h-4 w-px bg-border/60" />
          <span className="text-sm font-semibold tracking-tight truncate max-w-[160px]">
            {title}
          </span>
          <span className="text-[11px] text-muted-foreground bg-muted rounded px-1.5 py-0.5 font-mono leading-none shrink-0">
            {records.length}
          </span>

          <div className="flex-1" />

          {/* Tab switcher */}
          <nav className="flex items-center rounded-lg border border-border/50 bg-muted/30 p-0.5 gap-0.5">
            {tabs.map(({ key, Icon, label }) => (
              <button
                key={key}
                onClick={() => switchView(key)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all',
                  view === key
                    ? 'bg-background shadow-sm text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon size={12} />
                <span className="hidden sm:block">{label}</span>
              </button>
            ))}
          </nav>

          {/* Search */}
          <div className="relative">
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar…"
              className="pl-7 pr-2.5 py-1.5 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring w-32 focus:w-44 transition-all duration-200"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={11} />
              </button>
            )}
          </div>

          {/* New */}
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all shrink-0"
          >
            <Plus size={12} />
            <span>Nuevo</span>
          </button>

          {/* Refresh */}
          <button
            onClick={refresh}
            disabled={isLoading}
            title="Actualizar"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
          >
            <RefreshCw size={13} className={cn(isLoading && 'animate-spin')} />
          </button>
        </div>
      </header>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {view === 'sheets' && (
          <SheetsView
            schema={schema}
            records={records}
            searchQuery={search}
            onOpen={openRecord}
            onDelete={handleDeleteRow}
          />
        )}
        {view === 'cards' && (
          <CardsView
            schema={schema}
            records={records}
            searchQuery={search}
            onOpen={openRecord}
            onNew={openNew}
          />
        )}
        {view === 'form' && (
          <FormView
            schema={schema}
            record={selectedRecord}
            schemaName={schemaName}
            onSaved={handleSaved}
            onCancel={() => {
              setView(returnView)
              setSelectedRecord(null)
            }}
            onDeleted={handleDeleted}
          />
        )}
      </main>
    </div>
  )
}
