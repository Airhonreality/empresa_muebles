'use client';

import React from 'react';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ── TYPES & INTERFACES ────────────────────────────────────────────────────────

// ── 1. TEXT ──────────────────────────────────────────────────────────────────
const TEXT_VARIANTS: Record<string, string> = {
  h1:      'text-5xl font-black tracking-tighter',
  h2:      'text-3xl font-bold tracking-tight',
  h3:      'text-xl font-bold',
  body:    'text-base text-muted-foreground leading-relaxed',
  caption: 'text-xs font-bold uppercase tracking-widest text-muted-foreground',
  label:   'text-sm font-semibold',
  quote:   'text-xl italic border-l-4 border-primary pl-4 text-muted-foreground',
};

function renderText(v: Record<string, unknown>) {
  const props = v as { content?: string; variant?: string; align?: string; className?: string };
  const content = props.content || '';
  const variant = props.variant || 'body';
  const align   = props.align   || 'left';
  return (
    <p className={cn(
      TEXT_VARIANTS[variant] || TEXT_VARIANTS.body,
      align === 'center' && 'text-center',
      align === 'right'  && 'text-right',
      props.className
    )}>
      {content}
    </p>
  );
}

// ── 2. DIVIDER ───────────────────────────────────────────────────────────────
function renderDivider(v: Record<string, unknown>) {
  const props = v as { variant?: string; spacing?: number };
  const variant = props.variant || 'line';
  const spacing = props.spacing ?? 4;
  if (variant === 'space') return <div style={{ height: `${spacing * 0.25}rem` }} />;
  if (variant === 'dots') return (
    <div className="flex justify-center gap-2 py-4">
      {[0, 1, 2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />)}
    </div>
  );
  return <hr className="border-border my-4" />;
}

// ── 3. SPACER ────────────────────────────────────────────────────────────────
const SPACER_SIZES: Record<string, string> = {
  xs: '1rem', sm: '2rem', md: '4rem', lg: '8rem', xl: '12rem'
};

function renderSpacer(v: Record<string, unknown>) {
  const props = v as { size?: string; custom?: string };
  const height = props.custom || SPACER_SIZES[props.size || 'md'] || '4rem';
  return <div style={{ height }} aria-hidden="true" />;
}

// ── 4. IMAGE ─────────────────────────────────────────────────────────────────
const IMG_ASPECT: Record<string, string> = {
  video:    'aspect-video',
  square:   'aspect-square',
  portrait: 'aspect-[3/4]',
  auto:     '',
};

const IMG_FIT: Record<string, string> = {
  cover:   'object-cover',
  contain: 'object-contain',
  fill:    'object-fill',
};

function renderImage(v: Record<string, unknown>) {
  const props = v as { src?: string; alt?: string; caption?: string; fit?: string; aspect?: string; rounded?: boolean; className?: string };
  const { src, alt = '', caption, fit = 'cover', aspect = 'video', rounded = false, className } = props;

  if (!src) return (
    <div className="w-full aspect-video bg-muted/20 rounded-xl flex items-center justify-center text-muted-foreground/30 text-xs font-bold uppercase tracking-widest">
      Sin imagen configurada
    </div>
  );

  return (
    <figure className="w-full space-y-2">
      <div className={cn("w-full overflow-hidden", IMG_ASPECT[aspect], rounded && "rounded-xl")}>
        <img
          src={src}
          alt={alt}
          className={cn("w-full h-full", IMG_FIT[fit] || 'object-cover', className)}
          loading="lazy"
        />
      </div>
      {caption && (
        <figcaption className="text-center text-xs text-muted-foreground/60 font-medium italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// ── 5. HERO ──────────────────────────────────────────────────────────────────
function renderHero(v: Record<string, unknown>) {
  const props = v as {
    title?: string;
    subtitle?: string;
    align?: string;
    className?: string;
    cta?: { label: string; path: string };
    cta_label?: string;
    cta_path?: string;
    cta_secondary?: { label: string; path: string };
    cta_secondary_label?: string;
    cta_secondary_path?: string;
  };
  const { title, subtitle, align = 'center', className } = props;
  const cta = props.cta || (props.cta_label ? { label: props.cta_label, path: props.cta_path || '#' } : undefined);
  const cta_secondary = props.cta_secondary || (props.cta_secondary_label ? { label: props.cta_secondary_label, path: props.cta_secondary_path || '#' } : undefined);

  return (
    <section className={cn(
      "py-24 px-6 w-full",
      align === 'center' && 'text-center flex flex-col items-center',
      className
    )}>
      {title && (
        <h1 className="text-6xl font-black tracking-tighter max-w-3xl mb-4">{title}</h1>
      )}
      {subtitle && (
        <p className="text-lg text-muted-foreground max-w-xl mb-10">{subtitle}</p>
      )}
      {(cta || cta_secondary) && (
        <div className="flex gap-4 flex-wrap justify-center">
          {cta && (
            <Button asChild size="lg" className="font-bold uppercase tracking-wider">
              <Link href={cta.path}>{cta.label}</Link>
            </Button>
          )}
          {cta_secondary && (
            <Button asChild size="lg" variant="outline" className="font-bold uppercase tracking-wider">
              <Link href={cta_secondary.path}>{cta_secondary.label}</Link>
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

// ── DISPATCHER MAP ───────────────────────────────────────────────────────────

const RENDERERS: Record<string, (v: Record<string, unknown>) => React.ReactElement | null> = {
  text:        renderText,
  divider:     renderDivider,
  spacer:      renderSpacer,
  image:       renderImage,
  hero:        renderHero,
};

// ── MASTER RENDERER COMPONENT ────────────────────────────────────────────────

export function AgnosticVisual(props: Record<string, unknown>) {
  const type = props.type as string;
  return RENDERERS[type]?.(props) ?? null;
}
