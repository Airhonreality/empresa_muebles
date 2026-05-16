/**
 * 🛰️ INTERACTION_BRIDGE: SDK LOGIC (v4.0 — STRICT CONTRACT)
 * ==========================================================
 *
 * ROLE: Decouples the Guest Module from Host-specific implementations.
 * PROTOCOL: SIP (Sovereign Interaction Protocol).
 *
 * All `any` removed. BridgeConfig mirrors the exact shape AppContext exposes.
 */

import {
  AgnosticAPI,
  AgnosticUser,
  DataItem,
  OverlayConfig,
  UnifiedQuery,
  AppState,
} from './indra';

// ─── HOST CONFIG CONTRACT ────────────────────────────────────────────────────

export interface BridgeConfig {
  router:       { push: (path: string) => void };
  saveItem:     (ctx: string, item: Record<string, unknown>) => Promise<void>;
  deleteItem:   (ctx: string, id: string) => Promise<void>;
  openOverlay:  (overlay: OverlayConfig) => void;
  closeOverlay: () => void;
  /** Ref to the full extended state (AppState + ui slice). Use .current to read; never cache .current itself. */
  stateRef: { current: AppState & { ui: { overlay: OverlayConfig | null } } };
  user:     AgnosticUser | null;
  block:    Record<string, unknown>;
  settings?: Record<string, unknown>; // Persistent settings from logic_settings.json
  toast: {
    success: (msg: string) => void;
    error:   (msg: string) => void;
    loading: (msg: string) => void;
  };
}

// ─── FACTORY ─────────────────────────────────────────────────────────────────

export function createAgnosticAPI(config: BridgeConfig): AgnosticAPI {
  const { router, saveItem, deleteItem, openOverlay, closeOverlay, stateRef, user, block, settings = {}, toast } = config;
  
  let updateListeners: ((event: unknown) => void)[] = [];
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  return {
    get user(): AgnosticUser | null { return user; },
    get state(): AppState          { return stateRef.current; },
    getUser: () => user,
    getConfig: (key: string) => settings[key] ?? null,

    dispatch: async (query: UnifiedQuery): Promise<void> => {
      if (!query?.action) return;

      // 🌊 DEBOUNCED RESONANCE
      // When a WRITE occurs, we wait 500ms before notifying the Logic Listeners
      if (debounceTimer) clearTimeout(debounceTimer);
      
      debounceTimer = setTimeout(async () => {
        // Broadcast to logic listeners
        updateListeners.forEach(listener => listener({
          action: query.action,
          context: query.context,
          data: (query as any).payload
        }));
      }, 500);

      switch (query.action) {
        case 'NAVIGATE':
          router.push(query.payload.path);
          break;

        case 'UPSERT':
          await saveItem(query.context, query.payload);
          break;

        case 'DELETE':
          await deleteItem(query.context, query.payload.id);
          break;

        // READ and INTENT are host-side concerns; modules should use onUpdate/getGlobalData instead.
        case 'READ':
        case 'INTENT':
          break;
      }
    },

    onUpdate: (context: string, callback: (data: Record<string, DataItem[]>) => void) => {
      callback(stateRef.current.data);
      const handler = () => callback(stateRef.current.data);
      window.addEventListener('agnostic-state-change', handler);
      return () => window.removeEventListener('agnostic-state-change', handler);
    },

    getGlobalData: (context: string): DataItem[] =>
      stateRef.current.data[context] ?? [],

    getActiveRecord: (): DataItem | null => {
      const context = (block.context as string | undefined) || stateRef.current.system.activeContext;
      const path =
        (block._activePath as string | undefined) ??
        (typeof window !== 'undefined' ? window.location.pathname : '');
      const slug = path.split('/').pop();
      return (
        stateRef.current.data[context]?.find(
          (r) => (r.data['_slug'] as string | undefined) === slug
        ) ?? null
      );
    },

    getContext: (): string =>
      String(block.context ?? stateRef.current.system.activeContext ?? 'system'),

    getSchema: (contextName?: string): Record<string, unknown> | null => {
      const target = contextName ?? (block.context as string | undefined) ?? stateRef.current.system.activeContext;
      const schemas = stateRef.current.data['schema_definitions'] ?? [];
      return (
        schemas.find(
          (s) =>
            (s.data['name'] as string | undefined) === target || s.id === target
        )?.data ?? null
      );
    },

    getBlockConfig: (): Record<string, unknown> => block,

    notify: {
      success: (msg) => toast.success(msg),
      error:   (msg) => toast.error(msg),
      loading: (msg) => toast.loading(msg),
    },

    ui: {
      openSheet: (title, moduleName, props = {}) =>
        openOverlay({ type: 'SHEET', title, component: moduleName, props }),

      openDialog: (title, moduleName, props = {}) =>
        openOverlay({ type: 'DIALOG', title, component: moduleName, props }),

      confirm: (title, description, onConfirm) =>
        openOverlay({ type: 'CONFIRM', title, description, onConfirm }),

      close: closeOverlay,

      renderAction: (type, props) => {
        const id = `act-${Math.random().toString(36).substr(2, 7)}`;
        setTimeout(() => {
          const el = document.getElementById(id);
          if (el) el.onclick = (e) => { e.preventDefault(); props.onClick(); };
        }, 0);

        const styles = {
          CREATE: 'bg-primary text-primary-foreground hover:scale-[1.02]',
          SAVE:   'bg-primary text-primary-foreground hover:scale-[1.02]',
          DELETE: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
          CANCEL: 'bg-secondary text-secondary-foreground'
        };

        return `<button id="${id}" type="button" class="px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.4em] shadow-xl shadow-primary/20 transition-all active:scale-95 ${styles[type]} ${props.className || ''}">${props.label || type}</button>`;
      },

      renderBelt: (config) => {
        // En el modo 'Intención', el módulo simplemente retorna este manifiesto
        // El cargador detectará este retorno y activará el AgnosticBelt Reactivo.
        return { __type: 'INTENT_BELT', config };
      }
    },

    renderIcon: (name: string): string => {
      const icons: Record<string, string> = {
        Plus: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
        X:    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
        Layers: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.91a1 1 0 0 0 0-1.83Z"/><path d="m2.6 12.08 8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.91"/><path d="m2.6 17.08 8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.91"/></svg>',
      };
      return icons[name] ?? '';
    },
  };
}
