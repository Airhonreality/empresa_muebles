'use client';
import React, { useCallback, useRef, useState } from 'react';
import { Upload, X, Loader2, Link, ImagePlus, FileUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml';

type SingleProps = {
  multiple?: false;
  value?: string;
  onChange: (url: string) => void;
  accept?: string;
  className?: string;
  placeholder?: string;
};

type MultipleProps = {
  multiple: true;
  value?: string[];
  onChange: (urls: string[]) => void;
  accept?: string;
  className?: string;
  placeholder?: string;
};

export type SmartImageInputProps = SingleProps | MultipleProps;

function matchesAccept(file: File, accept: string): boolean {
  return accept.split(',').some(a => {
    const t = a.trim();
    if (t === '*/*') return true;
    if (t.endsWith('/*')) return file.type.startsWith(t.slice(0, -1));
    return file.type === t;
  });
}

export function SmartImageInput(props: SmartImageInputProps) {
  const { multiple, accept = IMAGE_ACCEPT, className, placeholder } = props;
  const [uploading, setUploading]   = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput]     = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const urls: string[] = multiple
    ? (props.value ?? [])
    : props.value ? [props.value] : [];

  const emit = useCallback((next: string[]) => {
    if (multiple) (props as MultipleProps).onChange(next);
    else           (props as SingleProps).onChange(next[0] ?? '');
  }, [multiple, props]);

  const uploadFiles = useCallback(async (files: File[]) => {
    const valid = files.filter(f => matchesAccept(f, accept));
    if (!valid.length) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded: string[] = [];
      for (const file of valid) {
        const fd = new FormData();
        fd.append('file', file);
        const res  = await fetch('/api/upload', { method: 'POST', body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Upload failed');
        uploaded.push(json.url);
      }
      emit(multiple ? [...urls, ...uploaded] : uploaded);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir');
    } finally {
      setUploading(false);
    }
  }, [accept, urls, multiple, emit]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handlePaste = (e: React.ClipboardEvent) => {
    const img = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'));
    if (img) {
      e.preventDefault();
      const file = img.getAsFile();
      if (file) uploadFiles([file]);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) uploadFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) uploadFiles(files);
    e.target.value = '';
  };

  const handleUrlCommit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const url = urlInput.trim();
    if (!url) return;
    e.preventDefault();
    emit(multiple ? [...urls, url] : [url]);
    setUrlInput('');
  };

  const remove = (index: number) => emit(urls.filter((_, i) => i !== index));

  const isImage = (url: string) => /\.(jpe?g|png|webp|gif|svg|avif)(\?|$)/i.test(url);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      className={cn('space-y-2', className)}
      onPaste={handlePaste}
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Previews */}
      {urls.length > 0 && (
        <div className={cn('flex gap-2', multiple ? 'flex-wrap' : 'flex-col')}>
          {urls.map((url, i) => (
            <div
              key={i}
              className={cn(
                'relative rounded-md overflow-hidden bg-muted/20 border border-border/20 group',
                multiple ? 'w-20 h-20 shrink-0' : 'w-full aspect-video'
              )}
            >
              {isImage(url) ? (
                <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground">
                  <FileUp size={20} />
                  <span className="text-[9px] px-1 text-center break-all leading-tight">
                    {url.split('/').pop()}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone — always for multiple, only when empty for single */}
      {(multiple || !urls.length) && (
        <div
          onClick={() => fileRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center gap-1 rounded-md border border-dashed cursor-pointer transition-colors select-none',
            multiple ? 'h-14' : 'h-20',
            isDragging
              ? 'border-primary/70 bg-primary/8 text-primary'
              : 'border-border/40 bg-muted/10 text-muted-foreground hover:border-border/70 hover:bg-muted/20'
          )}
        >
          {uploading
            ? <Loader2 size={16} className="animate-spin" />
            : isDragging
              ? <ImagePlus size={16} />
              : <Upload size={16} />}
          <span className="text-[10px] leading-tight text-center px-3">
            {isDragging
              ? 'Suelta aquí'
              : 'Arrastra un archivo · Ctrl+V · o haz clic'}
          </span>
        </div>
      )}

      {/* URL input */}
      <div className="flex gap-1">
        <div className="relative flex-1 min-w-0">
          <Link size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={multiple ? urlInput : (urls[0] ?? '')}
            onChange={(e) =>
              multiple ? setUrlInput(e.target.value) : emit([e.target.value])
            }
            onKeyDown={multiple ? handleUrlCommit : undefined}
            placeholder={
              placeholder ?? (multiple
                ? 'Pega URL y pulsa Enter — o pega imagen con Ctrl+V'
                : 'https://... o pega imagen con Ctrl+V')
            }
            className="h-8 text-[11px] font-mono pl-7"
          />
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          title="Abrir selector de archivos"
          className="h-8 w-8 shrink-0 rounded-md border border-border/20 bg-muted/20 flex items-center justify-center hover:bg-muted/40 disabled:opacity-40 transition-colors"
        >
          {uploading
            ? <Loader2 size={12} className="animate-spin text-muted-foreground" />
            : <Upload size={12} className="text-muted-foreground" />}
        </button>
      </div>

      {error && <p className="text-[10px] text-destructive leading-tight">{error}</p>}

      <input
        ref={fileRef}
        type="file"
        accept={accept}
        multiple={!!multiple}
        className="hidden"
        onChange={handleFileInput}
      />
    </div>
  );
}
