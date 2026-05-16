/**
 * 🏛️ ARTEFACTO: store.ts
 * ────────────
 * CAPA: Lib (Infrastructure / State)
 * VERSIÓN: 8.0 (Deterministic Edition)
 * COMMIT: P3-M1.1-ATOMIC-STATE-FRAGMENTATION
 * ADR: [adr_v8_0_deterministic_state.md]
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Implementación de tiendas atómicas vía Zustand (SSOT Universal).
 * - Separación estricta entre DNA (Esquemas), Materia (Datos) y System (Orquestación).
 * - Soporte para proyecciones reactivas y selectores deterministas.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - AXIOM-1: Independencia absoluta entre la UI y el ciclo de vida de los datos.
 * - AXIOM-2: Minimización de información; los stores solo exponen proyecciones necesarias.
 * - NEVER: Almacenar lógica de negocio compleja (delegar a AgnosticLogicEngine).
 */

/**
 * 🏺 LA FUENTE: Zustand Atomic Stores
 * ─────────────────────────────────
 * AXIOMATIC_CONTRACT:
 * - MUST: Separar el estado en capas atómicas (DNA, Materia, System).
 * - MUST: Usar selectores reactivos para prevenir re-renders innecesarios.
 * - NEVER: Mutar el estado directamente (usar funciones set).
 * 
 * ADR: Se migra de AppContext monolítico a Zustand Atómico (v8.0) para 
 * permitir sincronización granular y orquestación contextual in-situ.
 * 
 * RELATIONSHIPS:
 * - DNAStore: Los planos (Schemas, Routes).
 * - MateriaStore: Los datos (Business Entities).
 * - SystemStore: La orquestación (Loading, EditMode).
 */
import { create } from 'zustand';
import { DataItem } from '@agnostic/core';

// --- 🧬 DNA STORE: Los Planos del Sistema ---
interface DNAState {
  routes: DataItem[];
  schemas: DataItem[];
  setDNA: (routes: DataItem[], schemas: DataItem[]) => void;
  setRoutes: (routes: DataItem[]) => void;
  setSchemas: (schemas: DataItem[]) => void;
  hydrate: (routes: DataItem[], schemas: DataItem[]) => void;
}

export const useDNAStore = create<DNAState>((set) => ({
  routes: [],
  schemas: [],
  setDNA: (routes, schemas) => set({ routes, schemas }),
  setRoutes: (routes) => set({ routes }),
  setSchemas: (schemas) => set({ schemas }),
  hydrate: (routes: DataItem[], schemas: DataItem[]) => set({ routes, schemas }),
}));

// --- 🧪 MATERIA STORE: La Realidad de los Datos ---
interface MateriaState {
  data: Record<string, DataItem[]>;
  setMateria: (context: string, items: DataItem[]) => void;
  updateItem: (context: string, item: DataItem) => void;
  removeItem: (context: string, id: string) => void;
  hydrate: (data: Record<string, DataItem[]>) => void;
}

export const useMateriaStore = create<MateriaState>((set) => ({
  data: {},
  setMateria: (context, items) => set((state) => ({
    data: { ...state.data, [context]: items }
  })),
  updateItem: (context, item) => set((state) => {
    const items = state.data[context] || [];
    const index = items.findIndex((i) => i.id === item.id);
    const newItems = index >= 0 
      ? [...items.slice(0, index), item, ...items.slice(index + 1)]
      : [...items, item];
    return { data: { ...state.data, [context]: newItems } };
  }),
  removeItem: (context, id) => set((state) => ({
    data: {
      ...state.data,
      [context]: (state.data[context] || []).filter((i) => i.id !== id)
    }
  })),
  hydrate: (data: Record<string, DataItem[]>) => set({ data }),
}));

// --- ⚙️ SYSTEM STORE: El Centinela de Orquestación ---
/**
 * AXIOMATIC_CONTRACT:
 * - MUST: Gestionar el estado global de operación (Loading, Navigation).
 * - MUST: Controlar la visibilidad de la Capa de Soberanía (EditMode).
 * - NEVER: Contener lógica de negocio (delegar a MateriaStore).
 */
interface SystemState {
  integrity: any | null;
  user: any | null;
  overlay: any | null;
  setActiveRecord: (id: string | null, context: string) => void;
  setLoading: (loading: boolean) => void;
  setNavigation: (path: string) => void;
  setEditMode: (enabled: boolean) => void;
  setActiveEditId: (id: string | null) => void;
  setIntegrity: (report: any) => void;
  setUser: (user: any) => void;
  setOverlay: (overlay: any | null) => void;
}

export const useSystemStore = create<SystemState>((set) => ({
  activeRecordId: null,
  activeContext: 'system',
  isLoading: true,
  currentPath: '/',
  isEditMode: false,
  activeEditId: null,
  integrity: null,
  user: null,
  overlay: null,
  setActiveRecord: (id, context) => set({ activeRecordId: id, activeContext: context }),
  setLoading: (loading) => set({ isLoading: loading }),
  setNavigation: (currentPath) => set({ currentPath }),
  setEditMode: (isEditMode) => set({ isEditMode }),
  setActiveEditId: (activeEditId) => set({ activeEditId }),
  setIntegrity: (integrity) => set({ integrity }),
  setUser: (user) => set({ user }),
  setOverlay: (overlay) => set({ overlay }),
}));

// --- 🏹 REACTIVE SELECTORS: El Puente Determinista ---
export const useActiveRoute = () => {
  const path = useSystemStore((s) => s.currentPath) || '';
  const routes = useDNAStore((s) => s.routes);

  return routes.find((r: any) => {
    const rawPath = r?.data?.path;
    if (typeof rawPath !== 'string') return false;
    
    const routePath = rawPath.split('/').filter(Boolean);
    const urlPath = path.split('/').filter(Boolean);
    
    if (routePath.length !== urlPath.length) return false;
    
    return routePath.every((segment: string, i: number) => {
      return segment.startsWith(':') || segment === urlPath[i];
    });
  });
};

export const useActiveRecord = () => {
  const { activeRecordId, activeContext, currentPath } = useSystemStore();
  const materia = useMateriaStore((s) => s.data);

  // 🏛️ DETERMINISTIC ANCHOR: If we have an active ID, that's the truth.
  if (activeRecordId && activeContext) {
    const record = (materia[activeContext] || []).find((r: any) => r.id === activeRecordId);
    if (record) return record;
  }

  // 🛰️ HYDRATION FALLBACK: Lookup by slug from URL (Initial load only)
  const route = useActiveRoute();
  const routeContext = (route?.data?.context || route?.context) as string | undefined;
  const activeSlug = currentPath.split('/').pop();

  if (!routeContext || !activeSlug || activeSlug === 'create-project') return null;

  const records = (materia[routeContext] || []) as any[];
  return records.find((r: any) => r?.data?._slug === activeSlug);
};
