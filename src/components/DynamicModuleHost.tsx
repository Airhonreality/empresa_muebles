'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import type { AppState } from '@/core/types';
import styles from './DynamicModuleHost.module.css';

interface Props {
  moduleName: string;
}

type RenderFn = (args: {
  state: AppState;
  dispatch: React.Dispatch<{ type: string; payload?: unknown }>;
  React: typeof React;
}) => React.ReactNode;

export function DynamicModuleHost({ moduleName }: Props) {
  const { state, dispatch } = useAppContext();
  const renderFnRef = useRef<RenderFn | null>(null);
  const [element, setElement] = useState<React.ReactNode>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch and compile the module once
  useEffect(() => {
    let blobUrl: string | null = null;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/modules/${encodeURIComponent(moduleName)}`);
        if (!res.ok) throw new Error(`Module "${moduleName}" not found (${res.status})`);
        const code = await res.text();
        const blob = new Blob([code], { type: 'text/javascript' });
        blobUrl = URL.createObjectURL(blob);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mod = await (import(/* webpackIgnore: true */ blobUrl) as Promise<any>);
        if (typeof mod.render !== 'function') {
          throw new Error('Module must export a `render` function');
        }
        renderFnRef.current = mod.render as RenderFn;
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        renderFnRef.current = null;
      } finally {
        setLoading(false);
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
          blobUrl = null;
        }
      }
    }

    load();
  }, [moduleName]);

  // Re-render when state changes (without re-fetching)
  useEffect(() => {
    if (renderFnRef.current) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setElement(renderFnRef.current({ state, dispatch: dispatch as any, React }));
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    }
  }, [state, dispatch]);

  if (loading) return <div className={styles.loading}>Loading module&hellip;</div>;
  if (error) return <div className={styles.error}>&#9888; {error}</div>;
  return <>{element}</>;
}
