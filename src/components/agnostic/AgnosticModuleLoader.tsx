'use client';

import React, { useEffect, useState, useRef } from 'react';

interface Props {
  moduleName: string;
  api: any;
  children?: React.ReactNode;
}

/**
 * AgnosticModuleLoader v2.1 (Performance Stabilized)
 * 
 * Ensures business logic is injected exactly once and persists
 * through state updates via reference sharing.
 */
export function AgnosticModuleLoader({ moduleName, api, children }: Props) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use a ref for the API to avoid re-triggering the load effect
  const apiRef = useRef(api);
  apiRef.current = api;

  useEffect(() => {
    let objectUrl: string | null = null;
    let isMounted = true;

    async function loadModule() {
      try {
        console.log(`[ModuleLoader] Injecting: ${moduleName}`);
        const response = await fetch(`/api/modules/${moduleName}`);
        if (!response.ok) throw new Error(`Logic module '${moduleName}' not found.`);

        const code = await response.text();
        const blob = new Blob([code], { type: 'application/javascript' });
        objectUrl = URL.createObjectURL(blob);
        
        const module = await import(/* webpackIgnore: true */ objectUrl);
        
        if (isMounted && module.setup) {
          // Pass the API ref current value to the setup
          module.setup(apiRef.current, apiRef.current.container);
          setIsLoaded(true);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[ModuleLoader] Injection Error:', err);
          setError(err instanceof Error ? err.message : 'Failed to inject logic');
        }
      }
    }

    loadModule();

    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // ONLY re-run if the module name changes, NOT the API state
  }, [moduleName]);

  if (error) {
    return (
      <div className="p-6 border border-destructive/20 bg-destructive/5 rounded-[2rem] text-[10px] font-bold text-destructive flex items-center gap-3">
        <span className="p-2 bg-destructive/10 rounded-lg">⚠</span>
        <span>LOGIC INJECTION FAILURE: {error}</span>
      </div>
    );
  }

  return <>{children}</>;
}
