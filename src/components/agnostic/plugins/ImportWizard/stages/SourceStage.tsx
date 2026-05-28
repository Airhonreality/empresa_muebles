'use client';

import React, { useRef, useState } from 'react';
import { ParsedSource, FieldMapping, FieldType, ImportSession } from '../types';
import { getParser } from '../parsers';
import { toSlug } from '../lib/key.slugger';
import { detectType } from '../lib/type.detector';
import { Button } from '@/components/ui/button';
import { UploadCloud, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SourceStageProps {
  session: ImportSession;
  onNext: (patch: Partial<ImportSession>) => void;
}

export function SourceStage({ session, onNext }: SourceStageProps) {
  const [source, setSource] = useState<ParsedSource | null>(session.source);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setError(null);
    setLoading(true);
    try {
      const parser = getParser(file);
      if (!parser) {
        throw new Error(`No se encontró un procesador para archivos de tipo: ${file.type || 'desconocido'}`);
      }

      const parsedSource = await parser(file);
      setSource(parsedSource);
    } catch (err: any) {
      setError(err?.message || 'Error al procesar el archivo.');
      setSource(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleContinue = () => {
    if (!source) return;

    // 🧠 Generate automatic mappings using key slugger and type detector
    const autoMappings: FieldMapping[] = source.headers.map(header => {
      // Collect values for type detection
      const values = source.rows.map(row => row[header] || '');
      const inferredType = detectType(values);
      const slugKey = toSlug(header);

      return {
        sourceKey: header,
        targetKey: slugKey || 'campo',
        targetLabel: header,
        targetType: inferredType,
        included: true
      };
    });

    onNext({ source, mappings: autoMappings });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-300">
      <div className="text-center space-y-1">
        <h2 className="text-sm font-black uppercase tracking-widest text-primary">Paso 1: Seleccionar Archivo</h2>
        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          Sube un archivo CSV o JSON estructurado para iniciar
        </p>
      </div>

      {/* Upload Drag zone */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-300 select-none flex flex-col items-center justify-center min-h-[220px]",
          source 
            ? "border-primary/40 bg-primary/[0.005] hover:bg-primary/[0.015]" 
            : "border-border/60 hover:border-primary/50 hover:bg-muted/30"
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv,.json,text/csv,application/json"
          className="hidden"
        />

        {loading ? (
          <div className="space-y-3">
            <UploadCloud className="w-12 h-12 text-primary/40 animate-bounce mx-auto" />
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Procesando estructura...</p>
          </div>
        ) : source ? (
          <div className="space-y-3">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 mx-auto text-primary">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-foreground">{source.filename}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                {source.rowCount} filas detectadas • Separador: &quot;{source.delimiter}&quot;
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center border border-border mx-auto text-muted-foreground/60">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-foreground">Arrastra tu archivo aquí o haz clic para buscar</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                Formatos soportados: CSV, JSON (Array)
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-2xl flex items-center gap-3 text-destructive max-w-2xl mx-auto">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-xs font-semibold">{error}</p>
        </div>
      )}

      {/* Preview Table of first 5 raw rows */}
      {source && (
        <div className="space-y-3 max-w-full overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/80 px-1">
            Vista Previa de Materia Cruda (Primeras 5 Filas)
          </span>
          <div className="border rounded-2xl overflow-hidden bg-background">
            <div className="max-w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    {source.headers.map((h, i) => (
                      <th key={i} className="p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground border-r last:border-r-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {source.rows.slice(0, 5).map((row, rIdx) => (
                    <tr key={rIdx} className="border-b last:border-b-0 hover:bg-muted/10 transition-colors">
                      {source.headers.map((h, cIdx) => (
                        <td key={cIdx} className="p-3 text-xs font-medium border-r last:border-r-0 truncate max-w-[180px]">
                          {row[h] || <span className="opacity-20 italic">vacio</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Control Actions */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          onClick={handleContinue}
          disabled={!source || loading}
          className="h-10 px-6 font-bold uppercase text-xs tracking-widest gap-2 rounded-xl"
        >
          Continuar <ArrowRight size={14} />
        </Button>
      </div>
    </div>
  );
}
