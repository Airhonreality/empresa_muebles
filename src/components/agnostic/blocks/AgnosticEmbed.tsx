'use client';

import React from 'react';
import { useDNAStore } from '@/lib/agnostic/store';
import { AgnosticRenderer } from '@/components/agnostic/engine/AgnosticRenderer';

interface Props {
  // context holds the embedded route path, e.g. "/footer"
  context: string;
}

/**
 * Renders the blocks of another route inline.
 * Use case: reusable static blocks (footer, sidebar, banner)
 * that live as small routes and get embedded into other routes.
 *
 * Usage in storage: { "type": "embed", "context": "/footer" }
 */
export function AgnosticEmbed({ context }: Props) {
  const { routes } = useDNAStore();

  const route = routes.find((r: any) => r.data?.path === context);
  const blocks: any[] = route?.data?.blocks || [];

  if (!route) {
    if (process.env.NODE_ENV === 'development') {
      return (
        <div className="rounded-md border border-dashed border-border/40 px-4 py-3 text-[10px] text-muted-foreground font-mono">
          embed: ruta "{context}" no encontrada
        </div>
      );
    }
    return null;
  }

  if (!blocks.length) return null;

  return (
    <div className="w-full">
      {blocks.map((block: any) => (
        <AgnosticRenderer key={block.id} block={block} />
      ))}
    </div>
  );
}
