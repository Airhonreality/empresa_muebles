// ============================================================================
// vdo_erp_sync/src/sync_pull_catalog.ts
// MCP Tool: sync_pull_catalog
// Lee los herrajes desde Neon PostgreSQL (tabla productos_catalogo),
// valida cada fila con el esquema Zod y actualiza el catálogo local
// vdo_hardware_catalog.json de VDO.
// SOLO LECTURA de la base de datos. No muta nada en Neon.
// ============================================================================

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ErpProductoSchema, type ErpProductoInferido } from './schemas.js';
import { clienteLectura } from './db.js';
import type {
  VdoHardwareCatalog,
  VdoHardwareEntry,
  PullCatalogReport,
  SyncResult,
} from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VDO_ROOT = join(__dirname, '..', '..');
const CATALOGO_PATH_TOOLS = join(VDO_ROOT, 'vdo_hardware_catalog.json');
const CATALOGO_PATH_FREECAD = '/home/javi/.local/share/FreeCAD/Macro/vdo_hardware_catalog.json';

const CATEGORIA_POR_DEFECTO = 'SinCategorizar';

function mapearCategoriaERP(cat: string | null): string {
  if (!cat) return CATEGORIA_POR_DEFECTO;
  const c = cat.trim();
  if (!c) return CATEGORIA_POR_DEFECTO;
  return c.replace(/\s+/g, '_');
}

function erpAOEntradaVDO(p: ErpProductoInferido, proveedorNombre: string | null): VdoHardwareEntry {
  const cp = Array.isArray(p.campos_personalizados) && p.campos_personalizados.length > 0
    ? (p.campos_personalizados[0] as Record<string, unknown> ?? {})
    : {};
  return {
    nombre: p.descripcion,
    proveedor: proveedorNombre ?? 'Sin proveedor asignado',
    precio_unitario: Number(p.precio_publico ?? 0),
    moneda: 'USD', // convención VDO; el ERP almacena en COP (ver diagnóstico Fase 2)
    parametros_tecnicos: cp,
  };
}

export async function syncPullCatalog({
  databaseUrl,
  catalogoPath = CATALOGO_PATH_TOOLS,
}: {
  databaseUrl?: string;
  catalogoPath?: string;
}): Promise<SyncResult<PullCatalogReport>> {
  const sql = clienteLectura(databaseUrl);
  const reporte: PullCatalogReport = {
    total_erp: 0,
    insertados: 0,
    actualizados: 0,
    saltados: 0,
    errores: [],
  };

  try {
    // ─── LECTURA SOLO ────────────────────────────────────────────────────
    const filas = await sql`
      SELECT
        pc.id, pc.sku, pc.descripcion, pc.tipo, pc.unidad_medida,
        pc.precio_directo, pc.precio_publico, pc.stock_actual,
        pc.proveedor_id, pc.imagen_url, pc.galeria_imagenes_url,
        pc.campos_personalizados, pc.ficha_tecnica_urls,
        pc.modelo_3d_url, pc.categoria_comercial, pc.publicado_web,
        pc.anulado, pc.created_at, pc.updated_at, pc.proyecto_origen_id,
        pr.nombre AS proveedor_nombre
      FROM productos_catalogo pc
      LEFT JOIN proveedores pr ON pc.proveedor_id = pr.id
      ORDER BY pc.sku
    `;

    reporte.total_erp = filas.length;

    const catalogoExistente: VdoHardwareCatalog = existsSync(catalogoPath)
      ? JSON.parse(readFileSync(catalogoPath, 'utf-8'))
      : {};

    const nuevoCatalogo: VdoHardwareCatalog = {};

    for (const fila of filas) {
      // ─── VALIDACIÓN TIPO ───────────────────────────────────────────────
      const validacion = ErpProductoSchema.safeParse(fila);
      if (!validacion.success) {
        reporte.errores.push({
          sku: fila.sku ?? null,
          razon: `validación falló: ${validacion.error.issues.map((i) => i.message).join('; ')}`,
        });
        reporte.saltados++;
        continue;
      }

      const p: ErpProductoInferido = validacion.data;
      const categoria = mapearCategoriaERP(p.categoria_comercial ?? null);

      if (!nuevoCatalogo[categoria]) {
        nuevoCatalogo[categoria] = {};
      }

      const entrada = erpAOEntradaVDO(p, fila.proveedor_nombre);

      // Preserva entrada previa si existe
      const previa = catalogoExistente[categoria]?.[p.sku];
      if (previa) {
        reporte.actualizados++;
        nuevoCatalogo[categoria][p.sku] = { ...previa, ...entrada };
      } else {
        reporte.insertados++;
        nuevoCatalogo[categoria][p.sku] = entrada;
      }
    }

    // ─── ESCRITURA LOCAL (archivo JSON de VDO, no la BD) ─────────────────
    // Escribe en la carpeta de herramientas y en la carpeta de macros de FreeCAD.
    const catalogoJson = JSON.stringify(nuevoCatalogo, null, 2) + '\n';
    writeFileSync(catalogoPath, catalogoJson, 'utf-8');
    try {
      writeFileSync(CATALOGO_PATH_FREECAD, catalogoJson, 'utf-8');
    } catch (err) {
      // No fallar la operación si la carpeta de FreeCAD no es accesible;
      // se reporta pero la copia de herramientas queda válida.
      reporte.errores.push({
        sku: null,
        razon: `No se pudo escribir copia en FreeCAD Macro: ${err instanceof Error ? err.message : String(err)}`,
      });
    }

    return { ok: true, data: reporte };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    await sql.end();
  }
}

if ((import.meta as { main?: boolean }).main ?? false) {
  const resultado = await syncPullCatalog({});
  if (resultado.ok) {
    console.log('[sync_pull_catalog] OK');
    console.log(JSON.stringify(resultado.data, null, 2));
  } else {
    console.error('[sync_pull_catalog] ERROR:', resultado.error);
    process.exit(1);
  }
}
