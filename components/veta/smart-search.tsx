"use client";

import { useState, useEffect, useRef, useCallback, type KeyboardEvent } from "react";
import { InputField } from "./input-field";
import { useSmartSearch } from "@/lib/hooks/useSmartSearch";

export interface SmartSearchItem {
  id: string;
  sku: string;
  descripcion: string;
  tipo?: string | null;
  precioPublico?: string | null;
  precioDirecto?: string | null;
  categoriaComercial?: string | null;
}

export interface SmartSearchProps {
  items: SmartSearchItem[];
  onSelect: (item: SmartSearchItem) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  allowCreate?: boolean;
  onCreateNew?: () => void;
  /** Contexto de búsqueda (A.5): aísla historial/uso por pantalla y habilita sugerencias
   *  de "uso frecuente" cuando el campo está vacío. Ej. "comercial-kanban". */
  contexto?: string;
}

/* Primitiva SmartSearch (C4). Combobox con matcher resiliente en capas (t-141):
   normalización + tokens AND + fuzzy acotado (Opción A), historial/uso por contexto en
   localStorage (A.5), crear on-the-fly. */
export function SmartSearch({
  items,
  onSelect,
  placeholder = "Buscar en catálogo...",
  label = "Producto",
  className = "",
  allowCreate = true,
  onCreateNew,
  contexto,
}: SmartSearchProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const getCampos = useCallback(
    (item: SmartSearchItem) => [
      item.descripcion,
      item.sku,
      item.categoriaComercial ?? "",
      item.tipo ?? "",
    ],
    []
  );

  const { query, setQuery, resultado: filtered, usoFrecuente, registrarUso } = useSmartSearch({
    items,
    getCampos,
    contexto,
    fuzzy: true,
    limite: 10,
  });

  // Query vacía + contexto: sugerencias de uso frecuente (A.5). Con query o sin contexto: resultados filtrados/predeterminados.
  const itemsSugeridos = query.trim()
    ? filtered
    : (contexto && usoFrecuente.length > 0)
    ? usoFrecuente
    : filtered;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: SmartSearchItem) => {
    onSelect(item);
    registrarUso(item);
    setQuery(item.descripcion);
    setShowDropdown(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (itemsSugeridos.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % itemsSugeridos.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + itemsSugeridos.length) % itemsSugeridos.length);
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(itemsSugeridos[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <InputField
        label={label}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelectedIndex(-1);
          setShowDropdown(true);
        }}
        onFocus={() => {
          if (query.trim() || itemsSugeridos.length > 0) setShowDropdown(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        aria-controls="smart-search-list"
      />
      {showDropdown && (itemsSugeridos.length > 0 || (allowCreate && query.trim() && onCreateNew)) && (
        <ul
          id="smart-search-list"
          className="absolute z-50 mt-1 w-full rounded-md border border-border-subtle bg-bg-raised shadow-lg max-h-60 overflow-y-auto"
          role="listbox"
        >
          {!query.trim() && contexto && usoFrecuente.length > 0 && (
            <li
              role="presentation"
              className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted"
            >
              Uso frecuente
            </li>
          )}
          {itemsSugeridos.map((item, index) => (
            <li
              key={item.id}
              role="option"
              aria-selected={selectedIndex === index}
              onClick={() => handleSelect(item)}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-bg-alt ${
                selectedIndex === index ? "bg-bg-alt" : ""
              }`}
            >
              <div className="font-medium text-text-heading">{item.descripcion}</div>
              <div className="text-xs text-text-muted">
                {item.sku} · {item.categoriaComercial ?? item.tipo}
                {item.precioPublico && (
                  <span className="ml-2 font-mono">${parseMoney(item.precioPublico).toLocaleString()}</span>
                )}
              </div>
            </li>
          ))}
          {allowCreate && filtered.length === 0 && query.trim() && onCreateNew && (
            <li
              role="option"
              aria-selected={false}
              onClick={onCreateNew}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-bg-alt text-gold-600"
            >
              + Crear &quot;{query}&quot; en catálogo
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

// Utility to parse money string
export function parseMoney(value: string): number {
  if (!value) return 0;
  const raw = value.replace(/[^\d]/g, "");
  return raw ? parseInt(raw, 10) : 0;
}