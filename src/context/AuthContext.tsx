'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppState } from './AppContext';
import { DataItem } from '@/core/types';

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
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * AuthProvider: The Identity Layer of the Satellite.
 * Radically agnostic: It doesn't care about the provider, only about the 'user' entity in Materia.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { state } = useAppState();

  // On mount, check if there's a session (simulated with localStorage for this agnostic seed)
  useEffect(() => {
    const savedUser = localStorage.getItem('agnostic_session');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('agnostic_session');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, pass: string): Promise<boolean> => {
    // In a real scenario, this calls /api/auth
    // For this agnostic implementation, we check the 'users' context in Materia
    const users = state.data['users'] || [];
    const found = users.find(u => u.data.email === email && u.data.password === pass);

    if (found) {
      const userData: User = {
        id: found.id,
        email: found.data.email as string,
        name: found.data.name as string,
        role: found.data.role as string,
        metadata: found.data.metadata as Record<string, any>
      };
      setUser(userData);
      localStorage.setItem('agnostic_session', JSON.stringify(userData));
      return true;
    }
    return false;
  }, [state.data]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('agnostic_session');
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      logout, 
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
