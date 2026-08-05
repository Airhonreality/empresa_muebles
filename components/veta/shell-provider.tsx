'use client';

import { AppShell } from '@/components/veta/app-shell';

export function ShellProvider({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}