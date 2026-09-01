'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { MoneyInput } from '@/components/veta/money-input'
import { NumberInput } from '@/components/veta/number-input'
import { SmartSearch } from '@/components/veta/smart-search'
import { ImagePicker } from '@/components/veta/image-picker'
import { ItemMiniatura } from '@/components/veta/item-miniatura'
import { ItemDescriptorModal } from '@/components/veta/item-descriptor-modal'
import { ContratoModal } from '../ContratoModal'
import { EditarProyectoModal } from '@/components/veta/editar-proyecto-modal'
import { useDataStore, type DataStore, type ProductoCatalogo, type ItemVariante, type EspacioVariante, type EspacioArtefacto } from '@/lib/data'
import { PARAMETROS_DEFAULT, type ParametrosJornadas } from '@/lib/modules/finanzas'
import { TIPOS_ESPACIO } from '@/lib/catalogos/tipos-espacio'
import { usePendingGuard } from '@/lib/hooks/usePendingGuard'
import { useDebouncedInput } from '@/lib/hooks/useDebouncedInput'

/* Wrapper local para el input de "Grupo referencial": vive dentro de un `.map()`, así que el hook
   no puede llamarse directamente en el callback del map (violaría Rules of Hooks) -- por eso se
   envuelve en su propio componente, igual que NumberInput/MoneyInput envuelven useDebouncedInput. */
function GrupoReferencialInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { local, onChangeLocal, onBlurLocal } = useDebouncedInput(value, onChange)
  return (
    <input
      type="text"
      value={local}
      onChange={(e) => onChangeLocal(e.target.value)}
      onBlur={onBlurLocal}
      placeholder="Grupo (ej. Ventanas)"
      className="rounded border border-border-subtle bg-bg-paper px-1.5 py-0.5 text-xs text-text-heading focus:border-gold-400 focus:outline-none w-36"
      aria-label="Grupo referencial"
    />
  )
}

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Semántica decidida por el Supervisor (2026-08-09): tarifa horaria por rol
// (panel Finanzas, claves valor_hora_*) × jornadas por espacio (días).
// Una jornada = HORAS_POR_JORNADA horas-hombre.
const HORAS_POR_JORNADA = 8

function parseNum(s: string | null | undefined): number {
  if (!s) return 0
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

interface TarifasMO {
  tarifaDev: number
  tarifaAssembly: number
  tarifaInstall: number
}

function derivarTarifas(store: DataStore): TarifasMO {
  const parametros = obtenerParametrosJornadas(store)
  const hora = (rol: keyof ParametrosJornadas['valorHoraPorRol']) => parseNum(parametros.valorHoraPorRol[rol])
  return {
    tarifaDev: hora('desarrollador') * HORAS_POR_JORNADA,
    tarifaAssembly: hora('carpintero') * HORAS_POR_JORNADA,
    tarifaInstall: hora('auxiliar') * HORAS_POR_JORNADA,
  }
}

type JornadasTuple = { dev: string; ens: string; inst: string }

function buildJornadasMap(espacios: EspacioVariante[]): Record<string, JornadasTuple> {
  const map: Record<string, JornadasTuple> = {}
  espacios.forEach((e) => {
    map[e.id] = { dev: e.jornadasDesarrolloTecnico, ens: e.jornadasEnsamblajeTaller, inst: e.jornadasInstalacionObra }
  })
  return map
}

function obtenerParametrosJornadas(store: DataStore): ParametrosJornadas {
  const p = (k: string) => store.parametros.obtenerPorClave(k)?.valorTexto ?? store.parametros.obtenerPorClave(k)?.valorNumeric ?? null
  return {
    valorHoraPorRol: {
      desarrollador: p('valor_hora_desarrollador') ?? PARAMETROS_DEFAULT.jornadas.valorHoraPorRol.desarrollador,
      carpintero: p('valor_hora_carpintero') ?? PARAMETROS_DEFAULT.jornadas.valorHoraPorRol.carpintero,
      auxiliar: p('valor_hora_auxiliar') ?? PARAMETROS_DEFAULT.jornadas.valorHoraPorRol.auxiliar,
    },
    horasPorTarea: {},
    arriendoTallerPorDia: p('arriendo_taller_por_dia') ?? PARAMETROS_DEFAULT.jornadas.arriendoTallerPorDia,
    diasHabilesPorMes: parseInt(p('dias_habiles_por_mes') ?? String(PARAMETROS_DEFAULT.jornadas.diasHabilesPorMes)),
  }
}

export default function CotizadorPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const proyectoId = params.proyectoId as string
  // P-03 (detalle solo lectura): misma ruta que P-04, activada por ?readonly=true
  // (disenio_p03_detalle_solo_lectura.md R8/CA-14). No hay sesión con rol real
  // todavía (F10 mock) — el auto-routing por rol (R2/CA-15/CA-16) queda diferido
  // hasta que exista un sistema de sesión de staff; por ahora es explícito por query param.
  const readonly = searchParams.get('readonly') === 'true'
  const router = useRouter()
  const store = useDataStore()
  const version = store.getVersion()

  const proyecto = store.proyectos.obtenerPorId(proyectoId)
  const cliente = proyecto?.clienteId ? store.clientes.obtenerPorId(proyecto.clienteId) : undefined
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const espaciosBase = useMemo(() => proyecto ? store.espacios.porProyecto(proyecto.id) : [], [proyecto, store, version])
  const catalogo = store.catalogo.listar()

  // Un mismo "espacio" (nombreEspacio) puede tener varias variantes alternativas
  // para comparar — "una activa" (REGISTRO_DE_ENTIDADES). Solo la activa de cada
  // grupo cuenta para totales/contrato; las demás son comparación, no se cotizan.
  const gruposPorNombre = useMemo(() => {
    const grupos = new Map<string, EspacioVariante[]>()
    espaciosBase.forEach((e) => {
      const arr = grupos.get(e.nombreEspacio) ?? []
      arr.push(e)
      grupos.set(e.nombreEspacio, arr)
    })
    return grupos
  }, [espaciosBase])
  const idsActivos = useMemo(() => {
    const ids = new Set<string>()
    gruposPorNombre.forEach((variantes) => {
      const activa = variantes.find((v) => v.activa) ?? variantes[0]
      ids.add(activa.id)
    })
    return ids
  }, [gruposPorNombre])
  const espaciosActivos = espaciosBase.filter((esp) => idsActivos.has(esp.id))
  const contrato = proyecto ? store.contratos.porProyecto(proyecto.id) : undefined
  const hitosList = contrato ? store.hitos.porContrato(contrato.id) : []

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tarifas = useMemo(() => derivarTarifas(store), [store, version])
  const { tarifaDev, tarifaAssembly, tarifaInstall } = tarifas

  const [jornadasMap, setJornadasMap] = useState<Record<string, JornadasTuple>>(() =>
    buildJornadasMap(espaciosBase),
  )
  
  // Actualizar jornadasMap cuando espaciosBase cambie
  useEffect(() => {
    setJornadasMap(buildJornadasMap(espaciosBase))
  }, [espaciosBase])

  // Colapso por GRUPO (nombreEspacio), no por variante — las variantes son tabs
  // dentro de la tarjeta del grupo, no tarjetas independientes.
  const [gruposExpandidos, setGruposExpandidos] = useState<Set<string>>(
    new Set(espaciosBase.map((e) => e.nombreEspacio)),
  )
  const [mostrarContratoModal, setMostrarContratoModal] = useState(false)
  const [mostrarEditarProyecto, setMostrarEditarProyecto] = useState(false)
  const [nuevoEspacioNombre, setNuevoEspacioNombre] = useState('')
  const [nuevoEspacioTipo, setNuevoEspacioTipo] = useState('')
  const { guard: guardCrearEspacio, isPending: creandoEspacio } = usePendingGuard()

  const crearEspacio = useCallback(async () => {
    const nombreFinal = nuevoEspacioNombre.trim()
    if (!nombreFinal) return
    const nuevoEspacio = await store.espacios.crear({
      proyectoId,
      nombreEspacio: nombreFinal || `Espacio ${gruposPorNombre.size + 1}`,
      nombreVariante: 'Inicial',
      tipoEspacio: nuevoEspacioTipo || null,
      descripcion: '',
      visibleEnPropuestaPublica: true,
      orden: espaciosBase.length + 1,
      jornadasDesarrolloTecnico: '0',
      jornadasEnsamblajeTaller: '0',
      jornadasInstalacionObra: '0',
    })
    setGruposExpandidos(prev => new Set(prev).add(nuevoEspacio.nombreEspacio))
    setNuevoEspacioNombre('')
    setNuevoEspacioTipo('')
  }, [nuevoEspacioNombre, nuevoEspacioTipo, proyectoId, gruposPorNombre.size, espaciosBase.length, store])

  const toggleGrupo = useCallback((nombreEspacio: string) => {
    setGruposExpandidos((prev) => {
      const next = new Set(prev)
      if (next.has(nombreEspacio)) next.delete(nombreEspacio)
      else next.add(nombreEspacio)
      return next
    })
  }, [])

  const actualizarJornadas = useCallback(
    (espacioId: string, campo: keyof JornadasTuple, valor: string) => {
      // POC-10#1: solo numérico decimal simple (evita NaN silencioso en totales)
      if (!/^[0-9]*\.?[0-9]*$/.test(valor)) return
      setJornadasMap((prev) => {
        const current = prev[espacioId] ?? { dev: '0', ens: '0', inst: '0' }
        const nuevo = { ...current, [campo]: valor }
        // El updater de setState debe ser síncrono; la escritura real corre aparte.
        store.espacios.actualizarJornadas(espacioId, {
          jornadasDesarrolloTecnico: nuevo.dev,
          jornadasEnsamblajeTaller: nuevo.ens,
          jornadasInstalacionObra: nuevo.inst,
        }).catch((err) => console.error('No se pudo guardar jornadas', err))
        return { ...prev, [espacioId]: nuevo }
      })
    },
    [store],
  )

  if (!proyecto) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-text-muted">Proyecto no encontrado</p>
        <p className="text-xs font-mono mt-2">{proyectoId}</p>
      </div>
    )
  }

  const materialesTotal = espaciosActivos.reduce((sum, esp) => {
    const items = store.items.porVariante(esp.id).filter((it) => !it.esReferencial)
    return sum + items.reduce((s, it) => s + parseNum(it.totalLinea), 0)
  }, 0)

  const moDev = espaciosActivos.reduce(
    (sum, e) => sum + parseNum(jornadasMap[e.id]?.dev ?? '0') * tarifaDev,
    0,
  )
  const moEns = espaciosActivos.reduce(
    (sum, e) => sum + parseNum(jornadasMap[e.id]?.ens ?? '0') * tarifaAssembly,
    0,
  )
  const moInst = espaciosActivos.reduce(
    (sum, e) => sum + parseNum(jornadasMap[e.id]?.inst ?? '0') * tarifaInstall,
    0,
  )
  const moTotal = moDev + moEns + moInst

  const costosOperativos = parseNum(proyecto.costosOperativos)
  const imprevistos = parseNum(proyecto.imprevistosInstalacion)
  const descuento = parseNum(proyecto.descuentoComercial)
  const ajuste = parseNum(proyecto.ajusteArbitrario)
  const subtotal = materialesTotal + moTotal + costosOperativos + imprevistos - descuento + ajuste
  const iva = proyecto.aplicaIva ? Math.round(subtotal * (parseNum(proyecto.porcentajeIva) / 100)) : 0
  const total = subtotal + iva

  if (readonly) {
    return (
      <VistaSoloLectura
        proyecto={proyecto}
        cliente={cliente}
        espaciosActivos={espaciosActivos}
        store={store}
        contrato={contrato}
        hitosList={hitosList}
        tarifas={tarifas}
        materialesTotal={materialesTotal}
        moDev={moDev}
        moEns={moEns}
        moInst={moInst}
        moTotal={moTotal}
        costosOperativos={costosOperativos}
        imprevistos={imprevistos}
        descuento={descuento}
        ajuste={ajuste}
        subtotal={subtotal}
        iva={iva}
        total={total}
      />
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header — Ultra Compacto, sticky (disenio_p04_cotizador.md §5.1) */}
      <header className="sticky top-0 z-10 bg-bg-raised px-4 py-2 border-b border-border-subtle">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {/* Proyecto + cliente + estado */}
          <div className="min-w-0 flex flex-1 items-baseline gap-2">
            <h1 className="font-display text-base font-semibold text-text-heading truncate" title={proyecto.nombreProyecto}>
              {proyecto.nombreProyecto}
            </h1>
            {cliente && (
              <span className="hidden sm:inline text-xs text-text-muted truncate">· {cliente.nombre}</span>
            )}
            <Badge tone={proyecto.estado === 'activa' ? 'info' : proyecto.estado === 'produccion' ? 'danger' : 'warning'} dot>
              {proyecto.estado}
            </Badge>
          </div>

          {/* Garantía — parámetro editable (D-11/D-12: ya no es badge) */}
          <label className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-text-muted">Garantía</span>
            <input
              type="number"
              min={0}
              max={20}
              value={proyecto.garantiaAnios}
              onChange={async (e) => {
                const n = Number(e.target.value)
                await store.proyectos.actualizarParametrosFinancieros(proyecto.id, { garantiaAnios: Number.isFinite(n) ? n : 0 })
              }}
              className="w-12 rounded border border-border-subtle bg-bg-paper px-1.5 py-1 text-xs font-mono focus:border-gold-400 focus:outline-none"
              aria-label="Años de garantía"
            />
            <span className="text-xs text-text-muted">años</span>
          </label>

          {/* IVA — compacto */}
          <div className="flex items-center gap-1.5 shrink-0">
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={proyecto.aplicaIva}
                onChange={async (e) => {
                  await store.proyectos.actualizarParametrosFinancieros(proyecto.id, { aplicaIva: e.target.checked })
                }}
                className="rounded border border-border-subtle cursor-pointer"
                aria-label="Aplicar IVA"
              />
              <span className="text-xs font-medium text-text-heading">IVA</span>
            </label>
            {proyecto.aplicaIva && (
              <label className="flex items-center gap-1">
                <input
                  type="number"
                  value={proyecto.porcentajeIva}
                  onChange={async (e) => {
                    await store.proyectos.actualizarParametrosFinancieros(proyecto.id, { porcentajeIva: e.target.value })
                  }}
                  step="0.1"
                  min="0"
                  max="100"
                  className="w-12 rounded border border-border-subtle bg-bg-paper px-1.5 py-1 text-xs font-mono focus:border-gold-400 focus:outline-none"
                  aria-label="Porcentaje IVA"
                />
                <span className="text-xs text-text-muted">%</span>
              </label>
            )}
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="ghost" size="md" className="h-7 px-2 text-xs" onClick={() => setMostrarEditarProyecto(true)}>
              Editar datos
            </Button>
            <Button variant="ghost" size="md" className="h-7 px-2 text-xs" onClick={() => window.open(`/propuesta/${proyecto.id}`, '_blank')}>
              Propuesta pública
            </Button>
            <Button variant="ghost" size="md" className="h-7 px-2 text-xs" onClick={() => window.open(`/erp/cotizador/${proyecto.id}?readonly=true`, '_blank')}>
              Solo lectura
            </Button>
            <Button variant="primary" size="md" className="h-7 px-3 text-xs" onClick={() => setMostrarContratoModal(true)}>
              Generar Contrato
            </Button>
            {proyecto.estado === 'activa' && (
              <Button
                variant="ghost"
                size="md"
                className="h-7 px-2 text-xs text-red-500 hover:text-red-600"
                onClick={async () => {
                  if (window.confirm(`¿Eliminar la cotización "${proyecto.nombreProyecto}"? Solo se pueden eliminar cotizaciones en estado Lead. Esta acción borra todos sus datos y no se puede deshacer.`)) {
                    const ok = await store.proyectos.eliminar(proyecto.id)
                    if (ok) router.push('/erp/cotizador')
                  }
                }}
              >
                Eliminar
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Contenido scrolleable */}
      <div className="px-6 py-6">
        {(proyecto.direccionObra || proyecto.descripcionSemantica) && (
          <div className="mb-4 space-y-1">
            {proyecto.direccionObra && <p className="text-xs text-text-muted">{proyecto.direccionObra}</p>}
            {proyecto.descripcionSemantica && (
              <p className="text-sm text-text-muted italic border-l-2 border-gold-300 pl-3">
                {proyecto.descripcionSemantica}
              </p>
            )}
          </div>
        )}

      {/* Espacios */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Espacios</h2>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={nuevoEspacioNombre}
              onChange={(e) => setNuevoEspacioNombre(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && nuevoEspacioNombre.trim()) {
                  e.preventDefault()
                  void guardCrearEspacio(crearEspacio)
                }
              }}
              placeholder="Añadir espacio..."
              className="rounded border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none w-40 transition-all duration-fast"
              aria-label="Nombre del nuevo espacio"
              disabled={creandoEspacio}
            />
            <select
              value={nuevoEspacioTipo}
              onChange={(e) => setNuevoEspacioTipo(e.target.value)}
              className="rounded border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none transition-all duration-fast"
              aria-label="Tipo del nuevo espacio"
            >
              <option value="">Sin tipo</option>
              {TIPOS_ESPACIO.map((t) => (
                <option key={t.codigo} value={t.codigo}>{t.label}</option>
              ))}
            </select>
            <Button
              variant="ghost"
              size="md"
              className="h-8 text-xs"
              onClick={() => void guardCrearEspacio(crearEspacio)}
              disabled={creandoEspacio}
              loading={creandoEspacio}
              aria-label="Crear nuevo espacio"
            >
              + Crear
            </Button>
          </div>
        </div>
        {Array.from(gruposPorNombre.entries()).map(([nombreEspacio, variantes]) => (
          <EspacioGroup
            key={nombreEspacio}
            nombreEspacio={nombreEspacio}
            variantes={variantes}
            catalogo={catalogo}
            expandido={gruposExpandidos.has(nombreEspacio)}
            onToggle={() => toggleGrupo(nombreEspacio)}
            jornadasMap={jornadasMap}
            onUpdateJornadas={actualizarJornadas}
            tarifas={{ tarifaDev, tarifaAssembly, tarifaInstall }}
            proyectoId={proyecto.id}
          />
        ))}
      </section>

      {/* Mano de Obra */}
      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-md border border-border-subtle bg-bg-raised p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Desarrollo Técnico</p>
          <p className="mt-2 font-mono text-xl font-medium text-text-heading">{formatCOP(moDev)}</p>
          <p className="text-xs text-text-muted mt-1">{tarifaDev.toLocaleString()} COP/jornada</p>
        </div>
        <div className="rounded-md border border-border-subtle bg-bg-raised p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Ensamblaje Taller</p>
          <p className="mt-2 font-mono text-xl font-medium text-text-heading">{formatCOP(moEns)}</p>
          <p className="text-xs text-text-muted mt-1">{tarifaAssembly.toLocaleString()} COP/jornada</p>
        </div>
        <div className="rounded-md border border-border-subtle bg-bg-raised p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Instalación Obra</p>
          <p className="mt-2 font-mono text-xl font-medium text-text-heading">{formatCOP(moInst)}</p>
          <p className="text-xs text-text-muted mt-1">{tarifaInstall.toLocaleString()} COP/jornada</p>
        </div>
      </section>

      {/* Grand Totals */}
      <section className="mt-8 rounded-lg border border-border-subtle bg-bg-paper p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-4">Resumen de Cotización</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Materiales</span>
            <span className="font-mono text-text-heading">{formatCOP(materialesTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Mano de Obra</span>
            <span className="font-mono text-text-heading">{formatCOP(moTotal)}</span>
          </div>
          {costosOperativos > 0 && (
            <div className="flex justify-between">
              <span className="text-text-muted">Costos Operativos</span>
              <span className="font-mono text-text-heading">{formatCOP(costosOperativos)}</span>
            </div>
          )}
          {imprevistos > 0 && (
            <div className="flex justify-between">
              <span className="text-text-muted">Imprevistos</span>
              <span className="font-mono text-text-heading">{formatCOP(imprevistos)}</span>
            </div>
          )}
          {descuento > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Descuento</span>
              <span className="font-mono">&minus;{formatCOP(descuento)}</span>
            </div>
          )}
          {ajuste !== 0 && (
            <div className="flex justify-between">
              <span className="text-text-muted">Ajuste</span>
              <span className="font-mono text-text-heading">{formatCOP(ajuste)}</span>
            </div>
          )}
          <hr className="border-border-subtle" />
          <div className="flex justify-between font-semibold">
            <span className="text-text-heading">Subtotal</span>
            <span className="font-mono text-text-heading">{formatCOP(subtotal)}</span>
          </div>
          {iva > 0 && (
            <div className="flex justify-between">
              <span className="text-text-muted">IVA ({proyecto.porcentajeIva}%)</span>
              <span className="font-mono text-text-heading">{formatCOP(iva)}</span>
            </div>
          )}
          <hr className="border-border-subtle" />
          <div className="flex justify-between text-lg font-semibold">
            <span className="text-text-heading">Total</span>
            <span className="font-mono text-brand">{formatCOP(total)}</span>
          </div>
        </div>
      </section>

      {/* Contrato */}
      {contrato && (
        <section className="mt-6 rounded-lg border border-border-subtle bg-bg-raised p-6">
          <h3 className="font-semibold text-text-heading">Contrato · {contrato.codigoContrato}</h3>
          <p className="text-sm text-text-muted mt-1">Valor total: <span className="font-mono font-medium">{formatCOP(parseNum(contrato.valorTotal))}</span> · Estado: {contrato.estado}</p>

          {contrato.objetoItems && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase text-text-muted">Objeto</p>
              <p className="text-sm text-text-heading mt-1">{contrato.objetoItems}</p>
            </div>
          )}

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase text-text-muted mb-2">Plan de Pagos</p>
            {hitosList.length === 0 && (
              <p className="text-xs text-text-muted italic">Sin hitos definidos.</p>
            )}
            {hitosList.map((h) => (
              <div key={h.id} className="flex items-center justify-between border-b border-border-subtle py-2 text-sm last:border-0">
                <div>
                  <span className="font-mono font-medium text-text-heading">{h.orden}.</span>
                  <span className="ml-2 text-text-heading">{h.razon}</span>
                </div>
                <span className="font-mono text-text-heading">
                  {h.tipo === 'percentage' ? `${h.montoOPorcentaje}%` : formatCOP(parseNum(h.montoOPorcentaje))}
                </span>
              </div>
            ))}

            {hitosList.length > 0 && (
              <div className="mt-3 flex justify-between text-sm font-semibold border-t border-border-subtle pt-2">
                <span className="text-text-muted">Suma de hitos</span>
                <span className="font-mono text-text-heading">
                  {hitosList.reduce((s, h) => s + parseNum(h.montoOPorcentaje), 0)}%
                </span>
              </div>
            )}
           </div>
          </section>
         )}

        {/* Modal Generar Contrato */}
        {mostrarContratoModal && proyecto && (
          <ContratoModal
            proyecto={proyecto}
            cliente={cliente}
            espacios={espaciosActivos}
            itemsPorEspacio={new Map(espaciosActivos.map((esp) => [esp.id, store.items.porVariante(esp.id).filter((it) => !it.esReferencial)]))}
            catalogo={catalogo}
            manoDeObra={moTotal}
            onClose={() => setMostrarContratoModal(false)}
            onSaved={() => setMostrarContratoModal(false)}
          />
        )}

        {/* Modal Editar datos del proyecto (t-143) */}
        {mostrarEditarProyecto && (
          <EditarProyectoModal
            proyecto={proyecto}
            clientes={store.clientes.listar()}
            onClose={() => setMostrarEditarProyecto(false)}
            onSaved={() => setMostrarEditarProyecto(false)}
          />
        )}
      </div>
      </div>
    )
}

/**
 * P-03 — Detalle de cotización, solo lectura (disenio_p03_detalle_solo_lectura.md).
 * Misma ruta y mismos datos que P-04 (CotizadorPage) — todos los totales se
 * pasan ya calculados desde ahí para garantizar que coinciden exactamente con
 * el editor (CA-11), en vez de recalcularlos acá y arriesgar que diverjan.
 */
function VistaSoloLectura({
  proyecto,
  cliente,
  espaciosActivos,
  store,
  contrato,
  hitosList,
  tarifas,
  materialesTotal,
  moDev,
  moEns,
  moInst,
  moTotal,
  costosOperativos,
  imprevistos,
  descuento,
  ajuste,
  subtotal,
  iva,
  total,
}: {
  proyecto: NonNullable<ReturnType<DataStore['proyectos']['obtenerPorId']>>
  cliente: ReturnType<DataStore['clientes']['obtenerPorId']>
  espaciosActivos: EspacioVariante[]
  store: DataStore
  contrato: ReturnType<DataStore['contratos']['porProyecto']>
  hitosList: ReturnType<DataStore['hitos']['porContrato']>
  tarifas: TarifasMO
  materialesTotal: number
  moDev: number
  moEns: number
  moInst: number
  moTotal: number
  costosOperativos: number
  imprevistos: number
  descuento: number
  ajuste: number
  subtotal: number
  iva: number
  total: number
}) {
  const router = useRouter()
  const puedeEditar = ['activa', 'enviada', 'en_contrato'].includes(proyecto.estado)

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <div className="mb-4 rounded border border-gold-300 bg-gold-100/40 px-3 py-1.5 text-xs text-text-muted">
        Cotizador — Solo Lectura
      </div>

      {/* HeaderProyectoDisplay */}
      <header className="mb-6 rounded-lg border border-border-subtle bg-bg-raised p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-text-heading">{proyecto.nombreProyecto}</h1>
            {cliente && (
              <p className="text-sm text-text-muted mt-1">{cliente.nombre} · {cliente.telefono ?? 's/tel'} · {cliente.email ?? 's/email'}</p>
            )}
            {proyecto.direccionObra && <p className="text-xs text-text-muted mt-1">{proyecto.direccionObra}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={proyecto.estado === 'activa' ? 'info' : proyecto.estado === 'produccion' ? 'danger' : 'warning'} dot>
              {proyecto.estado}
            </Badge>
            <Badge tone="neutral">{proyecto.tipoProyecto}</Badge>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-text-muted sm:grid-cols-4">
          <span>Costos operativos: {formatCOP(costosOperativos)}</span>
          <span>Imprevistos: {formatCOP(imprevistos)}</span>
          <span className={descuento > 0 ? 'text-red-600' : ''}>Descuento: {formatCOP(descuento)}</span>
          <span>IVA: {proyecto.aplicaIva ? `Sí (${proyecto.porcentajeIva}%)` : 'No'}</span>
          <span>Garantía: {proyecto.garantiaAnios} años</span>
        </div>
      </header>

      {/* EspacioCardReadOnly + ItemRowDisplay */}
      <section className="mb-6 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Espacios</h2>
        {espaciosActivos.map((esp) => {
          const items = store.items.porVariante(esp.id)
          const contractuales = items.filter((it) => !it.esReferencial)
          const referenciales = items.filter((it) => it.esReferencial)
          return (
            <div key={esp.id} className="rounded-lg border border-border-subtle bg-bg-raised p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-text-heading">{esp.nombreEspacio}</span>
                <Badge tone="neutral">{esp.nombreVariante}</Badge>
              </div>
              {contractuales.map((item) => (
                <div key={item.id} className="flex justify-between text-sm border-b border-border-subtle/50 py-1 last:border-0">
                  <span className="text-text-heading">{item.nombrePersonalizado ?? 'Ítem'} · {item.cantidad}</span>
                  <span className="font-mono text-text-muted">{formatCOP(parseNum(item.precioUnitario))} → {formatCOP(parseNum(item.totalLinea))}</span>
                </div>
              ))}
              {referenciales.length > 0 && (
                <div className="mt-2 border-t border-dashed border-gold-300 pt-2">
                  <p className="text-[11px] font-semibold uppercase text-gold-700 mb-1">Presupuesto adicional (referencial)</p>
                  {referenciales.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs text-text-muted py-0.5">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
                        {item.nombrePersonalizado ?? 'Ítem'}
                      </span>
                      <span className="font-mono">{formatCOP(parseNum(item.totalLinea))}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </section>

      {/* ManoObraDisplay */}
      <section className="mb-6 rounded-lg border border-border-subtle bg-bg-raised p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-3">Mano de Obra</h2>
        <div className="grid gap-2 text-sm sm:grid-cols-3">
          <p>Desarrollo técnico — Tarifa: {formatCOP(tarifas.tarifaDev)}/jornada — {formatCOP(moDev)}</p>
          <p>Ensamblaje taller — Tarifa: {formatCOP(tarifas.tarifaAssembly)}/jornada — {formatCOP(moEns)}</p>
          <p>Instalación obra — Tarifa: {formatCOP(tarifas.tarifaInstall)}/jornada — {formatCOP(moInst)}</p>
        </div>
        <p className="mt-2 text-sm font-semibold text-text-heading">Subtotal MO: {formatCOP(moTotal)}</p>
      </section>

      {/* ResumenTotals */}
      <section className="mb-6 rounded-lg border border-border-subtle bg-bg-paper p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-4">Resumen de Cotización</h2>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-text-muted">Materiales</span><span className="font-mono">{formatCOP(materialesTotal)}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Mano de Obra</span><span className="font-mono">{formatCOP(moTotal)}</span></div>
          {ajuste !== 0 && <div className="flex justify-between"><span className="text-text-muted">Ajuste</span><span className="font-mono">{formatCOP(ajuste)}</span></div>}
          <hr className="border-border-subtle" />
          <div className="flex justify-between font-semibold"><span>Subtotal</span><span className="font-mono">{formatCOP(subtotal)}</span></div>
          {iva > 0 && <div className="flex justify-between"><span className="text-text-muted">IVA</span><span className="font-mono">{formatCOP(iva)}</span></div>}
          <div className="flex justify-between text-lg font-semibold"><span>Total</span><span className="font-mono text-brand">{formatCOP(total)}</span></div>
        </div>
      </section>

      {/* ContratoDisplay */}
      <section className="mb-6 rounded-lg border border-border-subtle bg-bg-raised p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-3">Contrato</h2>
        {contrato ? (
          <>
            <p className="text-sm text-text-heading">{contrato.codigoContrato} · {formatCOP(parseNum(contrato.valorTotal))} · {contrato.estado}</p>
            {hitosList.length > 0 && (
              <div className="mt-3 space-y-1">
                {hitosList.map((h) => (
                  <div key={h.id} className="flex justify-between text-sm border-b border-border-subtle/50 py-1 last:border-0">
                    <span>{h.orden}. {h.razon}</span>
                    <span className="font-mono">{h.tipo === 'percentage' ? `${h.montoOPorcentaje}%` : formatCOP(parseNum(h.montoOPorcentaje))}</span>
                  </div>
                ))}
              </div>
            )}
            {contrato.estado === 'firmado' && (
              <div className="mt-4">
                <Button variant="ghost" size="md" onClick={() => window.open(`/propuesta/${proyecto.id}`, '_blank')}>
                  Ver PDF
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-text-muted italic">Sin contrato generado</p>
            {puedeEditar && (
              <Button variant="primary" size="md" onClick={() => router.push(`/erp/cotizador/${proyecto.id}`)}>
                Generar Contrato
              </Button>
            )}
          </div>
        )}
      </section>

      {/* FooterAcciones */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="md" onClick={() => router.push('/erp/comercial')}>
          ← Volver al Kanban
        </Button>
        {puedeEditar && (
          <Button variant="primary" size="md" onClick={() => router.push(`/erp/cotizador/${proyecto.id}`)}>
            Abrir Editor
          </Button>
        )}
      </div>
    </div>
  )
}

const FUENTE_REFERENCIAL_LABEL: Record<string, string> = {
  electrodomestico: 'Electrodoméstico',
  obra_civil: 'Obra civil',
  servicio_tercero: 'Servicio tercero',
  otro: 'Otro',
}

/**
 * Contenedor de un "espacio" (nombreEspacio) — puede tener varias variantes
 * alternativas (una activa, REGISTRO_DE_ENTIDADES). Las variantes son tabs
 * DENTRO de esta tarjeta, no tarjetas hermanas — la variante es un branch del
 * espacio, no un espacio distinto (AUDITORÍA 2, hallazgo 1).
 */
function EspacioGroup({
  nombreEspacio,
  variantes,
  expandido,
  onToggle,
  catalogo,
  jornadasMap,
  onUpdateJornadas,
  tarifas,
  proyectoId,
}: {
  nombreEspacio: string
  variantes: EspacioVariante[]
  expandido: boolean
  onToggle: () => void
  catalogo: ProductoCatalogo[]
  jornadasMap: Record<string, { dev: string; ens: string; inst: string }>
  onUpdateJornadas: (espacioId: string, campo: 'dev' | 'ens' | 'inst', valor: string) => void
  tarifas: { tarifaDev: number; tarifaAssembly: number; tarifaInstall: number }
  proyectoId: string
}) {
  const store = useDataStore()
  const varianteActiva = variantes.find((v) => v.activa) ?? variantes[0]
  const [tabId, setTabId] = useState(varianteActiva.id)
  const variante = variantes.find((v) => v.id === tabId) ?? varianteActiva
  const esTabActiva = variante.id === varianteActiva.id

  const [editandoNombre, setEditandoNombre] = useState(false)
  const [nombreTemp, setNombreTemp] = useState(nombreEspacio)
  const [mostrarMenuDuplicar, setMostrarMenuDuplicar] = useState(false)

  // El total del header refleja siempre la variante ACTIVA (la que cuenta),
  // no la que se esté mirando en ese momento — cambiar de tab para comparar
  // no debe mover el número que ve el resto de la pantalla.
  const totalGrupo = store.items.porVariante(varianteActiva.id)
    .filter((it) => !it.esReferencial)
    .reduce((s, it) => s + parseNum(it.totalLinea), 0)

  const guardarNombreGrupo = async () => {
    const valor = nombreTemp.trim()
    if (valor && valor !== nombreEspacio) {
      await Promise.all(variantes.map((v) => store.espacios.actualizar(v.id, { nombreEspacio: valor })))
    }
    setEditandoNombre(false)
  }

  return (
    <div className={`rounded-lg border ${varianteActiva.activa ? 'border-border-subtle' : 'border-border-subtle/50'} bg-bg-raised overflow-hidden`}>
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() } }}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-bg-alt transition-colors duration-fast cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {editandoNombre ? (
            <input
              type="text"
              autoFocus
              value={nombreTemp}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setNombreTemp(e.target.value)}
              onBlur={guardarNombreGrupo}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); guardarNombreGrupo() }
                if (e.key === 'Escape') { setNombreTemp(nombreEspacio); setEditandoNombre(false) }
              }}
              className="rounded border border-gold-400 bg-bg-paper px-2 py-0.5 font-medium text-text-heading focus:outline-none"
              aria-label="Nombre del espacio"
            />
          ) : (
            <span className="font-medium text-text-heading flex items-center gap-1.5">
              {nombreEspacio}
              <span
                onClick={(e) => { e.stopPropagation(); setNombreTemp(nombreEspacio); setEditandoNombre(true) }}
                className="p-0.5 rounded text-text-muted hover:text-gold-600 hover:bg-bg-alt transition-colors duration-fast cursor-pointer"
                aria-label={`Renombrar ${nombreEspacio}`}
                title="Renombrar espacio (aplica a todas sus variantes)"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M11.5 2.5l2 2L5 13l-2.5.5.5-2.5 8.5-8.5z" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
              </span>
            </span>
          )}
          <select
            value={varianteActiva.tipoEspacio ?? ''}
            onClick={(e) => e.stopPropagation()}
            onChange={async (e) => {
              const valor = e.target.value || null
              await Promise.all(variantes.map((v) => store.espacios.actualizar(v.id, { tipoEspacio: valor })))
            }}
            className="rounded border border-border-subtle bg-bg-paper px-1.5 py-0.5 text-[11px] text-text-muted hover:text-text-heading focus:border-gold-400 focus:outline-none transition-colors duration-fast"
            aria-label={`Tipo de espacio de ${nombreEspacio}`}
            title="Tipo de espacio — lo hereda Portafolio al publicar"
          >
            <option value="">Sin tipo</option>
            {TIPOS_ESPACIO.map((t) => (
              <option key={t.codigo} value={t.codigo}>{t.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={async (e) => { e.stopPropagation(); await store.espacios.actualizar(variante.id, { visibleEnPropuestaPublica: !variante.visibleEnPropuestaPublica }) }}
            className="p-0.5 rounded text-text-muted hover:text-gold-600 hover:bg-bg-alt transition-colors duration-fast"
            aria-label={variante.visibleEnPropuestaPublica ? 'Ocultar de la propuesta pública' : 'Mostrar en la propuesta pública'}
            title={variante.visibleEnPropuestaPublica ? 'Visible en la propuesta pública (PDF + pantalla pública) — clic para ocultar' : 'Oculto de la propuesta pública — clic para mostrar'}
          >
            {variante.visibleEnPropuestaPublica ? (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
                <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" strokeLinejoin="round" />
                <circle cx="8" cy="8" r="2" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
                <path d="M2 2l12 12M6.5 6.7A2 2 0 0 0 8 10a2 2 0 0 0 1.4-.6M4 4.2C2.4 5.3 1 8 1 8s2.5 5 7 5c1.3 0 2.4-.4 3.4-1M13 11.8C14.2 10.7 15 8 15 8s-.9-1.9-2.5-3.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMostrarMenuDuplicar((v) => !v) }}
              className="p-0.5 rounded text-text-muted hover:text-gold-600 hover:bg-bg-alt transition-colors duration-fast"
              aria-label={`Duplicar ${variante.nombreVariante}`}
              title="Duplicar variante"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="5" y="5" width="9" height="9" rx="1" />
                <path d="M11 5V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h2" />
              </svg>
            </button>
            {mostrarMenuDuplicar && (
              <div
                className="absolute left-0 top-full z-10 mt-1 w-44 rounded border border-border-subtle bg-bg-raised shadow-md py-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={async () => {
                    const nueva = await store.espacios.duplicar(variante.id, { vacio: false })
                    if (nueva) setTabId(nueva.id)
                    setMostrarMenuDuplicar(false)
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-text-heading hover:bg-bg-alt"
                >
                  Variante clonada
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const nueva = await store.espacios.duplicar(variante.id, { vacio: true })
                    if (nueva) setTabId(nueva.id)
                    setMostrarMenuDuplicar(false)
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-text-heading hover:bg-bg-alt"
                >
                  Variante vacía
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-text-heading">{formatCOP(totalGrupo)}</span>
          <span className={`text-sm transition-transform duration-fast ${expandido ? 'rotate-180' : ''}`}>&#9660;</span>
        </div>
      </div>

      {expandido && (
        <>
          {variantes.length > 1 && (
            <div className="flex items-center gap-1 border-t border-border-subtle bg-bg-alt/40 px-4 pt-2 overflow-x-auto">
              {variantes.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setTabId(v.id)}
                  className={`flex items-center gap-1.5 rounded-t px-3 py-1.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors duration-fast ${
                    v.id === tabId
                      ? 'border-gold-500 text-text-heading bg-bg-raised'
                      : 'border-transparent text-text-muted hover:text-text-heading'
                  }`}
                >
                  {v.activa && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Variante activa" />}
                  {v.nombreVariante}
                </button>
              ))}
            </div>
          )}

          {!esTabActiva && (
            <div className="flex items-center justify-between gap-3 bg-gold-100/80 px-4 py-2 text-xs text-gold-700 border-t border-border-subtle">
              <span>Estás viendo una variante de comparación — no cuenta para el total ni el contrato.</span>
              <button
                type="button"
                onClick={async () => await store.espacios.marcarActiva(variante.id)}
                className="font-medium underline hover:no-underline flex-shrink-0"
              >
                Marcar como activa
              </button>
            </div>
          )}

          <VarianteContenido
            espacio={variante}
            catalogo={catalogo}
            jornadas={jornadasMap[variante.id] ?? { dev: '0', ens: '0', inst: '0' }}
            onUpdateJornadas={onUpdateJornadas}
            tarifas={tarifas}
            proyectoId={proyectoId}
          />
        </>
      )}
    </div>
  )
}

/**
 * Contenido de UNA variante (la seleccionada en las tabs del EspacioGroup).
 * Sin borde/collapse propio — ese lo maneja el contenedor.
 */
function VarianteContenido({
  espacio,
  catalogo,
  jornadas,
  onUpdateJornadas,
  tarifas,
  proyectoId,
}: {
  espacio: EspacioVariante
  catalogo: ProductoCatalogo[]
  jornadas: { dev: string; ens: string; inst: string }
  onUpdateJornadas: (espacioId: string, campo: 'dev' | 'ens' | 'inst', valor: string) => void
  tarifas: { tarifaDev: number; tarifaAssembly: number; tarifaInstall: number }
  proyectoId: string
}) {
  const store = useDataStore()
  const items = store.items.porVariante(espacio.id)
  const itemsContractuales = items.filter((it) => !it.esReferencial)
  const itemsReferenciales = items.filter((it) => it.esReferencial)
  const subtotalItems = itemsContractuales.reduce((s, it) => s + parseNum(it.totalLinea), 0)
  const totalReferencial = itemsReferenciales.reduce((s, it) => s + parseNum(it.totalLinea), 0)
  const productMap = new Map(catalogo.map((p) => [p.id, p]))

  const [mostrarFormArtefacto, setMostrarFormArtefacto] = useState(false)
  const [editarArtefactoId, setEditarArtefactoId] = useState<string | null>(null)
  const [modoBusquedaItem, setModoBusquedaItem] = useState<'off' | 'normal' | 'referencial'>('off')
  const [mostrarDetalles, setMostrarDetalles] = useState(false)
  const [modalItemId, setModalItemId] = useState<string | null>(null)
  const artefactosList = store.artefactos.porEspacio(espacio.id)
  const { guard: guardCrearItem, isPending: creandoItem } = usePendingGuard()
  const { guard: guardCrearItemReferencial, isPending: creandoItemReferencial } = usePendingGuard()

  const modalItem = modalItemId ? items.find((i) => i.id === modalItemId) : undefined
  const modalProd = modalItem?.catalogoId ? productMap.get(modalItem.catalogoId) : undefined

  const moDev = parseNum(jornadas.dev) * tarifas.tarifaDev
  const moEns = parseNum(jornadas.ens) * tarifas.tarifaAssembly
  const moInst = parseNum(jornadas.inst) * tarifas.tarifaInstall
  const moSubtotal = moDev + moEns + moInst

  const actualizarItem = async (id: string, field: keyof Pick<ItemVariante, 'cantidad' | 'precioUnitario' | 'nombrePersonalizado' | 'esReferencial' | 'fuenteReferencial' | 'grupoReferencial'>, value: string | boolean) => {
    await store.items.actualizar(id, { [field]: value } as Partial<Pick<ItemVariante, 'cantidad' | 'precioUnitario' | 'nombrePersonalizado' | 'esReferencial' | 'fuenteReferencial' | 'grupoReferencial'>>)
  }

  return (
    <div className="border-t border-border-subtle px-4 py-3 space-y-3">
      {espacio.descripcion && (
        <p className="text-sm text-text-muted italic">{espacio.descripcion}</p>
      )}

      {/* Items (Tabla) — solo el objeto de contrato real; los referenciales viven abajo, en su propia zona */}
      <div className="border-t border-border-subtle pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Ítems</p>
          <Button
            variant="ghost"
            size="md"
            onClick={() => setModoBusquedaItem('normal')}
            aria-label="Buscar en catálogo"
          >
            + Buscar
          </Button>
        </div>

        {itemsContractuales.length === 0 && modoBusquedaItem !== 'normal' && (
          <p className="text-sm text-text-muted py-2 italic">Sin ítems en esta variante.</p>
        )}

        {modoBusquedaItem === 'normal' && (
          <div className="mb-3">
            <SmartSearch
              items={catalogo.map(p => ({ id: p.id, sku: p.sku, descripcion: p.descripcion, tipo: p.tipo, precioPublico: p.precioPublico, precioDirecto: p.precioDirecto, categoriaComercial: p.categoriaComercial }))}
              onSelect={(producto) => guardCrearItem(async () => {
                await store.items.crear({
                  varianteId: espacio.id,
                  catalogoId: producto.id,
                  cantidad: '1',
                  precioUnitario: producto.precioPublico ?? '0',
                  nombrePersonalizado: null,
                })
                setModoBusquedaItem('off')
              })}
              onCreateNew={() => { window.location.href = `/erp/catalogo?source=cotizador&proyectoId=${proyectoId}`; setModoBusquedaItem('off') }}
              placeholder="Buscar en catálogo..."
              label="Producto"
              allowCreate
              contexto="cotizador-items"
            />
            {creandoItem && <p className="mt-1 text-xs text-text-muted">Agregando ítem...</p>}
            <Button variant="ghost" size="md" onClick={() => setModoBusquedaItem('off')} className="mt-2" disabled={creandoItem}>
              Cancelar
            </Button>
          </div>
        )}

        {itemsContractuales.map((item) => {
          const prod = item.catalogoId ? productMap.get(item.catalogoId) : undefined
          const cantidadNum = parseNum(item.cantidad)
          const precioNum = parseNum(item.precioUnitario)
          const total = cantidadNum * precioNum
          return (
            <div key={item.id} className="flex items-center justify-between text-sm border-b border-border-subtle/50 pb-2 last:pb-0 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <ItemMiniatura producto={prod} onClick={() => setModalItemId(item.id)} />
                  <span className="text-text-heading">
                    {item.nombrePersonalizado ?? prod?.descripcion ?? 'Ítem sin catálogo'}
                  </span>
                  {prod && (
                    <span className="text-xs text-text-muted font-mono">{prod.sku}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <NumberInput
                  value={item.cantidad}
                  onChange={(v) => actualizarItem(item.id, 'cantidad', v)}
                  step={0.1}
                  min={0}
                  label=""
                  className="w-20"
                  aria-label={`Cantidad ${prod?.descripcion ?? item.id}`}
                />
                <MoneyInput
                  value={item.precioUnitario}
                  onChange={(v) => actualizarItem(item.id, 'precioUnitario', v)}
                  label=""
                  className="w-28"
                  aria-label={`Precio ${prod?.descripcion ?? item.id}`}
                />
                <span className="font-mono text-sm font-medium text-text-heading w-24 text-right">
                  {formatCOP(total)}
                </span>
                <button
                  type="button"
                  onClick={() => actualizarItem(item.id, 'esReferencial', true)}
                  aria-label="Mover a Presupuesto Adicional (referencial)"
                  title="Mover a Presupuesto Adicional — inversión estimada, no cotizada"
                  className="p-1 text-text-muted hover:text-gold-600 transition-colors duration-fast"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 1.5v13M3 1.5h9l-2 3.25 2 3.25H3" strokeLinejoin="round" strokeLinecap="round" />
                  </svg>
                </button>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={async () => await store.items.eliminar(item.id)}
                  aria-label="Anular ítem"
                  className="text-text-muted hover:text-red-500"
                >
                  ×
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Presupuesto Adicional (Referenciales) — D-09b: reubicado justo debajo de Ítems (2026-08-10, decisión
          Javier) porque leerlo tras el Subtotal se sentía desconectado de la lista. La distancia ya no es la
          señal de "no cuenta"; el borde punteado ámbar + el subtítulo explícito de abajo cumplen ese rol ahora. */}
      <div className="border-t-2 border-dashed border-gold-300 pt-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">Presupuesto Adicional (Referenciales)</p>
            <p className="text-[11px] text-text-muted">No suma al Subtotal Espacio ni al contrato — estimado informativo.</p>
          </div>
          <Button
            variant="ghost"
            size="md"
            onClick={() => setModoBusquedaItem('referencial')}
            aria-label="Añadir ítem referencial"
            title="Presupuesto adicional estimado (ej. obra civil) — no suma al contrato"
          >
            + Ítem ref
          </Button>
        </div>

        {modoBusquedaItem === 'referencial' && (
          <div className="mb-3">
            <SmartSearch
              items={catalogo.map(p => ({ id: p.id, sku: p.sku, descripcion: p.descripcion, tipo: p.tipo, precioPublico: p.precioPublico, precioDirecto: p.precioDirecto, categoriaComercial: p.categoriaComercial }))}
              onSelect={(producto) => guardCrearItemReferencial(async () => {
                await store.items.crear({
                  varianteId: espacio.id,
                  catalogoId: producto.id,
                  cantidad: '1',
                  precioUnitario: producto.precioPublico ?? '0',
                  nombrePersonalizado: null,
                  esReferencial: true,
                })
                setModoBusquedaItem('off')
              })}
              onCreateNew={() => { window.location.href = `/erp/catalogo?source=cotizador&proyectoId=${proyectoId}`; setModoBusquedaItem('off') }}
              placeholder="Buscar en catálogo..."
              label="Producto"
              allowCreate
              contexto="cotizador-items"
            />
            {creandoItemReferencial && <p className="mt-1 text-xs text-text-muted">Agregando ítem...</p>}
            <Button variant="ghost" size="md" onClick={() => setModoBusquedaItem('off')} className="mt-2" disabled={creandoItemReferencial}>
              Cancelar
            </Button>
          </div>
        )}

        {itemsReferenciales.length === 0 && modoBusquedaItem !== 'referencial' ? (
          <p className="text-xs text-text-muted italic py-1">Sin ítems referenciales.</p>
        ) : (
          <>
            {itemsReferenciales.map((item) => {
              const prod = item.catalogoId ? productMap.get(item.catalogoId) : undefined
              const total = parseNum(item.cantidad) * parseNum(item.precioUnitario)
              return (
                <div key={item.id} className="text-sm border-b border-border-subtle/50 pb-2 last:pb-0 last:border-0 pt-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <ItemMiniatura producto={prod} onClick={() => setModalItemId(item.id)} />
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-500 flex-shrink-0" title="Referencial" />
                      <span className="text-text-heading truncate">
                        {item.nombrePersonalizado ?? prod?.descripcion ?? 'Ítem sin catálogo'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <NumberInput
                        value={item.cantidad}
                        onChange={(v) => actualizarItem(item.id, 'cantidad', v)}
                        step={0.1}
                        min={0}
                        label=""
                        className="w-20"
                        aria-label={`Cantidad ${prod?.descripcion ?? item.id}`}
                      />
                      <MoneyInput
                        value={item.precioUnitario}
                        onChange={(v) => actualizarItem(item.id, 'precioUnitario', v)}
                        label=""
                        className="w-28"
                        aria-label={`Precio ${prod?.descripcion ?? item.id}`}
                      />
                      <span className="font-mono text-sm font-medium text-text-heading w-24 text-right">
                        {formatCOP(total)}
                      </span>
                      <button
                        type="button"
                        onClick={() => actualizarItem(item.id, 'esReferencial', false)}
                        aria-label="Mover a Ítems (cotizado)"
                        title="Mover a Ítems — pasa a ser objeto de contrato"
                        className="p-1 text-text-muted hover:text-emerald-600 transition-colors duration-fast"
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M13 1.5v13M13 1.5H4l2 3.25-2 3.25h9" strokeLinejoin="round" strokeLinecap="round" />
                        </svg>
                      </button>
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={async () => await store.items.eliminar(item.id)}
                        aria-label="Eliminar ítem referencial"
                        className="text-text-muted hover:text-red-500"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1 pl-3.5">
                    <select
                      value={item.fuenteReferencial ?? ''}
                      onChange={(e) => actualizarItem(item.id, 'fuenteReferencial', e.target.value)}
                      className="rounded border border-border-subtle bg-bg-paper px-1.5 py-0.5 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
                      aria-label="Fuente del ítem referencial"
                    >
                      <option value="">Fuente…</option>
                      {Object.entries(FUENTE_REFERENCIAL_LABEL).map(([valor, label]) => (
                        <option key={valor} value={valor}>{label}</option>
                      ))}
                    </select>
                    <GrupoReferencialInput
                      value={item.grupoReferencial ?? ''}
                      onChange={(v) => actualizarItem(item.id, 'grupoReferencial', v)}
                    />
                  </div>
                </div>
              )
            })}
            <div className="flex justify-between text-sm font-semibold mt-2 border-t border-border-subtle pt-2">
              <span className="text-text-heading">Total Referencial</span>
              <span className="font-mono text-gold-600">{formatCOP(totalReferencial)}</span>
            </div>
            <p className="text-[11px] text-text-muted italic mt-1">No incluido en el contrato — inversión estimada informativa para el cliente.</p>
          </>
        )}
      </div>

      {/* Subtotal Espacio (Materiales + MO) */}
      <div className="border-t border-border-subtle pt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">Subtotal Espacio</p>
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Materiales</span>
          <span className="font-mono text-text-heading">{formatCOP(subtotalItems)}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-text-muted">Mano de Obra</span>
          <span className="font-mono text-text-heading">{formatCOP(moSubtotal)}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold mt-1 border-t border-border-subtle pt-2">
          <span className="text-text-heading">Total Espacio</span>
          <span className="font-mono text-text-heading">{formatCOP(subtotalItems + moSubtotal)}</span>
        </div>
      </div>

      {/* Detalles técnicos del espacio — preview con miniatura + specs no redundantes, editar vía ícono (no un "+ Editar" escondido) */}
      <div className="border-t border-border-subtle pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Detalles del espacio</p>
          {mostrarDetalles && (
            <button
              type="button"
              onClick={() => setMostrarDetalles(false)}
              className="text-xs text-text-muted hover:text-text-heading transition-colors duration-fast"
            >
              Cerrar
            </button>
          )}
        </div>

        {!mostrarDetalles && (
          <button
            type="button"
            onClick={() => setMostrarDetalles(true)}
            className="w-full flex items-center gap-3 py-1 text-left hover:bg-bg-alt/50 rounded transition-colors duration-fast"
          >
            {(espacio.fotosEspacio[0] ?? espacio.fotosDisenio[0]) ? (
              // eslint-disable-next-line @next/next/no-img-element -- URLs mock/blob:, no assets estáticos optimizables
              <img src={espacio.fotosEspacio[0] ?? espacio.fotosDisenio[0]} alt="" className="w-10 h-10 rounded object-cover border border-border-subtle flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded border border-dashed border-border-subtle flex-shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs text-text-muted truncate">{espacio.descripcion || '(sin descripción)'}</p>
              {(espacio.colores as string[]).length > 0 && (
                <p className="text-[11px] text-text-muted truncate">{(espacio.colores as string[]).join(', ')}</p>
              )}
            </div>
            <span
              className="p-1 rounded text-text-muted hover:text-gold-600 flex-shrink-0"
              aria-label="Editar detalles del espacio"
              title="Editar detalles del espacio"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M11.5 2.5l2 2L5 13l-2.5.5.5-2.5 8.5-8.5z" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
            </span>
          </button>
        )}

        {mostrarDetalles && (
          <FormDetallesEspacio
            espacio={espacio}
            onGuardado={() => setMostrarDetalles(false)}
            onCancelar={() => setMostrarDetalles(false)}
          />
        )}
      </div>

      {/* Artefactos del espacio */}
      <div className="border-t border-border-subtle pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Artefactos del espacio</p>
          <button
            type="button"
            onClick={() => { setMostrarFormArtefacto(!mostrarFormArtefacto); setEditarArtefactoId(null) }}
            className="text-xs text-gold-600 hover:text-gold-700 transition-colors duration-fast"
          >
            {mostrarFormArtefacto ? 'Cancelar' : '+ Artefacto'}
          </button>
        </div>

        {mostrarFormArtefacto && (
          <FormArtefacto
            espacioId={espacio.id}
            onGuardado={() => setMostrarFormArtefacto(false)}
            onCancelar={() => setMostrarFormArtefacto(false)}
          />
        )}

        {artefactosList.length === 0 && !mostrarFormArtefacto && (
          <p className="text-xs text-text-muted italic py-1">Sin artefactos registrados.</p>
        )}

        {artefactosList.map((artefacto) => {
          const editando = editarArtefactoId === artefacto.id
          return (
            <div key={artefacto.id} className="border-b border-border-subtle/50 pb-2 last:pb-0 last:border-0">
              {editando ? (
                <FormArtefactoEdicion
                  artefacto={artefacto}
                  onGuardado={() => setEditarArtefactoId(null)}
                  onCancelar={() => setEditarArtefactoId(null)}
                />
              ) : (
                <div
                  className="flex items-start justify-between text-sm cursor-pointer hover:bg-bg-alt/50 rounded px-2 py-1 -mx-2 transition-colors duration-fast"
                  onClick={() => setEditarArtefactoId(artefacto.id)}
                  title="Clic para editar"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge tone={
                      artefacto.categoria === 'determinante' ? 'info' :
                      artefacto.categoria === 'bloqueante' ? 'danger' :
                      artefacto.categoria === 'electrodomestico' ? 'warning' :
                      'neutral'
                    }>
                      {artefacto.categoria === 'determinante' ? 'Determinante' :
                       artefacto.categoria === 'bloqueante' ? 'Bloqueante' :
                       artefacto.categoria === 'electrodomestico' ? 'Electrodom.' :
                       artefacto.categoria === 'obra_civil' ? 'Obra civil' :
                       'Serv. tercero'}
                    </Badge>
                    <span className="text-text-heading truncate">
                      {artefacto.tipoSpecifique || '(sin descripción)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {artefacto.ubicacion && (
                      <span className="text-xs text-text-muted">{artefacto.ubicacion}</span>
                    )}
                    {artefacto.dimensionesMm && (
                      <span className="text-xs text-text-muted font-mono">{artefacto.dimensionesMm}</span>
                    )}
                    {artefacto.requiereVerificacion ? (
                      <Badge tone="warning">Pendiente</Badge>
                    ) : (
                      <Badge tone="info">Validado</Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="border-t border-border-subtle pt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">Jornadas de Mano de Obra</p>
        <div className="grid grid-cols-3 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-text-muted">Desarrollo</span>
            <input
              type="number"
              step="0.5"
              min="0"
              className="w-20 rounded border border-border-subtle bg-bg-paper px-2 py-1 font-mono text-xs text-text-heading focus:border-gold-400 focus:outline-none"
              value={jornadas.dev}
              onChange={(e) => onUpdateJornadas(espacio.id, 'dev', e.target.value)}
              aria-label={`Jornadas desarrollo ${espacio.nombreEspacio}`}
              inputMode="decimal"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-text-muted">Ensamblaje</span>
            <input
              type="number"
              step="0.5"
              min="0"
              className="w-20 rounded border border-border-subtle bg-bg-paper px-2 py-1 font-mono text-xs text-text-heading focus:border-gold-400 focus:outline-none"
              value={jornadas.ens}
              onChange={(e) => onUpdateJornadas(espacio.id, 'ens', e.target.value)}
              aria-label={`Jornadas ensamblaje ${espacio.nombreEspacio}`}
              inputMode="decimal"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-text-muted">Instalación</span>
            <input
              type="number"
              step="0.5"
              min="0"
              className="w-20 rounded border border-border-subtle bg-bg-paper px-2 py-1 font-mono text-xs text-text-heading focus:border-gold-400 focus:outline-none"
              value={jornadas.inst}
              onChange={(e) => onUpdateJornadas(espacio.id, 'inst', e.target.value)}
              aria-label={`Jornadas instalación ${espacio.nombreEspacio}`}
              inputMode="decimal"
            />
          </label>
        </div>
          <div className="mt-2 flex justify-between items-center border-t border-border-subtle pt-2">
            <span className="text-[11px] text-text-muted">Total MO (jornadas × tarifa):</span>
            <span className="font-mono text-xs font-medium text-brand">{formatCOP(moSubtotal)}</span>
          </div>
        </div>

      {modalProd && (
        <ItemDescriptorModal producto={modalProd} onClose={() => setModalItemId(null)} />
      )}
    </div>
  )
}

function FormArtefacto({
  espacioId,
  onGuardado,
  onCancelar,
}: {
  espacioId: string
  onGuardado: () => void
  onCancelar: () => void
}) {
  const store = useDataStore()
  const [categoria, setCategoria] = useState<EspacioArtefacto['categoria']>('determinante')
  const [tipo, setTipo] = useState('')
  const [dimensiones, setDimensiones] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [fotoUrl, setFotoUrl] = useState<string[]>([])
  const { guard: guardCrearArtefacto, isPending: creandoArtefacto } = usePendingGuard()

  const handleGuardar = useCallback(async () => {
    if (!tipo.trim()) return
    await store.artefactos.crear({
      espacioVarianteId: espacioId,
      categoria,
      tipoSpecifique: tipo.trim(),
      dimensionesMm: dimensiones.trim() || null,
      ubicacion: ubicacion.trim() || null,
      fotoUrl: fotoUrl[0] ?? null,
    })
    onGuardado()
  }, [espacioId, categoria, tipo, dimensiones, ubicacion, fotoUrl, store, onGuardado])

  return (
    <div className="space-y-2 rounded border border-border-subtle bg-bg-paper p-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-text-muted">Categoría</span>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as EspacioArtefacto['categoria'])}
            className="rounded border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
          >
            <option value="determinante">Determinante</option>
            <option value="electrodomestico">Electrodoméstico</option>
            <option value="bloqueante">Bloqueante</option>
            <option value="obra_civil">Obra civil</option>
            <option value="servicio_tercero">Servicio tercero</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-text-muted">Nombre / Modelo*</span>
          <input
            type="text"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="rounded border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
            placeholder="Ej. Impresora 4×4"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-text-muted">Dimensiones (mm)</span>
          <input
            type="text"
            value={dimensiones}
            onChange={(e) => setDimensiones(e.target.value)}
            className="rounded border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
            placeholder="400×400×300"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-text-muted">Ubicación</span>
          <input
            type="text"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            className="rounded border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
            placeholder="Isla central"
          />
        </label>
      </div>
      <ImagePicker label="Foto (opcional)" value={fotoUrl} onChange={setFotoUrl} multiple={false} />
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => guardCrearArtefacto(handleGuardar)}
          disabled={creandoArtefacto}
          className="rounded bg-gold-500 px-3 py-1 text-xs font-medium text-white hover:bg-gold-600 transition-colors duration-fast disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {creandoArtefacto ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="rounded border border-border-subtle px-3 py-1 text-xs text-text-muted hover:bg-bg-alt transition-colors duration-fast"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

function FormArtefactoEdicion({
  artefacto,
  onGuardado,
  onCancelar,
}: {
  artefacto: EspacioArtefacto
  onGuardado: () => void
  onCancelar: () => void
}) {
  const store = useDataStore()
  const [dimensiones, setDimensiones] = useState(artefacto.dimensionesMm ?? '')
  const [tipo, setTipo] = useState(artefacto.tipoSpecifique ?? '')
  const [ubicacion, setUbicacion] = useState(artefacto.ubicacion ?? '')
  const [fotoUrl, setFotoUrl] = useState<string[]>(artefacto.fotoUrl ? [artefacto.fotoUrl] : [])

  const handleGuardar = useCallback(async () => {
    await store.artefactos.actualizar(artefacto.id, {
      tipoSpecifique: tipo.trim() || null,
      dimensionesMm: dimensiones.trim() || null,
      ubicacion: ubicacion.trim() || null,
      fotoUrl: fotoUrl[0] ?? null,
    })
    onGuardado()
  }, [store, artefacto.id, tipo, dimensiones, ubicacion, fotoUrl, onGuardado])

  return (
    <div className="space-y-2 rounded border border-border-subtle bg-bg-paper p-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-text-muted">Nombre / Modelo</span>
          <input
            type="text"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="rounded border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-text-muted">Dimensiones (mm)</span>
          <input
            type="text"
            value={dimensiones}
            onChange={(e) => setDimensiones(e.target.value)}
            className="rounded border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-text-muted">Ubicación</span>
          <input
            type="text"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            className="rounded border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none"
          />
        </label>
      </div>
      <ImagePicker label="Foto" value={fotoUrl} onChange={setFotoUrl} multiple={false} />
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleGuardar}
          className="rounded bg-gold-500 px-3 py-1 text-xs font-medium text-white hover:bg-gold-600 transition-colors duration-fast"
        >
          Actualizar
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="rounded border border-border-subtle px-3 py-1 text-xs text-text-muted hover:bg-bg-alt transition-colors duration-fast"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

function FormDetallesEspacio({
  espacio,
  onGuardado,
  onCancelar,
}: {
  espacio: EspacioVariante
  onGuardado: () => void
  onCancelar: () => void
}) {
  const store = useDataStore()
  const [nombreEspacio, setNombreEspacio] = useState(espacio.nombreEspacio)
  const [nombreVariante, setNombreVariante] = useState(espacio.nombreVariante)
  const [descripcion, setDescripcion] = useState(espacio.descripcion ?? '')
  const [colores, setColores] = useState((espacio.colores as string[]).join(', '))
  const [fotosEspacio, setFotosEspacio] = useState<string[]>(espacio.fotosEspacio)
  const [fotosDisenio, setFotosDisenio] = useState<string[]>(espacio.fotosDisenio)
  const [fotosReferencia, setFotosReferencia] = useState<string[]>(espacio.fotosReferencia)

  const dividir = (texto: string): string[] => texto.split(',').map(s => s.trim()).filter(Boolean)

  const handleGuardar = useCallback(async () => {
    await store.espacios.actualizar(espacio.id, {
      nombreEspacio: nombreEspacio.trim(),
      nombreVariante: nombreVariante.trim(),
      descripcion: descripcion.trim() || null,
      colores: dividir(colores),
      fotosEspacio,
      fotosDisenio,
      fotosReferencia,
    })
    onGuardado()
  }, [store, espacio.id, nombreEspacio, nombreVariante, descripcion, colores, fotosEspacio, fotosDisenio, fotosReferencia, onGuardado])

  const inputCls = 'rounded border border-border-subtle bg-bg-paper px-2 py-1 text-xs text-text-heading focus:border-gold-400 focus:outline-none'
  const ayudaCls = 'text-[11px] text-text-muted'

  return (
    <div className="space-y-3 rounded border border-border-subtle bg-bg-paper p-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-text-muted">Nombre del espacio</span>
          <input type="text" value={nombreEspacio} onChange={(e) => setNombreEspacio(e.target.value)} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-text-muted">Variante</span>
          <input type="text" value={nombreVariante} onChange={(e) => setNombreVariante(e.target.value)} className={inputCls} />
        </label>
      </div>

      {/* Selector de imágenes — arriba, con miniaturas (pedido de auditoría: más visible que un campo de texto al final) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ImagePicker label="Fotos del espacio" value={fotosEspacio} onChange={setFotosEspacio} />
        <ImagePicker label="Fotos de diseño" value={fotosDisenio} onChange={setFotosDisenio} />
        <ImagePicker label="Fotos de referencia" value={fotosReferencia} onChange={setFotosReferencia} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 col-span-2">
          <span className="text-[11px] text-text-muted">Descripción</span>
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} className={inputCls} />
        </label>
      </div>

      <p className={ayudaCls}>
        La variante activa se controla desde el header del espacio, junto al ícono de ojo y el tab con punto verde.
      </p>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] text-text-muted">Colores (separados por coma)</span>
        <input type="text" value={colores} onChange={(e) => setColores(e.target.value)} className={inputCls} placeholder="Ej: Roble natural, Blanco" />
      </label>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleGuardar}
          className="rounded bg-gold-500 px-3 py-1 text-xs font-medium text-white hover:bg-gold-600 transition-colors duration-fast"
        >
          Guardar detalles
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="rounded border border-border-subtle px-3 py-1 text-xs text-text-muted hover:bg-bg-alt transition-colors duration-fast"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
