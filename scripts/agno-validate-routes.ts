import fs from 'fs/promises';
import path from 'path';
import { storageRepository as storage } from './storage-repository';
import { createCliResult, printCliResult, type CliFinding, type CliResult } from './cli-reporter';

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
}

async function readJson(path: string): Promise<any> {
  const raw = await fs.readFile(path, 'utf-8');
  return JSON.parse(stripBom(raw));
}

function walkTypes(container: any): string[] {
  if (!container || typeof container !== 'object') return [];
  const types: string[] = [];
  if (container.type) types.push(container.type);
  for (const key of ['blocks', 'children', 'items', 'columns', 'tabs']) {
    const children = container[key];
    if (Array.isArray(children)) {
      for (const child of children) types.push(...walkTypes(child));
    }
  }
  if (container.root && typeof container.root === 'object') {
    types.push(...walkTypes(container.root));
  }
  return types;
}

function walkContexts(container: any, findings: CliFinding[], routePath: string, schemaNames: Set<string>, schemaFileNames: Set<string>) {
  if (!container || typeof container !== 'object') return;
  if (container.context) {
    if (!schemaNames.has(container.context)) {
      findings.push({
        level: 'warn',
        code: 'AGNO_ROUTE_CONTEXT_NO_SCHEMA',
        message: `Block context "${container.context}" does not match any schema.data.name in schema_definitions.json`,
        subject: `${routePath} > ${(container.id ?? '').slice(0, 8)}`,
        suggestion: `Create a schema with data.name="${container.context}" or change the block context`,
      });
    }
    if (!schemaFileNames.has(container.context)) {
      findings.push({
        level: 'warn',
        code: 'AGNO_ROUTE_CONTEXT_NO_FILE',
        message: `No data file found for context "${container.context}" (expected storage/db/${container.context}.json)`,
        subject: `${routePath} > ${(container.id ?? '').slice(0, 8)}`,
        suggestion: `Create storage/db/${container.context}.json or change the block context`,
      });
    }
  }
  for (const key of ['blocks', 'children', 'items', 'columns', 'tabs']) {
    const children = container[key];
    if (Array.isArray(children)) {
      for (const child of children) walkContexts(child, findings, routePath, schemaNames, schemaFileNames);
    }
  }
  if (container.root && typeof container.root === 'object') {
    walkContexts(container.root, findings, routePath, schemaNames, schemaFileNames);
  }
}

function parseInitTypes(source: string): Set<string> {
  const types = new Set<string>();
  const re = /registry\.register\(\s*['"]([^'"]+)['"]\s*,/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) types.add(m[1]);
  return types;
}

function parseConfigBlocks(source: string): Set<string> {
  const types = new Set<string>();
  const re = /(\w+)\s*:\s*\(\)\s*=>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) types.add(m[1]);
  return types;
}

export async function validateRoutesResult(options: { file?: string } = {}): Promise<CliResult> {
  const routesPath = options.file || storage.dbPath('page_routes.json');
  const routes = await readJson(routesPath);
  if (!Array.isArray(routes)) {
    return createCliResult({
      command: 'validate:routes',
      summary: { routes: 0, errors: 1, warnings: 0 },
      findings: [{
        level: 'error',
        code: 'AGNO_ROUTE_INVALID_FILE',
        message: 'page_routes.json must be a JSON array',
      }],
    });
  }

  const [initSrc, configSrc] = await Promise.all([
    fs.readFile(path.join(storage.rootDir, 'src', 'lib', 'agnostic', 'init.ts'), 'utf-8'),
    fs.readFile(path.join(storage.rootDir, 'agnostic.config.ts'), 'utf-8'),
  ]);

  const resolvable = new Set([...parseInitTypes(initSrc), ...parseConfigBlocks(configSrc)]);

  const schemas = await readJson(storage.dbPath('schema_definitions.json')) as any[];
  const schemaNames = new Set(schemas.map((s: any) => s.data?.name).filter(Boolean));

  const schemaFileNames = new Set<string>();
  try {
    const dbFiles = await fs.readdir(storage.dbDir);
    for (const f of dbFiles) {
      if (f.endsWith('.json')) schemaFileNames.add(f.replace(/\.json$/, ''));
    }
  } catch { /* ignore */ }

  const findings: CliFinding[] = [];

  for (const route of routes) {
    const routePath = route.data?.path ?? '?';
    const blocks = route.data?.blocks ?? [];
    const root = route.data?.root;

    const allTypes: string[] = [];
    for (const b of blocks) allTypes.push(...walkTypes(b));
    if (root) allTypes.push(...walkTypes(root));

    for (const type of allTypes) {
      if (!resolvable.has(type)) {
        findings.push({
          level: 'error',
          code: 'AGNO_ROUTE_UNRESOLVABLE_TYPE',
          message: `Block type "${type}" is not registered in init.ts or agnostic.config.ts`,
          subject: routePath,
          suggestion: `Register "${type}" in src/lib/agnostic/init.ts or agnostic.config.ts`,
        });
      }
    }

    for (const b of blocks) walkContexts(b, findings, routePath, schemaNames, schemaFileNames);
    if (root) walkContexts(root, findings, routePath, schemaNames, schemaFileNames);
  }

  const errors = findings.filter(f => f.level === 'error').length;
  const warnings = findings.filter(f => f.level === 'warn').length;

  return createCliResult({
    command: 'validate:routes',
    summary: { routes: routes.length, errors, warnings },
    findings,
  });
}

export async function printValidateRoutes(options: { file?: string; json?: boolean; quiet?: boolean } = {}): Promise<void> {
  printCliResult(await validateRoutesResult(options), options);
}
