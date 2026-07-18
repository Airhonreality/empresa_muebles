/**
 * Exports only the structural catalog from PostgreSQL/Neon.
 *
 * It intentionally accepts NEON_CATALOG_READONLY_URL only. DATABASE_URL and
 * PostgresStrategy are excluded so a production runtime credential cannot become
 * an accidental fallback and no bootstrap DDL can occur. A complete catalog is
 * never emitted to stdout; it must be written to a new snapshot file.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import postgres from 'postgres';
import { createCatalogSnapshot, serializeCatalogSnapshot } from '../src/server/catalog/catalogSnapshot';
import { readStructuralCatalog, type ReadOnlyCatalogSql } from '../src/server/catalog/readOnlyCatalog';

type Options = { outputPath?: string };

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const connectionString = process.env.NEON_CATALOG_READONLY_URL;
  if (!connectionString) {
    throw new Error('NEON_CATALOG_READONLY_URL is required; DATABASE_URL is never accepted by this exporter.');
  }

  const sql = postgres(connectionString, {
    max: 1,
    connect_timeout: 5,
    idle_timeout: 5,
  });

  try {
    const records = await readStructuralCatalog(sql as unknown as ReadOnlyCatalogSql);
    const snapshot = createCatalogSnapshot(records);
    const serialized = serializeCatalogSnapshot(snapshot);

    await writeSnapshot(options.outputPath, serialized);
    process.stdout.write(`${JSON.stringify({ ok: true, output: options.outputPath, catalog_sha256: snapshot.catalog_sha256, records: records.length })}\n`);
  } finally {
    await sql.end({ timeout: 3 });
  }
}

function parseOptions(args: string[]): Options {
  if (args.length === 2 && args[0] === '--out' && args[1]) return { outputPath: args[1] };
  throw new Error('Usage: npm run catalog:export -- --out storage/progreso/snapshots/catalog/<name>.json');
}

async function writeSnapshot(requestedPath: string, content: string): Promise<void> {
  const root = path.resolve(process.cwd(), 'storage', 'progreso', 'snapshots', 'catalog');
  const output = path.resolve(process.cwd(), requestedPath);
  const relative = path.relative(root, output);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative) || path.extname(output) !== '.json') {
    throw new Error('Snapshot output must be a new .json file under storage/progreso/snapshots/catalog/.');
  }

  await mkdir(root, { recursive: true });
  await writeFile(output, content, { encoding: 'utf8', flag: 'wx' });
}

main().catch(error => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Catalog export failed.'}\n`);
  process.exitCode = 1;
});
