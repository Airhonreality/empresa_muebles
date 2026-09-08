"use client";

import { useCallback, useId, useRef, useState, type DragEvent, type ClipboardEvent } from "react";
import { uploadFileToR2, clonarUrlAR2 } from "@/lib/r2/upload";
import { esUrlR2 } from "@/lib/r2/sanitize";

export interface ImagePickerProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
  /** false = una sola imagen (reemplaza en vez de acumular). Default true. */
  multiple?: boolean;
  /** Habilitar subida automática a Cloudflare R2. Default: true (almacenamiento permanente en CDN). */
  uploadToR2?: boolean;
  /** Prefijo para la clave en R2 (ej: 'catalogo/', 'cotizador/disenio'). Default: 'general'. */
  r2Prefix?: string;
  /** Oculta la grilla interna de previsualización (útil si el componente padre renderiza su propia grilla). Default: false. */
  hideGrid?: boolean;
}

/**
 * Pre-comprime imágenes en el navegador si superan 3 MB o 2560px de resolución.
 * Esto evita chocar con el límite innegociable de 4.5 MB de Vercel Serverless Functions
 * cuando los usuarios suben fotos de cámaras/celulares modernos (que pesan 8-20 MB).
 */
async function prepareImageForUpload(file: File): Promise<File> {
  // Si pesa menos de 3 MB, dejar pasar directamente sin re-procesar en canvas
  if (file.size <= 3 * 1024 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      resolve(file);
      return;
    }

    const img = document.createElement("img");
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        const MAX_DIM = 2560;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
            const compressedFile = new File([blob], cleanName, {
              type: "image/webp",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/webp",
          0.90
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/* Primitiva ImagePicker (D4) — ÚNICO input de imagen del proyecto, por
   consistencia (pantallas privadas y públicas). Grid de miniaturas +
   arrastrar/pegar/URL en un solo control.
   - Por defecto sube SIEMPRE a Cloudflare R2 para garantizar persistencia y CDN permanente.
   - NUNCA genera URLs blob: locales para base de datos (evita que se dañen a los 5 minutos). */
export function ImagePicker({
  label,
  value,
  onChange,
  className = "",
  multiple = true,
  uploadToR2 = true, // CANÓNICO: Siempre subir a R2 por defecto
  r2Prefix = "general",
  hideGrid = false,
}: ImagePickerProps) {
  const id = useId();
  const [urlDraft, setUrlDraft] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const agregar = useCallback(async (url: string) => {
    const limpio = url.trim();
    if (!limpio) return;
    if (limpio.startsWith("blob:")) {
      setUploadError("No se permiten URLs temporales de tipo blob:. Sube la imagen usando el botón Examinar o Arrastrar.");
      return;
    }
    setUploadError(null);

    let destino = limpio;
    if (uploadToR2 && !esUrlR2(limpio)) {
      setIsUploading(true);
      try {
        const resultado = await clonarUrlAR2(limpio, r2Prefix);
        if (!resultado.ok) {
          setUploadError(resultado.error);
          return;
        }
        destino = resultado.url;
      } catch (error) {
        console.error("Error al clonar URL a R2:", error);
        setUploadError(`No se pudo clonar la imagen a R2: ${error instanceof Error ? error.message : "Fallo en la conexión"}`);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    if (!multiple) { onChange([destino]); return; }
    if (value.includes(destino)) return;
    onChange([...value, destino]);
  }, [value, onChange, multiple, uploadToR2, r2Prefix]);

  const subirArchivo = async (archivoCrudo: File): Promise<string> => {
    const archivoOptimizado = await prepareImageForUpload(archivoCrudo);
    const formData = new FormData();
    formData.append("file", archivoOptimizado);
    formData.append("prefix", r2Prefix);
    const resultado = await uploadFileToR2(formData);
    if (!resultado.ok) {
      throw new Error(resultado.error);
    }
    return resultado.url;
  };

  const agregarArchivosLote = useCallback(async (files: File[]) => {
    const imagenes = files.filter((f) => f.type.startsWith("image/"));
    if (imagenes.length === 0) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      if (!multiple) {
        const file = imagenes[0];
        if (uploadToR2) {
          try {
            const url = await subirArchivo(file);
            onChange([url]);
          } catch (error) {
            console.error("Error al subir a R2:", error);
            setUploadError(`Error al subir a Cloudflare R2: ${error instanceof Error ? error.message : "Fallo en la conexión"}`);
          }
        } else {
          onChange([URL.createObjectURL(file)]);
        }
        return;
      }

      const nuevasUrls: string[] = [];
      const errores: string[] = [];

      for (const file of imagenes) {
        if (uploadToR2) {
          try {
            const url = await subirArchivo(file);
            nuevasUrls.push(url);
          } catch (error) {
            console.error("Error al subir a R2:", error);
            errores.push(`${file.name}: ${error instanceof Error ? error.message : "Fallo al subir a R2"}`);
          }
        } else {
          nuevasUrls.push(URL.createObjectURL(file));
        }
      }

      if (errores.length > 0) {
        setUploadError(`No se pudieron subir ${errores.length} imagen(es): ${errores.join(", ")}`);
      }

      if (nuevasUrls.length > 0) {
        const combinadas = Array.from(new Set([...value, ...nuevasUrls]));
        onChange(combinadas);
      }
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
    if (texto) void agregar(texto);
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
    if (texto) void agregar(texto);
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
             if (e.key === "Enter") { e.preventDefault(); void agregar(urlDraft); setUrlDraft(""); }
           }}
           placeholder="https://..."
           className="min-h-[36px] flex-1 rounded-sm border border-border-subtle bg-bg-paper px-2 text-xs text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
           disabled={isUploading}
         />
         <button
           type="button"
           onClick={() => { void agregar(urlDraft); setUrlDraft(""); }}
           className="rounded-sm border border-border-subtle px-3 text-xs text-text-muted transition-colors duration-fast hover:bg-bg-alt disabled:opacity-50"
           disabled={isUploading}
          >
            {isUploading ? "Clonando a R2..." : "+ URL"}
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
            {isUploading ? "Subiendo a R2..." : "Examinar"}
          </button>
        </div>
        {uploadError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-1.5 mt-1" role="alert">
            {uploadError}
          </p>
        )}
     </div>
  );
}
