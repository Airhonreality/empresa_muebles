// ============================================================================
// vdo_erp_sync/src/schemas.ts
// Esquemas de validación Zod que gobiernan la tabla productos_catalogo.
// (Compatible con Zod v4: sin .default() sin argumento en cadenas de métodos.)
// ============================================================================

import { z } from 'zod';

export const CATEGORIAS_COMERCIALES_VALIDAS = [
  'Cocinas',
  'Closets',
  'Estudios',
  'Comedores',
  'Baños',
] as const;

export const UNIDAD_MEDIDA_DEFAULT = 'ud';
export const CATEGORIA_CAD_DEFAULT = 'Closets';

/*────────────────────────────────────────────────────────────────────────────
  Validador de una fila ERP completa (lectura).
────────────────────────────────────────────────────────────────────────────*/

export const ErpProductoSchema = z.object({
  id: z.string().uuid(),
  sku: z.string().min(1, 'sku es obligatorio y no puede estar vacío'),
  descripcion: z.string().min(1, 'descripcion es obligatoria'),
  tipo: z.string().nullable().optional(),
  unidad_medida: z.string().min(1, 'unidad_medida es obligatoria'),
  precio_directo: z
    .preprocess((v) => (v == null ? null : Number(v)), z.number().nullable())
    .optional(),
  precio_publico: z
    .preprocess((v) => (v == null ? null : Number(v)), z.number().nullable())
    .optional(),
  stock_actual: z
    .preprocess((v) => (v == null ? 0 : Number(v)), z.number().int().nonnegative())
    .optional(),
  proveedor_id: z.string().uuid().nullable().optional(),
  imagen_url: z.string().nullable().optional(),
  galeria_imagenes_url: z.array(z.unknown()),
  campos_personalizados: z.array(z.unknown()),
  ficha_tecnica_urls: z.array(z.unknown()),
  modelo_3d_url: z.string().nullable().optional(),
  categoria_comercial: z.string().nullable().optional(),
  publicado_web: z.boolean(),
  anulado: z.boolean(),
  created_at: z
    .preprocess((v) => (v instanceof Date ? v.toISOString() : String(v)), z.string())
    .optional(),
  updated_at: z
    .preprocess((v) => (v instanceof Date ? v.toISOString() : String(v)), z.string())
    .optional(),
  proyecto_origen_id: z.string().uuid().nullable().optional(),
});

export type ErpProductoInferido = z.infer<typeof ErpProductoSchema>;

/*────────────────────────────────────────────────────────────────────────────
  Entrada de creación de producto desde CAD (sync_create_product).
────────────────────────────────────────────────────────────────────────────*/

export const CreateProductInputSchema = z.object({
  sku: z
    .string()
    .min(1, 'sku es obligatorio')
    .regex(/^[A-Z0-9_-]+$/, 'sku debe usar solo mayúsculas, números, guion bajo y guion'),
  descripcion: z.string().min(1, 'descripcion es obligatoria'),
  categoria_comercial: z.string().optional(),
  unidad_medida: z.string().min(1).optional(),
  precio_publico: z.number().nonnegative().nullable().optional(),
  proveedor_id: z.string().uuid().nullable().optional(),
  parametros_tecnicos: z.record(z.string(), z.unknown()).optional(),
});

export type CreateProductInputInferido = z.infer<typeof CreateProductInputSchema>;

/*────────────────────────────────────────────────────────────────────────────
  Entrada de actualización de parámetros técnicos CAD (sync_push_cad_params).
────────────────────────────────────────────────────────────────────────────*/

export const PushCadParamsInputSchema = z.object({
  sku: z.string().min(1, 'sku es obligatorio'),
  parametros_tecnicos: z.record(z.string(), z.unknown()),
  dry_run: z.boolean().optional(),
});

export type PushCadParamsInputInferido = z.infer<typeof PushCadParamsInputSchema>;
