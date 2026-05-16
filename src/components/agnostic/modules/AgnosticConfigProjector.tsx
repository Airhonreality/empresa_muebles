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
      // Si el campo es una sección, lo tratamos como su propia sección para que sea un bloque de primer nivel
      const section = field.type === 'section' ? field.key : (field.section || '');
      if (!acc[section]) acc[section] = [];
      acc[section].push(field);
      return acc;
    }, {});
  }, [schema.fields]);

  const sections = Object.keys(groupedFields);

  const renderField = (field: any): React.ReactNode => {
    const value = data[field.key] ?? field.default;
    const label = <label className="text-[10px] font-bold uppercase text-muted-foreground/50 tracking-wider block mb-1">{field.label}</label>;

    switch (field.type) {
      case 'section':
        const Icon = IconMap[field.icon] || HelpCircle;
        return (
          <div className="space-y-4">
             <div className="flex items-center gap-3 border-b border-border/10 pb-2">
                <Icon size={14} className="text-muted-foreground/60" />
                <div className="space-y-0.5">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{field.label}</h4>
                  {field.description && <p className="text-[8px] text-muted-foreground/40">{field.description}</p>}
                </div>
             </div>
             <div className="space-y-4 pl-2">
               {field.fields?.map((f: any) => (
                 <div key={f.key}>{renderField(f)}</div>
               ))}
             </div>
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center justify-between gap-4 py-3 px-4 bg-muted/20 rounded-lg border border-border/5">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase text-muted-foreground/80 tracking-wide block">{field.label}</span>
              {field.description && <p className="text-[8px] text-muted-foreground/40">{field.description}</p>}
            </div>
            <Checkbox 
              checked={!!value} 
              onCheckedChange={(checked) => updateField(field.key, checked)}
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
              <SelectTrigger>
                <SelectValue placeholder={`Seleccionar...`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguno</SelectItem>
                {options.map((opt: any, idx: number) => (
                  <SelectItem key={idx} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.description && <p className="text-[8px] text-muted-foreground/30 pl-1">{field.description}</p>}
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
            />
            {field.description && <p className="text-[8px] text-muted-foreground/30 pl-1">{field.description}</p>}
          </div>
        );
    }
  };

  const renderGrid = (fields: any[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
      {fields.map((field: any) => (
        <div key={field.key} className={cn(
          "col-span-1",
          (field.width === 'full' || field.type === 'section') && "sm:col-span-2 lg:col-span-3 xl:col-span-4 2xl:col-span-5"
        )}>
          {renderField(field)}
        </div>
      ))}
    </div>
  );

  // 🎯 RENDER FILTRADO (Un solo bloque plano)
  if (filterSection && filterSection !== 'none') {
    return (
      <div className="p-10 bg-background/20 rounded-[3rem] border border-border/5">
        {renderGrid(groupedFields[filterSection] || [])}
      </div>
    );
  }

  // 🌳 RENDER DE ALTA DENSIDAD (Grupos en columnas, campos en filas)
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      {sections.map((sectionName) => (
        <div key={sectionName} className={cn(
          "bg-background/20 rounded-[2.5rem] px-8 py-8 border border-border/5 flex flex-col h-full",
          !sectionName && "bg-transparent border-none p-0 px-4"
        )}>
          {/* Renderizamos los campos de esta sección apilados verticalmente */}
          <div className="space-y-6">
            {groupedFields[sectionName].map((field: any) => (
              <div key={field.key}>
                {renderField(field)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
