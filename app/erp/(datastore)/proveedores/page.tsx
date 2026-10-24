'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { InputField } from '@/components/veta/input-field'
import { ProveedorFormModal } from '@/components/veta/proveedor-form-modal'
import { CuentasBancariasProveedorModal } from '@/components/veta/cuentas-bancarias-proveedor-modal'
import { useDataStore, type Proveedor } from '@/lib/data'

function formatCOP(amount: string | null | undefined): string {
  if (!amount) return '—'
  const n = Number(amount)
  if (!Number.isFinite(n)) return amount
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function coincide(proveedor: Proveedor, query: string): boolean {
  if (!query) return true
  const campos = [
    proveedor.nombre,
    proveedor.nit,
    proveedor.categoria,
    proveedor.descripcion,
    proveedor.contactoNombre,
    proveedor.contactoCargo,
    proveedor.email,
    proveedor.whatsapp,
    proveedor.telefonoComercial,
    proveedor.telefonoAlterno,
    proveedor.ciudad,
    proveedor.medioPago,
    proveedor.transportadora,
  ]
  return campos.some((c) => c && normalizar(c).includes(query))
}

function unicos(valores: (string | null | undefined)[]): string[] {
  return Array.from(new Set(valores.filter((v): v is string => !!v && v.trim() !== ''))).sort((a, b) =>
    a.localeCompare(b, 'es')
  )
}

export default function ProveedoresPage() {
  const store = useDataStore()
  const proveedores = store.proveedores.listar()
  const productos = store.catalogo.listar()

  const [query, setQuery] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [filtroCiudad, setFiltroCiudad] = useState('todas')
  const [filtroMedioPago, setFiltroMedioPago] = useState('todos')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Proveedor | null>(null)
  const [cuentasDe, setCuentasDe] = useState<Proveedor | null>(null)

  const categorias = useMemo(() => unicos(proveedores.map((p) => p.categoria)), [proveedores])
  const ciudades = useMemo(() => unicos(proveedores.map((p) => p.ciudad)), [proveedores])
  const mediosPago = useMemo(() => unicos(proveedores.map((p) => p.medioPago)), [proveedores])

  const productosPorProveedor = useMemo(() => {
    const mapa = new Map<string, number>()
    productos.forEach((p) => {
      if (!p.proveedorId || p.anulado) return
      mapa.set(p.proveedorId, (mapa.get(p.proveedorId) ?? 0) + 1)
    })
    return mapa
  }, [productos])

  // Sin useMemo a propósito: `store` es estable y el store mock muta arrays en sitio,
  // así que memoizar por [store] dejaría el conteo congelado tras agregar una cuenta.
  const cuentasPorProveedor = new Map<string, number>()
  store.proveedoresCuentasBancarias.listar().forEach((c) => {
    if (!c.activa) return
    cuentasPorProveedor.set(c.proveedorId, (cuentasPorProveedor.get(c.proveedorId) ?? 0) + 1)
  })

  const visibles = useMemo(() => {
    const q = normalizar(query)
    return proveedores.filter((p) => {
      if (!coincide(p, q)) return false
      if (filtroCategoria !== 'todas' && (p.categoria ?? '') !== filtroCategoria) return false
      if (filtroCiudad !== 'todas' && (p.ciudad ?? '') !== filtroCiudad) return false
      if (filtroMedioPago !== 'todos' && (p.medioPago ?? '') !== filtroMedioPago) return false
      return true
    })
  }, [proveedores, query, filtroCategoria, filtroCiudad, filtroMedioPago])

  const hayFiltros = !!query || filtroCategoria !== 'todas' || filtroCiudad !== 'todas' || filtroMedioPago !== 'todos'

  const abrirNuevo = () => {
    setEditando(null)
    setModalAbierto(true)
  }

  const abrirEdicion = (proveedor: Proveedor) => {
    setEditando(proveedor)
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setEditando(null)
  }

  const limpiarFiltros = () => {
    setQuery('')
    setFiltroCategoria('todas')
    setFiltroCiudad('todas')
    setFiltroMedioPago('todos')
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-heading">Proveedores</h1>
          <p className="text-sm text-text-muted mt-1">
            Administración de la colección de proveedores y su relación con el catálogo
          </p>
        </div>
        <Button variant="primary" size="md" onClick={abrirNuevo}>
          + Nuevo proveedor
        </Button>
      </header>

      <div className="mb-4 flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[240px] max-w-md">
          <InputField
            label="Buscar proveedor"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre, NIT, ciudad, teléfono, transportadora..."
          />
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-text-muted">Categoría</span>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-sm text-text-heading focus:border-brand focus:outline-none"
          >
            <option value="todas">Todas</option>
            {categorias.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-text-muted">Ciudad</span>
          <select
            value={filtroCiudad}
            onChange={(e) => setFiltroCiudad(e.target.value)}
            className="min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-sm text-text-heading focus:border-brand focus:outline-none"
          >
            <option value="todas">Todas</option>
            {ciudades.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-text-muted">Medio de pago</span>
          <select
            value={filtroMedioPago}
            onChange={(e) => setFiltroMedioPago(e.target.value)}
            className="min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-sm text-text-heading focus:border-brand focus:outline-none"
          >
            <option value="todos">Todos</option>
            {mediosPago.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>

        {hayFiltros && (
          <Button variant="ghost" size="md" onClick={limpiarFiltros}>
            Limpiar
          </Button>
        )}

        <span className="text-xs text-text-muted mb-3">
          {visibles.length} de {proveedores.length}
        </span>
      </div>

      {visibles.length === 0 ? (
        <p className="rounded-lg border border-border-subtle bg-bg-raised px-4 py-8 text-sm text-text-muted italic">
          {hayFiltros ? 'Sin proveedores para los filtros actuales.' : 'Sin proveedores registrados.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border-subtle bg-bg-raised">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-text-muted">
                <th className="px-4 py-3 font-semibold">Proveedor</th>
                <th className="px-4 py-3 font-semibold">Categoría</th>
                <th className="px-4 py-3 font-semibold">Contacto</th>
                <th className="px-4 py-3 font-semibold">Logística</th>
                <th className="px-4 py-3 font-semibold text-right">Productos</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((p) => {
                const cantidadProductos = productosPorProveedor.get(p.id) ?? 0
                return (
                  <tr key={p.id} className="border-b border-border-subtle/70 last:border-0 hover:bg-bg-alt/60">
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-heading">{p.nombre}</p>
                      <p className="font-mono text-xs text-text-muted">{p.nit || 'Sin NIT'}</p>
                      {p.descripcion && (
                        <p className="mt-1 line-clamp-2 max-w-xs text-xs text-text-muted" title={p.descripcion}>
                          {p.descripcion}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-heading">
                      {p.categoria ? <Badge tone="neutral">{p.categoria}</Badge> : <span className="text-text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3 text-text-heading">
                      <p className="font-medium">{p.contactoNombre || '—'}</p>
                      <p className="text-xs text-text-muted">{p.contactoCargo || 'Sin cargo'}</p>
                      <p className="text-xs">{p.email || 'Sin correo'}</p>
                      <p className="text-xs text-text-muted">
                        {[p.telefonoComercial, p.whatsapp ? `WhatsApp: ${p.whatsapp}` : null, p.telefonoAlterno].filter(Boolean).join(' · ') || 'Sin teléfono'}
                      </p>
                      <p className="text-xs text-text-muted">{[p.ciudad, p.direccionDespacho].filter(Boolean).join(' · ') || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-text-heading">
                      <p>{p.transportadora || '—'}</p>
                      <p className="text-xs text-text-muted">
                        {p.diasEntregaDefault != null ? `${p.diasEntregaDefault} días` : 'Plazo no definido'}
                        {p.medioPago ? ` · ${p.medioPago}` : ''}
                      </p>
                      <p className="text-xs text-text-muted">Flete: {formatCOP(p.tarifaFlete)}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-text-heading">{cantidadProductos}</span>
                      <p className="text-xs text-text-muted">en catálogo</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="ghost" size="md" className="text-xs" onClick={() => setCuentasDe(p)}>
                          Cuentas ({cuentasPorProveedor.get(p.id) ?? 0})
                        </Button>
                        <Button variant="ghost" size="md" className="text-xs" onClick={() => abrirEdicion(p)}>
                          Editar
                        </Button>
                        <Link
                          href={`/erp/compras/proveedores/${p.id}`}
                          className="inline-flex items-center rounded-sm border border-border-subtle px-3 py-1.5 text-xs font-medium text-text-heading transition-colors hover:border-gold-400 hover:text-gold-600"
                        >
                          Perfil
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalAbierto && (
        <ProveedorFormModal
          open={true}
          proveedor={editando}
          onClose={cerrarModal}
        />
      )}

      {cuentasDe && (
        <CuentasBancariasProveedorModal
          open={true}
          proveedor={cuentasDe}
          onClose={() => setCuentasDe(null)}
        />
      )}
    </div>
  )
}
