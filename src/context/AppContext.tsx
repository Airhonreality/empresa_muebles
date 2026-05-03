'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import type { AppState, DataItem, FieldDefinition, SchemaDefinition } from '@/core/types';

type Action =
  | { type: 'SET_DB'; payload: Record<string, DataItem[]> }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AppState = {
  system: { config: {}, schemas: [], isLoading: true },
  data: {},
};

function parseDB(db: Record<string, DataItem[]>): AppState {
  const configItems = db['system_config'] ?? [];
  const config = configItems.reduce<Record<string, string>>((acc, item) => {
    return { ...acc, ...(item.data as Record<string, string>) };
  }, {});

  const schemaItems = db['schema_definitions'] ?? [];
  const schemas: SchemaDefinition[] = schemaItems.map(item => ({
    id: item.id,
    name: item.data.name as string,
    fields: (item.data.fields as FieldDefinition[]) ?? [],
  }));

  return { system: { config, schemas, isLoading: false }, data: db };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_DB':
      return parseDB(action.payload);
    case 'SET_LOADING':
      return { ...state, system: { ...state.system, isLoading: action.payload } };
    default:
      return state;
  }
}

interface AppStateContextType {
  state: AppState;
}

interface AppDispatchContextType {
  saveItem: (context: string, item: Omit<DataItem, 'created_at' | 'updated_at'>) => Promise<void>;
  deleteItem: (context: string, id: string) => Promise<void>;
  dispatch: React.Dispatch<Action>;
}

const AppStateContext = createContext<AppStateContextType | null>(null);
const AppDispatchContext = createContext<AppDispatchContextType | null>(null);

/**
 * AppProvider (Next.js 15 Optimized)
 * Receives initialData from the Server Component to eliminate client-side hydration waterfall.
 */
export function AppProvider({ 
  children, 
  initialData 
}: { 
  children: React.ReactNode, 
  initialData?: Record<string, DataItem[]> 
}) {
  // Initialize state with initialData if provided (Server-Side Injection)
  const [state, dispatch] = useReducer(reducer, initialData ? parseDB(initialData) : initialState);

  // Sync effect (only runs if initialData was not provided or for re-syncing)
  useEffect(() => {
    if (!initialData) {
      async function load() {
        try {
          const res = await fetch('/api/vault');
          if (res.ok) {
            const db = (await res.json()) as Record<string, DataItem[]>;
            dispatch({ type: 'SET_DB', payload: db });
          }
        } catch (err) {
          console.error('[AppContext]', err);
        }
      }
      load();
    }
  }, [initialData]);

  const saveItem = useCallback(
    async (context: string, item: Omit<DataItem, 'created_at' | 'updated_at'>) => {
      const now = new Date().toISOString();
      const existingItems = state.data[context] ?? [];
      const existingItem = existingItems.find(i => i.id === item.id);
      const fullItem: DataItem = {
        ...item,
        context,
        created_at: existingItem?.created_at ?? now,
        updated_at: now,
      };

      const newItems = existingItem
        ? existingItems.map(i => (i.id === fullItem.id ? fullItem : i))
        : [...existingItems, fullItem];

      const newDB = { ...state.data, [context]: newItems };
      dispatch({ type: 'SET_DB', payload: newDB });

      fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDB),
      }).catch(err => console.error('[CorePersistence]', err));
    },
    [state.data]
  );

  const deleteItem = useCallback(
    async (context: string, id: string) => {
      const newDB = {
        ...state.data,
        [context]: (state.data[context] ?? []).filter(i => i.id !== id),
      };
      dispatch({ type: 'SET_DB', payload: newDB });

      fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDB),
      }).catch(err => console.error('[CorePersistence]', err));
    },
    [state.data]
  );

  const stateValue = useMemo(() => ({ state }), [state]);
  const dispatchValue = useMemo(() => ({ saveItem, deleteItem, dispatch }), [saveItem, deleteItem]);

  return (
    <AppStateContext.Provider value={stateValue}>
      <AppDispatchContext.Provider value={dispatchValue}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}

export function useAppDispatch() {
  const ctx = useContext(AppDispatchContext);
  if (!ctx) throw new Error('useAppDispatch must be used within AppProvider');
  return ctx;
}

export function useAppContext() {
  const { state } = useAppState();
  const dispatchProps = useAppDispatch();
  return { state, ...dispatchProps };
}
