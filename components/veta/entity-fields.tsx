"use client";

import { InputField } from "@/components/veta/input-field";

export interface EntityFieldSpec<T> {
  key: Extract<keyof T, string>;
  label: string;
  type?: "text" | "email" | "tel";
  placeholder?: string;
  required?: boolean;
  /** Ocupa las 2 columnas en un contenedor grid-cols-2. Sin efecto si el contenedor no es grid. */
  colSpan?: "full";
}

export interface EntityFieldsProps<T> {
  fields: EntityFieldSpec<T>[];
  values: T;
  onChange: (key: Extract<keyof T, string>, value: string) => void;
  className?: string;
}

/* Primitiva EntityFields: un spec de campos (declarado una vez por entidad, ver
   lib/forms/*-form-spec.ts) + un objeto de valores = el mismo formulario en cualquier
   pantalla que lo necesite, en vez de reimplementar los InputField a mano cada vez.
   T son siempre campos de texto (value de un <input>); entidades con otros tipos de
   campo (dinero, imágenes...) siguen usando sus propios primitivos aparte. */
export function EntityFields<T>({
  fields,
  values,
  onChange,
  className = "",
}: EntityFieldsProps<T>) {
  const valoresTexto = values as Record<string, string>;
  return (
    <div className={className}>
      {fields.map((f) => (
        <InputField
          key={f.key}
          label={f.label}
          type={f.type ?? "text"}
          value={valoresTexto[f.key] ?? ""}
          onChange={(e) => onChange(f.key, e.target.value)}
          placeholder={f.placeholder}
          required={f.required}
          className={f.colSpan === "full" ? "col-span-2" : undefined}
        />
      ))}
    </div>
  );
}
