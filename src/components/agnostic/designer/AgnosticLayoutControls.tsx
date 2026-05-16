'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowDown, 
  ArrowRight, 
  Maximize2, 
  MoveHorizontal,
  Square
} from 'lucide-react';

/**
 * 🏛️ ARTEFACTO: AgnosticLayoutControls.tsx
 * ────────────
 * CAPA: Designer (Universal Layout Capability)
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Proyección de controles de layout Figma-parity.
 * - Basado estrictamente en rem y porcentajes.
 * - Cero hardcoding de estilos (bebe de Shadcn/Theme).
 */

interface LayoutParams {
  direction?: 'vertical' | 'horizontal';
  sizing?: 'fill' | 'hug' | 'relative';
  width?: string;
  padding?: [number, number, number, number];
  gap?: number;
  align?: string;
  clip?: boolean;
}

interface AgnosticLayoutControlsProps {
  data: any;
  onUpdate: (updatedLayout: LayoutParams) => void;
}

export function AgnosticLayoutControls({ data, onUpdate }: AgnosticLayoutControlsProps) {
  const layout: LayoutParams = data.layout || {
    direction: 'vertical',
    sizing: 'fill',
    padding: [1, 1, 1, 1],
    gap: 1,
    align: 'align-tl',
    clip: true
  };

  const updateField = (field: keyof LayoutParams, value: any) => {
    onUpdate({ ...layout, [field]: value });
  };

  const updatePadding = (index: number, val: string) => {
    const numVal = parseFloat(val) || 0;
    const newPadding = [...(layout.padding || [0,0,0,0])] as [number, number, number, number];
    newPadding[index] = numVal;
    updateField('padding', newPadding);
  };

  const matrixPositions = ['tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-2">
        <Maximize2 size={14} className="text-primary/40" />
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Configuración de Layout</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* FLOW & DIRECTION */}
        <div className="space-y-3">
          <Label className="text-[9px] uppercase tracking-wider opacity-40">Dirección de Flujo</Label>
          <div className="flex gap-1 p-1 bg-muted/30 rounded-lg">
            <Button 
              variant={layout.direction === 'horizontal' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 h-8 rounded-md"
              onClick={() => updateField('direction', 'horizontal')}
            >
              <ArrowRight className="h-3 w-3 mr-2" />
              <span className="text-[10px]">Horizontal</span>
            </Button>
            <Button 
              variant={layout.direction === 'vertical' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 h-8 rounded-md"
              onClick={() => updateField('direction', 'vertical')}
            >
              <ArrowDown className="h-3 w-3 mr-2" />
              <span className="text-[10px]">Vertical</span>
            </Button>
          </div>
        </div>

        {/* ALIGNMENT MATRIX */}
        <div className="space-y-3">
          <Label className="text-[9px] uppercase tracking-wider opacity-40">Alineación del Contenedor</Label>
          <div className="grid grid-cols-3 gap-1 w-24 h-24 p-2 bg-muted/30 rounded-lg">
            {matrixPositions.map(pos => (
              <div 
                key={pos}
                className={cn(
                  "w-full h-full rounded-sm border transition-all cursor-pointer", 
                  layout.align === `align-${pos}` 
                    ? "bg-primary border-primary" 
                    : "bg-background border-border/10 hover:border-primary/40"
                )}
                onClick={() => updateField('align', `align-${pos}`)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* SIZING */}
        <div className="space-y-3">
          <Label className="text-[9px] uppercase tracking-wider opacity-40">Resizing (Ancho)</Label>
          <select 
            className="w-full h-9 px-3 bg-muted/50 border rounded-lg text-xs font-bold outline-none appearance-none"
            value={layout.sizing === 'fill' ? 'fill' : (layout.width?.includes('%') ? 'relative' : 'hug')}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'fill') updateField('sizing', 'fill');
              else if (val === 'hug') updateField('sizing', 'hug');
              else updateField('sizing', 'relative');
            }}
          >
            <option value="fill">Fill container (100%)</option>
            <option value="hug">Hug contents (Auto)</option>
            <option value="relative">Relative (%)</option>
          </select>
          {layout.sizing === 'relative' && (
            <Input 
              type="text" 
              placeholder="Ej: 50%" 
              className="h-8 text-[10px] font-mono mt-2" 
              value={layout.width || ''}
              onChange={(e) => updateField('width', e.target.value)}
            />
          )}
        </div>

        {/* GAP */}
        <div className="space-y-3">
          <Label className="text-[9px] uppercase tracking-wider opacity-40">Espaciado (Gap rem)</Label>
          <div className="flex items-center gap-3 px-3 bg-muted/50 h-9 rounded-lg border">
            <MoveHorizontal className="h-3 w-3 text-muted-foreground/30" />
            <input 
              type="number"
              step="0.5"
              className="bg-transparent text-[11px] font-bold outline-none w-full"
              value={layout.gap || 0}
              onChange={(e) => updateField('gap', parseFloat(e.target.value))}
            />
          </div>
        </div>

        {/* CLIPPING */}
        <div className="space-y-3">
          <Label className="text-[9px] uppercase tracking-wider opacity-40">Opciones Extra</Label>
          <div className="flex items-center justify-between px-3 bg-muted/50 h-9 rounded-lg border">
            <span className="text-[10px] font-bold opacity-60">Clip Content</span>
            <input 
              type="checkbox" 
              checked={layout.clip} 
              onChange={(e) => updateField('clip', e.target.checked)}
              className="w-3 h-3 accent-primary"
            />
          </div>
        </div>
      </div>

      {/* PADDING MATRIX */}
      <div className="space-y-3">
        <Label className="text-[9px] uppercase tracking-wider opacity-40">Márgenes Internos (Padding rem)</Label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Top', val: layout.padding?.[0] },
            { label: 'Right', val: layout.padding?.[1] },
            { label: 'Bottom', val: layout.padding?.[2] },
            { label: 'Left', val: layout.padding?.[3] }
          ].map((p, i) => (
            <div key={p.label} className="flex flex-col gap-1 p-2 bg-muted/30 rounded-lg border">
              <span className="text-[8px] font-black uppercase opacity-30">{p.label}</span>
              <input 
                type="number" 
                step="0.5"
                className="bg-transparent text-[11px] font-bold outline-none w-full"
                value={p.val || 0}
                onChange={(e) => updatePadding(i, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
