/**
 * 🏛️ ARTEFACTO: SystemSection.tsx
 * ────────────
 * CAPA: Designer (UI Layout)
 * VERSIÓN: 3.0
 * COMMIT: P3-M4.1-ADR-PURE-PROJECTOR
 */

'use client';

import { useAgnosticSchema } from '@/lib/agnostic/SchemaInterpreter';
import { AgnosticForm } from '../../blocks/AgnosticForm';
import sovereigntySchemaRaw from '@/core/designer/dna/sovereignty.schema.json';
import { MasterPassport } from '@/types/sovereignty';

interface SystemSectionProps {
  config: Partial<MasterPassport>;
  setConfig: (newConfig: any) => void;
}

export function SystemSection({ config, setConfig }: SystemSectionProps) {
  
  // 🔭 UNIFIED RESOLUTION: Delegamos la inteligencia al Intérprete Maestro
  const { schema, isLoading } = useAgnosticSchema(sovereigntySchemaRaw);

  // 🛡️ SOBERIGNTY DATA BINDING
  const activeRecord = {
    id: 'master_passport',
    context: 'system_config',
    data: config
  };

  const handleSave = async (updatedRecord: any) => {
    setConfig(updatedRecord.data);
  };

  if (isLoading) return <div className="py-20 text-center text-[10px] uppercase font-bold tracking-widest animate-pulse">Interpretando Soberanía...</div>;

  return (
    <div className="space-y-8 py-2 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 🔮 MASTER INFRASTRUCTURE PLUG */}
      <AgnosticForm 
        schema={schema}
        activeRecord={activeRecord}
        context="system_config"
        onSave={handleSave}
        title="Enchufe de Soberanía"
        subtitle="Administración del Pasaporte Maestro de Identidad e Infraestructura"
        className="border-primary/5 shadow-xl shadow-primary/5 bg-card/40 backdrop-blur-sm"
      />
      
      <div className="p-5 rounded-2xl border border-primary/10 bg-primary/[0.02]">
        <div className="flex items-start gap-4">
          <div className="mt-1 w-2 h-2 rounded-full bg-primary/40 animate-pulse" />
          <div className="space-y-1">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">Protocolo de Reinicio Determinista</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Cualquier cambio en la identidad del proyecto o en las estrategias de persistencia invalidará el caché del orquestador y forzará una re-instanciación del motor para alinearse con la nueva realidad física del silo.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
