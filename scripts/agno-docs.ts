import fs from 'fs/promises';
import path from 'path';

type JsonRecord = {
  id?: string;
  context?: string;
  created_at?: string;
  updated_at?: string;
  data?: Record<string, any>;
};

export type StorageDocKind = 'schemas' | 'zaps' | 'routes' | 'modules' | 'all';

const ROOT_DIR = process.env.INIT_CWD || process.cwd();
const DOC_DIR = path.join(ROOT_DIR, 'storage', 'docs');
const DB_DIR = path.join(ROOT_DIR, 'storage', 'db');
const SPECIALIZED_DIR = path.join(ROOT_DIR, 'src', 'components', 'specialized');

const DOC_FILES = {
  schemas: 'arbol_de_schemas.md',
  zaps: 'arbol_de_zaps.md',
  routes: 'arbol_de_rutas.md',
  modules: 'arbol_de_modulos.md',
  summary: 'resumen_agentivo.md',
} as const;

async function readJsonArray(fileName: string): Promise<JsonRecord[]> {
  const filePath = path.join(DB_DIR, fileName);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err: any) {
    if (err?.code === 'ENOENT') return [];
    throw new Error(`No se pudo leer ${fileName}: ${err.message}`);
  }
}

function header(title: string, source: string): string[] {
  return [
    `# ${title}`,
    '',
    `Generated: ${new Date().toISOString()}`,
    `Source: ${source}`,
    '',
    '> Documento generado por `agno docs`. No es fuente canonica; la fuente canonica sigue en `storage/db/`.',
    '',
  ];
}

function schemaName(record: JsonRecord): string {
  return String(record.data?.name ?? record.data?.slug ?? record.context ?? record.id ?? 'schema_sin_nombre');
}

function routePath(record: JsonRecord): string {
  return String(record.data?.path ?? record.context ?? record.id ?? '/ruta_sin_path');
}

function zapName(record: JsonRecord): string {
  return String(record.data?.name ?? record.data?.slug ?? record.context ?? record.id ?? 'zap_sin_nombre');
}

function listDispatches(code: string): string[] {
  const found = new Set<string>();
  const regex = /dispatchEvent\s*\(\s*['"`]([^'"`]+)['"`]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(code))) found.add(match[1]);
  return [...found].sort();
}

function listApiNamespaces(code: string): string[] {
  const found = new Set<string>();
  const regex = /api\.(?:query|saveItem|removeItem)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(code))) found.add(match[1]);
  return [...found].sort();
}

function routeBlockLines(blocks: any[] = [], depth = 0): string[] {
  const pad = '  '.repeat(depth);
  const lines: string[] = [];
  for (const block of blocks) {
    const parts = [
      block?.type ? `type:${block.type}` : 'type:sin_tipo',
      block?.context ? `context:${block.context}` : null,
      block?.zap ? `zap:${block.zap}` : null,
      block?.id ? `id:${String(block.id).slice(0, 8)}` : null,
    ].filter(Boolean);
    lines.push(`${pad}- ${parts.join(' ')}`);
    if (Array.isArray(block?.blocks) && block.blocks.length) {
      lines.push(...routeBlockLines(block.blocks, depth + 1));
    }
  }
  return lines;
}

async function walkFiles(root: string, extensions: Set<string>): Promise<string[]> {
  try {
    const entries = await fs.readdir(root, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      const fullPath = path.join(root, entry.name);
      if (entry.isDirectory()) {
        files.push(...await walkFiles(fullPath, extensions));
      } else if (extensions.has(path.extname(entry.name))) {
        files.push(fullPath);
      }
    }
    return files.sort();
  } catch (err: any) {
    if (err?.code === 'ENOENT') return [];
    throw err;
  }
}

function findExports(source: string): string[] {
  const found = new Set<string>();
  const patterns = [
    /export\s+default\s+function\s+([A-Za-z0-9_]+)/g,
    /export\s+function\s+([A-Za-z0-9_]+)/g,
    /export\s+(?:const|class|interface|type)\s+([A-Za-z0-9_]+)/g,
    /export\s+default\s+(?!function\b|class\b)([A-Za-z0-9_]+)/g,
  ];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source))) found.add(match[1]);
  }
  return [...found].sort();
}

function findImports(source: string): string[] {
  const found = new Set<string>();
  const regex = /from\s+['"`]([^'"`]+)['"`]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(source))) found.add(match[1]);
  return [...found].sort();
}

function findLikelyNamespaces(source: string): string[] {
  const found = new Set<string>();
  const patterns = [
    /context:\s*['"`]([a-z0-9_]+)['"`]/g,
    /namespace:\s*['"`]([a-z0-9_]+)['"`]/g,
    /schemaName:\s*['"`]([a-z0-9_]+)['"`]/g,
  ];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source))) found.add(match[1]);
  }
  return [...found].sort();
}

async function writeDoc(fileName: string, lines: string[]): Promise<string> {
  await fs.mkdir(DOC_DIR, { recursive: true });
  const filePath = path.join(DOC_DIR, fileName);
  await fs.writeFile(filePath, `${lines.join('\n').trimEnd()}\n`, 'utf8');
  return filePath;
}

async function generateSchemasDoc(): Promise<string> {
  const records = await readJsonArray('schema_definitions.json');
  const lines = header('Arbol De Schemas', 'storage/db/schema_definitions.json');
  if (!records.length) lines.push('No hay schemas registrados.');

  for (const schema of records.sort((a, b) => schemaName(a).localeCompare(schemaName(b)))) {
    const data = schema.data ?? {};
    const fields = Array.isArray(data.fields) ? data.fields : [];
    lines.push(`## ${schemaName(schema)}`, '');
    if (data.label) lines.push(`Label: ${data.label}`, '');
    if (!fields.length) {
      lines.push('- sin campos', '');
      continue;
    }
    for (const field of fields) {
      const relation = field?.config?.relation?.entity ? ` -> ${field.config.relation.entity}` : '';
      const required = field?.required ? ' required' : '';
      lines.push(`- ${field?.key ?? 'campo_sin_key'}${relation}${required}`);
    }
    lines.push('');
  }
  return writeDoc(DOC_FILES.schemas, lines);
}

async function generateZapsDoc(): Promise<string> {
  const records = await readJsonArray('scripts.json');
  const lines = header('Arbol De Zaps', 'storage/db/scripts.json');
  if (!records.length) lines.push('No hay zaps registrados.');

  for (const zap of records.sort((a, b) => zapName(a).localeCompare(zapName(b)))) {
    const data = zap.data ?? {};
    const code = String(data.code ?? data.script ?? '');
    const namespaces = listApiNamespaces(code);
    const dispatches = listDispatches(code);
    lines.push(`## ${zapName(zap)}`, '');
    if (zap.id) lines.push(`- id: ${zap.id}`);
    if (zap.updated_at) lines.push(`- updated_at: ${zap.updated_at}`);
    lines.push(`- namespaces: ${namespaces.length ? namespaces.join(', ') : 'no_detectados'}`);
    lines.push(`- dispatches: ${dispatches.length ? dispatches.join(', ') : 'no_detectados'}`);
    lines.push('');
  }
  return writeDoc(DOC_FILES.zaps, lines);
}

async function generateRoutesDoc(): Promise<string> {
  const records = await readJsonArray('page_routes.json');
  const lines = header('Arbol De Rutas', 'storage/db/page_routes.json');
  if (!records.length) lines.push('No hay rutas registradas.');

  for (const route of records.sort((a, b) => routePath(a).localeCompare(routePath(b)))) {
    const data = route.data ?? {};
    const blocks = Array.isArray(data.blocks) ? data.blocks : [];
    lines.push(`## ${routePath(route)}`, '');
    if (data.title) lines.push(`- title: ${data.title}`);
    if (data.required_role) lines.push(`- required_role: ${data.required_role}`);
    lines.push('- blocks:');
    lines.push(...(blocks.length ? routeBlockLines(blocks, 1) : ['  - sin_bloques']));
    lines.push('');
  }
  return writeDoc(DOC_FILES.routes, lines);
}

async function generateModulesDoc(): Promise<string> {
  const files = await walkFiles(SPECIALIZED_DIR, new Set(['.ts', '.tsx']));
  const lines = header('Arbol De Modulos', 'src/components/specialized');
  if (!files.length) lines.push('No hay modulos especializados registrados.');

  for (const filePath of files) {
    const source = await fs.readFile(filePath, 'utf8');
    const relativePath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
    const exports = findExports(source);
    const imports = findImports(source);
    const namespaces = findLikelyNamespaces(source);
    lines.push(`## ${relativePath}`, '');
    lines.push(`- exports: ${exports.length ? exports.join(', ') : 'no_detectados'}`);
    lines.push(`- imports: ${imports.length ? imports.join(', ') : 'no_detectados'}`);
    lines.push(`- namespaces: ${namespaces.length ? namespaces.join(', ') : 'no_detectados'}`);
    lines.push('');
  }
  return writeDoc(DOC_FILES.modules, lines);
}

async function generateSummaryDoc(generatedFiles: string[]): Promise<string> {
  const lines = header('Resumen Agentivo', 'storage/docs/*.md');
  lines.push('## Documentos', '');
  for (const filePath of generatedFiles) {
    lines.push(`- ${path.relative(ROOT_DIR, filePath).replace(/\\/g, '/')}`);
  }
  lines.push('', '## Uso Recomendado', '');
  lines.push('- Leer este resumen para ubicar el arnes.');
  lines.push('- Leer arbol_de_schemas.md para contratos de datos.');
  lines.push('- Leer arbol_de_rutas.md para pantallas y bloques.');
  lines.push('- Leer arbol_de_zaps.md para automatizaciones.');
  lines.push('- Leer arbol_de_modulos.md para UI especializada fuera del engine.');
  return writeDoc(DOC_FILES.summary, lines);
}

export async function generateStorageDocs(kind: StorageDocKind): Promise<string[]> {
  const generated: string[] = [];
  if (kind === 'schemas' || kind === 'all') generated.push(await generateSchemasDoc());
  if (kind === 'zaps' || kind === 'all') generated.push(await generateZapsDoc());
  if (kind === 'routes' || kind === 'all') generated.push(await generateRoutesDoc());
  if (kind === 'modules' || kind === 'all') generated.push(await generateModulesDoc());
  if (kind === 'all') generated.push(await generateSummaryDoc(generated));
  return generated;
}
