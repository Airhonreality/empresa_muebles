"use client";

import { useState, useId, useRef, type InputHTMLAttributes } from "react";
import { useDebouncedInput } from "@/lib/hooks/useDebouncedInput";
import { useUndoHistorial, detectarAtajoDeshacer } from "@/lib/hooks/useUndoHistorial";
import { parteEnteraDb } from "@/lib/utils/dinero";

export interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
}

/* Primitiva MoneyInput (C4). Formateo COP, inputmode="decimal", aria-label.
   `local` (useDebouncedInput) es la fuente de verdad mientras se edita -- nunca se pisa por un
   re-render del store mientras el usuario escribe; solo se formatea a COP bonito al perder foco.
   t-194: el valor entrante puede venir como numeric de Postgres ("250000.00"); se toma solo la
   parte entera para no multiplicar por 100 al filtrar dígitos. */
export function MoneyInput({ value, onChange, label, error, className = "", ...props }: MoneyInputProps) {
  const id = useId();
  // t-195: delayMs 0 => no hay escritura por pausa; solo Enter, salir del campo, o Escape (revierte).
  const { local, onChangeLocal, onBlurLocal, revertir } = useDebouncedInput(parteEnteraDb(value), onChange, 0);
  const cancelarRef = useRef(false);
  const [focused, setFocused] = useState(false);
  // t-194: el primer clic tras enfocar coloca el cursor y deshace la selección; se bloquea una vez.
  const seleccionPendiente = useRef(false);
  // t-177: este input filtra cada tecla con una regex (deja pasar solo dígitos) -- eso
  // desincroniza el undo nativo del navegador (el DOM recuerda lo tecleado, React muestra la
  // versión filtrada). El historial propio reemplaza ese Ctrl+Z roto por uno manual y confiable.
  const historial = useUndoHistorial(local);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    historial.registrar(raw);
    onChangeLocal(raw);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur(); // el blur confirma el valor (onBlurLocal)
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      cancelarRef.current = true; // el blur que sigue no debe confirmar el borrador
      revertir();
      e.currentTarget.blur();
      return;
    }
    const atajo = detectarAtajoDeshacer(e);
    if (!atajo) return;
    e.preventDefault();
    const valor = atajo === 'deshacer' ? historial.deshacer() : historial.rehacer();
    if (valor !== null) onChangeLocal(valor);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    seleccionPendiente.current = true;
    e.target.select();
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    if (!seleccionPendiente.current) return;
    seleccionPendiente.current = false;
    e.preventDefault();
  };

  const handleBlur = () => {
    setFocused(false);
    if (cancelarRef.current) {
      cancelarRef.current = false;
      return;
    }
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
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onMouseUp={handleMouseUp}
          onBlur={handleBlur}
          className="w-full min-h-[44px] rounded-sm border bg-bg-paper px-3 font-mono text-text-primary outline-none border-border-subtle focus:border-brand focus:shadow-ring-focus style:font-size:[clamp(14px,4vw,16px)]"
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
