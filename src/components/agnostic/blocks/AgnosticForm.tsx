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
import { useDNAStore, useMateriaStore, useActiveRecord, useSystemStore } from '@/lib/agnostic/store';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';

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
import { useAppDispatch } from '@/context/AppContext';

interface AgnosticFormProps {
  schemaId?: string;
  context?: string; 
  section?: string;
  className?: string;
  title?: string;
  subtitle?: string;
  zap?: string; // 🧠 The Holobiontic Action (v10.0)
  hideHeader?: boolean;
  defaultCollapsed?: boolean;
  redirectOnCreate?: string; 
  syncMode?: 'auto' | 'manual';
  projection?: string[];
  onSubmit?: (data: any) => void;
  onSuccess?: (record: any) => void;
}

export function AgnosticForm({ 
  schemaId: propsSchemaId, 
  context: propsContext,
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
  onSuccess
}: AgnosticFormProps) {
  const { slug } = useParams();
  const { user } = useAuth();
  
  const { data: materiaStore } = useMateriaStore();
  const { schemas } = useDNAStore();
  const { isLoading: isSystemLoading } = useSystemStore();
  const activeRecord = useActiveRecord();
  
  const { saveItem } = useAppDispatch();
  
  // 🛰️ STRICT EXPLICIT CONTEXT (Spec v7.0)
  const context = propsContext || 'system';
  const schemaId = propsSchemaId;

  const [isSaving, setIsSaving] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(!defaultCollapsed);
  
  // 🧠 LIVE MATERIA STATE (Hot Loop)
  const [formData, setFormData] = React.useState<Record<string, any>>(activeRecord?.data || {});

  // Update local state when activeRecord changes (Hydration)
  React.useEffect(() => {
    if (activeRecord?.data) {
      setFormData(activeRecord.data);
    }
  }, [activeRecord]);

  const schemaItem = schemas.find((s) => s.id === schemaId);
  const schema = schemaItem?.data as Record<string, any> | null;

  if (!schema || isSystemLoading) {
    return null; // Silent failure if definition is missing (Engine responsibility)
  }

  // ⚡ HOT LOOP: Compute derivations on every change
  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [key]: value };
      // Axiomatic computation: UI syncs with computed truth
      return AgnosticLogicEngine.compute(schema, next, materiaStore);
    });
  };

  // Filter fields by section if provided
  let allFields = schema.fields.filter((f: any) => {
    if (!f.visibility_whitelist) return true;
    if (!user) return false;
    return f.visibility_whitelist.includes(user.role);
  });
  
  if (section) {
    allFields = allFields.filter((f: any) => f.section === section || (f.section === undefined && section === 'General'));
  }

  if (allFields.length === 0) return null;

  const sections: Record<string, any[]> = {};
  allFields.forEach((f: any) => {
    const sectionName = f.section || 'General';
    if (!sections[sectionName]) sections[sectionName] = [];
    sections[sectionName].push(f);
  });

  const persistData = async (formData: Record<string, any>) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const { id: formId, ...data } = formData;
      if (onSubmit) {
        onSubmit(data);
      } else {
        const payload = { id: formId || activeRecord?.id, context, data };
        const record = await saveItem(context, payload);
        
        toast.success(`Materia sincronizada`);

        // 🧠 EXECUTE HOLOBIONTIC ACTION (v10.0)
        if (zap) {
          try {
            await AgnosticLogicEngine.execute(zap, record, { context, schemaId });
          } catch (e) {
            toast.error(`Error en Acción: ${zap}`);
          }
        }

        if (onSuccess) onSuccess(record);
      }
    } catch (err) {
      toast.error("Fallo de comunicación industrial");
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
        const isDerived = !!field.config?.derivation;
        const colSpan = spanMap[field.width] || 'col-span-12 @lg:col-span-4';

        return (
          <div key={field.key} className={cn("space-y-1 group/field", colSpan, isDerived && "is-derived")}>
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
                  <SelectContent className="rounded-md border-border/60 bg-card/95 backdrop-blur-xl">
                    {field.options?.map((opt: string) => (
                      <SelectItem key={opt} value={opt} className="font-bold text-xs">{opt}</SelectItem>
                    ))}
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
      "@container overflow-hidden border-border/30 bg-card/40 backdrop-blur-2xl luxe-shadow transition-all duration-300",
      "flex flex-col",
      className
    )}>
      
      {!hideHeader && (
        <CardHeader 
          className="py-3 px-4 border-b bg-muted/5 cursor-pointer select-none"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChevronRight className={cn("w-3.5 h-3.5 transition-transform duration-300 opacity-20", isExpanded && "rotate-90 opacity-100 text-primary")} />
              <div className="space-y-0.5">
                <CardTitle className="text-base font-serif italic font-black tracking-tight leading-none">
                  {title || `Forjar ${schema.name}`}
                </CardTitle>
                {subtitle && (
                  <p className="text-[8px] font-bold uppercase tracking-widest opacity-30">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-20">
               {React.createElement(getModuleIcon('form'), { className: "w-3.5 h-3.5" })}
               <Separator orientation="vertical" className="h-3" />
               <span className="text-[7px] font-black uppercase tracking-[0.2em]">{schema.name}</span>
            </div>
          </div>
        </CardHeader>
      )}

      {isExpanded && (
        <form 
          id={`form-${schemaId}-${section || ''}`}
          onSubmit={handleSubmit} 
          className="flex-1 animate-in fade-in zoom-in-95 duration-300"
        >
          {/* 🆔 PRO IDENTITY FIELD: Hidden ID anchor */}
          <input type="hidden" name="id" value={activeRecord?.id || ''} />

        <CardContent className="p-3">
          {section ? (
            renderGrid(allFields)
          ) : (
            <div className="space-y-4">
              {Object.entries(sections).map(([name, sectionFields]) => (
                <div key={name} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-20">
                      {name.replace(/_/g, ' ')}
                    </span>
                    <Separator className="flex-1 opacity-5" />
                  </div>
                  {renderGrid(sectionFields)}
                </div>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="py-1.5 px-3 bg-muted/5 border-t border-border/5 flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={isSaving}
            className="h-7 px-4 rounded bg-sat-fg text-sat-bg font-black uppercase text-[8px] tracking-widest hover:bg-sat-fg/90 transition-all active:scale-[0.98] group"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 animate-spin" />
                Sincronizando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Sincronizar {section ? section.split('_')[0] : 'Materia'}
                <ArrowRight className="w-3 h-3 opacity-30 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </Button>
        </CardFooter>
      </form>
      )}
    </Card>
  );
}

