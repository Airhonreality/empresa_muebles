'use client';

import React from 'react';
import { useAppState } from '@/context/AppContext';

/**
 * Agnostic Google Login (Canon v1.0)
 * 
 * Projects a Google Login button ONLY if the current tenant 
 * has a googleClientId configured in its DNA.
 */
export function AgnosticGoogleLogin() {
  const { state } = useAppState();
  const clientId = (state.system as any).dna?.googleClientId;

  if (!clientId) return null;

  return (
    <div className="space-y-4">
      <button 
        onClick={() => console.log('Init Google Auth with:', clientId)}
        className="w-full flex items-center justify-center gap-3 bg-white text-zinc-900 border border-zinc-200 rounded-2xl py-4 font-bold hover:bg-zinc-50 transition-all shadow-sm"
      >
        <svg width="20" height="20" viewBox="0 0 20 20">
          <path d="M19.6 10.23c0-.65-.06-1.27-.16-1.88h-9.21v3.56h5.26c-.23 1.23-.92 2.27-1.97 2.97v2.46h3.19c1.86-1.72 2.93-4.25 2.93-7.11z" fill="#4285F4"/>
          <path d="M10.23 19.77c2.64 0 4.85-.87 6.47-2.37l-3.19-2.46c-.88.59-2.02.94-3.28.94-2.53 0-4.67-1.71-5.43-4.01H1.53v2.54c1.62 3.22 4.96 5.36 8.7 5.36z" fill="#34A853"/>
          <path d="M4.8 11.87c-.19-.58-.3-1.2-.3-1.84s.11-1.26.3-1.84V5.65H1.53c-.63 1.27-1 2.7-1 4.22s.37 2.95 1 4.22l3.27-2.22z" fill="#FBBC05"/>
          <path d="M10.23 3.75c1.43 0 2.72.49 3.73 1.45l2.8-2.8C14.96.96 12.82 0 10.23 0 6.49 0 3.15 2.14 1.53 5.36l3.27 2.54c.76-2.3 2.9-4.15 5.43-4.15z" fill="#EA4335"/>
        </svg>
        Continuar con Google
      </button>
      <p className="text-[9px] text-center text-muted-foreground uppercase tracking-widest opacity-50">Autenticación Soberana via DNA</p>
    </div>
  );
}
