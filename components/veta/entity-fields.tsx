"use client";

import { InputField } from "@/components/veta/input-field";
import { MoneyInput } from "@/components/veta/money-input";
import { NumberInput } from "@/components/veta/number-input";

interface BaseFieldSpec<T> {
  key: Extract<keyof T, string>;
  label: string;
  /** Ocupa las 2 columnas en un contenedor grid-cols-2. Sin efecto si el contenedor no es grid. */
  colSpan?: "full";
}

export interface TextFieldSpec<T> extends BaseFieldSpec<T> {
  kind?: "text";
  type?: "text" | "email" | "tel";
  placeholder?: string;
  required?: boolean;
}

export interface MoneyFieldSpec<T> extends BaseFieldSpec<T> {
  kind: "money";
}

export interface NumberFieldSpec<T> extends BaseFieldSpec<T> {
  kind: "number";
  min?: number;
  step?: number;
}

/** Campos de valor texto/dinero/número. Imágenes, archivos y selects relacionales (que
 *  dependen de una lista viva de otra entidad, ej. proveedor) tienen otro tipo de valor
 *  (array, o id foráneo) y quedan fuera a propósito — ver EntitySelector (pendiente). */
export type EntityFieldSpec<T> = TextFieldSpec<T> | MoneyFieldSpec<T> | NumberFieldSpec<T>;

export interface EntityFieldsProps<T> {
  fields: EntityFieldSpec<T>[];
  values: T;
  onChange: (key: Extract<keyof T, string>, value: string) => void;
  className?: string;
}

/* Primitiva EntityFields: un spec de campos (declarado una vez por entidad, ver
   lib/forms/*-form-spec.ts) + un objeto de valores = el mismo formulario en cualquier
   pantalla que lo necesite, en vez de reimplementar los inputs a mano cada vez. */
export function EntityFields<T>({ fields, values, onChange, className = "" }: EntityFieldsProps<T>) {
  const valoresTexto = values as Record<string, string>;
  const claseCol = (f: EntityFieldSpec<T>) => (f.colSpan === "full" ? "col-span-2" : undefined);

  return (
    <div className={className}>
      {fields.map((f) => {
        const valor = valoresTexto[f.key] ?? "";
        if (f.kind === "money") {
          return (
            <MoneyInput
              key={f.key}
              label={f.label}
              value={valor}
              onChange={(v) => onChange(f.key, v)}
              className={claseCol(f)}
            />
          );
        }
        if (f.kind === "number") {
          return (
            <NumberInput
              key={f.key}
              label={f.label}
              value={valor}
              onChange={(v) => onChange(f.key, v)}
              min={f.min}
              step={f.step}
              className={claseCol(f)}
            />
          );
        }
        return (
          <InputField
            key={f.key}
            label={f.label}
            type={f.type ?? "text"}
            value={valor}
            onChange={(e) => onChange(f.key, e.target.value)}
            placeholder={f.placeholder}
            required={f.required}
            className={claseCol(f)}
          />
        );
      })}
    </div>
  );
}
