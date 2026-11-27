// Capa 0 del módulo de imágenes (t-200). SIN React, SIN DOM, SIN almacenamiento.
// Contrato: plan arnes/planes/plan_t-200_coleccion_imagenes.md

/** Campos comunes a todo tipo de campo declarado por el contexto. */
interface CampoBase {
  etiqueta: string
  /** true = el valor puede mostrarse al cliente en la propuesta pública. Por defecto false. */
  publica?: boolean
}

/** Tipo de campo que el contexto puede declarar para cada imagen de un slot. */
export type TipoCampo =
  | (CampoBase & { tipo: 'texto'; maxLength?: number; multilinea?: boolean })
  | (CampoBase & { tipo: 'seleccion'; opciones: readonly string[] })
  | (CampoBase & { tipo: 'booleano' })

/** Campos propios de un tipo de imagen. Los declara el contexto. */
export type CamposSlot = Record<string, TipoCampo>

/** Atributos base: el módulo los ofrece en cada imagen (activos por defecto). */
export interface AtributosBase {
  alt: string
  pie: string
}

/** Contrato de un tipo de imagen entregado por el contexto (ej. "Fachada" de un espacio). */
export interface SlotImagen<C extends CamposSlot = CamposSlot> {
  id: string
  etiqueta: string
  /** Tope de imágenes en el slot. Sin tope si no se define. */
  max?: number
  /** false = una sola imagen; reemplaza en vez de acumular. */
  multiple: boolean
  /** Atributos base activos para este slot. Por defecto ambos. */
  atributosBase?: { alt?: boolean; pie?: boolean }
  /** Cualidades por imagen de este tipo. */
  campos?: C
}

/** Valores tipados de los campos declarados por el slot. */
export type ValoresCampos<C extends CamposSlot> = {
  [K in keyof C]?: C[K] extends { tipo: 'booleano' } ? boolean : string
}

/** Una imagen dentro de un slot, en memoria. */
export interface ImagenItem<C extends CamposSlot = CamposSlot> {
  /** Identificador local para React y selección. No se persiste. */
  clienteId: string
  /** URL canónica en el almacenamiento. Nunca blob: ni pending:// */
  url: string
  base: Partial<AtributosBase>
  valores: ValoresCampos<C>
}

/** Forma persistida de una imagen (jsonb). Solo se guardan los atributos con valor. */
export interface ImagenGuardada {
  url: string
  alt?: string
  pie?: string
  valores?: Record<string, string | boolean>
}

/** Entrada cruda de la columna jsonb: forma vieja (string) o nueva (objeto). */
export type FotoRaw = string | ImagenGuardada
