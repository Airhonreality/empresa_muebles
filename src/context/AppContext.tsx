'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
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

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  saveItem: (context: string, item: Omit<DataItem, 'created_at' | 'updated_at'>) => Promise<void>;
  deleteItem: (context: string, id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/vault');
        if (!res.ok) throw new Error('Failed to load database');
        const db = (await res.json()) as Record<string, DataItem[]>;
        dispatch({ type: 'SET_DB', payload: db });
      } catch (err) {
        console.error('[AppContext]', err);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
    load();
  }, []);

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

      await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDB),
      });
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

      await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDB),
      });
    },
    [state.data]
  );

  return (
    <AppContext.Provider value={{ state, dispatch, saveItem, deleteItem }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
