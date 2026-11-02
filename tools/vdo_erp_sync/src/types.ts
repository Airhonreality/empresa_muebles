// ============================================================================
// vdo_erp_sync/src/types.ts
// Tipos compartidos que gobiernan la tabla `productos_catalogo` del ERP
// (Neon PostgreSQL, ORM Drizzle) y el catálogo local de VDO.
// Este archivo es la fuente de verdad de tipos para cualquier agente MCP.
// ============================================================================

/*────────────────────────────────────────────────────────────────────────────
  1. TIPOS DE LA TABLA ERP: productos_catalogo  (lib/db/schema.ts:777)
────────────────────────────────────────────────────────────────────────────*/

export interface ErpProductoCatalogo {
  id: string;                                  // uuid PK
  sku: string;                                 // text NOT NULL, UNIQUE
  descripcion: string;                         // text NOT NULL
  tipo: string | null;                         // text
  unidad_medida: string;                       // text DEFAULT 'ud'
  precio_directo: number | null;               // numeric(14,2)
  precio_publico: number | null;               // numeric(14,2)
  stock_actual: number;                        // integer DEFAULT 0
  proveedor_id: string | null;                 // uuid FK -> proveedores.id
  imagen_url: string | null;                   // text
  galeria_imagenes_url: unknown[];             // jsonb DEFAULT []
  campos_personalizados: unknown[];            // jsonb DEFAULT [] NOT NULL  <- PARAMETROS TECNICOS CAD
  ficha_tecnica_urls: unknown[];               // jsonb DEFAULT [] NOT NULL
  modelo_3d_url: string | null;                // text
  categoria_comercial: string | null;          // text
  publicado_web: boolean;                      // boolean DEFAULT false
  anulado: boolean;                            // boolean DEFAULT false NOT NULL
  created_at: string;                          // timestamp
  updated_at: string;                          // timestamp
  proyecto_origen_id: string | null;           // uuid FK -> proyectos.id
}

/*────────────────────────────────────────────────────────────────────────────
  2. TIPOS DEL CATÁLOGO LOCAL VDO (vdo_hardware_catalog.json)
────────────────────────────────────────────────────────────────────────────*/

export interface VdoParametrosTecnicos {
  // Campos libres (JSON). Ejemplos reales observados en el ERP y VDO:
  // diametro_cazoleta, profundidad_cazoleta, cota_k_default, solape_nominal,
  // traslape_minimo, capacidad_peso_kg, delta_ancho, longitud_default, etc.
  [key: string]: unknown;
}

export interface VdoHardwareEntry {
  nombre: string;              // <- ERP.descripcion
  proveedor: string;           // <- ERP.proveedores.nombre (vía FK) / texto legacy
  precio_unitario: number;     // <- ERP.precio_publico (sagrado del cotizador)
  moneda: string;              // <- "USD" (VDO) vs ERP en COP — convención VDO
  parametros_tecnicos: VdoParametrosTecnicos;  // <- ERP.campos_personalizados
}

export interface VdoHardwareCategory {
  [sku: string]: VdoHardwareEntry;
}

export interface VdoHardwareCatalog {
  [categoria: string]: VdoHardwareCategory;
}

/*────────────────────────────────────────────────────────────────────────────
  3. RESULTADOS DE OPERACIÓN MCP
────────────────────────────────────────────────────────────────────────────*/

export type SyncResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; sku?: string };

export interface PullCatalogReport {
  total_erp: number;
  insertados: number;
  actualizados: number;
  saltados: number;
  errores: Array<{ sku: string | null; razon: string }>;
}

export interface PushCadParamsInput {
  sku: string;
  parametros_tecnicos: VdoParametrosTecnicos;
  // Cuando true, NO se escribe en BD (dry-run / simulación).
  dry_run?: boolean;
}

export interface PushCadParamsResult {
  sku: string;
  mutated: boolean;
  dry_run: boolean;
  campos_antes: unknown[];
  campos_despues: unknown[];
}

export interface CreateProductInput {
  sku: string;
  descripcion: string;
  categoria_comercial?: string | null;
  unidad_medida?: string;
  precio_publico?: number | null;
  proveedor_id?: string | null;
  parametros_tecnicos?: VdoParametrosTecnicos;
}

export interface CreateProductResult {
  sku: string;
  id: string;
  mutated: boolean;
}

/*────────────────────────────────────────────────────────────────────────────
  4. REGLAS DE CAMPOS "SAGRADOS" vs "AUTORÍA TÉCNICA CAD"
────────────────────────────────────────────────────────────────────────────*/

/**
 * Campos SAGRADOS del cotizador / ERP comercial.
 * NUNCA deben ser modificados por sync_push_cad_params.
 */
export const CAMPOS_SAGRADOS_COTIZADOR = [
  'sku',
  'descripcion',
  'precio_publico',
  'precio_directo',
  'unidad_medida',
  'stock_actual',
  'categoria_comercial',
  'proveedor_id',
  'anulado',
  'publicado_web',
] as const;

/**
 * Campos de AUTORÍA TÉCNICA CAD.
 * sync_push_cad_params SOLO puede escribir estos, dentro de campos_personalizados.
 */
export const CAMPOS_AUTORIA_TECNICA_CAD = [
  'parametros_tecnicos',   // vive en campos_personalizados (jsonb)
  'ficha_tecnica_urls',    // URLs DWG/PDF/imagen en R2
  'modelo_3d_url',
] as const;

/**
 * Categoría válida por defecto para nuevos herrajes creados desde CAD.
 * El ERP exige categoria_comercial dentro del dominio de shop_categoria
 * (Cocinas, Closets, Estudios, Comedores, Baños) — ver pgEnum en schema.ts:48.
 * CAD herrajes se catalogan bajo 'Closets' salvo que se indique otra.
 */
export const CATEGORIA_CAD_DEFAULT = 'Closets';

/**
 * Unidad de medida obligatoria por defecto.
 */
export const UNIDAD_MEDIDA_DEFAULT = 'ud';

/**
 * Esquemas de validación Zod (definidos en src/schemas.ts).
 * Importarlos aquí evita dependencias circulares.
 */
export interface ValidacionProductoEntrada {
  sku: string;
  descripcion: string;
}
