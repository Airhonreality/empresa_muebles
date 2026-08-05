"use client";

import {
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  useId,
} from "react";

export interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

/* Primitiva InputField (A4 #13). Tokens de borde/focus (B1-CV-01: hit-area >=44px
   → padding vertical mínimo). focus ring token (`shadow-ring-focus`). */
export function InputField({ label, error, className = "", ...props }: InputFieldProps) {
  const id = useId();
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-text-muted">
        {label}
      </label>
      <input
        id={id}
        className={`w-full min-h-[44px] rounded-sm  border bg-bg-paper px-3 text-base text-text-primary outline-none
          ${
            error
              ? "border-error-stroke focus:border-error-stroke"
              : "border-border-subtle focus:border-brand"
          }
          focus:shadow-ring-focus`}
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

export function useFormLabel(): LabelHTMLAttributes<HTMLLabelElement> {
  return { className: "text-sm font-medium text-text-muted" };
}