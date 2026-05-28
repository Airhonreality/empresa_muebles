'use client';

import React from 'react';
import type { Node } from '@agnostic/core';
import { Eye, EyeOff, Type, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── DISPLAY FORMAT ───────────────────────────────────────────────────────────

const DISPLAY_FORMATS = [
  { value: 'text',     label: 'Texto'   },
  { value: 'badge',    label: 'Badge'   },
  { value: 'currency', label: 'Moneda'  },
  { value: 'date',     label: 'Fecha'   },
  { value: 'number',   label: 'Número'  },
];

const SEMANTIC_COLORS = [
  { label: 'Defecto',     value: 'text-foreground'       },
  { label: 'Silenciado',  value: 'text-muted-foreground' },
  { label: 'Primario',    value: 'text-primary'          },
  { label: 'Destructivo', value: 'text-destructive'      },
];

// ─── COMPACT ROW ─────────────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 min-h-[28px]">
      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground shrink-0">{label}</span>
      <div className="flex items-center gap-1 shrink-0">{children}</div>
    </div>
  );
}

// ─── TOGGLE SWITCH ────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={cn(
        'w-8 h-[18px] rounded-full transition-colors relative shrink-0',
        value ? 'bg-primary' : 'bg-muted'
      )}
    >
      <span className={cn(
        'absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-transform',
        value ? 'translate-x-[17px]' : 'translate-x-[2px]'
      )} />
    </button>
  );
}

// ─── CHIP GROUP ───────────────────────────────────────────────────────────────

function ChipGroup({
  options, value, onChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 justify-end">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value === value ? '' : o.value)}
          className={cn(
            'px-2 h-[22px] rounded-md text-[9px] font-black transition-colors',
            o.value === value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

interface Props {
  node: Node;
  tokens: any[];   // design_tokens DataItems
  onChange: (patch: Partial<Node>) => void;
}

export function FieldSection({ node, tokens, onChange }: Props) {
  const visual = node.visual ?? {};
  const showLabel    = node.showLabel !== false; // default true
  const displayFormat = node.displayFormat ?? 'text';

  const typographyTokens = tokens
    .filter((t: any) => t.data?.category === 'typography')
    .map((t: any) => ({ label: t.data.name, value: `var(--${t.data.name})` }));

  const colorTokens = tokens
    .filter((t: any) => t.data?.category === 'color')
    .map((t: any) => ({ label: t.data.name, value: `text-[hsl(var(--${t.data.name}))]` }));

  const textColorOptions = [...SEMANTIC_COLORS, ...colorTokens];

  const setVisual = (k: string, v: string) =>
    onChange({ visual: { ...visual, [k]: v } });

  return (
    <section className="space-y-2 pt-1">
      <h4 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 pb-1">
        <Type size={11} className="text-primary" /> Presentación del Campo
      </h4>

      <Row label="Mostrar etiqueta">
        <Toggle value={showLabel} onChange={v => onChange({ showLabel: v })} />
      </Row>

      <Row label="Formato">
        <ChipGroup
          options={DISPLAY_FORMATS}
          value={displayFormat}
          onChange={v => onChange({ displayFormat: v })}
        />
      </Row>

      <div className="border-t border-border/20 my-2" />

      <h4 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 pb-1">
        <Palette size={11} className="text-primary" /> Visual
      </h4>

      <Row label="Color texto">
        <ChipGroup
          options={textColorOptions}
          value={visual.text ?? ''}
          onChange={v => setVisual('text', v)}
        />
      </Row>

      {typographyTokens.length > 0 && (
        <Row label="Tipografía">
          <ChipGroup
            options={typographyTokens}
            value={visual.typography ?? ''}
            onChange={v => setVisual('typography', v)}
          />
        </Row>
      )}
    </section>
  );
}
