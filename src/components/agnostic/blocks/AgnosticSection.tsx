'use client';

import React from 'react';
import { cn } from '@/lib/utils';
// We use a dynamic import or a reference to handle recursive rendering
import { AgnosticRenderer } from '../engine/AgnosticRenderer';

/**
 * 🏛️ ARTEFACTO: AgnosticSection.tsx
 * ────────────
 * CAPA: Projection (Layout Block)
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Contenedor estructural para agrupar bloques subordinados.
 * - Soporte para layouts básicos (grid, flex, stack).
 * - Puerta de entrada para la recursividad fractal.
 */
export function AgnosticSection({ 
  blocks = [], 
  title, 
  description, 
  className,
  ...props 
}: any) {
  return (
    <section className={cn("w-full py-8 space-y-6", className)}>
      {(title || description) && (
        <div className="space-y-1 mb-8">
          {title && <h2 className="text-2xl font-bold tracking-tight">{title}</h2>}
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-8">
        {blocks.map((childBlock: any) => (
          <AgnosticRenderer 
            key={childBlock.id} 
            block={childBlock} 
            parentId={props.id}
          />
        ))}
      </div>
    </section>
  );
}
