/**
 * agnostic.routing.ts — Fork-owned route protection config.
 *
 * Edítalo libremente: es capa del fork (protégelo con `merge=ours` en
 * .gitattributes) y el engine nunca lo pisa en el upstream.
 *
 * Lo lee `src/middleware.ts`, que corre en el Edge Runtime (sin acceso a
 * storage/fs), por eso la configuración vive en un módulo estático y no en
 * storage/db. El engine ya protege sus propias rutas (/schema, /_data,
 * /api/admin, /api/engine, /api/pulse, /api/vault); aquí solo agregas las TUYAS.
 *
 * Cada valor es un PREFIJO de ruta: '/app' cubre '/app', '/app/x', etc.
 *
 * (Alternativa para overrides puntuales de deploy: las mismas listas se pueden
 *  suplir por env vars AGNOSTIC_PROTECTED_PATHS / _API_PATHS / PUBLIC_PATHS /
 *  PUBLIC_SHARE_PATHS, separadas por comas. Se suman a lo de aquí.)
 */
export interface RoutingConfig {
  /** Rutas de página que requieren sesión. Ej: ['/app', '/setup'] */
  protectedPaths?: string[];
  /** Rutas de API que requieren sesión. */
  protectedApiPaths?: string[];
  /** Rutas siempre públicas (nunca redirigen a login). */
  publicPaths?: string[];
  /** Rutas servidas en modo public-share/SSR (header x-agnostic-public-share). */
  publicSharePaths?: string[];
}

export const routing: RoutingConfig = {
  protectedPaths: [],
  protectedApiPaths: [],
  publicPaths: [],
  publicSharePaths: [],
};
