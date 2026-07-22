import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import type { DefinitionRevision } from '../packages/core/src/definitions';
import { afterEach, describe, expect, it } from 'vitest';
import { canonicalJson, revisionIdFor } from '../src/server/definitions/canonical';

const execFileAsync = promisify(execFile);
const temporaryDirectories: string[] = [];

async function createSnapshot(): Promise<{ directory: string; snapshot: string; output: string; id: string }> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'agnostic-compile-revision-'));
  temporaryDirectories.push(directory);
  const definitions = {
    schema_definitions: [
      { id: 'schema_items', context: 'schema_definitions', data: { name: 'items', fields: [] } },
    ],
    page_routes: [],
    scripts: [],
  };
  const id = revisionIdFor(definitions);
  const revision: DefinitionRevision = {
    id,
    definitions,
    source: { kind: 'test' },
    consistency: 'atomic',
  };
  const snapshot = path.join(directory, 'revision.json');
  const output = path.join(directory, 'generated.ts');
  await fs.writeFile(snapshot, `${canonicalJson(revision)}\n`, 'utf8');
  return { directory, snapshot, output, id };
}

async function runCompiler(
  snapshot: string,
  output: string,
  revision?: string,
): Promise<{ stdout: string; stderr: string }> {
  const tsx = path.join(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs');
  return execFileAsync(process.execPath, [tsx, 'scripts/compile-schemas.ts'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      AGNOSTIC_DEFINITION_MODE: 'revision',
      AGNOSTIC_DEFINITION_SNAPSHOT: snapshot,
      AGNOSTIC_DEFINITION_REVISION: revision,
      OUTPUT_PATH: output,
    },
  });
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(directory =>
    fs.rm(directory, { recursive: true, force: true }),
  ));
});

describe('revision-aware schema compiler', () => {
  it('rejects revision mode without a deployed revision pin', async () => {
    const fixture = await createSnapshot();
    await expect(runCompiler(fixture.snapshot, fixture.output)).rejects.toThrow(
      'AGNOSTIC_DEFINITION_REVISION',
    );
  });

  it('rejects a snapshot that differs from the deployed revision', async () => {
    const fixture = await createSnapshot();
    await expect(runCompiler(fixture.snapshot, fixture.output, 'different')).rejects.toThrow(
      'does not match',
    );
  });

  it('generates types tied to the matching revision', async () => {
    const fixture = await createSnapshot();
    await runCompiler(fixture.snapshot, fixture.output, fixture.id);
    const generated = await fs.readFile(fixture.output, 'utf8');
    expect(generated).toContain(`// Definition revision: ${fixture.id}`);
    expect(generated).toContain('export interface Items');
  });
});
