// Claves de cache del server-state del cotizador (A6, plan_cotizador_tanstack_query.md §1 QueryKeys).
// Un solo nodo de cache por proyecto; los slices se derivan por select/useMemo, no como
// queries independientes (una cache para coherencia de página).

export const cotizadorKeys = {
  all: ['cotizador'] as const,
  detalle: (proyectoId: string) => ['cotizador', proyectoId] as const,
} as const

// Estado de publicación de la propuesta (decisión axiomática 2026-09-10, Decisión 2 — t-156):
// nodo de cache separado del snapshot del cotizador — no comparte staleTime/invalidación con
// items/espacios, cambia solo cuando alguien le da "Publicar"/"Crear nueva versión".
export const propuestaVersionKeys = {
  estadoPublicacion: (proyectoId: string) => ['propuesta-publicacion', proyectoId] as const,
  listado: (proyectoId: string) => ['propuesta-versiones', proyectoId] as const,
} as const

// Testimonios (Fase 2, primer piloto de migración fuera del DataStore legacy).
export const testimoniosKeys = {
  listado: ['testimonios'] as const,
} as const

// Galería / renders conceptuales (Fase 2, segunda pantalla migrada fuera del DataStore legacy).
export const rendersConceptualesKeys = {
  listado: ['renders-conceptuales'] as const,
} as const

// Catálogo de espacios arquitectónicos (Fase 2).
export const catalogoEspaciosKeys = {
  listado: ['catalogo-espacios-arquitectonicos'] as const,
} as const