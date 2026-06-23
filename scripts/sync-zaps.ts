import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getStrategy } from '../src/server/getStrategy';

/**
 * ⚡ AGNOSTIC ZAP SYNCHRONIZER (sync-zaps.ts)
 * ============================================
 * 
 * ROLE: Reads physical .js files from `storage/zaps/` and synchronizes them
 *       into the active persistence layer (Postgres, Supabase, or Local JSON).
 *       This allows AI agents and developers to code logic in the IDE organically,
 *       while adhering to the Agnostic architecture (Code as Data).
 * 
 * USAGE:
 * npx tsx scripts/sync-zaps.ts
 * (Runs automatically during `npm run build`)
 */

async function syncZaps() {
  const strategy = getStrategy();
  const zapsDir = path.join(process.cwd(), 'storage', 'zaps');
  
  if (!fs.existsSync(zapsDir)) {
    console.log(`[sync-zaps] Directorio de origen no encontrado en ${zapsDir}. Se ignora la sincronización.`);
    return;
  }

  const files = fs.readdirSync(zapsDir).filter(f => f.endsWith('.js'));
  if (files.length === 0) {
    console.log('[sync-zaps] No se encontraron archivos .js en storage/zaps/. Se ignora la sincronización.');
    return;
  }

  console.log(`\n⚡ Iniciando sincronización de Zaps al Motor...`);
  console.log(`📂 Origen: ${zapsDir}`);
  console.log(`📡 Destino (Estrategia Activa): ${strategy.constructor.name}`);
  console.log(`--------------------------------------------------`);

  const scripts = await strategy.read('scripts');

  for (const file of files) {
    const zapName = file.replace('.js', '');
    const code = fs.readFileSync(path.join(zapsDir, file), 'utf8');
    
    // Buscar si ya existe para hacer Upsert
    const existing = scripts.find((s: any) => s.data?.name === zapName || s.name === zapName);
    const recordId = existing?.id || crypto.randomUUID();
    
    // Mantener la data existente (metadata) y actualizar solo el nombre y código
    const existingData = existing?.data || existing || {};

    await strategy.write('scripts', {
      id: recordId,
      data: {
        ...existingData,
        name: zapName,
        code
      }
    });

    console.log(`  ✅ Sincronizado: ${zapName}`);
  }

  console.log('✨ Sincronización de Zaps completada con éxito.\n');
}

syncZaps().catch(err => {
  console.error('❌ Error crítico durante la sincronización de Zaps:', err);
  process.exit(1);
});
