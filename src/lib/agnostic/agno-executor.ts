/**
 * agno-executor — parser y ejecutor de comandos agno CLI con feedback real.
 *
 * Convierte strings de comandos en operaciones determinísticas sobre el adapter
 * y retorna resultados estructurados que el LLM puede leer para planear el siguiente paso.
 *
 * Nunca predice: ejecuta → observa → retorna estado real.
 */

import { SYSTEM_NS } from '@/lib/agnostic/constants';

// ── Tipos ────────────────────────────────────────────────────────────────────

interface AgnoResult {
  ok: boolean;
  error?: string;
  [key: string]: unknown;
}

// ── Catálogo de bloques — fuente de verdad para el LLM ───────────────────────
// kind=visual: params viven en block.visual → set con update-block <route> <id> visual.KEY VALUE
// kind=data:   requieren schema: que apunte a un schema existente

const BLOCK_CATALOG: Record<string, {
  kind: 'visual' | 'data';
  required?: string[];
  optional?: string[];
  intents?: string[];
  schema_required?: boolean;
  description: string;
}> = {
  hero:       { kind: 'visual', required: ['title'], optional: ['subtitle', 'image', 'cta_label', 'cta_href', 'align'], description: 'Banner principal con título, subtítulo e imagen de fondo' },
  text:       { kind: 'visual', required: ['content'], optional: ['align', 'size'], description: 'Párrafo de texto libre' },
  markdown:   { kind: 'visual', required: ['content'], optional: [], description: 'Contenido Markdown' },
  image:      { kind: 'visual', required: ['src'], optional: ['alt', 'width', 'height', 'rounded'], description: 'Imagen standalone' },
  divider:    { kind: 'visual', required: [], optional: ['spacing', 'color'], description: 'Separador horizontal' },
  spacer:     { kind: 'visual', required: [], optional: ['height'], description: 'Espacio vertical vacío' },
  faq:        { kind: 'visual', required: ['items'], optional: ['title'], description: 'Lista de preguntas frecuentes (items: JSON array)' },
  embed:      { kind: 'visual', required: ['src'], optional: ['height', 'title'], description: 'iFrame o embed externo' },
  collection: { kind: 'data', schema_required: true, description: 'Grilla/lista de registros de un schema' },
  form:       { kind: 'data', schema_required: true, intents: ['create', 'edit', 'view'], description: 'Formulario CRUD para un schema' },
  table:      { kind: 'data', schema_required: true, description: 'Tabla de datos de un schema' },
  action:     { kind: 'data', schema_required: false, description: 'Botón de acción que dispara un zap (no requiere schema)' },
  nav:        { kind: 'data', schema_required: false, description: 'Barra de navegación (no requiere schema)' },
};

interface BlockCatalogEntry {
  kind: 'visual' | 'data';
  required?: string[];
  optional?: string[];
  intents?: string[];
  schema_required?: boolean;
  description: string;
}

interface ParsedField {
  id: string;
  key: string;
  type: string;
  label: string;
  width: 'full' | 'half' | 'third';
  required: boolean;
  options?: { value: string; label: string }[];
  config?: { relation?: { entity: string } };
}

// ── Tokenizador (maneja comillas) ─────────────────────────────────────────────

function tokenize(cmd: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (const char of cmd.trim()) {
    if (inQuote) {
      if (char === quoteChar) { inQuote = false; tokens.push(current); current = ''; }
      else { current += char; }
    } else if (char === '"' || char === "'") {
      inQuote = true; quoteChar = char;
    } else if (char === ' ' || char === '\t') {
      if (current) { tokens.push(current); current = ''; }
    } else {
      current += char;
    }
  }
  if (current) tokens.push(current);
  return tokens;
}

// ── Parser de field spec: "key:type:Label con espacios" ──────────────────────

function parseFieldSpec(spec: string): ParsedField {
  const parts = spec.split(':');
  const key  = parts[0] ?? 'campo';
  const type = parts[1] ?? 'text';
  const label = parts.slice(2).join(':') || key;
  return { id: crypto.randomUUID(), key, type, label, width: 'full', required: false };
}

// ── Parser de args nombrados ──────────────────────────────────────────────────
// Maneja: schema:nav_links  intent:create  options:a,b,c  entity:clientes
// Y flags sueltos: required  --force  --json

function parseNamedArgs(tokens: string[]): Record<string, string | boolean | string[]> {
  const result: Record<string, string | boolean | string[]> = {};
  for (const token of tokens) {
    const colonIdx = token.indexOf(':');
    const eqIdx    = token.indexOf('=');
    if (token.startsWith('--')) {
      result[token.slice(2)] = true;
    } else if (colonIdx > 0 && (eqIdx < 0 || colonIdx < eqIdx)) {
      const key = token.slice(0, colonIdx);
      const val = token.slice(colonIdx + 1);
      if (key in result) {
        const existing = result[key];
        result[key] = Array.isArray(existing) ? [...existing, val] : [existing as string, val];
      } else {
        result[key] = val;
      }
    } else if (eqIdx > 0) {
      result[token.slice(0, eqIdx)] = token.slice(eqIdx + 1);
    } else if (token !== '') {
      result[token] = true; // flag sin valor, ej: "required"
    }
  }
  return result;
}

// ── Helpers de formato para salida legible ────────────────────────────────────

function fmtSchema(s: any) {
  const fields = (s.data?.fields ?? []).map((f: any) => {
    const rel = f.config?.relation?.entity ? `→${f.config.relation.entity}` : '';
    const req = f.required ? '*' : '';
    return `${f.key}:${f.type}${rel}${req}`;
  }).join(', ');
  return { name: s.data?.name, fields: fields || '(sin campos)' };
}

function fmtRoute(r: any) {
  const blocks = (r.data?.blocks ?? []).map((b: any) => ({
    id: b.id,
    type: b.type,
    context: b.context ?? null,
    position: b.position ?? null,
    intent: b.intent ?? null,
  }));
  return { path: r.data?.path, title: r.data?.title, blocks };
}

// ── observe — snapshot completo del sistema ───────────────────────────────────

export async function executeObserve(adapter: any): Promise<AgnoResult> {
  try {
    const [schemas, routes] = await Promise.all([
      adapter.read(SYSTEM_NS.SCHEMAS) as Promise<any[]>,
      adapter.read(SYSTEM_NS.ROUTES)  as Promise<any[]>,
    ]);

    // Verificación de invariante: block.context debe existir como schema
    const schemaNames = new Set(schemas.map((s: any) => s.data?.name));
    const integrity: string[] = [];
    for (const route of routes) {
      for (const block of (route.data?.blocks ?? [])) {
        if (block.context && !schemaNames.has(block.context)) {
          integrity.push(`ROTO: bloque ${block.id} (${block.type}) en ${route.data?.path} referencia schema '${block.context}' que no existe`);
        }
      }
    }

    return {
      ok: true,
      schemas: schemas.map(fmtSchema),
      routes: routes.map(fmtRoute),
      integrity: integrity.length ? integrity : ['OK — todos los bloques referencian schemas existentes'],
      hint: schemas.length === 0 && routes.length === 0
        ? 'Sistema vacío. Crea schemas primero, luego rutas, luego bloques.'
        : undefined,
    };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

// ── execute — dispatcher principal ───────────────────────────────────────────

// Verbos que modifican o eliminan datos
const DESTRUCTIVE_VERBS = new Set(['delete-schema', 'delete-route', 'remove-block', 'remove-field', 'delete-record']);
// Verbos que inician un comando válido
const KNOWN_VERBS = new Set([
  'ls', 'schema', 'route', 'records', 'validate',
  'create-schema', 'add-field', 'remove-field', 'delete-schema', 'set',
  'create-route', 'add-block', 'update-block', 'remove-block', 'delete-route',
  'create-record', 'update-record', 'delete-record', 'commit', 'drop', 'status',
]);

export async function executeAgnoCommand(cmd: string | undefined | null, adapter: any): Promise<AgnoResult> {
  if (cmd == null || typeof cmd !== 'string') return { ok: false, error: 'Comando vacío — proporciona un string de comando' };
  const trimmed = cmd.trim();
  if (!trimmed) return { ok: false, error: 'Comando vacío' };

  // Rechaza múltiples comandos encadenados en un solo string
  const firstToken = trimmed.split(/\s+/)[0].toLowerCase();
  const rest = trimmed.slice(firstToken.length).trim();
  if (rest) {
    const secondTokens = rest.split(/\s+/);
    const hasSecondVerb = secondTokens.some(t => KNOWN_VERBS.has(t.toLowerCase()));
    if (hasSecondVerb) {
      return { ok: false, error: `Multi-comando detectado: "${trimmed}". Ejecuta UN comando por llamada. Separa en llamadas distintas a execute_agno.` };
    }
  }

  const tokens = tokenize(trimmed);
  if (!tokens.length) return { ok: false, error: 'Comando vacío' };
  const verb = tokens[0].toLowerCase();

  // Rechaza wildcards en operaciones destructivas
  if (DESTRUCTIVE_VERBS.has(verb)) {
    const arg = tokens[1] ?? '';
    if (arg === '*' || arg === 'all' || arg === 'todos' || arg === 'everything') {
      return { ok: false, error: `Wildcard '${arg}' no permitido en '${verb}'. Usa observe para obtener IDs reales y ejecuta un delete por entidad.` };
    }
  }

  try {
    switch (verb) {

      // ── LECTURA ──────────────────────────────────────────────────────────

      case 'ls': {
        return executeObserve(adapter);
      }

      case 'schema': {
        const name = tokens[1];
        if (!name) return { ok: false, error: 'Uso: schema <nombre>' };
        const schemas = await adapter.read(SYSTEM_NS.SCHEMAS) as any[];
        const found = schemas.find((s: any) => s.data?.name === name);
        if (!found) return { ok: false, error: `Schema '${name}' no existe. Schemas actuales: ${schemas.map((s:any) => s.data?.name).join(', ') || 'ninguno'}` };
        return { ok: true, schema: found.data, id: found.id };
      }

      case 'route': {
        const path = tokens[1];
        if (!path) return { ok: false, error: 'Uso: route <path>' };
        const routes = await adapter.read(SYSTEM_NS.ROUTES) as any[];
        const found = routes.find((r: any) => r.data?.path === path);
        if (!found) return { ok: false, error: `Ruta '${path}' no existe` };
        return { ok: true, route: fmtRoute(found), id: found.id };
      }

      case 'records': {
        const schemaName = tokens[1];
        if (!schemaName) return { ok: false, error: 'Uso: records <schema>' };
        const args  = parseNamedArgs(tokens.slice(2));
        const limit = parseInt(args['limit'] as string ?? '10', 10);
        const records = await adapter.read(schemaName) as any[];
        return { ok: true, schema: schemaName, count: records.length, records: records.slice(0, limit).map((r: any) => ({ id: r.id, data: r.data })) };
      }

      case 'validate': {
        return executeObserve(adapter);
      }

      // ── SCHEMA CRUD ──────────────────────────────────────────────────────

      case 'create-schema': {
        const name = tokens[1];
        if (!name) return { ok: false, error: 'Uso: create-schema <nombre> [field:<key>:<type>:<label> ...]' };
        const existing = await adapter.read(SYSTEM_NS.SCHEMAS) as any[];
        if (existing.find((s: any) => s.data?.name === name)) {
          return { ok: false, error: `Schema '${name}' ya existe. Usa add-field para agregar campos.` };
        }
        const fieldTokens = tokens.slice(2).filter((t: string) => t.startsWith('field:'));
        const fields: ParsedField[] = fieldTokens.map((t: string) => parseFieldSpec(t.slice(6)));
        const record = await adapter.write(SYSTEM_NS.SCHEMAS, { data: { name, fields } });
        return {
          ok: true, action: 'schema creado', name, id: record.id, fields: fields.map((f: ParsedField) => `${f.key}:${f.type}`),
          next_steps: [
            `add-field ${name} <key> <type> [label:<Label>]  — agregar campos`,
            `add-block <ruta> collection schema:${name}  — mostrar registros en una ruta`,
            `create-record ${name} [key=val ...]  — insertar datos`,
          ],
        };
      }

      case 'add-field': {
        const [, schemaName, key, fieldType, ...rest] = tokens;
        if (!schemaName || !key || !fieldType) return { ok: false, error: 'Uso: add-field <schema> <key> <type> [label:<Label>] [required] [options:<a,b,c>] [entity:<schema>]' };
        const args = parseNamedArgs(rest);
        const schemas = await adapter.read(SYSTEM_NS.SCHEMAS) as any[];
        const schemaRec = schemas.find((s: any) => s.data?.name === schemaName);
        if (!schemaRec) return { ok: false, error: `Schema '${schemaName}' no existe` };
        if ((schemaRec.data.fields ?? []).find((f: any) => f.key === key)) {
          return { ok: false, error: `Campo '${key}' ya existe en '${schemaName}'` };
        }
        const field: ParsedField = {
          id: crypto.randomUUID(),
          key, type: fieldType,
          label: (args['label'] as string) || key,
          width: 'full',
          required: args['required'] === true,
        };
        if (fieldType === 'select' && args['options']) {
          field.options = (args['options'] as string).split(',').map((v: string) => ({ value: v.trim(), label: v.trim() }));
        }
        if (fieldType === 'relation' && args['entity']) {
          field.config = { relation: { entity: args['entity'] as string } };
        }
        const updatedFields = [...(schemaRec.data.fields ?? []), field];
        await adapter.write(SYSTEM_NS.SCHEMAS, { id: schemaRec.id, data: { ...schemaRec.data, fields: updatedFields } });
        return { ok: true, action: 'campo añadido', schema: schemaName, field: `${key}:${fieldType}`, id: field.id };
      }

      case 'remove-field': {
        const [, schemaName, key] = tokens;
        if (!schemaName || !key) return { ok: false, error: 'Uso: remove-field <schema> <key>' };
        const schemas = await adapter.read(SYSTEM_NS.SCHEMAS) as any[];
        const schemaRec = schemas.find((s: any) => s.data?.name === schemaName);
        if (!schemaRec) return { ok: false, error: `Schema '${schemaName}' no existe` };
        const updatedFields = (schemaRec.data.fields ?? []).filter((f: any) => f.key !== key);
        await adapter.write(SYSTEM_NS.SCHEMAS, { id: schemaRec.id, data: { ...schemaRec.data, fields: updatedFields } });
        return { ok: true, action: 'campo eliminado', schema: schemaName, key };
      }

      case 'delete-schema': {
        const name = tokens[1];
        if (!name) return { ok: false, error: 'Uso: delete-schema <nombre>' };
        const schemas = await adapter.read(SYSTEM_NS.SCHEMAS) as any[];
        const found = schemas.find((s: any) => s.data?.name === name);
        if (!found) return { ok: false, error: `Schema '${name}' no existe` };
        await adapter.remove(SYSTEM_NS.SCHEMAS, found.id);
        return { ok: true, action: 'schema eliminado', name };
      }

      case 'set': {
        // set <schema>.<field>.<prop> <value>
        const dotPath = tokens[1];
        const value   = tokens.slice(2).join(' ');
        if (!dotPath || !value) return { ok: false, error: 'Uso: set <schema>.<campo>.<prop> <valor>' };
        const parts = dotPath.split('.');
        if (parts.length < 3) return { ok: false, error: 'Formato: set schema.campo.prop valor  (ej: set clientes.nombre.label "Nombre completo")' };
        const [schemaName, fieldKey, prop] = parts;
        const schemas = await adapter.read(SYSTEM_NS.SCHEMAS) as any[];
        const schemaRec = schemas.find((s: any) => s.data?.name === schemaName);
        if (!schemaRec) return { ok: false, error: `Schema '${schemaName}' no existe` };
        const fields = (schemaRec.data.fields ?? []).map((f: any) => {
          if (f.key !== fieldKey) return f;
          const updated = { ...f };
          if (prop === 'required') updated.required = value === 'true';
          else if (prop === 'options') updated.options = value.split(',').map((v: string) => ({ value: v.trim(), label: v.trim() }));
          else updated[prop] = value;
          return updated;
        });
        await adapter.write(SYSTEM_NS.SCHEMAS, { id: schemaRec.id, data: { ...schemaRec.data, fields } });
        return { ok: true, action: 'campo actualizado', path: dotPath, value };
      }

      // ── ROUTE / BLOCK CRUD ───────────────────────────────────────────────

      case 'create-route': {
        const path  = tokens[1];
        const title = tokens.slice(2).join(' ');
        if (!path) return { ok: false, error: 'Uso: create-route <path> <título>' };
        const routes = await adapter.read(SYSTEM_NS.ROUTES) as any[];
        if (routes.find((r: any) => r.data?.path === path)) {
          return { ok: false, error: `Ruta '${path}' ya existe` };
        }
        const record = await adapter.write(SYSTEM_NS.ROUTES, { data: { path, title: title || path, blocks: [] } });
        return {
          ok: true, action: 'ruta creada', path, title, id: record.id,
          next_steps: [
            `add-block ${path} hero  — bloque visual (luego: update-block ${path} <id> visual.title "...")`,
            `add-block ${path} collection schema:<nombre>  — bloque de datos`,
          ],
        };
      }

      case 'add-block': {
        const routePath = tokens[1];
        const blockType = tokens[2];
        if (!routePath || !blockType) return { ok: false, error: 'Uso: add-block <ruta> <tipo> [schema:<nombre>] [intent:create|edit|view] [zap:<nombre>] [position:<valor>]' };

        // Reject before any I/O if type is unknown
        if (!BLOCK_CATALOG[blockType]) {
          return {
            ok: false,
            error: `Tipo de bloque '${blockType}' no existe.`,
            valid_visual_blocks: Object.entries(BLOCK_CATALOG).filter(([, v]) => v.kind === 'visual').map(([k]) => k),
            valid_data_blocks:   Object.entries(BLOCK_CATALOG).filter(([, v]) => v.kind === 'data').map(([k]) => k),
          };
        }

        const INVALID_PARAMS = ['title', 'subtitle', 'content', 'image', 'href', 'text'];
        const args = parseNamedArgs(tokens.slice(3));
        const invalid = INVALID_PARAMS.filter(p => p in args);
        if (invalid.length) {
          return { ok: false, error: `Parámetros inválidos para add-block: ${invalid.join(', ')}. Los params de contenido se setean después con: update-block ${routePath} <id> visual.KEY VALUE` };
        }
        const routes = await adapter.read(SYSTEM_NS.ROUTES) as any[];
        const routeRec = routes.find((r: any) => r.data?.path === routePath);
        if (!routeRec) return { ok: false, error: `Ruta '${routePath}' no existe. Crea la ruta primero con create-route.` };
        const schemaRef = args['schema'] as string | undefined;
        if (schemaRef) {
          const schemas = await adapter.read(SYSTEM_NS.SCHEMAS) as any[];
          if (!schemas.find((s: any) => s.data?.name === schemaRef)) {
            return { ok: false, error: `Schema '${schemaRef}' no existe. El invariante block.context === schema.name requiere que el schema exista primero.` };
          }
        }
        const blockId = crypto.randomUUID();
        const block: Record<string, unknown> = {
          id: blockId,
          type: blockType,
          ...(schemaRef ? { schema_id: schemaRef, context: schemaRef } : {}),
          ...(args['intent']   ? { intent: args['intent'] } : {}),
          ...(args['zap']      ? { zap: args['zap'] } : {}),
          ...(args['position'] ? { position: args['position'] } : {}),
        };
        const updatedBlocks = [...(routeRec.data.blocks ?? []), block];
        await adapter.write(SYSTEM_NS.ROUTES, { id: routeRec.id, data: { ...routeRec.data, blocks: updatedBlocks } });

        // ── Interfacic feedback — el LLM puede planear el siguiente paso ────
        const catalog: BlockCatalogEntry = BLOCK_CATALOG[blockType];
        const warnings: string[] = [];
        const next_steps: string[] = [];

        if (catalog.kind === 'visual') {
          if ((catalog.required ?? []).length > 0) {
            warnings.push(`bloque visual sin params — renderizará vacío. Configura: ${catalog.required!.join(', ')}`);
            catalog.required!.forEach(p => next_steps.push(`update-block ${routePath} ${blockId} visual.${p} "valor"`));
          }
          return {
            ok: true, action: 'bloque añadido', blockId, type: blockType, route: routePath,
            block_kind: 'visual',
            description: catalog.description,
            warnings,
            required_visual_params: catalog.required ?? [],
            optional_visual_params: catalog.optional ?? [],
            set_visual_syntax: `update-block ${routePath} ${blockId} visual.PARAM valor`,
            next_steps,
          };
        }

        // data block
        if (catalog.schema_required && !schemaRef) {
          warnings.push(`bloque '${blockType}' sin schema — no tendrá datos. Fija con: update-block ${routePath} ${blockId} context <schema_name>`);
          next_steps.push(`update-block ${routePath} ${blockId} context <schema_name>`);
        }
        if (catalog.intents && !args['intent']) {
          warnings.push(`intent no especificado — usará 'list' por defecto. Opciones: ${catalog.intents.join(', ')}`);
        }
        if (schemaRef) {
          next_steps.push(`create-record ${schemaRef} [key=val ...]  — añadir datos visibles en el bloque`);
        }
        return {
          ok: true, action: 'bloque añadido', blockId, type: blockType, route: routePath, context: schemaRef ?? null,
          block_kind: 'data',
          description: catalog.description,
          warnings,
          available_intents: catalog.intents ?? [],
          next_steps,
        };
      }

      case 'update-block': {
        const routePath = tokens[1];
        const blockId   = tokens[2];
        const prop      = tokens[3];
        const value     = tokens.slice(4).join(' ');
        if (!routePath || !blockId || !prop) return { ok: false, error: 'Uso: update-block <ruta> <blockId> <prop> <valor>\n  Para params visuales: update-block <ruta> <id> visual.KEY valor' };
        const routes = await adapter.read(SYSTEM_NS.ROUTES) as any[];
        const routeRec = routes.find((r: any) => r.data?.path === routePath);
        if (!routeRec) return { ok: false, error: `Ruta '${routePath}' no existe` };
        const blocks = routeRec.data.blocks ?? [];
        const blockIdx = blocks.findIndex((b: any) => b.id === blockId);
        if (blockIdx < 0) {
          const ids = blocks.map((b: any) => `${b.id} (${b.type})`).join(', ');
          return { ok: false, error: `Bloque '${blockId}' no encontrado en '${routePath}'. Bloques existentes: ${ids || 'ninguno'}` };
        }
        const updatedBlock = { ...blocks[blockIdx] };

        // Dot-notation: visual.title → block.visual.title (merged, not replaced)
        const dotIdx = prop.indexOf('.');
        if (dotIdx > 0) {
          const ns = prop.slice(0, dotIdx) as 'visual' | 'config' | 'behavior';
          const subKey = prop.slice(dotIdx + 1);
          const existing = (updatedBlock[ns] as Record<string, unknown>) ?? {};
          updatedBlock[ns] = { ...existing, [subKey]: value };
        } else {
          updatedBlock[prop] = value;
          if (prop === 'schema' || prop === 'context') {
            updatedBlock['schema_id'] = value;
            updatedBlock['context']   = value;
          }
        }

        const updatedBlocks = blocks.map((b: any, i: number) => i === blockIdx ? updatedBlock : b);
        await adapter.write(SYSTEM_NS.ROUTES, { id: routeRec.id, data: { ...routeRec.data, blocks: updatedBlocks } });

        // Return current visual state so LLM can see what's set vs missing
        const catalogEntry: BlockCatalogEntry | undefined = BLOCK_CATALOG[updatedBlock.type as string];
        const visualState = updatedBlock['visual'] as Record<string, unknown> ?? {};
        const stillMissing = catalogEntry?.kind === 'visual' && catalogEntry.required
          ? catalogEntry.required.filter(p => !visualState[p])
          : [];

        return {
          ok: true, action: 'bloque actualizado', blockId, prop, value,
          visual_state: catalogEntry?.kind === 'visual' ? visualState : undefined,
          still_missing: stillMissing.length ? stillMissing : undefined,
        };
      }

      case 'remove-block': {
        const [, routePath, blockId] = tokens;
        if (!routePath || !blockId) return { ok: false, error: 'Uso: remove-block <ruta> <blockId>' };
        const routes = await adapter.read(SYSTEM_NS.ROUTES) as any[];
        const routeRec = routes.find((r: any) => r.data?.path === routePath);
        if (!routeRec) return { ok: false, error: `Ruta '${routePath}' no existe` };
        const updatedBlocks = (routeRec.data.blocks ?? []).filter((b: any) => b.id !== blockId);
        await adapter.write(SYSTEM_NS.ROUTES, { id: routeRec.id, data: { ...routeRec.data, blocks: updatedBlocks } });
        return { ok: true, action: 'bloque eliminado', blockId, route: routePath };
      }

      case 'delete-route': {
        const path = tokens[1];
        if (!path) return { ok: false, error: 'Uso: delete-route <path>' };
        const routes = await adapter.read(SYSTEM_NS.ROUTES) as any[];
        const found = routes.find((r: any) => r.data?.path === path);
        if (!found) return { ok: false, error: `Ruta '${path}' no existe` };
        await adapter.remove(SYSTEM_NS.ROUTES, found.id);
        return { ok: true, action: 'ruta eliminada', path };
      }

      // ── RECORD CRUD ──────────────────────────────────────────────────────

      case 'create-record': {
        const schemaName = tokens[1];
        if (!schemaName) return { ok: false, error: 'Uso: create-record <schema> [key=val ...]' };
        const args = parseNamedArgs(tokens.slice(2));
        const data = Object.fromEntries(Object.entries(args).filter(([, v]) => typeof v === 'string'));
        const record = await adapter.write(schemaName, { data });
        return { ok: true, action: 'registro creado', schema: schemaName, id: record.id, data };
      }

      case 'update-record': {
        const [, schemaName, id, ...rest] = tokens;
        if (!schemaName || !id) return { ok: false, error: 'Uso: update-record <schema> <id> [key=val ...]' };
        const records = await adapter.read(schemaName) as any[];
        const existing = records.find((r: any) => r.id === id);
        if (!existing) return { ok: false, error: `Registro '${id}' no encontrado en '${schemaName}'` };
        const args = parseNamedArgs(rest);
        const patchData = Object.fromEntries(Object.entries(args).filter(([, v]) => typeof v === 'string'));
        await adapter.write(schemaName, { id, data: { ...existing.data, ...patchData } });
        return { ok: true, action: 'registro actualizado', schema: schemaName, id, patch: patchData };
      }

      case 'delete-record': {
        const [, schemaName, id] = tokens;
        if (!schemaName || !id) return { ok: false, error: 'Uso: delete-record <schema> <id>' };
        await adapter.remove(schemaName, id);
        return { ok: true, action: 'registro eliminado', schema: schemaName, id };
      }

      // ── COLA (escrituras son inmediatas — commit es no-op) ────────────────

      case 'commit':
      case 'drop':
      case 'status':
        return { ok: true, action: `${verb}: las escrituras son inmediatas en este sistema, no hay cola pendiente.` };

      default:
        return {
          ok: false,
          error: `Comando desconocido: '${verb}'. Comandos válidos: ls, schema, route, records, validate, create-schema, add-field, remove-field, delete-schema, set, create-route, add-block, update-block, remove-block, delete-route, create-record, update-record, delete-record, commit`,
        };
    }
  } catch (err: any) {
    return { ok: false, error: `Error interno: ${err.message}` };
  }
}
