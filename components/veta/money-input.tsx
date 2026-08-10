"use client";

import { useState, useEffect, useRef, type InputHTMLAttributes } from "react";

export interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
}

/* Primitiva MoneyInput (C4). Formateo COP, inputmode="decimal", aria-label. */
export function MoneyInput({ value, onChange, label, error, className = "", ...props }: MoneyInputProps) {
  const id = useRef(`money-${Math.random().toString(36).slice(2)}`).current;
  const [displayValue, setDisplayValue] = useState<string>(formatCOPInput(value));

  // Sync display when external value changes
  useEffect(() => {
    setDisplayValue(formatCOPInput(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    onChange(raw);
  };

  const handleBlur = () => {
    // Re-format on blur to show pretty COP
    setDisplayValue(formatCOPInput(value));
  };

  const handleFocus = () => {
    // Show raw number for editing
    setDisplayValue(value);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text-muted">
          {label}
        </label>
      )}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">$</span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="w-full min-h-[44px] rounded-sm border bg-bg-paper pl-7 pr-3 text-base text-text-primary outline-none border-border-subtle focus:border-brand focus:shadow-ring-focus"
          aria-label={props["aria-label"] || "Monto en COP"}
          {...props}
        />
      </div>
      {error && (
        <p role="alert" className="text-xs text-error-text">
          {error}
        </p>
      )}
    </div>
  );
}

// Format for display: remove formatting for editing, but show COP on blur
function formatCOPInput(val: string): string {
  if (!val) return "";
  const n = parseInt(val, 10);
  if (isNaN(n)) return val;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

// Utility to parse money string to number
export function parseMoney(value: string): number {
  if (!value) return 0;
  const raw = value.replace(/[^\d]/g, "");
  return raw ? parseInt(raw, 10) : 0;
}
