import { useSystemStore } from '@/lib/agnostic/store';

export function useAdminGate(): boolean {
  const isAdmin = useSystemStore((s) => s.user?.role === 'admin');
  // In development there is no auth — gate is open.
  // In production, an explicit user.role === 'admin' is required.
  if (process.env.NODE_ENV === 'development') return true;
  return isAdmin;
}
