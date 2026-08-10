"use client";

import { useCallback, useId, useRef, useState, type DragEvent, type ClipboardEvent } from "react";

export interface ImagePickerProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
  /** false = una sola imagen (reemplaza en vez de acumular). Default true. */
  multiple?: boolean;
}

/* Primitiva ImagePicker (D4) — ÚNICO input de imagen del proyecto, por
   consistencia (pantallas privadas y públicas). Grid de miniaturas +
   arrastrar/pegar/URL en un solo control. Sin backend de storage real (F10
   mock): los archivos se previsualizan vía URL.createObjectURL, igual que el
   resto de los datos mock, se resetean con el servidor. Tokens de
   border-border-subtle/focus:shadow-ring-focus, mismo patrón que
   input-field.tsx. */
export function ImagePicker({ label, value, onChange, className = "", multiple = true }: ImagePickerProps) {
  const id = useId();
  const [urlDraft, setUrlDraft] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const agregar = useCallback((url: string) => {
    const limpio = url.trim();
    if (!limpio) return;
    if (!multiple) { onChange([limpio]); return; }
    if (value.includes(limpio)) return;
    onChange([...value, limpio]);
  }, [value, onChange, multiple]);

  const agregarArchivo = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    agregar(URL.createObjectURL(file));
  }, [agregar]);

  const quitar = (url: string) => onChange(value.filter((v) => v !== url));

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    Array.from(e.dataTransfer.files).forEach(agregarArchivo);
    const texto = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
    if (texto) agregar(texto);
  };

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    const archivo = Array.from(e.clipboardData.items).find((it) => it.type.startsWith("image/"))?.getAsFile();
    if (archivo) { agregarArchivo(archivo); return; }
    const texto = e.clipboardData.getData("text");
    if (texto) agregar(texto);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <span className="text-sm font-medium text-text-muted">{label}</span>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onPaste={handlePaste}
        tabIndex={0}
        role="group"
        aria-label={`${label} — arrastrar, pegar o agregar por URL`}
        className={`rounded-sm border-2 border-dashed p-3 transition-colors duration-fast focus:outline-none focus:shadow-ring-focus ${
          isDragOver ? "border-gold-400 bg-bg-alt" : "border-border-subtle"
        }`}
      >
        {value.length > 0 && (
          <div className={multiple ? "grid grid-cols-4 gap-2 mb-2 sm:grid-cols-6" : "mb-2 flex justify-center"}>
            {value.map((url) => (
              <div key={url} className={`group relative aspect-square overflow-hidden rounded-sm border border-border-subtle bg-bg-paper ${multiple ? "" : "w-24"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- URLs mock/blob: temporales, no assets estáticos optimizables */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => quitar(url)}
                  aria-label="Quitar imagen"
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs leading-none text-white opacity-0 transition-opacity duration-fast group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {(multiple || value.length === 0) && (
          <p className="text-center text-xs text-text-muted">
            Arrastrá una imagen, pegala (Ctrl+V) o agregá un link abajo
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); agregar(urlDraft); setUrlDraft(""); }
          }}
          placeholder="https://..."
          className="min-h-[36px] flex-1 rounded-sm border border-border-subtle bg-bg-paper px-2 text-xs text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
        />
        <button
          type="button"
          onClick={() => { agregar(urlDraft); setUrlDraft(""); }}
          className="rounded-sm border border-border-subtle px-3 text-xs text-text-muted transition-colors duration-fast hover:bg-bg-alt"
        >
          + URL
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={(e) => { Array.from(e.target.files ?? []).forEach(agregarArchivo); e.target.value = ""; }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-sm border border-border-subtle px-3 text-xs text-text-muted transition-colors duration-fast hover:bg-bg-alt"
        >
          Examinar
        </button>
      </div>
    </div>
  );
}
