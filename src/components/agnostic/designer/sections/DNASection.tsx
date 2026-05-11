'use client';

/**
 * 🏛️ ARTEFACTO: DNASection.tsx
 * ────────────
 * CAPA: Staging (DNA Architecture)
 * VERSIÓN: 2.1
 * COMMIT: P2-M2.5-ADR-HIERARCHICAL-TREE
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Arquitectura de estructuras de datos agnósticas (DNA Schemas).
 * - Navegación jerárquica por secciones y átomos de configuración.
 * - Gestión de tipos de campo, anchos responsivos y orígenes de opciones.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Mantener la consistencia de las claves de campo dentro de un mismo esquema.
 * - NEVER: Forzar estilos visuales que contaminen la proyección agnóstica.
 * - ALWAYS: Proveer una experiencia de edición colapsable para gestionar grandes volúmenes de átomos.
 * 
 * 📜 ADR: [2026-05-10] TREE_VIEW_ACCORDION_NAVIGATION
 * - DECISIÓN: Implementar una vista de árbol basada en acordeones para la edición del ADN.
 * - MOTIVO: Mejorar la escaneabilidad y reducir la fatiga visual en esquemas complejos.
 * - IMPACTO: Navegación profesional tipo IDE dentro del navegador.
 * 
 * 🔗 RELATIONSHIPS:
 * - UPSTREAM: [AgnosticConfigManager]
 * - DOWNSTREAM: [AgnosticConfigProjector, Schema Definitions Registry]
 */

import { useState, useMemo } from 'react';
import { Database, Plus, FileJson, ArrowLeft, Trash2, Box, Layers, Layout, Info, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface DNASectionProps {
  schemas: any[];
  setSchemas: (schemas: any[]) => void;
}

export function DNASection({ schemas, setSchemas }: DNASectionProps) {
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null);

  const selectedSchema = schemas.find(s => s.id === selectedSchemaId);

  // 🛠️ HANDLERS
  const handleUpdateSchema = (updatedSchema: any) => {
    setSchemas(schemas.map(s => s.id === updatedSchema.id ? updatedSchema : s));
  };

  const handleAddField = (sectionName: string = 'General') => {
    if (!selectedSchema) return;
    const newField = {
      key: `field_${crypto.randomUUID().slice(0, 4)}`,
      label: 'Nuevo Campo',
      type: 'text',
      section: sectionName,
      width: 'full',
      required: false
    };
    handleUpdateSchema({
      ...selectedSchema,
      data: { ...selectedSchema.data, fields: [...(selectedSchema.data.fields || []), newField] }
    });
  };

  const updateField = (index: number, patch: any) => {
    const fields = [...(selectedSchema.data.fields || [])];
    fields[index] = { ...fields[index], ...patch };
    handleUpdateSchema({ ...selectedSchema, data: { ...selectedSchema.data, fields } });
  };

  const removeField = (index: number) => {
    const fields = selectedSchema.data.fields.filter((_: any, i: number) => i !== index);
    handleUpdateSchema({ ...selectedSchema, data: { ...selectedSchema.data, fields } });
  };

  // 🏛️ ORGANIZACIÓN JERÁRQUICA: Agrupar por sección
  const groupedFields = useMemo(() => {
    if (!selectedSchema) return {};
    const fields = selectedSchema.data.fields || [];
    return fields.reduce((acc: any, field: any, index: number) => {
      const section = field.section || 'General';
      if (!acc[section]) acc[section] = [];
      acc[section].push({ ...field, originalIndex: index });
      return acc;
    }, {});
  }, [selectedSchema]);

  const sections = useMemo(() => Object.keys(groupedFields), [groupedFields]);

  if (selectedSchemaId && selectedSchema) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        
        {/* Header Arquitecto */}
        <div className="flex items-center justify-between border-b border-border/10 pb-6 sticky top-0 bg-background/80 backdrop-blur-md z-40">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedSchemaId(null)} className="rounded-xl">
              <ArrowLeft size={18} />
            </Button>
            <div className="space-y-1">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                <Layers size={14} /> Arquitecto de DNA
              </h3>
              <div className="flex items-center gap-4">
                <Input 
                  value={selectedSchema.data.name}
                  onChange={(e) => handleUpdateSchema({ ...selectedSchema, data: { ...selectedSchema.data, name: e.target.value } })}
                  className="bg-transparent border-none p-0 h-auto text-xl font-black tracking-tighter focus-visible:ring-0 w-auto"
                />
                <span className="text-[10px] font-mono text-muted-foreground opacity-30">ID: {selectedSchema.id}</span>
              </div>
            </div>
          </div>

          <Button onClick={() => handleAddField()} size="sm" className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2">
            <Plus size={14} /> Nuevo Átomo
          </Button>
        </div>

        <div className="max-w-6xl pb-20 space-y-6">
          <Accordion type="multiple" className="space-y-6">
            {sections.map((sectionName) => (
              <AccordionItem 
                key={sectionName} 
                value={sectionName}
                className="border-none bg-transparent rounded-[2.5rem] overflow-hidden px-8 pb-4"
              >
                <div className="flex items-center justify-between py-6">
                  <AccordionTrigger className="flex-1 hover:no-underline py-0">
                    <div className="flex items-center gap-4 text-left">
                       <div className="p-3 bg-background rounded-2xl border border-border/10 text-primary">
                          <Layout size={18} />
                       </div>
                       <div>
                         <h4 className="text-xs font-black uppercase tracking-widest leading-none">{sectionName}</h4>
                         <p className="text-[9px] text-muted-foreground font-bold mt-1 uppercase opacity-50">
                           {groupedFields[sectionName].length} Átomos en este grupo
                         </p>
                       </div>
                    </div>
                  </AccordionTrigger>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => { e.stopPropagation(); handleAddField(sectionName); }}
                    className="h-10 w-10 rounded-xl bg-background border border-border/5 text-primary/40 hover:text-primary hover:bg-background"
                  >
                    <Plus size={16} />
                  </Button>
                </div>

                <AccordionContent className="space-y-4 pt-4 border-t border-border/5 mt-2">
                  {groupedFields[sectionName].map((field: any) => (
                    <div 
                      key={field.originalIndex} 
                      className="group p-8 bg-transparent border border-border/10 rounded-[2.5rem] hover:border-primary/20 transition-all"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        
                        {/* 1. Identidad */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-muted-foreground/30 mb-1">
                            <Box size={12} />
                            <label className="text-[8px] font-black uppercase tracking-widest">Identidad</label>
                          </div>
                          <Input 
                            placeholder="Key ID"
                            value={field.key} 
                            onChange={(e) => updateField(field.originalIndex, { key: e.target.value })}
                            className="bg-muted/10 border-none rounded-lg text-[10px] font-bold h-9"
                          />
                          <Input 
                            placeholder="Etiqueta"
                            value={field.label} 
                            onChange={(e) => updateField(field.originalIndex, { label: e.target.value })}
                            className="bg-muted/10 border-none rounded-lg text-[10px] font-bold h-9"
                          />
                        </div>

                        {/* 2. Reglas */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-muted-foreground/30 mb-1">
                            <Layers size={12} />
                            <label className="text-[8px] font-black uppercase tracking-widest">Tipo / Reglas</label>
                          </div>
                          <select 
                            value={field.type} 
                            onChange={(e) => updateField(field.originalIndex, { type: e.target.value })}
                            className="w-full h-9 px-3 bg-muted/10 border-none rounded-lg text-[10px] font-bold appearance-none cursor-pointer"
                          >
                            <option value="text">Texto</option>
                            <option value="number">Número</option>
                            <option value="select">Selector</option>
                            <option value="date">Fecha</option>
                            <option value="boolean">Switch</option>
                          </select>
                          <div className="flex items-center justify-between px-2 bg-muted/5 h-9 rounded-lg">
                            <span className="text-[8px] font-black uppercase text-muted-foreground/50">Requerido</span>
                            <Switch 
                              checked={field.required} 
                              onCheckedChange={(c) => updateField(field.originalIndex, { required: c })}
                            />
                          </div>
                        </div>

                        {/* 3. Layout / Movimiento */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-muted-foreground/30 mb-1">
                            <Layout size={12} />
                            <label className="text-[8px] font-black uppercase tracking-widest">Ubicación</label>
                          </div>
                          <Input 
                            placeholder="Cambiar Grupo"
                            value={field.section} 
                            onChange={(e) => updateField(field.originalIndex, { section: e.target.value })}
                            className="bg-primary/5 border-none rounded-lg text-[10px] font-bold h-9 text-primary placeholder:text-primary/30"
                          />
                          <select 
                            value={field.width || 'full'} 
                            onChange={(e) => updateField(field.originalIndex, { width: e.target.value })}
                            className="w-full h-9 px-3 bg-muted/10 border-none rounded-lg text-[10px] font-bold appearance-none cursor-pointer"
                          >
                            <option value="full">100% Ancho</option>
                            <option value="half">50% Mitad</option>
                            <option value="third">33% Tercio</option>
                          </select>
                        </div>

                        {/* 4. Descripción y Borrado */}
                        <div className="space-y-3 flex flex-col">
                          <div className="flex items-center gap-2 text-muted-foreground/30 mb-1">
                            <Info size={12} />
                            <label className="text-[8px] font-black uppercase tracking-widest">Tooltip</label>
                          </div>
                          <textarea 
                            placeholder="Ayuda para el usuario..."
                            value={field.description || ''}
                            onChange={(e) => updateField(field.originalIndex, { description: e.target.value })}
                            className="w-full h-20 p-3 bg-muted/10 border-none rounded-lg text-[10px] font-medium resize-none focus:ring-0"
                          />
                          <div className="flex justify-end">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeField(field.originalIndex)}
                              className="h-8 w-8 text-destructive/20 hover:text-destructive hover:bg-destructive/5 rounded-lg"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>

                      </div>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    );
  }

  // 📊 VISTA: REGISTRO (LISTADO)
  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2 leading-none">
            <Database size={14} /> DNA Registry
          </h3>
          <p className="text-[9px] text-muted-foreground font-mono opacity-50 uppercase tracking-widest">
            Silos de definición estructural
          </p>
        </div>

        <Button 
          onClick={() => {
            const newId = `schema_${crypto.randomUUID().slice(0, 8)}_def`;
            setSchemas([...schemas, { id: newId, context: 'schema_definitions', data: { name: 'Nuevo Esquema', fields: [] } }]);
            setSelectedSchemaId(newId);
          }}
          variant="outline" 
          size="sm" 
          className="h-10 rounded-2xl border-dashed border-primary/30 text-[11px] font-bold gap-3 px-6 hover:bg-primary/5 transition-all"
        >
          <Plus size={16} /> Nuevo Esquema
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {schemas.map((schema) => (
          <button 
            key={schema.id} 
            onClick={() => setSelectedSchemaId(schema.id)}
            className="group p-8 bg-muted/5 border border-border/10 rounded-[2.5rem] hover:border-primary/30 transition-all duration-300 text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-all group-hover:scale-150" />
            <div className="relative z-10 flex flex-col gap-6">
              <div className="h-14 w-14 rounded-2xl bg-background flex items-center justify-center border border-border/10 text-primary shadow-sm group-hover:shadow-primary/10 transition-all">
                <FileJson size={24} />
              </div>
              <div className="space-y-2">
                <p className="text-[12px] font-black uppercase tracking-widest text-foreground/80">{schema.data.name || schema.id}</p>
                <div className="flex items-center gap-4 text-[9px] font-bold text-muted-foreground opacity-40 font-mono uppercase tracking-widest">
                  <span>{schema.data.fields?.length || 0} Átomos</span>
                  <span>{schema.data.type || 'Object'}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
