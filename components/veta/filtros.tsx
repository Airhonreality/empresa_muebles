"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

export interface FiltroChipProps {
  activo: boolean;
  onClick: () => void;
  children: ReactNode;
  etiqueta?: string;
}

/* Primitiva Filtros (D4 §2.3): chip de toolbar con aria-pressed. Alto 32-40px,
   estado activo con acento dorado (tokens D4: --veta-gold-*). */
export function FiltroChip({ activo, onClick, children, etiqueta }: FiltroChipProps) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      aria-label={etiqueta}
      onClick={onClick}
      className={`min-h-[36px] rounded-full border px-3 text-sm transition-colors duration-fast ${
        activo
          ? "border-gold-400 bg-gold-600/10 text-text-heading"
          : "border-border-subtle bg-bg-paper text-text-muted hover:border-border-strong hover:text-text-heading"
      }`}
    >
      {children}
    </button>
  );
}

export interface BarraFiltrosProps {
  children: ReactNode;
  etiqueta: string;
  /** Número de filtros activos; cuando > 0 se muestra "Limpiar filtros". */
  activos?: number;
  onLimpiar?: () => void;
}

/* Primitiva Filtros (D4 §2.3): toolbar de filtros como grupo (fieldset+legend) para a11y. */
export function BarraFiltros({ children, etiqueta, activos = 0, onLimpiar }: BarraFiltrosProps) {
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="sr-only">{etiqueta}</legend>
      {children}
      {activos > 0 && onLimpiar && (
        <button
          type="button"
          onClick={onLimpiar}
          className="ml-1 inline-flex items-center gap-1 text-xs font-medium text-text-muted hover:text-text-heading transition-colors"
        >
          <X aria-hidden className="h-3.5 w-3.5" />
          Limpiar filtros
        </button>
      )}
    </fieldset>
  );
}