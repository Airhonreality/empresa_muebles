/**
 * agno — Agnostic CLI / MCP de interfaz
 *
 * Uso:
 *   npx tsx scripts/agno.ts <cmd> [args]      ← one-shot
 *   echo -e "context\nblock-types" | npx tsx scripts/agno.ts  ← pipe
 *   npx tsx scripts/agno.ts                   ← REPL interactivo
 *
 * CAPAS (ver AGNO_MCP_PLAN.md para diseño completo):
 *   0 — INTROSPECCIÓN   context, block-types, block-schema, list-navs
 *   1 — LECTURA         ls, schema, route, ui, records, script, validate
 *   2 — COMPOSICIÓN*    add-block, add-child, set-visual, get-block,
 *                       list-children, remove-block, remove-child, update-block
 *   3 — SEMÁNTICOS*     create-nav, create-columns, create-page, scaffold
 *   4 — SCHEMA (staged) create-schema, add-field, remove-field, delete-schema
 *   5 — DATOS (staged)  create-record, update-record, delete-record
 *   6 — COLA            commit [--force], drop, status
 *
 * (*) Composición y semánticos se aplican INMEDIATAMENTE — no requieren commit.
 *     Datos y schema son staged para revisión humana antes de escribir.
 */

import { getStrategy } from '../src/server/getStrategy';
import readline from 'readline';
import crypto   from 'crypto';
import fs       from 'fs/promises';
import path     from 'path';

const LOG_FILE = path.join(process.cwd(), '.agno-log.jsonl');

const _rawAdapter = getStrategy();

// Proxy that intercepts writes and fires appendAgnoLog after the fact.
// appendAgnoLog is defined later in this file — hoisting is safe because
// it is only called at runtime, not at module evaluation time.
const adapter = new Proxy(_rawAdapter, {
  get(target: any, prop: string) {
    if (prop !== 'write' && prop !== 'remove') return target[prop];
    return async (...args: any[]) => {
      const result = await (target[prop] as Function)(...args);
      const ns      = args[0] as string;
      const payload = args[1];
      if (prop === 'write') {
        const d    = payload?.data ?? {};
        const hint = d.name ?? d.title ?? d.path ?? payload?.id ?? '';
        appendAgnoLog('write', ns, `${ns} › ${String(hint).slice(0, 60)}`, payload?.id);
      } else {
        appendAgnoLog('remove', ns, `${ns} › ${String(args[1] ?? '').slice(0, 8)}`);
      }
      return result;
    };
  },
});

// ── BLOCK CATALOG ─────────────────────────────────────────────────────────────
// Fuente de verdad del CLI. Mantener sincronizado con src/lib/agnostic/Registry.ts.
// Al añadir un nuevo block type: 1) registrar en init.ts  2) añadir entrada aquí.

interface BlockParam {
  key:      string;
  type:     'string' | 'number' | 'boolean' | 'select';
  options?: string[];
  default?: string | number | boolean;
  desc:     string;
}

interface BlockEntry {
  category:     'layout' | 'data' | 'content';
  description:  string;
  hasChildren:  boolean;   // acepta blocks[]
  needsContext: boolean;   // requiere context:<schema>
  params:       BlockParam[];
  example:      string;
}

const BLOCK_CATALOG: Record<string, BlockEntry> = {

  // ── LAYOUT ──────────────────────────────────────────────────────────────────
  navbar: {
    category: 'layout', hasChildren: false, needsContext: false,
    description: 'Barra de navegación sticky con links y brand',
    params: [
      { key: 'nav_id', type: 'string', desc: 'Nombre del registro en app_navbars (crear con create-nav)' },
      { key: 'brand',  type: 'string', desc: 'Label del brand (requiere brand_path)' },
      { key: 'brand_path', type: 'string', default: '/', desc: 'URL del brand' },
    ],
    example: 'add-block <ruta> navbar visual:nav_id=main',
  },

  columns: {
    category: 'layout', hasChildren: true, needsContext: false,
    description: 'Grid de N columnas. Acepta bloques hijos con add-child.',
    params: [
      { key: 'cols', type: 'number', default: 2, desc: 'Número de columnas (1-4)' },
      { key: 'gap',  type: 'number', default: 6, desc: 'Separación entre columnas × 0.25rem' },
    ],
    example: 'add-block <ruta> columns visual:cols=2 visual:gap=8',
  },

  frame: {
    category: 'layout', hasChildren: true, needsContext: false,
    description: 'Contenedor con autolayout, padding, fondo y bordes. Acepta hijos.',
    params: [
      { key: 'direction',    type: 'select', options: ['vertical','horizontal','wrap'], default: 'vertical', desc: 'Flujo de hijos' },
      { key: 'sizing',       type: 'select', options: ['fill','hug'], default: 'hug', desc: 'Ancho del frame' },
      { key: 'min_height',   type: 'number', desc: 'Altura mínima en rem' },
      { key: 'padding_top',    type: 'number', default: 0, desc: 'Padding superior' },
      { key: 'padding_right',  type: 'number', default: 0, desc: 'Padding derecho' },
      { key: 'padding_bottom', type: 'number', default: 0, desc: 'Padding inferior' },
      { key: 'padding_left',   type: 'number', default: 0, desc: 'Padding izquierdo' },
      { key: 'fill_type',    type: 'select', options: ['color','image','gradient','none'], default: 'none', desc: 'Tipo de fondo' },
      { key: 'fill_color',   type: 'string', desc: 'Color de fondo. Ej: hsl(var(--primary)) o #fff' },
      { key: 'fill_src',     type: 'string', desc: 'URL de imagen de fondo (cuando fill_type=image)' },
      { key: 'fill_fit',     type: 'select', options: ['cover','contain'], default: 'cover', desc: 'Ajuste de imagen de fondo' },
      { key: 'border_radius', type: 'number', default: 0, desc: 'Radio de borde en rem' },
      { key: 'text_color',   type: 'string', desc: 'Color de texto heredado. Ej: hsl(var(--foreground))' },
    ],
    example: 'add-block <ruta> frame visual:direction=vertical visual:padding_top=4 visual:padding_right=6',
  },

  tabs: {
    category: 'layout', hasChildren: true, needsContext: false,
    description: 'Pestañas navegables. Cada hijo es el contenido de una pestaña.',
    params: [
      { key: 'default_tab', type: 'string', desc: 'ID o label de la pestaña activa por defecto' },
    ],
    example: 'add-block <ruta> tabs visual:default_tab=primera',
  },

  nav: {
    category: 'layout', hasChildren: false, needsContext: true,
    description: 'Navegación data-driven desde cualquier schema/entidad.',
    params: [
      { key: 'label_field', type: 'string', desc: 'Campo del schema para el label del link' },
      { key: 'path_field',  type: 'string', desc: 'Campo del schema para la URL del link' },
      { key: 'icon_field',  type: 'string', desc: 'Campo del schema para el icono (lucide)' },
    ],
    example: 'add-block <ruta> nav context:menu_items visual:label_field=titulo visual:path_field=url',
  },

  embed: {
    category: 'layout', hasChildren: false, needsContext: false,
    description: 'Renderiza todos los bloques de otra ruta inline.',
    params: [
      { key: 'route', type: 'string', desc: 'Path de la ruta a embeber. Ej: /shared/header' },
    ],
    example: 'add-block <ruta> embed visual:route=/shared/footer',
  },

  // ── DATA ────────────────────────────────────────────────────────────────────
  form: {
    category: 'data', hasChildren: false, needsContext: true,
    description: 'Formulario agnostic vinculado a un schema.',
    params: [
      { key: 'intent', type: 'select', options: ['create','edit'], default: 'create', desc: 'Intención: crear o editar registros' },
    ],
    example: 'add-block <ruta> form context:clientes intent:create',
  },

  collection: {
    category: 'data', hasChildren: false, needsContext: true,
    description: 'Lista / tabla / grid de registros de un schema.',
    params: [
      { key: 'view',  type: 'select', options: ['table','grid','kanban'], default: 'table', desc: 'Modo de visualización' },
      { key: 'limit', type: 'number', default: 20, desc: 'Registros por página' },
    ],
    example: 'add-block <ruta> collection context:productos visual:view=grid visual:limit=12',
  },

  table: {
    category: 'data', hasChildren: false, needsContext: true,
    description: 'Alias de collection con vista tabla forzada.',
    params: [
      { key: 'limit', type: 'number', default: 20, desc: 'Registros por página' },
    ],
    example: 'add-block <ruta> table context:clientes visual:limit=50',
  },

  action: {
    category: 'data', hasChildren: false, needsContext: true,
    description: 'Botón de acción que ejecuta un script (zap) o abre formulario.',
    params: [
      { key: 'label', type: 'string', default: 'Ejecutar', desc: 'Texto del botón' },
    ],
    example: 'add-block <ruta> action context:cotizaciones zap:exportar_pdf visual:label="Exportar PDF"',
  },

  // ── CONTENT ─────────────────────────────────────────────────────────────────
  text: {
    category: 'content', hasChildren: false, needsContext: false,
    description: 'Bloque de texto con variante tipográfica.',
    params: [
      { key: 'content', type: 'string', desc: 'El texto a mostrar' },
      { key: 'variant', type: 'select', options: ['h1','h2','h3','body','caption','label','quote'], default: 'body', desc: 'Variante tipográfica' },
      { key: 'align',   type: 'select', options: ['left','center','right'], default: 'left', desc: 'Alineación' },
    ],
    example: 'add-block <ruta> text visual:content="Bienvenido" visual:variant=h1 visual:align=center',
  },

  hero: {
    category: 'content', hasChildren: false, needsContext: false,
    description: 'Sección hero con título, subtítulo y CTA.',
    params: [
      { key: 'title',    type: 'string', desc: 'Título principal del hero' },
      { key: 'subtitle', type: 'string', desc: 'Subtítulo o descripción' },
      { key: 'align',    type: 'select', options: ['left','center','right'], default: 'center', desc: 'Alineación del contenido' },
    ],
    example: 'add-block <ruta> hero visual:title="Tu plataforma" visual:subtitle="Rápida y flexible" visual:align=center',
  },

  image: {
    category: 'content', hasChildren: false, needsContext: false,
    description: 'Imagen con control de aspecto y ajuste.',
    params: [
      { key: 'src',     type: 'string', desc: 'URL o path. Ej: /api/assets/foto.jpg' },
      { key: 'alt',     type: 'string', desc: 'Texto alternativo (accesibilidad)' },
      { key: 'fit',     type: 'select', options: ['cover','contain'], default: 'cover', desc: 'Ajuste de imagen' },
      { key: 'aspect',  type: 'select', options: ['video','square','portrait','auto'], default: 'video', desc: 'Relación de aspecto' },
      { key: 'rounded', type: 'boolean', default: false, desc: 'Bordes redondeados' },
    ],
    example: 'add-block <ruta> image visual:src=/api/assets/foto.jpg visual:fit=cover visual:aspect=square',
  },

  markdown: {
    category: 'content', hasChildren: false, needsContext: false,
    description: 'Renderiza contenido Markdown.',
    params: [
      { key: 'content', type: 'string', desc: 'Texto en formato Markdown' },
    ],
    example: 'add-block <ruta> markdown visual:content="## Título\\n\\nContenido..."',
  },

  faq: {
    category: 'content', hasChildren: false, needsContext: false,
    description: 'Sección de preguntas frecuentes (acordeón).',
    params: [
      { key: 'items', type: 'string', desc: 'Array de preguntas/respuestas (configurar vía designer)' },
    ],
    example: 'add-block <ruta> faq',
  },

  divider: {
    category: 'content', hasChildren: false, needsContext: false,
    description: 'Línea divisoria horizontal.',
    params: [],
    example: 'add-block <ruta> divider',
  },

  spacer: {
    category: 'content', hasChildren: false, needsContext: false,
    description: 'Espacio vertical configurable.',
    params: [
      { key: 'size', type: 'number', default: 4, desc: 'Altura en rem' },
    ],
    example: 'add-block <ruta> spacer visual:size=8',
  },

  field: {
    category: 'content', hasChildren: false, needsContext: true,
    description: 'Muestra el valor de un campo de un registro.',
    params: [
      { key: 'field_key', type: 'string', desc: 'Clave del campo del schema a mostrar' },
    ],
    example: 'add-block <ruta> field context:productos visual:field_key=nombre',
  },
};

// ── ACTIVITY LOG ─────────────────────────────────────────────────────────────

async function appendAgnoLog(action: string, ns: string, summary: string, id?: string) {
  try {
    const entry = { ts: new Date().toISOString(), src: 'agno', action, ns, ...(id ? { id } : {}), summary };
    const line  = JSON.stringify(entry) + '\n';
    let existing = '';
    try { existing = await fs.readFile(LOG_FILE, 'utf-8'); } catch { /* first entry */ }
    const lines = existing.split('\n').filter(Boolean);
    if (lines.length >= 500) lines.splice(0, lines.length - 499);
    lines.push(line.trimEnd());
    await fs.writeFile(LOG_FILE, lines.join('\n') + '\n', 'utf-8');
  } catch { /* silent */ }
}

async function cmdLog(args: string[]) {
  const limitArg = args.find(a => /^\d+$/.test(a));
  const limit    = limitArg ? parseInt(limitArg) : 40;
  const nsFilter = args.find(a => a.startsWith('ns='))?.slice(3);
  const srcFilter = args.find(a => a.startsWith('src='))?.slice(4);

  let raw = '';
  try { raw = await fs.readFile(LOG_FILE, 'utf-8'); } catch {
    console.log('[LOG] .agno-log.jsonl vacío o no existe aún.');
    return;
  }

  let entries = raw.split('\n').filter(Boolean).map(l => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean).reverse();

  if (nsFilter)  entries = entries.filter((e: any) => e.ns  === nsFilter);
  if (srcFilter) entries = entries.filter((e: any) => e.src === srcFilter);
  entries = entries.slice(0, limit);

  if (!entries.length) { console.log('[LOG] Sin entradas que coincidan.'); return; }

  console.log(`[LOG] últimas ${entries.length} entradas${nsFilter ? ` ns:${nsFilter}` : ''}${srcFilter ? ` src:${srcFilter}` : ''}\n`);
  for (const e of entries) {
    const time = new Date(e.ts).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const src  = (e.src === 'vault' ? '🌐' : '⌨ ').padEnd(2);
    const act  = e.action.padEnd(10).slice(0, 10);
    const id   = e.id ? `  ${e.id.slice(0, 8)}` : '';
    console.log(`  ${time}  ${src}  ${act}  ${e.summary}${id}`);
  }
}

// ── ESTADO ────────────────────────────────────────────────────────────────────

// Solo operaciones schema/datos van a la cola.
// Las de composición de bloques se aplican de inmediato.
const pending: Array<{ desc: string; run: () => Promise<void> }> = [];

function belt(layer: string, focus?: string) {
  return focus ? `[${layer} · ${focus}]` : `[${layer}]`;
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

async function getSchemas() { return (await adapter.read('schema_definitions')) as any[]; }
async function getRoutes()  { return (await adapter.read('page_routes'))         as any[]; }

async function findSchema(name: string) {
  const all = await getSchemas();
  return all.find((s: any) => s.data?.name === name || s.id === name);
}
async function findRoute(path: string) {
  const all = await getRoutes();
  return all.find((r: any) => r.data?.path === path || r.id === path);
}

// Búsqueda recursiva a través de blocks[]
function findBlockDeep(blocks: any[], idPrefix: string): any | null {
  for (const b of blocks) {
    if (b.id === idPrefix || b.id.startsWith(idPrefix)) return b;
    const found = b.blocks?.length ? findBlockDeep(b.blocks, idPrefix) : null;
    if (found) return found;
  }
  return null;
}

// Cuenta bloques recursivamente incluyendo hijos
function countBlocks(blocks: any[]): number {
  if (!blocks?.length) return 0;
  return blocks.reduce((n: number, b: any) => n + 1 + countBlocks(b.blocks ?? []), 0);
}

// Parsea args con prefijo visual:key=val
function parseVisualArgs(args: string[]): Record<string, any> {
  const visual: Record<string, any> = {};
  for (const a of args) {
    if (!a.startsWith('visual:')) continue;
    const kv = a.slice(7);
    const eq = kv.indexOf('=');
    if (eq === -1) continue;
    const k = kv.slice(0, eq);
    const v = kv.slice(eq + 1);
    visual[k] = v === 'true' ? true : v === 'false' ? false : (!isNaN(Number(v)) && v !== '') ? Number(v) : v;
  }
  return visual;
}

// Parsea args key=val (sin prefijo)
function parseKV(args: string[]): Record<string, any> {
  const out: Record<string, any> = {};
  for (const a of args) {
    const eq = a.indexOf('=');
    if (eq === -1) continue;
    const k = a.slice(0, eq);
    const v = a.slice(eq + 1);
    out[k] = v === 'true' ? true : v === 'false' ? false : (!isNaN(Number(v)) && v !== '') ? Number(v) : v;
  }
  return out;
}

function autoLabel(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function fmtVisual(visual: Record<string, any> | undefined, limit = 4): string {
  if (!visual || !Object.keys(visual).length) return '';
  const entries = Object.entries(visual).slice(0, limit)
    .map(([k, v]) => `${k}:${String(v).slice(0, 24)}`);
  const more = Object.keys(visual).length > limit ? ` +${Object.keys(visual).length - limit}` : '';
  return `  visual:{${entries.join(' ')}${more}}`;
}

// Imprime árbol de bloques con indentación
function printBlockTree(blocks: any[], depth = 0) {
  const indent = '  '.repeat(depth + 1);
  for (const b of blocks) {
    const extras: string[] = [];
    if (b.intent)           extras.push(`intent:${b.intent}`);
    if (b.zap)              extras.push(`zap:${b.zap}`);
    if (b.blocks?.length)   extras.push(`[${b.blocks.length}↓]`);

    const ctx = b.context ? `→${b.context}` : '';
    const vs  = fmtVisual(b.visual);
    console.log(`${indent}${b.id.slice(0,8)}  ${b.type}${ctx}${vs}  ${extras.join(' ')}`);

    if (b.blocks?.length) printBlockTree(b.blocks, depth + 1);
  }
}

// ── V3 NODE HELPERS ───────────────────────────────────────────────────────────

function makeV3Node(type: string, opts: {
  context?: string; intent?: string; zap?: string; visual?: Record<string, any>;
}): any {
  const id = crypto.randomUUID();
  const { context, intent, zap, visual = {} } = opts;

  switch (type) {
    case 'frame': {
      const style: Record<string, any> = { display: 'flex', flexDirection: 'column' };
      if (visual.direction === 'horizontal') style.flexDirection = 'row';
      if (visual.direction === 'wrap') { style.flexDirection = 'row'; style.flexWrap = 'wrap'; }
      if (visual.padding_top    !== undefined) style.paddingTop    = `${visual.padding_top}rem`;
      if (visual.padding_right  !== undefined) style.paddingRight  = `${visual.padding_right}rem`;
      if (visual.padding_bottom !== undefined) style.paddingBottom = `${visual.padding_bottom}rem`;
      if (visual.padding_left   !== undefined) style.paddingLeft   = `${visual.padding_left}rem`;
      if (visual.border_radius  !== undefined) style.borderRadius  = `${visual.border_radius}rem`;
      if (visual.fill_color)    style.backgroundColor = visual.fill_color;
      if (visual.text_color)    style.color = visual.text_color;
      if (visual.min_height !== undefined) style.minHeight = `${visual.min_height}rem`;
      if (visual.sizing === 'fill') style.width = '100%';
      return { id, kind: 'frame', label: 'frame', style, children: [] };
    }
    case 'columns': {
      const cols = visual.cols ?? 2;
      const gap  = (visual.gap ?? 6) * 0.25;
      return { id, kind: 'frame', label: 'columns', style: { display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: `${gap}rem` }, children: [] };
    }
    case 'text': {
      const style: Record<string, any> = {};
      if (visual.align) style.textAlign = visual.align;
      return { id, kind: 'text', label: visual.variant ?? 'body', content: visual.content ?? '', style, children: [] };
    }
    case 'form': {
      return { id, kind: 'preset', label: 'form', variant: 'form', config: { source: context ?? '', intent: intent ?? 'create' }, style: {}, children: [] };
    }
    case 'collection':
    case 'table': {
      return { id, kind: 'preset', label: type, variant: 'table', config: { source: context ?? '', view: visual.view ?? 'table', limit: visual.limit ?? 20 }, style: {}, children: [] };
    }
    case 'field': {
      return { id, kind: 'atom', label: visual.field_key ?? 'field', field: visual.field_key ?? '', format: 'text', style: {}, children: [] };
    }
    default: {
      // navbar, hero, image, markdown, action, tabs, embed, nav, faq, divider, spacer → preset
      const config: Record<string, any> = { ...visual };
      if (context) config.source = context;
      if (zap)     config.zap    = zap;
      if (intent)  config.intent = intent;
      return { id, kind: 'preset', label: type, variant: type, config, style: {}, children: [] };
    }
  }
}

function makeRootFrame(children: any[] = []): any {
  return { id: crypto.randomUUID(), kind: 'frame', label: 'root', style: {}, children };
}

function findNodeDeep(children: any[], idPrefix: string): any | null {
  for (const n of children) {
    if (n.id === idPrefix || n.id.startsWith(idPrefix)) return n;
    const found = n.children?.length ? findNodeDeep(n.children, idPrefix) : null;
    if (found) return found;
  }
  return null;
}

function countNodes(node: any): number {
  if (!node) return 0;
  return (node.children ?? []).reduce((s: number, c: any) => s + 1 + countNodes(c), 0);
}

function printNodeTree(node: any, depth = 0) {
  const indent = '  '.repeat(depth + 1);
  const extras: string[] = [];
  if (node.config?.source) extras.push(`→${node.config.source}`);
  if (node.source)         extras.push(`src:${node.source}`);
  if (node.variant)        extras.push(`variant:${node.variant}`);
  if (node.field)          extras.push(`field:${node.field}`);
  if (node.content !== undefined) extras.push(`"${String(node.content).slice(0, 20)}"`);
  if (node.children?.length) extras.push(`[${node.children.length}↓]`);
  const kindStr = node.kind + (node.label && node.label !== node.kind ? `:${node.label}` : '');
  console.log(`${indent}${node.id.slice(0, 8)}  ${kindStr}  ${extras.join(' ')}`);
  for (const child of (node.children ?? [])) printNodeTree(child, depth + 1);
}

// ── CAPA 0: INTROSPECCIÓN ────────────────────────────────────────────────────

async function cmdContext() {
  const [schemas, routes, scripts, navs] = await Promise.all([
    getSchemas(),
    getRoutes(),
    adapter.read('scripts').catch(() => []) as Promise<any[]>,
    adapter.read('app_navbars').catch(() => []) as Promise<any[]>,
  ]);

  const today = new Date().toISOString().slice(0, 10);
  console.log(`[CONTEXT] ${today}\n`);

  const rf = routes.map((r: any) => {
    const n = r.data?.root ? countNodes(r.data.root) : countBlocks(r.data.blocks ?? []);
    return `${r.data.path}(${n}b)`;
  }).join('  ');
  const sf = schemas.map((s: any) => `${s.data.name}(${s.data.fields?.length ?? 0}f)`).join('  ');
  const nf = navs.length ? navs.map((n: any) => n.data?.name).join('  ') : 'ninguno';
  const sc = scripts.length ? scripts.map((s: any) => s.data.name).join('  ') : 'ninguno';

  console.log(`routes(${routes.length}):  ${rf || '—'}`);
  console.log(`schemas(${schemas.length}): ${sf || '—'}`);
  console.log(`navs(${navs.length}):    ${nf}`);
  console.log(`scripts(${scripts.length}): ${sc}`);
  console.log('');

  const byCategory: Record<string, string[]> = {};
  for (const [type, info] of Object.entries(BLOCK_CATALOG)) {
    (byCategory[info.category] ??= []).push(type);
  }
  console.log('block-types (usa block-types para ver params):');
  for (const [cat, types] of Object.entries(byCategory)) {
    console.log(`  ${cat.padEnd(8)} ${types.join('  ')}`);
  }
}

function cmdBlockTypes() {
  const total = Object.keys(BLOCK_CATALOG).length;
  console.log(`[BLOCK_TYPES] ${total} tipos registrados\n`);

  const byCategory: Record<string, [string, BlockEntry][]> = {};
  for (const [type, info] of Object.entries(BLOCK_CATALOG)) {
    (byCategory[info.category] ??= []).push([type, info]);
  }

  for (const [cat, entries] of Object.entries(byCategory)) {
    console.log(`── ${cat.toUpperCase()} ${'─'.repeat(46 - cat.length)}`);
    for (const [type, info] of entries) {
      const pStr = info.params.length
        ? `visual:[${info.params.map(p => p.key).join(' ')}]`
        : '—';
      const ctxStr = info.needsContext ? '  context:<schema>' : '';
      const kidStr = info.hasChildren ? '  children:✓' : '';
      console.log(`  ${type.padEnd(12)} ${(pStr + ctxStr + kidStr).padEnd(54)}  ${info.description}`);
    }
    console.log('');
  }
}

function cmdBlockSchema(type: string) {
  const info = BLOCK_CATALOG[type];
  if (!info) {
    console.log(`[ERROR] tipo desconocido: "${type}". Usa block-types para ver los disponibles.`);
    return;
  }

  console.log(`[BLOCK_SCHEMA] ${type} — ${info.description}\n`);

  if (info.needsContext) {
    console.log(`context: <schema>   ← requerido. Vincula el bloque a un schema de datos.`);
  }

  if (info.params.length) {
    console.log('visual params:');
    const maxKey = Math.max(...info.params.map(p => p.key.length));
    for (const p of info.params) {
      const optStr = p.options ? `  [${p.options.join('|')}]` : '';
      const defStr = p.default !== undefined ? `  default:${p.default}` : '';
      console.log(`  visual.${p.key.padEnd(maxKey + 2)} ${p.type.padEnd(8)}${optStr}${defStr}`);
      console.log(`    ${p.desc}`);
    }
  } else {
    console.log('(sin params visuales)');
  }

  console.log('');
  console.log(info.hasChildren
    ? `hijos: ${type} acepta blocks[] — usa add-child <ruta> <blockId> <type> [visual:...]`
    : `hijos: ${type} no es contenedor`
  );

  console.log('');
  console.log('Ejemplo:');
  console.log(`  ${info.example}`);
}

// ── CAPA 1: LECTURA ───────────────────────────────────────────────────────────

async function cmdLs() {
  const [schemas, routes, scripts] = await Promise.all([
    getSchemas(),
    getRoutes(),
    adapter.read('scripts').catch(() => []) as Promise<any[]>,
  ]);

  const sf = schemas.map((s: any) => `${s.data.name}(${s.data.fields?.length ?? 0}f)`).join(' ');
  const rt = routes.map((r: any) => {
    const n = r.data?.root ? countNodes(r.data.root) : countBlocks(r.data.blocks ?? []);
    return `${r.data.path}(${n}b)`;
  }).join(' ');
  const sc = scripts.length ? scripts.map((s: any) => s.data.name).join(' ') : 'none';

  console.log(`${belt('ESTRUCTURA')} schemas: ${sf || '—'}`);
  console.log(`${belt('ESTRUCTURA')} routes:  ${rt || '—'}`);
  console.log(`${belt('SCRIPTS')}   scripts: ${sc}`);
}

async function cmdSchema(name: string, json = false) {
  const s = await findSchema(name);
  if (!s) { console.log(`[ERROR] schema no encontrado: ${name}`); return; }
  if (json) { console.log(JSON.stringify(s, null, 2)); return; }
  const fields = (s.data.fields || []).map((f: any) => {
    const rel = f.config?.relation?.entity ? `→${f.config.relation.entity}` : '';
    return `${f.key}(${f.type}${rel}${f.required ? '*' : ''})`;
  });
  console.log(`${belt('ESTRUCTURA', name)} ${fields.join('  ')}`);
}

async function cmdSchemaId(name: string) {
  const s = await findSchema(name);
  if (!s) { console.log(`[ERROR] schema no encontrado: ${name}`); return; }
  console.log(`${belt('ESTRUCTURA', name)} id: ${s.id}`);
}

async function cmdRoute(path: string, json = false) {
  const r = await findRoute(path);
  if (!r) { console.log(`[ERROR] ruta no encontrada: ${path}`); return; }
  if (json) { console.log(JSON.stringify(r, null, 2)); return; }
  if (r.data?.root) {
    const root = r.data.root;
    const n = countNodes(root);
    const kids = (root.children ?? []).map((k: any) =>
      `${k.kind}${k.variant ? `:${k.variant}` : ''}${k.config?.source ? `→${k.config.source}` : ''}${k.children?.length ? `[${k.children.length}↓]` : ''}`
    );
    console.log(`${belt('UI', path)} V3 ${n} nodo(s): ${kids.join('  ')}`);
  } else {
    const total  = countBlocks(r.data.blocks ?? []);
    const blocks = (r.data.blocks || []).map((b: any) =>
      `${b.type}${b.context ? `→${b.context}` : ''}${b.blocks?.length ? `[${b.blocks.length}↓]` : ''}`
    );
    console.log(`${belt('UI', path)} ${total} bloque(s): ${blocks.join('  ')}`);
  }
}

async function cmdUi(path: string) {
  const r = await findRoute(path);
  if (!r) { console.log(`[ERROR] ruta no encontrada: ${path}`); return; }
  if (r.data?.root) {
    const root = r.data.root;
    const n = countNodes(root);
    console.log(`${belt('UI', path)} V3 nodos(${n}):`);
    printNodeTree(root);
  } else {
    const total = countBlocks(r.data.blocks ?? []);
    console.log(`${belt('UI', path)} bloques(${total}):`);
    printBlockTree(r.data.blocks ?? []);
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
  const scripts = (await adapter.read('scripts').catch(() => [])) as any[];
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
  const scripts = (await adapter.read('scripts').catch(() => [])) as any[];
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
  const scripts = (await adapter.read('scripts').catch(() => [])) as any[];
  const existing = scripts.find((x: any) => x.data?.name === name);
  const record = { id: existing?.id ?? crypto.randomUUID(), data: { name, code } };
  await adapter.write('scripts', record);
  console.log(`${belt('SCRIPTS', name)} guardado (${code.length} chars desde ${filePath})`);
}

// ── CAPA 2: COMPOSICIÓN DE BLOQUES (inmediata) ─────────────────────────────────

async function cmdAddBlock(args: string[]) {
  const [routePath, type, ...rest] = args;
  if (!routePath || !type) {
    console.log('[ERROR] uso: add-block <route> <type> [context:<schema>] [intent:<i>] [zap:<z>] [visual:key=val ...]');
    console.log('       Usa block-types para ver tipos disponibles y sus params.');
    return;
  }

  if (!BLOCK_CATALOG[type]) {
    console.log(`[ERROR] tipo "${type}" no existe. Tipos válidos:`);
    const byCategory: Record<string, string[]> = {};
    for (const [t, info] of Object.entries(BLOCK_CATALOG)) {
      (byCategory[info.category] ??= []).push(t);
    }
    for (const [cat, types] of Object.entries(byCategory)) {
      console.log(`  ${cat.padEnd(8)} ${types.join('  ')}`);
    }
    console.log('  Usa block-schema <type> para ver params de cada tipo.');
    return;
  }

  const ctxArg   = rest.find(a => a.startsWith('context:') || a.startsWith('schema:'));
  const intentArg = rest.find(a => a.startsWith('intent:'));
  const zapArg    = rest.find(a => a.startsWith('zap:'));
  const dry       = rest.includes('--dry');

  const context = ctxArg   ? ctxArg.split(':').slice(1).join(':')   : undefined;
  const intent  = intentArg ? intentArg.slice(7) : undefined;
  const zap     = zapArg    ? zapArg.slice(4)    : undefined;
  const visual  = parseVisualArgs(rest);

  const r = await findRoute(routePath);
  if (!r) { console.log(`[ERROR] ruta no encontrada: ${routePath}`); return; }

  const id = crypto.randomUUID();
  const block: any = { id, type, blocks: [] };
  if (context) block.context = context;
  if (intent)  block.intent  = intent;
  if (zap)     block.zap     = zap;
  if (Object.keys(visual).length) block.visual = visual;
  if (dry) {
    console.log(`[DRY] add-block ${routePath}`);
    console.log(`  id:   ${id.slice(0, 8)}  type: ${type}`);
    if (context) console.log(`  context: ${context}`);
    return;
  }
  r.data.blocks = [...(r.data.blocks || []), block];
  r.updated_at  = new Date().toISOString();
  await adapter.write('page_routes', r);
  const vs = fmtVisual(visual);
  console.log(`[OK] block:${id.slice(0,8)} type:${type} en ${routePath}${vs}`);
  const info = BLOCK_CATALOG[type];
  if (info?.hasChildren) {
    console.log(`     → usa add-child ${routePath} ${id.slice(0,8)} <type> para añadir hijos`);
  }
}

async function cmdAddChild(args: string[]) {
  const [routePath, parentId, type, ...rest] = args;
  if (!routePath || !parentId || !type) {
    console.log('[ERROR] uso: add-child <route> <parentBlockId> <type> [visual:key=val ...] [--dry]');
    return;
  }

  const dry    = rest.includes('--dry');
  const visual = parseVisualArgs(rest);

  const r = await findRoute(routePath);
  if (!r) { console.log(`[ERROR] ruta no encontrada: ${routePath}`); return; }

  if (r.data?.root) {
    // V3 path
    const parent = findNodeDeep(r.data.root.children ?? [], parentId)
      ?? (r.data.root.id.startsWith(parentId) ? r.data.root : null);
    if (!parent) { console.log(`[ERROR] nodo padre "${parentId}" no encontrado en ${routePath}`); return; }
    if (parent.kind !== 'frame') {
      console.log(`[ERROR] "${parent.kind}:${parent.label}" no es contenedor (kind !== 'frame'). Usa un frame como padre.`);
      return;
    }
    const child = makeV3Node(type, { visual });
    if (dry) {
      console.log(`[DRY] add-child → parent:${parent.id.slice(0,8)} (${parent.kind}) en ${routePath} (V3)`);
      console.log(`  child.id: ${child.id.slice(0,8)}  kind: ${child.kind}${child.variant ? ` variant:${child.variant}` : ''}`);
      return;
    }
    if (!parent.children) parent.children = [];
    parent.children.push(child);
    r.updated_at = new Date().toISOString();
    await adapter.write('page_routes', r);
    const kindStr = child.kind + (child.variant ? `:${child.variant}` : '');
    console.log(`[OK] child:${child.id.slice(0,8)} ${kindStr} → parent:${parent.id.slice(0,8)} (${parent.kind}:${parent.label})`);
    console.log(`     padre tiene ${parent.children.length} hijo(s)`);
    if (child.kind === 'frame') {
      console.log(`     → frame también es contenedor. add-child ${routePath} ${child.id.slice(0,8)} <type> [...]`);
    }
  } else {
    // V2 path (rutas legacy)
    const id = crypto.randomUUID();
    const child: any = { id, type, blocks: [] };
    if (Object.keys(visual).length) child.visual = visual;
    const parent = findBlockDeep(r.data.blocks || [], parentId);
    if (!parent) { console.log(`[ERROR] bloque padre "${parentId}" no encontrado en ${routePath}`); return; }
    const pInfo = BLOCK_CATALOG[parent.type];
    if (pInfo && !pInfo.hasChildren) {
      console.log(`[ERROR] "${parent.type}" no es contenedor (hasChildren:false). Usa frame o columns como padre.`);
      return;
    }
    if (dry) {
      console.log(`[DRY] add-child → parent:${parentId.slice(0,8)} en ${routePath} (V2 legacy)`);
      console.log(`  child.id: ${id.slice(0,8)}  type: ${type}`);
      return;
    }
    if (!parent.blocks) parent.blocks = [];
    parent.blocks.push(child);
    r.updated_at = new Date().toISOString();
    await adapter.write('page_routes', r);
    const vs = fmtVisual(visual);
    console.log(`[OK] child:${id.slice(0,8)} type:${type} → parent:${parent.id.slice(0,8)} (${parent.type})${vs}  (ruta V2)`);
    console.log(`     padre tiene ${parent.blocks.length} hijo(s)`);
  }
}

async function cmdSetVisual(args: string[]) {
  const [routePath, blockId, key, ...valueParts] = args;
  const value = valueParts.join(' ');
  if (!routePath || !blockId || !key || value === undefined) {
    console.log('[ERROR] uso: set-visual <route> <blockId> <key> <value>');
    return;
  }

  const parsed = value === 'true' ? true : value === 'false' ? false
    : (!isNaN(Number(value)) && value !== '') ? Number(value) : value;

  const r = await findRoute(routePath);
  if (!r) { console.log(`[ERROR] ruta no encontrada: ${routePath}`); return; }

  if (r.data?.root) {
    const node = findNodeDeep(r.data.root.children ?? [], blockId)
      ?? (r.data.root.id.startsWith(blockId) ? r.data.root : null);
    if (!node) { console.log(`[ERROR] nodo "${blockId}" no encontrado en ${routePath}`); return; }
    if (!node.style) node.style = {};
    node.style[key] = parsed;
    r.updated_at = new Date().toISOString();
    await adapter.write('page_routes', r);
    console.log(`[OK] node:${node.id.slice(0,8)} style.${key} → ${JSON.stringify(parsed)}`);
  } else {
    const block = findBlockDeep(r.data.blocks || [], blockId);
    if (!block) { console.log(`[ERROR] block "${blockId}" no encontrado en ${routePath}`); return; }
    if (!block.visual) block.visual = {};
    block.visual[key] = parsed;
    r.updated_at = new Date().toISOString();
    await adapter.write('page_routes', r);
    console.log(`[OK] block:${block.id.slice(0,8)} visual.${key} → ${JSON.stringify(parsed)}`);
  }
}

async function cmdGetBlock(args: string[]) {
  const [routePath, blockId] = args;
  if (!routePath || !blockId) { console.log('[ERROR] uso: get-block <route> <blockId>'); return; }

  const r = await findRoute(routePath);
  if (!r) { console.log(`[ERROR] ruta no encontrada: ${routePath}`); return; }

  if (r.data?.root) {
    const node = findNodeDeep(r.data.root.children ?? [], blockId)
      ?? (r.data.root.id.startsWith(blockId) ? r.data.root : null);
    if (!node) { console.log(`[ERROR] nodo "${blockId}" no encontrado en ${routePath}`); return; }
    console.log(`[NODE] ${node.id.slice(0,8)} kind:${node.kind}${node.variant ? ` variant:${node.variant}` : ''}  ruta:${routePath}`);
    if (node.style && Object.keys(node.style).length) {
      const ss = Object.entries(node.style).map(([k, v]) => `${k}:${v}`).join('  ');
      console.log(`  style:    ${ss}`);
    }
    if (node.config && Object.keys(node.config).length) {
      const cs = Object.entries(node.config).map(([k, v]) => `${k}:${v}`).join('  ');
      console.log(`  config:   ${cs}`);
    }
    if (node.content !== undefined) console.log(`  content:  "${node.content}"`);
    if (node.field)   console.log(`  field:    ${node.field}`);
    if (node.children?.length) {
      const ks = node.children.map((c: any) => `${c.id.slice(0,8)}:${c.kind}`).join('  ');
      console.log(`  children: [${ks}]`);
    }
  } else {
    const block = findBlockDeep(r.data.blocks || [], blockId);
    if (!block) { console.log(`[ERROR] block "${blockId}" no encontrado en ${routePath}`); return; }
    console.log(`[BLOCK] ${block.id.slice(0,8)} type:${block.type}  ruta:${routePath}`);
    if (block.visual && Object.keys(block.visual).length) {
      const vs = Object.entries(block.visual).map(([k, v]) => `${k}:${v}`).join('  ');
      console.log(`  visual:  ${vs}`);
    } else {
      console.log('  visual:  (vacío)');
    }
    if (block.blocks?.length) {
      const cs = block.blocks.map((b: any) => `${b.id.slice(0,8)}:${b.type}`).join('  ');
      console.log(`  blocks:  [${cs}]`);
    }
    if (block.context) console.log(`  context: ${block.context}`);
    if (block.intent)  console.log(`  intent:  ${block.intent}`);
    if (block.zap)     console.log(`  zap:     ${block.zap}`);
  }
}

async function cmdListChildren(args: string[]) {
  const [routePath, blockId] = args;
  if (!routePath || !blockId) { console.log('[ERROR] uso: list-children <route> <blockId>'); return; }

  const r = await findRoute(routePath);
  if (!r) { console.log(`[ERROR] ruta no encontrada: ${routePath}`); return; }

  if (r.data?.root) {
    const node = findNodeDeep(r.data.root.children ?? [], blockId)
      ?? (r.data.root.id.startsWith(blockId) ? r.data.root : null);
    if (!node) { console.log(`[ERROR] nodo "${blockId}" no encontrado en ${routePath}`); return; }
    const children = node.children ?? [];
    console.log(`[CHILDREN] parent:${node.id.slice(0,8)} (${node.kind}:${node.label}) → ${children.length} hijo(s)`);
    for (const c of children) {
      const extras: string[] = [];
      if (c.variant)        extras.push(`variant:${c.variant}`);
      if (c.config?.source) extras.push(`→${c.config.source}`);
      if (c.field)          extras.push(`field:${c.field}`);
      if (c.children?.length) extras.push(`[${c.children.length}↓]`);
      console.log(`  ${c.id.slice(0,8)}  ${c.kind}${c.label !== c.kind ? `:${c.label}` : ''}  ${extras.join(' ')}`);
    }
  } else {
    const block = findBlockDeep(r.data.blocks || [], blockId);
    if (!block) { console.log(`[ERROR] block "${blockId}" no encontrado en ${routePath}`); return; }
    const children = block.blocks ?? [];
    console.log(`[CHILDREN] parent:${block.id.slice(0,8)} (${block.type}) → ${children.length} hijo(s)`);
    for (const c of children) {
      const vs = c.visual ? `  visual:{${Object.entries(c.visual).map(([k, v]) => `${k}:${v}`).join(' ')}}` : '';
      const grandkids = c.blocks?.length ? `  [${c.blocks.length}↓]` : '';
      console.log(`  ${c.id.slice(0,8)}  ${c.type}${vs}${grandkids}`);
    }
  }
}

async function cmdRemoveBlock(args: string[]) {
  const [routePath, blockId] = args;
  if (!routePath || !blockId) { console.log('[ERROR] uso: remove-block <route> <blockId>'); return; }

  const r = await findRoute(routePath);
  if (!r) { console.log(`[ERROR] ruta no encontrada: ${routePath}`); return; }

  if (r.data?.root) {
    const before = (r.data.root.children ?? []).length;
    r.data.root.children = (r.data.root.children ?? []).filter((n: any) => n.id !== blockId && !n.id.startsWith(blockId));
    if (r.data.root.children.length === before) { console.log(`[ERROR] nodo "${blockId}" no encontrado en raíz de ${routePath}`); return; }
    r.updated_at = new Date().toISOString();
    await adapter.write('page_routes', r);
    console.log(`[OK] node:${blockId.slice(0,8)} eliminado de ${routePath}`);
  } else {
    const before = r.data.blocks?.length ?? 0;
    r.data.blocks = (r.data.blocks || []).filter((b: any) => b.id !== blockId && !b.id.startsWith(blockId));
    if (r.data.blocks.length === before) { console.log(`[ERROR] block "${blockId}" no encontrado en ${routePath}`); return; }
    r.updated_at = new Date().toISOString();
    await adapter.write('page_routes', r);
    console.log(`[OK] block:${blockId.slice(0,8)} eliminado de ${routePath}`);
  }
}

async function cmdRemoveChild(args: string[]) {
  const [routePath, parentId, childId] = args;
  if (!routePath || !parentId || !childId) {
    console.log('[ERROR] uso: remove-child <route> <parentBlockId> <childBlockId>');
    return;
  }

  const r = await findRoute(routePath);
  if (!r) { console.log(`[ERROR] ruta no encontrada: ${routePath}`); return; }

  if (r.data?.root) {
    const parent = findNodeDeep(r.data.root.children ?? [], parentId)
      ?? (r.data.root.id.startsWith(parentId) ? r.data.root : null);
    if (!parent) { console.log(`[ERROR] nodo padre "${parentId}" no encontrado en ${routePath}`); return; }
    const before = parent.children?.length ?? 0;
    parent.children = (parent.children || []).filter((n: any) => n.id !== childId && !n.id.startsWith(childId));
    if ((parent.children?.length ?? 0) === before) { console.log(`[ERROR] child "${childId}" no encontrado en parent "${parentId}"`); return; }
    r.updated_at = new Date().toISOString();
    await adapter.write('page_routes', r);
    console.log(`[OK] child:${childId.slice(0,8)} eliminado de parent:${parent.id.slice(0,8)}. Hijos restantes: ${parent.children.length}`);
  } else {
    const parent = findBlockDeep(r.data.blocks || [], parentId);
    if (!parent) { console.log(`[ERROR] padre "${parentId}" no encontrado en ${routePath}`); return; }
    const before = parent.blocks?.length ?? 0;
    parent.blocks = (parent.blocks || []).filter((b: any) => b.id !== childId && !b.id.startsWith(childId));
    if ((parent.blocks?.length ?? 0) === before) { console.log(`[ERROR] child "${childId}" no encontrado en parent "${parentId}"`); return; }
    r.updated_at = new Date().toISOString();
    await adapter.write('page_routes', r);
    console.log(`[OK] child:${childId.slice(0,8)} eliminado de parent:${parent.id.slice(0,8)}. Hijos restantes: ${parent.blocks.length}`);
  }
}

async function cmdUpdateBlock(args: string[]) {
  // V3: actualiza props top-level (variant, content, field, label). Para style usa set-visual.
  // V2: actualiza props raíz (context, intent, zap). Para visual usa set-visual.
  const [routePath, blockId, prop, ...valueParts] = args;
  const value = valueParts.join(' ');
  if (!routePath || !blockId || !prop || value === undefined) {
    console.log('[ERROR] uso: update-block <route> <blockId> <prop> <value>');
    console.log('       Para style/visual usa: set-visual <route> <blockId> <key> <value>');
    return;
  }

  const parsed = value === 'true' ? true : value === 'false' ? false
    : (!isNaN(Number(value)) && value !== '') ? Number(value) : value;

  const r = await findRoute(routePath);
  if (!r) { console.log(`[ERROR] ruta no encontrada: ${routePath}`); return; }

  if (r.data?.root) {
    const node = findNodeDeep(r.data.root.children ?? [], blockId)
      ?? (r.data.root.id.startsWith(blockId) ? r.data.root : null);
    if (!node) { console.log(`[ERROR] nodo "${blockId}" no encontrado en ${routePath}`); return; }
    node[prop] = parsed;
    r.updated_at = new Date().toISOString();
    await adapter.write('page_routes', r);
    console.log(`[OK] node:${node.id.slice(0,8)} ${prop} → ${JSON.stringify(parsed)}`);
  } else {
    const block = findBlockDeep(r.data.blocks || [], blockId);
    if (!block) { console.log(`[ERROR] block "${blockId}" no encontrado en ${routePath}`); return; }
    block[prop] = parsed;
    r.updated_at = new Date().toISOString();
    await adapter.write('page_routes', r);
    console.log(`[OK] block:${block.id.slice(0,8)} ${prop} → ${JSON.stringify(parsed)}`);
  }
}

// ── CAPA 3: COMANDOS SEMÁNTICOS (inmediatos) ──────────────────────────────────

async function cmdCreateNav(args: string[]) {
  const name = args[0];
  if (!name) {
    console.log('[ERROR] uso: create-nav <name> [link:label:path:icon ...] [brand:label:path] [--update]');
    console.log('       Iconos: cualquier nombre de lucide-react (Home, Package, Users...)');
    return;
  }

  const update = args.includes('--update');

  const links = args.filter(a => a.startsWith('link:')).map(a => {
    const [label, path, icon] = a.slice(5).split(':');
    return icon ? { label, path, icon } : { label, path };
  });

  const brandArg = args.find(a => a.startsWith('brand:'));
  const brand = brandArg ? (() => {
    const [label, path = '/'] = brandArg.slice(6).split(':');
    return { label, path };
  })() : undefined;

  const navs = (await adapter.read('app_navbars').catch(() => [])) as any[];
  const existing = navs.find((n: any) => n.data?.name === name);

  if (existing && !update) {
    console.log(`[ERROR] nav "${name}" ya existe. Usa --update para sobreescribir.`);
    console.log(`  Links actuales: ${existing.data.links?.map((l: any) => l.label).join(', ') || '—'}`);
    return;
  }

  const record: any = {
    id: existing?.id ?? crypto.randomUUID(),
    data: { name, links },
    updated_at: new Date().toISOString(),
  };
  if (brand) record.data.brand = brand;

  await adapter.write('app_navbars', record);

  console.log(`[NAV] "${name}" ${existing ? 'actualizado' : 'creado'} en app_navbars`);
  if (brand) console.log(`  brand: ${brand.label} → ${brand.path}`);
  links.forEach(l => console.log(`  link:  ${l.label} → ${(l as any).path}${(l as any).icon ? ` (${(l as any).icon})` : ''}`));
  console.log(`  Siguiente: add-block <ruta> navbar visual:nav_id=${name}`);
}

async function cmdListNavs() {
  const navs = (await adapter.read('app_navbars').catch(() => [])) as any[];
  if (!navs.length) {
    console.log('[NAVS] ninguno. Crea con: create-nav <name> [link:label:path:icon ...]');
    return;
  }
  console.log(`[NAVS] ${navs.length} configuraciones en app_navbars`);
  for (const n of navs) {
    const links    = n.data.links ?? [];
    const brandStr = n.data.brand ? `brand:${n.data.brand.label}` : 'sin brand';
    const names    = links.map((l: any) => l.label).join('  ');
    console.log(`  ${n.data.name.padEnd(14)} ${brandStr.padEnd(20)} ${links.length} link(s): ${names}`);
  }
}

async function cmdCreateColumns(args: string[]) {
  const routePath = args[0];
  if (!routePath) {
    console.log('[ERROR] uso: create-columns <route> [cols=N] [gap=N]');
    return;
  }

  const colsArg = args.find(a => a.startsWith('cols='));
  const gapArg  = args.find(a => a.startsWith('gap='));
  const cols    = colsArg ? Math.max(1, Math.min(4, parseInt(colsArg.split('=')[1]))) : 2;
  const gap     = gapArg  ? parseInt(gapArg.split('=')[1]) : 6;

  const r = await findRoute(routePath);
  if (!r) { console.log(`[ERROR] ruta no encontrada: ${routePath}`); return; }

  if (r.data?.root) {
    const node = makeV3Node('columns', { visual: { cols, gap } });
    r.data.root.children = [...(r.data.root.children ?? []), node];
    r.updated_at = new Date().toISOString();
    await adapter.write('page_routes', r);
    console.log(`[COLUMNAS] node:${node.id.slice(0,8)} creado en ${routePath}`);
    console.log(`  style: gridTemplateColumns:repeat(${cols},1fr)  gap:${gap * 0.25}rem`);
    console.log(`  Siguiente: add-child ${routePath} ${node.id.slice(0,8)} <type> [visual:...]`);
  } else {
    const id    = crypto.randomUUID();
    const block = { id, type: 'columns', visual: { cols, gap }, blocks: [] };
    r.data.blocks = [...(r.data.blocks || []), block];
    r.updated_at  = new Date().toISOString();
    await adapter.write('page_routes', r);
    console.log(`[COLUMNAS] block:${id.slice(0,8)} creado en ${routePath}  (ruta V2)`);
    console.log(`  visual: cols:${cols}  gap:${gap} (${gap * 0.25}rem entre columnas)`);
    console.log(`  Siguiente: add-child ${routePath} ${id.slice(0,8)} <type> [visual:...]`);
  }
}

async function cmdCreatePage(args: string[]) {
  const templateArg = args.find(a => a.startsWith('template:'));
  const template    = templateArg ? templateArg.slice(9) : 'blank';
  const rest        = args.filter(a => !a.startsWith('template:'));
  const [routePath, ...titleParts] = rest;
  const title = titleParts.join(' ');

  if (!routePath || !title) {
    console.log('[ERROR] uso: create-page <path> <title> [template:blank|landing|data-<schema>]');
    return;
  }

  let rootChildren: any[] = [];

  if (template === 'landing') {
    rootChildren = [
      makeV3Node('text',   { visual: { content: title, variant: 'h1', align: 'center' } }),
      makeV3Node('spacer', { visual: { size: 4 } }),
    ];
  } else if (template.startsWith('data-')) {
    const schema = template.slice(5);
    rootChildren = [
      makeV3Node('collection', { context: schema, visual: { view: 'table', limit: 20 } }),
      makeV3Node('action',     { context: schema, visual: { label: `Nuevo ${schema}` } }),
    ];
  }

  const routeRecord = {
    id: crypto.randomUUID(),
    data: { path: routePath, title, root: makeRootFrame(rootChildren) },
    updated_at: new Date().toISOString(),
  };

  await adapter.write('page_routes', routeRecord);

  console.log(`[PAGE] "${routePath}" creada — "${title}"  template:${template}  (V3)`);
  if (rootChildren.length) rootChildren.forEach(n => console.log(`  → ${n.kind}${n.variant ? `:${n.variant}` : ''}${n.config?.source ? ` →${n.config.source}` : ''}`));
  else console.log('  (sin nodos — usa add-block para añadir)');
}

async function cmdScaffold(args: string[]) {
  const schemaName = args[0];
  if (!schemaName) {
    console.log('[ERROR] uso: scaffold <schema> [route:<path>]');
    return;
  }

  const routeArg  = args.find(a => a.startsWith('route:'));
  const routePath = routeArg ? routeArg.slice(6) : `/${schemaName}`;
  const title     = autoLabel(schemaName);

  const schemas = await getSchemas();
  if (!schemas.find((s: any) => s.data?.name === schemaName)) {
    console.log(`[ERROR] schema "${schemaName}" no existe. Créalo primero con create-schema.`);
    return;
  }

  const rootChildren = [
    makeV3Node('collection', { context: schemaName, visual: { view: 'table', limit: 20 } }),
    makeV3Node('action',     { context: schemaName, visual: { label: `Nuevo ${title}` } }),
  ];

  await adapter.write('page_routes', {
    id: crypto.randomUUID(),
    data: { path: routePath, title, root: makeRootFrame(rootChildren) },
    updated_at: new Date().toISOString(),
  });

  console.log(`[SCAFFOLD] ${routePath} construida para schema:${schemaName}  (V3)`);
  rootChildren.forEach((n, i) => console.log(`  ${i + 1}. ${n.kind}:${n.variant}  source:${n.config?.source}  config:${JSON.stringify(n.config)}`));
  console.log(`  Revisa con: ui ${routePath}`);
}

// ── CAPA 4: SCHEMA CRUD (staged) ──────────────────────────────────────────────

async function cmdCreateSchema(args: string[]) {
  const name = args[0];
  if (!name) { console.log('[ERROR] uso: create-schema <name> [field:<key>:<type>[:<label>] ...]'); return; }
  const fields = args.slice(1).filter(a => a.startsWith('field:')).map(f => {
    const [key, type = 'text', ...labelParts] = f.slice(6).split(':');
    return { id: crypto.randomUUID(), key, type, label: labelParts.join(' ') || autoLabel(key), required: false };
  });
  const record = { id: crypto.randomUUID(), data: { name, fields }, updated_at: new Date().toISOString() };
  const desc = `crear schema:${name} (${fields.length} campos)`;
  pending.push({ desc, run: async () => { await adapter.write('schema_definitions', record); } });
  console.log(`${belt('CAMBIO')} pendiente(${pending.length}): ${desc}`);
}

async function cmdAddField(args: string[]) {
  const [schemaName, key, type] = args;
  if (!schemaName || !key || !type) {
    console.log('[ERROR] uso: add-field <schema> <key> <type> [label:<label>] [required] [options:<a,b,c>] [entity:<schema>]');
    return;
  }
  const labelArg  = args.find(a => a.startsWith('label:'));
  const label     = labelArg ? labelArg.slice(6) : autoLabel(key);
  const required  = args.includes('required');
  const optionsArg = args.find(a => a.startsWith('options:'));
  const options   = optionsArg ? optionsArg.slice(8).split(',').map(o => o.trim()) : undefined;
  const entityArg = args.find(a => a.startsWith('entity:'));
  const config    = entityArg ? { relation: { entity: entityArg.slice(7), parent_key: 'id' } } : undefined;
  const field: any = { id: crypto.randomUUID(), key, type, label, required };
  if (options) field.options = options;
  if (config)  field.config  = config;
  const desc = `schema:${schemaName} add-field:${key}(${type})`;
  pending.push({
    desc,
    run: async () => {
      const s = await findSchema(schemaName);
      if (!s) throw new Error(`schema ${schemaName} no encontrado`);
      if (s.data.fields?.find((f: any) => f.key === key)) throw new Error(`field ${key} ya existe`);
      s.data.fields = [...(s.data.fields || []), field];
      s.updated_at  = new Date().toISOString();
      await adapter.write('schema_definitions', s);
    }
  });
  console.log(`${belt('CAMBIO')} pendiente(${pending.length}): ${desc}`);
}

async function cmdRemoveField(args: string[]) {
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

async function cmdCreateRoute(args: string[]) {
  const [routePath, ...titleParts] = args;
  const title = titleParts.join(' ');
  if (!routePath || !title) { console.log('[ERROR] uso: create-route <path> <title>'); return; }
  const record = { id: crypto.randomUUID(), data: { path: routePath, title, isPrivate: false, blocks: [], order: 0 }, updated_at: new Date().toISOString() };
  await adapter.write('page_routes', record);
  console.log(`[OK] route "${routePath}" creada — "${title}"`);
  console.log(`     Siguiente: add-block ${routePath} <type> [schema:<name>] [intent:<i>]`);
}

async function cmdDeleteRoute(args: string[]) {
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

// ── CAPA 5: RECORD CRUD (staged) ──────────────────────────────────────────────

async function cmdCreateRecord(args: string[]) {
  const context = args[0];
  if (!context) { console.log('[ERROR] uso: create-record <schema> [key=val ...]'); return; }
  const raw  = parseKV(args.slice(1));
  const data: Record<string, any> = {};

  for (const [key, val] of Object.entries(raw)) {
    if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
      // Intentar parsear como JSON. Rechazar explícitamente sintaxis Python (comillas simples).
      if (val.includes("'")) {
        console.log(`[ERROR] campo "${key}": JSON con comillas simples no es válido.`);
        console.log(`  Recibido: ${val.slice(0, 80)}`);
        console.log(`  Usa comillas dobles. Ejemplo: ${key}='[{"name":"Valor"}]'`);
        return;
      }
      try {
        data[key] = JSON.parse(val);
      } catch {
        console.log(`[ERROR] campo "${key}": JSON inválido — ${val.slice(0, 80)}`);
        return;
      }
    } else {
      data[key] = val;
    }
  }

  const id   = crypto.randomUUID();
  const desc = `crear record en:${context}${Object.keys(data).length ? ` (${Object.keys(data).join(', ')})` : ''}`;
  pending.push({
    desc,
    run: async () => { await adapter.write(context, { id, data, updated_at: new Date().toISOString() }); }
  });
  console.log(`${belt('CAMBIO')} pendiente(${pending.length}): ${desc}`);
}

async function cmdUpdateRecord(args: string[]) {
  const [context, id] = args;
  if (!context || !id) { console.log('[ERROR] uso: update-record <schema> <id> [key=val ...]'); return; }
  const patch = parseKV(args.slice(2));
  const desc  = `update record:${id.slice(0,8)} en:${context} (${Object.keys(patch).join(', ')})`;
  pending.push({
    desc,
    run: async () => {
      const records = (await adapter.read(context)) as any[];
      const record  = records.find((r: any) => r.id === id || r.id.startsWith(id));
      if (!record) throw new Error(`record ${id} no encontrado en ${context}`);
      record.data = { ...record.data, ...patch };
      record.updated_at = new Date().toISOString();
      await adapter.write(context, record);
    }
  });
  console.log(`${belt('CAMBIO')} pendiente(${pending.length}): ${desc}`);
}

async function cmdDeleteRecord(args: string[]) {
  const [context, id] = args;
  if (!context || !id) { console.log('[ERROR] uso: delete-record <schema> <id>'); return; }
  const desc = `eliminar record:${id.slice(0,8)} de:${context}`;
  pending.push({
    desc,
    run: async () => {
      const records = (await adapter.read(context)) as any[];
      const record  = records.find((r: any) => r.id === id || r.id.startsWith(id));
      if (!record) throw new Error(`record ${id} no encontrado en ${context}`);
      await adapter.remove(context, record.id);
    }
  });
  console.log(`${belt('CAMBIO')} pendiente(${pending.length}): ${desc}`);
}

// ── CAPA 2+: BULK ─────────────────────────────────────────────────────────────

async function cmdPatchBlocks(args: string[]) {
  // patch-blocks <key> <value> [--type=<type>] [--route=<path>] [--dry]
  const typeFilter  = args.find(a => a.startsWith('--type='))?.slice(7);
  const routeFilter = args.find(a => a.startsWith('--route='))?.slice(8);
  const dry         = args.includes('--dry');
  const rest        = args.filter(a => !a.startsWith('--'));
  const [key, ...valueParts] = rest;
  const value = valueParts.join(' ');

  if (!key || value === undefined || value === '') {
    console.log('[ERROR] uso: patch-blocks <key> <value> [--type=<type>] [--route=<path>] [--dry]');
    console.log('  Ejemplos:');
    console.log('    patch-blocks padding_top 4 --type=frame');
    console.log('    patch-blocks cols 3 --type=columns --route=/inicio');
    console.log('    patch-blocks padding_top 4 --dry          ← previsualiza sin escribir');
    return;
  }

  const parsed = value === 'true' ? true : value === 'false' ? false
    : (!isNaN(Number(value)) && value !== '') ? Number(value) : value;

  if (typeFilter && !BLOCK_CATALOG[typeFilter]) {
    console.log(`[ERROR] --type="${typeFilter}" no está en BLOCK_CATALOG.`);
    console.log(`  Tipos válidos: ${Object.keys(BLOCK_CATALOG).join(', ')}`);
    return;
  }

  const routes = await getRoutes();
  const targets = routeFilter
    ? routes.filter((r: any) => r.data?.path === routeFilter)
    : routes;

  if (routeFilter && !targets.length) {
    console.log(`[ERROR] ruta no encontrada: ${routeFilter}`);
    return;
  }

  function matchV2(block: any): boolean {
    return !typeFilter || block.type === typeFilter;
  }

  function matchV3(node: any): boolean {
    if (!typeFilter) return !!node.id;
    return node.kind === typeFilter || node.label === typeFilter;
  }

  function patchV2(blocks: any[]): number {
    let n = 0;
    for (const b of blocks) {
      if (matchV2(b)) {
        if (!dry) { if (!b.visual) b.visual = {}; b.visual[key] = parsed; }
        n++;
      }
      if (b.blocks?.length) n += patchV2(b.blocks);
    }
    return n;
  }

  function patchV3(node: any): number {
    let n = 0;
    if (matchV3(node) && node.id) {
      if (!dry) { if (!node.style) node.style = {}; node.style[key] = parsed; }
      n++;
    }
    for (const child of (node.children ?? [])) n += patchV3(child);
    return n;
  }

  let totalRoutes = 0;
  let totalBlocks = 0;

  for (const r of targets) {
    let affected = 0;
    if (r.data?.root) {
      affected = patchV3(r.data.root);
    } else {
      affected = patchV2(r.data?.blocks ?? []);
    }
    if (affected > 0) {
      if (!dry) {
        r.updated_at = new Date().toISOString();
        await adapter.write('page_routes', r);
      }
      totalRoutes++;
      totalBlocks += affected;
      console.log(`  ${dry ? '[DRY]' : '[OK]'} ${r.data.path} → ${affected} bloque(s)`);
    }
  }

  const typeStr  = typeFilter ? ` type:${typeFilter}` : ' (todos los tipos)';
  const routeStr = routeFilter ? ` en ${routeFilter}` : ` en ${targets.length} ruta(s) revisadas`;
  const dryStr   = dry ? ' [DRY — sin cambios escritos]' : '';

  console.log(`[PATCH-BLOCKS] ${key} → ${JSON.stringify(parsed)}${typeStr}${routeStr}${dryStr}`);
  console.log(`  ${totalRoutes} ruta(s) afectada(s), ${totalBlocks} bloque(s) modificado(s)`);
}

// ── VALIDACIÓN ────────────────────────────────────────────────────────────────

function validateBlocksVisual(blocks: any[], routePath: string): number {
  let errors = 0;
  for (const b of blocks) {
    if (b.visual) {
      const info = BLOCK_CATALOG[b.type];
      if (info) {
        const knownKeys = new Set(info.params.map((p: BlockParam) => p.key));
        for (const key of Object.keys(b.visual)) {
          if (!knownKeys.has(key)) {
            console.log(`  [route:${routePath}] block "${b.type}" visual key desconocida: "${key}"`);
            errors++;
          }
        }
      }
    }
    if (b.blocks?.length) errors += validateBlocksVisual(b.blocks, routePath);
  }
  return errors;
}

async function cmdValidate() {
  const [schemas, routes] = await Promise.all([getSchemas(), getRoutes()]);
  const schemaNames = new Set(schemas.map((s: any) => s.data?.name).filter(Boolean));
  let errors = 0;

  // Schema field invariants
  for (const s of schemas) {
    const name: string = s.data?.name ?? '?';
    for (const f of s.data?.fields ?? []) {
      if (/[A-Z]/.test(f.key)) {
        console.log(`  [schema:${name}] field key camelCase: "${f.key}"`); errors++;
      }
      if (f.type === 'relation') {
        const entity = f.config?.relation?.entity;
        if (!entity) { console.log(`  [schema:${name}] field "${f.key}" relation sin entity`); errors++; }
        else if (!schemaNames.has(entity)) { console.log(`  [schema:${name}] field "${f.key}" relation.entity "${entity}" no existe`); errors++; }
        if (f.config?.relation?.parentKey !== undefined) {
          console.log(`  [schema:${name}] field "${f.key}" usa parentKey (camelCase) — debe ser parent_key`); errors++;
        }
      }
    }
  }

  // Route block invariants
  for (const r of routes) {
    const path: string = r.data?.path ?? '?';
    const checkContexts = (blocks: any[]) => {
      for (const b of blocks) {
        if (b.context && !schemaNames.has(b.context)) {
          console.log(`  [route:${path}] block "${b.type}" context "${b.context}" no coincide con ningún schema`); errors++;
        }
        if (!BLOCK_CATALOG[b.type]) {
          console.log(`  [route:${path}] block type "${b.type}" no está en BLOCK_CATALOG`); errors++;
        }
        if (b.blocks?.length) checkContexts(b.blocks);
      }
    };
    checkContexts(r.data?.blocks ?? []);
    errors += validateBlocksVisual(r.data?.blocks ?? [], path);
  }

  if (errors === 0) {
    console.log(`${belt('ESTRUCTURA')} validate: OK — ${schemas.length} schemas, ${routes.length} routes, 0 errores`);
  } else {
    console.log(`${belt('ESTRUCTURA')} validate: ${errors} error(s) encontrados`);
  }
}

// ── MUTACIÓN SIMPLE (staged) ──────────────────────────────────────────────────

async function cmdSet(args: string[]) {
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
      if (prop === 'entity')   field.config = { relation: { entity: value, parent_key: 'id' } };
      else if (prop === 'required') field.required = value === 'true';
      else if (prop === 'label')    field.label = value;
      else if (prop === 'type')     field.type  = value;
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
  if (!force) { console.log('  → ejecutar? escribe: commit --force'); return; }
  for (const p of pending) {
    try   { await p.run(); console.log(`  ✓ ${p.desc}`); }
    catch (e: any) { console.log(`  ✗ ${p.desc}  error: ${e.message}`); }
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
agno — Agnostic CLI / MCP de Interfaz  (ver AGNO_MCP_PLAN.md)

══ CAPA 0 — INTROSPECCIÓN ════════════════════════════════════════════
  context                                 snapshot completo del sistema
  block-types                             lista tipos con sus params clave
  block-schema <type>                     params detallados de un tipo
  list-navs                               navs disponibles en app_navbars

══ CAPA 1 — LECTURA ══════════════════════════════════════════════════
  ls                                      schemas, routes, scripts
  schema <name> [--json]                  campos de un schema
  schema id <name>                        id de un schema
  route <path> [--json]                   bloques de una ruta (compacto)
  ui <path>                               árbol completo con visual settings
  records <schema> [limit=N] [key=val]    registros
  script <name>                           ver código de un script
  validate                                verificar invariantes

══ CAPA 2 — COMPOSICIÓN INMEDIATA ════════════════════════════════════
  add-block <route> <type> [context:<s>] [intent:<i>] [zap:<z>]
            [visual:key=val ...] [--dry]
  add-child <route> <parentId> <type> [visual:key=val ...] [--dry]
  set-visual <route> <blockId> <key> <value>
  get-block <route> <blockId>
  list-children <route> <blockId>
  remove-block <route> <blockId>          elimina bloque raíz
  remove-child <route> <parentId> <childId>
  update-block <route> <blockId> <prop> <value>   props raíz (context, zap…)
  patch-blocks <key> <value> [--type=<type>] [--route=<path>] [--dry]
                                          bulk: aplica visual a N rutas/bloques

══ CAPA 3 — SEMÁNTICOS INMEDIATOS ════════════════════════════════════
  create-nav <name> [link:label:path:icon ...] [brand:label:path] [--update]
  list-navs
  create-columns <route> [cols=N] [gap=N]
  create-route <path> <title>
  create-page <path> <title> [template:blank|landing|data-<schema>]
  scaffold <schema> [route:<path>]        ruta CRUD completa

══ CAPA 4 — SCHEMA (staged) ══════════════════════════════════════════
  create-schema <name> [field:<key>:<type>[:<label>] ...]
  add-field <schema> <key> <type> [label:<l>] [required] [options:<a,b,c>]
  remove-field <schema> <key>
  delete-schema <name>
  set <schema>.<field>.<prop> <value>     prop: label|type|required|entity

══ CAPA 5 — DATOS (staged) ═══════════════════════════════════════════
  create-record <schema> [key=val ...]
  update-record <schema> <id> [key=val ...]
  delete-record <schema> <id>
  delete-route <path>

══ SCRIPTS ═══════════════════════════════════════════════════════════
  script <name>
  script write <name> --file <ruta.js>
  script export <name> --file <ruta.js>

══ COLA DE CAMBIOS (solo capas 4 y 5) ════════════════════════════════
  status              ver cola actual
  commit              previsualizar
  commit --force      ejecutar staged
  drop                descartar cola

NOTA: Capas 2 y 3 se aplican INMEDIATAMENTE. No requieren commit.

══ LOG ═══════════════════════════════════════════════════════════
  log [N] [ns=<namespace>] [src=vault|agno]   últimas N acciones
`);
}

// ── DISPATCHER ────────────────────────────────────────────────────────────────

async function dispatch(line: string) {
  const [cmd, ...args] = line.trim().split(/\s+/);
  if (!cmd) return;

  switch (cmd) {
    // Introspección
    case 'context':       return cmdContext();
    case 'block-types':   return cmdBlockTypes();
    case 'block-schema':  return cmdBlockSchema(args[0]);
    case 'list-navs':     return cmdListNavs();

    // Lectura
    case 'ls':       return cmdLs();
    case 'schema':
      if (args[0] === 'id') return cmdSchemaId(args[1]);
      return cmdSchema(args[0], args.includes('--json'));
    case 'route':    return cmdRoute(args[0], args.includes('--json'));
    case 'ui':       return cmdUi(args[0]);
    case 'records':  return cmdRecords(args);
    case 'script':
      if (args[0] === 'write')  return cmdScriptWrite(args.slice(1));
      if (args[0] === 'export') return cmdScriptExport(args.slice(1));
      return cmdScript(args[0]);
    case 'validate': return cmdValidate();

    // Composición inmediata
    case 'add-block':      return cmdAddBlock(args);
    case 'add-child':      return cmdAddChild(args);
    case 'set-visual':     return cmdSetVisual(args);
    case 'get-block':      return cmdGetBlock(args);
    case 'list-children':  return cmdListChildren(args);
    case 'remove-block':   return cmdRemoveBlock(args);
    case 'remove-child':   return cmdRemoveChild(args);
    case 'update-block':   return cmdUpdateBlock(args);
    case 'patch-blocks':   return cmdPatchBlocks(args);

    // Semánticos inmediatos
    case 'create-nav':     return cmdCreateNav(args);
    case 'create-columns': return cmdCreateColumns(args);
    case 'create-route':   return cmdCreateRoute(args);
    case 'create-page':    return cmdCreatePage(args);
    case 'scaffold':       return cmdScaffold(args);

    // Schema staged
    case 'create-schema':  return cmdCreateSchema(args);
    case 'add-field':      return cmdAddField(args);
    case 'remove-field':   return cmdRemoveField(args);
    case 'delete-schema':  return cmdDeleteSchema(args);

    // Route staged
    case 'delete-route':   return cmdDeleteRoute(args);

    // Datos staged
    case 'create-record':  return cmdCreateRecord(args);
    case 'update-record':  return cmdUpdateRecord(args);
    case 'delete-record':  return cmdDeleteRecord(args);

    // Cola
    case 'set':     return cmdSet(args);
    case 'commit':  return cmdCommit(args[0] === '--force');
    case 'drop':    return cmdDrop();
    case 'status':  return cmdStatus();
    case 'log':     return cmdLog(args);
    case 'help':    return cmdHelp();

    default:
      console.log(`[ERROR] comando desconocido: "${cmd}"  (escribe 'help' para ver todos)`);
  }
}

// ── ENTRYPOINT ────────────────────────────────────────────────────────────────

const cliArgs = process.argv.slice(2);

if (cliArgs.length > 0) {
  dispatch(cliArgs.join(' ')).catch(e => console.error('[FATAL]', e.message));
} else {
  const rl    = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
  const isTTY = process.stdin.isTTY;

  if (isTTY) process.stdout.write('agno> ');

  let queue = Promise.resolve();
  rl.on('line', line => {
    queue = queue.then(async () => {
      if (line.trim()) await dispatch(line).catch(e => console.error('[FATAL]', e.message));
      if (isTTY) process.stdout.write('agno> ');
    });
  });

  rl.on('close', () => {
    if (pending.length) console.log(`\n${belt('CAMBIO')} ${pending.length} cambio(s) NO ejecutados. Usa commit --force.`);
  });
}
