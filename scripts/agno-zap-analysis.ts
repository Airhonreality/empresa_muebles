import ts from 'typescript';
import { storageRepository as storage, type JsonRecord } from './storage-repository';
import { createCliResult, printCliResult, type CliFinding, type CliResult } from './cli-reporter';

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
  const schemas = await storage.readJsonArray('schema_definitions.json');
  const names = new Set(SYSTEM_NAMESPACES);
  for (const schema of schemas) {
    const name = schemaName(schema);
    if (name) names.add(name);
  }

  try {
    const files = await storage.listDbJsonFiles();
    for (const file of files) {
      names.add(file.replace(/\.json$/, ''));
    }
  } catch {
    // storage/db may not exist yet in a fresh seed.
  }

  return names;
}

async function knownFieldSet(): Promise<Set<string>> {
  const schemas = await storage.readJsonArray('schema_definitions.json');
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
    storage.readJsonArray('scripts.json'),
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

export async function validateZapsResult(): Promise<CliResult> {
  const reports = await validateZaps();
  const errors = reports.reduce((sum, report) => sum + report.errors.length, 0);
  const warnings = reports.reduce((sum, report) => sum + report.warnings.length, 0);
  const findings: CliFinding[] = [];

  for (const report of reports) {
    for (const error of report.errors) {
      findings.push({
        level: 'error',
        code: 'AGNO_ZAP_UNKNOWN_NAMESPACE',
        message: error,
        file: 'storage/db/scripts.json',
        subject: report.name,
        suggestion: 'Crea el schema faltante o ejecuta refactor-schema plan <old_name> <new_name>.',
        metadata: report.id ? { zap_id: report.id } : undefined,
      });
    }
    for (const warning of report.warnings) {
      findings.push({
        level: 'warn',
        code: warning.includes('sin codigo') ? 'AGNO_ZAP_EMPTY_CODE' : 'AGNO_ZAP_UNKNOWN_FIELD',
        message: warning,
        file: 'storage/db/scripts.json',
        subject: report.name,
        suggestion: warning.includes('sin codigo')
          ? 'Agrega data.code/data.script o elimina el zap obsoleto.'
          : 'Verifica si el field existe en schema_definitions o si requiere refactor-field.',
        metadata: report.id ? { zap_id: report.id } : undefined,
      });
    }
  }

  return createCliResult({
    command: 'validate:zaps',
    summary: { zaps: reports.length, errors, warnings },
    findings,
    metadata: { reports },
  });
}

export async function printValidateZaps(options: { json?: boolean; quiet?: boolean } = {}): Promise<void> {
  printCliResult(await validateZapsResult(), options);
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
  const schemas = await storage.readJsonArray('schema_definitions.json');
  const hits = schemas.filter((schema) => schemaName(schema) === oldName);
  for (const schema of hits) {
    changes.push({
      file: 'storage/db/schema_definitions.json',
      description: `renombrar schema ${schema.id ?? oldName}: ${oldName} -> ${newName}`,
    });
  }
}

async function planFileRename(oldName: string, newName: string, changes: RefactorChange[], warnings: string[]): Promise<void> {
  const oldPath = storage.dbPath(`${oldName}.json`);
  const newPath = storage.dbPath(`${newName}.json`);
  if (await storage.exists(oldPath)) {
    if (await storage.exists(newPath)) {
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
  const records = await storage.readJsonArray(fileName);
  const result = replaceExactStringsDeep(records, oldName, newName);
  if (result.count > 0) {
    changes.push({
      file: `storage/db/${fileName}`,
      description: `reemplazar ${result.count} string(s) exactos '${oldName}' -> '${newName}'`,
    });
  }
}

async function planScripts(oldName: string, newName: string, changes: RefactorChange[]): Promise<void> {
  const scripts = await storage.readJsonArray('scripts.json');
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

export async function printRefactorSchemaPlan(oldName: string, newName: string, options: { json?: boolean } = {}): Promise<void> {
  const plan = await buildRefactorSchemaPlan(oldName, newName);
  printCliResult(createCliResult({
    command: 'refactor-schema plan',
    summary: { old_name: oldName, new_name: newName, changes: plan.changes.length, warnings: plan.warnings.length },
    findings: [
      ...plan.changes.map<CliFinding>(change => ({
        level: 'info',
        code: 'AGNO_REFACTOR_PLANNED_CHANGE',
        message: change.description,
        file: change.file,
      })),
      ...plan.warnings.map<CliFinding>(warning => ({
        level: 'warn',
        code: 'AGNO_REFACTOR_LIMITATION',
        message: warning,
        suggestion: warning.includes('fields') || warning.includes('relaciones')
          ? 'Usa un refactor de field/relation explicito para cambios de llaves.'
          : undefined,
      })),
    ],
    metadata: { plan },
  }), options);
}

async function applySchemaDefinitions(oldName: string, newName: string): Promise<number> {
  const schemas = await storage.readJsonArray('schema_definitions.json');
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
  if (count > 0) await storage.writeJsonArray('schema_definitions.json', next);
  return count;
}

async function applyExactStringFile(fileName: string, oldName: string, newName: string): Promise<number> {
  const records = await storage.readJsonArray(fileName);
  const result = replaceExactStringsDeep(records, oldName, newName);
  if (result.count > 0) await storage.writeJsonArray(fileName, result.value);
  return result.count;
}

async function applyScripts(oldName: string, newName: string): Promise<number> {
  const scripts = await storage.readJsonArray('scripts.json');
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
  if (count > 0) await storage.writeJsonArray('scripts.json', next);
  return count;
}

async function applyFileRename(oldName: string, newName: string): Promise<boolean> {
  return storage.renameDbFile(oldName, newName);
}

export async function applyRefactorSchema(oldName: string, newName: string, options: { dryRun?: boolean; yes?: boolean; json?: boolean } = {}): Promise<void> {
  const plan = await buildRefactorSchemaPlan(oldName, newName);
  if (!plan.changes.length) {
    printCliResult(createCliResult({
      command: 'refactor-schema apply',
      summary: { old_name: oldName, new_name: newName, changes: 0 },
      findings: [],
    }), options);
    return;
  }

  if (options.dryRun) {
    await printRefactorSchemaPlan(oldName, newName, options);
    printCliResult(createCliResult({
      command: 'refactor-schema apply --dry',
      summary: { old_name: oldName, new_name: newName, changes: plan.changes.length },
      findings: [{
        level: 'info',
        code: 'AGNO_REFACTOR_DRY_RUN',
        message: 'No se escribieron cambios.',
      }],
    }), options);
    return;
  }

  if (!options.yes) {
    await printRefactorSchemaPlan(oldName, newName, options);
    printCliResult(createCliResult({
      command: 'refactor-schema apply',
      summary: { old_name: oldName, new_name: newName, changes: plan.changes.length, applied: false },
      findings: [{
        level: 'warn',
        code: 'AGNO_REFACTOR_CONFIRMATION_REQUIRED',
        message: 'Refactor no aplicado porque falta confirmacion explicita.',
        suggestion: 'Para aplicar ejecuta: refactor-schema apply <old_name> <new_name> --yes',
      }],
    }), options);
    return;
  }

  const backup = await storage.createBackup([
    'storage/db/schema_definitions.json',
    'storage/db/page_routes.json',
    'storage/db/app_navbars.json',
    'storage/db/scripts.json',
    `storage/db/${oldName}.json`,
  ], `refactor-schema-${oldName}-to-${newName}`);

  const schemaCount = await applySchemaDefinitions(oldName, newName);
  const routesCount = await applyExactStringFile('page_routes.json', oldName, newName);
  const navCount = await applyExactStringFile('app_navbars.json', oldName, newName);
  const scriptCount = await applyScripts(oldName, newName);
  const renamed = await applyFileRename(oldName, newName);

  printCliResult(createCliResult({
    command: 'refactor-schema apply',
    summary: {
      old_name: oldName,
      new_name: newName,
      schemas: schemaCount,
      page_routes_strings: routesCount,
      app_navbars_strings: navCount,
      zap_literals: scriptCount,
      data_file_renamed: renamed,
      backup: backup ?? null,
    },
    findings: [{
      level: 'info',
      code: 'AGNO_REFACTOR_APPLIED',
      message: `Refactor aplicado: ${oldName} -> ${newName}`,
      suggestion: 'Ejecuta despues: npm run agnostic:compile && npx tsx scripts/agno.ts validate:zaps',
    }],
  }), options);
}
