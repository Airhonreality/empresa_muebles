// Claves de cache del server-state del cotizador (A6, plan_cotizador_tanstack_query.md §1 QueryKeys).
// Un solo nodo de cache por proyecto; los slices se derivan por select/useMemo, no como
// queries independientes (una cache para coherencia de página).

export const cotizadorKeys = {
  all: ['cotizador'] as const,
  detalle: (proyectoId: string) => ['cotizador', proyectoId] as const,
} as const