'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ImportSession, SCHEMA_NAMESPACE } from '../types';
import { buildSchemaItem } from '../lib/schema.builder';
import { buildRecordItem } from '../lib/records.builder';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowRight, ShieldCheck, HeartCrack } from 'lucide-react';
import { DataItem } from '@agnostic/core';

interface ExecuteStageProps {
  session: ImportSession;
  schemas: DataItem[];
  saveItem: (context: string, item: Omit<DataItem, 'id'>, options?: { silent?: boolean }) => Promise<DataItem>;
  onDone: () => void;
  onReset: () => void;
}

export function ExecuteStage({ session, schemas, saveItem, onDone, onReset }: ExecuteStageProps) {
  const { source, mappings, target } = session;

  const [progress, setProgress] = useState(0);
  const [schemaCreated, setSchemaCreated] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successCount, setSuccessCount] = useState(0);

  const hasRun = useRef(false);

  const totalRecords = target.mode === 'schema_only' ? 0 : (source?.rows?.length || 0);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const runImport = async () => {
      try {
        const schemaName = (
          target.schemaName
          ?? schemas.find(s => s.id === target.existingSchemaId)?.data?.name
        ) as string | undefined;
        if (!schemaName) {
          throw new Error('No se pudo resolver el nombre del esquema destino.');
        }

        // 1. Materializar definición de esquema en DNA
        if (target.mode !== 'records_only') {
          const schemaItem = buildSchemaItem(schemaName, mappings);
          await saveItem(SCHEMA_NAMESPACE, schemaItem, { silent: true });
          setSchemaCreated(true);
        }

        // 2. Materializar registros en Vault
        if (target.mode !== 'schema_only' && source?.rows) {
          const records = source.rows.map(row => 
            buildRecordItem(row, mappings, schemaName)
          );

          let successfulWrites = 0;
          for (let i = 0; i < records.length; i++) {
            try {
              await saveItem(schemaName, records[i], { silent: true });
              successfulWrites++;
              setSuccessCount(successfulWrites);
            } catch (err: any) {
              const rowNum = i + 2; // +1 headers line, +1 1-indexed
              setErrors(prev => [...prev, `Fila ${rowNum}: ${err?.message || 'Error de almacenamiento.'}`]);
            }
            setProgress(Math.round(((i + 1) / records.length) * 100));
          }
        } else {
          setProgress(100);
        }

        setDone(true);
      } catch (err: any) {
        setErrors(prev => [...prev, `Error Maestro: ${err?.message || 'Fallo general en la importación.'}`]);
        setDone(true);
      }
    };

    runImport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-4 animate-in fade-in duration-300">
      
      {!done ? (
        // 🔄 Active Execution Loading Screen
        <div className="space-y-6 text-center">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <RefreshCw size={26} className="text-primary animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-black uppercase tracking-widest text-primary">Procesando Importación</h2>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              {target.mode !== 'schema_only' 
                ? `Cargando registros: ${successCount} de ${totalRecords} procesados...`
                : 'Materializando blueprint en el DNA...'
              }
            </p>
          </div>

          <div className="max-w-md mx-auto space-y-3">
            <div className="w-full bg-muted border border-border rounded-full h-3 overflow-hidden shadow-inner p-[2px]">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-black text-primary">{progress}%</span>
          </div>
        </div>
      ) : (
        // 🎉 Completed Screen (Success or Failure Dashboard)
        <div className="space-y-6 animate-in zoom-in-95 duration-500">
          
          {errors.length === 0 ? (
            // Complete Success Panel
            <div className="border border-green-500/20 bg-green-500/[0.02] rounded-3xl p-8 text-center space-y-4">
              <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-500/20 mx-auto text-green-600 dark:text-green-400">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-black uppercase tracking-widest text-green-600 dark:text-green-400">
                  ¡Importación Completada con Éxito!
                </h2>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Toda la materia se ha forjado y sincronizado perfectamente en el Vault
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto pt-4 border-t border-green-500/10 text-xs font-semibold">
                <div className="bg-background border rounded-xl p-3 shadow-sm">
                  <span className="text-muted-foreground block text-[9px] font-black uppercase tracking-wider mb-1">Blueprint DNA</span>
                  <span className="font-bold text-foreground">
                    {schemaCreated ? 'Creado ✓' : 'Existente'}
                  </span>
                </div>
                <div className="bg-background border rounded-xl p-3 shadow-sm">
                  <span className="text-muted-foreground block text-[9px] font-black uppercase tracking-wider mb-1">Registros Cargados</span>
                  <span className="font-bold text-foreground">
                    {successCount} de {totalRecords}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            // Partial Failure / Complete Error Panel
            <div className="border border-destructive/20 bg-destructive/[0.02] rounded-3xl p-8 text-center space-y-4">
              <div className="w-14 h-14 bg-destructive/10 rounded-2xl flex items-center justify-center border border-destructive/20 mx-auto text-destructive">
                <HeartCrack className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-black uppercase tracking-widest text-destructive">
                  Importación Completada con Incidencias
                </h2>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Se procesaron {successCount} registros exitosamente, pero {errors.length} filas fallaron
                </p>
              </div>

              {/* Error Log Console */}
              <div className="text-left border border-destructive/10 rounded-2xl bg-destructive/[0.03] overflow-hidden max-w-md mx-auto">
                <div className="bg-destructive/10 px-4 py-2 text-[9px] font-black uppercase tracking-wider text-destructive border-b border-destructive/10">
                  Consola de Errores
                </div>
                <div className="p-4 max-h-[140px] overflow-y-auto font-mono text-[10px] space-y-1.5 scrollbar-thin text-destructive/80">
                  {errors.map((err, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <span className="font-black shrink-0">•</span>
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Control Actions */}
          <div className="flex items-center justify-center gap-3 pt-6 border-t">
            <Button
              variant="outline"
              onClick={onReset}
              className="h-10 px-6 font-bold uppercase text-xs tracking-widest gap-2 rounded-xl"
            >
              Cargar Otro Archivo
            </Button>
            <Button
              onClick={onDone}
              className="h-10 px-6 font-bold uppercase text-xs tracking-widest gap-2 rounded-xl"
            >
              Cerrar Wizard <ArrowRight size={14} />
            </Button>
          </div>

        </div>
      )}

    </div>
  );
}
