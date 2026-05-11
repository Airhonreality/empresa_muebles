'use client';

/**
 * 🏛️ AGNOSTIC CONTEXT (The Nervous System)
 * ───────────────
 * AXIOMATIC_CONTRACT:
 * - MUST: Handle Data (Materia), Identity (User), and UI State (Overlays).
 * - NEVER: Create infinite loops between Context and Zustand Stores.
 */

import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { initializeRegistry } from '@/lib/agnostic/init';
import { useDNAStore, useMateriaStore } from '@/lib/agnostic/store';

initializeRegistry();

export interface UIOverlay {
  type: 'SHEET' | 'DIALOG' | 'CONFIRM';
  title: string;
  component?: string;
  props?: any;
}

interface ExtendedAppState {
  data: Record<string, any[]>;
  user: any | null;
  ui: { overlay: UIOverlay | null; };
  system: { isLoading: boolean; error: any; };
}

type LocalAction = 
  | { type: 'SET_DATA', payload: { context: string, items: any[] } }
  | { type: 'SET_USER', payload: any }
  | { type: 'SET_LOADING', payload: boolean }
  | { type: 'OPEN_OVERLAY', payload: UIOverlay }
  | { type: 'CLOSE_OVERLAY' };

function appReducer(state: ExtendedAppState, action: LocalAction): ExtendedAppState {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, data: { ...state.data, [action.payload.context]: action.payload.items } };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_LOADING':
      return { ...state, system: { ...state.system, isLoading: action.payload } };
    case 'OPEN_OVERLAY':
      return { ...state, ui: { ...state.ui, overlay: action.payload } };
    case 'CLOSE_OVERLAY':
      return { ...state, ui: { ...state.ui, overlay: null } };
    default:
      return state;
  }
}

const AppStateContext = createContext<ExtendedAppState | undefined>(undefined);
const AppDispatchContext = createContext<any>(undefined);

export function AppProvider({ children, initialData }: { children: React.ReactNode, initialData?: any }) {
  const [state, dispatch] = useReducer(appReducer, {
    data: initialData || {},
    user: null,
    ui: { overlay: null },
    system: { isLoading: false, error: null }
  });

  const { setRoutes, setSchemas } = useDNAStore();
  const { setMateria } = useMateriaStore();

  // 🌊 INITIAL HYDRATION: Feed the Stores with initial silo data
  useEffect(() => {
    if (initialData) {
      Object.entries(initialData).forEach(([context, items]) => {
        if (context === 'page_routes') setRoutes(items as any[]);
        if (context === 'schema_definitions') setSchemas(items as any[]);
        if (!context.startsWith('_')) setMateria(context, items as any[]);
      });
    }
  }, [initialData, setRoutes, setSchemas, setMateria]);

  const syncContext = useCallback(async (context: string, items: any[]) => {
    try {
      const response = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SYNC_CONTEXT', context, payload: items })
      });
      const result = await response.json();
      if (result.success) {
        dispatch({ type: 'SET_DATA', payload: { context, items } });
        // Sincronía manual segura
        if (context === 'page_routes') setRoutes(items);
        if (context === 'schema_definitions') setSchemas(items);
        setMateria(context, items);
      }
    } catch (e) {
      toast.error('Error de sincronización');
    }
  }, [setRoutes, setSchemas, setMateria]);

  const dispatchValue = useMemo(() => ({ 
    syncContext,
    openOverlay: (o: UIOverlay) => dispatch({ type: 'OPEN_OVERLAY', payload: o }),
    closeOverlay: () => dispatch({ type: 'CLOSE_OVERLAY' }),
    dispatch 
  }), [syncContext]);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatchValue}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export const useAppState = () => {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState error');
  return { state: ctx, ui: ctx.ui, user: ctx.user, system: ctx.system };
};

export const useAppDispatch = () => {
  const ctx = useContext(AppDispatchContext);
  if (!ctx) throw new Error('useAppDispatch error');
  return ctx;
};
