'use client';

/**
 * 🏛️ ARTEFACTO: RecursiveBlockComposer.tsx
 * ────────────
 * CAPA: Staging (Block Architecture)
 * VERSIÓN: 4.2
 * COMMIT: P2-M2.3-ADR-VAULT-GOVERNANCE
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Composición jerárquica y recursiva de bloques de interfaz (Fractal UI).
 * - Orquestación de ajustes dinámicos basados en DNA y Bóvedas.
 * - Inferencia inteligente de ADN basada en el contrato de la Bóveda seleccionada.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Utilizar exclusivamente Bóvedas autorizadas en el Manifiesto de Soberanía.
 * - NEVER: Romper el flujo de datos descendente (Top-Down) entre bloques padre e hijos.
 * - ALWAYS: Proveer una vista previa en tiempo real (Live Preview) de la proyección.
 * 
 * 📜 ADR: [2026-05-11] VAULT_GOVERNED_COMPOSITION
 * - DECISIÓN: Eliminar el descubrimiento libre de contextos y forzar el uso del Manifiesto de Bóvedas.
 * - MOTIVO: Prevenir la entropía de datos y asegurar que el diseñador solo trabaje con silos autorizados.
 * - IMPACTO: Orden absoluto en los selectores de origen de datos y coherencia estructural garantizada.
 * 
 * 🔗 RELATIONSHIPS:
 * - UPSTREAM: [ComposerSection, VaultsSection]
 * - DOWNSTREAM: [AgnosticConfigProjector, UI Blocks Registry]
 */

import React from 'react';
import { Trash2, Plus, Zap, ChevronDown, ChevronRight, Settings2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { AgnosticLogicEngine } from '@/lib/agnostic/AgnosticLogicEngine';
import { AgnosticConfigProjector } from '@/components/agnostic/modules/AgnosticConfigProjector';
import blockSettingsSchema from '@/core/designer/dna/block_settings.schema.json';

interface RecursiveBlockComposerProps {
  block: any;
  idx: number;
  schemas: any[];
  vaults: any[];
  onUpdate: (patch: any) => void;
  onRemove: () => void;
  depth?: number;
}

export function RecursiveBlockComposer({ 
  block, 
  idx, 
  schemas, 
  vaults = [],
  onUpdate, 
  onRemove, 
  depth = 0 
}: RecursiveBlockComposerProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [showSettings, setShowSettings] = React.useState(false);
  
  const updateBlock = (patch: any) => onUpdate(patch);

  const configResolvers = {
    logic_engine_registry: AgnosticLogicEngine.getRegisteredFunctions(),
    style_registry: ['system', 'brand', 'luxury', 'info'],
    dna_sections: React.useMemo(() => {
      const selectedSchema = schemas.find(s => s.id === block.schemaId);
      if (!selectedSchema) return [];
      const sections = new Set(selectedSchema.data.fields?.map((f: any) => f.section).filter(Boolean));
      return Array.from(sections).map(s => ({ label: s, value: s }));
    }, [block.schemaId, schemas])
  };

  return (
    <div className={cn(
      "@container group relative p-10 bg-transparent border border-border/5 rounded-[3.5rem] transition-all duration-700 hover:border-primary/20 mb-12",
      depth > 0 && "ml-12 border-l-2 border-l-primary/10 bg-primary/[0.005]",
    )}>
      {/* 🗑️ ACCIÓN DE BORRADO */}
      <Button 
        variant="ghost"
        size="icon"
        onClick={onRemove} 
        className="absolute right-8 top-8 w-10 h-10 bg-destructive/5 text-destructive rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive hover:text-white z-10"
      >
        <Trash2 size={18} />
      </Button>

      {/* 🏛️ ENCABEZADO ESTRUCTURAL */}
      <div className="flex flex-wrap gap-8 items-start pr-12">
        <div className="flex-1 min-w-[200px] space-y-4">
          <label className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-[0.2em] ml-1">Tipo de Bloque</label>
          <Select value={block.type} onValueChange={(v) => updateBlock({ type: v })}>
            <SelectTrigger className="h-12 rounded-2xl bg-transparent border-border/10 px-5 font-bold focus:ring-primary/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="form" className="rounded-xl">Formulario</SelectItem>
              <SelectItem value="table" className="rounded-xl">Tabla de Datos</SelectItem>
              <SelectItem value="collection" className="rounded-xl">Colección</SelectItem>
              <SelectItem value="sheet" className="rounded-xl">Hoja de Cálculo</SelectItem>
              <SelectItem value="logic_console" className="rounded-xl">Consola de Lógica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px] space-y-4">
          <label className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-[0.2em] ml-1">Origen de Datos (Bóveda)</label>
          <Select 
            value={block.context || 'none'} 
            onValueChange={(v) => {
              const newContext = v === 'none' ? '' : v;
              const selectedVault = vaults.find(vault => vault.context === newContext);
              updateBlock({ 
                context: newContext, 
                schemaId: selectedVault?.dna || block.schemaId 
              });
            }}
          >
            <SelectTrigger className="h-12 rounded-2xl bg-transparent border-border/10 px-5 font-bold focus:ring-primary/20">
              <SelectValue placeholder="Seleccionar Bóveda" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="none" className="rounded-xl">Sin origen (Estático)</SelectItem>
              {vaults.map(v => (
                <SelectItem key={v.id} value={v.context} className="rounded-xl">{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px] space-y-4">
          <label className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-[0.2em] ml-1">Estructura (ADN)</label>
          <Select value={block.schemaId} onValueChange={(v) => updateBlock({ schemaId: v })}>
            <SelectTrigger className="h-12 rounded-2xl bg-transparent border-border/10 px-5 font-bold focus:ring-primary/20">
              <SelectValue placeholder="Seleccionar ADN" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              {schemas.sort((a, b) => {
                const aMatch = block.context && a.data.name?.toLowerCase().includes(block.context.replace('class_', '').toLowerCase()) ? -1 : 1;
                const bMatch = block.context && b.data.name?.toLowerCase().includes(block.context.replace('class_', '').toLowerCase()) ? -1 : 1;
                return aMatch - bMatch;
              }).map((s: any) => (
                <SelectItem key={s.id} value={s.id} className="rounded-xl">
                  {s.data.name || s.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[240px] space-y-4">
          <div className="flex items-center justify-between px-1">
            <label className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-[0.2em]">Título Visual</label>
          </div>
          <Input 
            value={block.title || ''} 
            onChange={(e) => updateBlock({ title: e.target.value })} 
            placeholder="Ej: Información General" 
            className="h-12 rounded-2xl bg-transparent border-border/10 px-5 font-black tracking-tight focus-visible:ring-primary/20" 
          />
        </div>
      </div>

      {/* VISTA PREVIA VIVA (The "Live Preview" layer) */}
      {block.schemaId && (
        <div className="mt-8 p-10 bg-background/40 rounded-[2.5rem] border border-border/5 relative overflow-hidden group/preview">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover/preview:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 mb-8 opacity-40">
            <Layers size={14} className="text-primary" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em]">Vista Previa en Tiempo Real</span>
          </div>
          
          <AgnosticConfigProjector 
            schema={schemas.find(s => s.id === block.schemaId) || { fields: [] }}
            data={block.data || {}}
            onUpdate={(patch) => updateBlock({ data: { ...(block.data || {}), ...patch } })}
            resolvers={configResolvers}
            filterSection={block.config?.filterSection}
          />
        </div>
      )}

      {/* AJUSTES PARAMÉTRICOS */}
      <div className="mt-8 flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowSettings(!showSettings)}
          className={cn(
            "h-10 rounded-2xl text-[10px] font-black uppercase tracking-widest gap-3 transition-all px-6 shadow-none",
            showSettings ? "bg-primary text-primary-foreground" : "bg-primary/5 text-primary hover:bg-primary/10"
          )}
        >
          <Settings2 size={16} />
          {showSettings ? "Ocultar Ajustes" : "Configurar Diseño y Lógica"}
        </Button>
      </div>

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
            depth={depth + 1}
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
