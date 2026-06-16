'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ParsedSource, FieldMapping, ImportSession } from '../types';
import { getParser } from '../parsers';
import { toSlug } from '../lib/key.slugger';
import { detectType } from '../lib/type.detector';
import { Button } from '@/components/ui/button';
import { UploadCloud, CheckCircle2, AlertTriangle, ArrowRight, Database, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import agnosticConfig from '@/../agnostic.config';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SourceStageProps {
  session: ImportSession;
  onNext: (patch: Partial<ImportSession>) => void;
}

export function SourceStage({ session, onNext }: SourceStageProps) {
  const [source, setSource] = useState<ParsedSource | null>(session.source);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loaders = agnosticConfig.integrations ?? {};
  const integrationIds = Object.keys(loaders);

  const [activeTab, setActiveTab] = useState<'file' | 'integration'>('file');
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(integrationIds[0] ?? null);
  const [integrationMetas, setIntegrationMetas] = useState<Record<string, { name: string }>>({});
  const [sources, setSources] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingSources, setLoadingSources] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Dynamic integration modules metadata loading
  useEffect(() => {
    for (const [id, loader] of Object.entries(loaders)) {
      loader()
        .then(rawMod => {
          const mod = (rawMod as any).default || rawMod;
          setIntegrationMetas(prev => ({ ...prev, [id]: mod.meta }));
        })
        .catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load database sources for the selected integration
  useEffect(() => {
    if (activeTab !== 'integration' || !selectedIntegration) return;
    setLoadingSources(true);
    setSources([]);
    setSelectedSource(null);
    setError(null);
    fetch(`/api/admin/integrations/sources?id=${selectedIntegration}`)
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar orígenes');
        return res.json();
      })
      .then(data => {
        setSources(data.sources ?? []);
        if (data.sources?.[0]) {
          setSelectedSource(data.sources[0].id);
        }
      })
      .catch((err) => {
        setError(err.message || 'Error cargando orígenes de la integración');
      })
      .finally(() => {
        setLoadingSources(false);
      });
  }, [selectedIntegration, activeTab]);

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

  const handleLoadRecords = async () => {
    if (!selectedIntegration || !selectedSource) return;
    setLoadingRecords(true);
    setError(null);
    setSource(null);
    try {
      const res = await fetch(`/api/admin/integrations/records?id=${selectedIntegration}&sourceId=${selectedSource}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al obtener registros de la integración');
      }
      const { records } = await res.json();
      if (!records || records.length === 0) {
        throw new Error('No se encontraron registros en la fuente seleccionada');
      }
      
      const headers = Object.keys(records[0]);
      const integrationName = integrationMetas[selectedIntegration]?.name || selectedIntegration;
      const sourceName = sources.find(s => s.id === selectedSource)?.name || selectedSource;

      const parsed: ParsedSource = {
        filename: `${integrationName}: ${sourceName}`,
        headers,
        rows: records,
        rowCount: records.length,
        sourceType: 'integration',
        integrationId: selectedIntegration,
        integrationSourceId: selectedSource,
        displayName: `${integrationName}: ${sourceName}`
      };
      setSource(parsed);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los registros');
      setSource(null);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleContinue = () => {
    if (!source) return;

    // Generate automatic mappings using key slugger and type detector
    const autoMappings: FieldMapping[] = source.headers.map(header => {
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
        <h2 className="text-sm font-black uppercase tracking-widest text-primary">Paso 1: Seleccionar Origen de Materia</h2>
        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          Sube un archivo plano o conéctate a un servicio externo registrado
        </p>
      </div>

      {/* Selector de Origen */}
      {integrationIds.length > 0 && (
        <div className="flex justify-center border-b pb-4">
          <div className="flex bg-muted p-1 rounded-xl">
            <button
              onClick={() => { setActiveTab('file'); setSource(null); setError(null); }}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'file' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Subir Archivo
            </button>
            <button
              onClick={() => { setActiveTab('integration'); setSource(null); setError(null); }}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'integration' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Integraciones de Datos
            </button>
          </div>
        </div>
      )}

      {/* File Upload Tab */}
      {activeTab === 'file' && (
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
      )}

      {/* Integration Source Tab */}
      {activeTab === 'integration' && (
        <div className="bg-background border rounded-3xl p-6 space-y-4 max-w-xl mx-auto shadow-sm">
          {source ? (
            <div className="space-y-3 py-6 text-center select-none">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 mx-auto text-primary">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">{source.filename}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                  {source.rowCount} registros importados dinámicamente
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSource(null); setError(null); }}
                className="text-[9px] font-black uppercase tracking-widest h-7 rounded-lg"
              >
                Cambiar de Origen
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Integración</label>
                  <Select value={selectedIntegration || ''} onValueChange={setSelectedIntegration}>
                    <SelectTrigger className="h-9 text-xs font-semibold">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {integrationIds.map(id => (
                        <SelectItem key={id} value={id}>
                          {integrationMetas[id]?.name || id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Origen de Datos</label>
                  <Select
                    value={selectedSource || ''}
                    onValueChange={setSelectedSource}
                    disabled={loadingSources || sources.length === 0}
                  >
                    <SelectTrigger className="h-9 text-xs font-semibold">
                      <SelectValue placeholder={loadingSources ? 'Cargando...' : 'Seleccionar origen...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {sources.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <Button
                  onClick={handleLoadRecords}
                  disabled={!selectedSource || loadingRecords || loadingSources}
                  className="text-[10px] font-black uppercase tracking-widest h-9 px-6 gap-2 rounded-xl"
                >
                  {(loadingRecords || loadingSources) ? <Loader2 size={12} className="animate-spin" /> : <Database size={12} />}
                  Cargar Materia
                </Button>
              </div>
            </>
          )}
        </div>
      )}

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
