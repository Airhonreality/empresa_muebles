/**
 * 🚀 DEPLOYER DE ZAPS FINANCIEROS AXIOMÁTICOS (deploy_finanzas_zaps.ts)
 * =====================================================================
 * Despliega los 3 scripts deterministas de finanzas directamente a la tabla
 * "scripts" de Postgres Neon, listos para ser ejecutados por /api/engine.
 *
 * Ejecutar: npx tsx scripts/deploy_finanzas_zaps.ts
 */

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { getStrategy } from '../src/server/getStrategy';
import { randomUUID } from 'crypto';

async function run() {
  console.log('📡 Conectando a Postgres Cloud vía getStrategy()...');
  const strategy = getStrategy();

  // ──────────────────────────────────────────────────────────────────────────
  // 1. ZAP: zap_registrar_pago
  // ──────────────────────────────────────────────────────────────────────────
  const zapRegistrarPago = `
const mov = payload.record;
if (!mov || !mov.obligacion_id) {
  api.notify.error("El movimiento financiero no está atado a ninguna obligación pendiente.");
  return;
}

const movimientos = await api.query('movimientos_financieros');
const validos = movimientos.filter(m => m.obligacion_id === mov.obligacion_id && m.estado !== 'anulado');
const totalPagado = validos.reduce((acc, m) => acc + (Number(m.monto) || 0), 0);

const obligaciones = await api.query('obligaciones_pendientes');
const obligacion = obligaciones.find(o => o.id === mov.obligacion_id);

if (!obligacion) {
  api.notify.error("No se encontró el registro original en obligaciones_pendientes.");
  return;
}

const montoTotal = Number(obligacion.monto_total) || 0;
let nuevoEstado = "pendiente";

if (totalPagado >= montoTotal && montoTotal > 0) {
  nuevoEstado = "pagado";
} else if (totalPagado > 0) {
  nuevoEstado = "parcial";
}

await api.saveItem('obligaciones_pendientes', {
  id: obligacion.id,
  data: {
    ...obligacion,
    monto_pagado: totalPagado,
    estado: nuevoEstado
  }
});

api.notify.success(\`Balance actualizado axiomáticamente: $\${totalPagado} / $\${montoTotal} (\${nuevoEstado})\`);
  `;

  // ──────────────────────────────────────────────────────────────────────────
  // 2. ZAP: zap_anular_movimiento
  // ──────────────────────────────────────────────────────────────────────────
  const zapAnularMovimiento = `
const mov = payload.record;
if (!mov || !mov.id) {
  api.notify.error("No se seleccionó un movimiento válido para anular.");
  return;
}

await api.saveItem('movimientos_financieros', {
  id: mov.id,
  data: { ...mov, estado: 'anulado' }
});

if (mov.obligacion_id) {
  const movimientos = await api.query('movimientos_financieros');
  const validos = movimientos.filter(m => m.obligacion_id === mov.obligacion_id && m.id !== mov.id && m.estado !== 'anulado');
  const totalPagado = validos.reduce((acc, m) => acc + (Number(m.monto) || 0), 0);
  
  const obligaciones = await api.query('obligaciones_pendientes');
  const obligacion = obligaciones.find(o => o.id === mov.obligacion_id);
  if (obligacion) {
    const montoTotal = Number(obligacion.monto_total) || 0;
    const nuevoEstado = totalPagado >= montoTotal && montoTotal > 0 ? "pagado" : (totalPagado > 0 ? "parcial" : "pendiente");
    await api.saveItem('obligaciones_pendientes', {
      id: obligacion.id,
      data: { ...obligacion, monto_pagado: totalPagado, estado: nuevoEstado }
    });
  }
}

api.notify.success("Movimiento anulado. Trazabilidad preservada y saldo recalculado.");
  `;

  // ──────────────────────────────────────────────────────────────────────────
  // 3. ZAP: zap_liquidar_utilidades_proyecto
  // ──────────────────────────────────────────────────────────────────────────
  const zapLiquidarUtilidades = `
const proyecto = payload.record;
if (!proyecto || !proyecto.id) {
  api.notify.error("Debes accionar este Zap seleccionando una ficha de Proyecto o Contrato.");
  return;
}

const [movimientos, compras, horas, usuarios] = await Promise.all([
  api.query('movimientos_financieros'),
  api.query('compras_materiales'),
  api.query('registro_horas'),
  api.query('usuarios_equipo')
]);

const projId = proyecto.id;
const cotId = proyecto.cotizacion_id;

// A. Ingresos Reales Asentados en el Ledger
const ingresos = movimientos
  .filter(m => (m.proyecto_id === projId || m.contrato_id === projId) && m.tipo === 'ingreso' && m.estado !== 'anulado')
  .reduce((acc, m) => acc + (Number(m.monto) || 0), 0);

// B. Egresos Reales por Compras e Insumos
const costoMateriales = compras
  .filter(c => c.proyecto_id === projId || c.cotizacion_id === cotId)
  .reduce((acc, c) => acc + (Number(c.costo_real_compra) || 0), 0);

// C. Costo Laboral Taller (Horas Ordinarias + Extras x Tarifa Operario)
const costoLaboral = horas
  .filter(h => h.proyecto_id === projId)
  .reduce((acc, h) => {
    const operario = usuarios.find(u => u.id === h.usuario_id);
    const tarifa = operario ? (Number(operario.costo_hora) || 0) : 0;
    const hrsOrd = Number(h.horas_ordinarias) || 0;
    const hrsExt = Number(h.horas_extras) || 0;
    // Axioma: Horas extras con factor 1.25x o 1.5x (asumimos valor ordinario base)
    return acc + ((hrsOrd + hrsExt) * tarifa);
  }, 0);

const utilidadNeta = ingresos - (costoMateriales + costoLaboral);
const cuotaHarold = utilidadNeta * 0.05;

const socioHarold = usuarios.find(u => u.nombre && u.nombre.toLowerCase().includes('harold'));
if (!socioHarold) {
  api.notify.error("No se detectó el perfil de Harold en usuarios_equipo.");
  return;
}

let semantica = \`### Liquidación Axiomática de Proyecto\\n\`;
semantica += \`**Proyecto:** \${proyecto.nombre_proyecto || proyecto.nombre || projId}\\n\\n\`;
semantica += \`| Concepto | Monto Asentado |\\n|---|---|\\n\`;
semantica += \`| (+) Ingresos Totales | $\${ingresos} |\\n\`;
semantica += \`| (-) Materiales, Fletes e Insumos | $\${costoMateriales} |\\n\`;
semantica += \`| (-) Mano de Obra Taller (TGS) | $\${costoLaboral} |\\n\`;
semantica += \`| **(=) UTILIDAD NETA OPERATIVA** | **$\${utilidadNeta}** |\\n\\n\`;
semantica += \`**Dividendo Socio Harold (5%):** $\${cuotaHarold}\`;

await api.saveItem('obligaciones_pendientes', {
  data: {
    descripcion: \`Liquidación Participación Socio (5%) - Proyecto \${proyecto.nombre_proyecto || projId}\`,
    tipo: "por_pagar",
    monto_total: cuotaHarold > 0 ? cuotaHarold : 0,
    monto_pagado: 0,
    estado: "pendiente",
    usuario_id: socioHarold.id,
    proyecto_id: projId,
    descripcion_semantica: semantica,
    fecha_vencimiento: new Date().toISOString().split('T')[0]
  }
});

api.notify.success(\`¡Proyecto liquidado! Utilidad real: $\${utilidadNeta}. Obligación creada por $\${cuotaHarold}\`);
  `;

  const scripts = [
    { name: 'zap_registrar_pago', code: zapRegistrarPago.trim() },
    { name: 'zap_anular_movimiento', code: zapAnularMovimiento.trim() },
    { name: 'zap_liquidar_utilidades_proyecto', code: zapLiquidarUtilidades.trim() }
  ];

  for (const s of scripts) {
    console.log(`🚀 Desplegando script [${s.name}] en Postgres...`);
    await strategy.write('scripts', {
      id: randomUUID(),
      context: 'scripts',
      data: { name: s.name, code: s.code },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  console.log('\n✅ ¡Despliegue completado! Los 3 Zaps financieros ya viven en producción (Postgres).');
}

run().catch(err => {
  console.error('❌ Falló el despliegue:', err);
  process.exit(1);
});
