'use client'

import { useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { InputField } from '@/components/veta/input-field'
import { MoneyInput } from '@/components/veta/money-input'
import { ImagePicker } from '@/components/veta/image-picker'
import { Modal } from '@/components/veta/modal'
import { useDataStore, type Herramienta, type EstadoOperativoHerramienta, type OrdenCompra } from '@/lib/data'
import { usePendingGuard } from '@/lib/hooks/usePendingGuard'

function formatCOP(amount: string | number): string {
  const n = typeof amount === 'string' ? parseInt(amount.replace(/[^\d]/g, ''), 10) : amount
  if (Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

const ESTADO_LABELS: Record<EstadoOperativoHerramienta, string> = {
  operativa: 'Operativa',
  reparacion: 'En reparación',
  fuera_servicio: 'Fuera de servicio',
  necesita_reposicion: 'Necesita reposición',
}

const ESTADO_TONES: Record<EstadoOperativoHerramienta, 'neutral' | 'info' | 'warning' | 'danger'> = {
  operativa: 'info',
  reparacion: 'warning',
  fuera_servicio: 'danger',
  necesita_reposicion: 'danger',
}

function BadgeEstadoHerramienta({ estado }: { estado: EstadoOperativoHerramienta }) {
  return (
    <Badge tone={ESTADO_TONES[estado]} variant="material" dot>
      {ESTADO_LABELS[estado]}
    </Badge>
  )
}

interface HerramientaForm {
  nombre: string
  valor: string
  fotoUrl: string[]
  proveedorId: string
  error: string | null
}

const EMPTY_FORM: HerramientaForm = {
  nombre: '',
  valor: '',
  fotoUrl: [],
  proveedorId: '',
  error: null,
}

function AccionesHerramienta({
  herramienta,
  onActualizarEstado,
  onReponer,
  ordenesCompra,
}: {
  herramienta: Herramienta
  onActualizarEstado: (id: string, estado: EstadoOperativoHerramienta) => void
  onReponer: (id: string) => void
  ordenesCompra: OrdenCompra[]
}) {
  const estado = herramienta.estadoOperativo
  const ocRepo = herramienta.ordenCompraReposicionId
    ? ordenesCompra.find((oc) => oc.id === herramienta.ordenCompraReposicionId)
    : null

  const acciones: { label: string; estado: EstadoOperativoHerramienta; variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' }[] = []

  switch (estado) {
    case 'operativa':
      // D-05: "Enviar a mantenimiento" y "Reportar daño" colapsados — ambos llevaban al mismo
      // destino (fuera de servicio temporal) sin ninguna regla que distinguiera la información
      // capturada por uno u otro (violación de Axioma 1, Independencia).
      acciones.push(
        { label: 'Enviar a reparación', estado: 'reparacion', variant: 'secondary' },
        { label: 'Necesita reposición', estado: 'necesita_reposicion', variant: 'ghost' },
      )
      break
    case 'reparacion':
      // D-05: camino de éxito que faltaba — antes solo existía "Reparación fallida",
      // una herramienta en reparación nunca podía volver a estar operativa.
      acciones.push(
        { label: 'Reparación exitosa', estado: 'operativa', variant: 'primary' },
        { label: 'Reparación fallida', estado: 'fuera_servicio', variant: 'destructive' },
        { label: 'Necesita reposición', estado: 'necesita_reposicion', variant: 'ghost' },
      )
      break
    case 'fuera_servicio':
      acciones.push(
        { label: 'Necesita reposición', estado: 'necesita_reposicion', variant: 'ghost' },
      )
      break
    case 'necesita_reposicion':
      break
  }

  return (
    <div className="flex items-center gap-1">
      {acciones.map((accion) => (
        <Button
          key={accion.estado}
          size="md"
          variant={accion.variant || 'secondary'}
          onClick={() => onActualizarEstado(herramienta.id, accion.estado)}
          className="text-xs px-2"
        >
          {accion.label}
        </Button>
      ))}
      {estado !== 'necesita_reposicion' && (
        <Button
          size="md"
          variant="ghost"
          onClick={() => onReponer(herramienta.id)}
          className="text-xs px-2 text-amber-700 hover:bg-amber-50"
        >
          Necesita reposición
        </Button>
      )}
      {ocRepo && (
        <Badge tone="info" variant="material">
          OC: {ocRepo.codigoOrden}
        </Badge>
      )}
    </div>
  )
}

export default function HerramientasPage() {
  const store = useDataStore()
  const herramientas = store.herramientas.listar()
  const proveedores = store.proveedores.listar()
  const ordenesCompra = store.ordenesCompra.listar()

  const [filtroEstado, setFiltroEstado] = useState<EstadoOperativoHerramienta | 'todos'>('todos')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [form, setForm] = useState<HerramientaForm>(EMPTY_FORM)
  const [bannerError, setBannerError] = useState<string | null>(null)

  const herramientasFiltradas = useMemo(() => {
    if (filtroEstado === 'todos') return herramientas
    return herramientas.filter((h) => h.estadoOperativo === filtroEstado)
  }, [herramientas, filtroEstado])

  const handleChange = useCallback(<K extends keyof Omit<HerramientaForm, 'error'>>(campo: K, valor: HerramientaForm[K]) => {
    setForm((prev) => ({ ...prev, [campo]: valor, error: null }))
  }, [])

  const validarForm = (): string | null => {
    if (!form.nombre.trim()) return 'El nombre es obligatorio'
    if (!form.valor.trim()) return 'El valor es obligatorio'
    const valorNum = parseInt(form.valor.replace(/[^\d]/g, ''), 10)
    if (Number.isNaN(valorNum) || valorNum < 0) return 'El valor debe ser un número positivo'
    return null
  }

  const { guard: guardGuardarHerramienta, isPending: guardandoHerramienta } = usePendingGuard()

  const guardarHerramienta = async () => {
    const errorValidacion = validarForm()
    if (errorValidacion) {
      setForm((prev) => ({ ...prev, error: errorValidacion }))
      return
    }
    const payload = {
      nombre: form.nombre.trim(),
      valor: form.valor.replace(/[^\d]/g, ''),
      fotoUrl: form.fotoUrl[0] ?? null,
      proveedorId: form.proveedorId || null,
    }
    const resultado = await store.herramientas.crear(payload)
    if (!resultado) {
      setForm((prev) => ({ ...prev, error: 'No se pudo crear la herramienta' }))
      return
    }
    setModalAbierto(false)
    setForm(EMPTY_FORM)
    setBannerError(null)
  }

  const handleActualizarEstado = async (id: string, estado: EstadoOperativoHerramienta) => {
    setBannerError(null)
    const resultado = await store.herramientas.actualizarEstado(id, estado)
    if (!resultado) {
      setBannerError(`No se pudo cambiar el estado a "${ESTADO_LABELS[estado]}"`)
    }
  }

  const handleReponer = async (id: string) => {
    setBannerError(null)
    const resultado = await store.herramientas.reponer(id)
    if (!resultado) {
      // D-05: reponer() ya no crea una OC con proveedor vacío -- si vuelve null, la causa real
      // (desde esta UI) es que la herramienta no tiene proveedor asignado, no una OC duplicada
      // (ese caso ya se resuelve devolviendo la OC existente, no null).
      setBannerError('No se pudo crear la orden de reposición: la herramienta no tiene proveedor asignado')
    }
  }

  const abrirNuevo = () => {
    setForm(EMPTY_FORM)
    setModalAbierto(true)
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-heading">Inventario de herramientas</h1>
          <p className="text-sm text-text-muted mt-1">Taller — Gate E-45: reposición automática vía OC operativa</p>
        </div>
        <Button variant="primary" size="md" onClick={abrirNuevo}>
          + Nueva herramienta
        </Button>
      </header>

      {bannerError && (
        <div role="alert" className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {bannerError}
        </div>
      )}

      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm font-medium text-text-muted">Filtrar por estado:</span>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value as EstadoOperativoHerramienta | 'todos')}
          className="min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-sm text-text-heading focus:border-brand focus:shadow-ring-focus focus:outline-none"
        >
          <option value="todos">Todos</option>
          <option value="operativa">Operativa</option>
          <option value="reparacion">En reparación</option>
          <option value="fuera_servicio">Fuera de servicio</option>
          <option value="necesita_reposicion">Necesita reposición</option>
        </select>
        <span className="ml-auto text-sm text-text-muted">
          {herramientasFiltradas.length} de {herramientas.length}
        </span>
      </div>

      <section className="rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[60px_minmax(180px,1.2fr)_140px_120px_140px_180px] border-b border-border-subtle bg-bg-alt/40 px-3 py-2 text-xs font-semibold text-text-muted">
              <span>Foto</span>
              <span>Nombre</span>
              <span>Estado</span>
              <span>Valor</span>
              <span>Proveedor</span>
              <span className="text-right">Acciones</span>
            </div>

            {herramientasFiltradas.length === 0 ? (
              <p className="px-3 py-6 text-sm text-text-muted italic">
                {filtroEstado !== 'todos' ? `Sin herramientas en estado "${ESTADO_LABELS[filtroEstado as EstadoOperativoHerramienta]}".` : 'Sin herramientas registradas.'}
              </p>
            ) : (
              herramientasFiltradas.map((h) => {
                const proveedor = h.proveedorId ? proveedores.find((p) => p.id === h.proveedorId) : null
                return (
                  <div
                    key={h.id}
                    className={`grid grid-cols-[60px_minmax(180px,1.2fr)_140px_120px_140px_180px] items-center border-b border-border-subtle/50 px-3 py-2 text-sm last:border-0 ${
                      h.estadoOperativo === 'fuera_servicio' ? 'opacity-50' : ''
                    }`}
                  >
                    <span className="flex justify-center">
                      {h.fotoUrl ? (
                        <span className="relative block h-12 w-12 overflow-hidden rounded-sm border border-border-subtle">
                          <Image src={h.fotoUrl} alt={h.nombre} fill className="object-cover" />
                        </span>
                      ) : (
                        <div className="h-12 w-12 rounded-sm border border-border-subtle bg-bg-paper flex items-center justify-center text-xs text-text-muted">
                          Sin foto
                        </div>
                      )}
                    </span>
                    <span className="min-w-0 truncate font-medium text-text-heading">{h.nombre}</span>
                    <span><BadgeEstadoHerramienta estado={h.estadoOperativo} /></span>
                    <span className="font-mono text-text-heading">{formatCOP(h.valor)}</span>
                    <span className="text-text-muted truncate">{proveedor?.nombre ?? '—'}</span>
                    <span className="flex items-center justify-end gap-1">
                      <AccionesHerramienta
                        herramienta={h}
                        onActualizarEstado={handleActualizarEstado}
                        onReponer={handleReponer}
                        ordenesCompra={ordenesCompra}
                      />
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </section>

      <Modal open={modalAbierto} onClose={() => setModalAbierto(false)} title="Nueva herramienta">
        <div className="space-y-3">
          <InputField
            label="Nombre"
            value={form.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            placeholder='Ej. Sierra circular Makita 7 1/4"'
          />
          <MoneyInput
            label="Valor"
            value={form.valor}
            onChange={(v) => handleChange('valor', v)}
            aria-label="Valor en COP"
          />
          <ImagePicker
            label="Foto"
            value={form.fotoUrl}
            onChange={(v) => handleChange('fotoUrl', v)}
            multiple={false}
          />
          <label className="flex flex-col gap-1">
            <span className="text-xs text-text-muted">Proveedor sugerido</span>
            <select
              value={form.proveedorId}
              onChange={(e) => handleChange('proveedorId', e.target.value)}
              className="min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-sm text-text-heading focus:border-brand focus:shadow-ring-focus focus:outline-none"
            >
              <option value="">Sin proveedor</option>
              {proveedores.map((prov) => (
                <option key={prov.id} value={prov.id}>{prov.nombre}</option>
              ))}
            </select>
          </label>

          {form.error && (
            <p role="alert" className="rounded-sm border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {form.error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="md" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => guardGuardarHerramienta(guardarHerramienta)}
              disabled={guardandoHerramienta}
              loading={guardandoHerramienta}
            >
              Crear herramienta
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}