'use client'

import Image from 'next/image'
import { ArrowRight, Check, Info, Plus } from 'lucide-react'
import type { CatalogoAcabado } from '@/lib/data/contracts'
import type { DiffEspacio, ItemComparado } from '@/lib/propuesta/comparar-variantes'

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatQty(n: number): string {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(n)
}

interface VersionPick {
  id: string
  etiqueta: string
  esContractual: boolean
  total: number
}

interface Props {
  diff: DiffEspacio
  variantes: VersionPick[]
  comparadaId: string
  onCambiarComparada: (id: string) => void
  onElegir: (varianteId: string) => void
  onVolver: () => void
}

function EstadoTag({ tono, children }: { tono: 'cambia' | 'neutro' | 'igual'; children: React.ReactNode }) {
  const clases =
    tono === 'cambia'
      ? 'border-gold-400/60 bg-gold-50 text-gold-700'
      : tono === 'neutro'
        ? 'border-warning-stroke/40 bg-warning-fill text-warning-text'
        : 'border-border-subtle bg-bg-alt text-text-muted'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${clases}`}>
      {children}
    </span>
  )
}

function EtiquetaEstado({ estado, nombreA, nombreB }: { estado: ItemComparado['estado']; nombreA: string; nombreB: string }) {
  if (estado === 'soloA') {
    return (
      <EstadoTag tono="neutro">
        <Info size={12} /> Solo en {nombreA}
      </EstadoTag>
    )
  }
  if (estado === 'soloB') {
    return (
      <EstadoTag tono="neutro">
        <Plus size={12} /> Solo en {nombreB}
      </EstadoTag>
    )
  }
  return (
    <EstadoTag tono="cambia">
      <ArrowRight size={12} /> Cambia
    </EstadoTag>
  )
}

function Swatch({ acabado }: { acabado: CatalogoAcabado | null }) {
  if (!acabado) return <span className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border border-dashed border-border-subtle text-text-muted">—</span>
  return (
    <span
      className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm border border-border-subtle"
      style={acabado.imagenTexturaUrl ? undefined : { background: acabado.colorHex ?? '#D9D4CC' }}
    >
      {acabado.imagenTexturaUrl ? <Image src={acabado.imagenTexturaUrl} alt="" fill unoptimized className="object-cover" /> : null}
    </span>
  )
}

function FilaItem({ fila, nombreA, nombreB }: { fila: ItemComparado; nombreA: string; nombreB: string }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-bg-raised p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-text-heading">{fila.nombre}</p>
        <EtiquetaEstado estado={fila.estado} nombreA={nombreA} nombreB={nombreB} />
      </div>
      {fila.estado === 'cambia' && (
        <div className="mt-1.5 space-y-0.5 text-xs text-text-muted">
          {(fila.cantidadA !== fila.cantidadB || fila.precioA !== fila.precioB) && (
            <p>
              {fila.cantidadA !== fila.cantidadB && (
                <span>
                  Cantidad: {formatQty(fila.cantidadA)} <ArrowRight size={10} className="inline" /> {formatQty(fila.cantidadB)} ·{' '}
                </span>
              )}
              {fila.precioA !== fila.precioB && (
                <span>
                  {formatCOP(fila.precioA)} <ArrowRight size={10} className="inline" /> {formatCOP(fila.precioB)}
                </span>
              )}
            </p>
          )}
          {fila.atributosCambiados.map((a) => (
            <p key={a.etiqueta}>
              <span className="font-medium">{a.etiqueta}:</span> {a.valorA ?? '—'} <ArrowRight size={10} className="inline" />{' '}
              {a.valorB ?? '—'}
            </p>
          ))}
          {fila.confianzaBaja && <p className="italic text-text-muted/70">Probablemente el mismo elemento.</p>}
        </div>
      )}
      {fila.estado !== 'cambia' && fila.precioA + fila.precioB > 0 && (
        <p className="mt-1 text-xs text-text-muted">{formatCOP(fila.precioA || fila.precioB)}</p>
      )}
    </div>
  )
}

function Bloque({
  titulo,
  resumen,
  igual,
  children,
}: {
  titulo: string
  resumen: string
  igual: boolean
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border border-border-subtle bg-bg-paper p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="font-display text-base text-text-heading">{titulo}</h4>
        <span className={`text-xs ${igual ? 'text-text-muted' : 'font-medium text-gold-700'}`}>{resumen}</span>
      </div>
      {children}
    </section>
  )
}

export function ComparadorVersiones({ diff, variantes, comparadaId, onCambiarComparada, onElegir, onVolver }: Props) {
  const nombreA = diff.a.nombreVariante || 'tu versión cotizada'
  const nombreB = diff.b.nombreVariante || 'la otra versión'
  const { dimensiones: d } = diff

  const contrapartes = variantes.filter((v) => !v.esContractual)

  return (
    <div className="mt-2 rounded-xl border border-gold-400/50 bg-bg-alt/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-500">Comparación de versiones</p>
          <h3 className="font-display mt-1 text-xl text-text-heading">
            {nombreA} <ArrowRight size={16} className="inline text-gold-500" /> {nombreB}
          </h3>
          <p className="mt-1 text-xs text-text-muted">
            La comparación se mide siempre contra tu versión cotizada ({nombreA}).
          </p>
        </div>
        <button
          type="button"
          onClick={onVolver}
          className="rounded-full border border-border-subtle bg-bg-raised px-4 py-1.5 text-sm font-medium text-text-heading hover:border-border-brand"
        >
          Ver una sola versión
        </button>
      </div>

      {contrapartes.length > 1 && (
        <div className="mt-4">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Comparar contra</p>
          <div className="flex flex-wrap gap-2">
            {contrapartes.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => onCambiarComparada(v.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  comparadaId === v.id
                    ? 'bg-gold-500 text-white'
                    : 'border border-border-subtle bg-bg-raised text-text-heading hover:border-border-brand'
                }`}
              >
                {v.etiqueta} · {formatCOP(v.total)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 rounded-lg border border-border-subtle bg-bg-raised p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-text-muted">Inversión del ambiente</span>
          <span className="font-display text-lg text-text-heading">
            {formatCOP(diff.a.total)} <ArrowRight size={14} className="inline text-gold-500" /> {formatCOP(diff.b.total)}
          </span>
        </div>
        {diff.deltaTotal !== 0 && (
          <p className={`mt-1 text-right text-sm font-medium ${diff.deltaTotal > 0 ? 'text-gold-700' : 'text-warning-text'}`}>
            {diff.deltaTotal > 0 ? '+' : '−'}
            {formatCOP(Math.abs(diff.deltaTotal))}
            {diff.deltaTotalPct !== null ? ` (${diff.deltaTotalPct > 0 ? '+' : ''}${diff.deltaTotalPct}%)` : ''}
          </p>
        )}
      </div>

      {diff.sinDiferencias && (
        <p className="mt-4 rounded-lg border border-border-subtle bg-bg-raised p-4 text-sm text-text-muted">
          Estas dos versiones son equivalentes. Puedes dejar solo una visible para tu cliente.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {d.acabados.presente && (
          <Bloque titulo="Materiales y acabados" resumen={d.acabados.resumen} igual={d.acabados.igual}>
            <div className="space-y-2">
              {[...d.acabados.detalle.cambian, ...d.acabados.detalle.exclusivos].map((fila, i) => (
                <div key={i} className="flex flex-wrap items-center gap-3 rounded-lg border border-border-subtle bg-bg-raised p-3">
                  <div className="flex items-center gap-2">
                    <Swatch acabado={fila.acabadoA} />
                    {fila.estado === 'cambia' && <ArrowRight size={14} className="text-gold-500" />}
                    {fila.estado !== 'soloA' && <Swatch acabado={fila.acabadoB} />}
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-medium text-text-heading">{fila.nombreB ?? fila.nombreA}</p>
                    {fila.estado === 'cambia' ? (
                      <p className="text-xs text-text-muted">
                        Destino: {fila.destinoA ?? '—'} <ArrowRight size={10} className="inline" /> {fila.destinoB ?? '—'}
                      </p>
                    ) : (
                      <p className="text-xs italic text-text-muted/80">
                        {fila.estado === 'soloA' ? `Solo en ${nombreA}` : `Solo en ${nombreB}`}
                        {fila.destinoA || fila.destinoB ? ` · ${fila.destinoA ?? fila.destinoB}` : ''}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {d.acabados.detalle.comunes > 0 && (
                <p className="flex items-center gap-1 text-xs text-text-muted">
                  <Check size={12} /> {d.acabados.detalle.comunes} acabado(s) idéntico(s)
                </p>
              )}
            </div>
          </Bloque>
        )}

        {d.items.presente && (
          <Bloque titulo="Qué incluye" resumen={d.items.resumen} igual={d.items.igual}>
            <div className="grid gap-2 sm:grid-cols-2">
              {[...d.items.detalle.cambian, ...d.items.detalle.soloA, ...d.items.detalle.soloB].map((fila, i) => (
                <FilaItem key={i} fila={fila} nombreA={nombreA} nombreB={nombreB} />
              ))}
            </div>
            {d.items.detalle.comunes > 0 && (
              <p className="mt-2 flex items-center gap-1 text-xs text-text-muted">
                <Check size={12} /> {d.items.detalle.comunes} elemento(s) idéntico(s)
              </p>
            )}
          </Bloque>
        )}

        {d.jornadas.presente && !d.jornadas.igual && (
          <Bloque titulo="Mano de obra" resumen={d.jornadas.resumen} igual={d.jornadas.igual}>
            <div className="space-y-1 text-sm">
              {d.jornadas.detalle.filas
                .filter((f) => f.delta !== 0)
                .map((f) => (
                  <div key={f.clave} className="flex justify-between">
                    <span className="text-text-muted">{f.etiqueta}</span>
                    <span className="font-mono">
                      {formatQty(f.a)} <ArrowRight size={10} className="inline" /> {formatQty(f.b)} jornadas{' '}
                      <span className="text-gold-700">
                        ({f.deltaCOP > 0 ? '+' : '−'}
                        {formatCOP(Math.abs(f.deltaCOP))})
                      </span>
                    </span>
                  </div>
                ))}
            </div>
          </Bloque>
        )}

        {d.descripcion.presente && (
          <Bloque titulo="Descripción del diseño" resumen={d.descripcion.resumen} igual={d.descripcion.igual}>
            <div className="grid gap-3 sm:grid-cols-2">
              {d.descripcion.detalle.textoA && (
                <blockquote className="border-l-2 border-border-subtle pl-3">
                  <p className="text-[11px] uppercase tracking-wide text-text-muted">{nombreA}</p>
                  <p className="mt-1 text-sm leading-relaxed text-text-heading whitespace-pre-line">{d.descripcion.detalle.textoA}</p>
                </blockquote>
              )}
              {d.descripcion.detalle.textoB && (
                <blockquote className="border-l-2 border-gold-400 pl-3">
                  <p className="text-[11px] uppercase tracking-wide text-text-muted">{nombreB}</p>
                  <p className="mt-1 text-sm leading-relaxed text-text-heading whitespace-pre-line">{d.descripcion.detalle.textoB}</p>
                </blockquote>
              )}
            </div>
          </Bloque>
        )}

        {d.fotos.presente && (
          <Bloque titulo="Material visual" resumen={d.fotos.resumen} igual={d.fotos.igual}>
            <div className="space-y-2">
              {d.fotos.detalle.porTipo.map((t) => (
                <div key={t.etiqueta} className="text-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{t.etiqueta}</p>
                  <p className="text-xs text-text-muted">
                    {t.comunes > 0 && <>{t.comunes} en común · </>}
                    {t.soloA.length > 0 && <>{t.soloA.length} solo en {nombreA} · </>}
                    {t.soloB.length > 0 && <>{t.soloB.length} solo en {nombreB}</>}
                  </p>
                  {t.soloB.length > 0 && (
                    <div className="mt-1 grid grid-cols-4 gap-2 sm:grid-cols-6">
                      {t.soloB.map((url, i) => (
                        <span key={`${url}-${i}`} className="relative aspect-square overflow-hidden rounded-sm border border-border-subtle">
                          <Image src={url} alt="" fill unoptimized className="object-cover" />
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Bloque>
        )}

        {d.referenciales.presente && (
          <Bloque titulo="Referencias con terceros" resumen={d.referenciales.resumen} igual={d.referenciales.igual}>
            <div className="grid gap-2 sm:grid-cols-2">
              {[...d.referenciales.detalle.cambian, ...d.referenciales.detalle.soloA, ...d.referenciales.detalle.soloB].map((fila, i) => (
                <FilaItem key={i} fila={fila} nombreA={nombreA} nombreB={nombreB} />
              ))}
            </div>
          </Bloque>
        )}

        {d.grupos.presente && !d.grupos.igual && (
          <Bloque titulo="Organización de los elementos" resumen={d.grupos.resumen} igual={d.grupos.igual}>
            <p className="text-sm text-text-muted">
              {d.grupos.detalle.soloA.length > 0 && <>Solo en {nombreA}: {d.grupos.detalle.soloA.join(', ')}. </>}
              {d.grupos.detalle.soloB.length > 0 && <>Solo en {nombreB}: {d.grupos.detalle.soloB.join(', ')}.</>}
            </p>
          </Bloque>
        )}
      </div>

      {diff.notas.length > 0 && (
        <div className="mt-3 space-y-1 rounded-lg border border-dashed border-border-subtle p-3">
          {diff.notas.map((n) => (
            <p key={n} className="flex items-start gap-1.5 text-xs text-text-muted">
              <Info size={12} className="mt-0.5 shrink-0" /> {n}
            </p>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onElegir(diff.b.id)}
          className="rounded-full bg-gold-500 px-5 py-2 text-sm font-semibold text-white hover:bg-gold-600"
        >
          Elegir {nombreB} para mi proyecto
        </button>
        <button
          type="button"
          onClick={() => onElegir(diff.a.id)}
          className="rounded-full border border-border-subtle bg-bg-raised px-5 py-2 text-sm font-medium text-text-heading hover:border-border-brand"
        >
          Dejar {nombreA}
        </button>
      </div>
    </div>
  )
}
