'use client';

/**
 * 🏛️ ARTEFACTO: SovereigntyOrchestrator.tsx
 * ────────────
 * CAPA: Orchestration (Global Infrastructure)
 * VERSIÓN: 2.2
 * COMMIT: P2-M2.8-ADR-SOVEREIGN-BYPASS
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Orquestación del estado de edición global (Sovereignty Toggle).
 * - Inyección del Agnostic Manager como capa superior (Overlayer).
 * - Gestión de eventos y visibilidad entre el Host y el Manager.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Ser invisible e inocuo cuando el modo edición está desactivado.
 * - NEVER: Bloquear punteros de eventos (pointer-events) en la aplicación host cuando está en reposo.
 * - ALWAYS: Mantener el Z-Index más alto del sistema para asegurar la accesibilidad del Manager.
 * 
 * 📜 ADR: [2026-05-11] SOBERAN_EVENT_BYPASS
 * - DECISIÓN: Implementar una capa de backdrop con desenfoque dinámico que capture clics para cierre rápido.
 * - MOTIVO: Proveer una experiencia de usuario tipo "Modo Dios" sin interferir con el DOM original.
 * - IMPACTO: Transición fluida entre navegación de usuario y diseño de arquitecto.
 * 
 * 🔗 RELATIONSHIPS:
 * - UPSTREAM: [Root Layout, useSystemStore]
 * - DOWNSTREAM: [AgnosticConfigManager]
 */

import React, { useMemo } from 'react';
import { Settings, X } from 'lucide-react';
import { useSystemStore } from '@/lib/agnostic/store';
import { useAppState } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { AgnosticConfigManager } from '../designer/AgnosticConfigManager';

export function SovereigntyOrchestrator() {
  const { isEditMode, setEditMode, currentPath } = useSystemStore();
  const { state } = useAppState();
  
  const routes = state.data['page_routes'] ?? [];
  const activeRoute = useMemo(() => routes.find((r: any) => r.path === currentPath), [routes, currentPath]);

  if (!isEditMode) {
    return (
      <div className="fixed bottom-8 right-8 z-[100]">
        <Button 
          size="icon"
          onClick={() => setEditMode(true)}
          className="w-14 h-14 rounded-full shadow-2xl"
        >
          <Settings size={24} />
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* 🧬 BACKDROP (Soberano e independiente) */}
      <div 
        className="fixed inset-0 bg-background/40 backdrop-blur-sm z-[1000] cursor-pointer"
        onClick={() => setEditMode(false)}
      />
      
      {/* 🏛️ DRAWER (Soberano e independiente) */}
      <aside className="fixed top-0 right-0 h-full w-full max-w-2xl bg-background border-l z-[1001] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Botón de Cierre (Shadcn Puro) */}
        <div className="absolute top-6 right-6 z-[1002]">
           <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setEditMode(false)}
            className="rounded-full"
          >
            <X size={20} />
          </Button>
        </div>

        <div className="flex-1">
          <AgnosticConfigManager 
            initialSection={activeRoute ? 'composer' : 'routes'} 
            initialRouteId={activeRoute?.id}
          />
        </div>
      </aside>
    </>
  );
}
