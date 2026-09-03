"use client";

import { useCallback, useId, useRef, useState, type DragEvent, type ClipboardEvent } from "react";
import { uploadFileToR2 } from "@/lib/r2/upload";

export interface ImagePickerProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
  /** false = una sola imagen (reemplaza en vez de acumular). Default true. */
  multiple?: boolean;
  /** Habilitar subida automática a Cloudflare R2. Default: false (solo previsualización local). */
  uploadToR2?: boolean;
  /** Prefijo para la clave en R2 (ej: 'portafolio/', 'cotizador/'). Default: 'portafolio'. */
  r2Prefix?: string;
  /** Oculta la grilla interna de previsualización (útil si el componente padre renderiza su propia grilla). Default: false. */
  hideGrid?: boolean;
}

/* Primitiva ImagePicker (D4) — ÚNICO input de imagen del proyecto, por
   consistencia (pantallas privadas y públicas). Grid de miniaturas +
   arrastrar/pegar/URL en un solo control.
   - Si uploadToR2=true: sube automáticamente a Cloudflare R2 y usa URLs permanentes.
   - Si uploadToR2=false: usa URL.createObjectURL para previsualización local (mock).
   Tokens de border-border-subtle/focus:shadow-ring-focus, mismo patrón que
   input-field.tsx. */
export function ImagePicker({
  label,
  value,
  onChange,
  className = "",
  multiple = true,
  uploadToR2 = false,
  r2Prefix = "portafolio",
  hideGrid = false,
}: ImagePickerProps) {
  const id = useId();
  const [urlDraft, setUrlDraft] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const agregar = useCallback((url: string) => {
    const limpio = url.trim();
    if (!limpio) return;
    if (!multiple) { onChange([limpio]); return; }
    if (value.includes(limpio)) return;
    onChange([...value, limpio]);
  }, [value, onChange, multiple]);

  const agregarArchivosLote = useCallback(async (files: File[]) => {
    const imagenes = files.filter((f) => f.type.startsWith("image/"));
    if (imagenes.length === 0) return;

    if (!multiple) {
      const file = imagenes[0];
      if (uploadToR2) {
        try {
          setIsUploading(true);
          const url = await uploadFileToR2(file, r2Prefix);
          onChange([url]);
        } catch (error) {
          console.error("Error al subir a R2:", error);
          onChange([URL.createObjectURL(file)]);
        } finally {
          setIsUploading(false);
        }
      } else {
        onChange([URL.createObjectURL(file)]);
      }
      return;
    }

    setIsUploading(true);
    try {
      const nuevasUrls = await Promise.all(
        imagenes.map(async (file) => {
          if (uploadToR2) {
            try {
              return await uploadFileToR2(file, r2Prefix);
            } catch (error) {
              console.error("Error al subir a R2:", error);
              return URL.createObjectURL(file);
            }
          }
          return URL.createObjectURL(file);
        })
      );
      const combinadas = Array.from(new Set([...value, ...nuevasUrls]));
      onChange(combinadas);
    } finally {
      setIsUploading(false);
    }
  }, [value, onChange, multiple, uploadToR2, r2Prefix]);

  const quitar = (url: string) => onChange(value.filter((v) => v !== url));

  const mover = (deIndex: number, aIndex: number) => {
    if (aIndex < 0 || aIndex >= value.length) return;
    const copia = [...value];
    const [item] = copia.splice(deIndex, 1);
    copia.splice(aIndex, 0, item);
    onChange(copia);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      void agregarArchivosLote(files);
    }
    const texto = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
    if (texto) agregar(texto);
  };

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    const archivos = Array.from(e.clipboardData.items)
      .filter((it) => it.type.startsWith("image/"))
      .map((it) => it.getAsFile())
      .filter((f): f is File => f !== null);

    if (archivos.length > 0) {
      void agregarArchivosLote(archivos);
      return;
    }
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
        {value.length > 0 && !hideGrid && (
          <div className={multiple ? "grid grid-cols-3 gap-2 mb-2 sm:grid-cols-4 md:grid-cols-6" : "mb-2 flex justify-center"}>
            {value.map((url, idx) => (
              <div key={url} className={`group relative aspect-square overflow-hidden rounded-sm border border-border-subtle bg-bg-paper ${multiple ? "" : "w-24"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- URLs mock/blob: temporales, no assets estáticos optimizables */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                
                {/* Controles de reordenamiento e índice */}
                {multiple && value.length > 1 && (
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-black/70 px-1 py-0.5 opacity-90 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => mover(idx, idx - 1)}
                      className="px-1 text-[11px] font-bold text-white transition-colors hover:text-gold-400 disabled:opacity-20"
                      title="Mover antes"
                      aria-label="Mover imagen antes"
                    >
                      ◀
                    </button>
                    <span className="font-mono text-[10px] text-white/90 font-medium">#{idx + 1}</span>
                    <button
                      type="button"
                      disabled={idx === value.length - 1}
                      onClick={() => mover(idx, idx + 1)}
                      className="px-1 text-[11px] font-bold text-white transition-colors hover:text-gold-400 disabled:opacity-20"
                      title="Mover después"
                      aria-label="Mover imagen después"
                    >
                      ▶
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => quitar(url)}
                  aria-label="Quitar imagen"
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs leading-none text-white opacity-0 transition-opacity duration-fast group-hover:opacity-100 hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {(multiple || value.length === 0) && (
          <p className="text-center text-xs text-text-muted">
            Arrastrá una o varias imágenes, pegalas (Ctrl+V) o agregá un link abajo
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
           disabled={isUploading}
         />
         <button
           type="button"
           onClick={() => { agregar(urlDraft); setUrlDraft(""); }}
           className="rounded-sm border border-border-subtle px-3 text-xs text-text-muted transition-colors duration-fast hover:bg-bg-alt disabled:opacity-50"
           disabled={isUploading}
         >
           + URL
         </button>
         <input
           ref={inputRef}
           type="file"
           accept="image/*"
           multiple={multiple}
           className="hidden"
           onChange={(e) => {
             const files = Array.from(e.target.files ?? []);
             if (files.length > 0) void agregarArchivosLote(files);
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
           {isUploading ? "Subiendo..." : "Examinar"}
         </button>
       </div>
    </div>
  );
}
