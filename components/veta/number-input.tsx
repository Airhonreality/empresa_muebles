"use client";

import { type InputHTMLAttributes, useId } from "react";
import { useDebouncedInput } from "@/lib/hooks/useDebouncedInput";

export interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  step?: number | string;
  min?: number | string;
}

/* Primitiva NumberInput (C4). step=0.5 para jornadas, inputmode="decimal", aria-label. */
export function NumberInput({
  value,
  onChange,
  label,
  error,
  step = 1,
  min = 0,
  className = "",
  ...props
}: NumberInputProps) {
  const id = useId();
  const { local, onChangeLocal, onBlurLocal } = useDebouncedInput(value, onChange);
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    onChangeLocal(e.target.value);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text-muted">
          {label}
        </label>
      )}
      <input
        id={id}
        type="number"
        inputMode="decimal"
        step={step}
        min={min}
        value={local}
        onChange={handleChange}
        onBlur={onBlurLocal}
        className={`w-full min-h-[44px] rounded-sm border bg-bg-paper px-3 text-base text-text-primary outline-none ${
          error
            ? "border-error-stroke focus:border-error-stroke"
            : "border-border-subtle focus:border-brand"
        } focus:shadow-ring-focus`}
        aria-label={props["aria-label"] || "Cantidad"}
        {...props}
      />
      {error && (
        <p role="alert" className="text-xs text-error-text">
          {error}
        </p>
      )}
    </div>
  );
}
