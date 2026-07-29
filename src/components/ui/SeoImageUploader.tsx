'use client';
import React, { useCallback, useRef, useState } from 'react';
import { Upload, X, Loader2, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type SeoImageData = {
  imagen_url: string;
  descripcion?: string;
  alt_text?: string;
  image_title?: string;
  keywords?: string;
  imagen_filename?: string;
  structured_data?: Record<string, unknown>;
};

interface SeoImageUploaderProps {
  value?: SeoImageData[];
  onChange: (images: SeoImageData[]) => void;
  className?: string;
  /** Categoría del espacio para generar keywords sugeridos */
  spaceCategoryId?: string;
  /** Nombre del espacio para contexto SEO */
  spaceName?: string;
}

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

// Mapeo de categorías a keywords base
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  cocinas: ['cocina integral', 'muebles de cocina', 'diseño cocina', 'cabinets cocina', 'backsplash'],
  cavas_bares: ['cava', 'bar en casa', 'mueble bar', 'espejos decorativos', 'iluminación bar'],
  dormitorios_closets: ['closet', 'guardarropa', 'diseño dormitorio', 'vestidor', 'organización'],
  consolas_recibidores: ['consola', 'recibidor', 'espejo de pared', 'mueble de entrada', 'perchero'],
  otros: ['mueble personalizado', 'diseño interior', 'mueble a medida'],
};

function generateFilenameSlug(spaceName: string, index: number): string {
  return spaceName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // Remover acentos
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 30) + `-${index + 1}`;
}

function generateAltText(spaceName: string, spaceCategoryId?: string, index?: number): string {
  const base = `${spaceName} - fotografía ${index ? `${index + 1}` : 'de proyecto'}`;
  if (spaceCategoryId === 'cocinas') return `${base} - cocina integral personalizada`;
  if (spaceCategoryId === 'cavas_bares') return `${base} - cava o bar a medida`;
  if (spaceCategoryId === 'dormitorios_closets') return `${base} - closet o guardarropa`;
  if (spaceCategoryId === 'consolas_recibidores') return `${base} - consola o recibidor`;
  return base;
}

function generateStructuredData(
  imageUrl: string,
  spaceName: string,
  altText: string,
  imageTitle?: string
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    url: imageUrl,
    name: imageTitle || spaceName,
    description: altText,
    contentUrl: imageUrl,
    uploadDate: new Date().toISOString(),
  };
}

export function SeoImageUploader({
  value = [],
  onChange,
  className,
  spaceCategoryId = 'otros',
  spaceName = 'Espacio',
}: SeoImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<SeoImageData>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const suggestedKeywords = CATEGORY_KEYWORDS[spaceCategoryId] || CATEGORY_KEYWORDS.otros;

  const uploadFiles = useCallback(async (files: File[]) => {
    const valid = files.filter(f => IMAGE_ACCEPT.split(',').includes(f.type));
    if (!valid.length) {
      setError('Solo se aceptan JPEG, PNG, WebP, GIF');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const uploaded: SeoImageData[] = [];
      for (let i = 0; i < valid.length; i++) {
        const file = valid[i];
        const fd = new FormData();
        fd.append('file', file);
        fd.append('space_name', spaceName);
        fd.append('category', spaceCategoryId);

        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Upload failed');

        const filenameSlug = generateFilenameSlug(spaceName, value.length + i);
        const altText = generateAltText(spaceName, spaceCategoryId, value.length + i);
        const imageUrl = json.url as string;
        const structuredData = generateStructuredData(imageUrl, spaceName, altText, spaceName);

        uploaded.push({
          imagen_url: imageUrl,
          descripcion: '',
          alt_text: altText,
          image_title: spaceName,
          keywords: suggestedKeywords.join(', '),
          imagen_filename: filenameSlug,
          structured_data: structuredData,
        });
      }
      onChange([...value, ...uploaded]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir');
    } finally {
      setUploading(false);
    }
  }, [value, onChange, spaceName, spaceCategoryId, suggestedKeywords]);

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
    uploadFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    uploadFiles(files);
    e.target.value = '';
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditForm({ ...value[index] });
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null) {
      const updated = [...value];
      updated[editingIndex] = {
        ...updated[editingIndex],
        ...editForm,
      };
      onChange(updated);
      setEditingIndex(null);
      setEditForm({});
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditForm({});
  };

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Upload Area */}
      <Card className={cn('border-2 border-dashed transition', isDragging ? 'border-blue-500 bg-blue-50' : 'border-muted-foreground/25')}>
        <CardContent className="p-6">
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="cursor-pointer"
          >
            <input
              ref={fileRef}
              type="file"
              multiple
              accept={IMAGE_ACCEPT}
              onChange={handleFileInput}
              className="hidden"
            />
            <div
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 py-8 text-center"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">Arrastra imágenes o haz clic para seleccionar</p>
              <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, GIF (máx. 5MB c/u)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-destructive/10 border border-destructive/50 rounded p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Subiendo imágenes...
        </div>
      )}

      {/* Images List */}
      <div className="space-y-3">
        {value.map((image, index) => (
          <div key={`${image.imagen_url}-${index}`}>
            {editingIndex === index ? (
              // Edit Form
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Editar metadatos de imagen {index + 1}</CardTitle>
                  <CardDescription>Optimiza para SEO y accesibilidad</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Título de imagen (para metadatos)</label>
                      <Input
                        value={editForm.image_title || ''}
                        onChange={(e) => setEditForm({ ...editForm, image_title: e.target.value })}
                        placeholder={spaceName}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Nombre de archivo (SEO)</label>
                      <Input
                        value={editForm.imagen_filename || ''}
                        onChange={(e) => setEditForm({ ...editForm, imagen_filename: e.target.value })}
                        placeholder={generateFilenameSlug(spaceName, index)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Texto alternativo (alt text)</label>
                    <Textarea
                      value={editForm.alt_text || ''}
                      onChange={(e) => setEditForm({ ...editForm, alt_text: e.target.value })}
                      placeholder="Descripción que ven los lectores de pantalla y buscadores"
                      className="mt-1 min-h-16"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {editForm.alt_text?.length || 0} caracteres (ideal: 125-150)
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Descripción (caption)</label>
                    <Textarea
                      value={editForm.descripcion || ''}
                      onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                      placeholder="Descripción visible en la galería (opcional)"
                      className="mt-1 min-h-14"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Palabras clave</label>
                    <Textarea
                      value={editForm.keywords || ''}
                      onChange={(e) => setEditForm({ ...editForm, keywords: e.target.value })}
                      placeholder="Palabras clave separadas por comas"
                      className="mt-1 min-h-12"
                    />
                    <div className="flex flex-wrap gap-1 mt-2">
                      {suggestedKeywords.map((kw) => (
                        <button
                          key={kw}
                          type="button"
                          onClick={() => {
                            const current = editForm.keywords || '';
                            const keywords = current.split(',').map((k) => k.trim()).filter(Boolean);
                            if (!keywords.includes(kw)) {
                              keywords.push(kw);
                              setEditForm({ ...editForm, keywords: keywords.join(', ') });
                            }
                          }}
                          className="text-xs bg-secondary px-2 py-1 rounded hover:bg-secondary/80"
                        >
                          + {kw}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSaveEdit} className="flex-1">Guardar metadatos</Button>
                    <Button onClick={handleCancelEdit} variant="outline" className="flex-1">Cancelar</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Display Card
              <Card className="overflow-hidden">
                <div className="flex gap-4">
                  <img
                    src={image.imagen_url}
                    alt={image.alt_text || 'Portfolio image'}
                    className="w-24 h-24 object-cover rounded-l"
                  />
                  <div className="flex-1 p-3 flex flex-col justify-between">
                    <div>
                      <p className="text-sm font-medium line-clamp-1">{image.image_title || 'Sin título'}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{image.alt_text}</p>
                      {image.keywords && (
                        <p className="text-xs text-muted-foreground mt-1">Keywords: {image.keywords.split(',').slice(0, 3).join(', ')}...</p>
                      )}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartEdit(index)}
                      >
                        Editar metadatos
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemove(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        ))}
      </div>

      {/* SEO Tips */}
      {value.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex gap-2 items-start">
              <Info className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
              <div>
                <CardTitle className="text-sm text-blue-900">Consejos SEO para imágenes</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-blue-800 space-y-1">
            <p>• Alt text: 125-150 caracteres, descriptivo y con palabras clave naturales</p>
            <p>• Filename: palabras clave separadas por guiones (ej: cocina-integral-bogota)</p>
            <p>• Keywords: incluir ubicación + tipo + estilo (ej: cocina integral bogota, diseño moderno)</p>
            <p>• Descripción: visible en galería, complementa el contenido principal</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
