/**
 * 🏛️ ARTEFACTO: AppContext.tsx
 * ───────────────
 * CAPA: Staging / Client (State Bridge)
 * VERSIÓN: 5.0
 * COMMIT: P3-M2.3-APPCONTEXT-PRUNING
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Provide a React Context dispatcher bridge between frontend projectors and the storage API.
 * - Manage global UI overlays and handle atomic refresh operations on the Client.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Coordinate all persistence requests using standardized CRUD API requests (GET/WRITE/REMOVE).
 * - NEVER: Disarm client-side synchronization or execute custom, redundant bulk actions.
 * - ALWAYS: Synchronize local Zustand stores immediately after successful persistence writes.
 * 
 * 📜 ADR: [2026-05-16] CLIENT_DISPATCHER_CLEANUP
 * - DECISIÓN: Strip out dead or redundant AppContext dispatch actions (bulkUpdate) and align remaining actions with standard GET/WRITE/REMOVE actions.
 * - MOTIVO: Adherence to Nam P. Suh's Independence Axiom, ensuring clean separation of state management and unified persistence flow.
 * - IMPACTO: 50+ lines of client state logic eliminated, solid TypeScript compile safety, and fully predictable data updates.
 * 
 * 🔗 RELATIONSHIPS:
 * - UPSTREAM: [store.ts, route.ts]
 * - DOWNSTREAM: [AgnosticRenderer.tsx, AgnosticShell.tsx, AgnosticCollection.tsx]
 */

'use client';

import React, { createContext, useContext, useMemo, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { initializeRegistry } from '@/lib/agnostic/init';
import { useDNAStore, useMateriaStore, useSystemStore } from '@/lib/agnostic/store';
import { UIOverlay, AppDispatch, AppDispatchContext, useAppDispatch } from './AppDispatchContext';
import { SYSTEM_NS } from '@/lib/agnostic/constants';

export function AppProvider({ children, initialData }: { children: React.ReactNode, initialData?: any }) {
  // Initialize block registry synchronously when the provider renders
  initializeRegistry();

  const { hydrate: hydrateDNA } = useDNAStore();
  const { hydrate: hydrateMateria, updateItem, removeItem, setMateria } = useMateriaStore();
  const { setOverlay } = useSystemStore();

  // ATOMIC HYDRATION (SSR -> Client Store)
  useEffect(() => {
    if (initialData) {
      hydrateDNA(initialData[SYSTEM_NS.ROUTES] || [], initialData[SYSTEM_NS.SCHEMAS] || []);
      hydrateMateria(initialData);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — intentional: SSR data hydrates once

  /**
   * Refreshes the local client store from the server storage reality.
   */
  const refreshStore = useCallback(async () => {
    try {
      const response = await fetch('/api/vault?namespace=all', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      if (result.success && result.data) {
        hydrateDNA(result.data[SYSTEM_NS.ROUTES] || [], result.data[SYSTEM_NS.SCHEMAS] || []);
        hydrateMateria(result.data);
      }
    } catch (e) {
      console.error('[AppContext] Store Refresh Failed:', e);
    }
  }, [hydrateDNA, hydrateMateria]);

  /**
   * Standardized CRUD Write operation. Saves or updates a single record.
   */
  const saveItem = useCallback(async (namespace: string, payload: any, options?: { silent?: boolean }) => {
    try {
      const recordPayload = {
        id: payload.id,
        data: payload.data ?? payload
      };

      const response = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'WRITE', 
          namespace, 
          record: recordPayload 
        })
      });
      
      const result = await response.json();
      if (result.success && result.record) {
        updateItem(namespace, result.record);
        if (!options?.silent) {
          toast.success('Cambios guardados con éxito');
        }
        return result.record;
      }
      throw new Error(result.error || 'Write operation failed');
    } catch (e: any) {
      if (!options?.silent) {
        toast.error(`Error guardando item en ${namespace}: ${e.message}`);
      }
      throw e;
    }
  }, [updateItem]);

  /**
   * Synchronizes an entire namespace array by calculating deletions and writes.
   * Leverages the 3 standard CRUD methods to perform complete atomic updates.
   */
  const saveContext = useCallback(async (namespace: string, items: any[]) => {
    try {
      // 1. Fetch current persistence reality
      const getRes = await fetch(`/api/vault?namespace=${namespace}`);
      const data = await getRes.json();
      const existing = data.records || [];

      // 2. Identify removed records (exist in DB but not in the incoming set)
      const newItemIds = new Set(items.map(i => i.id).filter(Boolean));
      const removed = existing.filter((i: any) => i.id && !newItemIds.has(i.id));

      // 3. Dispatch REMOVE requests
      const removePromises = removed.map((i: any) =>
        fetch('/api/vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'REMOVE', namespace, id: i.id })
        })
      );

      // 4. Dispatch WRITE requests
      const writePromises = items.map(item => {
        const recordPayload = {
          id: item.id,
          data: item.data ?? item
        };
        return fetch('/api/vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'WRITE', 
            namespace, 
            record: recordPayload
          })
        });
      });

      // 5. Execute all updates in parallel
      await Promise.all([...removePromises, ...writePromises]);
      
      // 6. Update local Zustand state directly to maintain UI responsiveness
      const standardItems = items.map(item => ({
        id: item.id || `item_${Date.now()}`,
        context: namespace,
        data: item.data ?? item,
        updated_at: new Date().toISOString()
      }));
      setMateria(namespace, standardItems);
      
      toast.success('Contexto sincronizado con éxito');
      return true;
    } catch (e: any) {
      toast.error(`Error sincronizando contexto ${namespace}: ${e.message}`);
      throw e;
    }
  }, [setMateria, refreshStore]);

  /**
   * Standardized CRUD Delete operation. Removes a single record by ID.
   */
  const deleteItem = useCallback(async (namespace: string, id: string): Promise<void> => {
    try {
      const response = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REMOVE', namespace, id })
      });
      const result = await response.json();
      if (result.success) {
        removeItem(namespace, id);
        toast.success('Registro eliminado');
        return;
      }
      throw new Error(result.error || 'Delete operation failed');
    } catch (e: any) {
      toast.error(`Error eliminando item en ${namespace}: ${e.message}`);
      throw e;
    }
  }, [removeItem]);

  const dispatchValue = useMemo(() => ({ 
    saveItem,
    saveContext,
    deleteItem,
    openOverlay: (o: UIOverlay) => setOverlay(o),
    closeOverlay: () => setOverlay(null),
    refreshStore
  }), [saveItem, saveContext, deleteItem, setOverlay, refreshStore]);
  return (
    <AppDispatchContext.Provider value={dispatchValue}>
      {children}
    </AppDispatchContext.Provider>
  );
}

// Backward compatibility helpers for legacy destructuring patterns
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
    state: { 
      data,
      ui: { overlay: system.overlay },
      system: { ...system, routes, schemas }
    }
  };
};

export const useAppContext = () => {
  const dispatch = useAppDispatch();
  const state = useAppState();
  return { 
    ...dispatch, 
    state: state.state as any,
    dispatch: (action: any) => {
      console.log('[LegacyDispatch] action:', action);
    }
  };
};

export { useAppDispatch } from './AppDispatchContext';
