"use client";

import { useState, useEffect, useRef, type KeyboardEvent } from "react";
import { InputField } from "./input-field";

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
}

/* Primitiva SmartSearch (C4). Fuzzy + historial localStorage, combobox, crear on-the-fly. */
export function SmartSearch({
  items,
  onSelect,
  placeholder = "Buscar en catálogo...",
  label = "Producto",
  className = "",
  allowCreate = true,
  onCreateNew,
}: SmartSearchProps) {
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState<SmartSearchItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fuzzy filter
  useEffect(() => {
    if (!query.trim()) {
      setFiltered([]);
      return;
    }
    const q = query.toLowerCase();
    const results = items.filter(
      (item) =>
        item.descripcion.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        (item.categoriaComercial?.toLowerCase().includes(q) ?? false) ||
        (item.tipo?.toLowerCase().includes(q) ?? false)
    );
    setFiltered(results.slice(0, 10));
    setSelectedIndex(-1);
  }, [query, items]);

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
    setQuery(item.descripcion);
    setShowDropdown(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (filtered.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(filtered[selectedIndex]);
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
          setShowDropdown(true);
        }}
        onFocus={() => query.trim() && setShowDropdown(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        aria-controls="smart-search-list"
      />
      {showDropdown && (filtered.length > 0 || allowCreate) && (
        <ul
          id="smart-search-list"
          className="absolute z-50 mt-1 w-full rounded-md border border-border-subtle bg-bg-raised shadow-lg max-h-60 overflow-y-auto"
          role="listbox"
        >
          {filtered.map((item, index) => (
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
