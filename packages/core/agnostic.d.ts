/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║               AGNOSTIC SYSTEM — CANONICAL TYPE DECLARATIONS                 ║
 * ║                           @agnostic/core  v6.0                              ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                              ║
 * ║  This file is the single authoritative reference for the entire public API. ║
 * ║  Read it top-to-bottom to understand how to BUILD with the Agnostic System. ║
 * ║                                                                              ║
 * ║  IMPORT PATHS                                                                ║
 * ║    Core types & bridge  →  import { ... } from '@agnostic/core'             ║
 * ║    React state hooks    →  import { useAppState, useAppDispatch }            ║
 * ║                              from '@/context/AppContext'                     ║
 * ║                                                                              ║
 * ║  ARCHITECTURE IN ONE SENTENCE                                                ║
 * ║    The host (Next.js app) hydrates data via a DataStrategy, exposes it      ║
 * ║    through AppContext, and renders schema-driven blocks. Guest modules       ║
 * ║    interact with the host exclusively through AgnosticAPI (the bridge).     ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 1 — PRIMITIVES
// ════════════════════════════════════════════════════════════════════════════════

/**
 * The universal data unit. Every record in the system is a DataItem.
 *
 * @example
 * // A product record stored in context "productos"
 * const item: DataItem = {
 *   id: 'prod_abc123',
 *   context: 'productos',
 *   data: { nombre: 'Silla Ergonómica', precio: 299, _slug: 'silla-ergonomica' },
 * };
 */
export interface DataItem {
  id: string;
  context: string;
  /** Arbitrary payload. Access fields via data['key']. */
  data: Record<string, unknown>;
  /** Set by cloud strategies (Supabase). Not present in local-first mode. */
  created_at?: string;
  updated_at?: string;
}

/**
 * Authenticated user shape. Populated by AuthContext from the 'users' context.
 * The `role` field is used by AgnosticGuard for route-level access control.
 */
export interface AgnosticUser {
  id: string;
  name: string;
  email?: string;
  /** Used by AgnosticGuard. Common values: 'admin' | 'user' | 'viewer' */
  role: string;
  [key: string]: unknown;
}


// ════════════════════════════════════════════════════════════════════════════════
// SECTION 2 — STATE MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════════

/**
 * The global application state managed by AppContext.
 * All data lives here after SSR hydration from the vault.
 *
 * Access via: `const { state } = useAppState()`
 */
export interface AppState {
  /** All hydrated records, keyed by context name (= schema name without 'schema_' prefix). */
  data: Record<string, DataItem[]>;
  system: {
    /** The currently active data context (auto-set from URL). */
    activeContext: string;
    isLoading: boolean;
    error: string | null;
    storageMode: 'LOCAL' | 'REMOTE' | 'HYBRID';
    storageUrl?: string;
  };
  auth: {
    isAuthenticated: boolean;
    user: AgnosticUser | null;
  };
}

/**
 * Internal reducer action types. Consumed by AppContext.
 * Prefer using the dispatch helpers from `useAppDispatch()` over dispatching these directly.
 */
export type Action =
  | { type: 'SET_DATA';         payload: { context: string; items: DataItem[] } }
  | { type: 'SET_SYSTEM_STATE'; payload: Partial<AppState['system']> }
  | { type: 'SET_AUTH';         payload: AppState['auth'] };

/**
 * Overlay intent object. Passed to `openOverlay()` to trigger UI surfaces.
 * The `component` field names a guest module served by `/api/modules/[name]`.
 *
 * @example
 * openOverlay({ type: 'SHEET', title: 'Nuevo Producto', component: 'product_form' });
 * openOverlay({ type: 'CONFIRM', title: '¿Eliminar?', description: 'Acción irreversible.', onConfirm: handleDelete });
 */
export interface OverlayConfig {
  type: 'SHEET' | 'DIALOG' | 'CONFIRM';
  title: string;
  description?: string;
  /** Name of the guest module to render inside the overlay. Optional for CONFIRM type. */
  component?: string;
  /** Props forwarded to the module's API. Merged into AgnosticAPI at runtime. */
  props?: Record<string, unknown>;
  /** Callback fired when the user confirms a CONFIRM overlay. */
  onConfirm?: () => void;
}


// ════════════════════════════════════════════════════════════════════════════════
// SECTION 3 — QUERY SYSTEM (UNIFIED QUERY)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * The single dispatch primitive. Call `api.dispatch(query)` from any guest module.
 *
 * Each action variant is strictly typed — TypeScript will reject invalid shapes.
 *
 * @example READ (fire-and-forget — prefer onUpdate() for reactive subscriptions)
 * await api.dispatch({ action: 'READ', context: 'productos' });
 *
 * @example WRITE — saves or updates a record
 * await api.dispatch({
 *   action: 'WRITE',
 *   context: 'productos',
 *   payload: { nombre: 'Mesa', precio: 500 },
 * });
 *
 * @example DELETE
 * await api.dispatch({ action: 'DELETE', context: 'productos', payload: { id: 'prod_abc' } });
 *
 * @example NAVIGATE — push a new route
 * await api.dispatch({ action: 'NAVIGATE', payload: { path: '/dashboard/ventas' } });
 *
 * @example INTENT — trigger a host-side side-effect (custom signal to the page orchestrator)
 * await api.dispatch({ action: 'INTENT', context: 'checkout', payload: { step: 'payment' } });
 */
export type UnifiedQuery =
  | { action: 'READ';     context: string;     filters?: Record<string, unknown> }
  | { action: 'WRITE';    context: string;     payload: Record<string, unknown> }
  | { action: 'DELETE';   context: string;     payload: { id: string } }
  | { action: 'NAVIGATE'; context?: undefined; payload: { path: string } }
  | { action: 'INTENT';   context: string;     payload?: Record<string, unknown> };


// ════════════════════════════════════════════════════════════════════════════════
// SECTION 4 — AGNOSTIC API  (the bridge given to every guest module)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * UI surface helpers. Available at `api.ui.*` inside any guest module.
 *
 * @example Open a sheet with a guest module inside
 * api.ui.openSheet('Editar Producto', 'product_editor', { productId: 'abc' });
 *
 * @example Confirm a destructive action
 * api.ui.confirm('¿Eliminar registro?', 'Esta acción es irreversible.', () => {
 *   api.dispatch({ action: 'DELETE', context: 'productos', payload: { id } });
 * });
 */
export interface AgnosticUI {
  /** Opens a right-side drawer with a guest module rendered inside. */
  openSheet:  (title: string, moduleName: string, props?: Record<string, unknown>) => void;
  /** Opens a centered modal dialog with a guest module rendered inside. */
  openDialog: (title: string, moduleName: string, props?: Record<string, unknown>) => void;
  /** Opens a confirmation dialog. Fires `onConfirm` only if user accepts. */
  confirm:    (title: string, description: string, onConfirm: () => void) => void;
  /** Closes any open overlay. */
  close:      () => void;
  /**
   * Renders a styled action button as an HTML string.
   * Useful for guest modules that inject DOM manually.
   *
   * @example
   * container.innerHTML += api.ui.renderAction('CREATE', { label: 'Guardar', onClick: handleSave });
   */
  renderAction: (
    type: 'CREATE' | 'SAVE' | 'DELETE' | 'CANCEL',
    props: { label?: string; onClick: () => void; className?: string }
  ) => string;
}

/**
 * The complete API surface given to every guest module via `setup(container, api)`.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  QUICK REFERENCE FOR GUEST MODULE AUTHORS                               │
 * │                                                                         │
 * │  Read data:      api.getGlobalData('context')                          │
 * │  Subscribe:      const unsub = api.onUpdate('context', cb)             │
 * │  Write:          api.dispatch({ action: 'WRITE', context, payload })   │
 * │  Delete:         api.dispatch({ action: 'DELETE', context, payload })  │
 * │  Navigate:       api.dispatch({ action: 'NAVIGATE', payload: {path} }) │
 * │  Open sheet:     api.ui.openSheet(title, moduleName, props)            │
 * │  Current user:   api.user                                              │
 * │  Active record:  api.getActiveRecord()                                 │
 * │  Schema:         api.getSchema('context')                              │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
export interface AgnosticAPI {
  /**
   * Sends a typed intent to the host. Always returns Promise<void>.
   * The host processes the action and updates AppState; onUpdate() fires for subscribers.
   */
  dispatch: (query: UnifiedQuery) => Promise<void>;

  /**
   * Subscribe to changes in a context. Fires immediately with current data,
   * then fires on every state change. Returns an unsubscribe function.
   *
   * @example
   * const unsub = api.onUpdate('productos', (allData) => {
   *   const items = allData['productos'] ?? [];
   *   renderList(items);
   * });
   * // Call unsub() in your teardown function to avoid memory leaks.
   */
  onUpdate: (
    context: string,
    callback: (data: Record<string, DataItem[]>) => void
  ) => () => void;

  /**
   * Returns all records for a given context from the current state snapshot.
   * Unlike onUpdate(), this is a one-shot read — not reactive.
   */
  getGlobalData: (context: string) => DataItem[];

  /**
   * Returns the DataItem that matches the last URL segment (_slug) in the active context.
   * Useful for detail pages: /productos/silla-ergonomica → returns the "silla-ergonomica" record.
   */
  getActiveRecord: () => DataItem | null;

  /** Returns the name of the current active context (derived from block config or URL). */
  getContext: () => string;

  /**
   * Returns the schema definition for a context.
   * Schema fields describe the entity's structure: name, fields, identitySource, etc.
   *
   * @example
   * const schema = api.getSchema('productos');
   * // schema.fields → [{ key: 'nombre', label: 'Nombre', type: 'text', required: true }, ...]
   */
  getSchema: (context?: string) => Record<string, unknown> | null;

  /**
   * Returns the block configuration object that instantiated this module.
   * Useful for reading block-level custom props passed from page_routes.
   */
  getBlockConfig: () => Record<string, unknown>;

  /**
   * Renders a named SVG icon as an HTML string.
   * Available icons: 'Plus', 'X', 'Layers'
   */
  renderIcon: (name: string) => string;

  /** Toast notification helpers. Powered by sonner. */
  notify: {
    success: (msg: string) => void;
    error:   (msg: string) => void;
    loading: (msg: string) => void;
  };

  /** UI surface helpers: sheets, dialogs, confirmations. */
  ui: AgnosticUI;

  /** Snapshot of the full AppState at render time. Prefer onUpdate() for reactivity. */
  state: AppState;

  /** Currently authenticated user. Null if no session. */
  user: AgnosticUser | null;

  /**
   * The DOM container element for this module.
   * Null during SSR — always guard with `if (container)`.
   */
  container?: HTMLElement | null;
}


// ════════════════════════════════════════════════════════════════════════════════
// SECTION 5 — GUEST MODULE CONTRACT
// ════════════════════════════════════════════════════════════════════════════════

/**
 * The contract every guest module (.js file served by /api/modules/[name]) must satisfy.
 *
 * A guest module is a plain JavaScript file (ESM) that:
 *   1. Exports a `setup(container, api)` function.
 *   2. Renders its UI into `container` using vanilla DOM, React, or any other library.
 *   3. Optionally returns a teardown function to clean up listeners and timers.
 *
 * The module file is fetched at runtime, executed in an isolated Blob URL context,
 * and mounted by AgnosticModuleLoader.
 *
 * @example  storage/default/modules/product_form.js
 * ```js
 * export function setup(container, api) {
 *   const schema = api.getSchema('productos');
 *
 *   container.innerHTML = `
 *     <form id="pf">
 *       <input name="nombre" placeholder="Nombre" required />
 *       <button type="submit">Guardar</button>
 *     </form>
 *   `;
 *
 *   const form = container.querySelector('#pf');
 *
 *   const handleSubmit = async (e) => {
 *     e.preventDefault();
 *     const data = Object.fromEntries(new FormData(e.target));
 *     await api.dispatch({ action: 'WRITE', context: 'productos', payload: data });
 *     api.notify.success('Producto guardado');
 *     api.ui.close();
 *   };
 *
 *   form.addEventListener('submit', handleSubmit);
 *
 *   // Teardown: return a cleanup function.
 *   // AgnosticModuleLoader calls it automatically on React unmount.
 *   return () => form.removeEventListener('submit', handleSubmit);
 * }
 * ```
 */
export interface GuestModuleContract {
  /**
   * Called once when the host mounts the module.
   * @param container  The DOM element this module owns. May be null during SSR.
   * @param api        The full AgnosticAPI bridge.
   * @returns          An optional teardown function. Return it to prevent memory leaks.
   */
  setup: (container: HTMLElement | null, api: AgnosticAPI) => (() => void) | void;
}


// ════════════════════════════════════════════════════════════════════════════════
// SECTION 6 — BLOCK SYSTEM  (page_routes schema)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * A block is the atomic UI unit of a page. Pages are arrays of blocks.
 * Blocks are stored in the `page_routes` context under `route.data.blocks`.
 *
 * AgnosticRenderer maps each block.type to its React component:
 *   'form'       →  AgnosticForm
 *   'table'      →  AgnosticTable
 *   'collection' →  AgnosticCollection
 *   'custom'     →  AgnosticModuleLoader (guest module)
 */

/** Renders a schema-driven form. Saves to the vault on submit. */
export interface FormBlock {
  type: 'form';
  /** ID of the schema, e.g. 'schema_productos'. Must exist in schema_definitions. */
  schemaId: string;
  /** Optional guest module name for custom validation or side-effects. */
  moduleName?: string;
}

/** Renders a tabular list of records from a schema context. */
export interface TableBlock {
  type: 'table';
  /** ID of the schema, e.g. 'schema_productos'. */
  schemaId: string;
  /** Whitelist of field keys to display as columns. If empty, shows all fields. */
  switches?: string[];
  /** Field keys to always hide, even if present in schema. */
  blackout?: string[];
}

/** Renders records as cards or a list (non-tabular). */
export interface CollectionBlock {
  type: 'collection';
  /** Data context name (without 'schema_' prefix), e.g. 'productos'. */
  context: string;
  /** Schema ID for field metadata. */
  schemaId: string;
  /** Display mode. */
  view?: 'grid' | 'list';
  /** Record of field key → display label for projection. */
  projection?: Record<string, string>;
}

/** Renders a guest module (.js file from /api/modules). Full API access. */
export interface CustomBlock {
  type: 'custom';
  /** Name of the module file in storage/[tenant]/modules/. Without extension. */
  moduleName: string;
  /** Passed as block config; accessible via api.getBlockConfig(). */
  [key: string]: unknown;
}

/** Union of all renderable block types. */
export type AgnosticBlock = FormBlock | TableBlock | CollectionBlock | CustomBlock;

/**
 * A page route definition. Stored in the 'page_routes' context.
 *
 * @example
 * {
 *   id: 'route_productos',
 *   context: 'page_routes',
 *   data: {
 *     path: '/productos',
 *     title: 'Catálogo de Productos',
 *     requiredRole: 'user',
 *     blocks: [
 *       { type: 'form', schemaId: 'schema_productos' },
 *       { type: 'table', schemaId: 'schema_productos', switches: ['nombre', 'precio'] },
 *     ],
 *   },
 * }
 */
export interface PageRoute {
  id: string;
  context: 'page_routes';
  data: {
    /** URL path. Supports parameters: '/productos/:id' */
    path: string;
    title?: string;
    /** If set, AgnosticGuard redirects unauthenticated users. */
    requiredRole?: string;
    blocks: AgnosticBlock[];
  };
}


// ════════════════════════════════════════════════════════════════════════════════
// SECTION 7 — SCHEMA DEFINITIONS  (schema_definitions context)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * A field definition within a schema.
 * Drives AgnosticForm field rendering and AgnosticTable column resolution.
 */
export interface FieldDefinition {
  /** Internal key used as the data property name. Snake_case recommended. */
  key: string;
  /** Display label shown in forms and table headers. */
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'image' | 'date' | 'email' | 'url';
  required?: boolean;
  /** For type 'select' — the list of selectable values. */
  options?: string[];
  /** Column width hint. 'full' = 6 cols, 'half' = 3 cols, default = 2 cols (out of 6). */
  width?: 'full' | 'half';
}

/**
 * A schema definition. Stored in the 'schema_definitions' context.
 * Defines the shape, identity, and persistence behaviour of an entity.
 *
 * @example
 * {
 *   id: 'schema_productos',
 *   context: 'schema_definitions',
 *   data: {
 *     name: 'productos',
 *     label: 'Productos',
 *     identitySource: 'nombre',   // field used to generate _slug
 *     fields: [
 *       { key: 'nombre',   label: 'Nombre',  type: 'text',   required: true },
 *       { key: 'precio',   label: 'Precio',  type: 'number', required: true, width: 'half' },
 *       { key: 'categoria',label: 'Categoría', type: 'select', options: ['A', 'B'] },
 *     ],
 *   },
 * }
 */
export interface SchemaDefinition {
  id: string;
  context: 'schema_definitions';
  data: {
    /** Must match the context key used in DataItem.context. */
    name: string;
    /** Human-readable name shown in the UI. */
    label?: string;
    /**
     * The field key whose value generates the `_slug` auto-identity.
     * The vault auto-normalizes it: lowercase, NFD, hyphenated.
     * Example: 'nombre' → data._slug = 'silla-ergonomica'
     */
    identitySource?: string;
    fields: FieldDefinition[];
  };
}


// ════════════════════════════════════════════════════════════════════════════════
// SECTION 8 — DATA STRATEGY
// ════════════════════════════════════════════════════════════════════════════════

/**
 * The persistence abstraction. All reads and writes flow through a DataStrategy.
 * The active strategy is resolved by getStrategy() based on manifest.json.
 *
 * Implementations: LocalStrategy, SupabaseStrategy, GitHubStrategy (read-only), HybridStrategy.
 */
export interface DataStrategy {
  /**
   * Reads all records, optionally filtered by context.
   * Returns a map of contextName → DataItem[].
   */
  read: (context?: string) => Promise<Record<string, DataItem[]>>;

  /**
   * Persists a batch of records across one or more contexts.
   * Performs upsert: existing records (by id) are updated, new ones are inserted.
   */
  write: (data: Record<string, DataItem[]>) => Promise<void>;

  /**
   * Deletes a single record by id within a context.
   * Optional for read-only strategies (e.g. GitHubStrategy).
   * The vault returns HTTP 405 if the active strategy does not implement delete.
   */
  delete?: (context: string, id: string) => Promise<void>;

  /**
   * High-frequency single-context write (avoids full-DB payload).
   * Falls back to write() if not implemented.
   */
  writeContext?: (context: string, items: DataItem[]) => Promise<void>;
}

/**
 * Manifest configuration. Lives at `storage/[tenant]/manifest.json`.
 * Drives strategy resolution on every server start (cached for 5 min).
 *
 * @example  storage/default/manifest.json
 * ```json
 * {
 *   "config": {
 *     "strategy": "HYBRID",
 *     "cloud_contexts": ["pedidos", "clientes"]
 *   },
 *   "secrets": {
 *     "supabaseUrl": "https://xxx.supabase.co",
 *     "supabaseKey": "eyJ..."
 *   }
 * }
 * ```
 *
 * Strategy resolution rules (in order):
 *   1. strategy='HYBRID' + supabase credentials  →  HybridStrategy (local DNA + cloud materia)
 *   2. supabase credentials only                 →  SupabaseStrategy (full cloud)
 *   3. STORAGE_URL env var, no manifest          →  RemoteJSONStrategy (static JSON CDN)
 *   4. default                                   →  LocalStrategy (file system, storage/[tenant]/db/)
 */
export interface TenantManifest {
  config?: {
    strategy?: 'HYBRID' | 'LOCAL' | 'SUPABASE';
    cloud_contexts?: string[];
  };
  secrets?: {
    supabaseUrl?: string;
    supabaseKey?: string;
  };
}


// ════════════════════════════════════════════════════════════════════════════════
// SECTION 9 — REACT HOOKS  (from @/context/AppContext)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Return type of `useAppState()`.
 *
 * @example
 * const { state, ui } = useAppState();
 * const productos = state.data['productos'] ?? [];
 * const overlay   = ui.overlay; // null if no overlay is open
 */
export interface AppStateHookResult {
  state: AppState;
  ui: {
    overlay: OverlayConfig | null;
  };
}

/**
 * Return type of `useAppDispatch()`.
 *
 * @example
 * const { saveItem, deleteItem, openOverlay, closeOverlay } = useAppDispatch();
 *
 * // Save a record
 * await saveItem('productos', { id: 'prod_001', context: 'productos', data: { nombre: 'Mesa' } });
 *
 * // Delete a record
 * await deleteItem('productos', 'prod_001');
 *
 * // Open an overlay
 * openOverlay({ type: 'SHEET', title: 'Nuevo Producto', component: 'product_form' });
 */
export interface AppDispatchHookResult {
  /** Persists a DataItem to the vault, then refreshes context state. */
  saveItem:     (context: string, item: Record<string, unknown>) => Promise<void>;
  /** Deletes a record from the vault, then refreshes context state. */
  deleteItem:   (context: string, id: string) => Promise<void>;
  /** Opens an overlay (SHEET | DIALOG | CONFIRM). */
  openOverlay:  (overlay: OverlayConfig) => void;
  /** Closes any open overlay. */
  closeOverlay: () => void;
  /** Raw React dispatcher — use sparingly; prefer saveItem/deleteItem/openOverlay. */
  dispatch:     (action: Action | { type: 'OPEN_OVERLAY'; payload: OverlayConfig } | { type: 'CLOSE_OVERLAY' }) => void;
}


// ════════════════════════════════════════════════════════════════════════════════
// SECTION 10 — BRIDGE FACTORY
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Configuration passed to `createAgnosticAPI()` by AgnosticRenderer.
 * You do NOT call this directly unless building a custom renderer.
 * Guest modules receive the fully constructed AgnosticAPI, not this config.
 */
export interface BridgeConfig {
  router:       { push: (path: string) => void };
  saveItem:     (ctx: string, item: Record<string, unknown>) => Promise<void>;
  deleteItem:   (ctx: string, id: string) => Promise<void>;
  openOverlay:  (overlay: OverlayConfig) => void;
  closeOverlay: () => void;
  stateRef:     { current: AppState & { ui: { overlay: OverlayConfig | null } } };
  block:        Record<string, unknown>;
  toast:        { success: (m: string) => void; error: (m: string) => void; loading: (m: string) => void };
}

/**
 * Factory function that produces an AgnosticAPI from host capabilities.
 * Called by AgnosticRenderer for every rendered block.
 *
 * @example  In a custom renderer:
 * const api = createAgnosticAPI({ router, saveItem, deleteItem, openOverlay, closeOverlay, stateRef, block, toast });
 */
export declare function createAgnosticAPI(config: BridgeConfig): AgnosticAPI;


// ════════════════════════════════════════════════════════════════════════════════
// SECTION 11 — DUAL-LAYER STYLING SYSTEM
// ════════════════════════════════════════════════════════════════════════════════

/**
 * AGNOSTIC SYSTEM — DOBLE CAPA ESTILÍSTICA
 * ==========================================
 *
 * El sistema de estilos tiene dos capas completamente independientes:
 *
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │  CAPA 1: SEED (compilada una vez con Tailwind)                              │
 * │  tailwind.config.js → lee var(--sat-*) exclusivamente                      │
 * │  globals.css         → define los defaults del Seed                         │
 * │  Aplica a: herramientas internas (/schema, vault UI, etc.)                  │
 * └───────────────────────────────────┬─────────────────────────────────────────┘
 *                                     │ CSS Custom Properties Bridge
 *                                     │ (20 variables públicas --sat-*)
 * ┌───────────────────────────────────▼─────────────────────────────────────────┐
 * │  CAPA 2: SATÉLITE (cargada en runtime por tenant)                           │
 * │  tokens.css    → overrides de var(--sat-*) — inyectado inline (sin FOUC)   │
 * │  compiled.css  → clases propias del negocio — inyectado como <link>         │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 *
 * TOKEN CONTRACT — Variables públicas que el Seed expone:
 *
 *   Superficies:
 *     --sat-bg          Fondo global de la página
 *     --sat-fg          Texto principal
 *     --sat-card        Fondo de tarjetas y paneles
 *     --sat-card-fg     Texto dentro de tarjetas
 *     --sat-muted       Fondo de elementos secundarios
 *     --sat-muted-fg    Texto secundario / placeholders
 *     --sat-border      Color de bordes
 *     --sat-input       Fondo de inputs
 *
 *   Marca:
 *     --sat-accent      Color de acento / botones CTA (brand color)
 *     --sat-accent-fg   Texto sobre el acento
 *     --sat-ring        Anillo de foco (accesibilidad)
 *
 *   Semántica:
 *     --sat-destructive     Color de acciones destructivas
 *     --sat-destructive-fg  Texto sobre destructive
 *     --sat-success         Confirmaciones / éxito
 *     --sat-warning         Advertencias
 *
 *   Forma:
 *     --sat-radius      Radio base para todos los bordes redondeados
 *                       0rem = recto | 0.5rem = moderno | 1rem = friendly
 *
 *   Tipografía:
 *     --sat-font-sans   Fuente del cuerpo
 *     --sat-font-serif  Fuente de encabezados
 *     --sat-font-mono   Fuente monoespaciada
 *
 *
 * FLUJO DE IMPLEMENTACIÓN PARA UN SATÉLITE NUEVO:
 *
 * 1. MÍNIMO (solo branding via tokens):
 *    Crea storage/[tenant]/styles/tokens.css con los --sat-* que quieras cambiar.
 *    NO necesitas recompilar nada. El Seed lo inyecta automáticamente.
 *
 * 2. COMPLETO (clases propias para módulos guest):
 *    a. Crea storage/[tenant]/styles/tailwind.config.js con tu config
 *    b. Crea storage/[tenant]/styles/satellite.css con @tailwind directives
 *    c. Ejecuta: npm run satellite:build [tenant]
 *    d. Se genera compiled.css → el Seed lo sirve vía /api/satellite-styles
 *
 * 3. FRAMEWORK LIBRE (Bootstrap, vanilla CSS, etc.):
 *    a. Genera tu CSS con el tool que prefieras
 *    b. Guarda el output como storage/[tenant]/styles/satellite.css
 *    c. Ejecuta: npm run satellite:build [tenant]  (lo copia a compiled.css)
 *
 *
 * API ENDPOINTS DE ESTILOS:
 *   GET /api/satellite-styles   → Sirve compiled.css del tenant activo
 *                                  Retorna 204 si no existe.
 *   GET /api/theme-styles       → Legacy. Sirve theme.css si existe.
 *
 *
 * EJEMPLO — Satélite "Mueblería Roble" (tokens.css mínimo):
 * ```css
 * :root {
 *   --sat-bg:      #FAF7F2;
 *   --sat-fg:      #2C1A0E;
 *   --sat-accent:  #8B4513;
 *   --sat-radius:  0.5rem;
 *   --sat-font-serif: 'Playfair Display', serif;
 * }
 * ```
 * Con 5 líneas, todos los componentes del Seed adoptan la identidad del negocio.
 */


// ════════════════════════════════════════════════════════════════════════════════
// SECTION 12 — NAMING CONVENTIONS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * NAMING CONVENTIONS  (non-negotiable — breaking these causes silent failures)
 *
 * ┌─────────────────────────────┬─────────────────────────────────────────────┐
 * │ Concept                     │ Convention                                  │
 * ├─────────────────────────────┼─────────────────────────────────────────────┤
 * │ Context name                │ snake_case plural  e.g. 'pedidos'           │
 * │ Schema ID                   │ 'schema_' + context  e.g. 'schema_pedidos'  │
 * │ Schema identitySource field │ A field key in the schema                   │
 * │ Auto-generated slug         │ data._slug  (created by vault on WRITE)     │
 * │ Slug format                 │ lowercase, NFD-normalized, hyphenated        │
 * │ Route path parameter        │ :paramName  e.g. '/pedidos/:id'             │
 * │ Foreign key convention      │ '{parentContext}_id'  e.g. 'pedidos_id'     │
 * │ Module file location        │ storage/[tenant]/modules/[name].js          │
 * │ Theme CSS location          │ storage/[tenant]/styles/theme.css           │
 * │ Manifest location           │ storage/[tenant]/manifest.json              │
 * └─────────────────────────────┴─────────────────────────────────────────────┘
 *
 * DNA vs MATERIA split (HybridStrategy):
 *   DNA     — Schemas, routes, system config. Stored locally (versioned as code).
 *   MATERIA — Operational records (orders, clients, products). Stored in the cloud.
 *
 * Context resonance (parent-child filtering):
 *   When a child context's table or collection is rendered inside a parent detail
 *   page (/[parentContext]/[parentSlug]), AgnosticTable auto-filters records where
 *   item.data['{parentContext}_id'] === parentRecord.id.
 *   This is the framework's convention for relational data — no joins, no FKs.
 *
 * API endpoints:
 *   POST /api/vault   { action: 'WRITE'|'DELETE', context, payload }  → mutation
 *   GET  /api/vault?context=[name]                                     → read
 *   GET  /api/modules/[name]                                           → serve .js module
 *   POST /api/upload  multipart/form-data { file }                    → returns { url }
 *
 * Upload constraints:
 *   Max size: 5 MB
 *   Allowed MIME: image/jpeg, image/png, image/gif, image/webp, image/svg+xml,
 *                 application/pdf, text/plain, text/csv,
 *                 application/vnd.ms-excel, application/vnd.openxmlformats-...
 */
