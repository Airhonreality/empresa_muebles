'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Expand } from 'lucide-react'
import { GaleriaPropuesta, type GaleriaPropuestaFoto } from '@/components/veta/galeria-propuesta'
import { MarkdownContent } from '@/components/veta/markdown-content'
import type { EspacioVariante, GrupoItem, ItemVariante } from '@/lib/data'
import type { CatalogoItemPublico, PropuestaPublicaData } from '@/lib/data/actions/public'
import { compararVariantes } from '@/lib/propuesta/comparar-variantes'
import { ComparadorVersiones } from './ComparadorVersiones'

// Sección de un ambiente dentro del scroll acumulativo de la propuesta pública
// (rediseño 2026-10-29). Antes la pantalla mostraba un solo ambiente a la vez
// (tabs); ahora el cliente baja por todos los ambientes en una sola página y
// esta sección encapsula el estado local de cada uno: versión elegida, tabs de
// imagen y comparador de versiones.

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

function toGaleria(fotos: string[], alt: string): GaleriaPropuestaFoto[] {
  return fotos.filter(Boolean).map((url, i) => ({ url, alt: `${alt} ${i + 1}` }))
}

interface ItemCardProps {
  item: ItemVariante
  producto: CatalogoItemPublico | undefined
  onDetalle: (item: ItemVariante, producto: CatalogoItemPublico | undefined) => void
}

function ItemCard({ item, producto, onDetalle }: ItemCardProps) {
  const nombre = item.nombrePersonalizado ?? producto?.descripcion ?? 'Ítem'
  const unidad = producto?.unidadMedida || 'unidad'
  const precioUnitario = parseNum(item.precioUnitario)
  const total = parseNum(item.totalLinea)
  const fotoItem = item.fotoUrl ?? null
  const galeria = [fotoItem, producto?.imagenUrl, ...(producto?.galeriaImagenesUrl ?? [])].filter(Boolean) as string[]
  const imagen = galeria[0] ?? null

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onDetalle(item, producto)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onDetalle(item, producto)
        }
      }}
      className="group flex cursor-pointer items-center gap-3 rounded-lg border border-border-subtle bg-bg-raised p-3 shadow-xs transition-colors duration-fast hover:border-border-brand"
    >
      <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-sm bg-bg-alt">
        {imagen ? (
          <>
            {/* unoptimized: propuesta es snapshot de solo lectura y sus URLs pueden ser mock/blob temporales */}
            <Image src={imagen} alt="" fill unoptimized sizes="48px" className="object-cover" />
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
        {item.comentario && (
          <p className="mt-0.5 text-xs italic text-text-muted/80">{item.comentario}</p>
        )}
        {(() => {
          const pares: Array<[string, string]> = [
            item.marca ? ['Marca', item.marca] : null,
            item.referencia ? ['Ref.', item.referencia] : null,
            item.color ? ['Color', item.color] : null,
            item.dimensiones ? ['Dim.', item.dimensiones] : null,
            item.acabado ? ['Acabado', item.acabado] : null,
            item.espesor ? ['Espesor', item.espesor] : null,
            ...(item.camposPersonalizados ?? [])
              .filter((c) => c.clave || c.valor)
              .map((c): [string, string] => [c.clave, c.valor]),
          ].filter((p): p is [string, string] => p !== null)
          if (pares.length === 0) return null
          return (
            <p className="mt-1 text-[11px] leading-4 text-text-muted/70">
              {pares.map(([k, v], i) => (
                <span key={k}>
                  {i > 0 && <span className="mx-1 text-border-subtle">·</span>}
                  <span className="font-medium">{k}:</span> {v}
                </span>
              ))}
            </p>
          )
        })()}
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

function DetalleTecnico({
  jornadasDev,
  jornadasEns,
  jornadasInst,
  tarifaDev,
  tarifaAssembly,
  tarifaInstall,
}: {
  jornadasDev: string
  jornadasEns: string
  jornadasInst: string
  tarifaDev: number
  tarifaAssembly: number
  tarifaInstall: number
}) {
  const [abierto, setAbierto] = useState(false)

  const moDev = parseNum(jornadasDev) * tarifaDev
  const moEns = parseNum(jornadasEns) * tarifaAssembly
  const moInst = parseNum(jornadasInst) * tarifaInstall
  const moTotal = moDev + moEns + moInst

  if (moTotal === 0) return null

  return (
    <div className="rounded-lg border border-border-subtle">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors duration-fast hover:bg-bg-alt/60"
      >
        <span className="text-sm font-medium text-text-heading">Ver desglose de mano de obra</span>
        <svg
          className={`h-4 w-4 text-text-muted transition-transform duration-base ${abierto ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {abierto && (
        <div className="space-y-1 border-t border-border-subtle px-4 py-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">Mano de obra</p>
          {moDev > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">· Desarrollo técnico</span>
              <span className="font-mono">{formatCOP(moDev)}</span>
            </div>
          )}
          {moEns > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">· Ensamblaje</span>
              <span className="font-mono">{formatCOP(moEns)}</span>
            </div>
          )}
          {moInst > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">· Instalación</span>
              <span className="font-mono">{formatCOP(moInst)}</span>
            </div>
          )}
          <div className="mt-2 flex justify-between border-t border-border-subtle/50 pt-2 text-sm">
            <span className="font-medium text-text-muted">Subtotal MO</span>
            <span className="font-mono text-text-heading">{formatCOP(moTotal)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function renderItemsAgrupados(
  items: ItemVariante[],
  grupos: GrupoItem[],
  catalogoPorId: Record<string, CatalogoItemPublico>,
  espacioId: string,
  onDetalle: (item: ItemVariante, producto: CatalogoItemPublico | undefined) => void,
) {
  const gruposRaiz = grupos.filter((g) => !g.padreId).sort((a, b) => a.orden - b.orden)
  const hijosDe = (padreId: string) => grupos.filter((g) => g.padreId === padreId).sort((a, b) => a.orden - b.orden)
  const itemsDelGrupo = (grupoId: string) => items.filter((it) => it.grupoItemId === grupoId)
  const itemsSinGrupo = items.filter((it) => !it.grupoItemId)
  const hayGrupos = grupos.length > 0

  const grid = (lista: ItemVariante[]) => (
    <div className="grid gap-3 sm:grid-cols-2">
      {lista.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          producto={item.catalogoId ? catalogoPorId[item.catalogoId] : undefined}
          onDetalle={onDetalle}
        />
      ))}
    </div>
  )

  const renderGrupoNodo = (grupo: GrupoItem, nivel: number) => {
    const propios = itemsDelGrupo(grupo.id)
    const hijos = hijosDe(grupo.id)
    return (
      <div
        key={grupo.id}
        id={`grupo-${grupo.id}`}
        data-pp-ancla
        data-pp-espacio={espacioId}
        data-pp-grupo={grupo.id}
        style={{ marginLeft: nivel * 16 }}
        className="mb-5 scroll-mt-28 last:mb-0"
      >
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gold-600">{grupo.nombre}</h4>
        {grupo.descripcion && (
          <MarkdownContent value={grupo.descripcion} variant="compacto" className="mb-3 max-w-2xl text-text-muted" />
        )}
        {propios.length > 0 && grid(propios)}
        {hijos.map((h) => renderGrupoNodo(h, nivel + 1))}
      </div>
    )
  }

  if (!hayGrupos) return grid(items)

  return (
    <>
      {gruposRaiz.map((g) => renderGrupoNodo(g, 0))}
      {itemsSinGrupo.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Sin grupo</h4>
          {grid(itemsSinGrupo)}
        </div>
      )}
    </>
  )
}

interface EspacioPropuestaSeccionProps {
  indice: number
  nombreEspacio: string
  variantes: EspacioVariante[]
  varianteActual: EspacioVariante
  items: ItemVariante[]
  gruposTodos: GrupoItem[]
  catalogoPorId: Record<string, CatalogoItemPublico>
  acabados: PropuestaPublicaData['acabadosPorEspacio']
  tarifas: { tarifaDev: number; tarifaAssembly: number; tarifaInstall: number }
  onSeleccionarVariante: (varianteId: string) => void
  onZoom: (fotos: GaleriaPropuestaFoto[], index: number) => void
  onDetalle: (item: ItemVariante, producto: CatalogoItemPublico | undefined) => void
}

export function EspacioPropuestaSeccion({
  indice,
  nombreEspacio,
  variantes,
  varianteActual,
  items,
  gruposTodos,
  catalogoPorId,
  acabados,
  tarifas,
  onSeleccionarVariante,
  onZoom,
  onDetalle,
}: EspacioPropuestaSeccionProps) {
  const { tarifaDev, tarifaAssembly, tarifaInstall } = tarifas
  const [modoComparar, setModoComparar] = useState(false)
  const [varianteComparadaId, setVarianteComparadaId] = useState<string | null>(null)
  const [tipoImagenActivo, setTipoImagenActivo] = useState<'espacio' | 'disenio' | 'referencia'>('espacio')

  const itemsVariante = items.filter((it) => it.varianteId === varianteActual.id)
  const contractuales = itemsVariante.filter((it) => !it.esReferencial)
  const gruposDelEspacio = gruposTodos.filter((g) => g.espacioVarianteId === varianteActual.id)
  const acabadosEspacio = acabados[varianteActual.id] ?? []

  const totalAmbiente = (esp: EspacioVariante): number => {
    const mat = items
      .filter((it) => it.varianteId === esp.id && !it.esReferencial)
      .reduce((s, it) => s + parseNum(it.totalLinea), 0)
    const mo =
      parseNum(esp.jornadasDesarrolloTecnico) * tarifaDev +
      parseNum(esp.jornadasEnsamblajeTaller) * tarifaAssembly +
      parseNum(esp.jornadasInstalacionObra) * tarifaInstall
    return mat + mo
  }

  const espMateriales = contractuales.reduce((s, it) => s + parseNum(it.totalLinea), 0)
  const espMo =
    parseNum(varianteActual.jornadasDesarrolloTecnico) * tarifaDev +
    parseNum(varianteActual.jornadasEnsamblajeTaller) * tarifaAssembly +
    parseNum(varianteActual.jornadasInstalacionObra) * tarifaInstall
  const espSubtotal = espMateriales + espMo

  const varianteContractual = variantes.find((v) => v.activa) ?? variantes[0] ?? null
  const varianteComparada =
    variantes.find((v) => v.id === varianteComparadaId && v.id !== varianteContractual?.id) ??
    variantes.find((v) => v.id !== varianteContractual?.id) ??
    null

  const diffVersiones = useMemo(() => {
    if (!varianteContractual || !varianteComparada) return null
    return compararVariantes({
      a: varianteContractual,
      b: varianteComparada,
      items,
      grupos: gruposTodos,
      acabadosPorEspacio: acabados,
      catalogoPorId,
      tarifas,
    })
  }, [varianteContractual, varianteComparada, items, gruposTodos, acabados, catalogoPorId, tarifas])

  const tiposImagen = (
    [
      { key: 'espacio', etiqueta: 'Espacio actual', fotos: varianteActual.fotosEspacio ?? [] },
      { key: 'disenio', etiqueta: 'Diseño', fotos: varianteActual.fotosDisenio ?? [] },
      { key: 'referencia', etiqueta: 'Referencia', fotos: varianteActual.fotosReferencia ?? [] },
    ] as const
  )
    .map((t) => ({ ...t, fotos: toGaleria(t.fotos, varianteActual.nombreEspacio) }))
    .filter((t) => t.fotos.length > 0)

  const tipoImagen = tiposImagen.find((t) => t.key === tipoImagenActivo) ?? tiposImagen[0]

  return (
    <section
      id={`espacio-${varianteActual.id}`}
      data-pp-ancla
      data-pp-espacio={varianteActual.id}
      className="scroll-mt-28 space-y-6"
    >
      {/* Encabezado del espacio */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-500">
            Ambiente {String(indice + 1).padStart(2, '0')}
          </p>
          <h2 className="mt-1 font-display text-display-publico font-semibold text-text-heading">{nombreEspacio}</h2>
          <p className="mt-1 text-xs uppercase tracking-wide text-text-muted">{varianteActual.nombreVariante}</p>
        </div>
        {espSubtotal > 0 && (
          <p className="text-right">
            <span className="block text-[10px] uppercase tracking-[0.14em] text-text-muted">Inversión del ambiente</span>
            <strong className="font-display block text-xl text-text-heading">{formatCOP(espSubtotal)}</strong>
          </p>
        )}
      </div>

      {varianteActual.descripcion && (
        <blockquote className="max-w-2xl border-l-2 border-gold-400 pl-5">
          <MarkdownContent value={varianteActual.descripcion} variant="propuesta" />
        </blockquote>
      )}

      {acabadosEspacio.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Materiales y acabados</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {acabadosEspacio.map(({ descripcionUso, acabado }) => (
              <div key={acabado.id} className="flex items-center gap-3 rounded-lg border border-border-subtle bg-bg-raised p-3">
                <span
                  className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm border border-border-subtle"
                  style={acabado.imagenTexturaUrl ? undefined : { background: acabado.colorHex ?? '#D9D4CC' }}
                >
                  {acabado.imagenTexturaUrl ? (
                    <Image src={acabado.imagenTexturaUrl} alt="" fill unoptimized sizes="48px" className="object-cover" />
                  ) : null}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-5 text-text-heading">{acabado.nombre}</p>
                  {acabado.marca && <p className="text-xs text-text-muted">{acabado.marca}</p>}
                  {descripcionUso && <p className="mt-0.5 text-xs italic text-text-muted/80">{descripcionUso}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Carril visual: móvil a ancho total, escritorio en grilla de 3. */}
      {tipoImagen && (
        <div className="print:hidden">
          {tiposImagen.length > 1 && (
            <div className="mb-3 flex flex-wrap gap-2" role="tablist" aria-label="Tipo de imagen del ambiente">
              {tiposImagen.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={tipoImagen.key === t.key}
                  onClick={() => setTipoImagenActivo(t.key)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-fast ${
                    tipoImagen.key === t.key
                      ? 'bg-gold-500 text-white'
                      : 'border border-border-subtle bg-bg-raised text-text-heading hover:border-border-brand'
                  }`}
                >
                  {t.etiqueta}
                </button>
              ))}
            </div>
          )}
          <GaleriaPropuesta fotos={tipoImagen.fotos} etiqueta={tipoImagen.etiqueta} onZoom={onZoom} />
        </div>
      )}

      {/* Selector de versiones */}
      {variantes.length > 1 && (
        <div className="print:hidden">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Versiones de este ambiente</p>
            <button
              type="button"
              onClick={() => {
                setModoComparar(true)
                if (varianteComparada) setVarianteComparadaId(varianteComparada.id)
              }}
              className="rounded-full border border-gold-400/60 px-3.5 py-1.5 text-xs font-medium text-gold-700 transition-colors hover:bg-gold-50"
            >
              Comparar versiones
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {variantes.map((var_) => {
              const activa = !modoComparar && varianteActual.id === var_.id
              return (
                <button
                  key={var_.id}
                  type="button"
                  onClick={() => {
                    setModoComparar(false)
                    onSeleccionarVariante(var_.id)
                  }}
                  className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-fast ${
                    activa
                      ? 'bg-gold-500 text-white'
                      : 'border border-border-subtle bg-bg-raised text-text-heading hover:border-border-brand'
                  }`}
                >
                  {var_.nombreVariante}
                  <span className={activa ? 'text-white/70' : 'text-text-muted'}>{formatCOP(totalAmbiente(var_))}</span>
                  {var_.activa && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        activa ? 'bg-white/20 text-white' : 'bg-gold-100 text-gold-700'
                      }`}
                    >
                      Del contrato
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {modoComparar && diffVersiones && (
            <ComparadorVersiones
              diff={diffVersiones}
              variantes={variantes.map((v) => ({
                id: v.id,
                etiqueta: v.nombreVariante,
                esContractual: v.activa,
                total: totalAmbiente(v),
              }))}
              comparadaId={varianteComparada?.id ?? ''}
              onCambiarComparada={(id) => setVarianteComparadaId(id)}
              onElegir={(id) => {
                onSeleccionarVariante(id)
                setModoComparar(false)
              }}
              onVolver={() => setModoComparar(false)}
            />
          )}
        </div>
      )}

      {/* Qué incluye */}
      {!modoComparar && (
        <>
          <section>
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-display text-xl text-text-heading">Qué incluye</h3>
              <span className="text-xs text-text-muted">{contractuales.length} items</span>
            </div>
            {contractuales.length > 0 ? (
              <div className="mt-4">
                {renderItemsAgrupados(contractuales, gruposDelEspacio, catalogoPorId, varianteActual.id, onDetalle)}
              </div>
            ) : (
              <p className="mt-3 text-sm text-text-muted">El alcance detallado se confirmará con el equipo comercial.</p>
            )}
          </section>

          <DetalleTecnico
            jornadasDev={varianteActual.jornadasDesarrolloTecnico}
            jornadasEns={varianteActual.jornadasEnsamblajeTaller}
            jornadasInst={varianteActual.jornadasInstalacionObra}
            tarifaDev={tarifaDev}
            tarifaAssembly={tarifaAssembly}
            tarifaInstall={tarifaInstall}
          />
        </>
      )}
    </section>
  )
}
