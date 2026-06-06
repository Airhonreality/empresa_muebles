'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSystemStore } from '@/lib/agnostic/store';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  metadata?: Record<string, any>;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]     = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);

  const { setUser: syncUserToStore } = useSystemStore();

  useEffect(() => {
    syncUserToStore(user);
  }, [user, syncUserToStore]);

  // Restore session from server-side cookie via iron-session
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user) setUser(d.user); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, pass: string): Promise<boolean> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    });
    if (!res.ok) return false;
    const { user: u } = await res.json();
    setUser(u);
    return true;
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
