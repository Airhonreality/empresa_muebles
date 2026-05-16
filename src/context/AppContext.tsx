/**
 * 🏛️ ARTEFACTO: AppContext.tsx
 * ───────────────
 * CAPA: Context (State Bridge)
 * VERSIÓN: 4.0
 * COMMIT: P3-M2.3-ADR-SINGLE-HYDRATION
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Puente de hidratación entre InitialData (SSR) y MateriaStore (Client).
 * - Orquestación de despacho de acciones de persistencia.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Consumir InitialData en el montaje inicial.
 * - NEVER: Re-pedir datos al servidor si ya fueron inyectados via SSR.
 * - ALWAYS: Garantizar que el Registry se inicialice una sola vez.
 * 
 * 📜 ADR: [2026-05-15] SINGLE_SOURCE_HYDRATION
 * - DECISIÓN: Eliminar discoverCapabilities() y refreshStore() automáticos del useEffect.
 * - MOTIVO: Prevenir la triple hidratación y garantizar que el cliente nazca sincronizado con el servidor.
 * - IMPACTO: Reducción drástica de latencia en el primer renderizado y eliminación de inconsistencias visuales.
 */

'use client';

import React, { createContext, useContext, useMemo, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { initializeRegistry } from '@/lib/agnostic/init';
import { useDNAStore, useMateriaStore, useSystemStore } from '@/lib/agnostic/store';
import { registry } from '@/lib/agnostic/Registry';

export interface UIOverlay {
  type: 'SHEET' | 'DIALOG' | 'CONFIRM';
  title: string;
  component?: string;
  props?: any;
}

interface AppDispatch {
  saveItem: (context: string, payload: any) => Promise<any>;
  saveContext: (context: string, items: any[]) => Promise<any>;
  openOverlay: (overlay: UIOverlay) => void;
  closeOverlay: () => void;
  refreshStore: () => Promise<void>;
  bulkUpdate: (context: string, patch: any, filter: any) => Promise<void>;
}

const AppDispatchContext = createContext<AppDispatch | undefined>(undefined);

// 🏛️ Initialize Registry synchronously before React mounts to ensure catalog is available
initializeRegistry();

export function AppProvider({ children, initialData }: { children: React.ReactNode, initialData?: any }) {
  const { hydrate: hydrateDNA } = useDNAStore();
  const { hydrate: hydrateMateria, updateItem, setMateria } = useMateriaStore();
  const { setOverlay } = useSystemStore();

  // 🏛️ PHASE 1: ATOMIC HYDRATION (SSR -> Store)
  useEffect(() => {
    // 1. Consume InitialData if available
    if (initialData) {
      console.log('[SystemBoot] Consuming Sovereign InitialData...');
      hydrateDNA(initialData['page_routes'] || [], initialData['schema_definitions'] || []);
      hydrateMateria(initialData);

      // 3. Register SSR operations/capabilities if present
      const systemOps = initialData['system_operations'] || [];
      systemOps.forEach((op: any) => registry.registerOperation(op.data));
    }
  }, []); // Only once on mount

  const refreshStore = useCallback(async () => {
    try {
      const response = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'LIST' })
      });
      const result = await response.json();
      if (result.success && result.data) {
        hydrateDNA(result.data['page_routes'] || [], result.data['schema_definitions'] || []);
        hydrateMateria(result.data);
        toast.success('Realidad sincronizada');
      }
    } catch (e) {
      console.error('[AppContext] Store Refresh Failed:', e);
    }
  }, [hydrateDNA, hydrateMateria]);

  const saveItem = useCallback(async (context: string, payload: any) => {
    try {
      const response = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'WRITE', context, payload })
      });
      
      const result = await response.json();
      if (result.success && result.record) {
        updateItem(context, result.record);
        return result.record;
      }
      throw new Error(result.error || 'Write failed');
    } catch (e) {
      toast.error(`Error persistiendo item en ${context}`);
      throw e;
    }
  }, [updateItem]);

  const saveContext = useCallback(async (context: string, items: any[]) => {
    try {
      const response = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESTORE', context, payload: items })
      });
      
      const result = await response.json();
      if (result.success) {
        setMateria(context, items);
        return true;
      }
      throw new Error(result.error || 'Restore failed');
    } catch (e) {
      toast.error(`Error sincronizando contexto ${context}`);
      throw e;
    }
  }, [setMateria]);

  const bulkUpdate = useCallback(async (context: string, patch: any, filter: any) => {
    try {
      const response = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE', context, patch, filter })
      });
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Update failed');
      
      await refreshStore();
      toast.success('Materia alineada correctamente');
    } catch (e) {
      toast.error(`Error en la operación masiva en ${context}`);
      throw e;
    }
  }, [refreshStore]);

  const dispatchValue = useMemo(() => ({ 
    saveItem,
    saveContext,
    openOverlay: (o: UIOverlay) => setOverlay(o),
    closeOverlay: () => setOverlay(null),
    refreshStore,
    bulkUpdate
  }), [saveItem, saveContext, setOverlay, refreshStore, bulkUpdate]);

  return (
    <AppDispatchContext.Provider value={dispatchValue}>
      {children}
    </AppDispatchContext.Provider>
  );
}

export const useAppDispatch = () => {
  const ctx = useContext(AppDispatchContext);
  if (!ctx) throw new Error('useAppDispatch must be used within AppProvider');
  return ctx;
};

// Backward compatibility helpers
export const useAppState = () => {
  const { data } = useMateriaStore();
  const { routes, schemas } = useDNAStore();
  const system = useSystemStore();

  return {
    data,
    ui: {
      overlay: system.overlay
    },
    system: {
      ...system,
      routes,
      schemas
    },
    state: { // For older destructuring patterns
      data,
      ui: { overlay: system.overlay },
      system: { ...system, routes, schemas }
    }
  };
};

export const useAppContext = () => {
  const dispatch = useAppDispatch();
  return { ...dispatch };
};
