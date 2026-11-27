'use client'
// Capa 3 (t-200): inputs de la imagen seleccionada. Renderiza lo que el slot declara:
// alt y pie (atributos base, según `atributosBase`) y los `campos` por tipo.
// Mapa fijo de tipos a inputs: texto → input/textarea, seleccion → select, booleano → checkbox.
import { useId, type ReactNode } from 'react'
import type { CamposSlot, ImagenItem, SlotImagen, TipoCampo } from '@/lib/imagen/tipos'
import { LIMITES } from '@/lib/imagen/persistencia'

export interface CamposImagenProps<C extends CamposSlot> {
  slot: SlotImagen<C>
  item: ImagenItem<C>
  onBase: (parcial: { alt?: string; pie?: string }) => void
  onValores: (parcial: Record<string, string | boolean>) => void
}

const campoCls =
  'min-h-[44px] w-full rounded-sm border border-border-subtle bg-bg-paper px-3 py-2 text-sm text-text-primary outline-none focus:border-brand focus:shadow-ring-focus'

export function CamposImagen<C extends CamposSlot>({ slot, item, onBase, onValores }: CamposImagenProps<C>) {
  const id = useId()
  const mostrarAlt = slot.atributosBase?.alt !== false
  const mostrarPie = slot.atributosBase?.pie !== false
  const campos = Object.entries(slot.campos ?? {}) as Array<[string, TipoCampo]>
  const sinAlt = mostrarAlt && !(item.base.alt ?? '').trim()

  return (
    <div className="flex flex-col gap-3">
      {mostrarAlt && (
        <Campo id={`${id}-alt`} etiqueta="Texto alternativo" ayuda={sinAlt ? 'Falta: describí la foto para lectores de pantalla y buscadores.' : 'Para accesibilidad y buscadores.'} alerta={sinAlt}>
          <input
            id={`${id}-alt`}
            type="text"
            maxLength={LIMITES.alt}
            value={item.base.alt ?? ''}
            onChange={(e) => onBase({ alt: e.target.value })}
            className={campoCls}
          />
        </Campo>
      )}
      {mostrarPie && (
        <Campo id={`${id}-pie`} etiqueta="Pie de foto" ayuda={`Leyenda corta que se muestra bajo la imagen (${(item.base.pie ?? '').length}/${LIMITES.pie}).`}>
          <input
            id={`${id}-pie`}
            type="text"
            maxLength={LIMITES.pie}
            value={item.base.pie ?? ''}
            onChange={(e) => onBase({ pie: e.target.value })}
            className={campoCls}
          />
        </Campo>
      )}
      {campos.map(([clave, def]) => {
        const valor = (item.valores as Record<string, unknown>)[clave]
        const campoId = `${id}-${clave}`
        const ayuda = def.publica ? 'Se muestra al cliente en la propuesta.' : 'Solo uso interno.'
        if (def.tipo === 'booleano') {
          return (
            <label key={clave} htmlFor={campoId} className="flex min-h-[44px] items-center gap-2 text-sm text-text-heading">
              <input id={campoId} type="checkbox" checked={valor === true} onChange={(e) => onValores({ [clave]: e.target.checked })} className="h-5 w-5" />
              {def.etiqueta}
            </label>
          )
        }
        if (def.tipo === 'seleccion') {
          return (
            <Campo key={clave} id={campoId} etiqueta={def.etiqueta} ayuda={ayuda}>
              <select id={campoId} value={typeof valor === 'string' ? valor : ''} onChange={(e) => onValores({ [clave]: e.target.value })} className={campoCls}>
                <option value="">—</option>
                {def.opciones.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Campo>
          )
        }
        const texto = typeof valor === 'string' ? valor : ''
        const max = def.maxLength
        const control = def.multilinea ? (
          <textarea id={campoId} rows={4} maxLength={max} value={texto} onChange={(e) => onValores({ [clave]: e.target.value })} className={campoCls} />
        ) : (
          <input id={campoId} type="text" maxLength={max} value={texto} onChange={(e) => onValores({ [clave]: e.target.value })} className={campoCls} />
        )
        return (
          <Campo key={clave} id={campoId} etiqueta={def.etiqueta} ayuda={max ? `${ayuda} ${texto.length}/${max}` : ayuda}>
            {control}
          </Campo>
        )
      })}
    </div>
  )
}

function Campo({ id, etiqueta, ayuda, alerta, children }: { id: string; etiqueta: string; ayuda?: string; alerta?: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-text-heading">{etiqueta}</label>
      {children}
      {ayuda && <span className={`text-[11px] ${alerta ? 'text-red-700' : 'text-text-muted'}`}>{ayuda}</span>}
    </div>
  )
}
