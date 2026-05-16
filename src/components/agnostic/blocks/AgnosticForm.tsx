/**
 * 🏛️ ARTEFACTO: AgnosticForm.tsx
 * ────────────
 * CAPA: Projection (Decentralized Blocks)
 * VERSIÓN: 8.0
 * COMMIT: P3-M4.2-ATOMIC-FORM
 * ADR: [adr_v8_0_deterministic_state.md]
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Proyección de interfaces de captura de datos (Forms) vía DNA/Schemas.
 * - Sincronización atómica de materia con la capa de persistencia.
 * - Inferencia de contexto operativo (Axiomatic Gravity).
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Ser ciego a la navegación (delegar redirecciones al Orchestrator).
 * - NEVER: Importar 'useRouter' o hooks de navegación de Next.js.
 * - NEVER: Gestionar lógica de negocio compleja (usar AgnosticLogicEngine).
 * 
 * 📜 ADR: [2026-05-07] DYNAMIC_CONTEXT_INFERENCE
 * - DECISIÓN: Permitir que el formulario infiera el contexto de datos desde el sistema si no se provee un schemaId.
 * - MOTIVO: Aumentar la agilidad de desarrollo y reducir la verbosidad del DNA (Axioma 2).
 * - IMPACTO: Capacidad de proyectar formularios CRUD instantáneos sobre cualquier materia.
 * 
 * 🔗 RELATIONSHIPS:
 * - UPSTREAM: [useMateriaStore, useDNAStore, useActiveRecord]
 * - DOWNSTREAM: [AgnosticRenderer]
 */
'use client';

import React from 'react';
import { useMateriaStore, useSystemStore } from '@/lib/agnostic/store';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Shadcn/UI Components
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Sparkles, Box, ArrowRight, ChevronRight } from 'lucide-react';
import { getModuleIcon } from '@/lib/agnostic/constants';
import { AgnosticLogicEngine } from '@/lib/agnostic/AgnosticLogicEngine';
// import { useAppDispatch } from '@/context/AppContext'; // 🚫 ELIMINADO PARA ROMPER BUCLE CIRCULAR

interface AgnosticFormProps {
  schemaId?: string;
  schema?: any; // 🧬 Manual Schema Injection
  record?: any; // 🏺 Manual Record Injection
  context?: string; 
  section?: string;
  className?: string;
  title?: string;
  subtitle?: string;
  zap?: string; 
  hideHeader?: boolean;
  defaultCollapsed?: boolean;
  redirectOnCreate?: string; 
  syncMode?: 'auto' | 'manual';
  projection?: string[];
  onSubmit?: (data: any) => void;
  onSuccess?: (record: any) => void;
  onFieldChange?: (key: string, value: any, allData: any) => void; // ⚡ Live Preview Hook
  onSave?: (updatedRecord: any) => void; // 💾 Direct Save Hook
  segmentation_key?: string;
  segmentation_strategy?: 'none' | 'tabs' | 'steps' | 'select';
  segmentation_zap?: string;
  intent?: 'create' | 'edit' | 'view';
}

export function AgnosticForm({ 
  schema, 
  activeRecord,
  context = 'system', 
  section, 
  className,
  title,
  subtitle,
  zap,
  hideHeader = false,
  defaultCollapsed = false,
  redirectOnCreate,
  projection,
  onSubmit,
  onSuccess,
  onFieldChange,
  onSave,
  segmentation_key,
  segmentation_strategy = 'none',
  segmentation_zap,
  intent = 'create',
  schemaId // Still kept in props but used primarily for ID generation
}: AgnosticFormProps) {
  const { user } = useAuth();
  const { data: materiaStore } = useMateriaStore();
  const { isLoading: isSystemLoading } = useSystemStore();
  // const { saveItem } = useAppDispatch(); // 🚫 DESACOPLADO AXIOMÁTICAMENTE
  const [isSaving, setIsSaving] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(!defaultCollapsed);
  const [activeSegment, setActiveSegment] = React.useState<string | null>(null);
  const [visibleSegments, setVisibleSegments] = React.useState<string[]>([]);
  
  // Initialize form data from record. No useEffect sync needed because key strategy handles remounts.
  const [formData, setFormData] = React.useState<Record<string, any>>(activeRecord?.data || {});

  // 🛡️ FORM GUARD: Validate required context

  // 🛡️ AXIOMATIC GUARD: No schema, no form.
  if (!schema) {
    return (
      <div className="p-8 border border-dashed rounded-xl text-center">
        <p className="text-xs font-bold uppercase opacity-30">Definición de esquema no encontrada</p>
      </div>
    ); 
  }

  // 🛡️ MATTER GUARD: No record found for EDIT mode
  if (intent === 'edit' && !activeRecord) {
    return (
      <div className="p-12 border border-dashed rounded-2xl text-center bg-muted/5">
        <Box className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Sin datos de registro</p>
        <p className="text-[10px] text-muted-foreground mt-2">No se encontró el registro para editar.</p>
      </div>
    );
  }

  // ⚡ HOT LOOP: Compute derivations on every change
  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [key]: value };
      const computed = AgnosticLogicEngine.compute(schema, next, materiaStore);
      
      // Notificar al mundo exterior para Live Previews (Capa de Soberanía)
      if (onFieldChange) onFieldChange(key, value, computed);
      
      return computed;
    });
  };

  // 🧩 RESOLVE ALL POTENTIAL SEGMENTS
  const allSegments = React.useMemo(() => {
    if (!segmentation_key) return [];
    const field = schema?.fields?.find((f: any) => f.key === segmentation_key);
    return field?.options?.map((o: any) => o.value) || [];
  }, [segmentation_key, schema]);

  // 🧠 Fase 7: LOGIC-DRIVEN PIVOT (System Capability)
  React.useEffect(() => {
    async function resolveReality() {
      const filtered = await AgnosticLogicEngine.getVisibleSegments(
        context, 
        activeRecord || { data: formData }, 
        allSegments, 
        segmentation_zap
      );
      setVisibleSegments(filtered);
      if (filtered.length > 0 && (!activeSegment || !filtered.includes(activeSegment))) {
        setActiveSegment(filtered[0]);
      }
    }
    resolveReality();
  }, [allSegments, activeRecord, formData, context, segmentation_zap]);

  // 🛰️ DEFENSIVE FIELD RESOLUTION
  const fields = Array.isArray(schema.fields) ? schema.fields : [];

  let allFields = fields.filter((f: any) => {
    if (!f.visibility_whitelist) return true;
    if (!user) return false;
    return f.visibility_whitelist.includes(user.role);
  });
  
  if (section) {
    allFields = allFields.filter((f: any) => f.section === section || (f.section === undefined && section === 'General'));
  }

  const sections: Record<string, any[]> = {};
  allFields.forEach((f: any) => {
    const sectionName = f.section || 'General';
    if (!sections[sectionName]) sections[sectionName] = [];
    sections[sectionName].push(f);
  });

  const noFieldsAvailable = allFields.length === 0;

  const persistData = async (currentData: Record<string, any>) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const { id: formId, ...data } = currentData;
      if (onSave) {
        // Direct save hook for internal components (System, DNS, etc.)
        await onSave({ id: formId || activeRecord?.id, context, data });
        toast.success(`Sincronización Interna Completa`);
      } else if (onSubmit) {
        onSubmit(data);
      } else {
        // 🛡️ FALLBACK: Si no hay onSave/onSubmit, el bloque tonto no puede persistir por sí solo
        console.warn(`[AgnosticForm] Intento de persistencia sin dispatcher. Context: ${context}`);
        toast.error("Persistencia no configurada para este bloque");
      }
    } catch (err) {
      toast.error("Error al guardar en el servidor");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    persistData(Object.fromEntries(formData.entries()));
  };

  const renderGrid = (fieldList: any[]) => (
    <div className="grid grid-cols-12 gap-x-4 gap-y-4">
      {fieldList.map((field) => {
        const spanMap: Record<string, string> = {
          'full':    'col-span-12',
          'half':    'col-span-12 @lg:col-span-6',
          'third':   'col-span-12 @lg:col-span-4',
          'quarter': 'col-span-12 @lg:col-span-3'
        };
        const isSection = field.type === 'section';
        const isInfo = field.type === 'info';
        const isDerived = !!field.config?.derivation;
        const colSpan = (isSection || isInfo) ? 'col-span-12' : (spanMap[field.width] || 'col-span-12 @lg:col-span-4');

        if (isSection) {
          return (
            <div key={field.key} className="col-span-12 mt-6 mb-2">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 whitespace-nowrap">
                  {field.label}
                </span>
                <Separator className="flex-1 opacity-20" />
              </div>
            </div>
          );
        }

        return (
          <div key={field.key} className={cn("space-y-1 group/field", colSpan, isDerived && "is-derived")}>
            {!isInfo && (
              <div className="flex items-center justify-between px-0.5">
                <Label className="text-[8px] font-black uppercase tracking-widest opacity-30 group-focus-within/field:opacity-100 group-focus-within/field:text-primary transition-all">
                  {field.label} {field.required && <span className="text-primary">*</span>}
                </Label>
                {isDerived && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Sparkles className="w-2.5 h-2.5 text-primary/40 animate-pulse" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-[10px] bg-background/95 backdrop-blur-xl border-primary/20">
                        Campo calculado por el motor
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}
            <div className="relative group/input">
              {field.type === 'select' ? (
                <Select 
                  name={field.key} 
                  value={String(formData[field.key] || '')}
                  onValueChange={(val) => handleFieldChange(field.key, val)}
                  required={field.required} 
                >
                  <SelectTrigger className={cn(
                    "rounded-md border-border/30 bg-secondary/5 h-9 font-bold text-xs focus:ring-0 focus:border-primary/40 px-3",
                    isDerived && "opacity-80 grayscale-[0.5]"
                  )}>
                    <SelectValue placeholder={formData[field.key] || '...'} />
                  </SelectTrigger>
                  <SelectContent className="rounded-md border border-border bg-popover shadow-md">
                    {field.options
                      ?.filter((opt: any) => (typeof opt === 'object' ? opt.value : opt) !== undefined)
                      .map((opt: any, idx: number) => {
                        const value = typeof opt === 'object' ? opt.value : opt;
                        const label = typeof opt === 'object' ? opt.label : opt;
                        return (
                          <SelectItem 
                            key={`${value}-${idx}`} 
                            value={String(value)} 
                            className="text-xs font-medium"
                          >
                            {String(label)}
                          </SelectItem>
                        );
                      })
                    }
                  </SelectContent>
                </Select>
              ) : field.type === 'textarea' ? (
                <Textarea
                  name={field.key}
                  value={formData[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  readOnly={isDerived || field.readOnly}
                  required={field.required}
                  className={cn(
                    "rounded-md border-border/30 bg-secondary/5 min-h-[80px] py-2 font-bold text-xs focus:ring-0 focus:border-primary/40 resize-none px-3",
                    isDerived && "cursor-default opacity-80"
                  )}
                />
              ) : field.type === 'info' ? (
                <div className="p-4 rounded-xl border border-primary/10 bg-primary/[0.03] space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <Info size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{field.label}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                    {field.description}
                  </p>
                </div>
              ) : (
                  <Input
                    type={field.type}
                    name={field.key}
                    value={formData[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    readOnly={isDerived || field.readOnly}
                    required={field.required}
                    autoComplete="off"
                    className={cn(
                      "rounded-md border-border/30 bg-secondary/5 h-9 font-bold text-xs focus:ring-0 focus:border-primary/40 px-3",
                      isDerived && "cursor-default opacity-80 font-black text-primary/80"
                    )}
                  />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <Card className={cn(
      "@container overflow-hidden border bg-background shadow-sm transition-all duration-300",
      "flex flex-col",
      className
    )}>
      
      {!hideHeader && (
        <CardHeader 
          className="py-4 px-6 border-b bg-muted/50 cursor-pointer select-none"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChevronRight className={cn("w-4 h-4 transition-transform duration-300 text-muted-foreground", isExpanded && "rotate-90 text-primary")} />
              <div className="space-y-0.5">
                <CardTitle className="text-base font-bold tracking-tight">
                  {title || `Forjar ${schema.name}`}
                </CardTitle>
                {subtitle && (
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-40">
               {React.createElement(getModuleIcon('form'), { className: "w-4 h-4" })}
               <Separator orientation="vertical" className="h-4" />
               <span className="text-[10px] font-bold uppercase tracking-wider">{schema.name}</span>
            </div>
          </div>
        </CardHeader>
      )}

      {isExpanded && (
        <form 
          id={`form-${schemaId}-${section || ''}`}
          onSubmit={handleSubmit} 
          className="flex-1 animate-in fade-in duration-300"
        >
          {/* 🆔 PRO IDENTITY FIELD: Hidden ID anchor */}
          <input type="hidden" name="id" value={activeRecord?.id || ''} />

          <CardContent className="p-6">
          {noFieldsAvailable ? (
             <div className="py-12 flex flex-col items-center justify-center gap-4 text-muted-foreground/30">
                <Box size={40} strokeWidth={1} />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Cámara de Materia Vacía</p>
             </div>
          ) : (Object.keys(sections).length === 1 && Object.keys(sections)[0] === 'General') || section ? (
            renderGrid(allFields)
          ) : (
            <div className="space-y-6">
              {Object.entries(sections).map(([name, sectionFields]) => (
                <div key={name} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {name.replace(/_/g, ' ')}
                    </span>
                    <Separator className="flex-1" />
                  </div>
                  {renderGrid(sectionFields)}
                </div>
              ))}
            </div>
          )}
        </CardContent>

        {!noFieldsAvailable && (
          <CardFooter className="py-4 px-6 bg-muted/30 border-t flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={isSaving}
              className="h-9 px-6 font-bold uppercase text-xs tracking-wider gap-2 transition-all active:scale-[0.98] group"
            >
              {isSaving ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  Sincronizar {section ? section.split('_')[0] : 'Materia'}
                  <ArrowRight className="w-4 h-4 opacity-40 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </form>
      )}
    </Card>
  );
}

