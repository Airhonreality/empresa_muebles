/**
 * agno — Agnostic CLI REPL
 * Navegación por capas con belt de contexto. Sin MCP protocol overhead.
 *
 * Uso:
 *   npx tsx scripts/agno.ts <cmd> [args]      ← one-shot
 *   echo -e "ls\nschema cotizaciones" | npx tsx scripts/agno.ts  ← pipe
 *   npx tsx scripts/agno.ts                   ← REPL interactivo
 *
 * Capas:
 *   ESTRUCTURA  → ls, schema <name>, route <path>, ui <route>, scripts
 *   DATOS       → records <schema> [limit=N] [key=val]
 *   CAMBIO      → set, commit, drop, status
 *   SCHEMA CRUD → create-schema, add-field, remove-field, delete-schema
 *   ROUTE CRUD  → create-route, add-block, update-block, remove-block, delete-route
 *   RECORD CRUD → create-record, update-record, delete-record
 *   SCRIPTS     → script <name>, script write <name> --file <path>, script export
 */

import { getStrategy } from '../src/server/getStrategy';
import readline from 'readline';
import crypto from 'crypto';
import fs from 'fs/promises';

const adapter = getStrategy();

// ── ESTADO ───────────────────────────────────────────────────────────────────

type Layer = 'ESTRUCTURA' | 'DATOS' | 'UI' | 'SCRIPTS' | 'CAMBIO';

const pending: Array<{ desc: string; run: () => Promise<void> }> = [];

function belt(layer: Layer, focus?: string) {
  return focus ? `[${layer} · ${focus}]` : `[${layer}]`;
}

// ── HELPERS ──────────────────────────────────────────────────────────────────

async function getSchemas() {
  return (await adapter.read('schema_definitions')) as any[];
}
async function getRoutes() {
  return (await adapter.read('page_routes')) as any[];
}
async function findSchema(name: string) {
  const all = await getSchemas();
  return all.find((s: any) => s.data?.name === name || s.id === name);
}
async function findRoute(path: string) {
  const all = await getRoutes();
  return all.find((r: any) => r.data?.path === path || r.id === path);
}

function parseKV(args: string[]): Record<string, any> {
  const out: Record<string, any> = {};
  for (const a of args) {
    const eqIdx = a.indexOf('=');
    if (eqIdx === -1) continue;
    const k = a.slice(0, eqIdx);
    const v = a.slice(eqIdx + 1);
    out[k] = v === 'true' ? true : v === 'false' ? false : isNaN(Number(v)) || v === '' ? v : Number(v);
  }
  return out;
}

function autoLabel(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── LECTURA ──────────────────────────────────────────────────────────────────

async function cmdLs() {
  const [schemas, routes, scripts] = await Promise.all([
    getSchemas(),
    getRoutes(),
    adapter.read('scripts') as Promise<any[]>
  ]);

  const sf = schemas.map((s: any) => `${s.data.name}(${s.data.fields?.length ?? 0}f)`).join(' ');
  const rt = routes.map((r: any) => `${r.data.path}(${r.data.blocks?.length ?? 0}b)`).join(' ');
  const sc = (scripts as any[]).length
    ? (scripts as any[]).map((s: any) => s.data.name).join(' ')
    : 'none';

  console.log(`${belt('ESTRUCTURA')} schemas: ${sf}`);
  console.log(`${belt('ESTRUCTURA')} routes:  ${rt}`);
  console.log(`${belt('SCRIPTS')}   scripts: ${sc}`);
}

async function cmdSchema(name: string) {
  const s = await findSchema(name);
  if (!s) { console.log(`[ERROR] schema no encontrado: ${name}`); return; }

  const fields = (s.data.fields || []).map((f: any) => {
    const rel = f.config?.relation?.entity ? `→${f.config.relation.entity}` : (f.type === 'relation' ? '→?' : '');
    return `${f.key}(${f.type}${rel}${f.required ? '*' : ''})`;
  });

  console.log(`${belt('ESTRUCTURA', name)} ${fields.join('  ')}`);
}

async function cmdSchemaId(name: string) {
  const s = await findSchema(name);
  if (!s) { console.log(`[ERROR] schema no encontrado: ${name}`); return; }
  console.log(`${belt('ESTRUCTURA', name)} id: ${s.id}`);
}

async function cmdRoute(path: string) {
  const r = await findRoute(path);
  if (!r) { console.log(`[ERROR] ruta no encontrada: ${path}`); return; }

  const blocks = (r.data.blocks || []).map((b: any) =>
    `${b.type}${b.context ? `→${b.context}` : ''}`
  );
  console.log(`${belt('UI', path)} ${blocks.join('  ')}`);
}

async function cmdUi(path: string) {
  const r = await findRoute(path);
  if (!r) { console.log(`[ERROR] ruta no encontrada: ${path}`); return; }

  console.log(`${belt('UI', path)} blocks(${r.data.blocks?.length ?? 0}):`);
  for (const b of r.data.blocks || []) {
    const extras: string[] = [];
    if (b.intent) extras.push(`intent:${b.intent}`);
    if (b.segmentation_key) extras.push(`seg:${b.segmentation_key}`);
    if (b.hideSubmit) extras.push('hideSubmit');
    if (b.zap) extras.push(`zap:${b.zap}`);
    console.log(`  ${b.id.slice(0,8)}  ${b.type}→${b.context || '-'}  ${extras.join(' ')}`);
  }
}

async function cmdRecords(args: string[]) {
  const schema = args[0];
  if (!schema) { console.log('[ERROR] uso: records <schema> [limit=N] [key=val]'); return; }

  let limit = 5;
  const filters: Record<string, string> = {};
  for (const a of args.slice(1)) {
    if (a.startsWith('limit=')) limit = parseInt(a.slice(6));
    else if (a.includes('=')) { const [k, v] = a.split('='); filters[k] = v; }
  }

  const raw = (await adapter.read(schema)) as any[];
  const filtered = Object.keys(filters).length
    ? raw.filter((r: any) => Object.entries(filters).every(([k, v]) => String(r.data?.[k]) === v))
    : raw;

  const slice = filtered.slice(0, limit);
  console.log(`${belt('DATOS', schema)} total:${filtered.length} mostrando:${slice.length}`);
  for (const r of slice) {
    const preview = Object.entries(r.data || {}).slice(0, 4).map(([k, v]) => `${k}:${String(v).slice(0, 30)}`).join('  ');
    console.log(`  ${r.id.slice(0, 8)}  ${preview}`);
  }
}

async function cmdScript(name: string) {
  const scripts = (await adapter.read('scripts')) as any[];
  const s = scripts.find((x: any) => x.data.name === name);
  if (!s) { console.log(`[ERROR] script no encontrado: ${name}`); return; }
  console.log(`${belt('SCRIPTS', name)}`);
  console.log(s.data.code);
}

async function cmdScriptExport(args: string[]) {
  const name = args[0];
  const fileIdx = args.indexOf('--file');
  const filePath = fileIdx !== -1 ? args[fileIdx + 1] : undefined;
  if (!name || !filePath) { console.log('[ERROR] uso: script export <name> --file <ruta.js>'); return; }
  const scripts = (await adapter.read('scripts')) as any[];
  const s = scripts.find((x: any) => x.data?.name === name);
  if (!s) { console.log(`[ERROR] script no encontrado: ${name}`); return; }
  await fs.writeFile(filePath, s.data.code, 'utf-8');
  console.log(`${belt('SCRIPTS', name)} exportado → ${filePath} (${s.data.code.length} chars)`);
}

async function cmdScriptWrite(args: string[]) {
  const name = args[0];
  const fileIdx = args.indexOf('--file');
  const filePath = fileIdx !== -1 ? args[fileIdx + 1] : undefined;
  if (!name || !filePath) { console.log('[ERROR] uso: script write <name> --file <ruta.js>'); return; }
  const code = await fs.readFile(filePath, 'utf-8');
  const scripts = (await adapter.read('scripts')) as any[];
  const existing = scripts.find((x: any) => x.data?.name === name);
  const record = { id: existing?.id ?? crypto.randomUUID(), data: { name, code } };
  await adapter.write('scripts', record);
  console.log(`${belt('SCRIPTS', name)} guardado (${code.length} chars desde ${filePath})`);
}

// ── SCHEMA CRUD ──────────────────────────────────────────────────────────────

async function cmdCreateSchema(args: string[]) {
  // uso: create-schema <name> [field:<key>:<type>[:<label>] ...]
  const name = args[0];
  if (!name) { console.log('[ERROR] uso: create-schema <name> [field:<key>:<type>[:<label>] ...]'); return; }

  const fields = args.slice(1)
    .filter(a => a.startsWith('field:'))
    .map(f => {
      const parts = f.slice(6).split(':');
      const [key, type, ...labelParts] = parts;
      return {
        id: crypto.randomUUID(),
        key,
        type: type || 'text',
        label: labelParts.join(' ') || autoLabel(key),
        required: false,
      };
    });

  const record = { id: crypto.randomUUID(), data: { name, fields }, updated_at: new Date().toISOString() };
  const desc = `crear schema:${name} (${fields.length} campos)`;
  pending.push({ desc, run: async () => { await adapter.write('schema_definitions', record); } });
  console.log(`${belt('CAMBIO')} pendiente(${pending.length}): ${desc}`);
}

async function cmdAddField(args: string[]) {
  // uso: add-field <schema> <key> <type> [label:<label>] [required] [options:<a,b,c>]
  const [schemaName, key, type] = args;
  if (!schemaName || !key || !type) {
    console.log('[ERROR] uso: add-field <schema> <key> <type> [label:<label>] [required] [options:<a,b,c>]');
    return;
  }

  const labelArg = args.find(a => a.startsWith('label:'));
  const label = labelArg ? labelArg.slice(6) : autoLabel(key);
  const required = args.includes('required');
  const optionsArg = args.find(a => a.startsWith('options:'));
  const options = optionsArg ? optionsArg.slice(8).split(',').map(o => o.trim()) : undefined;
  const entityArg = args.find(a => a.startsWith('entity:'));
  const config = entityArg
    ? { relation: { entity: entityArg.slice(7), parentKey: 'id' } }
    : undefined;

  const field: any = { id: crypto.randomUUID(), key, type, label, required };
  if (options) field.options = options;
  if (config) field.config = config;

  const desc = `schema:${schemaName} add-field:${key}(${type})`;
  pending.push({
    desc,
    run: async () => {
      const s = await findSchema(schemaName);
      if (!s) throw new Error(`schema ${schemaName} no encontrado`);
      if (s.data.fields?.find((f: any) => f.key === key)) throw new Error(`field ${key} ya existe`);
      s.data.fields = [...(s.data.fields || []), field];
      s.updated_at = new Date().toISOString();
      await adapter.write('schema_definitions', s);
    }
  });
  console.log(`${belt('CAMBIO')} pendiente(${pending.length}): ${desc}`);
}

async function cmdRemoveField(args: string[]) {
  // uso: remove-field <schema> <key>
  const [schemaName, key] = args;
  if (!schemaName || !key) { console.log('[ERROR] uso: remove-field <schema> <key>'); return; }

  const desc = `schema:${schemaName} remove-field:${key}`;
  pending.push({
    desc,
    run: async () => {
      const s = await findSchema(schemaName);
      if (!s) throw new Error(`schema ${schemaName} no encontrado`);
      const before = s.data.fields?.length ?? 0;
      s.data.fields = (s.data.fields || []).filter((f: any) => f.key !== key);
      if (s.data.fields.length === before) throw new Error(`field ${key} no encontrado`);
      s.updated_at = new Date().toISOString();
      await adapter.write('schema_definitions', s);
    }
  });
  console.log(`${belt('CAMBIO')} pendiente(${pending.length}): ${desc}`);
}

async function cmdDeleteSchema(args: string[]) {
  // uso: delete-schema <name>
  const name = args[0];
  if (!name) { console.log('[ERROR] uso: delete-schema <name>'); return; }

  const desc = `eliminar schema:${name}`;
  pending.push({
    desc,
    run: async () => {
      const s = await findSchema(name);
      if (!s) throw new Error(`schema ${name} no encontrado`);
      await adapter.remove('schema_definitions', s.id);
    }
  });
  console.log(`${belt('CAMBIO')} pendiente(${pending.length}): ${desc}`);
}

// ── ROUTE / BLOCK CRUD ────────────────────────────────────────────────────────

async function cmdCreateRoute(args: string[]) {
  // uso: create-route <path> <title...>
  const [routePath, ...titleParts] = args;
  const title = titleParts.join(' ');
  if (!routePath || !title) { console.log('[ERROR] uso: create-route <path> <title>'); return; }

  const record = {
    id: crypto.randomUUID(),
    data: { path: routePath, title, blocks: [] },
    updated_at: new Date().toISOString()
  };
  const desc = `crear route:${routePath} "${title}"`;
  pending.push({ desc, run: async () => { await adapter.write('page_routes', record); } });
  console.log(`${belt('CAMBIO')} pendiente(${pending.length}): ${desc}`);
}

async function cmdAddBlock(args: string[]) {
  // uso: add-block <route> <type> [schema:<name>] [intent:<intent>] [zap:<name>]
  const [routePath, type] = args;
  if (!routePath || !type) {
    console.log('[ERROR] uso: add-block <route> <type> [schema:<name>] [intent:<intent>] [zap:<name>]');
    return;
  }

  const schemaArg = args.find(a => a.startsWith('schema:'));
  const schemaName = schemaArg ? schemaArg.slice(7) : undefined;
  const intentArg = args.find(a => a.startsWith('intent:'));
  const intent = intentArg ? intentArg.slice(7) : undefined;
  const zapArg = args.find(a => a.startsWith('zap:'));
  const zap = zapArg ? zapArg.slice(4) : undefined;

  const desc = `route:${routePath} add-block:${type}${schemaName ? `→${schemaName}` : ''}`;
  pending.push({
    desc,
    run: async () => {
      const r = await findRoute(routePath);
      if (!r) throw new Error(`ruta ${routePath} no encontrada`);
      const block: any = { id: crypto.randomUUID(), type, context: schemaName };
      if (intent) block.intent = intent;
      if (zap) block.zap = zap;
      r.data.blocks = [...(r.data.blocks || []), block];
      r.updated_at = new Date().toISOString();
      await adapter.write('page_routes', r);
    }
  });
  console.log(`${belt('CAMBIO')} pendiente(${pending.length}): ${desc}`);
}

async function cmdUpdateBlock(args: string[]) {
  // uso: update-block <route> <blockId> <prop> <value>
  const [routePath, blockId, prop, ...valueParts] = args;
  const value = valueParts.join(' ');
  if (!routePath || !blockId || !prop || value === undefined) {
    console.log('[ERROR] uso: update-block <route> <blockId> <prop> <value>');
    return;
  }

  const parsed = value === 'true' ? true : value === 'false' ? false : isNaN(Number(value)) || value === '' ? value : Number(value);

  const desc = `route:${routePath} block:${blockId.slice(0,8)} ${prop}→${value}`;
  pending.push({
    desc,
    run: async () => {
      const r = await findRoute(routePath);
      if (!r) throw new Error(`ruta ${routePath} no encontrada`);
      const block = (r.data.blocks || []).find((b: any) => b.id === blockId || b.id.startsWith(blockId));
      if (!block) throw new Error(`block ${blockId} no encontrado`);
      block[prop] = parsed;
      r.updated_at = new Date().toISOString();
      await adapter.write('page_routes', r);
    }
  });
  console.log(`${belt('CAMBIO')} pendiente(${pending.length}): ${desc}`);
}

async function cmdRemoveBlock(args: string[]) {
  // uso: remove-block <route> <blockId>
  const [routePath, blockId] = args;
  if (!routePath || !blockId) { console.log('[ERROR] uso: remove-block <route> <blockId>'); return; }

  const desc = `route:${routePath} remove-block:${blockId.slice(0,8)}`;
  pending.push({
    desc,
    run: async () => {
      const r = await findRoute(routePath);
      if (!r) throw new Error(`ruta ${routePath} no encontrada`);
      const before = r.data.blocks?.length ?? 0;
      r.data.blocks = (r.data.blocks || []).filter((b: any) => b.id !== blockId && !b.id.startsWith(blockId));
      if (r.data.blocks.length === before) throw new Error(`block ${blockId} no encontrado`);
      r.updated_at = new Date().toISOString();
      await adapter.write('page_routes', r);
    }
  });
  console.log(`${belt('CAMBIO')} pendiente(${pending.length}): ${desc}`);
}

async function cmdDeleteRoute(args: string[]) {
  // uso: delete-route <path>
  const routePath = args[0];
  if (!routePath) { console.log('[ERROR] uso: delete-route <path>'); return; }

  const desc = `eliminar route:${routePath}`;
  pending.push({
    desc,
    run: async () => {
      const r = await findRoute(routePath);
      if (!r) throw new Error(`ruta ${routePath} no encontrada`);
      await adapter.remove('page_routes', r.id);
    }
  });
  console.log(`${belt('CAMBIO')} pendiente(${pending.length}): ${desc}`);
}

// ── RECORD CRUD ───────────────────────────────────────────────────────────────

async function cmdCreateRecord(args: string[]) {
  // uso: create-record <schema> [key=val ...]
  const context = args[0];
  if (!context) { console.log('[ERROR] uso: create-record <schema> [key=val ...]'); return; }

  const data = parseKV(args.slice(1));
  const id = crypto.randomUUID();
  const desc = `crear record en:${context}${Object.keys(data).length ? ` (${Object.keys(data).join(', ')})` : ''}`;
  pending.push({
    desc,
    run: async () => {
      await adapter.write(context, { id, data, updated_at: new Date().toISOString() });
    }
  });
  console.log(`${belt('CAMBIO')} pendiente(${pending.length}): ${desc}`);
}

async function cmdUpdateRecord(args: string[]) {
  // uso: update-record <schema> <id> [key=val ...]
  const [context, id] = args;
  if (!context || !id) { console.log('[ERROR] uso: update-record <schema> <id> [key=val ...]'); return; }

  const patch = parseKV(args.slice(2));
  const desc = `update record:${id.slice(0,8)} en:${context} (${Object.keys(patch).join(', ')})`;
  pending.push({
    desc,
    run: async () => {
      const records = (await adapter.read(context)) as any[];
      const record = records.find((r: any) => r.id === id || r.id.startsWith(id));
      if (!record) throw new Error(`record ${id} no encontrado en ${context}`);
      record.data = { ...record.data, ...patch };
      record.updated_at = new Date().toISOString();
      await adapter.write(context, record);
    }
  });
  console.log(`${belt('CAMBIO')} pendiente(${pending.length}): ${desc}`);
}

async function cmdDeleteRecord(args: string[]) {
  // uso: delete-record <schema> <id>
  const [context, id] = args;
  if (!context || !id) { console.log('[ERROR] uso: delete-record <schema> <id>'); return; }

  const desc = `eliminar record:${id.slice(0,8)} de:${context}`;
  pending.push({
    desc,
    run: async () => {
      const records = (await adapter.read(context)) as any[];
      const record = records.find((r: any) => r.id === id || r.id.startsWith(id));
      if (!record) throw new Error(`record ${id} no encontrado en ${context}`);
      await adapter.remove(context, record.id);
    }
  });
  console.log(`${belt('CAMBIO')} pendiente(${pending.length}): ${desc}`);
}

// ── MUTACIÓN SIMPLE ───────────────────────────────────────────────────────────

async function cmdSet(args: string[]) {
  // uso: set <schema>.<field>.<prop> <valor>
  const [path, value] = args;
  if (!path || !value) { console.log('[ERROR] uso: set <schema>.<field>.<prop> <valor>'); return; }

  const parts = path.split('.');
  if (parts.length !== 3) { console.log('[ERROR] formato: schema.field.prop'); return; }
  const [schemaName, fieldKey, prop] = parts;

  const desc = `schema:${schemaName} field:${fieldKey} ${prop} → ${value}`;
  pending.push({
    desc,
    run: async () => {
      const s = await findSchema(schemaName);
      if (!s) throw new Error(`schema ${schemaName} no encontrado`);
      const field = s.data.fields?.find((f: any) => f.key === fieldKey);
      if (!field) throw new Error(`field ${fieldKey} no encontrado`);

      if (prop === 'entity') field.config = { relation: { entity: value, parentKey: 'id' } };
      else if (prop === 'required') field.required = value === 'true';
      else if (prop === 'label') field.label = value;
      else if (prop === 'type') field.type = value;
      else throw new Error(`prop desconocida: ${prop}`);

      s.updated_at = new Date().toISOString();
      await adapter.write('schema_definitions', s);
    }
  });

  console.log(`${belt('CAMBIO')} pendiente(${pending.length}): ${desc}`);
}

async function cmdCommit(force = false) {
  if (!pending.length) { console.log(`${belt('CAMBIO')} sin cambios pendientes`); return; }

  console.log(`${belt('CAMBIO')} ${pending.length} cambio(s) pendiente(s):`);
  pending.forEach((p, i) => console.log(`  ${i + 1}. ${p.desc}`));

  if (!force) {
    console.log('  → ejecutar? escribe: commit --force');
    return;
  }

  for (const p of pending) {
    try {
      await p.run();
      console.log(`  ✓ ${p.desc}`);
    } catch (e: any) {
      console.log(`  ✗ ${p.desc}  error: ${e.message}`);
    }
  }
  pending.length = 0;
}

function cmdDrop() {
  const n = pending.length;
  pending.length = 0;
  console.log(`${belt('CAMBIO')} descartados ${n} cambio(s)`);
}

async function cmdStatus() {
  console.log(`${belt('ESTRUCTURA')} pending:${pending.length}`);
  if (pending.length) pending.forEach((p, i) => console.log(`  ${i + 1}. ${p.desc}`));
}

// ── AYUDA ─────────────────────────────────────────────────────────────────────

function cmdHelp() {
  console.log(`
agno — Agnostic CLI REPL

LECTURA:
  ls                                        listar schemas, routes, scripts
  schema <name>                             inspeccionar campos de un schema
  schema id <name>                          obtener id de un schema
  route <path>                              inspeccionar bloques de una ruta
  ui <path>                                 detalle completo de bloques
  records <schema> [limit=N] [key=val]      listar registros
  script <name>                             ver código de un script

SCHEMA CRUD:
  create-schema <name> [field:<key>:<type>[:<label>] ...]
  add-field <schema> <key> <type> [label:<label>] [required] [options:<a,b,c>] [entity:<schema>]
  remove-field <schema> <key>
  delete-schema <name>
  set <schema>.<field>.<prop> <value>       prop: label|type|required|entity

ROUTE / BLOCK CRUD:
  create-route <path> <title>
  add-block <route> <type> [schema:<name>] [intent:<intent>] [zap:<name>]
  update-block <route> <blockId> <prop> <value>
  remove-block <route> <blockId>
  delete-route <path>

RECORD CRUD:
  create-record <schema> [key=val ...]
  update-record <schema> <id> [key=val ...]
  delete-record <schema> <id>

SCRIPTS:
  script write <name> --file <ruta.js>
  script export <name> --file <ruta.js>

COLA DE CAMBIOS:
  commit              previsualizar cambios pendientes
  commit --force      ejecutar cambios
  drop                descartar cola
  status              ver cola actual
`);
}

// ── DISPATCHER ───────────────────────────────────────────────────────────────

async function dispatch(line: string) {
  const [cmd, ...args] = line.trim().split(/\s+/);
  if (!cmd) return;

  switch (cmd) {
    // Lectura
    case 'ls':            return cmdLs();
    case 'schema':
      if (args[0] === 'id') return cmdSchemaId(args[1]);
      return cmdSchema(args[0]);
    case 'route':         return cmdRoute(args[0]);
    case 'ui':            return cmdUi(args[0]);
    case 'records':       return cmdRecords(args);
    case 'script':
      if (args[0] === 'write')  return cmdScriptWrite(args.slice(1));
      if (args[0] === 'export') return cmdScriptExport(args.slice(1));
      return cmdScript(args[0]);

    // Schema CRUD
    case 'create-schema': return cmdCreateSchema(args);
    case 'add-field':     return cmdAddField(args);
    case 'remove-field':  return cmdRemoveField(args);
    case 'delete-schema': return cmdDeleteSchema(args);

    // Route/Block CRUD
    case 'create-route':  return cmdCreateRoute(args);
    case 'add-block':     return cmdAddBlock(args);
    case 'update-block':  return cmdUpdateBlock(args);
    case 'remove-block':  return cmdRemoveBlock(args);
    case 'delete-route':  return cmdDeleteRoute(args);

    // Record CRUD
    case 'create-record': return cmdCreateRecord(args);
    case 'update-record': return cmdUpdateRecord(args);
    case 'delete-record': return cmdDeleteRecord(args);

    // Cola
    case 'set':           return cmdSet(args);
    case 'commit':        return cmdCommit(args[0] === '--force');
    case 'drop':          return cmdDrop();
    case 'status':        return cmdStatus();
    case 'help':          return cmdHelp();

    default:
      console.log(`[ERROR] comando desconocido: ${cmd}  (escribe 'help' para ver todos los comandos)`);
  }
}

// ── ENTRYPOINT ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.length > 0) {
  dispatch(args.join(' ')).catch(e => console.error('[FATAL]', e.message));
} else {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
  const isTTY = process.stdin.isTTY;

  if (isTTY) process.stdout.write('agno> ');

  let queue = Promise.resolve();
  rl.on('line', (line) => {
    queue = queue.then(async () => {
      if (line.trim()) await dispatch(line).catch(e => console.error('[FATAL]', e.message));
      if (isTTY) process.stdout.write('agno> ');
    });
  });

  rl.on('close', () => {
    if (pending.length) console.log(`\n${belt('CAMBIO')} ${pending.length} cambio(s) NO ejecutados. Usa commit --force.`);
  });
}
