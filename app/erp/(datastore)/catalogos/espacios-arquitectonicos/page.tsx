'use client'
// t-147 (2026-08-31): Administración de la taxonomía ORGÁNICA de espacios arquitectónicos
// (catalogo_espacios_arquitectonicos). Esta taxonomía crece libremente para tipar y modular
// espacios/productos — es INDEPENDIENTE de las 7 categorías de landing (TIPOS_ESPACIO).
// Crear un espacio aquí jamás genera una landing pública.
import { useMemo, useState, type ChangeEvent } from 'react'
import type { CatalogoEspacioArquitectonico } from '@/lib/data'
import { Button, LinkButton } from '@/components/veta/button'
import { Badge } from '@/components/veta/badge'
import { DataTable, type DataTableColumn } from '@/components/veta/data-table'
import { usePendingGuard } from '@/lib/hooks/usePendingGuard'
import { useCatalogoEspacios, useCrearCatalogoEspacioMutation, useActualizarCatalogoEspacioMutation, useEliminarCatalogoEspacioMutation } from '@/lib/data/queries/useCatalogoEspaciosQueries'

const UNIDADES: { valor: CatalogoEspacioArquitectonico['unidadBase']; label: string }[] = [
  { valor: 'metro_lineal', label: 'Metro lineal (ml)' },
  { valor: 'metro_cuadrado', label: 'Metro cuadrado (m²)' },
  { valor: 'metro_cubico', label: 'Metro cúbico (m³)' },
]

const VACIO = {
  codigo: '',
  nombre: '',
  descripcion: '',
  unidadBase: '' as CatalogoEspacioArquitectonico['unidadBase'],
  rangoMinimo: '',
  rangoMaximo: '',
  ejemploTamanio: '',
  modulosTipicosJson: '',
}

export default function CatalogoEspaciosArquitectonicosPage() {
  const { guard: guardGuardar, isPending: guardando } = usePendingGuard()
  const [busqueda, setBusqueda] = useState('')
  const [form, setForm] = useState(VACIO)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)

  const { data: catalogo = [] } = useCatalogoEspacios()
  const crearCatalogoEspacio = useCrearCatalogoEspacioMutation()
  const actualizarCatalogoEspacio = useActualizarCatalogoEspacioMutation()
  const eliminarCatalogoEspacio = useEliminarCatalogoEspacioMutation()

  const filas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return catalogo
    return catalogo.filter((c) =>
      [c.codigo, c.nombre, c.descripcion ?? ''].some((v) => (v ?? '').toLowerCase().includes(q))
    )
  }, [catalogo, busqueda])

  const sugerirCodigo = (): string => {
    let max = 0
    catalogo.forEach((c) => {
      const m = c.codigo.match(/^ESP-(\d+)$/)
      if (m) max = Math.max(max, parseInt(m[1], 10))
    })
    return `ESP-${String(max + 1).padStart(3, '0')}`
  }

  const handleChange = (campo: string, value: string) => {
    setForm((prev) => ({ ...prev, [campo]: value }))
  }

  const empezarCrear = () => {
    setError(null); setExito(null)
    setForm({ ...VACIO, codigo: sugerirCodigo() })
    setEditandoId(null)
  }

  const empezarEditar = (c: CatalogoEspacioArquitectonico) => {
    setError(null); setExito(null)
    setForm({
      codigo: c.codigo,
      nombre: c.nombre,
      descripcion: c.descripcion ?? '',
      unidadBase: c.unidadBase,
      rangoMinimo: c.rangoMinimo ?? '',
      rangoMaximo: c.rangoMaximo ?? '',
      ejemploTamanio: c.ejemploTamanio ?? '',
      modulosTipicosJson: c.modulosTipicosJson ? JSON.stringify(c.modulosTipicosJson, null, 2) : '',
    })
    setEditandoId(c.id)
  }

  const validarJson = (raw: string): unknown | null => {
    if (!raw.trim()) return null
    try { return JSON.parse(raw) } catch { throw new Error('El JSON de módulos típicos no es válido.') }
  }

  const guardar = async () => {
    setError(null); setExito(null)
    if (!form.codigo.trim() || !form.nombre.trim()) { setError('Código y nombre son obligatorios.'); return }
    let modulos: unknown = null
    try { modulos = validarJson(form.modulosTipicosJson) }
    catch (e) { setError((e as Error).message); return }
    const datos = {
      codigo: form.codigo.trim(),
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      unidadBase: form.unidadBase || null,
      rangoMinimo: form.rangoMinimo.trim() || null,
      rangoMaximo: form.rangoMaximo.trim() || null,
      ejemploTamanio: form.ejemploTamanio.trim() || null,
      modulosTipicosJson: modulos as Record<string, unknown> | null,
    }
    try {
      if (editandoId) {
        await actualizarCatalogoEspacio.mutateAsync({ id: editandoId, patch: datos })
        setExito('Espacio actualizado.')
      } else {
        await crearCatalogoEspacio.mutateAsync(datos)
        setExito('Espacio creado.')
      }
      setForm(VACIO); setEditandoId(null)
    } catch (e) {
      setError('No se pudo guardar: ' + (e as Error).message)
    }
  }

  const columnas: DataTableColumn<CatalogoEspacioArquitectonico>[] = [
    {
      key: 'codigo',
      header: 'Código',
      sortValue: (c) => c.codigo,
      render: (c) => <span className="font-mono text-xs font-bold text-brand">{c.codigo}</span>,
    },
    {
      key: 'nombre',
      header: 'Nombre',
      sortValue: (c) => c.nombre,
      render: (c) => (
        <div>
          <p className="font-medium text-text-heading">{c.nombre}</p>
          {c.descripcion && <p className="line-clamp-2 text-xs text-text-muted">{c.descripcion}</p>}
        </div>
      ),
    },
    {
      key: 'unidad',
      header: 'Unidad',
      sortValue: (c) => c.unidadBase ?? '',
      render: (c) => c.unidadBase ? (
        <Badge tone="neutral">{UNIDADES.find((u) => u.valor === c.unidadBase)?.label ?? c.unidadBase}</Badge>
      ) : <span className="text-text-muted">—</span>,
    },
    {
      key: 'rango',
      header: 'Rango',
      sortValue: (c) => c.rangoMinimo ?? '',
      render: (c) => c.rangoMinimo || c.rangoMaximo
        ? `${c.rangoMinimo ?? '?'} – ${c.rangoMaximo ?? '?'}`
        : <span className="text-text-muted">—</span>,
    },
    {
      key: 'modulos',
      header: 'Módulos',
      sortValue: (c) => (c.modulosTipicosJson ? 1 : 0),
      render: (c) => c.modulosTipicosJson ? <Badge tone="info">Sí</Badge> : <span className="text-text-muted">—</span>,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (c) => (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="md" onClick={() => empezarEditar(c)}>Editar</Button>
          <Button variant="destructive" size="md"
            onClick={() => guardGuardar(async () => {
              if (confirm(`Eliminar ${c.codigo} · ${c.nombre}?`)) {
                await eliminarCatalogoEspacio.mutateAsync(c.id)
              }
            })}
            disabled={guardando}>Eliminar</Button>
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-heading">Catálogo de Espacios Arquitectónicos</h1>
          <p className="text-sm text-text-muted mt-1">
            Taxonomía <strong>orgánica</strong> para tipar y modular espacios. Independiente de las 7 landings:
            crear aquí jamás genera una página pública.
          </p>
        </div>
        <LinkButton href="/erp/portafolio" variant="secondary">Volver</LinkButton>
      </header>

      {error && <div className="mb-4 rounded-sm border border-red-500 bg-red-500/10 px-4 py-3 text-sm text-red-600">{error}</div>}
      {exito && <div className="mb-4 rounded-sm border border-emerald-500 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">{exito}</div>}

      <div className="mb-6 flex items-center justify-between gap-3">
        <input
          type="text"
          value={busqueda}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setBusqueda(e.target.value)}
          placeholder="Buscar por código, nombre o descripción..."
          className="max-w-sm flex-1 min-h-[44px] rounded-sm border border-border-subtle bg-bg-raised px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
        />
        <Button variant="primary" onClick={empezarCrear}>+ Nuevo espacio</Button>
      </div>

      {/* Formulario crear/editar */}
      {(form.codigo || form.nombre) && (
        <div className="mb-6 rounded-lg border border-brand/30 bg-brand/5 p-5">
          <h2 className="mb-4 font-semibold text-text-heading">{editandoId ? 'Editar espacio' : 'Nuevo espacio'}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Código *</label>
              <input type="text" value={form.codigo} onChange={(e) => handleChange('codigo', e.target.value)}
                className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Nombre *</label>
              <input type="text" value={form.nombre} onChange={(e) => handleChange('nombre', e.target.value)}
                className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-text-muted mb-1">Descripción</label>
              <textarea value={form.descripcion} onChange={(e) => handleChange('descripcion', e.target.value)} rows={2}
                className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 py-2 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Unidad base de medición</label>
              <select value={form.unidadBase ?? ''} onChange={(e) => handleChange('unidadBase', e.target.value)}
                className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus">
                <option value="">Sin unidad</option>
                {UNIDADES.map((u) => <option key={u.valor ?? ''} value={u.valor ?? ''}>{u.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Ejemplo de tamaño</label>
              <input type="text" value={form.ejemploTamanio} onChange={(e) => handleChange('ejemploTamanio', e.target.value)}
                placeholder="Ej: 3.20 x 2.85 m"
                className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Rango mínimo (referencial)</label>
              <input type="text" value={form.rangoMinimo} onChange={(e) => handleChange('rangoMinimo', e.target.value)}
                placeholder="Ej: 2800000"
                className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Rango máximo (referencial)</label>
              <input type="text" value={form.rangoMaximo} onChange={(e) => handleChange('rangoMaximo', e.target.value)}
                placeholder="Ej: 9500000"
                className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-text-muted mb-1">Módulos típicos (JSON)</label>
              <textarea value={form.modulosTipicosJson} onChange={(e) => handleChange('modulosTipicosJson', e.target.value)} rows={4}
                placeholder={'[{"anchoCm":60,"largoCm":300,"unidad":"metro_lineal"}]'}
                className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 py-2 font-mono text-sm text-text-primary outline-none focus:border-brand focus:shadow-ring-focus" />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setForm(VACIO); setEditandoId(null); setError(null); setExito(null); }}>Cancelar</Button>
            <Button variant="primary" onClick={() => guardGuardar(guardar)} disabled={guardando} loading={guardando}>Guardar</Button>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-raised shadow-sm">
        <DataTable
          rows={filas}
          columns={columnas}
          rowKey={(c) => c.id}
          density="spacious"
          caption="Catálogo de espacios arquitectónicos"
          empty="No hay espacios en la taxonomía orgánica todavía."
        />
      </div>
    </div>
  )
}
