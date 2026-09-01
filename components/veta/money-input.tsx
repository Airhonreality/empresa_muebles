"use client";

import { useState, useId, type InputHTMLAttributes } from "react";
import { useDebouncedInput } from "@/lib/hooks/useDebouncedInput";

export interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
}

/* Primitiva MoneyInput (C4). Formateo COP, inputmode="decimal", aria-label.
   `local` (useDebouncedInput) es la fuente de verdad mientras se edita -- nunca se pisa por un
   re-render del store mientras el usuario escribe; solo se formatea a COP bonito al perder foco. */
export function MoneyInput({ value, onChange, label, error, className = "", ...props }: MoneyInputProps) {
  const id = useId();
  const { local, onChangeLocal, onBlurLocal } = useDebouncedInput(value, onChange);
  const [focused, setFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    onChangeLocal(raw);
  };

  const handleFocus = () => setFocused(true);

  const handleBlur = () => {
    setFocused(false);
    onBlurLocal();
  };

  const displayValue = focused ? local : formatCOPInput(local);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text-muted">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="w-full min-h-[44px] rounded-sm border bg-bg-paper px-3 text-base text-text-primary outline-none border-border-subtle focus:border-brand focus:shadow-ring-focus"
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
