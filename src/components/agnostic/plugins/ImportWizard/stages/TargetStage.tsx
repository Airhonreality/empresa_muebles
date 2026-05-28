'use client';

import React, { useState, useEffect } from 'react';
import { ImportTarget, ImportMode, ImportSession } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { FileJson, Database, Layout, ArrowLeft, ArrowRight, ShieldAlert } from 'lucide-react';
import { toSlug } from '../lib/key.slugger';
import { DataItem } from '@agnostic/core';

const STRATEGIES: { value: ImportMode; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  {
    value: 'schema_and_records',
    label: 'Esquema y Registros',
    desc: 'Crea un nuevo blueprint e importa todas las filas del archivo como registros.',
    icon: Database
  },
  {
    value: 'schema_only',
    label: 'Solo Esquema',
    desc: 'Materializa únicamente la definición del blueprint de datos en blanco.',
    icon: Layout
  },
  {
    value: 'records_only',
    label: 'Solo Registros',
    desc: 'Inserta los registros del archivo dentro de un esquema que ya existe.',
    icon: FileJson
  }
];

interface TargetStageProps {
  session: ImportSession;
  schemas: DataItem[];
  onNext: (patch: Partial<ImportSession>) => void;
  onBack: () => void;
}

export function TargetStage({ session, schemas, onNext, onBack }: TargetStageProps) {
  const [mode, setMode] = useState<ImportMode>(session.target.mode);
  const [schemaName, setSchemaName] = useState<string>(() => {
    if (session.target.schemaName) return session.target.schemaName;
    if (session.source?.filename) {
      const baseName = session.source.filename.split('.').slice(0, -1).join('.') || 'nuevo_esquema';
      return toSlug(baseName);
    }
    return '';
  });
  const [existingSchemaId, setExistingSchemaId] = useState(session.target.existingSchemaId || '');
  const [error, setError] = useState<string | null>(null);

  const handleContinue = () => {
    setError(null);

    if (mode !== 'records_only') {
      const cleanName = toSlug(schemaName);
      if (!cleanName) {
        setError('El nombre del esquema no puede estar vacío.');
        return;
      }
      // Deduplicate: Check if schema name already exists
      const nameExists = schemas.some(s => {
        const name = s.data?.name;
        return typeof name === 'string' && name.toLowerCase() === cleanName.toLowerCase();
      });
      if (nameExists) {
        setError(`El nombre de esquema "${cleanName}" ya está registrado en el DNA de persistencia.`);
        return;
      }
    } else {
      if (!existingSchemaId) {
        setError('Por favor, selecciona un esquema existente de la lista.');
        return;
      }
    }

    onNext({
      target: {
        mode,
        schemaName: mode !== 'records_only' ? toSlug(schemaName) : undefined,
        existingSchemaId: mode === 'records_only' ? existingSchemaId : undefined
      }
    });
  };


  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-300">
      <div className="text-center space-y-1">
        <h2 className="text-sm font-black uppercase tracking-widest text-primary">Paso 2: Destino y Estrategia</h2>
        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          Decide cómo materializar la materia en tu vault local
        </p>
      </div>

      {/* Grid of Strategy options cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STRATEGIES.map((strat) => {
          const Icon = strat.icon;
          const isActive = mode === strat.value;
          return (
            <div
              key={strat.value}
              onClick={() => {
                setMode(strat.value);
                setError(null);
              }}
              className={cn(
                "border rounded-2xl p-5 cursor-pointer flex flex-col gap-3 select-none hover:shadow-md transition-all duration-300",
                isActive 
                  ? "border-primary bg-primary/[0.015] shadow-sm" 
                  : "border-border hover:border-primary/40"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center border transition-colors",
                isActive ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted border-border text-muted-foreground/60"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">{strat.label}</h3>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{strat.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Form Parameters based on mode */}
      <div className="bg-background border rounded-2xl p-6 shadow-sm max-w-xl mx-auto space-y-4">
        {mode !== 'records_only' ? (
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/80 px-0.5">
              Nombre del Nuevo Esquema (Contexto de base de datos)
            </label>
            <Input
              value={schemaName}
              onChange={(e) => {
                setSchemaName(e.target.value);
                setError(null);
              }}
              placeholder="nombre_del_esquema"
              className="h-10 font-mono text-xs focus-visible:ring-primary/20"
            />
            <p className="text-[9px] text-muted-foreground italic px-0.5">
              El nombre se convertirá automáticamente a minúsculas y snake_case.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/80 px-0.5">
              Seleccionar Esquema Destino
            </label>
            <select
              value={existingSchemaId}
              onChange={(e) => {
                setExistingSchemaId(e.target.value);
                setError(null);
              }}
              className={cn(
                "h-10 w-full rounded-md border border-border/30 bg-secondary/5 px-3 text-xs font-semibold focus:outline-none focus:border-primary/45",
                "appearance-none cursor-pointer pr-8 relative text-foreground"
              )}
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 10px center",
                backgroundSize: "12px"
              }}
            >
              <option value="" disabled className="text-xs font-semibold text-muted-foreground bg-popover">
                Seleccionar esquema existente...
              </option>
              {schemas.map(s => (
                <option key={s.id} value={s.id} className="text-xs font-semibold text-foreground bg-popover">
                  {typeof s.data?.name === 'string' ? s.data.name : s.id}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-2xl flex items-center gap-3 text-destructive max-w-xl mx-auto">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <p className="text-xs font-semibold">{error}</p>
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
          onClick={handleContinue}
          className="h-10 px-6 font-bold uppercase text-xs tracking-widest gap-2 rounded-xl"
        >
          Continuar <ArrowRight size={14} />
        </Button>
      </div>
    </div>
  );
}
