import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';
import { storageRepository as storage } from './storage-repository';
import { createCliResult, printCliResult, type CliFinding, type CliOutputOptions, type CliResult } from './cli-reporter';
import type { ModuleManifest } from '@agnostic/core';

const MODULES_SRC_DIR = 'packages/modules';
const SPECIALIZED_DIR = 'src/components/specialized';
const CONFIG_FILE = 'agnostic.config.ts';

const MODULE_MARKER_START = '// agno:modules:start';
const MODULE_MARKER_END = '// agno:modules:end';

export type AvailableModule = { id: string; manifest: ModuleManifest };

// ── helpers ───────────────────────────────────────────────────────────────

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── reading ───────────────────────────────────────────────────────────────

async function scanAvailableModules(): Promise<AvailableModule[]> {
  const dir = storage.resolve(MODULES_SRC_DIR);
  let entries: string[];
  try {
    entries = (await fs.readdir(dir, { withFileTypes: true }))
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
  } catch {
    return [];
  }

  const modules: AvailableModule[] = [];
  for (const id of entries) {
    const manifestPath = storage.resolve(MODULES_SRC_DIR, id, 'manifest.ts');
    if (!(await storage.exists(manifestPath))) continue;
    try {
      const mod = await import(`${pathToFileURL(manifestPath).href}?t=${Date.now()}`);
      const manifest: ModuleManifest | undefined = mod.manifest ?? mod.default;
      if (manifest?.id === id) modules.push({ id, manifest });
    } catch {
      // broken manifest = not available
    }
  }
  return modules.sort((a, b) => a.id.localeCompare(b.id));
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

function readInstalledModuleIds(configText: string): string[] {
  const zone = extractMarkedZone(configText, MODULE_MARKER_START, MODULE_MARKER_END);
  if (zone === null) return [];
  const ids: string[] = [];
  // Look for // module: <id> comments in the markers zone
  const moduleRe = /\/\/\s*module:\s*([a-zA-Z0-9_]+)/g;
  let match: RegExpExecArray | null;
  while ((match = moduleRe.exec(zone))) ids.push(match[1]);
  return ids;
}

// ── config mutation ───────────────────────────────────────────────────────

function ensureBlockMarkers(text: string): string {
  if (text.includes(MODULE_MARKER_START)) return text;
  const clean = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
  // Find the closing of the first JSDoc comment block, then search for non-comment blocks: {
  const endComment = clean.indexOf('*/') + 2;
  const afterComment = clean.slice(endComment);
  const blocksMatch = afterComment.match(/blocks\s*:\s*\{/);
  if (!blocksMatch) throw new Error('No se encontro "blocks: {" en agnostic.config.ts');
  const insertPos = endComment + blocksMatch.index! + blocksMatch[0].length;
  return clean.slice(0, insertPos) + `\n    ${MODULE_MARKER_START}\n    ${MODULE_MARKER_END}\n` + clean.slice(insertPos);
}

async function mutateConfigFile(
  id: string,
  manifest: ModuleManifest,
  action: 'install' | 'remove',
): Promise<void> {
  const filePath = storage.resolve(CONFIG_FILE);
  let text = await fs.readFile(filePath, 'utf8');
  text = ensureBlockMarkers(text);

  if (action === 'install') {
    // Insert module id marker for tracking installed modules
    text = insertBeforeMarker(text, MODULE_MARKER_END, `// module: ${id}`);
    for (const [blockType, bt] of Object.entries(manifest.block_types)) {
      const entryNoExt = bt.entry.replace(/\.tsx?$/, '');
      const importLine = bt.settings_schema
        ? `    ${blockType}: { loader: () => import('./${SPECIALIZED_DIR}/${id}/${entryNoExt}'), settings_schema: ${JSON.stringify(bt.settings_schema)} },`
        : `    ${blockType}: () => import('./${SPECIALIZED_DIR}/${id}/${entryNoExt}'),`;
      text = insertBeforeMarker(text, MODULE_MARKER_END, importLine);
    }
  } else {
    const blockTypes = Object.keys(manifest.block_types);
    const patterns = blockTypes.map(t => escapeRegExp(t));
    patterns.push(`//\\s*module:\\s*${escapeRegExp(id)}`);
    const re = new RegExp(`^\\s*(${patterns.join('|')})\\s*`, 'm');
    text = removeLinesMatching(text, line => re.test(line.trimStart()));
    // If marker zone is empty after removing entries, strip markers too
    const zone = extractMarkedZone(text, MODULE_MARKER_START, MODULE_MARKER_END);
    if (zone !== null && zone.trim() === '') {
      text = text.replace(/\n\s*\/\/ agno:modules:start[\s\S]*?\/\/ agno:modules:end\n?/, '');
    }
  }

  await fs.writeFile(filePath, text, 'utf8');
}

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

// ── copy / remove specialized dir ─────────────────────────────────────────

async function copyModuleSource(id: string): Promise<void> {
  const src = storage.resolve(MODULES_SRC_DIR, id);
  const dest = storage.resolve(SPECIALIZED_DIR, id);

  const entries = await fs.readdir(src, { withFileTypes: true });
  await fs.mkdir(dest, { recursive: true });
  for (const entry of entries) {
    if (entry.name === 'manifest.ts') continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await fs.cp(srcPath, destPath, { recursive: true });
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function removeModuleSource(id: string): Promise<void> {
  const dest = storage.resolve(SPECIALIZED_DIR, id);
  await fs.rm(dest, { recursive: true, force: true });
}

// ── collisions ────────────────────────────────────────────────────────────

async function findInstallCollisions(
  candidate: AvailableModule,
  installed: AvailableModule[],
): Promise<CliFinding[]> {
  const findings: CliFinding[] = [];

  if (installed.some(a => a.id === candidate.id)) {
    findings.push({
      level: 'error',
      code: 'AGNO_MODULE_ALREADY_INSTALLED',
      message: `El modulo '${candidate.id}' ya esta instalado.`,
      subject: candidate.id,
    });
  }

  const destDir = storage.resolve(SPECIALIZED_DIR, candidate.id);
  if (await storage.exists(destDir)) {
    findings.push({
      level: 'error',
      code: 'AGNO_MODULE_DIR_COLLISION',
      message: `La carpeta ${SPECIALIZED_DIR}/${candidate.id}/ ya existe en disco.`,
      subject: candidate.id,
      suggestion: 'Borrarla manualmente o usar remove-module si ya estaba registrado.',
    });
  }

  const configText = await readConfigText().catch(() => '');
  for (const [blockType] of Object.entries(candidate.manifest.block_types)) {
    if (configText.includes(`    ${blockType}:`)) {
      findings.push({
        level: 'error',
        code: 'AGNO_MODULE_BLOCK_TYPE_COLLISION',
        message: `El tipo de bloque '${blockType}' ya esta registrado en agnostic.config.ts.`,
        subject: candidate.id,
      });
    }
  }

  if (candidate.manifest.required_schemas?.length) {
    const schemas = await storage.readJsonArray('schema_definitions.json');
    const names = new Set(schemas.map(s => (s as any).data?.name).filter(Boolean));
    for (const required of candidate.manifest.required_schemas) {
      if (!names.has(required)) {
        findings.push({
          level: 'warn',
          code: 'AGNO_MODULE_SCHEMA_MISSING',
          message: `'${candidate.id}' requiere el schema '${required}', que no existe en schema_definitions.json.`,
          subject: candidate.id,
          suggestion: `Crea el schema con: create-schema ${required} ...`,
        });
      }
    }
  }

  if (candidate.manifest.npm_dependencies) {
    const pkg = await readPackageJson();
    for (const [pkgName] of Object.entries(candidate.manifest.npm_dependencies)) {
      if (!pkg.dependencies?.[pkgName] && !pkg.devDependencies?.[pkgName]) {
        findings.push({
          level: 'warn',
          code: 'AGNO_MODULE_NPM_MISSING',
          message: `El modulo requiere npm dep '${pkgName}', no instalada.`,
          subject: candidate.id,
          suggestion: `Ejecuta: npm install ${pkgName}`,
        });
      }
    }
  }

  return findings;
}

async function readPackageJson(): Promise<Record<string, any>> {
  try {
    const raw = await fs.readFile(storage.resolve('package.json'), 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function findRemoveCollisions(id: string): Promise<CliFinding[]> {
  const configText = await readConfigText().catch(() => '');
  const installedIds = new Set(readInstalledModuleIds(configText));
  if (!installedIds.has(id)) {
    return [{
      level: 'error',
      code: 'AGNO_MODULE_NOT_INSTALLED',
      message: `El modulo '${id}' no esta instalado (no aparece en marcadores de ${CONFIG_FILE}).`,
      subject: id,
    }];
  }
  return [];
}

// ── list-modules ──────────────────────────────────────────────────────────

async function buildListModulesResult(): Promise<CliResult> {
  const available = await scanAvailableModules();
  const configText = await readConfigText().catch(() => '');
  const installedIds = new Set(configText ? readInstalledModuleIds(configText) : []);

  const findings: CliFinding[] = available.map(a => ({
    level: 'info',
    code: 'AGNO_MODULE_AVAILABLE',
    message: `${a.manifest.name} (${a.id}) v${a.manifest.version} — ${installedIds.has(a.id) ? 'instalado' : 'disponible'}`,
    subject: a.id,
    metadata: {
      installed: installedIds.has(a.id),
      blocks: Object.keys(a.manifest.block_types).join(', ') || 'ninguno',
    },
  }));

  return createCliResult({
    command: 'list-modules',
    summary: { available: available.length, installed: installedIds.size },
    findings,
  });
}

export async function printListModules(options: CliOutputOptions = {}): Promise<void> {
  printCliResult(await buildListModulesResult(), options);
}

// ── install-module ────────────────────────────────────────────────────────

async function buildInstallFindings(id: string): Promise<{ candidate: AvailableModule | null; findings: CliFinding[] }> {
  const available = await scanAvailableModules();
  const configText = await readConfigText().catch(() => '');
  const installedIds = new Set(configText ? readInstalledModuleIds(configText) : []);
  const installed = available.filter(a => installedIds.has(a.id));
  const candidate = available.find(a => a.id === id) ?? null;

  if (!candidate) {
    return {
      candidate: null,
      findings: [{
        level: 'error',
        code: 'AGNO_MODULE_NOT_FOUND',
        message: `No existe ${MODULES_SRC_DIR}/${id}/manifest.ts.`,
        subject: id,
        suggestion: 'Crea el modulo primero siguiendo la estructura de ModuleManifest.',
      }],
    };
  }

  return { candidate, findings: await findInstallCollisions(candidate, installed) };
}

async function buildRemoveFindings(id: string): Promise<CliFinding[]> {
  return findRemoveCollisions(id);
}

export async function printInstallModulePlan(id: string, options: CliOutputOptions = {}): Promise<void> {
  const { candidate, findings } = await buildInstallFindings(id);
  printCliResult(createCliResult({
    command: 'install-module plan',
    summary: { id, found: !!candidate, blocking: findings.filter(f => f.level === 'error').length },
    findings,
  }), options);
}

export async function applyInstallModule(
  id: string,
  options: { dryRun?: boolean; yes?: boolean; json?: boolean } = {},
): Promise<void> {
  const { candidate, findings } = await buildInstallFindings(id);
  if (!candidate) {
    printCliResult(createCliResult({ command: 'install-module', summary: { id, applied: false }, findings }), options);
    return;
  }

  const blocking = findings.filter(f => f.level === 'error');

  if (options.dryRun) {
    printCliResult(createCliResult({
      command: 'install-module --dry',
      summary: { id, applied: false, blocking: blocking.length },
      findings: [...findings, { level: 'info', code: 'AGNO_MODULE_DRY_RUN', message: 'No se escribieron cambios.' }],
    }), options);
    return;
  }

  if (blocking.length > 0) {
    printCliResult(createCliResult({
      command: 'install-module',
      summary: { id, applied: false, blocking: blocking.length },
      findings: [...findings, {
        level: 'error',
        code: 'AGNO_MODULE_BLOCKED',
        message: 'Instalacion bloqueada por findings de nivel error.',
      }],
    }), options);
    return;
  }

  if (!options.yes) {
    printCliResult(createCliResult({
      command: 'install-module',
      summary: { id, applied: false },
      findings: [...findings, {
        level: 'warn',
        code: 'AGNO_MODULE_CONFIRMATION_REQUIRED',
        message: 'Instalacion no aplicada porque falta confirmacion explicita.',
        suggestion: `Para aplicar ejecuta: install-module ${id} --yes`,
      }],
    }), options);
    return;
  }

  const backup = await storage.createBackup([CONFIG_FILE], `install-module-${id}`);
  await copyModuleSource(id);
  await mutateConfigFile(id, candidate.manifest, 'install');

  printCliResult(createCliResult({
    command: 'install-module',
    summary: { id, applied: true, backup: backup ?? null },
    findings: [
      ...findings,
      {
        level: 'info',
        code: 'AGNO_MODULE_INSTALLED',
        message: `Modulo '${id}' instalado: copiado a ${SPECIALIZED_DIR}/${id}/ y registrado en ${CONFIG_FILE}.`,
        suggestion: 'Verifica que los schemas requeridos existan y ejectura: npm run agnostic:compile',
      },
    ],
  }), options);
}

// ── remove-module ─────────────────────────────────────────────────────────

export async function printRemoveModulePlan(id: string, options: CliOutputOptions = {}): Promise<void> {
  const findings = await buildRemoveFindings(id);
  printCliResult(createCliResult({
    command: 'remove-module plan',
    summary: { id, found: findings.length === 0, blocking: findings.filter(f => f.level === 'error').length },
    findings,
  }), options);
}

function readBlockTypesFromMarkerZone(configText: string, id: string): string[] {
  const zone = extractMarkedZone(configText, MODULE_MARKER_START, MODULE_MARKER_END);
  if (!zone) return [];
  // Find the // module: <id> line to confirm we're in the right module's zone
  if (!zone.includes(`// module: ${id}`)) return [];
  const types: string[] = [];
  const lineRe = /^\s*([a-zA-Z0-9_]+)\s*:/gm;
  let match: RegExpExecArray | null;
  while ((match = lineRe.exec(zone))) types.push(match[1]);
  return types;
}

export async function applyRemoveModule(
  id: string,
  options: { dryRun?: boolean; yes?: boolean; json?: boolean } = {},
): Promise<void> {
  const configText = await readConfigText().catch(() => '');
  const findings = await buildRemoveFindings(id);
  const blocking = findings.filter(f => f.level === 'error');

  if (blocking.length > 0) {
    printCliResult(createCliResult({
      command: 'remove-module',
      summary: { id, applied: false },
      findings,
    }), options);
    return;
  }

  if (options.dryRun) {
    printCliResult(createCliResult({
      command: 'remove-module --dry',
      summary: { id, applied: false },
      findings: [...findings, { level: 'info', code: 'AGNO_MODULE_DRY_RUN', message: 'No se escribieron cambios.' }],
    }), options);
    return;
  }

  if (!options.yes) {
    printCliResult(createCliResult({
      command: 'remove-module',
      summary: { id, applied: false },
      findings: [...findings, {
        level: 'warn',
        code: 'AGNO_MODULE_CONFIRMATION_REQUIRED',
        message: 'Desinstalacion no aplicada porque falta confirmacion explicita.',
        suggestion: `Para aplicar ejecuta: remove-module ${id} --yes`,
      }],
    }), options);
    return;
  }

  const backup = await storage.createBackup([CONFIG_FILE], `remove-module-${id}`);

  // Read block types from the marker zone to know what to remove
  const blockTypes = readBlockTypesFromMarkerZone(configText, id);
  // Build a minimal manifest-like object for mutateConfigFile
  const fakeManifest: ModuleManifest = {
    id,
    name: id,
    description: '',
    version: '',
    block_types: Object.fromEntries(blockTypes.map(t => [t, { entry: '' }])),
  };
  await mutateConfigFile(id, fakeManifest, 'remove');
  await removeModuleSource(id);

  printCliResult(createCliResult({
    command: 'remove-module',
    summary: { id, applied: true, backup: backup ?? null },
    findings: [...findings, {
      level: 'info',
      code: 'AGNO_MODULE_REMOVED',
      message: `Modulo '${id}' desinstalado: carpeta ${SPECIALIZED_DIR}/${id}/ borrada y entradas eliminadas de ${CONFIG_FILE}.`,
    }],
  }), options);
}
