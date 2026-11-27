// Contrato de slots de imagen del cotizador (t-200). Es el único lugar donde el cotizador
// declara qué tipos de foto tiene un espacio y qué campos lleva cada foto. El módulo de imágenes
// no sabe de estos nombres: solo renderiza lo que se declara aquí.
import type { SlotImagen } from '../tipos'

/** Campos comunes a los slots de espacio: texto libre descriptivo, público en la propuesta. */
const CAMPOS_ESPACIO = {
  descripcion: {
    tipo: 'texto',
    etiqueta: 'Descripción',
    multilinea: true,
    maxLength: 600,
    publica: true,
  },
} as const

export const SLOT_ESPACIO_FOTOS = {
  id: 'espacio:fotos',
  etiqueta: 'Fotos del espacio',
  multiple: true,
  atributosBase: { alt: true, pie: true },
  campos: CAMPOS_ESPACIO,
} satisfies SlotImagen<typeof CAMPOS_ESPACIO>

export const SLOT_ESPACIO_DISENIO = {
  id: 'espacio:disenio',
  etiqueta: 'Fotos de diseño',
  multiple: true,
  atributosBase: { alt: true, pie: true },
  campos: CAMPOS_ESPACIO,
} satisfies SlotImagen<typeof CAMPOS_ESPACIO>

export const SLOT_ESPACIO_REFERENCIA = {
  id: 'espacio:referencia',
  etiqueta: 'Fotos de referencia',
  multiple: true,
  atributosBase: { alt: true, pie: true },
  campos: CAMPOS_ESPACIO,
} satisfies SlotImagen<typeof CAMPOS_ESPACIO>

/** Los tres slots de espacio por su tipo, para proyectar la propuesta pública sin repetir nombres. */
export const SLOTS_ESPACIO = {
  espacio: SLOT_ESPACIO_FOTOS,
  disenio: SLOT_ESPACIO_DISENIO,
  referencia: SLOT_ESPACIO_REFERENCIA,
} as const
