/**
 * 🏛️ ARTEFACTO: RecursiveBlockComposer.tsx
 * ────────────
 * CAPA: Staging (Block Architecture)
 * VERSIÓN: 4.5
 * COMMIT: P3-M3.4-RELATIONAL-INFERENCE
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Composición jerárquica y recursiva de bloques de interfaz (Fractal UI).
 * - Orquestación de ajustes dinámicos basados en DNA y Bóvedas.
 * - Motor de Inferencia Relacional (Auto-discovery of Foreign Keys).
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Utilizar nomenclatura snake_case para todas las claves de arquitectura.
 * - MUST: Intentar inferir la relación jerárquica basándose en el contexto del padre.
 * - ALWAYS: Proveer una vista previa en tiempo real (Live Preview) de la proyección.
 * 
 * 📜 ADR: [2026-05-11] AUTOMATED_RELATION_INFERENCE
 * - DECISIÓN: Implementar un motor de descubrimiento de claves foráneas en el diseñador.
 * - MOTIVO: Reducir el error humano y la carga cognitiva al configurar estructuras fractales complejas.
 * - IMPACTO: Flujo de trabajo acelerado; el arquitecto solo confirma lo que el sistema infiere.
 */
'use client';

import React, { useEffect } from 'react';
import { Trash2, Plus, ChevronDown, ChevronRight, Settings2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/core/i18n/useTranslation';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useMateriaStore } from '@/lib/agnostic/store';
import { AgnosticLogicEngine } from '@/lib/agnostic/AgnosticLogicEngine';
import { AgnosticConfigProjector } from '@/components/agnostic/modules/AgnosticConfigProjector';
import { registry } from '@/lib/agnostic/Registry';
import blockSettingsSchema from '@/core/designer/dna/block_settings.schema.json';

interface RecursiveBlockComposerProps {
  block: any;
  idx: number;
  schemas: any[];
  vaults: any[];
  onUpdate: (patch: any) => void;
  onRemove: () => void;
  depth?: number;
  parentContext?: string; // 🛰️ Context of the parent block for inference
}

export function RecursiveBlockComposer({ 
  block, 
  idx, 
  schemas, 
  vaults = [],
  onUpdate, 
  onRemove, 
  depth = 0,
  parentContext
}: RecursiveBlockComposerProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showLayout, setShowLayout] = React.useState(false);
  
  const availableBlocks = React.useMemo(() => {
    return registry.getRegisteredTypes().map(type => {
      const meta = registry.getMetadata(type);
      return {
        value: type,
        label: meta?.name || type,
        category: meta?.category || 'core'
      };
    });
  }, []);

  const updateBlock = (patch: any) => onUpdate(patch);

  // 🧠 RELATION INFERENCE ENGINE
  useEffect(() => {
    if (depth > 0 && parentContext && block.schema_id && !block.config?.parent_key) {
      // 🧬 Búsqueda Dual (ID o Slug)
      const selectedSchema = schemas.find(s => s.id === block.schema_id || s.data?.slug === block.schema_id);
      if (selectedSchema) {
        const parentKeyCandidate = `${parentContext.replace('schema_', '').replace('_def', '')}_id`;
        const hasMatch = selectedSchema.data.fields?.some((f: any) => f.key === parentKeyCandidate);
        
        if (hasMatch) {
          console.log(`[Inference] Auto-linking ${block.title} to ${parentContext} via ${parentKeyCandidate}`);
          updateBlock({ config: { ...(block.config || {}), parent_key: parentKeyCandidate } });
        }
      }
    }
  }, [block.schema_id, parentContext, depth]);

  // 🏛️ SYNC LOGIC: Cuando cambia schema_id, inferimos el context desde el manifiesto
  useEffect(() => {
    if (block.schema_id) {
      const manifestSnapshot = vaults.find(v => v.id === 'vault_manifest_core');
      const silos = manifestSnapshot?.data?.silos || [];
      // 🧬 Búsqueda Dual (ID o Slug)
      const silo = silos.find((s: any) => s.dna === block.schema_id || s.context === block.schema_id);
      
      if (silo && silo.context !== block.context) {
        console.log(`[Sovereignty] Auto-linking context: ${silo.context} for schema: ${block.schema_id}`);
        updateBlock({ context: silo.context });
      }
    }
  }, [block.schema_id, vaults]);

  const configResolvers = {
    block_registry: availableBlocks.map(b => ({ label: b.label, value: b.value })),
    dna_registry: schemas.map(s => ({ label: s.data?.name || s.id, value: s.id })),
    logic_engine_registry: AgnosticLogicEngine.getRegisteredFunctions(),
    style_registry: ['system', 'brand', 'luxury', 'info'],
    dna_sections: React.useMemo(() => {
      const selectedSchema = schemas.find(s => s.id === block.schema_id || s.data?.slug === block.schema_id);
      if (!selectedSchema) return [];
      const sections = new Set(selectedSchema.data?.fields?.map((f: any) => f.section).filter(Boolean));
      return Array.from(sections).map(s => ({ label: s, value: s }));
    }, [block.schema_id, schemas]),
    dna_fields: React.useMemo(() => {
      const selectedSchema = schemas.find(s => s.id === block.schema_id || s.data?.slug === block.schema_id);
      if (!selectedSchema) return [];
      return (selectedSchema.data?.fields || []).map((f: any) => ({ 
        label: `${f.label} (${f.key})`, 
        value: f.key 
      }));
    }, [block.schema_id, schemas])
  };

  return (
    <div className={cn(
      "@container group relative p-10 bg-transparent border border-border/5 rounded-[3.5rem] transition-all duration-700 hover:border-primary/20 mb-12",
      depth > 0 && "ml-12 border-l-2 border-l-primary/10 bg-primary/[0.005]",
    )}>
      {/* 🧬 PROYECCIÓN DE CAPACIDADES (DYNAMICS) */}
      {showLayout && registry.hasCapability(block.type, 'layout') && (
        <div className="mt-8 p-8 border border-border/10 rounded-[2rem] bg-muted/5 animate-in slide-in-from-top-2 duration-300">
          {(() => {
            const LayoutControls = registry.get('layout_controls');
            return LayoutControls ? (
              <LayoutControls 
                data={block} 
                onUpdate={(patch: any) => updateBlock({ layout: patch })} 
              />
            ) : null;
          })()}
        </div>
      )}

      {/* 🗑️ ACCIÓN DE BORRADO */}
      <Button 
        variant="ghost"
        size="icon"
        onClick={onRemove} 
        className="absolute right-8 top-8 w-10 h-10 bg-destructive/5 text-destructive rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive hover:text-white z-10"
      >
        <Trash2 size={18} />
      </Button>

      {/* 🏛️ PROYECCIÓN DE IDENTIDAD Y CONFIGURACIÓN (ZERO HARD-CODE) */}
      <div className="mt-4">
         <AgnosticConfigProjector 
            schema={blockSettingsSchema} 
            data={block} 
            onUpdate={(patch) => updateBlock({ ...patch })}
            resolvers={configResolvers}
          />
      </div>

      {/* AJUSTES PARAMÉTRICOS (Legacy Clean-up) */}

      {showSettings && (
        <div className="mt-8 animate-in fade-in zoom-in-95 duration-500 border-t border-border/5 pt-8">
          <AgnosticConfigProjector 
            schema={blockSettingsSchema} 
            data={block.config || {}} 
            onUpdate={(patch) => updateBlock({ config: { ...(block.config || {}), ...patch } })}
            resolvers={configResolvers}
          />
        </div>
      )}

      {/* RECURSIVIDAD */}
      <div className="mt-10 pt-10 border-t border-border/5">
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[10px] font-black uppercase tracking-[0.3em] hover:bg-transparent px-0 text-muted-foreground/50"
          >
            {isExpanded ? <ChevronDown size={18} className="mr-3 text-primary/40" /> : <ChevronRight size={18} className="mr-3 text-primary/40" />}
            Contenido Interno ({block.blocks?.length || 0})
          </Button>
          
          <Button 
            onClick={() => updateBlock({ blocks: [...(block.blocks || []), { id: globalThis.crypto.randomUUID(), type: 'form', title: 'Nuevo Bloque' }] })}
            variant="outline" 
            size="sm" 
            className="h-11 rounded-2xl border-dashed border-primary/20 text-[11px] font-black tracking-widest gap-3 px-6 hover:bg-primary/5 transition-all"
          >
            <Plus size={18} /> AÑADIR SUB-BLOQUE
          </Button>
        </div>

        {isExpanded && block.blocks?.map((subBlock: any, subIdx: number) => (
          <RecursiveBlockComposer
            key={subBlock.id || subIdx}
            block={subBlock}
            idx={subIdx}
            schemas={schemas}
            vaults={vaults}
            depth={depth + 1}
            parentContext={block.context}
            onUpdate={(patch) => {
              const newBlocks = [...(block.blocks || [])];
              newBlocks[subIdx] = { ...newBlocks[subIdx], ...patch };
              updateBlock({ blocks: newBlocks });
            }}
            onRemove={() => {
              updateBlock({ blocks: (block.blocks || []).filter((_: any, i: number) => i !== subIdx) });
            }}
          />
        ))}
      </div>
    </div>
  );
}
