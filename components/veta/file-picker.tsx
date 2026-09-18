"use client";

import { useCallback, useId, useRef, useState, type DragEvent } from "react";
import { uploadArchivoToR2 } from "@/lib/r2/upload";

export interface FilePickerProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
  /** Filtro del input nativo, ej ".pdf,.dwg,application/pdf". Default: cualquier archivo. */
  accept?: string;
  /** Múltiples archivos en el mismo picker. Default true. */
  multiple?: boolean;
  /** Prefijo para la clave en R2 (ej: 'cotizador/artefactos/archivos'). Default: 'archivos'. */
  r2Prefix?: string;
}

function nombreDeUrl(url: string): string {
  try {
    const base = new URL(url).pathname.split("/").pop() ?? url;
    return decodeURIComponent(base).replace(/^\d+-/, "");
  } catch {
    return url;
  }
}

function extensionDeUrl(url: string): string {
  const n = nombreDeUrl(url);
  const ext = n.split(".").pop();
  return ext && ext !== n ? ext.slice(0, 8).toUpperCase() : "FILE";
}

/**
 * FilePicker (D4) — selector de archivos genéricos (fichas técnicas PDF, planos,
 * especificaciones) que sube TODO a Cloudflare R2. Complementa a ImagePicker en
 * los campos de cotización que necesitan documentos además de fotos. NUNCA genera
 * URLs blob: para la base de datos.
 */
export function FilePicker({
  label,
  value,
  onChange,
  className = "",
  accept,
  multiple = true,
  r2Prefix = "archivos",
}: FilePickerProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const agregarArchivos = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    setUploadError(null);
    setIsUploading(true);

    const nuevasUrls: string[] = [];
    const errores: string[] = [];

    for (const file of files) {
      try {
        const resultado = await uploadArchivoToR2(file, r2Prefix);
        if (resultado.ok) {
          nuevasUrls.push(resultado.url);
        } else {
          errores.push(`${file.name}: ${resultado.error}`);
        }
      } catch (error) {
        console.error("Error al subir archivo a R2:", error);
        errores.push(`${file.name}: ${error instanceof Error ? error.message : "Fallo al subir a R2"}`);
      }
    }

    setIsUploading(false);

    if (errores.length > 0) {
      setUploadError(`No se pudieron subir ${errores.length} archivo(s): ${errores.join(", ")}`);
    }

    if (nuevasUrls.length > 0) {
      const combinadas = multiple
        ? Array.from(new Set([...value, ...nuevasUrls]))
        : nuevasUrls.slice(-1);
      onChange(combinadas);
    }
  }, [value, onChange, multiple, r2Prefix]);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) void agregarArchivos(files);
  };

  const quitar = (url: string) => onChange(value.filter((v) => v !== url));

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <span className="text-sm font-medium text-text-muted">{label}</span>

      {value.length > 0 && (
        <ul className="space-y-1">
          {value.map((url) => (
            <li
              key={url}
              className="flex items-center justify-between gap-2 rounded-sm border border-border-subtle bg-bg-alt/50 px-2 py-1"
            >
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                title={nombreDeUrl(url)}
                className="flex min-w-0 items-center gap-2 text-xs text-text-primary transition-colors duration-fast hover:text-gold-600"
              >
                <span className="flex-shrink-0 rounded-sm bg-gold-500/15 px-1 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-gold-700">
                  {extensionDeUrl(url)}
                </span>
                <span className="truncate">{nombreDeUrl(url)}</span>
              </a>
              <button
                type="button"
                onClick={() => quitar(url)}
                aria-label="Quitar archivo"
                className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs leading-none text-text-muted transition-colors duration-fast hover:bg-red-600 hover:text-white"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        tabIndex={0}
        role="group"
        aria-label={`${label} — arrastrar archivos o examinar`}
        className={`rounded-sm border-2 border-dashed p-3 transition-colors duration-fast focus:outline-none focus:shadow-ring-focus ${
          isDragOver ? "border-gold-400 bg-bg-alt" : "border-border-subtle"
        }`}
      >
        <p className="text-center text-xs text-text-muted">
          Arrastrá archivos (PDF, fichas técnicas, planos) o examiná tu equipo
        </p>
      </div>

      <div className="flex gap-2">
        <input
          id={id}
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length > 0) void agregarArchivos(files);
            e.target.value = "";
          }}
          disabled={isUploading}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-sm border border-border-subtle px-3 text-xs text-text-muted transition-colors duration-fast hover:bg-bg-alt disabled:opacity-50"
          disabled={isUploading}
        >
          {isUploading ? "Subiendo a R2..." : "Examinar"}
        </button>
      </div>

      {uploadError && (
        <p className="mt-1 rounded border border-red-200 bg-red-50 p-1.5 text-xs text-red-600" role="alert">
          {uploadError}
        </p>
      )}
    </div>
  );
}