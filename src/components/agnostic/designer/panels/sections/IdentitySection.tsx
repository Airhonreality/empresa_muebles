'use client';

import React from 'react';
import type { Node } from '@agnostic/core';
import { Fingerprint } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Props {
  node: Node;
  onChange: (patch: Partial<Node>) => void;
}

export function IdentitySection({ node, onChange }: Props) {
  return (
    <section className="space-y-3">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
        <Fingerprint size={12} className="text-primary" /> Identidad
      </h4>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Nombre</label>
          <Input
            value={node.label}
            onChange={e => onChange({ label: e.target.value })}
            className="h-9 text-xs font-bold"
            placeholder="Nombre del nodo"
          />
        </div>
        {node.path !== undefined && (
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Ruta de URL</label>
            <Input
              value={node.path ?? ''}
              onChange={e => onChange({ path: e.target.value })}
              className="h-9 text-xs font-mono font-bold"
              placeholder="/mi-ruta"
            />
          </div>
        )}
      </div>
    </section>
  );
}
