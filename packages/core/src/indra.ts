/**
 * 🛠️ CORE_INDRA: DEFINITIONS & TYPES (v6.0 — STRICT CONTRACT)
 * =============================================================
 * Single source of truth for every type in the Agnostic System.
 * All `any` has been eliminated at the public API boundary.
 */

// ─── PRIMITIVES ──────────────────────────────────────────────────────────────

export interface DataItem {
  id: string;
  context: string;
  data: Record<string, unknown>;
  /** Populated by cloud strategies (Supabase). Ignored by local strategies. */
  created_at?: string;
  updated_at?: string;
  [key: string]: any; // Industrial flexibility for convenience properties
}

// ─── DATA STRATEGY (REMOVED) ────────────────────────────────────────────────
// The legacy DataStrategy has been replaced by the Universal Management Protocol (AgnosticBridge).
// See storage.ts for the new canonical contract.

// ─── OVERLAY ─────────────────────────────────────────────────────────────────

export interface OverlayConfig {
  type: 'SHEET' | 'DIALOG' | 'CONFIRM';
  title: string;
  description?: string;
  component?: string;
  props?: Record<string, unknown>;
  onConfirm?: () => void;
}

// ─── UNIFIED QUERY — DISCRIMINATED UNION ────────────────────────────────────

export type UnifiedQuery =
  | { action: 'READ';     context: string;    filters?: Record<string, unknown> }
  | { action: 'UPSERT';   context: string;    payload: Record<string, unknown> }
  | { action: 'DELETE';   context: string;    payload: { id: string } }
  | { action: 'NAVIGATE'; context?: undefined; payload: { path: string } }
  | { action: 'INTENT';   context: string;    payload?: Record<string, unknown> };

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export interface AgnosticUser {
  id: string;
  name: string;
  email?: string;
  role: string;
  [key: string]: unknown;
}

// ─── APP STATE ───────────────────────────────────────────────────────────────

export interface AppState {
  data: Record<string, DataItem[]>;
  user: any | null;
  ui: {
    overlay: OverlayConfig | null;
  };
  system: {
    isLoading: boolean;
    error: any;
    status: 'booting' | 'ready' | 'error';
    config: any;
    schemas: any[];
    routes: any[];
    currentPath: string;
    activeContext?: string;
    activeRecord?: { id: string; context: string } | null;
  };
}

export type Action =
  | { type: 'SET_DATA';         payload: { context: string; items: DataItem[] } }
  | { type: 'SET_SYSTEM_STATE'; payload: Partial<AppState['system']> }
  | { type: 'SET_AUTH';         payload: any };

// ─── UI BRIDGE ───────────────────────────────────────────────────────────────

export interface AgnosticUI {
  openSheet:  (title: string, moduleName: string, props?: Record<string, unknown>) => void;
  openDialog: (title: string, moduleName: string, props?: Record<string, unknown>) => void;
  confirm:    (title: string, description: string, onConfirm: () => void) => void;
  close:      () => void;
  renderAction: (type: 'CREATE' | 'SAVE' | 'DELETE' | 'CANCEL', props: { label?: string, onClick: () => void, className?: string }) => string;
  renderBelt?: (config: any) => any;
}

// ─── PUBLIC API CONTRACT ─────────────────────────────────────────────────────

export interface AgnosticAPI {
  /** Send an intent to the host. Always returns a resolved Promise (fire-and-hope pattern kept intentional). */
  dispatch:        (query: UnifiedQuery) => Promise<void>;
  /** Subscribe to context changes. Returns an unsubscribe function. */
  onUpdate:        (context: string, callback: (data: Record<string, DataItem[]>) => void) => () => void;
  getGlobalData:   (context: string) => DataItem[];
  getActiveRecord: () => DataItem | null;
  getContext:      () => string;
  getSchema:       (context?: string) => Record<string, unknown> | null;
  getBlockConfig:  () => Record<string, unknown>;
  getConfig:       (key: string) => any;
  renderIcon:      (name: string) => string;
  notify: {
    success: (msg: string) => void;
    error:   (msg: string) => void;
    loading: (msg: string) => void;
  };
  ui:        AgnosticUI;
  state:     AppState;
  user:      AgnosticUser | null;
  container?: HTMLElement;
}

// ─── SYSTEM CONFIG & PASSPORT ───────────────────────────────────────────────

export interface SystemPassport {
  project_identity: string;
  storage_strategy: 'LocalStrategy' | 'SupabaseStrategy' | 'GitHubStrategy';
  dna_strategy: 'local' | 'remote';
  home_slug?: string;
  app_name?: string;
  github_repo?: string;    // 'owner/repo' - NO es un secreto
  github_branch?: string;  // 'main' - NO es un secreto
}

// ─── DNA SCHEMAS ─────────────────────────────────────────────────────────────

export interface SchemaFieldConfig {
  relation?: {
    entity: string;
    parent_key: string;
    display_field?: string;
  };
  options?: Array<{ label: string; value: string }>;
  isPrimary?: boolean;
}

export interface SchemaField {
  id: string;
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'boolean' | 'textarea' | 'relation' | 'object' | 'array_of_objects';
  width?: 'full' | 'half' | 'third';
  section?: string;
  required?: boolean;
  readOnly?: boolean;
  isPrimary?: boolean;
  placeholder?: string;
  config?: SchemaFieldConfig;
  fields?: SchemaField[];  // recursivo para type 'object' o 'array_of_objects'
}

export type LayoutNodeType = 'frame' | 'field';

export interface LayoutNode {
  id: string;
  type: LayoutNodeType;
  field_key?: string;
  style?: Record<string, string>;
  children?: LayoutNode[];
}

export interface CollectionConfig {
  view: 'custom' | 'card' | 'grid' | 'timeline';
  item_layout?: LayoutNode[];
}

// ─── NODE MODEL v2 — Unified Parametric Compositor ───────────────────────────

export type RenderMode = 'canvas' | 'list' | 'form' | 'card' | 'action' | 'field' | 'sheet';

export interface NodeLayout {
  direction?: 'row' | 'column';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'between';
  justify?: 'start' | 'center' | 'end' | 'between';
  wrap?: boolean;
  gap?: number | string;     // number = px; string = CSS var ref e.g. "var(--gap-sm)"
  padding?: number | string;
  maxWidth?: number;
}

export interface Node {
  id: string;
  label: string;
  path?: string;
  layout: NodeLayout;
  render?: RenderMode;
  contexts: string[];
  context_filter?: Record<string, string[]>;
  field_key?: string;
  zap?: string;
  showLabel?: boolean;
  displayFormat?: string;
  visual?: Record<string, string>;
  children: Node[];
}

export interface RouteNode extends Node {
  path: string;
}

// ─── NODE MODEL v3 — Frame / Slot / Atom / Preset ────────────────────────────
// Pure CSS style object — camelCase React property names, no Tailwind classes.
// React applies numeric values as px for dimensional properties automatically.

export type NodeStyle = { [property: string]: string | number };

export type NodeKind = 'frame' | 'slot' | 'atom' | 'preset' | 'text' | 'instance';

export type PresetVariant =
  | 'sheet' | 'dialog' | 'popover' | 'card'
  | 'table' | 'form' | 'command'
  | 'tabs' | 'accordion';

export type SlotFilterOp = 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'in';

export interface SlotFilter {
  field: string;
  op: SlotFilterOp;
  value: string; // literal OR template: $parent.fieldKey, $route.param, $user.id
}

interface BaseNodeV3 {
  id: string;
  kind: NodeKind;
  label: string;
  style: NodeStyle;
  children: AnyNodeV3[];
}

export type DimMode = 'fixed' | 'hug' | 'fill';

export interface FrameNodeV3 extends BaseNodeV3 {
  kind: 'frame';
  path?: string;       // only on root frame (route node)
  /** @deprecated Use design.sizing.w.mode — see DESIGN_ENGINE_ROADMAP.md */
  widthMode?:  DimMode;
  /** @deprecated Use design.sizing.h.mode — see DESIGN_ENGINE_ROADMAP.md */
  heightMode?: DimMode;
  /** Phase 1 of DESIGN_ENGINE_ROADMAP. When present, compiler uses NodeDesign instead of style. */
  design?: NodeDesign;
}

export interface SlotNodeV3 extends BaseNodeV3 {
  kind: 'slot';
  source: string;             // schema name = data namespace
  filter?: SlotFilter;
  limit?: number | 'all';    // default 1 (single record); 'all' = list/repeat
  sort?: { field: string; dir: 'asc' | 'desc' };
}

export interface AtomNodeV3 extends BaseNodeV3 {
  kind: 'atom';
  field: string;              // schema field key — resolved from nearest SlotNodeV3 ancestor
  format?: 'text' | 'badge' | 'currency' | 'date' | 'number' | 'boolean' | 'nav-link';
  showLabel?: boolean;        // default true
}

export interface PresetNodeV3 extends BaseNodeV3 {
  kind: 'preset';
  variant: PresetVariant;
  config: Record<string, unknown>; // variant-specific config (NO triggerLabel — trigger is a child node)
  triggerId?: string;               // ID of the child node that acts as interactive trigger
}

export interface TextNodeV3 {
  kind: 'text';
  id: string;
  label: string;
  content: string;
  style: NodeStyle;
  children: never[];
}

export interface InstanceNodeV3 {
  kind: 'instance';
  id: string;
  label: string;
  sourceId: string;             // ID of the component DataItem in namespace 'components'
  overrides: Record<string, {   // keyed by nodeId within the source tree
    content?: string;
    style?: Partial<NodeStyle>;
  }>;
  style: NodeStyle;
  children: never[];
}

export type AnyNodeV3 = FrameNodeV3 | SlotNodeV3 | AtomNodeV3 | PresetNodeV3 | TextNodeV3 | InstanceNodeV3;

// ─── NODE DESIGN v1 — Semantic Design Model ───────────────────────────────────
// See DESIGN_ENGINE_ROADMAP.md — Phase 0.
// CSS is a COMPILER OUTPUT from this model, not the stored model.
// The compiler (src/lib/agnostic/compiler.ts) is the only place that reads
// NodeDesign and emits CSSProperties. Renderers never read NodeDesign directly.

// ── Fill ──────────────────────────────────────────────────────────────────────

export interface GradientStop {
  /** Only solid or token fills are valid inside a gradient stop. */
  color: { kind: 'solid'; color: string } | { kind: 'token'; ref: string };
  position: number; // 0–100 (%)
}

export type FillValue =
  | { kind: 'none' }
  | { kind: 'solid';           color: string }
  | { kind: 'token';           ref: string }            // → hsl(var(--ref))
  | { kind: 'linear-gradient'; angle: number; stops: GradientStop[] }
  | { kind: 'radial-gradient'; stops: GradientStop[] }
  | { kind: 'image';           url: string; size: 'cover' | 'contain' | 'fill' | 'none'; position: string };

// ── Stroke ────────────────────────────────────────────────────────────────────

export type StrokeStyle = 'solid' | 'dashed' | 'dotted';

export interface StrokeValue {
  color: { kind: 'solid'; color: string } | { kind: 'token'; ref: string };
  width: number;       // px
  style: StrokeStyle;
}

// ── Sizing ────────────────────────────────────────────────────────────────────

export type SizeValue =
  | { mode: 'fixed'; value: number; unit: 'px' | 'rem' | '%' }
  | { mode: 'hug' }   // → width/height: fit-content
  | { mode: 'fill' }; // → flex-grow (main axis) or align-self:stretch (cross axis)

// ── Spacing ───────────────────────────────────────────────────────────────────

export interface SpacingValue {
  top:    number; // px
  right:  number;
  bottom: number;
  left:   number;
}

// ── Layout ────────────────────────────────────────────────────────────────────

export type AlignValue   = 'start' | 'center' | 'end' | 'stretch';
export type JustifyValue = 'start' | 'center' | 'end' | 'between' | 'evenly';

export type LayoutValue =
  | { mode: 'none' }
  | { mode: 'flex-row' | 'flex-col';
      align:   AlignValue;
      justify: JustifyValue;
      gap:     number;   // px
      wrap:    boolean;
    };

/** Narrowed LayoutValue — guaranteed to be a flex container. */
export type FlexLayout = LayoutValue & { mode: 'flex-row' | 'flex-col' };

// ── Corner radius ─────────────────────────────────────────────────────────────

export type CornerRadius =
  | number                                               // uniform (px)
  | { tl: number; tr: number; br: number; bl: number }; // per-corner (px)

// ── NodeDesign ────────────────────────────────────────────────────────────────

export interface NodeDesign {
  sizing: {
    w:     SizeValue;
    h:     SizeValue;
    minW?: number;  // px — optional constraint
    maxW?: number;  // px — optional constraint
  };
  layout:       LayoutValue;
  spacing:      SpacingValue;
  fill:         FillValue;
  stroke?:      StrokeValue;
  cornerRadius: CornerRadius;
  opacity:      number;                                   // 0–1
  overflow:     'visible' | 'hidden' | 'auto' | 'scroll';
  shadow?:      string;                                   // v2 will be typed
  blend?:       string;                                   // v2 will be typed
  /** Not shown in the standard panel. For CSS properties with no NodeDesign equivalent. */
  _rawCSS?:     Record<string, string | number>;
}

// ── Compiler contract ─────────────────────────────────────────────────────────

/** What the parent frame exposes to its children for Fill/Hug resolution. */
export interface CompilerContext {
  /** null when there is no flex parent. */
  parentLayout: FlexLayout | null;
}

// ── Default NodeDesign ────────────────────────────────────────────────────────

export const DEFAULT_NODE_DESIGN: NodeDesign = {
  sizing:       { w: { mode: 'hug' }, h: { mode: 'hug' } },
  layout:       { mode: 'none' },
  spacing:      { top: 0, right: 0, bottom: 0, left: 0 },
  fill:         { kind: 'none' },
  cornerRadius: 0,
  opacity:      1,
  overflow:     'visible',
};

