'use client';

import { useMateriaStore } from '@/lib/agnostic/store';
import { AgnosticForm } from '../../blocks/AgnosticForm';
import sovereigntySchemaRaw from '@/core/designer/dna/sovereignty.schema.json';

interface SystemSectionProps {
  config: any;
  setConfig: (newConfig: any) => void;
}

export function SystemSection({ config: localConfig, setConfig: setLocalConfig }: SystemSectionProps) {
  const { data: materia } = useMateriaStore();

  // 🛡️ DYNAMIC CAPABILITIES DISCOVERY
  const operations = materia['system_operations'] || [];
  const dnaOp = operations.find(op => op.id === 'operation_active_strategy_adn');
  const storageOp = operations.find(op => op.id === 'operation_active_strategy_storage');

  // 📦 SILO DISCOVERY (Physical Folders)
  const silos = operations.filter(op => op.id.startsWith('operation_silo_'))
    .map(op => op.data?.metadata?.path)
    .filter(Boolean) || ['default'];

  const prettify = (text: string) => text
    .split(/[_-]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  // 🧬 HYDRATE UNIFIED PLUG
  const enrichedSchema = {
    ...sovereigntySchemaRaw,
    fields: sovereigntySchemaRaw.fields.map(f => {
      // 1. Unified Silo Selector
      if (f.key === 'project_identity') {
        return {
          ...f,
          options: silos.map(s => ({ label: prettify(s), value: s }))
        };
      }
      // 2. DNA Strategy
      if (f.key === 'dna_strategy') {
        const active = dnaOp?.data?.metadata?.active || 'LocalStrategy';
        return { 
          ...f, 
          options: (dnaOp?.data?.metadata?.available || ['LocalStrategy', 'GitHubStrategy'])
            .map((s: string) => ({ label: s === active ? `ACTIVA: ${s}` : s, value: s }))
        };
      }
      // 3. Storage Strategy
      if (f.key === 'storage_strategy') {
        const active = storageOp?.data?.metadata?.active || 'LocalStrategy';
        return { 
          ...f, 
          options: (storageOp?.data?.metadata?.available || ['LocalStrategy', 'SupabaseStrategy'])
            .map((s: string) => ({ label: s === active ? `ACTIVA: ${s}` : s, value: s }))
        };
      }
      return f;
    })
  };

  // 🛡️ Master Passport Normalization
  const activeRecord = {
    id: 'master_passport',
    context: 'system_config',
    data: {
      ...localConfig,
      project_identity: localConfig.project_identity || 'default',
      project_rename: '' // Always starts empty for a new rename action
    }
  };

  const handleSave = async (updatedRecord: any) => {
    const data = { ...updatedRecord.data };
    
    // 🧬 UNIFIED RENAMING LOGIC: If project_rename is filled, it mutates the identity
    if (data.project_rename && data.project_rename.trim() !== '') {
       const slugify = (t: string) => t.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^\w-]+/g, '');
       const newIdentity = slugify(data.project_rename);
       
       if (newIdentity !== data.project_identity) {
         console.log(`[Sovereignty] Triggering silo mutation: ${data.project_identity} -> ${newIdentity}`);
         data.project_identity = newIdentity;
         data.project_name = data.project_rename; // Keep human name for display if needed
       }
       delete data.project_rename; // Clean up the action field
    }

    setLocalConfig(data);
  };

  return (
    <div className="space-y-6 py-2 animate-in fade-in duration-500">
      <AgnosticForm 
        schema={enrichedSchema}
        activeRecord={activeRecord}
        context="system_config"
        onSave={handleSave}
        title="Enchufe de Soberanía"
        subtitle="Control Maestro de Identidad e Infraestructura"
        className="border-primary/20 shadow-xl"
      />
      
      {/* 🔮 REALTIME REFLECTOR */}
      <div className="flex gap-4 px-1">
         <div className="flex-1 px-4 py-3 rounded-lg border bg-muted/20 border-border/40">
            <span className="text-[7px] font-black uppercase tracking-widest opacity-40 block mb-1">MOTOR ADN</span>
            <span className="text-[10px] font-bold text-primary">{dnaOp?.data?.metadata?.active || 'Detectando...'}</span>
         </div>
         <div className="flex-1 px-4 py-3 rounded-lg border bg-muted/20 border-border/40">
            <span className="text-[7px] font-black uppercase tracking-widest opacity-40 block mb-1">ALMACENAMIENTO</span>
            <span className="text-[10px] font-bold text-primary">{storageOp?.data?.metadata?.active || 'Detectando...'}</span>
         </div>
      </div>
    </div>
  );
}
