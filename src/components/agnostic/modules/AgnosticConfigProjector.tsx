'use client';

/**
 * 🏛️ ARTEFACTO: AgnosticConfigProjector.tsx
 * ────────────
 * CAPA: Projection (Visual Interface)
 * VERSIÓN: 3.0
 * COMMIT: P2-M2.2-ADR-HIERARCHICAL-PROJECTION
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Proyección dinámica de estructuras DNA en formularios e interfaces visuales.
 * - Resolución híbrida de opciones (Strings vs Objetos) para selectores.
 * - Filtrado y segmentación por secciones de ADN (Fractal Rendering).
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Garantizar la integridad de renderizado ante datos malformados (Objects-as-children safety).
 * - NEVER: Inyectar estilos hardcoded que rompan la puricidad visual de Shadcn UI.
 * - ALWAYS: Respetar la rejilla responsiva definida en el DNA (Full/Half/Third).
 * 
 * 📜 ADR: [2026-05-11] HYBRID_OPTION_RESOLUTION
 * - DECISIÓN: Implementar una lógica de resolución de opciones que soporte tanto arrays de strings como objetos de metadatos.
 * - MOTIVO: Permitir que los selectores se alimenten de fuentes de datos heterogéneas sin colapsar.
 * - IMPACTO: Robustez total ante cambios en el esquema de datos de origen.
 * 
 * 🔗 RELATIONSHIPS:
 * - UPSTREAM: [RecursiveBlockComposer, SovereigntyOrchestrator]
 * - DOWNSTREAM: [Shadcn UI Components, Agnostic Logic Engine]
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Activity, Palette, Zap, Layout, HelpCircle, ChevronDown } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const IconMap: Record<string, any> = { Activity, Palette, Zap, Layout };

interface ConfigProjectorProps {
  schema: any;      
  data: any;        
  onUpdate: (patch: any) => void;
  resolvers?: Record<string, any[]>; 
  filterSection?: string | null;
}

export function AgnosticConfigProjector({ 
  schema, 
  data = {}, 
  onUpdate, 
  resolvers = {},
  filterSection = null
}: ConfigProjectorProps) {
  
  const updateField = (key: string, value: any) => {
    onUpdate({ [key]: value });
  };

  // 🏛️ ORGANIZACIÓN: Agrupar por secciones para la vista jerárquica
  const groupedFields = React.useMemo(() => {
    const fields = schema.fields || [];
    return fields.reduce((acc: any, field: any) => {
      const section = field.section || 'General';
      if (!acc[section]) acc[section] = [];
      acc[section].push(field);
      return acc;
    }, {});
  }, [schema.fields]);

  const sections = Object.keys(groupedFields);

  const renderField = (field: any): React.ReactNode => {
    const value = data[field.key] ?? field.default;
    const label = <label className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest block mb-2">{field.label}</label>;

    switch (field.type) {
      case 'section':
        const Icon = IconMap[field.icon] || HelpCircle;
        return (
          <div className="space-y-6 py-6 first:pt-0">
             <div className="flex items-center gap-3 border-b border-border/5 pb-4">
                <div className="p-2 bg-primary/5 rounded-xl text-primary/40">
                  <Icon size={14} />
                </div>
                <h4 className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em]">{field.label}</h4>
             </div>
             <div className="grid grid-cols-12 gap-6 pl-4">
               {field.fields?.map((f: any) => (
                 <div key={f.key} className="col-span-12">{renderField(f)}</div>
               ))}
             </div>
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center justify-between gap-4 py-3 bg-primary/[0.02] px-6 rounded-2xl border border-primary/5">
            <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">{field.label}</span>
            <Checkbox 
              checked={!!value} 
              onCheckedChange={(checked) => updateField(field.key, checked)}
              className="w-5 h-5 rounded-lg border-primary/20"
            />
          </div>
        );

      case 'select':
      case 'multi-select':
        let options = field.options || [];
        if (field.options_source && resolvers[field.options_source]) {
          options = resolvers[field.options_source].map(opt => 
            typeof opt === 'string' ? { label: opt, value: opt } : opt
          );
        }

        return (
          <div className="space-y-1">
            {label}
            <Select 
              value={field.type === 'multi-select' ? (Array.isArray(value) ? value[0] : value) : value} 
              onValueChange={(v) => updateField(field.key, field.type === 'multi-select' ? [v] : v)}
            >
              <SelectTrigger className="h-12 rounded-2xl bg-transparent border-border/10 px-5 font-bold focus:ring-primary/20 transition-all hover:border-primary/30">
                <SelectValue placeholder={`Seleccionar...`} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border/10">
                <SelectItem value="none" className="rounded-xl">Ninguno</SelectItem>
                {options.map((opt: any, idx: number) => (
                  <SelectItem key={idx} value={opt.value} className="text-[11px] font-medium rounded-xl my-1">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return (
          <div className="space-y-1">
            {label}
            <Input 
              value={value || ''} 
              onChange={(e) => updateField(field.key, e.target.value)} 
              placeholder={field.label}
              className="text-[11px] h-12 bg-transparent border-border/10 rounded-2xl px-5 font-bold focus-visible:ring-primary/20 transition-all hover:border-primary/30" 
            />
          </div>
        );
    }
  };

  const renderGrid = (fields: any[]) => (
    <div className="grid grid-cols-12 gap-x-8 gap-y-6">
      {fields.map((field: any) => {
        const widthClass = field.width === 'half' ? 'col-span-12 lg:col-span-6' : 
                          field.width === 'third' ? 'col-span-12 lg:col-span-4' : 
                          'col-span-12';
        return (
          <div key={field.key} className={widthClass}>
            {renderField(field)}
          </div>
        );
      })}
    </div>
  );

  // 🎯 RENDER FILTRADO (Un solo bloque plano)
  if (filterSection && filterSection !== 'none') {
    return (
      <div className="p-8 bg-background/20 rounded-[2.5rem] border border-border/5">
        {renderGrid(groupedFields[filterSection] || [])}
      </div>
    );
  }

  // 🌳 RENDER JERÁRQUICO (Vista completa por grupos)
  return (
    <div className="space-y-4">
      <Accordion type="multiple" className="space-y-4">
        {sections.map((sectionName) => (
          <AccordionItem key={sectionName} value={sectionName} className="border-none bg-background/20 rounded-[2.5rem] px-8 overflow-hidden">
            <AccordionTrigger className="hover:no-underline py-6">
              <div className="flex items-center gap-3">
                <Layout size={14} className="text-primary/40" />
                <span className="text-[10px] font-black uppercase tracking-widest">{sectionName}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-10 pt-4">
              {renderGrid(groupedFields[sectionName])}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
