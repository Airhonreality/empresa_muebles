'use client'

import { useParams } from 'next/navigation'
import { Badge } from '@/components/veta/badge'
import { Button } from '@/components/veta/button'
import { useDataStore, type EspacioVariante, type ItemVariante } from '@/lib/data'
import { PARAMETROS_DEFAULT, type ParametrosJornadas } from '@/lib/modules/finanzas'

// F-08 Propuesta pública (disenio_F08_propuesta_publica.md). Ruta simplificada
// a /propuesta/[proyectoId] en vez de /propuesta/{slug} — Proyecto no tiene
// campo slug todavía en F10 (gap anotado, no bloqueante: agregar slug es
// trabajo de la migración real, no cambia nada del diseño de esta pantalla).
// R1: snapshot de solo lectura, sin mutaciones. R5: sin botones de pago.

const HORAS_POR_JORNADA = 8

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

export default function PropuestaPublicaPage() {
  const params = useParams()
  const proyectoId = params.proyectoId as string
  const store = useDataStore()

  const proyecto = store.proyectos.obtenerPorId(proyectoId)
  const espaciosBase = proyecto ? store.espacios.porProyecto(proyecto.id) : []
  const contrato = proyecto ? store.contratos.porProyecto(proyecto.id) : undefined
  const hitosList = contrato ? store.hitos.porContrato(contrato.id) : []

  if (!proyecto) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="text-text-muted">Propuesta no encontrada.</p>
      </div>
    )
  }

  // R2: proyección de campos públicos únicamente — sin id interno, costo,
  // margen ni proveedor_id en ningún dato que se renderiza abajo.
  // R3: MO calculada en runtime desde parametros, nunca guardada en snapshot.
  const p = (clave: string) => store.parametros.obtenerPorClave(clave)?.valorTexto ?? store.parametros.obtenerPorClave(clave)?.valorNumeric ?? null
  const valorHora: ParametrosJornadas['valorHoraPorRol'] = {
    desarrollador: p('valor_hora_desarrollador') ?? PARAMETROS_DEFAULT.jornadas.valorHoraPorRol.desarrollador,
    carpintero: p('valor_hora_carpintero') ?? PARAMETROS_DEFAULT.jornadas.valorHoraPorRol.carpintero,
    auxiliar: p('valor_hora_auxiliar') ?? PARAMETROS_DEFAULT.jornadas.valorHoraPorRol.auxiliar,
  }
  const tarifaDev = parseNum(valorHora.desarrollador) * HORAS_POR_JORNADA
  const tarifaAssembly = parseNum(valorHora.carpintero) * HORAS_POR_JORNADA
  const tarifaInstall = parseNum(valorHora.auxiliar) * HORAS_POR_JORNADA

  // Solo la variante activa de cada espacio entra a la propuesta — igual regla
  // que el cotizador: alternativas de comparación no son objeto de contrato.
  const grupos = new Map<string, EspacioVariante[]>()
  espaciosBase.forEach((e) => {
    const arr = grupos.get(e.nombreEspacio) ?? []
    arr.push(e)
    grupos.set(e.nombreEspacio, arr)
  })
  const espaciosActivos = Array.from(grupos.values()).map((variantes) => variantes.find((v) => v.activa) ?? variantes[0])

  let materialesTotal = 0
  let moDev = 0
  let moEns = 0
  let moInst = 0
  const itemsPorEspacio = new Map<string, { contractuales: ItemVariante[]; referenciales: ItemVariante[] }>()
  espaciosActivos.forEach((esp) => {
    const items = store.items.porVariante(esp.id)
    const contractuales = items.filter((it) => !it.esReferencial)
    const referenciales = items.filter((it) => it.esReferencial)
    itemsPorEspacio.set(esp.id, { contractuales, referenciales })
    materialesTotal += contractuales.reduce((s, it) => s + parseNum(it.totalLinea), 0)
    moDev += parseNum(esp.jornadasDesarrolloTecnico) * tarifaDev
    moEns += parseNum(esp.jornadasEnsamblajeTaller) * tarifaAssembly
    moInst += parseNum(esp.jornadasInstalacionObra) * tarifaInstall
  })
  const moTotal = moDev + moEns + moInst

  const costosOperativos = parseNum(proyecto.costosOperativos)
  const imprevistos = parseNum(proyecto.imprevistosInstalacion)
  const descuento = parseNum(proyecto.descuentoComercial)
  const ajuste = parseNum(proyecto.ajusteArbitrario)
  const subtotal = materialesTotal + moTotal + costosOperativos + imprevistos - descuento + ajuste
  const iva = proyecto.aplicaIva ? Math.round(subtotal * (parseNum(proyecto.porcentajeIva) / 100)) : 0
  const total = subtotal + iva

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* HeaderPropuesta */}
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">Propuesta</p>
          <h1 className="font-display text-3xl font-semibold text-text-heading mt-1">{proyecto.nombreProyecto}</h1>
          {proyecto.direccionObra && <p className="text-sm text-text-muted mt-1">{proyecto.direccionObra}</p>}
        </div>
        <Button variant="primary" size="md" onClick={() => window.print()}>
          Guardar como PDF
        </Button>
      </header>

      {/* Viewer 3D — DIFERIDO hasta integración SketchUp/OpenCutList → CVC */}
      {/* <Viewer3DModal proyectoId={proyecto.id} /> */}

      {/* NavegacionAmbientes + ListaItems + ItemsReferenciales por espacio */}
      <section className="mb-8 space-y-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Ambientes</h2>
        {espaciosActivos.map((esp) => {
          const { contractuales, referenciales } = itemsPorEspacio.get(esp.id) ?? { contractuales: [], referenciales: [] }
          const colores = (esp.colores as string[]).filter(Boolean)
          return (
            <div key={esp.id} className="rounded-lg border border-border-subtle bg-bg-raised p-5">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display text-lg font-medium text-text-heading">{esp.nombreEspacio}</h3>
                <Badge tone="neutral">{esp.nombreVariante}</Badge>
              </div>
              {esp.descripcion && <p className="text-sm text-text-muted mb-3">{esp.descripcion}</p>}
              {colores.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {colores.map((c) => (
                    <span key={c} className="rounded-full border border-border-subtle bg-bg-paper px-2 py-0.5 text-xs text-text-muted">{c}</span>
                  ))}
                </div>
              )}

              {/* Ítems incluidos */}
              <div className="space-y-1">
                {contractuales.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm border-b border-border-subtle/50 py-1.5 last:border-0">
                    <span className="text-text-heading">{item.nombrePersonalizado ?? 'Ítem'} <span className="text-text-muted">× {item.cantidad}</span></span>
                    <span className="font-mono text-text-heading">{formatCOP(parseNum(item.totalLinea))}</span>
                  </div>
                ))}
              </div>

              {/* Estimado referencial — fuera del total */}
              {referenciales.length > 0 && (
                <div className="mt-3 border-t border-dashed border-amber-300 pt-3">
                  <p className="text-[11px] font-semibold uppercase text-amber-700 mb-1.5">Estimado referencial</p>
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
                        <div key={it.id} className="flex justify-between text-xs text-text-muted pl-2">
                          <span>{it.nombrePersonalizado ?? 'Ítem'}</span>
                          <span className="font-mono">{formatCOP(parseNum(it.totalLinea))}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  <p className="text-[11px] text-text-muted italic mt-1">Inversión estimada con terceros — no incluida en el total.</p>
                </div>
              )}
            </div>
          )
        })}
      </section>

      {/* DesgloseMO */}
      <section className="mb-8 rounded-lg border border-border-subtle bg-bg-raised p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-3">Mano de obra</h2>
        <div className="grid gap-2 text-sm sm:grid-cols-3">
          <p className="text-text-muted">Desarrollo técnico <span className="block font-mono text-text-heading">{formatCOP(moDev)}</span></p>
          <p className="text-text-muted">Ensamblaje <span className="block font-mono text-text-heading">{formatCOP(moEns)}</span></p>
          <p className="text-text-muted">Instalación <span className="block font-mono text-text-heading">{formatCOP(moInst)}</span></p>
        </div>
      </section>

      {/* ResumenFinanciero */}
      <section className="mb-8 rounded-lg border border-border-subtle bg-bg-paper p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-4">Inversión total</h2>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-text-muted">Materiales</span><span className="font-mono">{formatCOP(materialesTotal)}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Mano de obra</span><span className="font-mono">{formatCOP(moTotal)}</span></div>
          {iva > 0 && <div className="flex justify-between"><span className="text-text-muted">IVA ({proyecto.porcentajeIva}%)</span><span className="font-mono">{formatCOP(iva)}</span></div>}
          <hr className="border-border-subtle my-2" />
          <div className="flex justify-between text-lg font-semibold"><span>Inversión total</span><span className="font-mono text-brand">{formatCOP(total)}</span></div>
        </div>
      </section>

      {/* PlanPagos — solo si hay contrato (R7/CA-7/CA-8) */}
      {contrato && hitosList.length > 0 && (
        <section className="rounded-lg border border-border-subtle bg-bg-raised p-6">
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
  )
}
