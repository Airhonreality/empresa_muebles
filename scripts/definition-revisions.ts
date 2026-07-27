import fs from 'node:fs/promises';
import path from 'node:path';
import { getStrategy, getStrategyName } from '../src/server/getStrategy';
import {
  createDefinitionRevisionStore,
  LegacyDefinitionReader,
  migrateLegacyDefinitions,
  PersistentDefinitionPublisher,
  PersistentDefinitionReader,
  validatePersistentDefinitionRevision,
} from '../src/server/definitions';
import { canonicalJson } from '../src/server/definitions/canonical';
import { loadLocalEnvFiles } from './load-local-env';

loadLocalEnvFiles();

function argumentValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function requireConfirmation(): void {
  if (!process.argv.includes('--yes')) {
    throw new Error('Apply requires --yes after reviewing definitions:plan.');
  }
}

async function plan(): Promise<void> {
  const bridge = getStrategy();
  const store = createDefinitionRevisionStore(getStrategyName(), process.env);
  const result = await migrateLegacyDefinitions(
    new LegacyDefinitionReader(bridge, { strict: true }),
    new PersistentDefinitionPublisher(store),
    store,
    { mode: 'dry-run' },
  );
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

async function apply(): Promise<void> {
  requireConfirmation();
  const expectedArgument = argumentValue('--expected');
  if (expectedArgument === undefined) {
    throw new Error('Apply requires --expected <revision-id|none>.');
  }
  const expectedRevision = expectedArgument === 'none' ? null : expectedArgument;
  const bridge = getStrategy();
  const store = createDefinitionRevisionStore(getStrategyName(), process.env);
  const result = await migrateLegacyDefinitions(
    new LegacyDefinitionReader(bridge, { strict: true }),
    new PersistentDefinitionPublisher(store),
    store,
    { mode: 'apply', expectedRevision },
  );
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

async function status(): Promise<void> {
  const store = createDefinitionRevisionStore(getStrategyName(), process.env);
  const activeRevision = await store.readActiveRevisionId();
  process.stdout.write(`${JSON.stringify({
    strategy: getStrategyName(),
    activeRevision,
  }, null, 2)}\n`);
}

async function exportSnapshot(): Promise<void> {
  const outputArgument = argumentValue('--output');
  if (!outputArgument) {
    throw new Error('Export requires --output <file>.');
  }
  const store = createDefinitionRevisionStore(getStrategyName(), process.env);
  const revision = await new PersistentDefinitionReader(store).readActiveRevision();
  const outputPath = path.resolve(outputArgument);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${canonicalJson(revision)}\n`, {
    encoding: 'utf8',
    flag: 'w',
  });
  process.stdout.write(`${JSON.stringify({
    revision: revision.id,
    output: outputPath,
  }, null, 2)}\n`);
}

async function activateRevision(): Promise<void> {
  requireConfirmation();
  const revision = argumentValue('--revision');
  const expected = argumentValue('--expected');
  if (!revision || !expected) {
    throw new Error('Activate requires --revision <id> --expected <active-id> --yes.');
  }
  const store = createDefinitionRevisionStore(getStrategyName(), process.env);
  const target = await store.readRevision(revision);
  if (!target) {
    throw new Error(`Definition revision "${revision}" was not found.`);
  }
  validatePersistentDefinitionRevision(target);
  await store.activate(expected, revision);
  process.stdout.write(`${JSON.stringify({
    activeRevision: revision,
    previousRevision: expected,
  }, null, 2)}\n`);
}

async function main(): Promise<void> {
  const command = process.argv[2] ?? 'plan';
  if (command === 'plan') return plan();
  if (command === 'apply') return apply();
  if (command === 'status') return status();
  if (command === 'export') return exportSnapshot();
  if (command === 'activate') return activateRevision();
  throw new Error(
    `Unknown definitions command "${command}". Use plan, apply, status, export, or activate.`,
  );
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
