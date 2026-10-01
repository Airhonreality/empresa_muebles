"use client";

import { type InputHTMLAttributes, useId } from "react";
import { useDebouncedInput } from "@/lib/hooks/useDebouncedInput";
import { normalizarNumeroTexto } from "@/lib/utils/numero";

export interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
}

/* Primitiva NumberInput (C4). `type="number"` nativo delega el manejo de "," vs "." al
   navegador/SO del usuario -- fuente real de la inconsistencia reportada (2026-09-30: "trolea"
   según el separador, a veces vacía el campo). Se reemplaza por un `text` controlado que
   normaliza con `normalizarNumeroTexto` (agnóstico al separador) al perder foco, igual que
   `MoneyInput` solo reformatea al perder foco -- mientras se escribe se respeta el texto crudo. */
export function NumberInput({
  value,
  onChange,
  label,
  error,
  className = "",
  ...props
}: NumberInputProps) {
  const id = useId();
  const { local, onChangeLocal, onBlurLocal } = useDebouncedInput(value, onChange);

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    onChangeLocal(e.target.value.replace(/[^\d.,]/g, ""));
  };

  const handleBlur = () => {
    onChangeLocal(normalizarNumeroTexto(local));
    onBlurLocal();
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
        type="text"
        inputMode="decimal"
        value={local}
        onChange={handleChange}
        onBlur={handleBlur}
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
