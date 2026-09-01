// Catálogo único de tipos de espacio (F09, 2026-08-17). Fuente de verdad compartida por el
// cotizador, el formulario de Portafolio, la pantalla de renders conceptuales y las 6 landings
// públicas (join por `slug`) — antes vivía repetido/desalineado en varios de esos lugares.
// Agregar una categoría nueva es una línea acá; no justifica una tabla de lookup propia.
export const TIPOS_ESPACIO = [
  { codigo: 'cocina', label: 'Cocinas Integrales', slug: 'cocinas-integrales-bogota', tituloBase: 'Cocina' },
  { codigo: 'closet', label: 'Closets y Vestidores', slug: 'closets-vestidores-bogota', tituloBase: 'Closet' },
  { codigo: 'cava_bar', label: 'Cavas y Bares', slug: 'cavas-y-bares', tituloBase: 'Cava Bar' },
  { codigo: 'consola_recibidor', label: 'Consolas y Recibidores', slug: 'consolas-recibidores', tituloBase: 'Consola' },
  { codigo: 'centro_entretenimiento', label: 'Centros de Entretenimiento', slug: 'centros-de-entretenimiento', tituloBase: 'Centro TV' },
  { codigo: 'estudio_home_office', label: 'Estudios y Home Office', slug: 'estudios-home-office', tituloBase: 'Estudio' },
  { codigo: 'pisos_madera', label: 'Pisos de Madera', slug: 'pisos-de-madera', tituloBase: 'Piso de Madera' },
] as const

export type TipoEspacioCodigo = (typeof TIPOS_ESPACIO)[number]['codigo']

export function labelTipoEspacio(codigo: string | null | undefined): string | null {
  return TIPOS_ESPACIO.find((t) => t.codigo === codigo)?.label ?? null
}

export function slugTipoEspacio(codigo: string | null | undefined): string | null {
  return TIPOS_ESPACIO.find((t) => t.codigo === codigo)?.slug ?? null
}

/** Nombre corto para el título público de portafolio (ley de nomenclatura High-Ticket:
 * `[Espacio] [Inicial]. — [Barrio]`). Para categorías del catálogo prefiere `tituloBase`;
 * para categorías custom (creadas en el form) cae al label o al propio código. */
export function nombreBaseTituloTipoEspacio(codigo: string | null | undefined): string | null {
  const t = TIPOS_ESPACIO.find((x) => x.codigo === codigo)
  if (!t) return null
  return t.tituloBase || (t as { label?: string }).label || null
}
