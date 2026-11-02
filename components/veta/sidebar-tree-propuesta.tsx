'use client'

/* Sidebar interactivo de la propuesta pública (rediseño 2026-10-29).
   Reemplaza el frame estático de "Inversión total" por un árbol navegable:
   Espacio → Grupo/Subgrupo → Versiones, con el valor de cada nodo. El nodo
   que el cliente está leyendo se resalta solo (scroll-spy del padre) y cada
   fila lleva a su sección. Abajo, separadas del árbol, van las filas extra de
   costos (operativos, financieros, impuestos) y el total: la factura en su
   estado más puro. Es el mismo componente para escritorio y móvil. */

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export interface NodoGrupoPropuesta {
  id: string
  nombre: string
  total: number
  hijos: NodoGrupoPropuesta[]
}

export interface VarianteResumenPropuesta {
  id: string
  nombre: string
  total: number
  esContractual: boolean
}

export interface NodoEspacioPropuesta {
  id: string
  nombre: string
  total: number
  variantes: VarianteResumenPropuesta[]
  grupos: NodoGrupoPropuesta[]
}

export interface CostosPropuesta {
  materialesTotal: number
  moTotal: number
  moDev: number
  moEns: number
  moInst: number
  costosOperativos: number
  imprevistos: number
  descuento: number
  ajuste: number
  subtotal: number
  iva: number
  porcentajeIva: number
  total: number
}

interface SidebarTreePropuestaProps {
  nodos: NodoEspacioPropuesta[]
  costos: CostosPropuesta
  espacioActivoId: string | null
  grupoActivoId: string | null
  onIrEspacio: (espacioId: string) => void
  onIrGrupo: (grupoId: string) => void
  onElegirVariante: (nombreEspacio: string, varianteId: string) => void
}

function FilaCosto({
  etiqueta,
  valor,
  clase = '',
}: {
  etiqueta: string
  valor: string
  clase?: string
}) {
  return (
    <div className={`flex justify-between gap-3 ${clase}`}>
      <span className="text-text-muted">{etiqueta}</span>
      <span className="font-mono tabular-nums">{valor}</span>
    </div>
  )
}

export function ResumenCostosPropuesta({ costos }: { costos: CostosPropuesta }) {
  return (
    <section className="rounded-lg border border-border-subtle bg-bg-raised p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">Inversión total</h2>
      <div className="space-y-1.5 text-sm">
        <FilaCosto etiqueta="Materiales" valor={formatCOP(costos.materialesTotal)} />
        <FilaCosto etiqueta="Mano de obra" valor={formatCOP(costos.moTotal)} />
        {costos.moDev > 0 && <FilaCosto etiqueta="· Desarrollo técnico" valor={formatCOP(costos.moDev)} clase="pl-4 text-xs" />}
        {costos.moEns > 0 && <FilaCosto etiqueta="· Ensamblaje" valor={formatCOP(costos.moEns)} clase="pl-4 text-xs" />}
        {costos.moInst > 0 && <FilaCosto etiqueta="· Instalación" valor={formatCOP(costos.moInst)} clase="pl-4 text-xs" />}
        {costos.costosOperativos > 0 && <FilaCosto etiqueta="Costos operativos" valor={formatCOP(costos.costosOperativos)} />}
        {costos.imprevistos > 0 && <FilaCosto etiqueta="Imprevistos" valor={formatCOP(costos.imprevistos)} />}
        {costos.descuento > 0 && (
          <div className="flex justify-between gap-3">
            <span className="text-text-muted">Descuento</span>
            <span className="font-mono tabular-nums text-red-600">−{formatCOP(costos.descuento)}</span>
          </div>
        )}
        {costos.ajuste !== 0 && (
          <FilaCosto
            etiqueta="Ajuste"
            valor={`${costos.ajuste > 0 ? '+' : '−'}${formatCOP(Math.abs(costos.ajuste))}`}
          />
        )}
        {costos.iva > 0 && <hr className="my-2 border-border-subtle" />}
        {costos.iva > 0 && <FilaCosto etiqueta="Subtotal" valor={formatCOP(costos.subtotal)} />}
        {costos.iva > 0 && <FilaCosto etiqueta={`IVA (${costos.porcentajeIva}%)`} valor={formatCOP(costos.iva)} />}
        <hr className="my-2 border-border-subtle" />
        <div className="border-l-2 border-gold-400 pl-3">
          <span className="block text-xs font-medium text-text-muted">Inversión total</span>
          <span className="font-display text-2xl text-text-heading">{formatCOP(costos.total)}</span>
        </div>
      </div>
    </section>
  )
}

export function SidebarTreePropuesta({
  nodos,
  costos,
  espacioActivoId,
  grupoActivoId,
  onIrEspacio,
  onIrGrupo,
  onElegirVariante,
}: SidebarTreePropuestaProps) {
  const renderGrupo = (grupo: NodoGrupoPropuesta, nivel: number) => {
    const activo = grupo.id === grupoActivoId
    return (
      <div key={grupo.id}>
        <button
          type="button"
          onClick={() => onIrGrupo(grupo.id)}
          style={{ paddingLeft: 8 + nivel * 12 }}
          className={`flex w-full items-center justify-between gap-2 rounded-sm py-1 pr-2 text-left text-xs transition-colors duration-fast ${
            activo
              ? 'bg-gold-100 font-medium text-gold-700'
              : 'text-text-muted hover:bg-bg-alt hover:text-text-heading'
          }`}
        >
          <span className="min-w-0 flex-1 truncate">{grupo.nombre}</span>
          <span className="shrink-0 font-mono tabular-nums">{formatCOP(grupo.total)}</span>
        </button>
        {grupo.hijos.map((hijo) => renderGrupo(hijo, nivel + 1))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-border-subtle bg-bg-raised p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
          Resumen del proyecto
        </h2>

        {nodos.length === 0 ? (
          <p className="text-sm text-text-muted">El alcance se confirmará con el equipo comercial.</p>
        ) : (
          <nav aria-label="Resumen de la propuesta" className="space-y-1">
            {nodos.map((nodo, indice) => {
              const activo = nodo.id === espacioActivoId
              return (
                <div key={nodo.id} className="pb-1">
                  <button
                    type="button"
                    onClick={() => onIrEspacio(nodo.id)}
                    className={`flex w-full items-baseline justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors duration-fast ${
                      activo
                        ? 'border-l-2 border-gold-400 bg-gold-50 font-medium text-text-heading'
                        : 'text-text-heading hover:bg-bg-alt'
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      <span className="mr-1.5 text-[10px] tabular-nums text-gold-500">
                        {String(indice + 1).padStart(2, '0')}
                      </span>
                      {nodo.nombre}
                    </span>
                    <span className="shrink-0 font-mono text-xs tabular-nums">{formatCOP(nodo.total)}</span>
                  </button>

                  {nodo.grupos.map((grupo) => renderGrupo(grupo, 1))}

                  {nodo.variantes.length > 1 && (
                    <div className="mt-1 mb-1 border-l border-border-subtle pl-3">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                        Versiones
                      </p>
                      {nodo.variantes.map((variante) => (
                        <button
                          key={variante.id}
                          type="button"
                          onClick={() => onElegirVariante(nodo.nombre, variante.id)}
                          className="flex w-full items-center justify-between gap-2 rounded-sm py-0.5 text-left text-[11px] text-text-muted hover:text-text-heading"
                        >
                          <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate">
                            {variante.nombre}
                            {variante.esContractual && (
                              <span className="rounded-full bg-gold-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gold-700">
                                Contrato
                              </span>
                            )}
                          </span>
                          <span className="shrink-0 font-mono tabular-nums">{formatCOP(variante.total)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        )}
      </section>

      <ResumenCostosPropuesta costos={costos} />
    </div>
  )
}
