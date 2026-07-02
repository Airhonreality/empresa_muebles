import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { getStrategy } from '../src/server/getStrategy';

async function main() {
  const strategy = getStrategy();
  
  // 1. Cuentas
  const accounts = await strategy.read('cuentas_financieras');
  console.log('--- CUENTAS FINANCIERAS ---');
  for (const act of accounts) {
    console.log(`- ${act.data?.nombre || act.nombre}: $${act.data?.saldo_actual ?? act.data?.saldo_inicial ?? 0} (${act.data?.estado || 'sin estado'})`);
  }

  // 2. Contratos y Abonos
  const contratos = await strategy.read('contratos');
  const abonos = await strategy.read('abonos_contrato');
  
  console.log('\n--- CONTRATOS ---');
  for (const c of contratos) {
    const data = c.data || c;
    const abonosFiltrados = abonos.filter((a: any) => (a.data?.contrato_id === c.id || a.contrato_id === c.id) && a.data?.estado !== 'anulado');
    const pagado = abonosFiltrados.reduce((sum: number, a: any) => sum + (Number(a.data?.monto || a.monto) || 0), 0);
    const total = Number(data.monto_total || 0);
    const saldo = total - pagado;
    console.log(`- Contrato ID: ${c.id}`);
    console.log(`  Codigo: ${data.codigo_contrato}`);
    console.log(`  Proyecto: ${data.nombre_proyecto || 'Sin Nombre'}`);
    console.log(`  Total: $${total}`);
    console.log(`  Pagado: $${pagado}`);
    console.log(`  Saldo por Cobrar: $${saldo}`);
  }
}

main().catch(console.error);
