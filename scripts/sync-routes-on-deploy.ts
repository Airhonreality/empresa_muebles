import fs from 'fs';
import path from 'path';
import type { DataItem } from '@agnostic/core';
import { loadLocalEnvFiles } from './load-local-env';
import { PostgresStrategy } from '../src/server/strategies/PostgresStrategy';

loadLocalEnvFiles();

/**
 * 🛣️ AGNOSTIC ROUTES SYNCHRONIZER (sync-routes-on-deploy.ts)
 * ===========================================================
 *
 * ROLE: Reads page_routes.json from storage/db/ and synchronizes them
 *       to the active persistence layer. Runs as part of the post-build
 *       pipeline to ensure deployed routes match storage.
 *       Fails if validation detects inconsistencies, triggering deploy rollback.
 *
 * USAGE:
 * npx tsx scripts/sync-routes-on-deploy.ts
 * (Intended to run as part of: npm run build && npm run post-deploy)
 */

interface RouteData {
  path: string;
  title: string;
  system_group?: string;
  isPrivate?: boolean;
  blocks: Array<{ id: string; type: string; context: string; blocks: unknown[] }>;
  order?: number;
}

async function validateRoutes(routes: DataItem[]): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  const seenPaths = new Set<string>();

  routes.forEach((route, idx) => {
    if (route.context !== 'page_routes') {
      errors.push(`[Row ${idx}] Invalid context: expected "page_routes", got "${route.context}"`);
    }

    const data = route.data as Partial<RouteData>;

    if (!data.path) {
      errors.push(`[Row ${idx}] Missing required field: path`);
    } else if (typeof data.path !== 'string') {
      errors.push(`[Row ${idx}] Invalid path type: expected string, got ${typeof data.path}`);
    } else {
      if (seenPaths.has(data.path)) {
        errors.push(`[Row ${idx}] Duplicate path detected: "${data.path}"`);
      }
      seenPaths.add(data.path);
    }

    if (!data.title || typeof data.title !== 'string') {
      errors.push(`[Row ${idx}] Missing or invalid title field`);
    }

    if (data.blocks && !Array.isArray(data.blocks)) {
      errors.push(`[Row ${idx}] Invalid blocks type: expected array, got ${typeof data.blocks}`);
    }

    if (data.isPrivate !== undefined && typeof data.isPrivate !== 'boolean') {
      errors.push(`[Row ${idx}] Invalid isPrivate type: expected boolean, got ${typeof data.isPrivate}`);
    }

    if (data.order !== undefined && typeof data.order !== 'number') {
      errors.push(`[Row ${idx}] Invalid order type: expected number, got ${typeof data.order}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

async function syncRoutesToDatabase(routes: DataItem[]): Promise<void> {
  const strategy = process.env.AGNOSTIC_STORAGE_STRATEGY;
  const databaseUrl = process.env.DATABASE_URL;

  if (strategy !== 'postgres' || !databaseUrl) {
    console.log('[sync-routes] Strategy is not postgres or DATABASE_URL not configured. Skipping DB sync.');
    return;
  }

  console.log(`\n📡 Syncing to Postgres/Neon...`);
  console.log(`📦 Routes to sync: ${routes.length}`);

  const postgres = new PostgresStrategy(databaseUrl);

  for (const route of routes) {
    try {
      await postgres.write('page_routes', {
        id: route.id,
        context: 'page_routes',
        data: route.data,
      });
      console.log(`  ✅ Synced: ${(route.data as Partial<RouteData>).path}`);
    } catch (err: any) {
      throw new Error(`Failed to sync route ${route.id}: ${err.message}`);
    }
  }

  console.log(`✨ All routes synced to Postgres/Neon successfully.`);
}

async function syncRoutes() {
  const routesPath = path.join(process.cwd(), 'storage', 'db', 'page_routes.json');

  console.log(`\n🛣️ Starting Route Synchronizer...`);
  console.log(`📂 Source: ${routesPath}`);

  if (!fs.existsSync(routesPath)) {
    console.log(`⚠️  Routes file not found at ${routesPath}. Skipping sync.`);
    return;
  }

  let routes: DataItem[];
  try {
    const rawData = fs.readFileSync(routesPath, 'utf8');
    routes = JSON.parse(rawData);
  } catch (err: any) {
    console.error(`❌ Failed to parse routes file: ${err.message}`);
    process.exit(1);
  }

  if (!Array.isArray(routes)) {
    console.error(`❌ Routes file must be a JSON array. Got: ${typeof routes}`);
    process.exit(1);
  }

  if (routes.length === 0) {
    console.log(`⚠️  Routes file is empty. No routes to sync.`);
    return;
  }

  console.log(`--------------------------------------------------`);
  console.log(`📋 Found ${routes.length} route(s)`);

  const validation = await validateRoutes(routes);
  if (!validation.valid) {
    console.error(`\n❌ Validation failed:`);
    validation.errors.forEach(err => console.error(`   • ${err}`));
    process.exit(1);
  }

  console.log(`✅ Validation passed`);

  try {
    await syncRoutesToDatabase(routes);
  } catch (err: any) {
    console.error(`\n❌ Database sync failed: ${err.message}`);
    process.exit(1);
  }

  console.log(`\n✨ Route synchronization completed successfully.\n`);
}

syncRoutes().catch(err => {
  console.error(`❌ Critical error during route synchronization:`, err);
  process.exit(1);
});
