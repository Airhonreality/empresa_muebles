import fs from 'fs/promises';
import { pathToFileURL } from 'url';
import { storageRepository as storage, type JsonRecord } from './storage-repository';
import { createCliResult, printCliResult, type CliFinding, type CliOutputOptions, type CliResult } from './cli-reporter';
import type { AdapterManifest } from '@agnostic/core';

const INTEGRATIONS_DIR = 'src/integrations';
const CONFIG_FILE = 'agnostic.config.ts';
const SERVER_REGISTRY_FILE = 'src/lib/integrations/adapters.server.ts';

const CONFIG_MARKER_START = '// agno:adapters:start';
const CONFIG_MARKER_END = '// agno:adapters:end';
const IMPORTS_MARKER_END = '// agno:adapter-imports:end';
const REGISTRY_MARKER_END = '// agno:adapter-registry:end';

export type AvailableAdapter = { id: string; manifest: AdapterManifest };

// ── convenciones de nombre ───────────────────────────────────────────────
// clase servidor: `${PascalCase(id)}Adapter`, exportada desde src/integrations/<id>/adapter.ts
// variable manifest: `${camelCase(id)}Manifest`, exportada como `manifest` desde manifest.ts

function pascalCase(id: string): string {
  return id.split(/[_-]/).filter(Boolean).map(part => part[0].toUpperCase() + part.slice(1)).join('');
}

function className(id: string): string {
  return `${pascalCase(id)}Adapter`;
}

function manifestVarName(id: string): string {
  const pascal = pascalCase(id);
  return `${pascal[0].toLowerCase()}${pascal.slice(1)}Manifest`;
}

function adapterKey(id: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(id) ? id : `'${id}'`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── lectura ───────────────────────────────────────────────────────────────

async function scanAvailableAdapters(): Promise<AvailableAdapter[]> {
  const dir = storage.resolve(INTEGRATIONS_DIR);
  let entries: string[];
  try {
    entries = (await fs.readdir(dir, { withFileTypes: true }))
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
  } catch {
    return [];
  }

  const adapters: AvailableAdapter[] = [];
  for (const id of entries) {
    const manifestPath = storage.resolve(INTEGRATIONS_DIR, id, 'manifest.ts');
    if (!(await storage.exists(manifestPath))) continue;
    try {
      const mod = await import(`${pathToFileURL(manifestPath).href}?t=${Date.now()}`);
      const manifest: AdapterManifest | undefined = mod.manifest ?? mod.default;
      if (manifest?.id === id) adapters.push({ id, manifest });
    } catch {
      // Un manifest roto simplemente no aparece como disponible.
    }
  }
  return adapters.sort((a, b) => a.id.localeCompare(b.id));
}

function extractMarkedZone(text: string, startMarker: string, endMarker: string): string | null {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker);
  if (start === -1 || end === -1 || end < start) return null;
  return text.slice(start + startMarker.length, end);
}

async function readConfigText(): Promise<string> {
  return fs.readFile(storage.resolve(CONFIG_FILE), 'utf8');
}

function readInstalledIds(configText: string): string[] {
  const zone = extractMarkedZone(configText, CONFIG_MARKER_START, CONFIG_MARKER_END);
  if (zone === null) return [];
  const ids: string[] = [];
  const lineRe = /^\s*['"]?([a-zA-Z0-9_-]+)['"]?:\s*\(\)\s*=>\s*import\(/gm;
  let match: RegExpExecArray | null;
  while ((match = lineRe.exec(zone))) ids.push(match[1]);
  return ids;
}

function schemaName(record: JsonRecord): string | null {
  const name = record.data?.name ?? record.data?.slug ?? record.context;
  return typeof name === 'string' ? name : null;
}

// ── resolver de colisiones ("risky siblings") ───────────────────────────

async function findCollisions(candidate: AdapterManifest, installed: AvailableAdapter[]): Promise<CliFinding[]> {
  const findings: CliFinding[] = [];

  if (installed.some(a => a.id === candidate.id)) {
    findings.push({
      level: 'error',
      code: 'AGNO_ADAPTER_ALREADY_INSTALLED',
      message: `El adapter '${candidate.id}' ya esta instalado.`,
      subject: candidate.id,
    });
  }

  for (const envVar of candidate.envVars) {
    const owner = installed.find(a => a.id !== candidate.id && a.manifest.envVars.some(v => v.key === envVar.key));
    if (owner) {
      findings.push({
        level: 'warn',
        code: 'AGNO_ADAPTER_ENV_KEY_COLLISION',
        message: `La env var '${envVar.key}' que declara '${candidate.id}' ya la usa el adapter instalado '${owner.id}'.`,
        subject: candidate.id,
        suggestion: 'Confirma si ambos adapters comparten intencionalmente la credencial o si es una colision accidental.',
      });
    }
  }

  if (candidate.requiresSchemas?.length) {
    const schemas = await storage.readJsonArray('schema_definitions.json');
    const names = new Set(schemas.map(schemaName).filter((n): n is string => !!n));
    for (const required of candidate.requiresSchemas) {
      if (!names.has(required)) {
        findings.push({
          level: 'warn',
          code: 'AGNO_ADAPTER_SCHEMA_MISSING',
          message: `'${candidate.id}' requiere el schema '${required}', que no existe en storage/db/schema_definitions.json.`,
          subject: candidate.id,
          suggestion: `Crea el schema con: create-schema ${required} ...`,
        });
      }
    }
  }

  for (const envVar of candidate.envVars) {
    if (envVar.required && !process.env[envVar.key]) {
      findings.push({
        level: 'info',
        code: 'AGNO_ADAPTER_ENV_UNSET',
        message: `La env var requerida '${envVar.key}' no esta definida todavia.`,
        subject: candidate.id,
        suggestion: 'Configurala en .env.local o en el Configurador de Servicios antes de usar el adapter.',
      });
    }
  }

  if (candidate.permissions.network !== 'none' && !candidate.permissions.runsOutsideSandbox) {
    findings.push({
      level: 'error',
      code: 'AGNO_ADAPTER_SANDBOX_PERMISSION_MISMATCH',
      message: `'${candidate.id}' declara permissions.network='${candidate.permissions.network}' pero runsOutsideSandbox=false. Los zaps no tienen fetch/fs/process; un adapter con red debe correr en src/app/api/.`,
      subject: candidate.id,
      suggestion: 'Corrige el manifest: runsOutsideSandbox debe ser true cuando network !== "none".',
    });
  }

  return findings;
}

// ── mutacion de texto (agnostic.config.ts + adapters.server.ts) ─────────

function insertBeforeMarker(text: string, endMarker: string, line: string): string {
  const idx = text.indexOf(endMarker);
  if (idx === -1) throw new Error(`Marcador no encontrado: ${endMarker}`);
  const lineStart = text.lastIndexOf('\n', idx) + 1;
  const indent = text.slice(lineStart, idx).match(/^\s*/)?.[0] ?? '';
  return text.slice(0, lineStart) + `${indent}${line}\n` + text.slice(lineStart);
}

function removeLinesMatching(text: string, predicate: (line: string) => boolean): string {
  return text.split('\n').filter(line => !predicate(line)).join('\n');
}

async function mutateConfigFile(id: string, action: 'install' | 'remove'): Promise<void> {
  const filePath = storage.resolve(CONFIG_FILE);
  let text = await fs.readFile(filePath, 'utf8');
  if (action === 'install') {
    text = insertBeforeMarker(text, CONFIG_MARKER_END, `${adapterKey(id)}: () => import('./${INTEGRATIONS_DIR}/${id}'),`);
  } else {
    text = removeLinesMatching(text, line => new RegExp(`^\\s*['"]?${escapeRegExp(id)}['"]?:\\s*\\(\\)\\s*=>\\s*import\\(`).test(line));
  }
  await fs.writeFile(filePath, text, 'utf8');
}

async function mutateServerRegistryFile(id: string, action: 'install' | 'remove'): Promise<void> {
  const filePath = storage.resolve(SERVER_REGISTRY_FILE);
  let text = await fs.readFile(filePath, 'utf8');
  const cls = className(id);
  const mVar = manifestVarName(id);

  if (action === 'install') {
    text = insertBeforeMarker(text, IMPORTS_MARKER_END, `import { ${cls} } from '@/integrations/${id}/adapter';`);
    text = insertBeforeMarker(text, IMPORTS_MARKER_END, `import { manifest as ${mVar} } from '@/integrations/${id}/manifest';`);
    text = insertBeforeMarker(text, REGISTRY_MARKER_END, `${adapterKey(id)}: { manifest: ${mVar}, create: creds => new ${cls}(creds) },`);
  } else {
    text = removeLinesMatching(text, line =>
      line.includes(`@/integrations/${id}/adapter'`) || line.includes(`@/integrations/${id}/manifest'`));
    text = removeLinesMatching(text, line => new RegExp(`^\\s*['"]?${escapeRegExp(id)}['"]?:\\s*\\{\\s*manifest:`).test(line));
  }
  await fs.writeFile(filePath, text, 'utf8');
}

// ── list-adapters ─────────────────────────────────────────────────────────

export async function buildListAdaptersResult(): Promise<CliResult> {
  const available = await scanAvailableAdapters();
  const configText = await readConfigText().catch(() => '');
  const installedIds = new Set(configText ? readInstalledIds(configText) : []);

  const findings: CliFinding[] = available.map(a => ({
    level: 'info',
    code: 'AGNO_ADAPTER_AVAILABLE',
    message: `${a.manifest.name} (${a.id}) — ${installedIds.has(a.id) ? 'instalado' : 'disponible'}`,
    subject: a.id,
    metadata: {
      installed: installedIds.has(a.id),
      kind: a.manifest.kind,
      network: a.manifest.permissions.network,
      env_vars: a.manifest.envVars.map(v => v.key).join(', ') || 'ninguna',
    },
  }));

  return createCliResult({
    command: 'list-adapters',
    summary: { available: available.length, installed: installedIds.size },
    findings,
  });
}

export async function printListAdapters(options: CliOutputOptions = {}): Promise<void> {
  printCliResult(await buildListAdaptersResult(), options);
}

// ── install ─────────────────────────────────────────────────────────────

async function buildInstallFindings(id: string): Promise<{ candidate: AvailableAdapter | null; findings: CliFinding[] }> {
  const available = await scanAvailableAdapters();
  const configText = await readConfigText().catch(() => '');
  const installedIds = new Set(configText ? readInstalledIds(configText) : []);
  const installed = available.filter(a => installedIds.has(a.id));
  const candidate = available.find(a => a.id === id) ?? null;

  if (!candidate) {
    return {
      candidate: null,
      findings: [{
        level: 'error',
        code: 'AGNO_ADAPTER_NOT_FOUND',
        message: `No existe ${INTEGRATIONS_DIR}/${id}/manifest.ts.`,
        subject: id,
        suggestion: 'Crea el adapter primero (copia src/integrations/notion/ como plantilla) y luego ejecuta install.',
      }],
    };
  }

  return { candidate, findings: await findCollisions(candidate.manifest, installed) };
}

export async function printInstallPlan(id: string, options: CliOutputOptions = {}): Promise<void> {
  const { candidate, findings } = await buildInstallFindings(id);
  printCliResult(createCliResult({
    command: 'install plan',
    summary: { id, found: !!candidate, blocking: findings.filter(f => f.level === 'error').length },
    findings,
  }), options);
}

export async function applyInstallAdapter(id: string, options: { dryRun?: boolean; yes?: boolean; json?: boolean } = {}): Promise<void> {
  const { candidate, findings } = await buildInstallFindings(id);

  if (!candidate) {
    printCliResult(createCliResult({ command: 'install', summary: { id, applied: false }, findings }), options);
    return;
  }

  const blocking = findings.filter(f => f.level === 'error');
  const alreadyInstalled = findings.some(f => f.code === 'AGNO_ADAPTER_ALREADY_INSTALLED');

  if (options.dryRun) {
    printCliResult(createCliResult({
      command: 'install --dry',
      summary: { id, applied: false, blocking: blocking.length },
      findings: [...findings, { level: 'info', code: 'AGNO_ADAPTER_DRY_RUN', message: 'No se escribieron cambios.' }],
    }), options);
    return;
  }

  if (alreadyInstalled && blocking.length === 1) {
    printCliResult(createCliResult({
      command: 'install',
      summary: { id, applied: true, blocking: 0 },
      findings: [{
        level: 'info',
        code: 'AGNO_ADAPTER_ALREADY_INSTALLED_NOOP',
        message: `El adapter '${id}' ya estaba instalado; no se escribieron cambios.`,
      }],
    }), options);
    return;
  }

  if (blocking.length > 0) {
    printCliResult(createCliResult({
      command: 'install',
      summary: { id, applied: false, blocking: blocking.length },
      findings: [...findings, {
        level: 'error',
        code: 'AGNO_ADAPTER_BLOCKED',
        message: 'Instalacion bloqueada por findings de nivel error. Corrige el manifest o resuelve el conflicto.',
      }],
    }), options);
    return;
  }

  if (!options.yes) {
    printCliResult(createCliResult({
      command: 'install',
      summary: { id, applied: false },
      findings: [...findings, {
        level: 'warn',
        code: 'AGNO_ADAPTER_CONFIRMATION_REQUIRED',
        message: 'Instalacion no aplicada porque falta confirmacion explicita.',
        suggestion: `Para aplicar ejecuta: install ${id} --yes`,
      }],
    }), options);
    return;
  }

  const backup = await storage.createBackup([CONFIG_FILE, SERVER_REGISTRY_FILE], `install-adapter-${id}`);
  await mutateConfigFile(id, 'install');
  await mutateServerRegistryFile(id, 'install');

  printCliResult(createCliResult({
    command: 'install',
    summary: { id, applied: true, backup: backup ?? null },
    findings: [
      ...findings,
      {
        level: 'info',
        code: 'AGNO_ADAPTER_INSTALLED',
        message: `Adapter '${id}' registrado en ${CONFIG_FILE} y ${SERVER_REGISTRY_FILE}.`,
        suggestion: 'Verifica sus env vars requeridas y ejecuta list-adapters para confirmar.',
      },
    ],
  }), options);
}

// ── remove-adapter ─────────────────────────────────────────────────────────

async function buildRemoveFindings(id: string): Promise<CliFinding[]> {
  const configText = await readConfigText().catch(() => '');
  const installedIds = new Set(configText ? readInstalledIds(configText) : []);
  if (!installedIds.has(id)) {
    return [{
      level: 'error',
      code: 'AGNO_ADAPTER_NOT_INSTALLED',
      message: `El adapter '${id}' no esta instalado (no aparece en ${CONFIG_FILE}).`,
      subject: id,
    }];
  }
  return [];
}

export async function applyRemoveAdapter(id: string, options: { dryRun?: boolean; yes?: boolean; json?: boolean } = {}): Promise<void> {
  const findings = await buildRemoveFindings(id);
  const blocking = findings.filter(f => f.level === 'error');

  if (blocking.length > 0) {
    printCliResult(createCliResult({ command: 'remove-adapter', summary: { id, applied: false }, findings }), options);
    return;
  }

  if (options.dryRun) {
    printCliResult(createCliResult({
      command: 'remove-adapter --dry',
      summary: { id, applied: false },
      findings: [{ level: 'info', code: 'AGNO_ADAPTER_DRY_RUN', message: 'No se escribieron cambios.' }],
    }), options);
    return;
  }

  if (!options.yes) {
    printCliResult(createCliResult({
      command: 'remove-adapter',
      summary: { id, applied: false },
      findings: [{
        level: 'warn',
        code: 'AGNO_ADAPTER_CONFIRMATION_REQUIRED',
        message: 'Desinstalacion no aplicada porque falta confirmacion explicita.',
        suggestion: `Para aplicar ejecuta: remove-adapter ${id} --yes`,
      }],
    }), options);
    return;
  }

  const backup = await storage.createBackup([CONFIG_FILE, SERVER_REGISTRY_FILE], `remove-adapter-${id}`);
  await mutateConfigFile(id, 'remove');
  await mutateServerRegistryFile(id, 'remove');

  printCliResult(createCliResult({
    command: 'remove-adapter',
    summary: { id, applied: true, backup: backup ?? null },
    findings: [{
      level: 'info',
      code: 'AGNO_ADAPTER_REMOVED',
      message: `Adapter '${id}' des-registrado de ${CONFIG_FILE} y ${SERVER_REGISTRY_FILE}. El codigo fuente en ${INTEGRATIONS_DIR}/${id}/ no se borro.`,
    }],
  }), options);
}
