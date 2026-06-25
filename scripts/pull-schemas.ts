/**
 * 📥 AGNOSTIC SCHEMA PULLER (pull-schemas.ts)
 * ===========================================
 * Descarga las definiciones formales de esquemas desde la base de datos viva
 * de producción (Postgres) hacia storage/db/schema_definitions.json local.
 * Luego ejecuta agnostic:compile para regenerar los contratos de TypeScript.
 *
 * Ejecutar: npm run agnostic:pull-schemas
 */

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import fs from 'fs';
import path from 'path';
import { getStrategy } from '../src/server/getStrategy';
import { SYSTEM_NS } from '../src/lib/agnostic/constants';
import { execSync } from 'child_process';

function resolveProjectPath(): string {
  if (process.env.STORAGE_PATH) return process.env.STORAGE_PATH;
  const configPath = path.join(process.cwd(), 'storage', 'system_config.json');
  if (!fs.existsSync(configPath)) return path.join(process.cwd(), 'storage', 'db');
  const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const items = Array.isArray(raw) ? raw : [raw];
  const passport = items.find((i: any) => i.id === 'master_passport');
  const identity = passport?.data?.project_identity || '.';
  return path.join(process.cwd(), 'storage', identity, 'db');
}

async function run() {
  console.log('📡 Conectando a producción vía getStrategy()...');
  const strategy = getStrategy();
  
  console.log(`📥 Consultando namespace [${SYSTEM_NS.SCHEMAS}]...`);
  const schemas = await strategy.read(SYSTEM_NS.SCHEMAS);

  if (!schemas || !Array.isArray(schemas) || schemas.length === 0) {
    console.warn('⚠️ No se encontraron esquemas en la base de datos remota.');
    console.log('💡 Consejo: Si acabas de crear esquemas en local, empújalos primero con push-data o búscalos en local.');
    return;
  }

  const storageDbPath = resolveProjectPath();
  const targetFile = path.join(storageDbPath, 'schema_definitions.json');

  fs.mkdirSync(storageDbPath, { recursive: true });
  fs.writeFileSync(targetFile, JSON.stringify(schemas, null, 2), 'utf-8');

  console.log(`✅ ${schemas.length} esquemas descargados exitosamente en: ${targetFile}`);
  
  console.log('🔨 Ejecutando compilador síncrono local (agnostic:compile)...');
  execSync('npm run agnostic:compile', { stdio: 'inherit' });
}

run().catch(err => {
  console.error('❌ Error en pull-schemas:', err);
  process.exit(1);
});
