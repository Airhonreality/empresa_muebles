'use client';

import React, { useEffect, useState } from 'react';

interface ModuleApi {
  getValue: (key: string) => any;
  setValue: (key: string, val: any) => void;
  onUpdate: (key: string, cb: (val: any) => void) => void;
}

interface Props {
  moduleName: string;
  api: ModuleApi;
  children?: React.ReactNode;
}

/**
 * AgnosticModuleLoader: The Bridge for Radical JS Injection.
 * 
 * 1. Fetches the business logic from Materia (storage/modules).
 * 2. Injects it into the browser runtime using Dynamic Blob Imports.
 * 3. Connects the logic with the Component API.
 */
export function AgnosticModuleLoader({ moduleName, api, children }: Props) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;

    async function loadModule() {
      try {
        const response = await fetch(`/api/modules/${moduleName}`);
        if (!response.ok) throw new Error(`Logic module '${moduleName}' not found.`);

        const code = await response.text();
        
        // Use Blob + Dynamic Import for a safe and modern ES Module execution
        const blob = new Blob([code], { type: 'application/javascript' });
        objectUrl = URL.createObjectURL(blob);
        
        const module = await import(/* webpackIgnore: true */ objectUrl);
        
        if (module.setup) {
          module.setup(api);
        }

        setIsLoaded(true);
      } catch (err) {
        console.error('[ModuleLoader]', err);
        setError(err instanceof Error ? err.message : 'Failed to inject logic');
      }
    }

    loadModule();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [moduleName, api]);

  if (error) {
    return (
      <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-xl text-[10px] font-bold text-destructive flex items-center gap-2">
        <span>⚠ LOGIC ERROR: {error}</span>
      </div>
    );
  }

  return <>{children}</>;
}
