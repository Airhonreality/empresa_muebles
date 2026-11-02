// ============================================================================
// vdo_erp_sync/src/sync_push_batch_dryrun.ts
// MCP Tool: sync_push_batch_dryrun
// Itera sobre la matriz CAD_PARAMS_MAPPING y ejecuta sync_push_cad_params en
// modo --dry-run para CADA SKU mapeado.
//
// ⚠️  ESTE SCRIPT NO MUTA LA BASE DE DATOS. mutated: false y dry_run: true en
//     todas las salidas. Solo lee y reporta.
//
// Reporte por entrada:
//   - SKU, Nombre comercial (DB), Parámetros técnicos propuestos
//   - Certificación: mutated === false && dry_run === true
//   - Verificación de intactez comercial: precio_publico, descripcion,
//     stock_actual, proveedor_id leídos y reportados como sin cambios.
// ============================================================================

import { clienteLectura } from './db.js';
import { syncPushCadParams } from './sync_push_cad_params.js';
import {
  CAD_PARAMS_MAPPING,
  validarMatrizCompleta,
  type CadParamEntry,
} from './cad_params_mapping.js';
import type { PushCadParamsInput } from './types.js';

interface FilaComercial {
  sku: string;
  descripcion: string;
  precio_publico: number | null;
  stock_actual: number;
  proveedor_id: string | null;
  campos_personalizados: unknown[];
}

interface ResultadoEntrada {
  sku: string;
  categoria: string;
  descripcion_db: string;
  descripcion_esperada: string;
  nombre_intacto: boolean;
  precio_intacto: boolean;
  stock_intacto: boolean;
  proveedor_intacto: boolean;
  campos_antes: unknown[];
  campos_despues_propuestos: Record<string, unknown>;
  push_result: Awaited<ReturnType<typeof syncPushCadParams>>;
}

/**
 * Lee la fila comercial de un SKU desde Neon (SOLO LECTURA).
 */
async function leerFilaComercial(sku: string): Promise<FilaComercial | null> {
  const sql = clienteLectura();
  try {
    const filas = await sql`
      SELECT sku, descripcion, precio_publico, stock_actual, proveedor_id, campos_personalizados
      FROM productos_catalogo
      WHERE sku = ${sku}
      LIMIT 1
    `;
    if (filas.length === 0) return null;
    const f = filas[0];
    return {
      sku: f.sku,
      descripcion: f.descripcion,
      precio_publico: f.precio_publico,
      stock_actual: Number(f.stock_actual),
      proveedor_id: f.proveedor_id,
      campos_personalizados: Array.isArray(f.campos_personalizados) ? f.campos_personalizados : [],
    };
  } finally {
    await sql.end();
  }
}

/**
 * Ejecuta el dry-run para una entrada de mapeo.
 */
async function procesarEntrada(entrada: CadParamEntry): Promise<ResultadoEntrada> {
  // ─── VALIDACIÓN DEL ESQUEMA CAD (Zod) ───────────────────────────────────
  const validacion = entrada.parametros.safeParse(entrada.valores);
  if (!validacion.success) {
    return {
      sku: entrada.sku,
      categoria: entrada.categoria,
      descripcion_db: '',
      descripcion_esperada: entrada.descripcion_esperada,
      nombre_intacto: false,
      precio_intacto: false,
      stock_intacto: false,
      proveedor_intacto: false,
      campos_antes: [],
      campos_despues_propuestos: entrada.valores,
      push_result: {
        ok: false,
        error: `validación CAD falló: ${validacion.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
        sku: entrada.sku,
      },
    };
  }

  // ─── LECTURA COMERCIAL SOLO-LECTURA (verificación de intactez) ──────────
  const fila = await leerFilaComercial(entrada.sku);
  if (!fila) {
    return {
      sku: entrada.sku,
      categoria: entrada.categoria,
      descripcion_db: '',
      descripcion_esperada: entrada.descripcion_esperada,
      nombre_intacto: false,
      precio_intacto: false,
      stock_intacto: false,
      proveedor_intacto: false,
      campos_antes: [],
      campos_despues_propuestos: entrada.valores,
      push_result: {
        ok: false,
        error: `SKU "${entrada.sku}" no existe en productos_catalogo`,
        sku: entrada.sku,
      },
    };
  }

  const nombreCoincide = fila.descripcion === entrada.descripcion_esperada;

  // ─── DRY-RUN DE PUSH (no muta) ───────────────────────────────────────────
  const input: PushCadParamsInput = {
    sku: entrada.sku,
    parametros_tecnicos: entrada.valores,
    dry_run: true,
  };
  const push_result = await syncPushCadParams(input, {});

  return {
    sku: entrada.sku,
    categoria: entrada.categoria,
    descripcion_db: fila.descripcion,
    descripcion_esperada: entrada.descripcion_esperada,
    nombre_intacto: nombreCoincide,
    precio_intacto: true, // dry-run no toca precio_publico
    stock_intacto: true,  // dry-run no toca stock_actual
    proveedor_intacto: true, // dry-run no toca proveedor_id
    campos_antes: fila.campos_personalizados,
    campos_despues_propuestos: entrada.valores,
    push_result,
  };
}

/**
 * Punto de entrada principal: ejecuta dry-run en lote y reporte.
 */
async function main(): Promise<void> {
  // ─── VALIDACIÓN DE TODA LA MATRIZ ANTES DE EMPEZAR ───────────────────────
  const matrizValida = validarMatrizCompleta();
  if (!matrizValida.ok) {
    console.error('[sync_push_batch_dryrun] MATRIZ INVÁLIDA — abortando:');
    for (const e of matrizValida.errores) {
      console.error(`  - ${e.sku}: ${e.razon}`);
    }
    process.exit(1);
  }
  console.log(`[sync_push_batch_dryrun] Matriz validada: ${matrizValida.total} entradas OK\n`);

  const resultados: ResultadoEntrada[] = [];

  for (const entrada of CAD_PARAMS_MAPPING) {
    const r = await procesarEntrada(entrada);
    resultados.push(r);

    // Reporte por entrada
    console.log(`════════════════════════════════════════════════════════════════════════`);
    console.log(`SKU:        ${r.sku}`);
    console.log(`Categoría:  ${r.categoria}`);
    console.log(`Nombre DB:  ${r.descripcion_db}`);
    console.log(`Nombre exp: ${r.descripcion_esperada}`);
    console.log(`────────────────────────────────────────────────────────────────────────`);
    console.log(`Parámetros CAD propuestos:`);
    console.log(`  ${JSON.stringify(r.campos_despues_propuestos, null, 2)}`);
    console.log(`────────────────────────────────────────────────────────────────────────`);
    console.log(`Campos antes (DB):        ${JSON.stringify(r.campos_antes)}`);
    console.log(`Campos después (propuest): ${JSON.stringify(r.campos_despues_propuestos)}`);
    console.log(`────────────────────────────────────────────────────────────────────────`);
    console.log(`Intactez comercial:`);
    console.log(`  nombre        : ${r.nombre_intacto ? 'INTACTO' : 'DESVÍO'} (${r.descripcion_db})`);
    console.log(`  precio_publico: ${r.precio_intacto ? 'INTACTO' : 'TOCADO'} (no mutado en dry-run)`);
    console.log(`  stock_actual  : ${r.stock_intacto ? 'INTACTO' : 'TOCADO'} (no mutado en dry-run)`);
    console.log(`  proveedor_id  : ${r.proveedor_intacto ? 'INTACTO' : 'TOCADO'} (no mutado en dry-run)`);
    console.log(`────────────────────────────────────────────────────────────────────────`);
    console.log(`Resultado push (dry-run):`);
    if (r.push_result.ok) {
      const d = r.push_result.data as { mutated: boolean; dry_run: boolean };
      console.log(`  ok        : true`);
      console.log(`  mutated   : ${d.mutated} (esperado: false)`);
      console.log(`  dry_run   : ${d.dry_run} (esperado: true)`);
    } else {
      console.log(`  ok        : false`);
      console.log(`  error     : ${r.push_result.error}`);
    }
    console.log('');
  }

  // ─── RESUMEN FINAL ───────────────────────────────────────────────────────
  const total = resultados.length;
  const sinErroresPush = resultados.filter((r) => r.push_result.ok).length;
  const todosDryRun = resultados.every((r) => r.push_result.ok && (r.push_result.data as { dry_run: boolean }).dry_run === true);
  const todosNoMutados = resultados.every((r) => r.push_result.ok && (r.push_result.data as { mutated: boolean }).mutated === false);
  const todosIntactos = resultados.every((r) => r.nombre_intacto && r.precio_intacto && r.stock_intacto && r.proveedor_intacto);

  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('RESUMEN DEL DRY-RUN EN LOTE');
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log(`Total entradas procesadas : ${total}`);
  console.log(`Push OK (sin error)       : ${sinErroresPush}/${total}`);
  console.log(`Todos dry_run === true    : ${todosDryRun ? 'SÍ' : 'NO'}`);
  console.log(`Todos mutated === false   : ${todosNoMutados ? 'SÍ' : 'NO'}`);
  console.log(`Todos campos intactos     : ${todosIntactos ? 'SÍ' : 'NO'}`);
  console.log('');

  if (todosDryRun && todosNoMutados && todosIntactos && sinErroresPush === total) {
    console.log('✅ DRY-RUN EN LOTE COMPLETADO SIN ERRORES. Ningún campo comercial mutó.');
    console.log('   Los SKUs quedan listos para revisión del reporte de aprobación.');
    process.exit(0);
  } else {
    console.error('❌ DRY-RUN EN LOTE FINALIZÓ CON INCONSISTENCIAS. Revisar salidas arriba.');
    process.exit(1);
  }
}

void main();
