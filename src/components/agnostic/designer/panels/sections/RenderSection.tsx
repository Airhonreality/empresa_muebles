'use client';

import React from 'react';
import type { RenderMode } from '@agnostic/core';
import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

const OPTIONS: { value: RenderMode; label: string; hint: string }[] = [
  { value: 'canvas', label: 'Canvas',  hint: 'Contenedor libre — hijos heredan contexto' },
  { value: 'list',   label: 'Lista',   hint: 'Itera registros del contexto' },
  { value: 'form',   label: 'Form',    hint: 'Captura de un registro' },
  { value: 'card',   label: 'Tarjeta', hint: 'Visualiza un registro único' },
  { value: 'action', label: 'Acción',  hint: 'Botón que ejecuta un Zap' },
];

interface Props {
  render: RenderMode | undefined;
  onChange: (mode: RenderMode) => void;
}

export function RenderSection({ render, onChange }: Props) {
  return (
    <section className="space-y-3">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
        <Layers size={12} className="text-primary" /> Modo de Render
      </h4>
      <div className="grid grid-cols-5 gap-1.5">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            title={opt.hint}
            className={cn(
              'flex flex-col items-center gap-1 rounded-xl border py-2.5 px-1 text-[9px] font-black uppercase tracking-widest transition-colors',
              render === opt.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/10 text-muted-foreground hover:bg-muted/30 border-transparent hover:text-foreground'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {render && render !== 'canvas' && (
        <p className="text-[9px] text-muted-foreground">
          {OPTIONS.find(o => o.value === render)?.hint}
        </p>
      )}
    </section>
  );
}
