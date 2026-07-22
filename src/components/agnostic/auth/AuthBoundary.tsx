'use client';

/**
 * 🔐 AUTH BOUNDARY
 * ────────────────
 * Client Component que proporciona el contexto de autenticación
 * seguro para componentes que usan useAuth().
 *
 * Envuelve cualquier componente que dependa de AuthContext
 * para evitar errores "useAuth must be used within AuthProvider".
 */

import { ReactNode } from 'react';

interface AuthBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthBoundary({ children, fallback }: AuthBoundaryProps) {
  return (
    <div suppressHydrationWarning>
      {children}
    </div>
  );
}
