'use client';

/**
 * 🏛️ ARTEFACTO: VaultsSection.tsx
 * ────────────
 * CAPA: Governance (Data Sovereignty)
 * VERSIÓN: 2.0
 * COMMIT: P3-M3.4-ADR-ENTROPY-CLEANUP
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Administración del Manifiesto de Bóvedas (Silos Autorizados).
 * - Vinculación declarativa entre Contexto, ADN y Estrategia.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Ser un proyector puro de la configuración de silos.
 * - NEVER: Hardcodear estrategias o tipos de almacenamiento.
 * - ALWAYS: Delegar la resolución de opciones al SchemaInterpreter.
 */

import { useState } from 'react';
import { Shield, Plus, Database, Trash2, Box, Layout, CheckCircle2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgnosticForm } from '@/components/agnostic/blocks/AgnosticForm';
import { useMateriaStore } from '@/lib/agnostic/store';
import { useAppDispatch } from '@/context/AppContext';
import { useAgnosticSchema } from '@/lib/agnostic/SchemaInterpreter';

// Schema interno para la gestión de un Silo (Bóveda)
const vaultItemSchema = {
  name: 'Vault Silo',
  fields: [
    { key: "context", label: "Silo Identifier (Context)", width: "full", required: true },
    { 
      key: "dna", 
      label: "Architecture (DNA)", 
      width: "half", 
      type: "select", 
      options_source: "system://registry/dna" 
    },
    { 
      key: "storage", 
      label: "Persistence Strategy", 
      width: "half", 
      type: "select", 
      options_source: "system://registry/strategy" 
    }
  ]
};

interface VaultsSectionProps {
  initialData: any;
  setVaults: (vaults: any[]) => void;
}

export function VaultsSection({ initialData = {} }: VaultsSectionProps) {
  const { saveItem } = useAppDispatch();
  const { schema: resolvedSchema, isLoading } = useAgnosticSchema(vaultItemSchema);
  
  // 🏛️ HYDRATION: El Manifiesto es un Snapshot Atómico
  const [vaults, setVaults] = useState<any[]>(() => {
    const rawData = initialData['vault_manifest'] || [];
    const coreSnapshot = rawData.find((v: any) => v.id === 'vault_manifest_core');
    return coreSnapshot?.data?.silos || [];
  });

  const saveManifest = async (currentVaults: any[]) => {
    await saveItem('vault_manifest', {
      id: 'vault_manifest_core',
      data: { silos: currentVaults }
    });
  };

  const handleUpdateVault = (index: number, data: any) => {
    const newVaults = [...vaults];
    newVaults[index] = data;
    setVaults(newVaults);
    saveManifest(newVaults);
  };

  const handleAddVault = () => {
    const newVaults = [...vaults, { context: 'new_silo', dna: '', storage: 'LocalStrategy' }];
    setVaults(newVaults);
    saveManifest(newVaults);
  };

  const handleRemoveVault = (index: number) => {
    if (confirm('¿Desvincular este Silo del Manifiesto Soberano?')) {
      const newVaults = vaults.filter((_, i) => i !== index);
      setVaults(newVaults);
      saveManifest(newVaults);
    }
  };

  if (isLoading) return <div className="p-12 text-center animate-pulse text-[10px] font-bold uppercase tracking-widest opacity-30">Sincronizando Manifiesto...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Header Centralizado */}
      <div className="flex items-center justify-between border-b pb-6">
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase tracking-wider text-primary flex items-center gap-2">
            <Shield size={16} /> Vault Manifest
          </h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-60 font-bold">
            Centralized Governance of Authorized Data Silos
          </p>
        </div>
        <Button onClick={handleAddVault} variant="outline" size="sm" className="font-bold gap-2 text-[10px] uppercase tracking-widest h-8 px-4">
          <Plus size={14} /> Register New Silo
        </Button>
      </div>

      {/* Grid de Silos Puros */}
      <div className="grid grid-cols-1 gap-6">
        {vaults.map((vault, index) => (
          <div key={index} className="group relative bg-background border rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300">
            <div className="p-6">
              <div className="flex items-start gap-6">
                {/* Indicador de Estado */}
                <div className="mt-1 h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary/40 group-hover:text-primary transition-colors border border-primary/10">
                  <Database size={20} />
                </div>
                
                {/* Proyector Agnóstico del Silo */}
                <div className="flex-1">
                  <AgnosticForm 
                    schema={resolvedSchema}
                    activeRecord={{ data: vault }}
                    hideHeader={true}
                    onFieldChange={(key, value, allData) => handleUpdateVault(index, allData)}
                    className="border-none shadow-none bg-transparent p-0"
                  />
                </div>

                {/* Acciones de Limpieza */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemoveVault(index)}
                    className="text-destructive/40 hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Footer de Trazabilidad */}
            <div className="px-6 py-3 bg-muted/30 border-t flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={10} className="text-primary" />
                    <span className="text-[9px] font-black uppercase tracking-tighter opacity-40">Silo Sovereign</span>
                 </div>
                 <div className="h-3 w-px bg-border" />
                 <span className="text-[9px] font-mono opacity-30">SIG: {crypto.randomUUID().slice(0, 8)}</span>
              </div>
              <div className="flex items-center gap-1 text-[9px] font-bold text-primary/60">
                <Layout size={10} />
                <span>DNA Connected</span>
              </div>
            </div>
          </div>
        ))}

        {vaults.length === 0 && (
          <div className="py-20 border border-dashed rounded-3xl flex flex-col items-center justify-center gap-4 text-muted-foreground/20">
            <Box size={48} strokeWidth={1} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Authorized Silos Detected</p>
          </div>
        )}
      </div>

      {/* Nota de Integridad */}
      <div className="p-4 rounded-xl bg-primary/[0.02] border border-primary/5 flex gap-3 items-start">
        <Info size={14} className="text-primary mt-0.5 shrink-0" />
        <p className="text-[10px] text-muted-foreground leading-relaxed italic">
          <strong>Axiomatic Guard:</strong> Any data silo not registered in this manifest will be treated as entropy and ignored by the Sovereign Engine, ensuring deterministic state across the entire code project.
        </p>
      </div>

    </div>
  );
}
