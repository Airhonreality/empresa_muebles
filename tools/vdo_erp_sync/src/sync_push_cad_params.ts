// ============================================================================
// vdo_erp_sync/src/sync_push_cad_params.ts
// MCP Tool: sync_push_cad_params
// Toma las cotas milimétricas calibradas en FreeCAD y hace un PATCH/UPDATE
// ATÓMICO sobre la columna JSONB `campos_personalizados` del SKU correspondiente
// en Neon, SIN TOCAR precios ni nombres comerciales.
// Regla de oro: solo campos de autoría técnica CAD entran aquí.
// ============================================================================

import { PushCadParamsInputSchema } from './schemas.js';
import { clienteEscritura } from './db.js';
import type {
  PushCadParamsInput,
  PushCadParamsResult,
  SyncResult,
} from './types.js';

export async function syncPushCadParams(
  input: PushCadParamsInput,
  { databaseUrl }: { databaseUrl?: string } = {},
): Promise<SyncResult<PushCadParamsResult>> {
  const validado = PushCadParamsInputSchema.safeParse(input);
  if (!validado.success) {
    return {
      ok: false,
      error: `validación de entrada falló: ${validado.error.issues.map((i) => i.message).join('; ')}`,
      sku: input.sku,
    };
  }

  const { sku, parametros_tecnicos, dry_run = false } = validado.data;
  const sql = clienteEscritura(databaseUrl);

  try {
    // ─── LECTURA DEL ESTADO ANTES (solo lectura) ─────────────────────────
    const antes = await sql`
      SELECT sku, descripcion, precio_publico, campos_personalizados
      FROM productos_catalogo
      WHERE sku = ${sku}
      LIMIT 1
    `;

    if (antes.length === 0) {
      return {
        ok: false,
        error: `SKU "${sku}" no existe en productos_catalogo`,
        sku,
      };
    }

    const filaAntes = antes[0];
    const camposAntes = Array.isArray(filaAntes.campos_personalizados)
      ? filaAntes.campos_personalizados
      : [];

    if (dry_run) {
      return {
        ok: true,
        data: {
          sku,
          mutated: false,
          dry_run: true,
          campos_antes: camposAntes,
          campos_despues: [parametros_tecnicos],
        },
      };
    }

    // ─── ESCRITURA ATÓMICA: solo campos_personalizados ───────────────────
    // NUNCA se tocan precio_publico, descripcion, precio_directo, unidad_medida, etc.
    // JSON.stringify + cast ::jsonb para evitar que postgres expanda el array en varios parámetros.
    const despues = await sql`
      UPDATE productos_catalogo
      SET campos_personalizados = ${JSON.stringify(parametros_tecnicos)}::jsonb,
          updated_at = now()
      WHERE sku = ${sku}
      RETURNING sku, campos_personalizados
    `;

    if (despues.length === 0) {
      return {
        ok: false,
        error: `No se pudo actualizar el SKU "${sku}" (fila no encontrada en UPDATE)`,
        sku,
      };
    }

    return {
      ok: true,
      data: {
        sku,
        mutated: true,
        dry_run: false,
        campos_antes: camposAntes,
        campos_despues: [parametros_tecnicos],
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      sku,
    };
  } finally {
    await sql.end();
  }
}

if ((import.meta as { main?: boolean }).main ?? false) {
  const args = process.argv.slice(2);
  const sku = args[0];
  const jsonParametros = args[1];
  const dryRun = args.includes('--dry-run');

  if (!sku || !jsonParametros) {
    console.error(
      'Uso: npx tsx src/sync_push_cad_params.ts <SKU> \'{ "cota_k_default": 4.0 }\' [--dry-run]',
    );
    process.exit(1);
  }

  let parametros_tecnicos: Record<string, unknown>;
  try {
    parametros_tecnicos = JSON.parse(jsonParametros);
  } catch (err) {
    console.error('[sync_push_cad_params] JSON de parámetros inválido:', err);
    process.exit(1);
  }

  const resultado = await syncPushCadParams({ sku, parametros_tecnicos, dry_run: dryRun });
  if (resultado.ok) {
    console.log('[sync_push_cad_params] OK');
    console.log(JSON.stringify(resultado.data, null, 2));
  } else {
    console.error('[sync_push_cad_params] ERROR:', resultado.error, resultado.sku ? `(sku=${resultado.sku})` : '');
    process.exit(1);
  }
}
