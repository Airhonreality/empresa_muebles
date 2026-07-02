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
  // 3. ZAP: zap_generar_comisiones_proyecto (Agnóstico & Determinista)
  // ──────────────────────────────────────────────────────────────────────────
  const zapGenerarComisiones = `
const proyecto = payload.record;
if (!proyecto || (!proyecto.id && !proyecto.codigo_contrato)) {
  api.notify.error("Debes accionar este Zap seleccionando un Proyecto o Contrato válido.");
  return;
}

const projId = proyecto.id || proyecto.proyecto_id;
const [movimientos, compras, horas, usuarios] = await Promise.all([
  api.query('movimientos_financieros'),
  api.query('compras_materiales'),
  api.query('registro_horas'),
  api.query('usuarios_equipo')
]);

// A. Ingresos Reales Asentados
const ingresos = movimientos
  .filter(m => (m.proyecto_id === projId || m.contrato_id === projId) && m.tipo === 'ingreso' && m.estado !== 'anulado')
  .reduce((acc, m) => acc + (Number(m.monto) || 0), 0);

// B. Egresos Reales Insumos
const costoMateriales = compras
  .filter(c => c.proyecto_id === projId || c.origen_proyecto === projId)
  .reduce((acc, c) => acc + (Number(c.costo_real_compra) || 0), 0);

// C. Costo Laboral TGS
const costoLaboral = horas
  .filter(h => h.proyecto_id === projId)
  .reduce((acc, h) => {
    const usr = usuarios.find(u => u.id === h.usuario_id);
    const tarifa = usr ? (Number(usr.costo_hora) || 0) : 0;
    return acc + ((Number(h.horas_ordinarias)||0 + (Number(h.horas_extras)||0)) * tarifa);
  }, 0);

const utilidadNeta = ingresos - (costoMateriales + costoLaboral);

if (utilidadNeta <= 0) {
  api.notify.error("El proyecto aún no presenta utilidad neta operativa positiva para liquidar comisiones.");
  return;
}

// Generar obligaciones pendientes agnósticamente para miembros participantes
const participantes = new Set(horas.filter(h => h.proyecto_id === projId).map(h => h.usuario_id));
let obligacionesCreadas = 0;

for (const usrId of participantes) {
  const miembro = usuarios.find(u => u.id === usrId);
  if (!miembro) continue;

  // Cálculo agnóstico de bono/comisión por proyecto (ej. factor proporcional o 5% estándar derivado)
  const bono = Math.round(utilidadNeta * 0.05);
  if (bono <= 0) continue;

  let semantica = \`### Liquidación Agnóstica de Rendimiento\\n\`;
  semantica += \`**Proyecto ID:** \${projId}\\n\`;
  semantica += \`**Beneficiario:** \${miembro.nombre}\\n\\n\`;
  semantica += \`| Concepto | Monto Reconciliado |\\n|---|---|\\n\`;
  semantica += \`| (+) Ingresos Proyecto | $\${ingresos} |\\n\`;
  semantica += \`| (-) Insumos & Materiales | $\${costoMateriales} |\\n\`;
  semantica += \`| (-) Mano Obra Taller | $\${costoLaboral} |\\n\`;
  semantica += \`| **(=) UTILIDAD NETA** | **$\${utilidadNeta}** |\\n\\n\`;
  semantica += \`**Cuota Asignada:** $\${bono}\`;

  await api.saveItem('obligaciones_pendientes', {
    data: {
      descripcion: \`Comisión/Rendimiento - Proyecto \${proyecto.nombre_proyecto || projId} (\${miembro.nombre})\`,
      tipo: "por_pagar",
      categoria_subtipo: "nomina_comision",
      monto_total: bono,
      monto_pagado: 0,
      estado: "pendiente",
      usuario_id: miembro.id,
      proyecto_id: projId,
      descripcion_semantica: semantica,
      fecha_vencimiento: new Date().toISOString().split('T')[0]
    }
  });
  obligacionesCreadas++;
}

api.notify.success(\`¡Liquidación completada! \${obligacionesCreadas} obligaciones generadas en Cuentas Pendientes.\`);
  `;

  const scripts = [
    { name: 'zap_registrar_pago', code: zapRegistrarPago.trim() },
    { name: 'zap_anular_movimiento', code: zapAnularMovimiento.trim() },
    { name: 'zap_generar_comisiones_proyecto', code: zapGenerarComisiones.trim() }
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
