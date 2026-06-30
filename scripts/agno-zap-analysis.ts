import fs from 'fs/promises';
import path from 'path';
import ts from 'typescript';

type JsonRecord = {
  id?: string;
  context?: string;
  created_at?: string;
  updated_at?: string;
  data?: Record<string, any>;
};

type ZapReference = {
  kind: 'namespace' | 'dispatch' | 'property';
  value: string;
  method?: string;
  line: number;
};

type ZapReport = {
  name: string;
  id?: string;
  references: ZapReference[];
  errors: string[];
  warnings: string[];
};

type RefactorChange = {
  file: string;
  description: string;
};

type RefactorPlan = {
  oldName: string;
  newName: string;
  changes: RefactorChange[];
  warnings: string[];
};

const ROOT_DIR = process.env.INIT_CWD || process.cwd();
const DB_DIR = path.join(ROOT_DIR, 'storage', 'db');

const API_NAMESPACE_METHODS = new Set(['query', 'saveItem', 'removeItem']);
const API_DISPATCH_METHODS = new Set(['dispatchEvent']);
const SYSTEM_NAMESPACES = new Set([
  'page_routes',
  'schema_definitions',
  'system_config',
  'design_tokens',
  'users',
  'user_lists',
  'components',
  'ai_config',
  'scripts',
  'app_navbars',
]);

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

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

async function writeJsonArray(fileName: string, records: JsonRecord[]): Promise<void> {
  const filePath = path.join(DB_DIR, fileName);
  await fs.mkdir(DB_DIR, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(records, null, 2) + '\n', 'utf8');
}

function schemaName(record: JsonRecord): string | null {
  const name = record.data?.name ?? record.data?.slug ?? record.context;
  return typeof name === 'string' ? name : null;
}

function zapName(record: JsonRecord): string {
  return String(record.data?.name ?? record.data?.slug ?? record.context ?? record.id ?? 'zap_sin_nombre');
}

function zapCode(record: JsonRecord): string {
  return String(record.data?.code ?? record.data?.script ?? '');
}

function getLine(source: ts.SourceFile, node: ts.Node): number {
  return source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
}

function callMethodName(node: ts.CallExpression): string | null {
  if (!ts.isPropertyAccessExpression(node.expression)) return null;
  const target = node.expression.expression;
  if (!ts.isIdentifier(target) || target.text !== 'api') return null;
  return node.expression.name.text;
}

function stringLiteralArg(node: ts.CallExpression, index: number): string | null {
  const arg = node.arguments[index];
  if (!arg || !ts.isStringLiteralLike(arg)) return null;
  return arg.text;
}

export function analyzeZapCode(code: string): ZapReference[] {
  const source = ts.createSourceFile('zap.js', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const references: ZapReference[] = [];

  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      const method = callMethodName(node);
      if (method && API_NAMESPACE_METHODS.has(method)) {
        const value = stringLiteralArg(node, 0);
        if (value) references.push({ kind: 'namespace', value, method, line: getLine(source, node) });
      }
      if (method && API_DISPATCH_METHODS.has(method)) {
        const value = stringLiteralArg(node, 0);
        if (value) references.push({ kind: 'dispatch', value, method, line: getLine(source, node) });
      }
    }

    if (ts.isPropertyAccessExpression(node)) {
      const name = node.name.text;
      if (name.endsWith('_id')) {
        references.push({ kind: 'property', value: name, line: getLine(source, node) });
      }
    }

    if (ts.isElementAccessExpression(node)) {
      const arg = node.argumentExpression;
      if (arg && ts.isStringLiteralLike(arg) && arg.text.endsWith('_id')) {
        references.push({ kind: 'property', value: arg.text, line: getLine(source, node) });
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(source);
  return references;
}

async function knownNamespaceSet(): Promise<Set<string>> {
  const schemas = await readJsonArray('schema_definitions.json');
  const names = new Set(SYSTEM_NAMESPACES);
  for (const schema of schemas) {
    const name = schemaName(schema);
    if (name) names.add(name);
  }

  try {
    const files = await fs.readdir(DB_DIR);
    for (const file of files) {
      if (file.endsWith('.json')) names.add(path.basename(file, '.json'));
    }
  } catch {
    // storage/db may not exist yet in a fresh seed.
  }

  return names;
}

async function knownFieldSet(): Promise<Set<string>> {
  const schemas = await readJsonArray('schema_definitions.json');
  const fields = new Set<string>();
  for (const schema of schemas) {
    const schemaFields = Array.isArray(schema.data?.fields) ? schema.data.fields : [];
    for (const field of schemaFields) {
      if (typeof field?.key === 'string') fields.add(field.key);
    }
  }
  return fields;
}

export async function validateZaps(): Promise<ZapReport[]> {
  const [scripts, namespaces, fields] = await Promise.all([
    readJsonArray('scripts.json'),
    knownNamespaceSet(),
    knownFieldSet(),
  ]);

  return scripts.map((script) => {
    const name = zapName(script);
    const code = zapCode(script);
    const references = code ? analyzeZapCode(code) : [];
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!code.trim()) warnings.push('zap sin codigo en data.code/data.script');

    for (const ref of references) {
      if (ref.kind === 'namespace' && !namespaces.has(ref.value)) {
        errors.push(`linea ${ref.line}: api.${ref.method}('${ref.value}') apunta a namespace inexistente`);
      }
      if (ref.kind === 'property' && fields.size > 0 && !fields.has(ref.value)) {
        warnings.push(`linea ${ref.line}: propiedad '${ref.value}' no aparece como field key en schema_definitions`);
      }
    }

    return { name, id: script.id, references, errors, warnings };
  });
}

export async function printValidateZaps(): Promise<void> {
  const reports = await validateZaps();
  const errors = reports.reduce((sum, report) => sum + report.errors.length, 0);
  const warnings = reports.reduce((sum, report) => sum + report.warnings.length, 0);
  console.log(`validate:zaps: ${reports.length} zap(s), ${errors} error(es), ${warnings} warning(s)`);

  for (const report of reports) {
    if (!report.errors.length && !report.warnings.length) continue;
    console.log(`\n${report.name}${report.id ? ` (${report.id.slice(0, 8)})` : ''}`);
    for (const error of report.errors) console.log(`  [error] ${error}`);
    for (const warning of report.warnings) console.log(`  [warn] ${warning}`);
  }

  if (errors > 0) {
    process.exitCode = 1;
  }
}

function replaceExactStringLiteralsInCode(code: string, oldName: string, newName: string): { code: string; count: number } {
  const source = ts.createSourceFile('zap.js', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const edits: Array<{ start: number; end: number; value: string }> = [];

  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      const method = callMethodName(node);
      if (method && (API_NAMESPACE_METHODS.has(method) || API_DISPATCH_METHODS.has(method))) {
        const arg = node.arguments[0];
        if (arg && ts.isStringLiteralLike(arg) && arg.text === oldName) {
          edits.push({ start: arg.getStart(source) + 1, end: arg.getEnd() - 1, value: newName });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);

  let output = code;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    output = output.slice(0, edit.start) + edit.value + output.slice(edit.end);
  }
  return { code: output, count: edits.length };
}

function replaceExactStringsDeep(value: any, oldName: string, newName: string): { value: any; count: number } {
  if (typeof value === 'string') {
    return value === oldName ? { value: newName, count: 1 } : { value, count: 0 };
  }
  if (Array.isArray(value)) {
    let count = 0;
    const next = value.map((item) => {
      const result = replaceExactStringsDeep(item, oldName, newName);
      count += result.count;
      return result.value;
    });
    return { value: next, count };
  }
  if (value && typeof value === 'object') {
    let count = 0;
    const next: Record<string, any> = {};
    for (const [key, item] of Object.entries(value)) {
      const result = replaceExactStringsDeep(item, oldName, newName);
      count += result.count;
      next[key] = result.value;
    }
    return { value: next, count };
  }
  return { value, count: 0 };
}

async function planSchemaDefinitions(oldName: string, newName: string, changes: RefactorChange[]): Promise<void> {
  const schemas = await readJsonArray('schema_definitions.json');
  const hits = schemas.filter((schema) => schemaName(schema) === oldName);
  for (const schema of hits) {
    changes.push({
      file: 'storage/db/schema_definitions.json',
      description: `renombrar schema ${schema.id ?? oldName}: ${oldName} -> ${newName}`,
    });
  }
}

async function planFileRename(oldName: string, newName: string, changes: RefactorChange[], warnings: string[]): Promise<void> {
  const oldPath = path.join(DB_DIR, `${oldName}.json`);
  const newPath = path.join(DB_DIR, `${newName}.json`);
  if (await pathExists(oldPath)) {
    if (await pathExists(newPath)) {
      warnings.push(`No se puede renombrar storage/db/${oldName}.json porque storage/db/${newName}.json ya existe`);
    } else {
      changes.push({
        file: `storage/db/${oldName}.json`,
        description: `renombrar archivo a storage/db/${newName}.json`,
      });
    }
  }
}

async function planExactStringFile(fileName: string, oldName: string, newName: string, changes: RefactorChange[]): Promise<void> {
  const records = await readJsonArray(fileName);
  const result = replaceExactStringsDeep(records, oldName, newName);
  if (result.count > 0) {
    changes.push({
      file: `storage/db/${fileName}`,
      description: `reemplazar ${result.count} string(s) exactos '${oldName}' -> '${newName}'`,
    });
  }
}

async function planScripts(oldName: string, newName: string, changes: RefactorChange[]): Promise<void> {
  const scripts = await readJsonArray('scripts.json');
  let count = 0;
  let zaps = 0;
  for (const script of scripts) {
    const code = zapCode(script);
    const result = replaceExactStringLiteralsInCode(code, oldName, newName);
    if (result.count > 0) {
      count += result.count;
      zaps++;
    }
  }
  if (count > 0) {
    changes.push({
      file: 'storage/db/scripts.json',
      description: `actualizar ${count} literal(es) exactos en ${zaps} zap(s)`,
    });
  }
}

export async function buildRefactorSchemaPlan(oldName: string, newName: string): Promise<RefactorPlan> {
  const changes: RefactorChange[] = [];
  const warnings: string[] = [];
  await planSchemaDefinitions(oldName, newName, changes);
  await planFileRename(oldName, newName, changes, warnings);
  await planExactStringFile('page_routes.json', oldName, newName, changes);
  await planExactStringFile('app_navbars.json', oldName, newName, changes);
  await planScripts(oldName, newName, changes);

  if (oldName.includes('-') || newName.includes('-')) {
    warnings.push('Usa snake_case para namespaces; evita guiones.');
  }

  warnings.push('Este refactor no renombra fields ni relaciones como cotizacion_id -> proyecto_id; usa un refactor de field explicito.');
  return { oldName, newName, changes, warnings };
}

export async function printRefactorSchemaPlan(oldName: string, newName: string): Promise<void> {
  const plan = await buildRefactorSchemaPlan(oldName, newName);
  console.log(`refactor-schema plan: ${oldName} -> ${newName}`);
  if (!plan.changes.length) console.log('- sin cambios detectados');
  for (const change of plan.changes) console.log(`- ${change.file}: ${change.description}`);
  for (const warning of plan.warnings) console.log(`[warn] ${warning}`);
}

async function applySchemaDefinitions(oldName: string, newName: string): Promise<number> {
  const schemas = await readJsonArray('schema_definitions.json');
  let count = 0;
  const next = schemas.map((schema) => {
    if (schemaName(schema) !== oldName) return schema;
    count++;
    return {
      ...schema,
      context: schema.context === oldName ? newName : schema.context,
      updated_at: new Date().toISOString(),
      data: {
        ...schema.data,
        ...(schema.data?.name === oldName ? { name: newName } : {}),
        ...(schema.data?.slug === oldName ? { slug: newName } : {}),
      },
    };
  });
  if (count > 0) await writeJsonArray('schema_definitions.json', next);
  return count;
}

async function applyExactStringFile(fileName: string, oldName: string, newName: string): Promise<number> {
  const records = await readJsonArray(fileName);
  const result = replaceExactStringsDeep(records, oldName, newName);
  if (result.count > 0) await writeJsonArray(fileName, result.value);
  return result.count;
}

async function applyScripts(oldName: string, newName: string): Promise<number> {
  const scripts = await readJsonArray('scripts.json');
  let count = 0;
  const next = scripts.map((script) => {
    const data = script.data ?? {};
    const codeKey = typeof data.code === 'string' ? 'code' : typeof data.script === 'string' ? 'script' : null;
    if (!codeKey) return script;
    const result = replaceExactStringLiteralsInCode(String(data[codeKey]), oldName, newName);
    count += result.count;
    return result.count > 0
      ? { ...script, updated_at: new Date().toISOString(), data: { ...data, [codeKey]: result.code } }
      : script;
  });
  if (count > 0) await writeJsonArray('scripts.json', next);
  return count;
}

async function applyFileRename(oldName: string, newName: string): Promise<boolean> {
  const oldPath = path.join(DB_DIR, `${oldName}.json`);
  const newPath = path.join(DB_DIR, `${newName}.json`);
  if (!await pathExists(oldPath)) return false;
  if (await pathExists(newPath)) {
    throw new Error(`No se puede renombrar: storage/db/${newName}.json ya existe`);
  }
  await fs.rename(oldPath, newPath);
  return true;
}

export async function applyRefactorSchema(oldName: string, newName: string): Promise<void> {
  const plan = await buildRefactorSchemaPlan(oldName, newName);
  if (!plan.changes.length) {
    console.log(`refactor-schema apply: sin cambios para ${oldName} -> ${newName}`);
    return;
  }

  const schemaCount = await applySchemaDefinitions(oldName, newName);
  const routesCount = await applyExactStringFile('page_routes.json', oldName, newName);
  const navCount = await applyExactStringFile('app_navbars.json', oldName, newName);
  const scriptCount = await applyScripts(oldName, newName);
  const renamed = await applyFileRename(oldName, newName);

  console.log(`refactor-schema apply: ${oldName} -> ${newName}`);
  console.log(`- schemas: ${schemaCount}`);
  console.log(`- page_routes strings: ${routesCount}`);
  console.log(`- app_navbars strings: ${navCount}`);
  console.log(`- zap literals: ${scriptCount}`);
  console.log(`- data file renamed: ${renamed ? 'yes' : 'no'}`);
  console.log('Ejecuta despues: npm run agnostic:compile && npx tsx scripts/agno.ts validate:zaps');
}
