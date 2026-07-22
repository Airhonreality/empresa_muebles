/**
 * 🔄 SYNC ROUTES ON DEPLOY
 * ────────────────────────
 * Post-deploy hook que sincroniza page_routes.json de storage/db/ a Neon.
 *
 * Ejecución: npm run post-deploy (automático en Vercel)
 * Exit Codes: 0=éxito, 1=error (triggers rollback)
 */

import fs from 'fs';
import path from 'path';

const ROUTES_FILE = path.join(process.cwd(), 'storage/db/page_routes.json');
const DATABASE_URL = process.env.DATABASE_URL || '';
const STORAGE_STRATEGY = process.env.AGNOSTIC_STORAGE_STRATEGY?.toLowerCase() || 'local';

interface PageRoute {
  id: string;
  context: string;
  data: {
    path: string;
    [key: string]: any;
  };
  updated_at?: string;
}

/**
 * Valida la estructura de page_routes.json
 */
function validateRoutes(routes: PageRoute[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const seenPaths = new Set<string>();

  routes.forEach((route, idx) => {
    // Validar contexto
    if (!route.context || route.context !== 'page_routes') {
      errors.push(`[${idx}] Contexto inválido: ${route.context}`);
    }

    // Validar data.path
    if (!route.data?.path || typeof route.data.path !== 'string') {
      errors.push(`[${idx}] data.path requerido y debe ser string`);
    }

    // Validar rutas duplicadas
    if (route.data?.path && seenPaths.has(route.data.path)) {
      errors.push(`[${idx}] Ruta duplicada: ${route.data.path}`);
    }
    if (route.data?.path) seenPaths.add(route.data.path);

    // Validar tipo de data
    if (typeof route.data !== 'object' || route.data === null) {
      errors.push(`[${idx}] data debe ser un objeto`);
    }
  });

  return { valid: errors.length === 0, errors };
}

/**
 * Lee page_routes.json del storage local
 */
function readRoutesFile(): PageRoute[] {
  try {
    if (!fs.existsSync(ROUTES_FILE)) {
      throw new Error(`Archivo no encontrado: ${ROUTES_FILE}`);
    }
    const content = fs.readFileSync(ROUTES_FILE, 'utf-8');
    const routes = JSON.parse(content);
    if (!Array.isArray(routes)) {
      throw new Error('page_routes.json debe ser un array');
    }
    return routes;
  } catch (error) {
    throw new Error(`Error leyendo ${ROUTES_FILE}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Sincroniza rutas a Neon (PostgreSQL)
 */
async function syncToPostgres(routes: PageRoute[]): Promise<void> {
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL no está configurado. Skipping Postgres sync.');
  }

  const postgres = await import('postgres');
  const sql = postgres.default(DATABASE_URL);

  try {
    console.log('✓ Conectado a Neon');

    // Estrategia: DELETE todas las rutas existentes + INSERT las nuevas
    // (evita problemas de constraints en ON CONFLICT)
    await sql`
      DELETE FROM agnostic_records
      WHERE namespace = 'page_routes'
    `;

    // Insertar todas las nuevas rutas
    // ⚠️ IMPORTANTE: No usar JSON.stringify() para columna JSONB
    // Pasar el objeto directamente - postgres package lo convierte a JSONB automáticamente
    for (const route of routes) {
      // LOG: Verificar qué se escribe (solo primeras 3)
      if (routes.indexOf(route) < 3) {
        console.log(`  [${routes.indexOf(route) + 1}] ${route.data.path} -> ${route.data.title || 'SIN TITLE'}`);
      }

      await sql`
        INSERT INTO agnostic_records (id, namespace, context, data, created_at, updated_at)
        VALUES (${route.id}, 'page_routes', ${route.context}, ${route.data}, NOW(), NOW())
      `;
    }

    console.log(`✓ ${routes.length} rutas sincronizadas a Neon`);
    await sql.end();
  } catch (error) {
    throw error;
  }
}

/**
 * Main: Valida y sincroniza (best-effort)
 */
async function main() {
  try {
    console.log('\n🔄 Iniciando validación de rutas...\n');

    // Paso 1: Leer
    console.log('📖 Leyendo storage/db/page_routes.json...');
    const routes = readRoutesFile();
    console.log(`   ✓ ${routes.length} rutas encontradas\n`);

    // Paso 2: Validar (CRÍTICO - debe pasar)
    console.log('✅ Validando estructura...');
    const validation = validateRoutes(routes);
    if (!validation.valid) {
      console.error('   ✗ Errores de validación:');
      validation.errors.forEach(err => console.error(`     - ${err}`));
      process.exit(1);
    }
    console.log('   ✓ Validación completada\n');

    // Paso 3: Sincronizar (best-effort - no bloquea deploy si falla)
    if (STORAGE_STRATEGY === 'postgres') {
      console.log('🔗 Sincronizando a Neon (PostgreSQL)...');
      try {
        await syncToPostgres(routes);
        console.log('✓ Sincronización completada exitosamente\n');
      } catch (syncError) {
        console.warn('⚠️  Sync falló (best-effort):', syncError instanceof Error ? syncError.message : String(syncError));
        console.warn('📌 Las rutas fueron validadas correctamente, pero el sync a Neon no se ejecutó.');
        console.warn('💡 Intenta el sync manualmente o en el próximo deploy.\n');
      }
    } else {
      console.log(`⏭️  Storage strategy es '${STORAGE_STRATEGY}', skip Postgres sync\n`);
    }

    console.log('✨ Validación de rutas completada.\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error crítico:', error instanceof Error ? error.message : String(error));
    console.error('⚠️  Deploy será bloqueado por validación fallida.\n');
    process.exit(1);
  }
}

main();
