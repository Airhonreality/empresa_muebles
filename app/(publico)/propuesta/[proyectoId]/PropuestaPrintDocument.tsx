'use client'

import { useEffect, useState, type ReactElement } from 'react'
import Image from 'next/image'
import type { EspacioVariante, GrupoItem, ItemVariante } from '@/lib/data'
import { textoPlazoSemanas } from '@/lib/data/contrato-fechas'
import type { CatalogoItemPublico, PropuestaPublicaData } from '@/lib/data/actions/public'

// Documento de impresión de la propuesta (rediseño 2026-10-14).
//
// Por qué existe: la pantalla de la propuesta es una UI interactiva (carouseles,
// tabs, sticky, sidebar, botón flotante de WhatsApp). Imprimir "lo que hay en
// pantalla" hacía que el PDF saliera distinto en PC y en celular, porque el layout
// dependía de breakpoints de viewport (`sm:`/`lg:`), del ancho de hoja que asume
// cada motor, y del chrome del sitio que se colaba en la hoja. Los `print:` sueltos
// no bastan: el ancho de impresión lo decide el navegador.
//
// Este documento es la versión "de papel", separada de la UI por completo:
// `hidden print:block` en el árbol, sin heredar el shell ni ningún elemento
// interactivo. Está diagramado para ploteo: una columna, tipografía y colores de
// marca, cascada vertical de datos, imágenes en grilla horizontal y saltos de
// página explícitos. Al no usar breakpoints de viewport, PC y celular imprimen
// exactamente lo mismo.

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

function formatQty(s: string | null | undefined): string {
  const n = Number(s)
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(Number.isFinite(n) ? n : 0)
}

function nombreItem(item: ItemVariante, producto: CatalogoItemPublico | undefined): string {
  return item.nombrePersonalizado ?? producto?.descripcion ?? 'Ítem'
}

function unidadesItem(producto: CatalogoItemPublico | undefined): string {
  return producto?.unidadMedida || 'unidad'
}

function specsItem(item: ItemVariante): Array<[string, string]> {
  return [
    item.marca ? (['Marca', item.marca] as [string, string]) : null,
    item.referencia ? (['Ref.', item.referencia] as [string, string]) : null,
    item.color ? (['Color', item.color] as [string, string]) : null,
    item.dimensiones ? (['Dim.', item.dimensiones] as [string, string]) : null,
    item.acabado ? (['Acabado', item.acabado] as [string, string]) : null,
    item.espesor ? (['Espesor', item.espesor] as [string, string]) : null,
    ...(item.camposPersonalizados ?? [])
      .filter((c) => c.clave || c.valor)
      .map((c): [string, string] => [c.clave, c.valor]),
  ].filter((p): p is [string, string] => p !== null)
}

type GrupoFotos = { etiqueta: string; fotos: string[] }

function gruposDeFotos(v: EspacioVariante): GrupoFotos[] {
  return (
    [
      { etiqueta: 'Espacio actual', fotos: v.fotosEspacio },
      { etiqueta: 'Diseño', fotos: v.fotosDisenio },
      { etiqueta: 'Referencia', fotos: v.fotosReferencia },
    ] as const
  )
    .map((g) => ({ ...g, fotos: (g.fotos ?? []).filter(Boolean) as string[] }))
    .filter((g) => g.fotos.length > 0)
}

function BloqueFotos({ v }: { v: EspacioVariante }): ReactElement | null {
  const grupos = gruposDeFotos(v)
  if (grupos.length === 0) return null
  return (
    <>
      {grupos.map((g) => (
        <div key={g.etiqueta} className="pp-avoid pp-fotobloque">
          <p className="pp-mini">{g.etiqueta}</p>
          <div className="pp-imgs">
            {g.fotos.map((url, i) => (
              <figure key={`${url}-${i}`} className="pp-img pp-avoid">
                <div className="pp-img-frame">
                  <Image src={url} alt={`${v.nombreEspacio} — ${g.etiqueta} ${i + 1}`} fill unoptimized className="pp-img-el" />
                </div>
              </figure>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

/** Filas de "Qué incluye" en cascada. Los grupos/subgrupos se imprimen como subtítulos
 *  con su tabla de ítems; sin grupos, sale una sola tabla plana. */
function TablaItems({
  items,
  grupos,
  catalogoPorId,
}: {
  items: ItemVariante[]
  grupos: GrupoItem[]
  catalogoPorId: Record<string, CatalogoItemPublico>
}): ReactElement {
  const fila = (item: ItemVariante): ReactElement => {
    const producto = item.catalogoId ? catalogoPorId[item.catalogoId] : undefined
    const specs = specsItem(item)
    const total = parseNum(item.totalLinea)
    return (
      <tr key={item.id}>
        <td>
          <span className="pp-item-nombre">{nombreItem(item, producto)}</span>
          {item.comentario && <span className="pp-item-nota">{item.comentario}</span>}
          {specs.length > 0 && (
            <span className="pp-item-specs">
              {specs.map(([k, val], i) => (
                <span key={k}>
                  {i > 0 && <span className="pp-sep">·</span>}
                  <strong>{k}:</strong> {val}
                </span>
              ))}
            </span>
          )}
        </td>
        <td className="pp-qty">
          {formatQty(item.cantidad)} {unidadesItem(producto)}
        </td>
        <td className="pp-amount">{formatCOP(parseNum(item.precioUnitario))}</td>
        <td className="pp-amount">{total > 0 ? formatCOP(total) : '—'}</td>
      </tr>
    )
  }

  const cabecera = (
    <thead>
      <tr>
        <th>Ítem</th>
        <th className="pp-qty">Cantidad</th>
        <th className="pp-amount">V. unitario</th>
        <th className="pp-amount">Total</th>
      </tr>
    </thead>
  )

  const itemsSinGrupo = items.filter((it) => !it.grupoItemId)

  if (grupos.length === 0) {
    return (
      <table className="pp-table">
        {cabecera}
        <tbody>{items.map(fila)}</tbody>
      </table>
    )
  }

  const raiz = grupos.filter((g) => !g.padreId).sort((a, b) => a.orden - b.orden)
  const hijos = (padreId: string) => grupos.filter((g) => g.padreId === padreId).sort((a, b) => a.orden - b.orden)
  const delGrupo = (id: string) => items.filter((it) => it.grupoItemId === id)

  const nodo = (g: GrupoItem, nivel: number): ReactElement | null => {
    const propios = delGrupo(g.id)
    const kids = hijos(g.id)
    if (propios.length === 0 && kids.length === 0) return null
    return (
      <div key={g.id} className={`pp-grupo pp-grupo-${Math.min(nivel, 2)}`}>
        <p className="pp-grupo-nombre">{g.nombre}</p>
        {propios.length > 0 && (
          <table className="pp-table">
            {cabecera}
            <tbody>{propios.map(fila)}</tbody>
          </table>
        )}
        {kids.map((h) => nodo(h, nivel + 1))}
      </div>
    )
  }

  return (
    <>
      {raiz.map((g) => nodo(g, 0))}
      {itemsSinGrupo.length > 0 && (
        <div className="pp-grupo">
          <p className="pp-grupo-nombre">Sin grupo</p>
          <table className="pp-table">
            {cabecera}
            <tbody>{itemsSinGrupo.map(fila)}</tbody>
          </table>
        </div>
      )}
    </>
  )
}

function FilaTotal({ etiqueta, valor, fuerte = false }: { etiqueta: string; valor: string; fuerte?: boolean }) {
  return (
    <div className={`pp-fila ${fuerte ? 'pp-fila-fuerte' : ''}`}>
      <span>{etiqueta}</span>
      <span className="pp-amount">{valor}</span>
    </div>
  )
}

export function PropuestaPrintDocument({ data }: { data: PropuestaPublicaData }) {
  const { proyecto, espacios: espaciosBase, items: todosLosItems, catalogoPorId, contrato, hitos, tarifas, cliente } = data
  const gruposItem = data.gruposItem ?? []

  const [fechaEmision, setFechaEmision] = useState<string | null>(null)
  useEffect(() => {
    setFechaEmision(
      new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }),
    )
  }, [])

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
  espaciosActivos.forEach((esp) => {
    const contract = todosLosItems.filter((it) => it.varianteId === esp.id && !it.esReferencial)
    materialesTotal += contract.reduce((s, it) => s + parseNum(it.totalLinea), 0)
    moDev += parseNum(esp.jornadasDesarrolloTecnico) * tarifas.tarifaDev
    moEns += parseNum(esp.jornadasEnsamblajeTaller) * tarifas.tarifaAssembly
    moInst += parseNum(esp.jornadasInstalacionObra) * tarifas.tarifaInstall
  })
  const moTotal = moDev + moEns + moInst
  const costosOperativos = parseNum(proyecto.costosOperativos)
  const imprevistos = parseNum(proyecto.imprevistosInstalacion)
  const descuento = parseNum(proyecto.descuentoComercial)
  const ajuste = parseNum(proyecto.ajusteArbitrario)
  const subtotal = materialesTotal + moTotal + costosOperativos + imprevistos - descuento + ajuste
  const iva = proyecto.aplicaIva ? Math.round(subtotal * (parseNum(proyecto.porcentajeIva) / 100)) : 0
  const total = subtotal + iva

  const hitosOrdenados = (hitos ?? []).slice().sort((a, b) => a.orden - b.orden)

  return (
    <article className="pp hidden print:block">
      {/* ── Portada ── */}
      <section className="pp-cover">
        <div className="pp-marca">
          <span className="pp-marca-nombre">Veta Dorada</span>
          <span className="pp-marca-sub">Estética y Confort</span>
        </div>
        <div className="pp-cover-centro">
          <p className="pp-eyebrow">Propuesta comercial</p>
          <h1 className="pp-titulo">{proyecto.nombreProyecto}</h1>
          <div className="pp-meta">
            {proyecto.direccionObra && (
              <div>
                <span className="pp-meta-k">Ubicación</span>
                <span className="pp-meta-v">{proyecto.direccionObra}</span>
              </div>
            )}
            {proyecto.tipoProyecto && (
              <div>
                <span className="pp-meta-k">Tipo de proyecto</span>
                <span className="pp-meta-v">{proyecto.tipoProyecto}</span>
              </div>
            )}
            <div>
              <span className="pp-meta-k">Ambientes</span>
              <span className="pp-meta-v">{espaciosActivos.length}</span>
            </div>
            {fechaEmision && (
              <div>
                <span className="pp-meta-k">Fecha</span>
                <span className="pp-meta-v">{fechaEmision}</span>
              </div>
            )}
          </div>
        </div>
        {cliente && (
          <div className="pp-preparada pp-avoid">
            <p className="pp-mini">Preparada para</p>
            <p className="pp-preparada-nombre">{cliente.nombre}</p>
            <dl className="pp-preparada-dl">
              {cliente.documento && (
                <div>
                  <dt>Identificación</dt>
                  <dd>{cliente.documento}</dd>
                </div>
              )}
              {cliente.telefono && (
                <div>
                  <dt>Teléfono</dt>
                  <dd>{cliente.telefono}</dd>
                </div>
              )}
              {cliente.email && (
                <div>
                  <dt>Correo</dt>
                  <dd>{cliente.email}</dd>
                </div>
              )}
              {cliente.domicilio && (
                <div>
                  <dt>Domicilio</dt>
                  <dd>{cliente.domicilio}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </section>

      {/* ── Ambientes ── */}
      {espaciosActivos.map((esp, indice) => {
        const items = todosLosItems.filter((it) => it.varianteId === esp.id)
        const contractuales = items.filter((it) => !it.esReferencial)
        const referenciales = items.filter((it) => it.esReferencial)
        const gruposDelEspacio = gruposItem.filter((g) => g.espacioVarianteId === esp.id)
        const espMateriales = contractuales.reduce((s, it) => s + parseNum(it.totalLinea), 0)
        const espMo =
          parseNum(esp.jornadasDesarrolloTecnico) * tarifas.tarifaDev +
          parseNum(esp.jornadasEnsamblajeTaller) * tarifas.tarifaAssembly +
          parseNum(esp.jornadasInstalacionObra) * tarifas.tarifaInstall
        const espSubtotal = espMateriales + espMo

        return (
          <section key={esp.id} className="pp-ambiente">
            <header className="pp-ambiente-head pp-avoid">
              <p className="pp-eyebrow">
                Ambiente {String(indice + 1).padStart(2, '0')}
              </p>
              <h2 className="pp-ambiente-titulo">{esp.nombreEspacio}</h2>
              <p className="pp-ambiente-var">{esp.nombreVariante}</p>
              {espSubtotal > 0 && (
                <p className="pp-ambiente-inv">
                  <span className="pp-meta-k">Inversión del ambiente</span>
                  <span className="pp-ambiente-inv-num">{formatCOP(espSubtotal)}</span>
                </p>
              )}
            </header>

            {esp.descripcion && <blockquote className="pp-cita">{esp.descripcion}</blockquote>}

            {(esp.colores as string[]).filter(Boolean).length > 0 && (
              <div className="pp-avoid">
                <p className="pp-mini">Materiales y acabados</p>
                <div className="pp-chips">
                  {(esp.colores as string[]).filter(Boolean).map((c) => (
                    <span key={c} className="pp-chip">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <BloqueFotos v={esp} />

            <div className="pp-bloque">
              <h3 className="pp-bloque-titulo">Qué incluye</h3>
              {contractuales.length > 0 ? (
                <TablaItems items={contractuales} grupos={gruposDelEspacio} catalogoPorId={catalogoPorId} />
              ) : (
                <p className="pp-nota">El alcance detallado se confirmará con el equipo comercial.</p>
              )}
            </div>

            {(espMo > 0 || referenciales.length > 0) && (
              <div className="pp-bloque pp-avoid">
                <h3 className="pp-bloque-titulo">Desglose técnico</h3>
                {espMo > 0 && (
                  <div className="pp-desglose">
                    <p className="pp-mini">Mano de obra</p>
                    {parseNum(esp.jornadasDesarrolloTecnico) * tarifas.tarifaDev > 0 && (
                      <FilaTotal etiqueta="Desarrollo técnico" valor={formatCOP(parseNum(esp.jornadasDesarrolloTecnico) * tarifas.tarifaDev)} />
                    )}
                    {parseNum(esp.jornadasEnsamblajeTaller) * tarifas.tarifaAssembly > 0 && (
                      <FilaTotal etiqueta="Ensamblaje" valor={formatCOP(parseNum(esp.jornadasEnsamblajeTaller) * tarifas.tarifaAssembly)} />
                    )}
                    {parseNum(esp.jornadasInstalacionObra) * tarifas.tarifaInstall > 0 && (
                      <FilaTotal etiqueta="Instalación" valor={formatCOP(parseNum(esp.jornadasInstalacionObra) * tarifas.tarifaInstall)} />
                    )}
                    <FilaTotal etiqueta="Subtotal mano de obra" valor={formatCOP(espMo)} fuerte />
                  </div>
                )}
                {referenciales.length > 0 && (
                  <div className="pp-desglose pp-referencial">
                    <p className="pp-mini">Con terceros (no incluido en el total)</p>
                    {referenciales.map((it) => (
                      <FilaTotal
                        key={it.id}
                        etiqueta={it.grupoReferencial ? `${it.grupoReferencial}: ${nombreItem(it, it.catalogoId ? catalogoPorId[it.catalogoId] : undefined)}` : nombreItem(it, it.catalogoId ? catalogoPorId[it.catalogoId] : undefined)}
                        valor={formatCOP(parseNum(it.totalLinea))}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )
      })}

      {/* ── Inversión total + plan de pagos ── */}
      <section className="pp-resumen">
        <h2 className="pp-resumen-titulo">Inversión total</h2>
        <div className="pp-cascada">
          <FilaTotal etiqueta="Materiales" valor={formatCOP(materialesTotal)} />
          <FilaTotal etiqueta="Mano de obra" valor={formatCOP(moTotal)} />
          {moDev > 0 && <FilaTotal etiqueta="· Desarrollo técnico" valor={formatCOP(moDev)} />}
          {moEns > 0 && <FilaTotal etiqueta="· Ensamblaje" valor={formatCOP(moEns)} />}
          {moInst > 0 && <FilaTotal etiqueta="· Instalación" valor={formatCOP(moInst)} />}
          {costosOperativos > 0 && <FilaTotal etiqueta="Costos operativos" valor={formatCOP(costosOperativos)} />}
          {imprevistos > 0 && <FilaTotal etiqueta="Imprevistos" valor={formatCOP(imprevistos)} />}
          {descuento > 0 && <FilaTotal etiqueta="Descuento" valor={`−${formatCOP(descuento)}`} />}
          {ajuste !== 0 && <FilaTotal etiqueta="Ajuste" valor={`${ajuste > 0 ? '+' : '−'}${formatCOP(Math.abs(ajuste))}`} />}
          {iva > 0 && <FilaTotal etiqueta="Subtotal" valor={formatCOP(subtotal)} />}
          {iva > 0 && <FilaTotal etiqueta={`IVA (${proyecto.porcentajeIva}%)`} valor={formatCOP(iva)} />}
        </div>
        <div className="pp-grand pp-avoid">
          <span>Valor total</span>
          <strong>{formatCOP(total)}</strong>
        </div>

        {contrato && hitosOrdenados.length > 0 && (
          <div className="pp-bloque pp-avoid">
            <h3 className="pp-bloque-titulo">Plan de pagos</h3>
            <table className="pp-table">
              <thead>
                <tr>
                  <th>Hito</th>
                  <th className="pp-amount">%</th>
                  <th className="pp-amount">Monto</th>
                </tr>
              </thead>
              <tbody>
                {hitosOrdenados.map((h) => {
                  const esPct = h.tipo === 'percentage'
                  const monto = esPct ? Math.round((parseNum(contrato.valorTotal) * parseNum(h.montoOPorcentaje)) / 100) : parseNum(h.montoOPorcentaje)
                  return (
                    <tr key={h.id}>
                      <td>
                        {h.orden}. {h.razon}
                      </td>
                      <td className="pp-amount">{esPct ? `${h.montoOPorcentaje}%` : '—'}</td>
                      <td className="pp-amount">{formatCOP(monto)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <p className="pp-nota">
              Garantía: {contrato.garantiaAnios} años · Plazo:{' '}
              {textoPlazoSemanas(contrato.plazoSemanas) ?? contrato.plazoEjecucionTexto ?? 'el acordado con el Contratista'}
            </p>
          </div>
        )}

        <footer className="pp-pie">
          <span>Veta Dorada · Hermanos García González S.A.S · NIT 901421357-9</span>
          <span>Cra 72a #71A 57, Bogotá · +57 302 5922101</span>
        </footer>
      </section>

      <style jsx global>{`
        @page {
          size: letter;
          margin: 14mm 15mm;
        }
        .pp {
          font-family: var(--font-inter), system-ui, sans-serif;
          color: #241C15;
          font-size: 10.5pt;
          line-height: 1.5;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .pp p {
          margin: 0 0 3mm;
        }
        .pp-avoid {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        /* ── Portada ── */
        .pp-cover {
          min-height: 245mm;
          display: flex;
          flex-direction: column;
        }
        .pp-marca {
          display: flex;
          flex-direction: column;
          border-bottom: 0.6mm solid #8B6914;
          padding-bottom: 4mm;
        }
        .pp-marca-nombre {
          font-family: var(--font-fraunces), Georgia, serif;
          font-size: 20pt;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: #241C15;
        }
        .pp-marca-sub {
          font-size: 8pt;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.32em;
          color: #8B6914;
          margin-top: 1mm;
        }
        .pp-cover-centro {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 20mm 0;
        }
        .pp-eyebrow {
          font-size: 8.5pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.22em;
          color: #8B6914;
          margin: 0 0 4mm;
        }
        .pp-titulo {
          font-family: var(--font-fraunces), Georgia, serif;
          font-size: 34pt;
          line-height: 1.02;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: #241C15;
          margin: 0 0 12mm;
        }
        .pp-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4mm 8mm;
          border-top: 0.3mm solid #E6E1D8;
          padding-top: 6mm;
        }
        .pp-meta > div {
          display: flex;
          flex-direction: column;
        }
        .pp-meta-k {
          font-size: 7.5pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #5F5D57;
        }
        .pp-meta-v {
          font-size: 11pt;
          color: #241C15;
          margin-top: 0.5mm;
        }
        .pp-mini {
          font-size: 7.5pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #5F5D57;
          margin: 0 0 2mm;
        }
        .pp-preparada {
          border: 0.3mm solid #E6E1D8;
          border-left: 0.9mm solid #8B6914;
          border-radius: 1.5mm;
          padding: 6mm 7mm;
          background: #FCFBF9;
        }
        .pp-preparada-nombre {
          font-family: var(--font-fraunces), Georgia, serif;
          font-size: 15pt;
          color: #241C15;
          margin: 0 0 3mm;
        }
        .pp-preparada-dl {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2mm 8mm;
          margin: 0;
        }
        .pp-preparada-dl div {
          display: flex;
          gap: 2mm;
        }
        .pp-preparada-dl dt {
          color: #5F5D57;
          font-size: 9.5pt;
        }
        .pp-preparada-dl dd {
          margin: 0;
          font-size: 9.5pt;
          color: #241C15;
        }
        /* ── Ambiente ── */
        .pp-ambiente {
          break-before: page;
          page-break-before: always;
          padding-top: 2mm;
        }
        .pp-ambiente-head {
          border-bottom: 0.6mm solid #8B6914;
          padding-bottom: 4mm;
          margin-bottom: 6mm;
        }
        .pp-ambiente-titulo {
          font-family: var(--font-fraunces), Georgia, serif;
          font-size: 22pt;
          font-weight: 600;
          color: #241C15;
          margin: 0;
        }
        .pp-ambiente-var {
          font-size: 9pt;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #5F5D57;
          margin: 1mm 0 0;
        }
        .pp-ambiente-inv {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin: 4mm 0 0;
        }
        .pp-ambiente-inv-num {
          font-family: var(--font-fraunces), Georgia, serif;
          font-size: 15pt;
          color: #241C15;
        }
        .pp-cita {
          margin: 0 0 6mm;
          padding: 0 0 0 5mm;
          border-left: 0.6mm solid #C5A059;
          font-family: var(--font-fraunces), Georgia, serif;
          font-size: 12pt;
          line-height: 1.5;
          color: #241C15;
          white-space: pre-line;
        }
        .pp-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 2mm;
          margin-bottom: 5mm;
        }
        .pp-chip {
          display: inline-block;
          border: 0.3mm solid #E6E1D8;
          border-radius: 10mm;
          padding: 1mm 3mm;
          font-size: 9pt;
          color: #5F5D57;
          background: #FCFBF9;
        }
        /* ── Fotos ── */
        .pp-fotobloque {
          margin-bottom: 5mm;
        }
        .pp-imgs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4mm;
        }
        .pp-img {
          margin: 0;
          border: 0.3mm solid #E6E1D8;
          border-radius: 1.5mm;
          overflow: hidden;
          background: #F3EFE9;
        }
        .pp-img-frame {
          position: relative;
          aspect-ratio: 3 / 2;
        }
        .pp-img-el {
          object-fit: contain;
        }
        /* ── Bloques y tablas ── */
        .pp-bloque {
          margin-top: 6mm;
        }
        .pp-bloque-titulo {
          font-family: var(--font-fraunces), Georgia, serif;
          font-size: 13pt;
          font-weight: 600;
          color: #241C15;
          margin: 0 0 3mm;
          break-after: avoid;
          page-break-after: avoid;
        }
        .pp-grupo {
          margin-bottom: 4mm;
        }
        .pp-grupo-1 {
          margin-left: 4mm;
        }
        .pp-grupo-2 {
          margin-left: 8mm;
        }
        .pp-grupo-nombre {
          font-size: 8.5pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #8B6914;
          margin: 0 0 2mm;
          break-after: avoid;
          page-break-after: avoid;
        }
        .pp-table {
          width: 100%;
          border-collapse: collapse;
        }
        .pp-table th {
          text-align: left;
          font-size: 7.5pt;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #5F5D57;
          border-bottom: 0.4mm solid #241C15;
          padding: 2mm;
        }
        .pp-table td {
          padding: 2mm;
          border-bottom: 0.3mm solid #E6E1D8;
          vertical-align: top;
          font-size: 9.5pt;
        }
        .pp-table tr {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .pp-item-nombre {
          display: block;
          color: #241C15;
          font-weight: 500;
        }
        .pp-item-nota {
          display: block;
          font-style: italic;
          font-size: 8.5pt;
          color: #5F5D57;
        }
        .pp-item-specs {
          display: block;
          font-size: 8pt;
          color: #5F5D57;
          margin-top: 0.5mm;
        }
        .pp-sep {
          margin: 0 1.5mm;
          color: #E6E1D8;
        }
        .pp-qty {
          white-space: nowrap;
        }
        .pp-amount {
          text-align: right;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }
        .pp-nota {
          font-size: 8.5pt;
          color: #5F5D57;
        }
        .pp-desglose {
          margin-bottom: 4mm;
        }
        .pp-referencial {
          border-top: 0.3mm dashed #E6E1D8;
          padding-top: 3mm;
        }
        .pp-fila {
          display: flex;
          justify-content: space-between;
          gap: 6mm;
          padding: 1mm 0;
          font-size: 9.5pt;
        }
        .pp-fila-fuerte {
          border-top: 0.3mm solid #E6E1D8;
          margin-top: 1mm;
          padding-top: 2mm;
          font-weight: 600;
          color: #241C15;
        }
        /* ── Resumen ── */
        .pp-resumen {
          break-before: page;
          page-break-before: always;
        }
        .pp-resumen-titulo {
          font-family: var(--font-fraunces), Georgia, serif;
          font-size: 22pt;
          font-weight: 600;
          color: #241C15;
          border-bottom: 0.6mm solid #8B6914;
          padding-bottom: 4mm;
          margin: 0 0 6mm;
        }
        .pp-cascada {
          max-width: 110mm;
        }
        .pp-grand {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 6mm;
          margin: 6mm 0;
          padding: 4mm 0 4mm 5mm;
          border-left: 1.2mm solid #8B6914;
        }
        .pp-grand span {
          font-size: 10pt;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #5F5D57;
        }
        .pp-grand strong {
          font-family: var(--font-fraunces), Georgia, serif;
          font-size: 20pt;
          color: #241C15;
        }
        .pp-pie {
          margin-top: 14mm;
          padding-top: 4mm;
          border-top: 0.3mm solid #E6E1D8;
          display: flex;
          justify-content: space-between;
          gap: 6mm;
          font-size: 8pt;
          color: #5F5D57;
        }
      `}</style>
    </article>
  )
}
