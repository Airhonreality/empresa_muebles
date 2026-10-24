'use client'

// t-181 (2026-10-17): primitiva agnóstica de tabla ordenable.
//
// Antes de esto el ERP tenía ~20 tablas hechas a mano con <table> y cada pantalla resolvía
// el orden como podía (o no lo resolvía). El usuario pidió el patrón estándar: clic en el
// encabezado de una columna para ordenar asc/desc, en vez de un desplegable externo.
//
// No agrega dependencias (no se instala TanStack Table): recibe columnas + filas, resuelve
// el orden con `sortValue`, expone `aria-sort` y se puede reutilizar en cualquier listado.
// Las columnas sin `sortValue` quedan como encabezados no interactivos (acciones, enlaces).

import { useMemo, useState, type ReactNode } from 'react'

export type SortDirection = 'asc' | 'desc'

export interface DataTableColumn<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  align?: 'left' | 'center' | 'right'
  /** Si se define, el encabezado es clickeable y la columna se puede ordenar. */
  sortValue?: (row: T) => string | number | null | undefined
  headerClassName?: string
  cellClassName?: string
}

export interface DataTableProps<T> {
  rows: T[]
  columns: DataTableColumn<T>[]
  rowKey: (row: T) => string
  initialSort?: { key: string; direction: SortDirection }
  empty?: ReactNode
  rowClassName?: (row: T) => string
  /** 'compact' = px-2 (libro denso); 'comfortable' = px-3; 'spacious' = px-4. */
  density?: 'compact' | 'comfortable' | 'spacious'
  /** Ej. 'max-h-[28rem]' para que la tabla scrollee sin empujar el resto de la página. */
  maxHeightClassName?: string
  caption?: string
}

function comparar(a: string | number | null | undefined, b: string | number | null | undefined): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), 'es', { numeric: true, sensitivity: 'base' })
}

function alineacion(align: DataTableColumn<unknown>['align']): string {
  if (align === 'right') return 'text-right'
  if (align === 'center') return 'text-center'
  return 'text-left'
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  initialSort,
  empty,
  rowClassName,
  density = 'comfortable',
  maxHeightClassName = '',
  caption,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; direction: SortDirection } | null>(initialSort ?? null)

  const filasOrdenadas = useMemo(() => {
    if (!sort) return rows
    const columna = columns.find((c) => c.key === sort.key && c.sortValue)
    if (!columna?.sortValue) return rows
    const signo = sort.direction === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => comparar(columna.sortValue!(a), columna.sortValue!(b)) * signo)
  }, [rows, columns, sort])

  const alternarOrden = (columna: DataTableColumn<T>) => {
    if (!columna.sortValue) return
    setSort((actual) => {
      if (actual?.key === columna.key) {
        return { key: columna.key, direction: actual.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key: columna.key, direction: 'asc' }
    })
  }

  const padding = density === 'compact' ? 'px-2 py-2' : density === 'spacious' ? 'px-4 py-3' : 'px-3 py-2'

  return (
    <div className={`overflow-auto ${maxHeightClassName}`}>
      <table className="w-full border-collapse text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((columna) => {
              const ordenable = Boolean(columna.sortValue)
              const activa = sort?.key === columna.key
              const ariaSort = ordenable
                ? activa
                  ? sort.direction === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
                : undefined
              return (
                <th
                  key={columna.key}
                  scope="col"
                  aria-sort={ariaSort}
                  className={`sticky top-0 z-10 border-b border-border-subtle bg-bg-raised font-semibold text-text-heading ${padding} ${alineacion(columna.align)} ${columna.headerClassName ?? ''}`}
                >
                  {ordenable ? (
                    <button
                      type="button"
                      onClick={() => alternarOrden(columna)}
                      title={`Ordenar por ${columna.header}`}
                      className={`flex w-full items-center gap-1 ${columna.align === 'right' ? 'justify-end' : columna.align === 'center' ? 'justify-center' : 'justify-start'}`}
                    >
                      <span>{columna.header}</span>
                      <span aria-hidden="true" className={activa ? 'text-gold-700' : 'text-text-muted/50'}>
                        {activa ? (sort.direction === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    </button>
                  ) : (
                    columna.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {filasOrdenadas.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={`${padding} text-center text-sm text-text-muted`}>
                {empty ?? 'Sin registros.'}
              </td>
            </tr>
          ) : (
            filasOrdenadas.map((row) => (
              <tr key={rowKey(row)} className={`border-b border-border-subtle/50 transition-colors hover:bg-bg-alt/40 ${rowClassName?.(row) ?? ''}`}>
                {columns.map((columna) => (
                  <td
                    key={columna.key}
                    className={`${padding} ${alineacion(columna.align)} ${columna.cellClassName ?? ''}`}
                  >
                    {columna.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
