'use client'

import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import { ArrowDown, LayoutGrid, Wallet } from 'lucide-react'
import { MetaItem } from '@/components/veta/meta-item'
import { GalleryOverlay } from '@/components/veta/gallery-lightbox'
import { ProductSheetModal } from '@/components/veta/product-sheet-modal'
import type { GaleriaPropuestaFoto } from '@/components/veta/galeria-propuesta'
import {
  SidebarTreePropuesta,
  ResumenCostosPropuesta,
  type NodoEspacioPropuesta,
} from '@/components/veta/sidebar-tree-propuesta'
import type { EspacioVariante, GrupoItem, ItemVariante } from '@/lib/data'
import { textoPlazoSemanas } from '@/lib/data/contrato-fechas'
import type { CatalogoItemPublico, PropuestaPublicaData } from '@/lib/data/actions/public'
import { PropuestaPrintDocument } from './PropuestaPrintDocument'
import { EspacioPropuestaSeccion } from './EspacioPropuestaSeccion'

// F-08 Propuesta pública (disenio_F08_propuesta_publica.md). Ruta simplificada
// a /propuesta/[proyectoId] en vez de /propuesta/{slug}.
//
// Rediseño 2026-10-29 (scroll acumulativo): antes la pantalla mostraba un solo
// ambiente a la vez con tabs. Ahora el cliente baja por TODOS los ambientes en
// una sola página; un sidebar-árbol (SidebarTreePropuesta) señala en vivo el
// espacio grupo que se está leyendo y reemplaza el frame estático de "Inversión
// total". En móvil hay dos vistas conmutables desde la barra inferior: el scroll
// de espacios/ítems y el resumen-factura. Los ítems referenciales (terceros) NO
// entran a ningún total oficial: viven en el anexo "Cuadro de otros presupuestos".
//
// R1: snapshot de solo lectura, sin mutaciones. R5: sin botones de pago.

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function parseNum(s: string | null | undefined): number {
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

type ZoomImagen = { url: string; alt: string; id: string }

type VistaMovil = 'espacios' | 'resumen'

export function PropuestaPublicaClient({ data, banner }: { data: PropuestaPublicaData; banner?: ReactNode }) {
  const { proyecto, espacios: espaciosBase, items: todosLosItems, catalogoPorId, contrato, hitos: hitosList, tarifas } = data
  /** t-167: hidratado en vivo por el Server Component; puede no venir en snapshots antiguos. */
  const cliente = data.cliente ?? null
  const { tarifaDev, tarifaAssembly, tarifaInstall } = tarifas
  // Fallback []: snapshots publicados ANTES de t-157 (2026-09-10) no tienen esta clave.
  const gruposItemTodos = useMemo(() => data.gruposItem ?? [], [data.gruposItem])
  // t-172/t-175: acabados reales del espacio. `?? {}` para snapshots previos.
  const acabadosPorEspacio = useMemo(() => data.acabadosPorEspacio ?? {}, [data.acabadosPorEspacio])

  // Versión elegida por el cliente para cada ambiente (clave = nombreEspacio).
  const [variantesSeleccionadas, setVariantesSeleccionadas] = useState<Record<string, string>>({})
  const [zoom, setZoom] = useState<{ imagenes: ZoomImagen[]; index: number } | null>(null)
  const [tituloHeaderVisible, setTituloHeaderVisible] = useState(false)
  const [itemDetalle, setItemDetalle] = useState<{ item: ItemVariante; producto: CatalogoItemPublico | undefined } | null>(null)
  const [vistaMovil, setVistaMovil] = useState<VistaMovil>('espacios')
  const [enVista, setEnVista] = useState<{ espacioId: string | null; grupoId: string | null }>({
    espacioId: null,
    grupoId: null,
  })

  useEffect(() => {
    const handleScroll = () => {
      setTituloHeaderVisible(window.scrollY > 250)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Scroll-spy: marca el espacio/grupo que el cliente está leyendo. Los anclajes
  // están en el DOM en el mismo orden que se ven, así que basta con tomar el
  // último que ya cruzó el umbral superior.
  useEffect(() => {
    let raf = 0
    const medir = () => {
      raf = 0
      // Sólo anclas visibles: al conmutar a la vista resumen en móvil la
      // columna narrativa queda en display:none y no debe mover el resaltado.
      const anclas = Array.from(document.querySelectorAll<HTMLElement>('[data-pp-ancla]')).filter(
        (el) => el.offsetParent !== null,
      )
      if (anclas.length === 0) return
      let actual = anclas[0]
      for (const el of anclas) {
        if (el.getBoundingClientRect().top <= 160) actual = el
        else break
      }
      const espacioId = actual.dataset.ppEspacio ?? null
      const grupoId = actual.dataset.ppGrupo ?? null
      setEnVista((prev) =>
        prev.espacioId === espacioId && prev.grupoId === grupoId ? prev : { espacioId, grupoId },
      )
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(medir)
    }
    medir()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  const itemsPorVariante = useCallback(
    (varianteId: string): ItemVariante[] => todosLosItems.filter((it) => it.varianteId === varianteId),
    [todosLosItems],
  )

  // Solo la variante activa de cada espacio entra a la propuesta — alternativas
  // de comparación no son objeto de contrato. `visibleEnPropuestaPublica=false`
  // excluye la variante del todo (selector y comparador).
  const grupos = useMemo(() => {
    const map = new Map<string, EspacioVariante[]>()
    espaciosBase
      .filter((e) => e.visibleEnPropuestaPublica !== false)
      .forEach((e) => {
        const arr = map.get(e.nombreEspacio) ?? []
        arr.push(e)
        map.set(e.nombreEspacio, arr)
      })
    return map
  }, [espaciosBase])

  const espaciosActivos = useMemo(
    () => Array.from(grupos.values()).map((variantes) => variantes.find((v) => v.activa) ?? variantes[0]),
    [grupos],
  )

  const varianteProyectada = useCallback(
    (nombre: string, variantes: EspacioVariante[]): EspacioVariante => {
      const elegida = variantesSeleccionadas[nombre]
      return variantes.find((v) => v.id === elegida) ?? variantes.find((v) => v.activa) ?? variantes[0]
    },
    [variantesSeleccionadas],
  )

  // Proyección "what if": si el cliente eligió otra versión de un ambiente, los
  // totales globales reflejan ese escenario.
  const espaciosProyectados = useMemo(
    () => Array.from(grupos.entries()).map(([nombre, variantes]) => varianteProyectada(nombre, variantes)),
    [grupos, varianteProyectada],
  )

  const totalAmbiente = useCallback(
    (esp: EspacioVariante): number => {
      const mat = itemsPorVariante(esp.id)
        .filter((it) => !it.esReferencial)
        .reduce((s, it) => s + parseNum(it.totalLinea), 0)
      const mo =
        parseNum(esp.jornadasDesarrolloTecnico) * tarifaDev +
        parseNum(esp.jornadasEnsamblajeTaller) * tarifaAssembly +
        parseNum(esp.jornadasInstalacionObra) * tarifaInstall
      return mat + mo
    },
    [itemsPorVariante, tarifaDev, tarifaAssembly, tarifaInstall],
  )

  const { materialesTotal, moDev, moEns, moInst, moTotal, subtotal, total, iva, costosOperativos, imprevistos, descuento, ajuste } = useMemo(() => {
    let mTotal = 0
    let vDev = 0
    let vEns = 0
    let vInst = 0

    espaciosProyectados.forEach((esp) => {
      const contractuales = itemsPorVariante(esp.id).filter((it) => !it.esReferencial)
      mTotal += contractuales.reduce((s, it) => s + parseNum(it.totalLinea), 0)
      vDev += parseNum(esp.jornadasDesarrolloTecnico) * tarifaDev
      vEns += parseNum(esp.jornadasEnsamblajeTaller) * tarifaAssembly
      vInst += parseNum(esp.jornadasInstalacionObra) * tarifaInstall
    })

    const mOperativos = parseNum(proyecto.costosOperativos)
    const mImprevistos = parseNum(proyecto.imprevistosInstalacion)
    const mDescuento = parseNum(proyecto.descuentoComercial)
    const mAjuste = parseNum(proyecto.ajusteArbitrario)

    const moT = vDev + vEns + vInst
    const sTotal = mTotal + moT + mOperativos + mImprevistos - mDescuento + mAjuste
    const mIva = proyecto.aplicaIva ? Math.round(sTotal * (parseNum(proyecto.porcentajeIva) / 100)) : 0

    return {
      materialesTotal: mTotal,
      moDev: vDev,
      moEns: vEns,
      moInst: vInst,
      moTotal: moT,
      costosOperativos: mOperativos,
      imprevistos: mImprevistos,
      descuento: mDescuento,
      ajuste: mAjuste,
      subtotal: sTotal,
      iva: mIva,
      total: sTotal + mIva,
    }
  }, [espaciosProyectados, itemsPorVariante, tarifaDev, tarifaAssembly, tarifaInstall, proyecto])

  // Árbol del sidebar: espacio + grupos/subgrupos + versiones, con su valor.
  const nodos = useMemo<NodoEspacioPropuesta[]>(() => {
    return Array.from(grupos.entries()).map(([nombre, variantes]) => {
      const esp = varianteProyectada(nombre, variantes)
      const itemsEsp = todosLosItems.filter((it) => it.varianteId === esp.id && !it.esReferencial)
      const gruposEsp = gruposItemTodos.filter((g) => g.espacioVarianteId === esp.id)

      const sumaGrupo = (grupoId: string): number => {
        const propios = itemsEsp
          .filter((it) => it.grupoItemId === grupoId)
          .reduce((s, it) => s + parseNum(it.totalLinea), 0)
        const hijos = gruposEsp.filter((g) => g.padreId === grupoId)
        return propios + hijos.reduce((s, h) => s + sumaGrupo(h.id), 0)
      }

      const construir = (g: GrupoItem): NodoEspacioPropuesta['grupos'][number] => ({
        id: g.id,
        nombre: g.nombre,
        total: sumaGrupo(g.id),
        hijos: gruposEsp
          .filter((h) => h.padreId === g.id)
          .sort((a, b) => a.orden - b.orden)
          .map(construir),
      })

      return {
        id: esp.id,
        nombre,
        total: totalAmbiente(esp),
        grupos: gruposEsp.filter((g) => !g.padreId).sort((a, b) => a.orden - b.orden).map(construir),
        variantes: variantes.map((v) => ({
          id: v.id,
          nombre: v.nombreVariante,
          total: totalAmbiente(v),
          esContractual: v.activa,
        })),
      }
    })
  }, [grupos, varianteProyectada, todosLosItems, gruposItemTodos, totalAmbiente])

  // Anexo "Cuadro de otros presupuestos": referenciales con terceros. Se
  // mantienen completamente fuera de los valores oficiales de la cotización.
  const anexo = useMemo(() => {
    const filas: Array<{ id: string; espacio: string; grupo: string; nombre: string; valor: number }> = []
    espaciosProyectados.forEach((esp) => {
      todosLosItems
        .filter((it) => it.varianteId === esp.id && it.esReferencial && !it.anulado)
        .forEach((it) => {
          const producto = it.catalogoId ? catalogoPorId[it.catalogoId] : undefined
          filas.push({
            id: it.id,
            espacio: esp.nombreEspacio,
            grupo: it.grupoReferencial?.trim() || 'Otros',
            nombre: it.nombrePersonalizado ?? producto?.descripcion ?? 'Ítem',
            valor: parseNum(it.totalLinea),
          })
        })
    })
    const mapa = new Map<string, typeof filas>()
    filas.forEach((f) => {
      const arr = mapa.get(f.grupo) ?? []
      arr.push(f)
      mapa.set(f.grupo, arr)
    })
    return { filas, porGrupo: Array.from(mapa.entries()), total: filas.reduce((s, f) => s + f.valor, 0) }
  }, [espaciosProyectados, todosLosItems, catalogoPorId])

  const irA = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const elegirVariante = (nombreEspacio: string, varianteId: string) => {
    setVariantesSeleccionadas((prev) => ({ ...prev, [nombreEspacio]: varianteId }))
    // El ancla de la sección cambia con la versión elegida; esperar al commit.
    setTimeout(() => irA(`espacio-${varianteId}`), 0)
  }

  const scrollToContenido = () => {
    document.getElementById('contenido-propuesta')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // ── Receptor BroadcastChannel para modo presentación (ZN-004) ──
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return
    const canal = new BroadcastChannel(`presentacion-${proyecto.id}`)
    canal.onmessage = (ev: MessageEvent<{ tipo: string; espacioId: string }>) => {
      if (ev.data?.tipo === 'ir_a') {
        document
          .getElementById(`espacio-${ev.data.espacioId}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    return () => canal.close()
  }, [proyecto.id])

  const costos = useMemo(
    () => ({
      materialesTotal,
      moTotal,
      moDev,
      moEns,
      moInst,
      costosOperativos,
      imprevistos,
      descuento,
      ajuste,
      subtotal,
      iva,
      porcentajeIva: parseNum(proyecto.porcentajeIva),
      total,
    }),
    [
      materialesTotal,
      moTotal,
      moDev,
      moEns,
      moInst,
      costosOperativos,
      imprevistos,
      descuento,
      ajuste,
      subtotal,
      iva,
      proyecto.porcentajeIva,
      total,
    ],
  )

  const sidebar = (
    <SidebarTreePropuesta
      nodos={nodos}
      costos={costos}
      espacioActivoId={enVista.espacioId}
      grupoActivoId={enVista.grupoId}
      onIrEspacio={(id) => irA(`espacio-${id}`)}
      onIrGrupo={(id) => irA(`grupo-${id}`)}
      onElegirVariante={elegirVariante}
    />
  )

  return (
    <>
      {/* UI interactiva: nunca entra a la hoja. El papel lo arma PropuestaPrintDocument. */}
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_var(--color-bg-alt)_0%,_var(--color-bg-paper)_40%,_var(--color-bg-paper)_100%)] print:hidden">
        {banner}

        {/* HeaderPropuesta — sticky (top-16: se acopla debajo del header de AppShell, h-16) */}
        <header className="sticky top-16 z-header border-b border-border-subtle bg-bg-paper/90 backdrop-blur-xl print:static print:bg-transparent">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
            <div className={`transition-all duration-500 ease-out ${tituloHeaderVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'}`}>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold-500">Propuesta</p>
              <h1 className="mt-0.5 font-display text-2xl font-semibold text-text-heading">{proyecto.nombreProyecto}</h1>
            </div>
            <div className="flex items-center gap-2 print:hidden"></div>
          </div>
        </header>

        {/* Hero editorial — sólo título, cantidad de ambientes y (escritorio) valor total. */}
        <section className="mx-auto max-w-7xl px-6 pb-8 pt-12 lg:pb-12 lg:pt-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-500">Propuesta comercial</p>
            <h2 className="mt-5 font-display text-[clamp(2.25rem,1.6rem+2.6vw,4.25rem)] leading-[0.96] tracking-[-0.03em] text-text-heading">
              {proyecto.nombreProyecto}
            </h2>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
              <MetaItem icon={LayoutGrid}>
                {espaciosActivos.length} {espaciosActivos.length === 1 ? 'ambiente incluido' : 'ambientes incluidos'}
              </MetaItem>
              {total > 0 && (
                <div className="inline-flex items-center gap-1.5 text-sm text-text-muted">
                  <Wallet size={16} strokeWidth={1.75} className="shrink-0 text-gold-400" />
                  <span className="block text-[10px] uppercase tracking-[0.14em] text-text-muted">Inversión total</span>
                  <strong className="text-sm text-text-heading">{formatCOP(total)}</strong>
                </div>
              )}
            </div>

            {/* t-167: la propuesta es un documento que después se anexa al contrato. */}
            {cliente && (
              <div className="mt-8 rounded-lg border border-border-subtle bg-bg-raised p-5 print:border-neutral-300">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-text-muted">Preparada para</p>
                <p className="mt-2 font-display text-xl text-text-heading">{cliente.nombre}</p>
                <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
                  {cliente.documento && (
                    <div className="flex gap-2">
                      <dt className="text-text-muted">Identificación:</dt>
                      <dd className="text-text-primary">{cliente.documento}</dd>
                    </div>
                  )}
                  {cliente.telefono && (
                    <div className="flex gap-2">
                      <dt className="text-text-muted">Teléfono:</dt>
                      <dd className="text-text-primary">{cliente.telefono}</dd>
                    </div>
                  )}
                  {cliente.email && (
                    <div className="flex gap-2">
                      <dt className="text-text-muted">Correo:</dt>
                      <dd className="break-all text-text-primary">{cliente.email}</dd>
                    </div>
                  )}
                  {cliente.domicilio && (
                    <div className="flex gap-2">
                      <dt className="text-text-muted">Domicilio:</dt>
                      <dd className="text-text-primary">{cliente.domicilio}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

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

        {/* Contenido: scroll acumulativo + sidebar árbol */}
        <div id="contenido-propuesta" className="mx-auto grid max-w-7xl scroll-mt-24 grid-cols-1 gap-10 px-6 py-10 lg:grid-cols-[1fr_320px]">
          {/* Columna narrativa — todos los ambientes apilados */}
          <div className={`min-w-0 space-y-16 ${vistaMovil === 'resumen' ? 'hidden lg:block' : ''}`}>
            {Array.from(grupos.entries()).map(([nombreEspacio, variantes], index) => (
              <EspacioPropuestaSeccion
                key={nombreEspacio}
                indice={index}
                nombreEspacio={nombreEspacio}
                variantes={variantes}
                varianteActual={varianteProyectada(nombreEspacio, variantes)}
                items={todosLosItems}
                gruposTodos={gruposItemTodos}
                catalogoPorId={catalogoPorId}
                acabados={acabadosPorEspacio}
                tarifas={tarifas}
                onSeleccionarVariante={(varianteId) =>
                  setVariantesSeleccionadas((prev) => ({ ...prev, [nombreEspacio]: varianteId }))
                }
                onZoom={(fotos: GaleriaPropuestaFoto[], idx) =>
                  setZoom({
                    imagenes: fotos.map((f, i) => ({ url: f.url, alt: f.alt, id: `${idx}-${i}` })),
                    index: idx,
                  })
                }
                onDetalle={(item, producto) => setItemDetalle({ item, producto })}
              />
            ))}

            {/* PlanPagos — solo si hay contrato (R7/CA-7/CA-8) */}
            {contrato && hitosList.length > 0 && (
              <section className="rounded-lg border border-border-subtle bg-bg-raised p-6 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">Plan de pagos</h2>
                <div className="space-y-1">
                  {hitosList.map((h) => (
                    <div key={h.id} className="flex justify-between border-b border-border-subtle/50 py-1.5 text-sm last:border-0">
                      <span>{h.orden}. {h.razon}</span>
                      <span className="font-mono">
                        {h.tipo === 'percentage' ? `${h.montoOPorcentaje}%` : formatCOP(parseNum(h.montoOPorcentaje))}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-text-muted">
                  Garantía: {contrato.garantiaAnios} años · Plazo:{' '}
                  {textoPlazoSemanas(contrato.plazoSemanas)
                    ?? contrato.plazoEjecucionTexto
                    ?? 'el acordado con el Contratista'}
                </p>
              </section>
            )}

            {/* Filas extra de costos al final del scroll — sólo móvil: en escritorio
                viven en el sidebar sticky. */}
            <section className="lg:hidden">
              <ResumenCostosPropuesta costos={costos} />
            </section>
          </div>

          {/* Sidebar móvil (vista factura) — se conmuta desde la barra inferior */}
          <div className={`lg:hidden ${vistaMovil === 'resumen' ? 'block' : 'hidden'}`}>{sidebar}</div>

          {/* Sidebar escritorio — sticky */}
          <aside className="hidden lg:block">
            <div className="sticky top-36 max-h-[calc(100vh-10rem)] overflow-y-auto pr-1">{sidebar}</div>
          </aside>
        </div>

        {/* Anexo: otros presupuestos (referenciales). Fuera de todo valor oficial. */}
        {anexo.filas.length > 0 && (
          <section className={`mx-auto max-w-7xl px-6 pb-28 ${vistaMovil === 'resumen' ? 'hidden lg:block' : ''}`}>
            <div className="rounded-lg border border-dashed border-border-subtle bg-bg-raised/60 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold-500">Anexo</p>
              <h2 className="mt-1 font-display text-xl text-text-heading">Cuadro de otros presupuestos</h2>
              <p className="mt-1 max-w-2xl text-sm text-text-muted">
                Estimación de elementos y servicios con terceros. Estos valores no afectan ni aparecen en
                los totales oficiales de esta cotización.
              </p>
              <div className="mt-5 space-y-4">
                {anexo.porGrupo.map(([grupo, filas]) => (
                  <div key={grupo}>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-muted">{grupo}</p>
                    {filas.map((f) => (
                      <div key={f.id} className="flex justify-between gap-3 border-b border-border-subtle/50 py-1 text-sm">
                        <span className="min-w-0 text-text-primary">
                          {f.nombre}
                          <span className="ml-2 text-xs text-text-muted">· {f.espacio}</span>
                        </span>
                        <span className="shrink-0 font-mono tabular-nums">{formatCOP(f.valor)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-baseline justify-between border-t border-border-subtle pt-3">
                <span className="text-sm font-medium text-text-heading">Total otros presupuestos</span>
                <span className="font-display text-lg text-text-heading">{formatCOP(anexo.total)}</span>
              </div>
            </div>
          </section>
        )}

        {zoom && (
          <GalleryOverlay
            imagenes={zoom.imagenes}
            initialIndex={zoom.index}
            onClose={() => setZoom(null)}
          />
        )}

        {itemDetalle && (
          <ProductSheetModal
            item={itemDetalle.item}
            producto={itemDetalle.producto}
            onClose={() => setItemDetalle(null)}
          />
        )}
      </div>

      {/* Documento de papel */}
      <PropuestaPrintDocument data={data} />
    </>
  )
}
