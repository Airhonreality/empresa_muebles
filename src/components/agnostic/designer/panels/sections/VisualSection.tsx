'use client';

import React, { useState, useMemo } from 'react';
import type { Node } from '@agnostic/core';
import { Palette, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// ─── SEMANTIC FALLBACK TOKENS ─────────────────────────────────────────────────

const SEMANTIC_BG = [
  { label: 'Sin fondo',       value: '' },
  { label: 'Background',      value: 'bg-background' },
  { label: 'Card',            value: 'bg-card' },
  { label: 'Muted',           value: 'bg-muted' },
  { label: 'Muted /30',       value: 'bg-muted/30' },
  { label: 'Muted /10',       value: 'bg-muted/10' },
  { label: 'Primary',         value: 'bg-primary' },
  { label: 'Primary /10',     value: 'bg-primary/10' },
  { label: 'Secondary',       value: 'bg-secondary' },
  { label: 'Destructivo /10', value: 'bg-destructive/10' },
];

const SEMANTIC_TEXT = [
  { label: 'Foreground',    value: 'text-foreground'         },
  { label: 'Muted fg',      value: 'text-muted-foreground'   },
  { label: 'Primary',       value: 'text-primary'            },
  { label: 'Primary fg',    value: 'text-primary-foreground' },
  { label: 'Destructivo',   value: 'text-destructive'        },
];

const SEMANTIC_RADIUS = [
  { label: 'None', value: 'rounded-none' },
  { label: 'SM',   value: 'rounded-sm'   },
  { label: 'MD',   value: 'rounded-md'   },
  { label: 'LG',   value: 'rounded-lg'   },
  { label: 'XL',   value: 'rounded-xl'   },
  { label: '2XL',  value: 'rounded-2xl'  },
  { label: 'Full', value: 'rounded-full' },
];

const SEMANTIC_SHADOW = [
  { label: 'None', value: ''           },
  { label: 'XS',   value: 'shadow-sm'  },
  { label: 'SM',   value: 'shadow'     },
  { label: 'MD',   value: 'shadow-md'  },
  { label: 'LG',   value: 'shadow-lg'  },
  { label: 'XL',   value: 'shadow-xl'  },
];

const SEMANTIC_BORDER = [
  { label: 'None',          value: '' },
  { label: 'Border',        value: 'border' },
  { label: 'Border /20',    value: 'border border-border/20' },
  { label: 'Primario /20',  value: 'border border-primary/20' },
  { label: 'Dashed',        value: 'border border-dashed' },
];

// ─── TOKEN PICKER ─────────────────────────────────────────────────────────────

function TokenPicker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = options.find(o => o.value === value);

  return (
    <div className="space-y-1">
      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="w-full h-7 rounded-md border bg-muted/5 px-2 text-left text-[10px] font-bold text-foreground flex items-center justify-between hover:bg-muted/20 transition-colors">
            <span className="truncate">{active?.label || <span className="text-muted-foreground italic text-[9px]">Sin valor</span>}</span>
            <span className="text-[8px] font-mono text-muted-foreground/50 ml-2 shrink-0 truncate max-w-[80px]">{value || ''}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-1.5 bg-card border rounded-xl shadow-lg z-[10000]" align="start">
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {options.map(opt => (
              <div
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={cn(
                  'flex items-center justify-between px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors',
                  opt.value === value
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <span>{opt.label}</span>
                {opt.value === value && <Check size={9} className="text-primary shrink-0" />}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

interface Props {
  node: Node;
  tokens: any[];   // design_tokens DataItems
  onChange: (patch: Partial<Node>) => void;
}

export function VisualSection({ node, tokens, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const visual = node.visual ?? {};

  const set = (key: string, val: string) =>
    onChange({ visual: { ...visual, [key]: val } });

  // Merge user color tokens into BG / TEXT options
  const colorTokens = useMemo(
    () => tokens.filter((t: any) => t.data?.category === 'color'),
    [tokens]
  );
  const radiusTokens = useMemo(
    () => tokens.filter((t: any) => t.data?.category === 'radius'),
    [tokens]
  );
  const shadowTokens = useMemo(
    () => tokens.filter((t: any) => t.data?.category === 'shadow'),
    [tokens]
  );

  const bgOptions = useMemo(() => [
    ...colorTokens.map((t: any) => ({
      label: t.data.name,
      value: `bg-[hsl(var(--${t.data.name}))]`,
    })),
    ...SEMANTIC_BG,
  ], [colorTokens]);

  const textOptions = useMemo(() => [
    ...colorTokens.map((t: any) => ({
      label: t.data.name,
      value: `text-[hsl(var(--${t.data.name}))]`,
    })),
    ...SEMANTIC_TEXT,
  ], [colorTokens]);

  const radiusOptions = useMemo(() => [
    ...radiusTokens.map((t: any) => ({
      label: t.data.name,
      value: `rounded-[var(--${t.data.name})]`,
    })),
    ...SEMANTIC_RADIUS,
  ], [radiusTokens]);

  const shadowOptions = useMemo(() => [
    ...shadowTokens.map((t: any) => ({
      label: t.data.name,
      value: `shadow-[var(--${t.data.name})]`,
    })),
    ...SEMANTIC_SHADOW,
  ], [shadowTokens]);

  return (
    <section className="space-y-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        <Palette size={11} className="text-primary" /> Visual
      </button>

      {open && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <TokenPicker label="Fondo"   value={visual.bg     ?? ''} options={bgOptions}     onChange={v => set('bg', v)}     />
          <TokenPicker label="Texto"   value={visual.text   ?? ''} options={textOptions}   onChange={v => set('text', v)}   />
          <TokenPicker label="Radio"   value={visual.radius ?? ''} options={radiusOptions} onChange={v => set('radius', v)} />
          <TokenPicker label="Sombra"  value={visual.shadow ?? ''} options={shadowOptions} onChange={v => set('shadow', v)} />
          <div className="col-span-2">
            <TokenPicker label="Borde" value={visual.border ?? ''} options={SEMANTIC_BORDER} onChange={v => set('border', v)} />
          </div>
        </div>
      )}
    </section>
  );
}
