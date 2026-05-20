'use client';

import React from 'react';
import { ImportSession } from '../types';
import { buildRecordItem } from '../lib/records.builder';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Play, Eye, FileSpreadsheet, Box } from 'lucide-react';
import { DataItem } from '@agnostic/core';

interface ReviewStageProps {
  session: ImportSession;
  schemas: DataItem[];
  onNext: (patch: Partial<ImportSession>) => void;
  onBack: () => void;
}

export function ReviewStage({ session, schemas, onNext, onBack }: ReviewStageProps) {
  const { source, mappings, target } = session;

  const includedFields = mappings.filter(m => m.included);
  
  // Resolve context/schema name
  const schemaName = (
    target.schemaName
    ?? schemas.find(s => s.id === target.existingSchemaId)?.data?.name
    ?? 'esquema_existente'
  ) as string;

  // Build the first 10 preview records using our coerce builder
  const previewRows = (source?.rows || []).slice(0, 10).map(row => 
    buildRecordItem(row, mappings, schemaName)
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div className="text-center space-y-1">
        <h2 className="text-sm font-black uppercase tracking-widest text-primary">Paso 4: Auditoría y Confirmación</h2>
        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          Inspecciona la materia ya mapeada y transformada antes de persistir
        </p>
      </div>

      {/* Summary dashboard cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Card: Targets */}
        <div className="border rounded-2xl p-5 bg-background shadow-sm space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2 border-b pb-2">
            <FileSpreadsheet size={14} /> Resumen de Importación
          </h3>
          <div className="grid grid-cols-2 gap-y-3 text-xs">
            <span className="text-muted-foreground font-semibold">Estrategia:</span>
            <span className="font-bold uppercase tracking-wider text-[10px] text-foreground">
              {target.mode === 'schema_and_records' && 'Esquema y Registros'}
              {target.mode === 'schema_only' && 'Solo Esquema'}
              {target.mode === 'records_only' && 'Solo Registros'}
            </span>

            <span className="text-muted-foreground font-semibold">Destino DNA:</span>
            <span className="font-mono font-bold text-foreground">
              {schemaName}
            </span>

            <span className="text-muted-foreground font-semibold">Columnas Incluidas:</span>
            <span className="font-bold text-foreground">
              {includedFields.length} de {mappings.length}
            </span>

            <span className="text-muted-foreground font-semibold">Registros Totales:</span>
            <span className="font-bold text-foreground">
              {target.mode !== 'schema_only' ? source?.rowCount : 0} filas
            </span>
          </div>
        </div>

        {/* Right Card: Schema Preview */}
        <div className="border rounded-2xl p-5 bg-background shadow-sm space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2 border-b pb-2">
            <Box size={14} /> Campos del Blueprint
          </h3>
          <div className="max-h-[110px] overflow-y-auto pr-2 space-y-1.5 scrollbar-thin">
            {includedFields.map((field, idx) => (
              <div key={idx} className="flex items-center justify-between text-[10px] font-semibold">
                <span className="font-bold text-foreground">{field.targetLabel}</span>
                <span className="font-mono text-muted-foreground/80 px-2 py-0.5 rounded bg-muted/40 text-[9px] uppercase tracking-wider">
                  {field.targetType}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* preview data grid mapped & coerced */}
      {target.mode !== 'schema_only' && (
        <div className="space-y-3 max-w-full overflow-hidden">
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/80 px-1 flex items-center gap-1.5">
            <Eye size={12} /> Materia Coercionada y Mapeada (Primeras 10 Filas)
          </span>
          <div className="border rounded-2xl overflow-hidden bg-background">
            <div className="max-w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    {includedFields.map((field, i) => (
                      <th key={i} className="p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground border-r last:border-r-0">
                        {field.targetKey}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((record, rIdx) => (
                    <tr key={rIdx} className="border-b last:border-b-0 hover:bg-muted/10 transition-colors">
                      {includedFields.map((field, cIdx) => {
                        const val = record.data[field.targetKey];
                        return (
                          <td key={cIdx} className="p-3 text-xs font-medium border-r last:border-r-0 truncate max-w-[180px]">
                            {val === null || val === undefined ? (
                              <span className="opacity-20 italic">null</span>
                            ) : typeof val === 'boolean' ? (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                val ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"
                              }`}>
                                {val ? 'Sí' : 'No'}
                              </span>
                            ) : (
                              String(val)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Control Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="ghost"
          onClick={onBack}
          className="h-10 px-4 font-bold uppercase text-xs tracking-widest gap-2 rounded-xl"
        >
          <ArrowLeft size={14} /> Atrás
        </Button>
        <Button
          onClick={() => onNext({})}
          className="h-10 px-6 font-bold uppercase text-xs tracking-widest gap-2 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground shadow-md transition-all active:scale-[0.98]"
        >
          <Play size={12} className="fill-current" /> Ejecutar Importación
        </Button>
      </div>
    </div>
  );
}
