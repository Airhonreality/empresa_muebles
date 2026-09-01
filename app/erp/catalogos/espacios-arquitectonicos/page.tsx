'use client'
// t-147 (2026-08-31): Administración de la taxonomía ORGÁNICA de espacios arquitectónicos
// (catalogo_espacios_arquitectonicos). Esta taxonomía crece libremente para tipar y modular
// espacios/productos — es INDEPENDIENTE de las 7 categorías de landing (TIPOS_ESPACIO).
// Crear un espacio aquí jamás genera una landing pública.
import { useMemo, useState, type ChangeEvent } from 'react'
import { useDataStore, type CatalogoEspacioArquitectonico } from '@/lib/data'
import { Button, LinkButton } from '@/components/veta/button'
import { Badge } from '@/components/veta/badge'
import { usePendingGuard } from '@/lib/hooks/usePendingGuard'

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
  const store = useDataStore()
  const { guard: guardGuardar, isPending: guardando } = usePendingGuard()
  const [busqueda, setBusqueda] = useState('')
  const [form, setForm] = useState(VACIO)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)

  const catalogo = store.catalogosEspaciosArquitectonicos.listar()

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
        await store.catalogosEspaciosArquitectonicos.actualizar(editandoId, datos)
        setExito('Espacio actualizado.')
      } else {
        await store.catalogosEspaciosArquitectonicos.crear(datos)
        setExito('Espacio creado.')
      }
      setForm(VACIO); setEditandoId(null)
    } catch (e) {
      setError('No se pudo guardar: ' + (e as Error).message)
    }
  }

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
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border-subtle bg-bg-alt text-xs uppercase tracking-wider text-text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Código</th>
              <th className="px-4 py-3 font-semibold">Nombre</th>
              <th className="px-4 py-3 font-semibold">Unidad</th>
              <th className="px-4 py-3 font-semibold">Rango</th>
              <th className="px-4 py-3 font-semibold">Módulos</th>
              <th className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {filas.map((c) => (
              <tr key={c.id} className="hover:bg-bg-alt/50">
                <td className="px-4 py-3 font-mono text-xs font-bold text-brand">{c.codigo}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-text-heading">{c.nombre}</p>
                  {c.descripcion && <p className="text-xs text-text-muted line-clamp-2">{c.descripcion}</p>}
                </td>
                <td className="px-4 py-3">
                  {c.unidadBase ? (
                    <Badge tone="neutral">{UNIDADES.find((u) => u.valor === c.unidadBase)?.label ?? c.unidadBase}</Badge>
                  ) : <span className="text-text-muted">—</span>}
                </td>
                <td className="px-4 py-3 text-text-primary">
                  {c.rangoMinimo || c.rangoMaximo ? `${c.rangoMinimo ?? '?'} – ${c.rangoMaximo ?? '?'}` : <span className="text-text-muted">—</span>}
                </td>
                <td className="px-4 py-3">{c.modulosTipicosJson ? <Badge tone="info">Sí</Badge> : <span className="text-text-muted">—</span>}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="md" onClick={() => empezarEditar(c)}>Editar</Button>
                    <Button variant="destructive" size="md"
                      onClick={() => guardGuardar(async () => {
                        if (confirm(`Eliminar ${c.codigo} · ${c.nombre}?`)) {
                          await store.catalogosEspaciosArquitectonicos.eliminar(c.id)
                        }
                      })}
                      disabled={guardando}>Eliminar</Button>
                  </div>
                </td>
              </tr>
            ))}
            {filas.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-text-muted">No hay espacios en la taxonomía orgánica todavía.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
