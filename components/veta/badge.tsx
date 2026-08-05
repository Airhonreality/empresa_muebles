import type { ReactNode } from 'react';

type Tone = 'neutral' | 'danger' | 'warning' | 'info';
type Variant = 'glass' | 'material' | 'mist';

interface BadgeProps {
  tone?: Tone;
  variant?: Variant;
  dot?: boolean;
  children: ReactNode;
}

/* Primitiva Badge solar punk (C2 PoC 3).
   3 variantes:
   - glass: cristal translúcido + highlight superior + glow sutil
   - material: superficie mate + bevel + sombra interna
   - mist: niebla emitida por contorno (glow difuso) + micro-motion hover
*/

const toneColors: Record<Tone, { bg: string; text: string; glow: string; border: string }> = {
  neutral: {
    bg: 'bg-stone-100/80',
    text: 'text-stone-700',
    glow: 'shadow-[0_0_8px_rgba(120,115,110,0.35)]',
    border: 'border-stone-200/60',
  },
  danger: {
    bg: 'bg-red-50/80',
    text: 'text-red-700',
    glow: 'shadow-[0_0_10px_rgba(204,0,0,0.4)]',
    border: 'border-red-200/60',
  },
  warning: {
    bg: 'bg-amber-50/80',
    text: 'text-amber-700',
    glow: 'shadow-[0_0_10px_rgba(168,112,0,0.45)]',
    border: 'border-amber-200/60',
  },
  info: {
    bg: 'bg-sky-50/80',
    text: 'text-sky-700',
    glow: 'shadow-[0_0_10px_rgba(29,111,163,0.4)]',
    border: 'border-sky-200/60',
  },
};

const variantStyles: Record<Variant, string> = {
  glass: 'backdrop-blur-sm border ring-1 ring-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]',
  material: 'bg-gradient-to-b from-white/90 to-white/60 border shadow-[inset_0_-1px_1px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.6)]',
  mist: 'bg-white/70 border-0 ring-1 ring-transparent transition-all duration-300 hover:ring-current/40 hover:shadow-[0_0_16px_currentColor]',
};

export function Badge({ tone = 'neutral', variant = 'glass', dot = false, children }: BadgeProps) {
  const { bg, text, glow, border } = toneColors[tone];
  const vStyle = variantStyles[variant];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium
        ${bg} ${text} ${border} ${vStyle} ${glow}
        transition-[box-shadow,border-color] duration-300
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
      `}
    >
      {dot && (
        <span
          aria-hidden
          className={`
            h-1.5 w-1.5 rounded-full shrink-0
            bg-current/90
            shadow-[0_0_4px_currentColor]
            ${variant === 'mist' && 'animate-pulse'}
          `}
        />
      )}
      {children}
    </span>
  );
}