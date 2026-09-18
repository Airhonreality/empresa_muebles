// F1 (invalidación escopada por tabla — plan de transformación del patrón lastre).
// Funciones puras (testeables con `npx tsx`) que deciden si un ciclo de NOTIFY del bus
// global de reactividad debe o no invalidar el snapshot escopado del cotizador.
//
// Problema que resuelve (P0/P1 del diagnóstico): el long-poll global emite un version++
// por CUALQUIER tabla (64 tablas de negocio). El CotizadorSnapBridge convertía eso en un
// refetch escopado (~10 SELECTs) a ciegas — una edición en testimonios, casos_garantia o
// cualquier otro módulo re-fetcheaba el cotizador. Y el eco de UNA MISMA escritura propia
// que ya se reconcilió (setQueryData con la verdad del server) llegaba como version++
// adicional y disparaba un 2º refetch redundante.
//
// Dos cortes:
//  1) esCambioDelCotizador(tablas): solo un NOTIFY sobre las tablas que el snapshot del
//     cotizador lee (ver obtenerSnapshotCotizadorAction) amerita invalidarlo. Tablas
//     desconocidas (long-poll resolvió por atajo de versión, sin payload, o el líder
//     arrancó/salió de pausa) se tratan como "posible relevante" — nunca un punto ciego.
//  2) hayMutacionPropiaReciente(...): si ESTA pestaña acaba de asentar una mutación del
//     mismo queryKey en su mutationCache, el NOTIFY que llega enseguida es casi seguro el
//     eco de esa escritura (ya reconciliada / ya refetcheada por invalidarSiempre) — no
//     vale la pena invalidar de nuevo. El cache de mutations es por-pestaña: una edición
//     de otro usuario (otra pestaña/otro dispositivo) NO está en nuestro cache, así que
//     su NOTIFY sí invalida. Trade-off aceptado (documentado): si otro usuario escribe el
//     mismo proyecto dentro de ECO_SUPRESION_MS de nuestra propia escritura, su cambio
//     puede quedar sin refetch en este ciclo (la siguiente escritura cualquiera lo trae).

export const TABLAS_COTIZADOR: ReadonlySet<string> = new Set([
  'proyectos',
  'espacio_variantes',
  'items_variante',
  'espacios_artefactos',
  'productos_catalogo',
  'parametros',
  'clientes',
  'contratos',
  'hitos_pago',
  'catalogo_acabados',
])

/** Ventana de supresión del eco propio: cuánto tiempo después de asentar una mutación del
 * cotizador se ignora el NOTIFY que llega (ya reconciliado). Lo da el ciclo real:
 * escritura → trigger → long-poll → fetchSnapshot (64 tablas) suele tardar <1.5s. */
export const ECO_SUPRESION_MS = 1500

export interface MutacionObservada {
  mutationKey?: unknown
  status: string
  /** TanStack v5.102: MutationState no expone `dataUpdatedAt`; `submittedAt` (inicio de la
   * mutación) + status==='success' es un proxy suficiente: si asentó, fue entre submittedAt
   * y ahora, y la ventana es corta (1.5s). */
  submittedAt?: number
}

export function claveIgual(mutationKey: unknown, queryKey: readonly unknown[]): boolean {
  return (
    Array.isArray(mutationKey) &&
    mutationKey.length === queryKey.length &&
    (mutationKey as unknown[]).every((k, i) => Object.is(k, queryKey[i]))
  )
}

/** ¿El NOTIFY cambio tablas relevantes al snapshot del cotizador?
 * tablas vacías = información ausente (atajo/timeout/catch-up) → se tratan como relevante,
 * para no crear puntos ciegos de reactividad. */
export function esCambioDelCotizador(tablas: readonly string[]): boolean {
  if (tablas.length === 0) return true
  return tablas.some((t) => TABLAS_COTIZADOR.has(t))
}

/** ¿Existe una mutación de ESTA pestaña para queryKey asentada dentro de la ventana?
 * Se consulta el mutationCache de TanStack (por tab), no un registro externo: una edición
 * de otra pestaña/usuario jamás aparece en nuestro cache. */
export function hayMutacionPropiaReciente(
  mutations: readonly MutacionObservada[],
  queryKey: readonly unknown[],
  now: number,
  windowMs: number = ECO_SUPRESION_MS,
): boolean {
  return mutations.some(
    (m) =>
      m.status === 'success' &&
      typeof m.submittedAt === 'number' &&
      now - m.submittedAt <= windowMs &&
      claveIgual(m.mutationKey, queryKey),
  )
}