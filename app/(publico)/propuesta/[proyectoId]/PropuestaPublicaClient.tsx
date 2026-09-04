'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { ArrowDown, Building2, Expand, LayoutGrid, MapPin } from 'lucide-react'
import { Button } from '@/components/veta/button'
import { MetaItem } from '@/components/veta/meta-item'
import { GalleryOverlay } from '@/components/veta/gallery-lightbox'
import { GalleryRail } from '@/components/veta/gallery-rail'
import type { EspacioVariante, ItemVariante } from '@/lib/data'
import type { CatalogoItemPublico, PropuestaPublicaData } from '@/lib/data/actions/public'

// F-08 Propuesta pública (disenio_F08_propuesta_publica.md). Ruta simplificada
// a /propuesta/[proyectoId] en vez de /propuesta/{slug} — Proyecto no tiene
// campo slug todavía en F10 (gap anotado, no bloqueante: agregar slug es
// trabajo de la migración real, no cambia nada del diseño de esta pantalla).
// R1: snapshot de solo lectura, sin mutaciones. R5: sin botones de pago.
//
// Refinamiento visual 2026-08-11 (ver disenio_F08 §9.4 nota): los ítems de
// "Qué incluye" se muestran siempre visibles con imagen (paridad con la
// referencia premium desplegada en empresa_muebles_clone) en vez de ir
// dentro del accordion cerrado por defecto. El accordion se conserva solo
// para mano de obra / referenciales / notas — detalle técnico secundario.
//
// Auditoría 2026-08-15: extraído de page.tsx — ya no lee useDataStore() (el snapshot completo
// del ERP ya no hidrata el árbol público). Recibe los datos ya escopados a este proyecto vía
// obtenerPropuestaPublicaAction() (lib/data/actions/public.ts), pasados como prop desde el
// Server Component padre.

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatQty(s: string | null | undefined): string {
  const n = Number(s)
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(Number.isFinite(n) ? n : 0)
}

function parseNum(s: string | null | undefined): number {
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

type GalleryImage = { url: string; alt: string; id: string }

function toGalleryImages(fotos: string[], alt: string): GalleryImage[] {
  return fotos.filter(Boolean).map((url, i) => ({ url, alt: `${alt} ${i + 1}`, id: `${url}-${i}` }))
}

interface ItemCardProps {
  item: ItemVariante
  producto: CatalogoItemPublico | undefined
  onZoom: (imagenes: GalleryImage[], index: number) => void
}

function ItemCard({ item, producto, onZoom }: ItemCardProps) {
  const nombre = item.nombrePersonalizado ?? producto?.descripcion ?? 'Ítem'
  const unidad = producto?.unidadMedida || 'unidad'
  const precioUnitario = parseNum(item.precioUnitario)
  const total = parseNum(item.totalLinea)
  const galeria = [producto?.imagenUrl, ...(producto?.galeriaImagenesUrl ?? [])].filter(Boolean) as string[]
  const imagen = galeria[0] ?? null
  const zoomable = galeria.length > 0

  return (
    <div
      role={zoomable ? 'button' : undefined}
      tabIndex={zoomable ? 0 : undefined}
      onClick={zoomable ? () => onZoom(toGalleryImages(galeria, nombre), 0) : undefined}
      onKeyDown={
        zoomable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onZoom(toGalleryImages(galeria, nombre), 0)
              }
            }
          : undefined
      }
      className={`group flex items-center gap-3 rounded-lg border border-border-subtle bg-bg-raised p-3 shadow-xs transition-colors duration-fast ${
        zoomable ? 'cursor-zoom-in hover:border-border-brand' : ''
      }`}
    >
      <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-sm bg-bg-alt">
        {imagen ? (
          <>
            {/* unoptimized: propuesta es snapshot de solo lectura y sus URLs pueden ser mock/blob temporales */}
            <Image src={imagen} alt="" fill unoptimized className="object-cover" />
            <span className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition-opacity duration-base group-hover:bg-black/30 group-hover:opacity-100">
              <Expand size={13} />
            </span>
          </>
        ) : (
          <span className="text-[10px] text-text-muted">{producto?.sku?.charAt(0) ?? '·'}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-5 text-text-heading">{nombre}</p>
        <p className="mt-0.5 text-xs text-text-muted">
          {formatQty(item.cantidad)} {unidad}
          {precioUnitario > 0 ? <> · {formatCOP(precioUnitario)} c/u</> : null}
        </p>
      </div>
      {total > 0 && (
        <div className="shrink-0 self-center text-right">
          <span className="block text-[9px] uppercase tracking-[0.12em] text-text-muted">Total</span>
          <strong className="font-display text-sm tabular-nums text-text-heading">{formatCOP(total)}</strong>
        </div>
      )}
    </div>
  )
}

interface DetalleTecnicoProps {
  referenciales: ItemVariante[]
  jornadasDev: string
  jornadasEns: string
  jornadasInst: string
  tarifaDev: number
  tarifaAssembly: number
  tarifaInstall: number
}

function DetalleTecnico({
  referenciales,
  jornadasDev,
  jornadasEns,
  jornadasInst,
  tarifaDev,
  tarifaAssembly,
  tarifaInstall,
}: DetalleTecnicoProps) {
  const [abierto, setAbierto] = useState(false)

  const moDev = parseNum(jornadasDev) * tarifaDev
  const moEns = parseNum(jornadasEns) * tarifaAssembly
  const moInst = parseNum(jornadasInst) * tarifaInstall
  const moTotal = moDev + moEns + moInst

  if (moTotal === 0 && referenciales.length === 0) return null

  return (
    <div className="rounded-lg border border-border-subtle">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-bg-alt/60 transition-colors duration-fast"
      >
        <span className="text-sm font-medium text-text-heading">Ver desglose técnico</span>
        <svg
          className={`w-4 h-4 text-text-muted transition-transform duration-base ${abierto ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {abierto && (
        <div className="border-t border-border-subtle px-4 py-3 space-y-3">
          {moTotal > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-1">Mano de obra</p>
              {moDev > 0 && <div className="flex justify-between text-sm"><span className="text-text-muted">· Desarrollo técnico</span><span className="font-mono">{formatCOP(moDev)}</span></div>}
              {moEns > 0 && <div className="flex justify-between text-sm"><span className="text-text-muted">· Ensamblaje</span><span className="font-mono">{formatCOP(moEns)}</span></div>}
              {moInst > 0 && <div className="flex justify-between text-sm"><span className="text-text-muted">· Instalación</span><span className="font-mono">{formatCOP(moInst)}</span></div>}
              <div className="flex justify-between text-sm pt-2 border-t border-border-subtle/50 mt-2">
                <span className="text-text-muted font-medium">Subtotal MO</span>
                <span className="font-mono text-text-heading">{formatCOP(moTotal)}</span>
              </div>
            </div>
          )}

          {referenciales.length > 0 && (
            <div className="pt-2 border-t border-dashed border-border-subtle">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">Ref. con terceros</p>
              {Object.entries(
                referenciales.reduce<Record<string, ItemVariante[]>>((acc, it) => {
                  const key = it.grupoReferencial?.trim() || 'Otros'
                  acc[key] = acc[key] ?? []
                  acc[key].push(it)
                  return acc
                }, {})
              ).map(([grupo, items]) => (
                <div key={grupo} className="mb-1.5 last:mb-0">
                  <p className="text-xs font-medium text-text-muted">{grupo}</p>
                  {items.map((it) => (
                    <div key={it.id} className="flex justify-between text-xs text-text-muted pl-3 py-0.5">
                      <span>{it.nombrePersonalizado ?? 'Ítem'}</span>
                      <span className="font-mono">{formatCOP(parseNum(it.totalLinea))}</span>
                    </div>
                  ))}
                </div>
              ))}
              <p className="text-xs text-text-muted italic mt-1">No incluida en el total.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function PropuestaPublicaClient({ data }: { data: PropuestaPublicaData }) {
  const { proyecto, espacios: espaciosBase, items: todosLosItems, catalogoPorId, contrato, hitos: hitosList, tarifas } = data
  const { tarifaDev, tarifaAssembly, tarifaInstall } = tarifas

  const [espacioActivoId, setEspacioActivoId] = useState<string | null>(null)
  const [varianteSeleccionadaId, setVarianteSeleccionadaId] = useState<string | null>(null)
  const [zoom, setZoom] = useState<{ imagenes: GalleryImage[]; index: number } | null>(null)
  const [tituloHeaderVisible, setTituloHeaderVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setTituloHeaderVisible(window.scrollY > 250)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const itemsPorVariante = useCallback((varianteId: string): ItemVariante[] => todosLosItems.filter((it) => it.varianteId === varianteId), [todosLosItems])

  // Solo la variante activa de cada espacio entra a la propuesta — igual regla
  // que el cotizador: alternativas de comparación no son objeto de contrato.
  const grupos = useMemo(() => {
    const map = new Map<string, EspacioVariante[]>()
    espaciosBase.forEach((e) => {
      const arr = map.get(e.nombreEspacio) ?? []
      arr.push(e)
      map.set(e.nombreEspacio, arr)
    })
    return map
  }, [espaciosBase])

  const espaciosActivos = useMemo(() => Array.from(grupos.values()).map((variantes) => variantes.find((v) => v.activa) ?? variantes[0]), [grupos])

  // Inicializa espacioActivoId si está vacío
  const espacioIdActual = espacioActivoId ?? espaciosActivos[0]?.id ?? null
  if (espacioActivoId === null && espaciosActivos.length > 0) {
    setEspacioActivoId(espaciosActivos[0].id)
  }

  // Obtener todas las variantes del espacio actual (para selector de variantes)
  const espacioActual = espaciosActivos.find((e) => e.id === espacioIdActual)
  const espacioActualVariantes = espacioActual ? Array.from(grupos.get(espacioActual.nombreEspacio) ?? []) : []

  // Variante a mostrar: si está seleccionada, usarla; si no, la activa; si ninguna, la primera
  const varianteActual =
    espacioActualVariantes.find((v) => v.id === varianteSeleccionadaId) ??
    espacioActualVariantes.find((v) => v.activa) ??
    espacioActualVariantes[0] ??
    null

  // Calcular totales (para resumen financiero general)
  // Proyectar: si el usuario está viendo una variante alternativa en el espacio actual,
  // el resumen financiero global (Sidebar) debe reflejar ese escenario "What If".
  // [Axioma de Información]: Memoizado para no re-ejecutar N x M iteraciones en cada scroll event.
  const { materialesTotal, moTotal, subtotal, total, iva, costosOperativos, imprevistos } = useMemo(() => {
    let mTotal = 0
    let moDev = 0
    let moEns = 0
    let moInst = 0

    const espaciosProyectados = Array.from(grupos.entries()).map(([nombre, variantes]) => {
      if (espacioActual && nombre === espacioActual.nombreEspacio && varianteActual) {
        return varianteActual
      }
      return variantes.find((v) => v.activa) ?? variantes[0]
    })

    espaciosProyectados.forEach((esp) => {
      const items = itemsPorVariante(esp.id)
      const contractuales = items.filter((it) => !it.esReferencial)
      
      mTotal += contractuales.reduce((s, it) => s + parseNum(it.totalLinea), 0)
      moDev += parseNum(esp.jornadasDesarrolloTecnico) * tarifaDev
      moEns += parseNum(esp.jornadasEnsamblajeTaller) * tarifaAssembly
      moInst += parseNum(esp.jornadasInstalacionObra) * tarifaInstall
    })

    const mOperativos = parseNum(proyecto.costosOperativos)
    const mImprevistos = parseNum(proyecto.imprevistosInstalacion)
    const mDescuento = parseNum(proyecto.descuentoComercial)
    const mAjuste = parseNum(proyecto.ajusteArbitrario)
    
    const moT = moDev + moEns + moInst
    const sTotal = mTotal + moT + mOperativos + mImprevistos - mDescuento + mAjuste
    const mIva = proyecto.aplicaIva ? Math.round(sTotal * (parseNum(proyecto.porcentajeIva) / 100)) : 0
    
    return {
      materialesTotal: mTotal,
      moTotal: moT,
      costosOperativos: mOperativos,
      imprevistos: mImprevistos,
      subtotal: sTotal,
      iva: mIva,
      total: sTotal + mIva
    }
  }, [
    grupos, espacioActual, varianteActual, itemsPorVariante, 
    tarifaDev, tarifaAssembly, tarifaInstall, proyecto
  ])

  // Datos de la variante actual para mostrar en la sección del espacio
  const itemsVarianteActual = varianteActual ? itemsPorVariante(varianteActual.id) : []
  const contractualesActuales = itemsVarianteActual.filter((it) => !it.esReferencial)
  const referencialesActuales = itemsVarianteActual.filter((it) => it.esReferencial)

  const scrollToContenido = () => {
    document.getElementById('contenido-propuesta')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // ── Receptor BroadcastChannel para modo presentación (ZN-004) ──
  const seccionRefs = useRef<Record<string, HTMLElement | null>>({})
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return
    const canal = new BroadcastChannel(`presentacion-${proyecto.id}`)
    canal.onmessage = (ev: MessageEvent<{ tipo: string; espacioId: string }>) => {
      if (ev.data?.tipo === 'ir_a') {
        setEspacioActivoId(ev.data.espacioId)
        setVarianteSeleccionadaId(null)
        const el = seccionRefs.current[ev.data.espacioId]
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    return () => canal.close()
  }, [proyecto.id])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_var(--color-bg-alt)_0%,_var(--color-bg-paper)_40%,_var(--color-bg-paper)_100%)]">
      {/* HeaderPropuesta — sticky (top-16: se acopla debajo del header de AppShell, h-16) */}
      <header className="sticky top-16 z-header bg-bg-paper/90 backdrop-blur-xl border-b border-border-subtle print:static print:bg-transparent">
        <div className="mx-auto max-w-7xl px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className={`transition-all duration-500 ease-out ${tituloHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold-500">Propuesta</p>
            <h1 className="font-display text-2xl font-semibold text-text-heading mt-0.5">{proyecto.nombreProyecto}</h1>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={() => {
                window.open(
                  `/erp/cotizador/${proyecto.id}?presentar=1`,
                  'presentador',
                  'width=900,height=680,left=100,top=100,menubar=no,toolbar=no,location=no,status=no'
                )
              }}
              className="inline-flex items-center gap-2 rounded-full border border-gold-400/50 px-4 py-2 text-sm font-medium text-gold-700 hover:bg-gold-50 transition-colors"
            >
              ▶ Presentar
            </button>
            <Button variant="primary" size="md" onClick={() => window.print()}>
              Guardar como PDF
            </Button>
          </div>
        </div>
      </header>

      {/* Viewer 3D — DIFERIDO hasta integración SketchUp/OpenCutList → CVC */}
      {/* <Viewer3DModal proyectoId={proyecto.id} /> */}

      {/* Hero editorial */}
      <section className="mx-auto max-w-7xl px-6 pt-12 pb-8 lg:pt-20 lg:pb-12">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-500">Propuesta comercial</p>
          <h2 className="font-display mt-5 text-[clamp(2.25rem,1.6rem+2.6vw,4.25rem)] leading-[0.96] tracking-[-0.03em] text-text-heading">
            {proyecto.nombreProyecto}
          </h2>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            {proyecto.direccionObra && <MetaItem icon={MapPin}>{proyecto.direccionObra}</MetaItem>}
            <MetaItem icon={Building2}>{proyecto.tipoProyecto}</MetaItem>
            <MetaItem icon={LayoutGrid}>
              {espaciosActivos.length} {espaciosActivos.length === 1 ? 'ambiente incluido' : 'ambientes incluidos'}
            </MetaItem>
          </div>
          <p className="mt-8 max-w-2xl text-base leading-7 text-text-muted">
            Revisa el alcance por ambiente, las alternativas seleccionadas y las referencias visuales.
            Los detalles técnicos se presentan solo cuando ayudan a tomar una decisión.
          </p>
          {espaciosActivos.length > 0 && (
            <button
              type="button"
              onClick={scrollToContenido}
              className="mt-6 inline-flex min-h-12 items-center gap-2.5 rounded-full border-2 border-gold-400 px-6 text-sm font-semibold text-gold-700 transition-colors duration-base hover:bg-gold-400 hover:text-white"
            >
              Ver propuesta <ArrowDown size={18} />
            </button>
          )}
        </div>
      </section>

      {/* NavegacionAmbientes — tabs sticky bajo el header */}
      {espaciosActivos.length > 0 && (
        <nav className="sticky top-[144px] z-nav bg-bg-paper/90 backdrop-blur-xl border-y border-border-subtle">
          <div className="mx-auto max-w-7xl px-6 py-3 flex flex-wrap gap-2">
            {espaciosActivos.map((esp, index) => (
              <button
                key={esp.id}
                ref={(el) => { seccionRefs.current[esp.id] = el }}
                type="button"
                onClick={() => {
                  setEspacioActivoId(esp.id)
                  setVarianteSeleccionadaId(null)
                }}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-fast ${
                  espacioIdActual === esp.id
                    ? 'bg-gold-500 text-white'
                    : 'bg-bg-raised border border-border-subtle text-text-heading hover:border-border-brand'
                }`}
              >
                <span className="mr-1.5 opacity-70 tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                {esp.nombreEspacio}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Layout principal: narrativa + sidebar */}
      <div id="contenido-propuesta" className="scroll-mt-24 mx-auto max-w-7xl px-6 py-10 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
        {/* Columna narrativa */}
        <div className="space-y-10 min-w-0">
          {varianteActual && (
            <>
              {/* Encabezado del espacio */}
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-500">
                    Ambiente {String(espaciosActivos.findIndex((e) => e.id === espacioIdActual) + 1).padStart(2, '0')}
                  </p>
                  <h2 className="font-display text-display-publico font-semibold text-text-heading mt-1">{varianteActual.nombreEspacio}</h2>
                  <p className="text-xs uppercase tracking-wide text-text-muted mt-1">{varianteActual.nombreVariante}</p>
                </div>
                {(() => {
                  const espTotal = contractualesActuales.reduce((s, it) => s + parseNum(it.totalLinea), 0)
                  const espMo =
                    parseNum(varianteActual.jornadasDesarrolloTecnico) * tarifaDev +
                    parseNum(varianteActual.jornadasEnsamblajeTaller) * tarifaAssembly +
                    parseNum(varianteActual.jornadasInstalacionObra) * tarifaInstall
                  const espSubtotal = espTotal + espMo
                  return espSubtotal > 0 ? (
                    <p className="text-right">
                      <span className="block text-[10px] uppercase tracking-[0.14em] text-text-muted">Inversión del ambiente</span>
                      <strong className="font-display block text-xl text-text-heading">{formatCOP(espSubtotal)}</strong>
                    </p>
                  ) : null
                })()}
              </div>

              {varianteActual.descripcion && (
                <p className="-mt-6 max-w-prose text-sm leading-6 text-text-muted">{varianteActual.descripcion}</p>
              )}

              {/* Colores */}
              {(varianteActual.colores as string[]).filter(Boolean).length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">Materiales y acabados</p>
                  <div className="flex flex-wrap gap-2">
                    {(varianteActual.colores as string[]).filter(Boolean).map((c) => (
                      <span key={c} className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-raised px-3 py-1 text-xs text-text-muted">
                        <span className="h-2 w-2 rounded-full bg-gold-400" />
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Carriles visuales: Diseño y/o Referencia (sin campos vacíos que contaminen el layout) */}
              {(() => {
                const fotosDisenio = toGalleryImages(varianteActual.fotosDisenio, varianteActual.nombreEspacio)
                const fotosReferencia = toGalleryImages(varianteActual.fotosReferencia, varianteActual.nombreEspacio)
                const tieneDisenio = fotosDisenio.length > 0
                const tieneReferencia = fotosReferencia.length > 0

                if (!tieneDisenio && !tieneReferencia) return null

                return (
                  <div className={tieneDisenio && tieneReferencia ? 'grid grid-cols-1 sm:grid-cols-[60%_40%] gap-4' : 'w-full'}>
                    {tieneDisenio && (
                      <GalleryRail
                        fotos={fotosDisenio}
                        etiqueta="Diseño"
                        onZoom={(imagenes, index) => setZoom({ imagenes: imagenes.map((im, i) => ({ url: im.url, alt: im.alt, id: `${index}-${i}` })), index })}
                      />
                    )}
                    {tieneReferencia && (
                      <GalleryRail
                        fotos={fotosReferencia}
                        etiqueta="Referencia"
                        onZoom={(imagenes, index) => setZoom({ imagenes: imagenes.map((im, i) => ({ url: im.url, alt: im.alt, id: `${index}-${i}` })), index })}
                      />
                    )}
                  </div>
                )
              })()}

              {/* SelectorVariantes */}
              {espacioActualVariantes.length > 1 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">Variantes</p>
                  <div className="flex flex-wrap gap-2">
                    {espacioActualVariantes.map((var_) => (
                      <button
                        key={var_.id}
                        type="button"
                        onClick={() => setVarianteSeleccionadaId(var_.id)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-fast ${
                          varianteSeleccionadaId === var_.id || (varianteSeleccionadaId === null && var_.activa)
                            ? 'bg-gold-500 text-white'
                            : 'bg-bg-raised border border-border-subtle text-text-heading hover:border-border-brand'
                        }`}
                      >
                        {var_.nombreVariante}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Qué incluye — ítems siempre visibles con imagen (ver nota de refinamiento arriba) */}
              <section>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-display text-xl text-text-heading">Qué incluye</h3>
                  <span className="text-xs text-text-muted">{contractualesActuales.length} items</span>
                </div>
                {contractualesActuales.length > 0 ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {contractualesActuales.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        producto={item.catalogoId ? catalogoPorId[item.catalogoId] : undefined}
                        onZoom={(imagenes, index) => setZoom({ imagenes, index })}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-text-muted">El alcance detallado se confirmará con el equipo comercial.</p>
                )}
              </section>

              {/* Desglose financiero técnico (MO + referenciales) — accordion cerrado por defecto */}
              <DetalleTecnico
                referenciales={referencialesActuales}
                jornadasDev={varianteActual.jornadasDesarrolloTecnico}
                jornadasEns={varianteActual.jornadasEnsamblajeTaller}
                jornadasInst={varianteActual.jornadasInstalacionObra}
                tarifaDev={tarifaDev}
                tarifaAssembly={tarifaAssembly}
                tarifaInstall={tarifaInstall}
              />
            </>
          )}

          {/* ResumenFinanciero — versión mobile (aparece en flujo, no sticky) */}
          <section id="resumen-movil" className="lg:hidden scroll-mt-24 rounded-lg border border-border-subtle bg-bg-raised p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-4">Inversión total</h2>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-text-muted">Materiales</span><span className="font-mono">{formatCOP(materialesTotal)}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Mano de obra</span><span className="font-mono">{formatCOP(moTotal)}</span></div>
              {moDev > 0 && <div className="flex justify-between pl-4 text-xs"><span className="text-text-muted">· Desarrollo técnico</span><span className="font-mono">{formatCOP(moDev)}</span></div>}
              {moEns > 0 && <div className="flex justify-between pl-4 text-xs"><span className="text-text-muted">· Ensamblaje</span><span className="font-mono">{formatCOP(moEns)}</span></div>}
              {moInst > 0 && <div className="flex justify-between pl-4 text-xs"><span className="text-text-muted">· Instalación</span><span className="font-mono">{formatCOP(moInst)}</span></div>}
              {costosOperativos > 0 && <div className="flex justify-between"><span className="text-text-muted">Costos operativos</span><span className="font-mono">{formatCOP(costosOperativos)}</span></div>}
              {imprevistos > 0 && <div className="flex justify-between"><span className="text-text-muted">Imprevistos</span><span className="font-mono">{formatCOP(imprevistos)}</span></div>}
              {descuento > 0 && <div className="flex justify-between"><span className="text-text-muted">Descuento</span><span className="font-mono text-red-600">−{formatCOP(descuento)}</span></div>}
              {ajuste !== 0 && <div className="flex justify-between"><span className="text-text-muted">Ajuste</span><span className="font-mono">{ajuste > 0 ? '+' : '−'}{formatCOP(Math.abs(ajuste))}</span></div>}
              {iva > 0 && <hr className="border-border-subtle my-2" />}
              {iva > 0 && <div className="flex justify-between text-sm"><span className="text-text-muted">Subtotal</span><span className="font-mono">{formatCOP(subtotal)}</span></div>}
              {iva > 0 && <div className="flex justify-between"><span className="text-text-muted">IVA ({proyecto.porcentajeIva}%)</span><span className="font-mono">{formatCOP(iva)}</span></div>}
              <hr className="border-border-subtle my-2" />
              <div className="flex justify-between items-baseline border-l-2 border-gold-400 pl-3">
                <span className="text-sm font-medium text-text-heading">Inversión total</span>
                <span className="font-display text-xl text-text-heading">{formatCOP(total)}</span>
              </div>
            </div>
          </section>

          {/* PlanPagos — solo si hay contrato (R7/CA-7/CA-8) */}
          {contrato && hitosList.length > 0 && (
            <section className="rounded-lg border border-border-subtle bg-bg-raised p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-3">Plan de pagos</h2>
              <div className="space-y-1">
                {hitosList.map((h) => (
                  <div key={h.id} className="flex justify-between text-sm border-b border-border-subtle/50 py-1.5 last:border-0">
                    <span>{h.orden}. {h.razon}</span>
                    <span className="font-mono">{h.tipo === 'percentage' ? `${h.montoOPorcentaje}%` : formatCOP(parseNum(h.montoOPorcentaje))}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-muted mt-3">Garantía: {contrato.garantiaAnios} años · Plazo: {contrato.plazoEjecucionTexto}</p>
            </section>
          )}
        </div>

        {/* Sidebar financiero — desktop únicamente, sticky */}
        <aside className="hidden lg:block">
          <div className="sticky top-[212px] space-y-6">
            <section className="rounded-lg border border-border-subtle bg-bg-raised p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-4">Inversión total</h2>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-text-muted">Materiales</span><span className="font-mono">{formatCOP(materialesTotal)}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Mano de obra</span><span className="font-mono">{formatCOP(moTotal)}</span></div>
                {moDev > 0 && <div className="flex justify-between pl-4 text-xs"><span className="text-text-muted">· Desarrollo técnico</span><span className="font-mono">{formatCOP(moDev)}</span></div>}
                {moEns > 0 && <div className="flex justify-between pl-4 text-xs"><span className="text-text-muted">· Ensamblaje</span><span className="font-mono">{formatCOP(moEns)}</span></div>}
                {moInst > 0 && <div className="flex justify-between pl-4 text-xs"><span className="text-text-muted">· Instalación</span><span className="font-mono">{formatCOP(moInst)}</span></div>}
                {costosOperativos > 0 && <div className="flex justify-between"><span className="text-text-muted">Costos operativos</span><span className="font-mono">{formatCOP(costosOperativos)}</span></div>}
                {imprevistos > 0 && <div className="flex justify-between"><span className="text-text-muted">Imprevistos</span><span className="font-mono">{formatCOP(imprevistos)}</span></div>}
                {descuento > 0 && <div className="flex justify-between"><span className="text-text-muted">Descuento</span><span className="font-mono text-red-600">−{formatCOP(descuento)}</span></div>}
                {ajuste !== 0 && <div className="flex justify-between"><span className="text-text-muted">Ajuste</span><span className="font-mono">{ajuste > 0 ? '+' : '−'}{formatCOP(Math.abs(ajuste))}</span></div>}
                {iva > 0 && <hr className="border-border-subtle my-2" />}
                {iva > 0 && <div className="flex justify-between text-sm"><span className="text-text-muted">Subtotal</span><span className="font-mono">{formatCOP(subtotal)}</span></div>}
                {iva > 0 && <div className="flex justify-between"><span className="text-text-muted">IVA ({proyecto.porcentajeIva}%)</span><span className="font-mono">{formatCOP(iva)}</span></div>}
                <hr className="border-border-subtle my-2" />
                <div className="border-l-2 border-gold-400 pl-3">
                  <span className="block text-xs font-medium text-text-muted">Inversión total</span>
                  <span className="font-display text-2xl text-text-heading">{formatCOP(total)}</span>
                </div>
              </div>
            </section>
          </div>
        </aside>
      </div>

      {/* Barra flotante móvil con acceso al resumen */}
      {total > 0 && (
        <a
          href="#resumen-movil"
          className="fixed inset-x-3 bottom-3 z-header flex min-h-14 items-center justify-between rounded-2xl border border-gold-400 bg-gold-700 px-4 text-white shadow-lg sm:hidden"
        >
          <span>
            <span className="block text-[10px] uppercase tracking-[0.14em] text-white/70">Inversión total</span>
            <strong className="text-sm">{formatCOP(total)}</strong>
          </span>
          <span className="text-sm font-medium">Ver resumen</span>
        </a>
      )}

      {zoom && (
        <GalleryOverlay
          imagenes={zoom.imagenes}
          initialIndex={zoom.index}
          onClose={() => setZoom(null)}
        />
      )}
    </div>
  )
}
