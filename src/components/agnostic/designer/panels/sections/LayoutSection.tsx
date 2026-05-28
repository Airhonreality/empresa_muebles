'use client';

import React from 'react';
import type { NodeLayout } from '@agnostic/core';
import { LayoutGrid } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ─── FALLBACK PRESETS (used when no spacing tokens defined) ──────────────────

const FALLBACK_SPACING = [
  { label: '0',  value: 0  },
  { label: '8',  value: 8  },
  { label: '16', value: 16 },
  { label: '24', value: 24 },
  { label: '32', value: 32 },
];

const WIDTH_PRESETS = [
  { label: 'XS',   hint: '480px',  value: 480       },
  { label: 'SM',   hint: '640px',  value: 640       },
  { label: 'MD',   hint: '768px',  value: 768       },
  { label: 'LG',   hint: '1024px', value: 1024      },
  { label: 'XL',   hint: '1280px', value: 1280      },
  { label: 'Full', hint: '∞',      value: undefined },
];

// ─── SPACING PICKER ───────────────────────────────────────────────────────────

function SpacingPicker({
  label,
  value,
  spacingTokens,
  onChange,
}: {
  label: string;
  value: number | string | undefined;
  spacingTokens: any[];
  onChange: (v: number | string | undefined) => void;
}) {
  const presets = spacingTokens.length > 0
    ? spacingTokens.map((t: any) => ({
        label: t.data.name,
        sub:   t.data.value,
        value: `var(--${t.data.name})`,
      }))
    : FALLBACK_SPACING.map(p => ({
        label: p.label,
        sub:   p.value === 0 ? '' : `${p.label}px`,
        value: p.value as number | string | undefined,
      }));

  const isActive = (v: number | string | undefined) => {
    if (v === undefined && (value === undefined || value === 0)) return true;
    return value === v;
  };

  return (
    <div className="space-y-1">
      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</label>
      <div className="flex flex-wrap gap-0.5">
        {presets.map((p, i) => (
          <button
            key={i}
            onClick={() => onChange(p.value === 0 ? undefined : p.value)}
            title={p.sub}
            className={cn(
              'flex-1 min-w-[32px] h-7 rounded-md text-[9px] font-black transition-colors flex flex-col items-center justify-center leading-tight',
              isActive(p.value as any)
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/20 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
          >
            <span>{p.label}</span>
          </button>
        ))}
      </div>
      {spacingTokens.length === 0 && (
        <p className="text-[8px] text-muted-foreground/40 font-bold uppercase tracking-wider">
          Define spacing tokens para controlar este valor
        </p>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

interface Props {
  layout: NodeLayout;
  tokens: any[];   // design_tokens DataItems — parent pre-reads from store
  onChange: (layout: NodeLayout) => void;
}

export function LayoutSection({ layout, tokens, onChange }: Props) {
  const set = (patch: Partial<NodeLayout>) => onChange({ ...layout, ...patch });
  const spacingTokens = tokens.filter((t: any) => t.data?.category === 'spacing');
  const currentWidth = layout.maxWidth ?? undefined;

  return (
    <section className="space-y-4">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
        <LayoutGrid size={12} className="text-primary" /> Layout
      </h4>

      {/* Direction + Align — compact inline row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Dirección</label>
          <div className="flex gap-0.5">
            {(['column', 'row'] as const).map(dir => (
              <button
                key={dir}
                onClick={() => set({ direction: dir })}
                className={cn(
                  'flex-1 h-7 rounded-md border text-[9px] font-black uppercase tracking-widest transition-colors',
                  (layout.direction ?? 'column') === dir
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/10 text-muted-foreground hover:bg-muted/30 border-transparent'
                )}
              >
                {dir === 'column' ? '↕ Col' : '↔ Row'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Alinear</label>
          <Select
            value={layout.align ?? 'start'}
            onValueChange={v => set({ align: v as NodeLayout['align'] })}
          >
            <SelectTrigger className="h-7 text-[10px] font-bold bg-muted/5 px-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="start">Inicio</SelectItem>
              <SelectItem value="center">Centro</SelectItem>
              <SelectItem value="end">Final</SelectItem>
              <SelectItem value="stretch">Estirar</SelectItem>
              <SelectItem value="between">Entre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Gap */}
      <SpacingPicker
        label="Gap"
        value={layout.gap}
        spacingTokens={spacingTokens}
        onChange={v => set({ gap: v })}
      />

      {/* Padding */}
      <SpacingPicker
        label="Padding"
        value={layout.padding}
        spacingTokens={spacingTokens}
        onChange={v => set({ padding: v })}
      />

      {/* Max Width */}
      <div className="space-y-1">
        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Ancho máx.</label>
        <div className="flex gap-0.5">
          {WIDTH_PRESETS.map(p => (
            <button
              key={String(p.value)}
              onClick={() => set({ maxWidth: p.value })}
              title={p.hint}
              className={cn(
                'flex-1 h-7 rounded-md text-[9px] font-black flex flex-col items-center justify-center gap-0 transition-colors leading-tight',
                currentWidth === p.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/20 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              <span>{p.label}</span>
              <span className="text-[7px] opacity-60">{p.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
