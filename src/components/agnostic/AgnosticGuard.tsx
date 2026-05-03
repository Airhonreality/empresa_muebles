'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface Props {
  children: React.ReactNode;
  fallbackPath?: string;
  requiredRole?: string;
}

/**
 * AgnosticGuard: Reacts to identity.
 * If the user is not authenticated, it redirects to the fallback path.
 */
export function AgnosticGuard({ children, fallbackPath = '/login', requiredRole }: Props) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(fallbackPath);
    }
  }, [isLoading, isAuthenticated, router, fallbackPath]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
          Verifying Identity...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="h-screen flex items-center justify-center bg-background p-8 text-center">
        <div className="space-y-4">
           <h1 className="text-2xl font-black uppercase tracking-tighter">Access Denied</h1>
           <p className="text-xs text-muted-foreground italic">Your role '{user?.role}' does not have the required power for this entity.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
