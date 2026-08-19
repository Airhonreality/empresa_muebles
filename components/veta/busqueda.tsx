"use client";

import { useId } from "react";
import { Search, X } from "lucide-react";

export interface BusquedaProps {
  valor: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

/* Primitiva Búsqueda (D4 §2.2, variante local). Alto mínimo 48px, radio sm, icono lupa
   `--veta-text-muted`, botón ✕ para limpiar. a11y: label + aria-label (input de búsqueda). */
export function Busqueda({
  valor,
  onChange,
  placeholder = "Buscar...",
  label = "Buscar",
  className = "",
}: BusquedaProps) {
  const id = useId();
  return (
    <div className={`relative ${className}`}>
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
      />
      <input
        id={id}
        type="search"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper pl-9 pr-9 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus [&::-webkit-search-cancel-button]:hidden"
      />
      {valor && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpiar búsqueda"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-text-muted hover:bg-bg-alt hover:text-text-heading transition-colors"
        >
          <X aria-hidden className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}