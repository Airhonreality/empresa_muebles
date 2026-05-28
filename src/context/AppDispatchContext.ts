'use client';

import { createContext, useContext } from 'react';

export interface UIOverlay {
  type: 'SHEET' | 'DIALOG' | 'CONFIRM';
  title: string;
  component?: string;
  props?: any;
}

export interface AppDispatch {
  saveItem: (namespace: string, payload: any, options?: { silent?: boolean }) => Promise<any>;
  saveContext: (namespace: string, items: any[]) => Promise<boolean>;
  deleteItem: (namespace: string, id: string) => Promise<void>;
  openOverlay: (overlay: UIOverlay) => void;
  closeOverlay: () => void;
  refreshStore: () => Promise<void>;
}

export const AppDispatchContext = createContext<AppDispatch | undefined>(undefined);

export function useAppDispatch() {
  const context = useContext(AppDispatchContext);
  if (!context) {
    throw new Error('useAppDispatch must be used within an AppProvider');
  }
  return context;
}
