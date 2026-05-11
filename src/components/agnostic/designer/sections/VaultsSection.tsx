'use client';

/**
 * 🏛️ ARTEFACTO: VaultsSection.tsx
 * ────────────
 * CAPA: Governance (Data Sovereignty)
 * VERSIÓN: 1.0
 * COMMIT: P2-M2.4-ADR-ENTROPY-CONTROL
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Administración del Manifiesto de Bóvedas (Silos Autorizados).
 * - Escaneo de entropía (Detección de contextos huérfanos en DB).
 * - Vinculación por contrato entre Origen de Datos, ADN y Estrategia de Persistencia.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Garantizar que ninguna bóveda sea visible sin estar en el Manifiesto.
 * - NEVER: Permitir la eliminación de bóvedas de sistema (Core Vaults).
 * - ALWAYS: Alertar sobre discrepancias entre el almacenamiento físico y la declaración lógica.
 * 
 * 📜 ADR: [2026-05-11] ENTROPY_SCANNER_AUTHORIZATION
 * - DECISIÓN: Implementar un escáner de base de datos que detecte orígenes no autorizados.
 * - MOTIVO: Eliminar la deuda técnica de archivos "descubiertos" por accidente.
 * - IMPACTO: Control total del arquitecto sobre qué silos de datos son válidos para la UI.
 * 
 * 🔗 RELATIONSHIPS:
 * - UPSTREAM: [AgnosticConfigManager]
 * - DOWNSTREAM: [RecursiveBlockComposer, Vault Manifest Registry]
 */

import { useState, useMemo } from 'react';
import { Shield, Plus, Database, Trash2, Box, Link2, Info, Layout, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useMateriaStore } from '@/lib/agnostic/store';

interface VaultsSectionProps {
  vaults: any[];
  schemas: any[];
  setVaults: (vaults: any[]) => void;
}

export function VaultsSection({ vaults = [], schemas, setVaults }: VaultsSectionProps) {
  const data = useMateriaStore((s) => s.data);
  const availableContextsInDB = Object.keys(data);

  // 🔍 ENTROPY SCANNER: Contextos que existen en la DB pero no en el manifiesto
  const unauthorizedContexts = useMemo(() => {
    // 🛡️ FILTRO DE SOBERANÍA: Ocultamos las tripas del sistema
    const systemTechnicalFiles = [
      'vault_manifest', 
      'page_routes', 
      'system_config', 
      'schema_definitions',
      'items_def'
    ];

    return availableContextsInDB.filter(ctx => 
      !(vaults || []).find(v => v.context === ctx) && 
      !systemTechnicalFiles.includes(ctx) &&
      !ctx.endsWith('_def') &&
      !ctx.startsWith('system_') &&
      !ctx.includes('class_') // Ocultamos clases abstractas
    );
  }, [availableContextsInDB, vaults]);

  const handleAddVault = (context: string = '') => {
    const isKnownSilo = context.toLowerCase().includes('project') || context.toLowerCase().includes('client');
    const newVault = {
      id: `vault_${crypto.randomUUID().slice(0, 8)}`,
      context: context || 'nuevo_contexto',
      dna: context ? `schema_${context}_def` : '',
      storage: 'supabase',
      label: context ? context.charAt(0).toUpperCase() + context.slice(1) : 'Nueva Bóveda',
      description: `Silo de datos para ${context || 'nuevo dominio'}.`
    };
    setVaults([...vaults, newVault]);
  };

  const updateVault = (id: string, patch: any) => {
    setVaults(vaults.map(v => v.id === id ? { ...v, ...patch } : v));
  };

  const removeVault = (id: string) => {
    if (confirm('¿Eliminar esta Bóveda? Los datos seguirán en DB pero serán invisibles para el diseñador.')) {
      setVaults(vaults.filter(v => v.id !== id));
    }
  };

  return (
    <div className="space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2 leading-none">
            <Shield size={14} /> Manifiesto de Bóvedas
          </h3>
          <p className="text-[9px] text-muted-foreground font-mono opacity-50 uppercase tracking-widest">
            Gobierno Central de Silos y Contratos
          </p>
        </div>
        <Button onClick={() => handleAddVault()} variant="outline" size="sm" className="h-10 rounded-2xl border-dashed border-primary/30 text-[11px] font-bold gap-3 px-6 hover:bg-primary/5 transition-all">
          <Plus size={16} /> Nueva Bóveda
        </Button>
      </div>

      {/* ⚠️ ALERTA DE ENTROPÍA REFINADA */}
      {unauthorizedContexts.length > 0 && (
        <div className="p-10 bg-amber-500/[0.03] border border-amber-500/10 rounded-[3rem] space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-amber-600/80">
              <AlertTriangle size={20} />
              <div className="space-y-1">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Silos Detectados en la Nube</h4>
                <p className="text-[11px] text-muted-foreground/60 font-medium">He encontrado {unauthorizedContexts.length} orígenes de datos sin contrato oficial.</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unauthorizedContexts.map(ctx => (
              <div 
                key={ctx}
                onClick={() => handleAddVault(ctx)}
                className="group flex items-center justify-between p-5 bg-background border border-border/5 rounded-2xl hover:border-amber-500/30 hover:bg-amber-500/[0.02] cursor-pointer transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-amber-500/5 text-amber-500/40 group-hover:text-amber-500 transition-colors rounded-xl">
                    <Database size={16} />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/80 group-hover:text-amber-600">{ctx}</span>
                </div>
                <Link2 size={14} className="text-muted-foreground/20 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🏛️ LISTADO DE BÓVEDAS AUTORIZADAS */}
      <div className="grid grid-cols-1 gap-6">
        {vaults.map((vault) => (
          <div key={vault.id} className="group p-10 bg-transparent border border-border/10 rounded-[3rem] hover:border-primary/20 transition-all duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              
              {/* 1. Identidad de la Bóveda */}
              <div className="lg:col-span-3 space-y-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-6">
                  <Box size={24} />
                </div>
                <Input 
                  value={vault.label}
                  onChange={(e) => updateVault(vault.id, { label: e.target.value })}
                  placeholder="Etiqueta Visual"
                  className="bg-transparent border-none p-0 text-lg font-black tracking-tighter focus-visible:ring-0"
                />
                <textarea 
                  value={vault.description}
                  onChange={(e) => updateVault(vault.id, { description: e.target.value })}
                  className="w-full bg-transparent border-none text-[10px] text-muted-foreground font-medium resize-none focus:ring-0 p-0 leading-relaxed"
                  placeholder="Descripción del silo..."
                  rows={2}
                />
              </div>

              {/* 2. Configuración de Contrato */}
              <div className="lg:col-span-6 grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest ml-1">Contexto en DB</label>
                  <div className="flex items-center gap-3 h-12 px-5 bg-muted/5 border border-border/5 rounded-2xl text-[11px] font-bold">
                    <Database size={14} className="opacity-30" />
                    {vault.context}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest ml-1">ADN (Estructura)</label>
                  <select 
                    value={vault.dna}
                    onChange={(e) => updateVault(vault.id, { dna: e.target.value })}
                    className="w-full h-12 px-5 bg-primary/5 border border-primary/10 rounded-2xl text-[11px] font-black text-primary appearance-none cursor-pointer"
                  >
                    <option value="">Seleccionar ADN...</option>
                    {schemas.map(s => (
                      <option key={s.id} value={s.id}>{s.data.name || s.id}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest ml-1">Estrategia de Persistencia</label>
                  <select 
                    value={vault.storage}
                    onChange={(e) => updateVault(vault.id, { storage: e.target.value })}
                    className="w-full h-12 px-5 bg-muted/5 border border-border/5 rounded-2xl text-[11px] font-bold appearance-none cursor-pointer"
                  >
                    <option value="supabase">Supabase Vault</option>
                    <option value="local_json">Local JSON Silo</option>
                    <option value="github">GitHub Strategy</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest ml-1">Estado del Silo</label>
                  <div className="flex items-center gap-3 h-12 px-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span className="text-[9px] font-black uppercase text-emerald-600">Soberano y Activo</span>
                  </div>
                </div>
              </div>

              {/* 3. Acciones */}
              <div className="lg:col-span-3 flex flex-col items-end justify-between h-full min-h-[140px]">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeVault(vault.id)}
                  className="h-10 w-10 text-destructive/20 hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </Button>
                <div className="text-right">
                  <span className="text-[8px] font-mono text-muted-foreground opacity-30">ID: {vault.id}</span>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
