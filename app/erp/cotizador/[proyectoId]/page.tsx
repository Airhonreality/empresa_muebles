'use client'

import { useState, useMemo, useCallback, useEffect, memo } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { MoneyInput } from '@/components/veta/money-input'
import { NumberInput } from '@/components/veta/number-input'
import { SmartSearch } from '@/components/veta/smart-search'
import { ImagePicker } from '@/components/veta/image-picker'
import { ItemMiniatura } from '@/components/veta/item-miniatura'
import { ItemEditorModal } from '@/components/veta/item-editor-modal'
import { AcabadoPicker, type AcabadoItem } from '@/components/veta/acabado-picker'
import { Modal } from '@/components/veta/modal'
import { PRESETS_ESPACIOS, type PresetEspacio } from '@/lib/catalogos/presets-espacios'
import { ContratoModal } from '../ContratoModal'
import { EditarProyectoModal } from '@/components/veta/editar-proyecto-modal'
import { ModalPresentador } from '@/components/veta/ModalPresentador'
import { useDataStore, generarSlides, type DataStore, type ProductoCatalogo, type ItemVariante, type EspacioVariante, type EspacioArtefacto } from '@/lib/data'
import { useSelectPorVariante } from '@/lib/data/stores/selectors'
import { useCotizadorStore } from '@/lib/data/stores/useCotizadorStore'
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
    tarifaDev: hora('desarrollador'),
    tarifaAssembly: hora('carpintero'),
    tarifaInstall: hora('auxiliar'),
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
  const [mostrarPlantillasModal, setMostrarPlantillasModal] = useState(false)
  const [modalPresentacionAbierto, setModalPresentacionAbierto] = useState(false)
  const [nuevoEspacioNombre, setNuevoEspacioNombre] = useState('')
  const [nuevoEspacioTipo, setNuevoEspacioTipo] = useState('')
  const { guard: guardCrearEspacio, isPending: creandoEspacio } = usePendingGuard()

  const aplicarPreset = useCallback(async (preset: PresetEspacio) => {
    setMostrarPlantillasModal(false)
    await guardCrearEspacio(async () => {
      const nuevoEspacio = await store.espacios.crear({
        proyectoId,
        nombreEspacio: preset.nombre,
        nombreVariante: 'Inicial',
        tipoEspacio: preset.tipoEspacio,
        descripcion: preset.descripcion,
        visibleEnPropuestaPublica: true,
        orden: espaciosBase.length + 1,
        jornadasDesarrolloTecnico: preset.jornadas.dev,
        jornadasEnsamblajeTaller: preset.jornadas.ens,
        jornadasInstalacionObra: preset.jornadas.inst,
      })

      if (nuevoEspacio) {
        await Promise.all(
          preset.items.map((it) =>
            store.items.crear({
              varianteId: nuevoEspacio.id,
              catalogoId: null,
              nombrePersonalizado: it.nombre,
              cantidad: it.cantidad,
              precioUnitario: it.precioUnitario,
              esReferencial: it.esReferencial ?? false,
            })
          )
        )
      }
    })
  }, [guardCrearEspacio, store.espacios, store.items, proyectoId, espaciosBase.length])

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
      // El updater de setState debe ser puro (sin side-effects); calculamos el
      // nuevo valor con el estado del closure (dependencia [jornadasMap]) y la
      // escritura real al DataStore corre FUERA del updater — así no se dispara
      // "Cannot update X while rendering Y" por el notify() del Server Action.
      const current = jornadasMap[espacioId] ?? { dev: '0', ens: '0', inst: '0' }
      const nuevo = { ...current, [campo]: valor }
      setJornadasMap((prev) => ({ ...prev, [espacioId]: nuevo }))
      store.espacios
        .actualizarJornadas(espacioId, {
          jornadasDesarrolloTecnico: nuevo.dev,
          jornadasEnsamblajeTaller: nuevo.ens,
          jornadasInstalacionObra: nuevo.inst,
        })
        .catch((err) => console.error('No se pudo guardar jornadas', err))
    },
    [store, jornadasMap],
  )

  if (!proyecto) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-text-muted">Proyecto no encontrado</p>
        <p className="text-xs font-mono mt-2">{proyectoId}</p>
    </div>
  )
}

// P7 (ZN-003): envoltura memoizada. Como EspacioGroup es una función declarada, se usa a
// través de `EspacioGroupMemo` para que una modificación en una variante/espacio NO re-renderice
// a los hermanos (además de la suscripción granular por-versión que ya aporta useSelectPorVariante
// en la Fase 1). Los callbacks (onToggle, onUpdateJornadas), tarifas y catalogo son estables
// (useCallback/useMemo), condición necesaria para que el shallow-compare de `memo` no se invalide
// en cada render del padre. `VarianteContenido` no se memoiza: su re-render granular por variante
// ya lo cubre el selector don-de vive bajo EspacioGroupMemo.
const EspacioGroupMemo = memo(EspacioGroup)


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
      <header className="sticky top-0 z-10 bg-bg-raised px-4 py-3 sm:py-2 border-b border-border-subtle shadow-sm">
        <div className="flex items-center justify-between gap-x-4">
          {/* Proyecto + cliente + estado */}
          <div className="min-w-0 flex flex-1 items-center gap-3">
            <h1 className="font-display text-lg sm:text-base font-semibold text-text-heading truncate" title={proyecto.nombreProyecto}>
              {proyecto.nombreProyecto}
            </h1>
            {cliente && (
              <span className="hidden sm:inline text-xs text-text-muted truncate">· {cliente.nombre}</span>
            )}
            <Badge tone={proyecto.estado === 'activa' ? 'info' : proyecto.estado === 'produccion' ? 'danger' : 'warning'} dot>
              {proyecto.estado}
            </Badge>
          </div>

          {/* Acciones de escritorio (ocultas en móvil) */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            {/* Garantía */}
            <label className="flex items-center gap-1.5 shrink-0 mr-2">
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
              />
              <span className="text-xs text-text-muted">años</span>
            </label>

            {/* IVA */}
            <div className="flex items-center gap-1.5 shrink-0 mr-2">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={proyecto.aplicaIva}
                  onChange={async (e) => await store.proyectos.actualizarParametrosFinancieros(proyecto.id, { aplicaIva: e.target.checked })}
                  className="rounded border border-border-subtle cursor-pointer"
                />
                <span className="text-xs font-medium text-text-heading">IVA</span>
              </label>
            </div>

            <Button variant="ghost" size="md" className="h-7 px-2 text-xs" onClick={() => setMostrarEditarProyecto(true)}>Editar datos</Button>
            <Button variant="ghost" size="md" className="h-7 px-2 text-xs" onClick={() => window.open(`/propuesta/${proyecto.id}`, '_blank')}>Propuesta pública</Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => {
                window.open(`/propuesta/${proyecto.id}`, '_blank', 'noopener')
                setModalPresentacionAbierto(true)
              }}
            >
              ▶ Presentar
            </Button>
            <Button variant="ghost" size="md" className="h-7 px-2 text-xs" onClick={() => window.open(`/erp/cotizador/${proyecto.id}?readonly=true`, '_blank')}>Solo lectura</Button>
            <Button variant="primary" size="md" className="h-7 px-3 text-xs" onClick={() => setMostrarContratoModal(true)}>Generar Contrato</Button>
            {proyecto.estado === 'activa' && (
              <Button
                variant="ghost" size="md" className="h-7 px-2 text-xs text-red-500 hover:text-red-600"
                onClick={async () => {
                  if (window.confirm(`¿Eliminar la cotización "${proyecto.nombreProyecto}"?`)) {
                    const ok = await store.proyectos.eliminar(proyecto.id)
                    if (ok) router.push('/erp/cotizador')
                  }
                }}
              >Eliminar</Button>
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Espacios</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
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
              className="rounded border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-heading focus:border-gold-400 focus:outline-none sm:w-48 transition-all duration-fast"
              aria-label="Nombre del nuevo espacio"
              disabled={creandoEspacio}
            />
            <select
              value={nuevoEspacioTipo}
              onChange={(e) => setNuevoEspacioTipo(e.target.value)}
              className="rounded border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-heading focus:border-gold-400 focus:outline-none transition-all duration-fast"
              aria-label="Tipo del nuevo espacio"
            >
              <option value="">Sin tipo</option>
              {TIPOS_ESPACIO.map((t) => (
                <option key={t.codigo} value={t.codigo}>{t.label}</option>
              ))}
            </select>
            <Button
              variant="secondary"
              size="md"
              className="h-10 text-sm w-full sm:w-auto"
              onClick={() => void guardCrearEspacio(crearEspacio)}
              disabled={creandoEspacio}
              loading={creandoEspacio}
              aria-label="Crear nuevo espacio"
            >
              + Crear
            </Button>
            <Button
              variant="ghost"
              size="md"
              className="h-10 text-sm border border-border-subtle hover:border-gold-400 hover:text-gold-600 w-full sm:w-auto"
              onClick={() => setMostrarPlantillasModal(true)}
              disabled={creandoEspacio}
              title="Precargar un espacio prediseñado con sus ítems estándar"
            >
              ✨ + Desde Plantilla
            </Button>
          </div>
        </div>

        {mostrarPlantillasModal && (
          <Modal
            open={true}
            onClose={() => setMostrarPlantillasModal(false)}
            title="✨ Seleccionar Plantilla de Espacio"
          >
            <div className="space-y-4">
              <p className="text-xs text-text-muted">
                Elige un espacio prediseñado para insertar en tu cotización. Se precargarán automáticamente sus módulos base, cantidades y jornadas estimadas.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 max-h-[65vh] overflow-y-auto p-1">
                {PRESETS_ESPACIOS.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex flex-col justify-between rounded border border-border-subtle bg-bg-paper p-3 hover:border-gold-400 hover:shadow-xs transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{preset.icono}</span>
                        <h4 className="text-xs font-bold text-text-heading">{preset.nombre}</h4>
                      </div>
                      <p className="mt-1 text-[11px] text-text-muted leading-relaxed">
                        {preset.descripcion}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="rounded bg-bg-alt px-1.5 py-0.5 text-[10px] font-mono text-text-muted">
                          {preset.items.length} módulos incluidos
                        </span>
                        <span className="rounded bg-bg-alt px-1.5 py-0.5 text-[10px] text-text-muted">
                          Jornadas: {preset.jornadas.dev}d dev / {preset.jornadas.ens}d ens / {preset.jornadas.inst}d inst
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-border-subtle flex justify-end">
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => void aplicarPreset(preset)}
                        disabled={creandoEspacio}
                      >
                        Insertar Espacio
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Modal>
        )}
        {Array.from(gruposPorNombre.entries()).map(([nombreEspacio, variantes]) => (
          <EspacioGroupMemo
            key={nombreEspacio}
            nombreEspacio={nombreEspacio}
            variantes={variantes}
            catalogo={catalogo}
            expandido={gruposExpandidos.has(nombreEspacio)}
            onToggle={toggleGrupo}
            jornadasMap={jornadasMap}
            onUpdateJornadas={actualizarJornadas}
            tarifas={tarifas}
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

        {/* Modo Presentación Comercial (ZN-004 / F-08-ext) */}
        {modalPresentacionAbierto && proyecto && (
          <ModalPresentador
            proyectoId={proyecto.id}
            slides={generarSlides(
              proyecto,
              cliente ?? null,
              espaciosBase,
              espaciosBase.flatMap((esp) => store.items.porVariante(esp.id)),
              catalogo,
            )}
            onCrearNota={async (data) => {
              await store.notasReunion.crear(data)
            }}
            onCerrar={() => setModalPresentacionAbierto(false)}
          />
        )}
      </div>

      {/* Mobile Bottom Sticky Bar for Actions */}
      <div className="sm:hidden fixed bottom-14 left-0 right-0 z-40 bg-bg-raised border-t border-border-subtle p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex items-center justify-between gap-2 pb-safe">
        <Button variant="ghost" size="md" className="h-10 px-4 text-xs font-semibold flex-1" onClick={() => setMostrarEditarProyecto(true)}>
          Editar
        </Button>
        <Button variant="primary" size="md" className="h-10 px-4 text-xs font-semibold flex-1" onClick={() => setMostrarContratoModal(true)}>
          Generar Contrato
        </Button>
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
  onToggle: (nombreEspacio: string) => void
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
  // no la que se estǸ mirando en ese momento �?" cambiar de tab para comparar
  // no debe mover el nǧmero que ve el resto de la pantalla.
  const itemsActivos = useSelectPorVariante(varianteActiva.id)
  const totalGrupo = itemsActivos
    .filter((it) => !it.esReferencial)
    .reduce((s, it) => s + parseNum(it.totalLinea), 0)

  const guardarNombreGrupo = async () => {
    const valor = nombreTemp.trim()
    if (valor && valor !== nombreEspacio) {
      await Promise.all(variantes.map((v) => store.espacios.actualizar(v.id, { nombreEspacio: valor })))
    }
    setEditandoNombre(false)
  }

  // P4 (ZN-003): renombrado en línea de la variante seleccionada.
  const [editandoNombreVariante, setEditandoNombreVariante] = useState(false)
  const [nombreVarianteTemp, setNombreVarianteTemp] = useState('')
  const iniciarEditarNombreVariante = (v: EspacioVariante) => {
    setNombreVarianteTemp(v.nombreVariante)
    setEditandoNombreVariante(true)
  }
  const guardarNombreVariante = async (v: EspacioVariante) => {
    const valor = nombreVarianteTemp.trim()
    if (valor && valor !== v.nombreVariante) {
      await useCotizadorStore.getState().renombrarVariante(v.id, valor, () =>
        store.espacios.actualizar(v.id, { nombreVariante: valor }),
      )
    }
    setEditandoNombreVariante(false)
  }

  // P3 (ZN-003): eliminación de una variante (solo se ofrece sobre variantes inactivas
  // y cuando el grupo tiene más de una variante). Persiste vía DataStore con la misma
  // Guardia de Integridad del servidor; la acción optimista revierte sola si falla.
  const eliminarVarianteUI = async (v: EspacioVariante) => {
    if (v.id === varianteActiva.id || variantes.length <= 1) return
    const ok = await useCotizadorStore.getState().eliminarVariante(v.id, () => store.espacios.eliminar(v.id))
    if (ok && tabId === v.id) {
      const restante = variantes.filter((x) => x.id !== v.id)
      setTabId(restante[0].id)
    }
  }

  return (
    <div className={`rounded-lg border ${varianteActiva.activa ? 'border-border-subtle' : 'border-border-subtle/50'} bg-bg-raised overflow-hidden`}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onToggle(nombreEspacio)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(nombreEspacio) } }}
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
                <div
                  key={v.id}
                  className={`flex items-center gap-1.5 rounded-t px-2 py-1.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors duration-fast min-w-0 ${
                    v.id === tabId
                      ? 'border-gold-500 text-text-heading bg-bg-raised'
                      : 'border-transparent text-text-muted hover:text-text-heading'
                  }`}
                >
                  {editandoNombreVariante && v.id === tabId ? (
                    <input
                      type="text"
                      autoFocus
                      value={nombreVarianteTemp}
                      onChange={(e) => setNombreVarianteTemp(e.target.value)}
                      onBlur={() => void guardarNombreVariante(v)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); void guardarNombreVariante(v) }
                        if (e.key === 'Escape') setEditandoNombreVariante(false)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-28 rounded border border-gold-400 bg-bg-paper px-1 py-0.5 text-xs text-text-heading focus:outline-none"
                      aria-label="Nombre de la variante"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setTabId(v.id); if (v.id !== tabId) setEditandoNombreVariante(false) }}
                      className="flex items-center gap-1.5 min-w-0"
                      title={v.nombreVariante}
                    >
                      {v.activa && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Variante activa" />}
                      <span className="truncate">{v.nombreVariante}</span>
                      {v.id === tabId && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); iniciarEditarNombreVariante(v) }}
                          className="text-text-muted hover:text-gold-500 shrink-0"
                          aria-label="Renombrar variante"
                          title="Renombrar variante"
                        >
                          &#9998;
                        </button>
                      )}
                      {v.id !== tabId && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); void eliminarVarianteUI(v) }}
                          className="text-text-muted hover:text-red-500 shrink-0"
                          aria-label={`Eliminar variante ${v.nombreVariante}`}
                          title="Eliminar variante"
                        >
                          &times;
                        </button>
                      )}
                    </button>
                  )}
                </div>
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
  // Lectura de items desde el store Zustand (puente hidratado desde el DataStore).
  const items = useSelectPorVariante(espacio.id)
  const productMap = useMemo(() => new Map(catalogo.map((p) => [p.id, p])), [catalogo])
  const itemsContractuales = items.filter((it) => !it.esReferencial)
  const itemsReferenciales = items.filter((it) => it.esReferencial)
  const subtotalItems = itemsContractuales.reduce((s, it) => s + parseNum(it.totalLinea), 0)
  const totalReferencial = itemsReferenciales.reduce((s, it) => s + parseNum(it.totalLinea), 0)

  const [mostrarFormArtefacto, setMostrarFormArtefacto] = useState(false)
  const [editarArtefactoId, setEditarArtefactoId] = useState<string | null>(null)
  const [modoBusquedaItem, setModoBusquedaItem] = useState<'off' | 'normal' | 'referencial'>('off')
  const [mostrarDetalles, setMostrarDetalles] = useState(false)
  const [modalItemId, setModalItemId] = useState<string | null>(null)
  const [creandoItemLibre, setCreandoItemLibre] = useState(false)
  const [itemLibreNombre, setItemLibreNombre] = useState('')
  const [itemLibreCantidad, setItemLibreCantidad] = useState('1')
  const [itemLibrePrecio, setItemLibrePrecio] = useState('0')
  const [itemLibreEsRef, setItemLibreEsRef] = useState(false)

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
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="md"
              onClick={() => { setCreandoItemLibre(true); setItemLibreEsRef(false); }}
              className="text-xs border border-border-subtle hover:border-gold-400"
              title="Agregar ítem especial o a medida sin SKU de catálogo"
            >
              + Ítem Libre
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => setModoBusquedaItem('normal')}
              aria-label="Buscar en catálogo"
            >
              + Buscar
            </Button>
          </div>
        </div>

        {itemsContractuales.length === 0 && modoBusquedaItem !== 'normal' && (
          <p className="text-sm text-text-muted py-2 italic">Sin ítems en esta variante.</p>
        )}

        {modoBusquedaItem === 'normal' && (
          <div className="mb-3">
            <SmartSearch
              items={catalogo.map(p => ({ id: p.id, sku: p.sku, descripcion: p.descripcion, tipo: p.tipo, precioPublico: p.precioPublico, precioDirecto: p.precioDirecto, categoriaComercial: p.categoriaComercial }))}
              onSelect={(producto) => guardCrearItem(async () => {
                // Fase 2 (ZN-003): optimismo — la fila aparece de inmediato (sin esperar
                // la latencia de red) y la Server Action persiste en background con revert
                // automático si el servidor rechaza la escritura.
                await useCotizadorStore.getState().crearItemOptimistic(
                  {
                    varianteId: espacio.id,
                    catalogoId: producto.id,
                    nombrePersonalizado: null,
                    cantidad: '1',
                    precioUnitario: producto.precioPublico ?? '0',
                    anulado: false,
                    esReferencial: false,
                    fuenteReferencial: null,
                    grupoReferencial: null,
                  },
                  () =>
                    store.items.crear({
                      varianteId: espacio.id,
                      catalogoId: producto.id,
                      cantidad: '1',
                      precioUnitario: producto.precioPublico ?? '0',
                      nombrePersonalizado: null,
                    }),
                )
                setModoBusquedaItem('off')
              })}
              onCreateNew={() => { setCreandoItemLibre(true); setItemLibreEsRef(false); setModoBusquedaItem('off') }}
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
            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 text-sm border-b border-border-subtle/50 pb-4 pt-2 sm:pb-2 sm:pt-0 last:pb-0 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 sm:gap-2">
                  <ItemMiniatura producto={prod} onClick={() => setModalItemId(item.id)} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-text-heading text-base sm:text-sm font-medium sm:font-normal truncate">
                      {item.nombrePersonalizado ?? prod?.descripcion ?? 'Ítem sin catálogo'}
                    </span>
                    {prod && (
                      <span className="text-xs text-text-muted font-mono truncate">{prod.sku}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 w-full sm:w-auto mt-3 sm:mt-0 bg-surface-100 sm:bg-transparent p-3 sm:p-0 rounded border border-border-subtle/50 sm:border-0">
                <div className="grid grid-cols-12 sm:flex items-center gap-2 w-full sm:w-auto">
                  <div className="col-span-3 sm:w-20">
                    <NumberInput
                      value={item.cantidad}
                      onChange={(v) => actualizarItem(item.id, 'cantidad', v)}
                      step={0.1}
                      min={0}
                      label=""
                      className="w-full h-10 sm:h-8 text-right font-mono text-sm"
                      aria-label={`Cantidad ${prod?.descripcion ?? item.id}`}
                    />
                  </div>
                  <div className="col-span-1 text-center text-text-muted text-xs">×</div>
                  <div className="col-span-4 sm:w-28">
                    <MoneyInput
                      value={item.precioUnitario}
                      onChange={(v) => actualizarItem(item.id, 'precioUnitario', v)}
                      label=""
                      className="w-full h-10 sm:h-8 text-right font-mono text-sm"
                      aria-label={`Precio ${prod?.descripcion ?? item.id}`}
                    />
                  </div>
                  <div className="col-span-4 text-right">
                    <span className="font-mono text-sm font-semibold text-text-heading">
                      {formatCOP(total)}
                    </span>
                  </div>
                </div>
                {/* Acciones */}
                <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-border-subtle/50 sm:mt-0 sm:pt-0 sm:border-0">
                  <button
                    type="button"
                    onClick={() => actualizarItem(item.id, 'esReferencial', true)}
                    aria-label="Mover a Presupuesto Adicional"
                    title="Mover a Presupuesto Adicional"
                    className="p-2 sm:p-1 text-text-muted hover:text-gold-600 rounded"
                  >
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 1.5v13M3 1.5h9l-2 3.25 2 3.25H3" strokeLinejoin="round" strokeLinecap="round" />
                    </svg>
                  </button>
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={async () => await store.items.eliminar(item.id)}
                    className="text-text-muted hover:text-red-500 h-10 w-10 sm:h-8 sm:w-8 p-0 rounded"
                  >
                    <span className="text-2xl sm:text-lg">×</span>
                  </Button>
                </div>
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
                await useCotizadorStore.getState().crearItemOptimistic(
                  {
                    varianteId: espacio.id,
                    catalogoId: producto.id,
                    nombrePersonalizado: null,
                    cantidad: '1',
                    precioUnitario: producto.precioPublico ?? '0',
                    anulado: false,
                    esReferencial: true,
                    fuenteReferencial: null,
                    grupoReferencial: null,
                  },
                  () =>
                    store.items.crear({
                      varianteId: espacio.id,
                      catalogoId: producto.id,
                      cantidad: '1',
                      precioUnitario: producto.precioPublico ?? '0',
                      nombrePersonalizado: null,
                      esReferencial: true,
                    }),
                )
                setModoBusquedaItem('off')
              })}
              onCreateNew={() => { setCreandoItemLibre(true); setItemLibreEsRef(true); setModoBusquedaItem('off') }}
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
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 text-sm border-b border-border-subtle/50 pb-4 pt-2 sm:pb-2 sm:pt-1 last:pb-0 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 sm:gap-2">
                      <ItemMiniatura producto={prod} onClick={() => setModalItemId(item.id)} />
                      <span className="w-2 h-2 sm:w-1.5 sm:h-1.5 rounded-full bg-gold-500 flex-shrink-0" title="Referencial" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-text-heading text-base sm:text-sm font-medium sm:font-normal truncate">
                          {item.nombrePersonalizado ?? prod?.descripcion ?? 'Ítem sin catálogo'}
                        </span>
                        <div className="flex items-center gap-2 mt-1 sm:mt-0">
                          <select
                            value={item.fuenteReferencial ?? ''}
                            onChange={(e) => actualizarItem(item.id, 'fuenteReferencial', e.target.value)}
                            className="rounded border border-border-subtle bg-bg-paper px-1.5 py-0.5 text-xs text-text-heading focus:border-gold-400 focus:outline-none h-8 sm:h-6"
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
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 w-full sm:w-auto mt-3 sm:mt-0 bg-surface-100 sm:bg-transparent p-3 sm:p-0 rounded border border-border-subtle/50 sm:border-0">
                    <div className="grid grid-cols-12 sm:flex items-center gap-2 w-full sm:w-auto">
                      <div className="col-span-3 sm:w-20">
                        <NumberInput
                          value={item.cantidad}
                          onChange={(v) => actualizarItem(item.id, 'cantidad', v)}
                          step={0.1}
                          min={0}
                          label=""
                          className="w-full h-10 sm:h-8 text-right font-mono text-sm"
                          aria-label={`Cantidad ${prod?.descripcion ?? item.id}`}
                        />
                      </div>
                      <div className="col-span-1 text-center text-text-muted text-xs">×</div>
                      <div className="col-span-4 sm:w-28">
                        <MoneyInput
                          value={item.precioUnitario}
                          onChange={(v) => actualizarItem(item.id, 'precioUnitario', v)}
                          label=""
                          className="w-full h-10 sm:h-8 text-right font-mono text-sm"
                          aria-label={`Precio ${prod?.descripcion ?? item.id}`}
                        />
                      </div>
                      <div className="col-span-4 text-right">
                        <span className="font-mono text-sm font-semibold text-text-heading">
                          {formatCOP(total)}
                        </span>
                      </div>
                    </div>
                    {/* Acciones */}
                    <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-border-subtle/50 sm:mt-0 sm:pt-0 sm:border-0">
                      <button
                        type="button"
                        onClick={() => actualizarItem(item.id, 'esReferencial', false)}
                        aria-label="Mover a Ítems (cotizado)"
                        title="Mover a Ítems"
                        className="p-2 sm:p-1 text-text-muted hover:text-emerald-600 rounded"
                      >
                        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M13 1.5v13M13 1.5H4l2 3.25-2 3.25h9" strokeLinejoin="round" strokeLinecap="round" />
                        </svg>
                      </button>
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={async () => await store.items.eliminar(item.id)}
                        className="text-text-muted hover:text-red-500 h-10 w-10 sm:h-8 sm:w-8 p-0 rounded"
                      >
                        <span className="text-2xl sm:text-lg">×</span>
                      </Button>
                    </div>
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
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-4 sm:mb-2">Jornadas de Mano de Obra</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-2">
          <NumberInput
            label="Desarrollo"
            step="0.5"
            min="0"
            className="w-full sm:w-24 h-12 sm:h-8 text-right font-mono"
            value={jornadas.dev}
            onChange={(v) => onUpdateJornadas(espacio.id, 'dev', v)}
            aria-label={`Jornadas desarrollo ${espacio.nombreEspacio}`}
          />
          <NumberInput
            label="Ensamblaje"
            step="0.5"
            min="0"
            className="w-full sm:w-24 h-12 sm:h-8 text-right font-mono"
            value={jornadas.ens}
            onChange={(v) => onUpdateJornadas(espacio.id, 'ens', v)}
            aria-label={`Jornadas ensamblaje ${espacio.nombreEspacio}`}
          />
          <NumberInput
            label="Instalación"
            step="0.5"
            min="0"
            className="w-full sm:w-24 h-12 sm:h-8 text-right font-mono"
            value={jornadas.inst}
            onChange={(v) => onUpdateJornadas(espacio.id, 'inst', v)}
            aria-label={`Jornadas instalación ${espacio.nombreEspacio}`}
          />
        </div>
          <div className="mt-2 flex justify-between items-center border-t border-border-subtle pt-2">
            <span className="text-[11px] text-text-muted">Total MO (jornadas × tarifa):</span>
            <span className="font-mono text-xs font-medium text-brand">{formatCOP(moSubtotal)}</span>
          </div>
        </div>

      {modalItem && (
        <ItemEditorModal
          item={modalItem}
          producto={modalProd}
          catalogo={catalogo}
          onClose={() => setModalItemId(null)}
          onSave={async (cambios) => {
            await store.items.actualizar(modalItem.id, cambios)
          }}
          onReemplazarProducto={async (nuevoProducto, mantenerPrecioActual) => {
            const nuevoPrecio = mantenerPrecioActual
              ? modalItem.precioUnitario
              : (nuevoProducto.precioPublico ?? modalItem.precioUnitario)
            await store.items.actualizar(modalItem.id, {
              catalogoId: nuevoProducto.id,
              nombrePersonalizado: null,
              precioUnitario: nuevoPrecio,
            })
          }}
          onEliminar={async () => {
            await store.items.eliminar(modalItem.id)
          }}
        />
      )}

      {creandoItemLibre && (
        <Modal
          open={true}
          onClose={() => setCreandoItemLibre(false)}
          title={itemLibreEsRef ? 'Agregar Ítem Referencial a Medida' : 'Agregar Ítem a Medida (Sin Catálogo)'}
        >
          <div className="space-y-3">
            <p className="text-xs text-text-muted">
              Crea un ítem a la medida para este espacio sin salir de la cotización.
            </p>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                Descripción o Nombre del Ítem *
              </label>
              <input
                type="text"
                value={itemLibreNombre}
                onChange={(e) => setItemLibreNombre(e.target.value)}
                placeholder="Ej: Módulo especial a medida"
                className="w-full rounded border border-border-subtle bg-bg-paper px-2.5 py-1.5 text-xs text-text-heading focus:border-brand focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={itemLibreCantidad}
                  onChange={(e) => setItemLibreCantidad(e.target.value)}
                  className="w-full rounded border border-border-subtle bg-bg-paper px-2.5 py-1.5 font-mono text-xs text-text-heading focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Precio Unitario (COP)</label>
                <MoneyInput
                  value={itemLibrePrecio}
                  onChange={setItemLibrePrecio}
                  className="w-full text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
              <Button variant="ghost" size="md" onClick={() => setCreandoItemLibre(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={!itemLibreNombre.trim()}
                onClick={async () => {
                  const total = String(parseNum(itemLibreCantidad) * parseNum(itemLibrePrecio))
                  await store.items.crear({
                    varianteId: espacio.id,
                    catalogoId: null,
                    nombrePersonalizado: itemLibreNombre.trim(),
                    cantidad: itemLibreCantidad,
                    precioUnitario: itemLibrePrecio,
                    totalLinea: total,
                    esReferencial: itemLibreEsRef,
                  })
                  setCreandoItemLibre(false)
                  setItemLibreNombre('')
                  setItemLibreCantidad('1')
                  setItemLibrePrecio('0')
                }}
              >
                + Agregar a Cotización
              </Button>
            </div>
          </div>
        </Modal>
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
  const [colores, setColores] = useState<(AcabadoItem | string)[]>(() => {
    if (Array.isArray(espacio.colores)) {
      return espacio.colores as (AcabadoItem | string)[]
    }
    return []
  })
  const [fotosEspacio, setFotosEspacio] = useState<string[]>(espacio.fotosEspacio)
  const [fotosDisenio, setFotosDisenio] = useState<string[]>(espacio.fotosDisenio)
  const [fotosReferencia, setFotosReferencia] = useState<string[]>(espacio.fotosReferencia)

  const handleGuardar = useCallback(async () => {
    await store.espacios.actualizar(espacio.id, {
      nombreEspacio: nombreEspacio.trim(),
      nombreVariante: nombreVariante.trim(),
      descripcion: descripcion.trim() || null,
      colores,
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

      {/* Selector de imágenes — arriba, con miniaturas y controles de reordenamiento */}
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

      {/* Selector visual de acabados de catálogo (ZU_04) */}
      <AcabadoPicker
        label="Colores y Acabados de la Variante"
        acabadosDisponibles={store.catalogoAcabados.listar()}
        value={colores}
        onChange={setColores}
      />

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
