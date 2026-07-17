/**
 * Publishes one complete, immutable structural bundle and activates it with CAS.
 * It intentionally cannot write agnostic_records or operational namespaces.
 */
import { readFile } from 'node:fs/promises';
import postgres from 'postgres';
import { createCatalogSnapshot, type CatalogSnapshot } from '../src/server/catalog/catalogSnapshot';
import type { CatalogRecord } from '../src/server/catalog/readOnlyCatalog';

type Options = { snapshotPath: string; revisionId: string; sourceCommit: string; expectedActive: string | null };

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const url = process.env.NEON_DEFINITION_PUBLISHER_URL;
  if (!url) throw new Error('NEON_DEFINITION_PUBLISHER_URL is required; DATABASE_URL is never accepted by this publisher.');
  const snapshot = await loadSnapshot(options.snapshotPath);
  const sql = postgres(url, { max: 1, connect_timeout: 5, idle_timeout: 5 });
  try {
    await sql.begin('ISOLATION LEVEL SERIALIZABLE', async transaction => {
      const existing = await transaction<{ catalog_sha256: string }[]>`
        SELECT catalog_sha256 FROM agnostic_definition_revisions WHERE revision_id = ${options.revisionId}
      `;
      if (existing.length > 0 && existing[0].catalog_sha256 !== snapshot.catalog_sha256) {
        throw new Error('Revision ID already exists with a different catalog hash.');
      }
      if (existing.length === 0) {
        await transaction`
          INSERT INTO agnostic_definition_revisions (revision_id, catalog_sha256, source_commit, catalog)
          VALUES (${options.revisionId}, ${snapshot.catalog_sha256}, ${options.sourceCommit}, ${transaction.json(snapshot)})
        `;
      }
      const active = await transaction<{ active_revision_id: string }[]>`
        SELECT active_revision_id FROM agnostic_definition_release WHERE release_key = 'active' FOR UPDATE
      `;
      const current = active[0]?.active_revision_id ?? null;
      if (current !== options.expectedActive) {
        throw new Error(`CAS failed: expected active ${options.expectedActive ?? 'none'}, found ${current ?? 'none'}.`);
      }
      if (current === null) {
        await transaction`
          INSERT INTO agnostic_definition_release (release_key, active_revision_id) VALUES ('active', ${options.revisionId})
        `;
      } else if (current !== options.revisionId) {
        await transaction`
          UPDATE agnostic_definition_release SET active_revision_id = ${options.revisionId}, updated_at = NOW()
          WHERE release_key = 'active' AND active_revision_id = ${options.expectedActive}
        `;
      }
    });
    process.stdout.write(`${JSON.stringify({ ok: true, revision_id: options.revisionId, catalog_sha256: snapshot.catalog_sha256 })}\n`);
  } finally { await sql.end({ timeout: 3 }); }
}

function parseOptions(args: string[]): Options {
  const values = new Map<string, string>();
  for (let index = 0; index < args.length; index += 2) values.set(args[index], args[index + 1] ?? '');
  const snapshotPath = values.get('--snapshot');
  const revisionId = values.get('--revision');
  const sourceCommit = values.get('--source-commit');
  const expected = values.get('--expected-active');
  if (!snapshotPath || !revisionId || !sourceCommit || expected === undefined) {
    throw new Error('Usage: --snapshot <file> --revision <id> --source-commit <sha> --expected-active <id|none>');
  }
  return { snapshotPath, revisionId, sourceCommit, expectedActive: expected === 'none' ? null : expected };
}

async function loadSnapshot(snapshotPath: string): Promise<CatalogSnapshot> {
  const raw = JSON.parse(await readFile(snapshotPath, 'utf8')) as CatalogSnapshot;
  if (!Array.isArray(raw.records) || typeof raw.catalog_sha256 !== 'string') throw new Error('Invalid catalog snapshot.');
  const verified = createCatalogSnapshot(raw.records as CatalogRecord[], raw.exported_at);
  if (verified.catalog_sha256 !== raw.catalog_sha256) throw new Error('Snapshot hash verification failed.');
  return verified;
}

main().catch(error => { process.stderr.write(`${error instanceof Error ? error.message : 'Definition publish failed.'}\n`); process.exitCode = 1; });
