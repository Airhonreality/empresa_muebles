'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  requiredRole?: string | null;
  fallbackPath?: string;
}

/**
 * Agnostic Guard v2.0
 * 
 * Supports:
 * 1. Public Access (requiredRole = null)
 * 2. Role-based Access (requiredRole = 'admin', 'customer', etc.)
 * 3. Contextual Redirection (fallbackPath)
 */
export function AgnosticGuard({ children, requiredRole, fallbackPath = '/login' }: Props) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 1. If NO role is required, we never redirect.
    if (!requiredRole) return;

    // 2. If it's a protected route and loading is done
    if (!isLoading) {
      if (!user) {
        // Not logged in -> Go to fallback
        console.log(`[Guard] Access Denied to ${pathname}. Redirecting to ${fallbackPath}`);
        router.push(fallbackPath);
      } else if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
        // Logged in but wrong role (Admin bypasses all)
        console.log(`[Guard] Role Mismatch. Required: ${requiredRole}, Found: ${user.role}`);
        router.push('/'); // Go to home if role is wrong
      }
    }
  }, [user, isLoading, requiredRole, fallbackPath, router, pathname]);

  // While loading, show a minimal, non-intrusive indicator
  if (requiredRole && isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
          Verifying Identity...
        </div>
      </div>
    );
  }

  // If no role required OR user is authorized, render the scene
  return <>{children}</>;
}
