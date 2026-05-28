'use client';

import React, { useEffect, useState } from 'react';
import { Settings2, X, PanelRight, PanelBottom } from 'lucide-react';
import { useActiveRoute } from '@/lib/agnostic/store';
import { ConfigManager } from '@/components/agnostic/designer/AgnosticDesigner';
import { useAdminGate } from '@/hooks/useAdminGate';
import { cn } from '@/lib/utils';

export function AdminGear() {
  const isAdmin = useAdminGate();
  const [open, setOpen] = useState(false);
  const [dock, setDock] = useState<'right' | 'bottom'>('right');
  useEffect(() => {
    const saved = localStorage.getItem('admin_dock') as 'right' | 'bottom' | null;
    if (saved) setDock(saved);
  }, []);
  const activeRoute = useActiveRoute();

  if (!isAdmin) return null;

  const toggleDock = () => {
    const next = dock === 'right' ? 'bottom' : 'right';
    setDock(next);
    localStorage.setItem('admin_dock', next);
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-[9999] w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-all"
      >
        <Settings2 className="w-4 h-4" />
      </button>

      {open && (
        <div
          className={cn(
            'fixed z-[9998] bg-background border shadow-2xl flex flex-col overflow-hidden',
            dock === 'right' ? 'top-0 right-0 h-screen w-[720px] border-l' : 'bottom-0 left-0 right-0 h-[380px] border-t'
          )}
        >
          <div className="h-9 border-b flex items-center justify-between px-3 shrink-0 bg-muted/10">
            <button onClick={toggleDock} className="text-muted-foreground hover:text-foreground transition-colors">
              {dock === 'right' ? <PanelBottom size={14} /> : <PanelRight size={14} />}
            </button>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <ConfigManager initialRouteId={activeRoute?.id ?? null} />
          </div>
        </div>
      )}
    </>
  );
}
