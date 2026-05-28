'use client';

import React, { useState } from 'react';
import { FieldMapping, FieldType, ImportSession } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, ArrowRight, ShieldAlert } from 'lucide-react';
import { toSlug } from '../lib/key.slugger';
import { cn } from '@/lib/utils';

interface MappingStageProps {
  session: ImportSession;
  schemas: any[]; // 🧬 Inject schemas context for existing blueprints mapping
  onNext: (patch: Partial<ImportSession>) => void;
  onBack: () => void;
}

export function MappingStage({ session, schemas, onNext, onBack }: MappingStageProps) {
  const isRecordsOnly = session.target.mode === 'records_only';
  const existingSchemaId = session.target.existingSchemaId;

  // Find target schema fields to populate selections
  const targetSchema = isRecordsOnly 
    ? schemas.find(s => s.id === existingSchemaId) 
    : null;
  const targetFields = targetSchema?.data?.fields || [];

  const [mappings, setMappings] = useState<FieldMapping[]>(() => {
    let initial = [...session.mappings];
    // 🧠 SMART MATCHING: Auto-align CSV headers with existing schema properties
    if (isRecordsOnly && targetFields.length > 0) {
      initial = initial.map(mapping => {
        const match = targetFields.find((tf: any) => 
          tf.key.toLowerCase() === mapping.sourceKey.toLowerCase() ||
          tf.label.toLowerCase() === mapping.sourceKey.toLowerCase() ||
          tf.key.toLowerCase().replace(/_/g, ' ') === mapping.sourceKey.toLowerCase()
        );
        return {
          ...mapping,
          targetKey: match ? match.key : '',
          targetLabel: match ? match.label : mapping.targetLabel,
          targetType: match ? match.type : mapping.targetType,
          included: match ? true : false // Auto-include matched fields, default unmatched to ignored/false!
        };
      });
    }
    return initial;
  });
  
  const [error, setError] = useState<string | null>(null);

  const handleToggleInclude = (idx: number, checked: boolean) => {
    setError(null);
    const updated = [...mappings];
    updated[idx] = { ...updated[idx], included: checked };
    setMappings(updated);
  };

  const handleUpdateKey = (idx: number, val: string) => {
    setError(null);
    const updated = [...mappings];
    updated[idx] = { 
      ...updated[idx], 
      targetKey: isRecordsOnly ? val : (val ? toSlug(val) : ''),
      included: isRecordsOnly ? (val !== '') : updated[idx].included // Auto-sync checkbox with selection!
    };
    setMappings(updated);
  };

  const handleUpdateLabel = (idx: number, val: string) => {
    setError(null);
    const updated = [...mappings];
    updated[idx] = { ...updated[idx], targetLabel: val };
    setMappings(updated);
  };

  const handleUpdateType = (idx: number, val: FieldType) => {
    setError(null);
    const updated = [...mappings];
    updated[idx] = { ...updated[idx], targetType: val };
    setMappings(updated);
  };

  const handleContinue = () => {
    setError(null);
    // Validate: At least one column included, and no empty target keys
    const includedCount = mappings.filter(m => m.included).length;
    if (includedCount === 0) {
      setError('Debes incluir al menos una columna para importar.');
      return;
    }

    const hasEmptyKeys = mappings.some(m => m.included && !m.targetKey);
    if (hasEmptyKeys) {
      setError('Todas las columnas incluidas deben estar mapeadas a un campo de destino.');
      return;
    }

    onNext({ mappings });
  };

  const fieldTypes: { value: FieldType; label: string }[] = [
    { value: 'text', label: 'Texto Corto' },
    { value: 'number', label: 'Número' },
    { value: 'date', label: 'Fecha' },
    { value: 'boolean', label: 'Booleano (Sí/No)' },
    { value: 'textarea', label: 'Texto Largo' }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div className="text-center space-y-1">
        <h2 className="text-sm font-black uppercase tracking-widest text-primary">Paso 3: Mapear Estructura</h2>
        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          Alinea columnas con propiedades de bases de datos y define tipos de campos
        </p>
      </div>

      {/* Mappings Editor Table */}
      <div className="border rounded-2xl overflow-hidden bg-background shadow-sm">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground w-12 text-center">Inc.</th>
                <th className="p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground w-48">Columna Origen</th>
                <th className="p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground w-8 text-center">→</th>
                <th className="p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">{isRecordsOnly ? "Campo Destino" : "Clave JSON"}</th>
                {!isRecordsOnly && <th className="p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Etiqueta Visual</th>}
                {!isRecordsOnly && <th className="p-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground w-44">Tipo de Campo</th>}
              </tr>
            </thead>
            <tbody>
              {mappings.map((mapping, idx) => (
                <tr 
                  key={idx} 
                  className={cn(
                    "border-b last:border-b-0 hover:bg-muted/5 transition-colors",
                    !mapping.included && "opacity-45 bg-muted/[0.01]"
                  )}
                >
                  {/* ON/OFF Column Toggle */}
                  <td className="p-3 text-center">
                    <Checkbox
                      checked={mapping.included}
                      onCheckedChange={(checked) => handleToggleInclude(idx, !!checked)}
                    />
                  </td>

                  {/* Original CSV Header */}
                  <td className="p-3 text-xs font-bold text-foreground truncate max-w-[190px]">
                    {mapping.sourceKey}
                  </td>

                  {/* Mapping Arrow indicator */}
                  <td className="p-3 text-center text-muted-foreground/40 font-black">→</td>

                  {/* JSON targetKey (Input or Select depending on mode) */}
                  <td className="p-3">
                    {isRecordsOnly ? (
                      <select
                        value={mapping.targetKey}
                        onChange={(e) => handleUpdateKey(idx, e.target.value)}
                        disabled={!mapping.included}
                        className={cn(
                          "h-8 w-full rounded-md border border-border/30 bg-secondary/5 px-3 text-xs font-semibold focus:outline-none focus:border-primary/45 text-foreground",
                          !mapping.included && "opacity-50 cursor-not-allowed"
                        )}
                        style={{
                          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 10px center",
                          backgroundSize: "12px"
                        }}
                      >
                        <option value="" className="text-xs font-semibold text-muted-foreground bg-popover">
                          Ignorar columna / No mapear
                        </option>
                        {targetFields.map((tf: any) => (
                          <option key={tf.key} value={tf.key} className="text-xs font-semibold text-foreground bg-popover">
                            {tf.label} ({tf.key})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        value={mapping.targetKey}
                        onChange={(e) => handleUpdateKey(idx, e.target.value)}
                        disabled={!mapping.included}
                        placeholder="clave_json"
                        className="h-8 font-mono text-xs focus-visible:ring-primary/20"
                      />
                    )}
                  </td>

                  {/* Visual Schema targetLabel */}
                  {!isRecordsOnly && (
                    <td className="p-3">
                      <Input
                        value={mapping.targetLabel}
                        onChange={(e) => handleUpdateLabel(idx, e.target.value)}
                        disabled={!mapping.included}
                        placeholder="Etiqueta Visual"
                        className="h-8 font-bold text-xs focus-visible:ring-primary/20"
                      />
                    </td>
                  )}

                  {/* FieldType Dropdown Selector */}
                  {!isRecordsOnly && (
                    <td className="p-3">
                      <select
                        value={mapping.targetType}
                        onChange={(e) => handleUpdateType(idx, e.target.value as FieldType)}
                        disabled={!mapping.included}
                        className={cn(
                          "h-8 w-full rounded-md border border-border/30 bg-secondary/5 px-3 text-xs font-semibold focus:outline-none focus:border-primary/45",
                          "appearance-none cursor-pointer pr-8 relative text-foreground",
                          !mapping.included && "opacity-50 cursor-not-allowed"
                        )}
                        style={{
                          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 10px center",
                          backgroundSize: "12px"
                        }}
                      >
                        {fieldTypes.map(ft => (
                          <option key={ft.value} value={ft.value} className="text-xs font-semibold text-foreground bg-popover">
                            {ft.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
