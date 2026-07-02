/**
 * 🚀 DEPLOYER MAESTRO DE FINANZAS AXIOMÁTICAS (deploy_finanzas_master.ts)
 * =======================================================================
 * Despliega los 5 schemas financieros, la ruta /app/finanzas, cuentas semilla
 * y los 4 Zaps canónicos directamente en Postgres Neon Cloud y disco local.
 *
 * Ejecutar: npx tsx scripts/deploy_finanzas_master.ts
 */

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { getStrategy } from '../src/server/getStrategy';
import { SYSTEM_NS } from '../src/lib/agnostic/constants';

async function run() {
  console.log('📡 Conectando al motor de persistencia activa (Neon Cloud)...');
  const strategy = getStrategy();

  // ──────────────────────────────────────────────────────────────────────────
  // 1. DESPLIEGUE DE LOS 5 SCHEMAS FINANCIEROS
  // ──────────────────────────────────────────────────────────────────────────
  console.log('📦 Consultando esquemas actuales en nube...');
  const schemas = (await strategy.read(SYSTEM_NS.SCHEMAS)) || [];

  const nuevosSchemas = [
    {
      name: 'cuentas_financieras',
      fields: [
        { key: 'nombre', label: 'Nombre de Cuenta', type: 'text', required: true, isPrimary: true, width: 'full' },
        { key: 'tipo', label: 'Tipo', type: 'select', required: true, width: 'half', config: { options: ['banco', 'efectivo', 'pasarela', 'billetera_digital'] } },
        { key: 'saldo_inicial', label: 'Saldo Inicial', type: 'number', required: true, width: 'half' },
        { key: 'saldo_actual', label: 'Saldo Actual', type: 'number', width: 'half' },
        { key: 'estado', label: 'Estado', type: 'select', width: 'half', config: { options: ['activa', 'inactiva'] } },
        { key: 'descripcion_semantica', label: 'Descripción Semántica', type: 'markdown', width: 'full' }
      ]
    },
    {
      name: 'categorias_financieras',
      fields: [
        { key: 'nombre', label: 'Nombre Categoría', type: 'text', required: true, isPrimary: true, width: 'full' },
        { key: 'tipo_flujo', label: 'Tipo de Flujo', type: 'select', required: true, width: 'half', config: { options: ['ingreso', 'egreso'] } },
        { key: 'subtipo', label: 'Subtipo', type: 'select', required: true, width: 'half', config: { options: ['capex', 'opex', 'costos_directos'] } },
        { key: 'descripcion_semantica', label: 'Propósito Semántico', type: 'markdown', width: 'full' }
      ]
    },
    {
      name: 'obligaciones_pendientes',
      fields: [
        { key: 'descripcion', label: 'Obligación / Concepto', type: 'text', required: true, isPrimary: true, width: 'full' },
        { key: 'tipo', label: 'Naturaleza', type: 'select', required: true, width: 'third', config: { options: ['por_pagar', 'por_cobrar'] } },
        { key: 'monto_total', label: 'Monto Total Estimado', type: 'number', required: true, width: 'third' },
        { key: 'monto_pagado', label: 'Monto Pagado Real', type: 'number', width: 'third' },
        { key: 'fecha_vencimiento', label: 'Fecha Vencimiento', type: 'date', width: 'half' },
        { key: 'estado', label: 'Estado', type: 'select', required: true, width: 'half', config: { options: ['pendiente', 'parcial', 'pagado', 'anulado'] } },
        { key: 'proveedor_id', label: 'Proveedor', type: 'relation', width: 'third', config: { entity: 'proveedores' } },
        { key: 'cliente_id', label: 'Cliente', type: 'relation', width: 'third', config: { entity: 'clientes' } },
        { key: 'usuario_id', label: 'Miembro Equipo', type: 'relation', width: 'third', config: { entity: 'usuarios_equipo' } },
        { key: 'descripcion_semantica', label: 'Soporte Semántico', type: 'markdown', width: 'full' }
      ]
    },
    {
      name: 'comprobantes_financieros',
      fields: [
        { key: 'numero_referencia', label: 'Ref / Factura', type: 'text', required: true, isPrimary: true, width: 'half' },
        { key: 'tipo', label: 'Tipo Comprobante', type: 'select', width: 'half', config: { options: ['factura_electronica', 'cuenta_cobro', 'recibo_caja', 'comprobante_bancario'] } },
        { key: 'archivo_soporte', label: 'Archivo Soporte URL', type: 'file', width: 'full' },
        { key: 'descripcion_semantica', label: 'Notas', type: 'markdown', width: 'full' }
      ]
    },
    {
      name: 'movimientos_financieros',
      fields: [
        { key: 'fecha', label: 'Fecha Asentado', type: 'date', required: true, width: 'third' },
        { key: 'descripcion', label: 'Descripción del Movimiento', type: 'text', required: true, isPrimary: true, width: 'third' },
        { key: 'tipo', label: 'Tipo', type: 'select', required: true, width: 'third', config: { options: ['ingreso', 'egreso', 'transferencia'] } },
        { key: 'monto', label: 'Monto Real ($)', type: 'number', required: true, width: 'half' },
        { key: 'estado', label: 'Estado Ledger', type: 'select', required: true, width: 'half', config: { options: ['asentado', 'anulado'] } },
        { key: 'cuenta_origen_id', label: 'Cuenta Origen', type: 'relation', width: 'half', config: { entity: 'cuentas_financieras' } },
        { key: 'cuenta_destino_id', label: 'Cuenta Destino (Solo Traslado)', type: 'relation', width: 'half', config: { entity: 'cuentas_financieras' } },
        { key: 'categoria_id', label: 'Categoría', type: 'relation', width: 'third', config: { entity: 'categorias_financieras' } },
        { key: 'obligacion_id', label: 'Obligación Saldada', type: 'relation', width: 'third', config: { entity: 'obligaciones_pendientes' } },
        { key: 'comprobante_ref', label: 'Enlace Comprobante', type: 'text', width: 'third' },
        { key: 'descripcion_semantica', label: 'Auditoría', type: 'markdown', width: 'full' }
      ]
    }
  ];

  for (const newSch of nuevosSchemas) {
    const exist = schemas.find((s: any) => (s.data?.name || s.name) === newSch.name);
    const id = exist?.id || randomUUID();
    await strategy.write(SYSTEM_NS.SCHEMAS, {
      id,
      context: SYSTEM_NS.SCHEMAS,
      data: newSch
    });
    console.log(`  ✓ Schema asentado: ${newSch.name}`);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. DESPLIEGUE DE CUENTAS FINANCIERAS Y CATEGORÍAS SEMILLA
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n🏦 Poblando Cuentas Financieras semilla...');
  const cuentasSemilla = [
    { nombre: 'Bancolombia Negocios', tipo: 'banco', saldo_inicial: 0, saldo_actual: 0, estado: 'activa', descripcion_semantica: 'Cuenta empresarial principal de Veta Dorada.' },
    { nombre: 'Bancolombia Personal Javier', tipo: 'banco', saldo_inicial: 0, saldo_actual: 0, estado: 'activa', descripcion_semantica: 'Llave alterna, pagos oficiales y caja menor.' },
    { nombre: 'Nu Victor', tipo: 'billetera_digital', saldo_inicial: 0, saldo_actual: 0, estado: 'activa', descripcion_semantica: 'Cuenta operativa.' },
    { nombre: 'Nu Javier (Reservas)', tipo: 'billetera_digital', saldo_inicial: 0, saldo_actual: 0, estado: 'activa', descripcion_semantica: 'Fondo de liquidez y reservas estratégicas.' },
    { nombre: 'Nequi Javier', tipo: 'billetera_digital', saldo_inicial: 0, saldo_actual: 0, estado: 'activa', descripcion_semantica: 'Cobros rápidos in situ.' },
    { nombre: 'Nequi Victor (Caja menor)', tipo: 'billetera_digital', saldo_inicial: 0, saldo_actual: 0, estado: 'activa', descripcion_semantica: 'Gastos de taller inmediatos.' }
  ];

  const cuentasActuales = (await strategy.read('cuentas_financieras')) || [];
  for (const cta of cuentasSemilla) {
    const exist = cuentasActuales.find((c: any) => (c.data?.nombre || c.nombre) === cta.nombre);
    if (!exist) {
      await strategy.write('cuentas_financieras', {
        id: randomUUID(),
        context: 'cuentas_financieras',
        data: cta
      });
      console.log(`  + Cuenta creada: ${cta.nombre}`);
    }
  }

  console.log('\n🏷️ Poblando Categorías Financieras semilla...');
  const catSemilla = [
    { nombre: 'Arriendo Carpintería', tipo_flujo: 'egreso', subtipo: 'opex', descripcion_semantica: '$1.200.000 mensual fijo.' },
    { nombre: 'Nómina Directivos', tipo_flujo: 'egreso', subtipo: 'opex', descripcion_semantica: 'Victor ($2.5M), Javier ($2.0M), Harold ($2.5M).' },
    { nombre: 'Contabilidad Sebastián Moreno', tipo_flujo: 'egreso', subtipo: 'opex', descripcion_semantica: '$400.000 quincenal/mensual.' },
    { nombre: 'Oficiales de Taller Daniel Jaraba', tipo_flujo: 'egreso', subtipo: 'costos_directos', descripcion_semantica: '$80.000/día TGS.' },
    { nombre: 'Materiales e Insumos Taller', tipo_flujo: 'egreso', subtipo: 'costos_directos', descripcion_semantica: 'Maderas, herrajes, tornillos, pegantes.' },
    { nombre: 'Fletes y Transporte', tipo_flujo: 'egreso', subtipo: 'costos_directos', descripcion_semantica: 'Logística de obra y taller.' },
    { nombre: 'Anticipos Clientes (50%)', tipo_flujo: 'ingreso', subtipo: 'costos_directos', descripcion_semantica: 'Activación de fabricación.' },
    { nombre: 'Saldos e Instalaciones (50%)', tipo_flujo: 'ingreso', subtipo: 'costos_directos', descripcion_semantica: 'Cierre de contratos comerciales.' }
  ];

  const catsActuales = (await strategy.read('categorias_financieras')) || [];
  for (const cat of catSemilla) {
    const exist = catsActuales.find((c: any) => (c.data?.nombre || c.nombre) === cat.nombre);
    if (!exist) {
      await strategy.write('categorias_financieras', {
        id: randomUUID(),
        context: 'categorias_financieras',
        data: cat
      });
      console.log(`  + Categoría creada: ${cat.nombre}`);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. DESPLIEGUE DE LA RUTA /app/finanzas EN NUBE
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n🗺️ Registrando ruta envolvente /app/finanzas...');
  const routes = (await strategy.read(SYSTEM_NS.ROUTES)) || [];
  const routeExist = routes.find((r: any) => (r.data?.path || r.path) === '/app/finanzas');
  const routeId = routeExist?.id || randomUUID();
  const routeBlocks = (routeExist?.data?.blocks || routeExist?.blocks) || [
    {
      id: 'block_finanzas_shell',
      type: 'finanzas_shell'
    }
  ];

  await strategy.write(SYSTEM_NS.ROUTES, {
    id: routeId,
    context: SYSTEM_NS.ROUTES,
    data: {
      path: '/app/finanzas',
      title: 'Centro de Control Financiero y Tesorería',
      isPrivate: false,
      layout_mode: 'full',
      layout: {
        max_width: 'full',
        padding: [0, 0, 0, 0],
        gap: 0
      },
      blocks: routeBlocks
    }
  });
  console.log('  ✓ Ruta /app/finanzas asentada/actualizada con layout Edge-to-Edge puro.');

  // ──────────────────────────────────────────────────────────────────────────
  // 4. DESPLIEGUE FÍSICO Y CLOUD DE LOS 4 ZAPS CANÓNICOS
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n⚡ Escribiendo scripts de Zaps en disco local y tabla cloud...');
  const zapsDir = path.join(process.cwd(), 'storage', 'zaps');
  fs.mkdirSync(zapsDir, { recursive: true });

  const zapConvertirOrden = `
const { items = [], projectName = "Stock Taller" } = payload;
if (!items.length) {
  api.notify.error("La orden de compra de taller está vacía.");
  return;
}
let total = 0;
let semantica = "### Consolidado de Pedido Abastecimiento\\n**Origen:** " + projectName + "\\n\\n| Cantidad | Insumo | P. Unitario | Subtotal |\\n|---|---|---|---|\\n";
for (const it of items) {
  const sub = (Number(it.cantidad)||0) * (Number(it.precio_unitario)||0);
  total += sub;
  semantica += "| " + it.cantidad + " | " + it.nombre + " | $" + it.precio_unitario + " | $" + sub + " |\\n";
}
await api.saveItem('obligaciones_pendientes', {
  data: {
    descripcion: "Abastecimiento Taller — " + projectName,
    tipo: "por_pagar",
    monto_total: total,
    monto_pagado: 0,
    estado: "pendiente",
    fecha_vencimiento: new Date().toISOString().slice(0, 10),
    descripcion_semantica: semantica
  }
});
api.notify.success("✅ Pedido por $" + total + " transmitido a Compras y Finanzas axiomáticamente.");
  `.trim();

  const zapRegistrarPago = `
const { obligacion_id, cuenta_id, categoria_id, monto_pagado, fecha, comprobante_ref, descripcion } = payload;
const monto = Number(monto_pagado) || 0;
if (monto <= 0) {
  api.notify.error("El monto pagado debe ser mayor a cero.");
  return;
}
if (!cuenta_id) {
  api.notify.error("Debes seleccionar la cuenta financiera de origen.");
  return;
}
await api.saveItem('movimientos_financieros', {
  data: {
    fecha: fecha || new Date().toISOString().slice(0, 10),
    descripcion: descripcion || ("Pago de obligación " + (obligacion_id || '')),
    tipo: "egreso",
    monto: monto,
    cuenta_origen_id: cuenta_id,
    categoria_id: categoria_id || '',
    obligacion_id: obligacion_id || '',
    comprobante_ref: comprobante_ref || '',
    estado: "asentado"
  }
});

const cuentas = await api.query('cuentas_financieras');
const cta = cuentas.find(c => c.id === cuenta_id);
if (cta) {
  const ctaData = cta.data || cta;
  const nuevoSaldo = (Number(ctaData.saldo_actual || ctaData.saldo_inicial || 0)) - monto;
  await api.saveItem('cuentas_financieras', {
    id: cta.id,
    data: { ...ctaData, saldo_actual: nuevoSaldo }
  });
}

if (obligacion_id) {
  const obligaciones = await api.query('obligaciones_pendientes');
  const ob = obligaciones.find(o => o.id === obligacion_id);
  if (ob) {
    const obData = ob.data || ob;
    const movs = await api.query('movimientos_financieros');
    const pagadoTotal = movs
      .filter(m => (m.data?.obligacion_id === obligacion_id || m.obligacion_id === obligacion_id) && (m.data?.estado !== 'anulado' && m.estado !== 'anulado'))
      .reduce((acc, m) => acc + (Number(m.data?.monto || m.monto)||0), 0) + monto;
    const metaTotal = Number(obData.monto_total) || 0;
    const est = pagadoTotal >= metaTotal ? "pagado" : "parcial";
    await api.saveItem('obligaciones_pendientes', {
      id: ob.id,
      data: { ...obData, monto_pagado: pagadoTotal, estado: est }
    });
  }
}
api.notify.success("💸 Pago asentado en Ledger por $" + monto + ". Saldo bancario y deuda recalculados.");
  `.trim();

  const zapAnularMovimiento = `
const { movimiento_id } = payload;
const movs = await api.query('movimientos_financieros');
const movWrapper = movs.find(m => m.id === movimiento_id);
if (!movWrapper) {
  api.notify.error("Movimiento no encontrado.");
  return;
}
const mov = movWrapper.data || movWrapper;
if (mov.estado === "anulado") {
  api.notify.error("El movimiento ya se encontraba anulado.");
  return;
}
await api.saveItem('movimientos_financieros', {
  id: movWrapper.id,
  data: { ...mov, estado: "anulado" }
});

if (mov.cuenta_origen_id) {
  const cuentas = await api.query('cuentas_financieras');
  const ctaWrapper = cuentas.find(c => c.id === mov.cuenta_origen_id);
  if (ctaWrapper) {
    const cta = ctaWrapper.data || ctaWrapper;
    const factor = mov.tipo === "ingreso" ? -1 : 1;
    const nuevoSaldo = (Number(cta.saldo_actual || cta.saldo_inicial || 0)) + (Number(mov.monto||0) * factor);
    await api.saveItem('cuentas_financieras', {
      id: ctaWrapper.id,
      data: { ...cta, saldo_actual: nuevoSaldo }
    });
  }
}

if (mov.obligacion_id) {
  const obls = await api.query('obligaciones_pendientes');
  const obWrapper = obls.find(o => o.id === mov.obligacion_id);
  if (obWrapper) {
    const ob = obWrapper.data || obWrapper;
    const restantes = movs.filter(m => (m.data?.obligacion_id === mov.obligacion_id || m.obligacion_id === mov.obligacion_id) && m.id !== movWrapper.id && (m.data?.estado !== 'anulado' && m.estado !== 'anulado'));
    const nuevoPagado = restantes.reduce((a, b) => a + (Number(b.data?.monto || b.monto)||0), 0);
    const meta = Number(ob.monto_total) || 0;
    const est = nuevoPagado >= meta ? "pagado" : (nuevoPagado > 0 ? "parcial" : "pendiente");
    await api.saveItem('obligaciones_pendientes', {
      id: obWrapper.id,
      data: { ...ob, monto_pagado: nuevoPagado, estado: est }
    });
  }
}
api.notify.success("⚠️ Movimiento anulado exitosamente. Homeostasis restablecida.");
  `.trim();

  const zapLiquidarUtilidades = `
const { proyecto_nombre } = payload;
if (!proyecto_nombre) {
  api.notify.error("Debes indicar el nombre del proyecto a liquidar.");
  return;
}
const [cots, movs, compras, usuarios] = await Promise.all([
  api.query('cotizaciones'),
  api.query('movimientos_financieros'),
  api.query('compras_materiales'),
  api.query('usuarios_equipo')
]);

const cotWrapper = cots.find(c => (c.data?.nombre_proyecto === proyecto_nombre || c.nombre_proyecto === proyecto_nombre));
const cot = cotWrapper?.data || cotWrapper || {};

const ingresos = movs
  .filter(m => {
    const d = m.data || m;
    return (d.proyecto_id === cotWrapper?.id || (d.descripcion && d.descripcion.includes(proyecto_nombre))) && d.tipo === 'ingreso' && d.estado !== 'anulado';
  })
  .reduce((a, b) => a + (Number(b.data?.monto || b.monto)||0), 0);

const egresosLedger = movs
  .filter(m => {
    const d = m.data || m;
    return (d.proyecto_id === cotWrapper?.id || (d.descripcion && d.descripcion.includes(proyecto_nombre))) && d.tipo === 'egreso' && d.estado !== 'anulado';
  })
  .reduce((a, b) => a + (Number(b.data?.monto || b.monto)||0), 0);

const costosMateriales = compras
  .filter(c => {
    const d = c.data || c;
    return d.origen_proyecto && d.origen_proyecto.includes(proyecto_nombre);
  })
  .reduce((a, b) => a + (Number(b.data?.costo_real_compra || b.costo_real_compra)||0), 0);

const costoLaboral = Number(cot.costos_operativos || 0);
const egresoTotal = Math.max(egresosLedger, costosMateriales + costoLaboral);
const utilidadNeta = ingresos - egresoTotal;
const cuotaHarold = utilidadNeta * 0.05;

const socioHarold = usuarios.find(u => (u.data?.nombre || u.nombre || '').toLowerCase().includes('harold'));
const userId = socioHarold ? socioHarold.id : 'user_harold_master';

let sem = "### Liquidación de Rendimiento — " + proyecto_nombre + "\\n\\n| Concepto contable | Monto real |\\n|---|---|\\n| (+) Ingresos Cobrados | $" + ingresos + " |\\n| (-) Egresos / Insumos / TGS | $" + egresoTotal + " |\\n| **(=) UTILIDAD NETA REAL** | **$" + utilidadNeta + "** |\\n\\n**Dividendo Socio Harold (5%):** $" + (cuotaHarold > 0 ? cuotaHarold : 0);

await api.saveItem('obligaciones_pendientes', {
  data: {
    descripcion: "Dividendo Socio Harold (5%) — " + proyecto_nombre,
    tipo: "por_pagar",
    monto_total: cuotaHarold > 0 ? cuotaHarold : 0,
    monto_pagado: 0,
    estado: "pendiente",
    fecha_vencimiento: new Date().toISOString().slice(0, 10),
    usuario_id: userId,
    descripcion_semantica: sem
  }
});
api.notify.success("✨ Liquidación completada. Utilidad real: $" + utilidadNeta + ". Obligación socio generada por $" + (cuotaHarold > 0 ? cuotaHarold : 0));
  `.trim();

  const zaps = [
    { name: 'zap_convertir_orden_en_obligacion', code: zapConvertirOrden },
    { name: 'zap_registrar_pago', code: zapRegistrarPago },
    { name: 'zap_anular_movimiento', code: zapAnularMovimiento },
    { name: 'zap_liquidar_utilidades_proyecto', code: zapLiquidarUtilidades }
  ];

  const cloudScripts = (await strategy.read('scripts')) || [];

  for (const z of zaps) {
    fs.writeFileSync(path.join(zapsDir, `${z.name}.js`), z.code, 'utf-8');
    const exist = cloudScripts.find((s: any) => (s.data?.name || s.name) === z.name);
    const sid = exist?.id || randomUUID();
    await strategy.write('scripts', {
      id: sid,
      context: 'scripts',
      data: { name: z.name, code: z.code }
    });
    console.log(`  ✓ Zap sincronizado en disco y Postgres: ${z.name}`);
  }

  console.log('\n✨ ¡Despliegue Maestro de Finanzas finalizado con éxito total!');
}

run().catch(err => {
  console.error('❌ Error crítico en deploy_finanzas_master:', err);
  process.exit(1);
});
