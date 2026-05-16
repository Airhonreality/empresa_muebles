/**
 * 🏛️ ARTEFACTO: AgnosticModuleLoader.tsx
 * ────────────
 * CAPA: Projection (Sovereign Runtime)
 * VERSIÓN: 6.1
 * COMMIT: P2-M1.4-ADR-ISOLATION
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Inyección dinámica de módulos externos (Guest Actors) vía Blob URLs.
 * - Gestión del ciclo de vida runtime (Setup / Teardown / Cleanup).
 * - Proyección de estados de hidratación visual (Axiomatic Loading).
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Garantizar el aislamiento de ejecución entre Host y Guest.
 * - NEVER: Exponer variables de entorno sensibles al código del satélite.
 * - NEVER: Permitir fugas de memoria (limpiar Blob URLs al desmontar).
 * 
 * 📜 ADR: [2026-05-07] RUNTIME_SOVEREIGN_ISOLATION
 * - DECISIÓN: Utilizar Blob URLs y carga dinámica (import) para ejecutar módulos satélite.
 * - MOTIVO: Proveer un entorno de ejecución aislado y seguro que permita la limpieza total de recursos al desmontar.
 * - IMPACTO: Eliminación de colisiones de variables globales y fugas de memoria en el cliente.
 * 
 * 🔗 RELATIONSHIPS:
 * - UPSTREAM: [Next API Route (/api/modules), AgnosticAPI]
 * - DOWNSTREAM: [CustomActorBridge, External JS Modules]
 */
'use client';

import React, { useEffect, useState, useRef } from 'react';
import type { AgnosticAPI } from '@agnostic/core';
import { AgnosticBelt } from '../blocks/AgnosticBelt';

interface Props {
  moduleName: string;
  api: AgnosticAPI;
  children?: React.ReactNode;
}

export function AgnosticModuleLoader({ moduleName, api, children }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [intent, setIntent] = useState<{ type: string; config: any; configSchema?: any; visibility_whitelist?: any } | null>(null);
  const apiRef = useRef<AgnosticAPI>(api);
  apiRef.current = api;

  useEffect(() => {
    let objectUrl:  string | null  = null;
    let isMounted:  boolean        = true;
    let teardown:   (() => void) | void;

    async function loadModule() {
      try {
        const response = await fetch(`/api/modules/${moduleName}`);
        if (!response.ok) throw new Error(`Module '${moduleName}' not found.`);
        const code = await response.text();

        const blob = new Blob([code], { type: 'application/javascript' });
        objectUrl = URL.createObjectURL(blob);

        const mod    = await import(/* webpackIgnore: true */ objectUrl);
        const setupFn = mod.setup;
        if (typeof setupFn !== 'function') throw new Error('Module must export a setup() function.');

        if (isMounted) {
          const container = apiRef.current.container;
          try {
            const result = setupFn.length >= 2
              ? setupFn(container, apiRef.current)
              : setupFn(container);
            
            if (result && typeof result === 'object' && result.__type === 'INTENT_BELT') {
              setIntent({ 
                type: 'BELT', 
                config: result.config,
                configSchema: mod.configSchema,
                visibility_whitelist: mod.visibility_whitelist
              });
            } else if (typeof result === 'function') {
              teardown = result;
            }
          } catch (runtimeErr) {
            console.error(`[AgnosticRuntime] Crash in '${moduleName}':`, runtimeErr);
            if (isMounted) {
              setError(`Module Crash: ${runtimeErr instanceof Error ? runtimeErr.message : 'Unknown'}`);
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('[ModuleLoader] Injection Error:', err);
          setError(err instanceof Error ? err.message : 'Failed to inject module');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadModule();

    return () => {
      isMounted = false;
      if (typeof teardown === 'function') teardown();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [moduleName]);

  if (isLoading) {
    return (
      <div className="w-full h-32 flex flex-col items-center justify-center bg-muted/30 rounded-xl border border-dashed animate-pulse">
        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Inyectando {moduleName}...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 border border-destructive/20 bg-destructive/5 rounded-xl text-center">
        <div className="text-sm font-bold uppercase tracking-wider text-destructive mb-2">
          Fallo en Inyección
        </div>
        <div className="text-xs font-mono text-muted-foreground">{error}</div>
      </div>
    );
  }

  if (intent?.type === 'BELT') {
    return (
      <AgnosticBelt 
        api={api} 
        config={intent.config} 
        configSchema={intent.configSchema}
        visibility_whitelist={intent.visibility_whitelist}
      />
    );
  }

  return <>{children}</>;
}
