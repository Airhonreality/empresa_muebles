// ============================================================================
// vdo_erp_sync/src/sync_create_product.ts
// MCP Tool: sync_create_product
// Registra un nuevo herraje desde FreeCAD en la base de datos del ERP,
// asegurando que cumple obligatoriamente con todos los tipos requeridos por
// el esquema del ERP (categoría válida, unidad de medida, campos not-null).
// Campos sagrados del cotizador (precio, descripcion, sku) son de entrada
// obligatoria; los parámetros técnicos CAD van en campos_personalizados.
// ============================================================================

import { CreateProductInputSchema, CATEGORIA_CAD_DEFAULT, UNIDAD_MEDIDA_DEFAULT, CATEGORIAS_COMERCIALES_VALIDAS } from './schemas.js';
import { clienteEscritura } from './db.js';
import type { CreateProductInput, CreateProductResult, SyncResult } from './types.js';

export async function syncCreateProduct(
  input: CreateProductInput,
  { databaseUrl }: { databaseUrl?: string } = {},
): Promise<SyncResult<CreateProductResult>> {
  const validado = CreateProductInputSchema.safeParse(input);
  if (!validado.success) {
    return {
      ok: false,
      error: `validación de entrada falló: ${validado.error.issues.map((i) => i.message).join('; ')}`,
      sku: input.sku,
    };
  }

  const {
    sku,
    descripcion,
    categoria_comercial = CATEGORIA_CAD_DEFAULT,
    unidad_medida = UNIDAD_MEDIDA_DEFAULT,
    precio_publico = null,
    proveedor_id = null,
    parametros_tecnicos = {},
  } = validado.data;

  // ─── VALIDACIÓN DE CATEGORÍA (dominio shop_categoria del ERP) ──────────
  if (categoria_comercial && !CATEGORIAS_COMERCIALES_VALIDAS.includes(categoria_comercial as any)) {
    return {
      ok: false,
      error: `categoria_comercial "${categoria_comercial}" no es válida. Use uno de: ${CATEGORIAS_COMERCIALES_VALIDAS.join(', ')}`,
      sku,
    };
  }

  const sql = clienteEscritura(databaseUrl);

  try {
    // ─── GUARDIA DE UNICIDAD DE SKU (lectura previa) ─────────────────────
    const existente = await sql`SELECT sku FROM productos_catalogo WHERE sku = ${sku} LIMIT 1`;
    if (existente.length > 0) {
      return {
        ok: false,
        error: `El SKU "${sku}" ya existe en productos_catalogo. Use sync_push_cad_params para actualizar.`,
        sku,
      };
    }

    // ─── INSERCIÓN (campos NOT NULL del esquema ERP) ─────────────────────
    // sku, descripcion, unidad_medida son obligatorios.
    // created_at/updated_at/anulado/publicado_web tienen DEFAULT en el schema.
    const insertada = await sql`
      INSERT INTO productos_catalogo (
        sku,
        descripcion,
        categoria_comercial,
        unidad_medida,
        precio_publico,
        proveedor_id,
        campos_personalizados,
        publicado_web,
        anulado
      )
      VALUES (
        ${sku},
        ${descripcion},
        ${categoria_comercial},
        ${unidad_medida},
        ${precio_publico},
        ${proveedor_id},
        ${JSON.stringify(parametros_tecnicos ?? {})}::jsonb,
        ${false},
        ${false}
      )
      RETURNING id, sku, descripcion, categoria_comercial, unidad_medida, precio_publico, anulado, created_at
    `;

    if (insertada.length === 0) {
      return {
        ok: false,
        error: `Inserción del SKU "${sku}" no devolvió fila`,
        sku,
      };
    }

    const fila = insertada[0];

    return {
      ok: true,
      data: {
        sku: fila.sku,
        id: fila.id,
        mutated: true,
      },
    };
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : String(err);
    // Detectar violación de unique en sku (carrera de condiciones)
    if (mensaje.includes('unique') || mensaje.includes('duplic')) {
      return {
        ok: false,
        error: `El SKU "${sku}" ya existe (conflicto de unicidad)`,
        sku,
      };
    }
    return {
      ok: false,
      error: mensaje,
      sku,
    };
  } finally {
    await sql.end();
  }
}

if ((import.meta as { main?: boolean }).main ?? false) {
  // Uso CLI: npx tsx src/sync_create_product.ts <SKU> '<DESCRIPCION>' [CATEGORIA]
  const args = process.argv.slice(2);
  const sku = args[0];
  const descripcion = args[1];
  const categoria = args[2] || CATEGORIA_CAD_DEFAULT;

  if (!sku || !descripcion) {
    console.error(
      'Uso: npx tsx src/sync_create_product.ts <SKU> "<DESCRIPCION>" [CATEGORIA]',
    );
    process.exit(1);
  }

  const resultado = await syncCreateProduct({
    sku,
    descripcion,
    categoria_comercial: categoria,
    parametros_tecnicos: {},
  });

  if (resultado.ok) {
    console.log('[sync_create_product] OK');
    console.log(JSON.stringify(resultado.data, null, 2));
  } else {
    console.error('[sync_create_product] ERROR:', resultado.error, resultado.sku ? `(sku=${resultado.sku})` : '');
    process.exit(1);
  }
}
