'use client';

/**
 * 🏛️ ARTEFACTO: DNASection.tsx
 * ────────────
 * CAPA: Staging (DNA Architecture)
 * VERSIÓN: 4.0
 * COMMIT: P3-M4.1-ADR-DNA-PURIFICATION
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Arquitectura de estructuras de datos agnósticas (DNA Schemas).
 * - Proyector de edición de átomos y campos.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Ser un proyector ciego de la estructura del ADN.
 * - NEVER: Hardcodear tipos de datos o lógica de renderizado de campos.
 */

import { useState, useMemo } from 'react';
import { Database, Plus, FileJson, ArrowLeft, Trash2, Box, Layout, Info, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgnosticForm } from '@/components/agnostic/blocks/AgnosticForm';
import { useAgnosticSchema } from '@/lib/agnostic/SchemaInterpreter';
import { toast } from 'sonner';

// Schema interno para definir un "Átomo" (Campo) del DNA
const dnaFieldSchema = {
  name: 'DNA Atom',
  fields: [
    { key: "key", label: "Atom Identifier (Slug)", width: "half", required: true },
    { key: "label", label: "Display Label", width: "half", required: true },
    { 
      key: "type", 
      label: "Data Type", 
      width: "half", 
      type: "select", 
      options: [
        { label: "Text", value: "text" },
        { label: "Number", value: "number" },
        { label: "Select", value: "select" },
        { label: "Date", value: "date" },
        { label: "Boolean", value: "boolean" },
        { label: "Textarea", value: "textarea" }
      ]
    },
    { 
      key: "width", 
      label: "UI Width", 
      width: "half", 
      type: "select", 
      options: [
        { label: "Full Width", value: "full" },
        { label: "Half (50%)", value: "half" },
        { label: "Third (33%)", value: "third" }
      ]
    },
    { key: "description", label: "Help Text / Description", width: "full", type: "textarea" }
  ]
};

interface DNASectionProps {
  schemas: any[];
  setSchemas: (schemas: any[]) => void;
}

export function DNASection({ schemas, setSchemas }: DNASectionProps) {
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null);
  const { schema: atomSchema, isLoading } = useAgnosticSchema(dnaFieldSchema);

  const selectedSchema = useMemo(() => 
    schemas.find(s => s.id === selectedSchemaId), 
  [schemas, selectedSchemaId]);

  const handleUpdateSchema = (id: string, patch: any) => {
    setSchemas(schemas.map(s => s.id === id ? { ...s, data: { ...s.data, ...patch } } : s));
  };

  const handleAddField = (id: string) => {
    const schema = schemas.find(s => s.id === id);
    const fields = [...(schema?.data?.fields || []), { 
      id: crypto.randomUUID(), 
      key: `field_${Date.now()}`, 
      label: 'New Atom', 
      type: 'text' 
    }];
    handleUpdateSchema(id, { fields });
  };

  const handleRemoveField = (schemaId: string, fieldId: string) => {
    const schema = schemas.find(s => s.id === schemaId);
    const fields = schema?.data?.fields.filter((f: any) => f.id !== fieldId);
    handleUpdateSchema(schemaId, { fields });
  };

  if (isLoading) return <div className="p-12 text-center opacity-30 uppercase text-[10px] font-bold">Invocando Átomos...</div>;

  if (selectedSchemaId && selectedSchema) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between border-b pb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedSchemaId(null)}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-primary">Architect Mode</h3>
              <p className="text-[10px] font-bold opacity-40 uppercase">{selectedSchema.data.name}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleAddField(selectedSchemaId)}
            className="text-[10px] font-bold uppercase tracking-widest gap-2"
          >
            <Plus size={14} /> Add New Atom
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {(selectedSchema.data.fields || []).map((field: any, idx: number) => (
            <div key={field.id || idx} className="group bg-background border rounded-2xl p-6 hover:border-primary/30 transition-all">
              <div className="flex items-start gap-6">
                <div className="h-10 w-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary/40 group-hover:text-primary transition-colors">
                  <Box size={20} />
                </div>
                <div className="flex-1">
                  <AgnosticForm 
                    schema={atomSchema}
                    activeRecord={{ data: field }}
                    hideHeader={true}
                    onFieldChange={(_, __, allData) => {
                      const newFields = [...selectedSchema.data.fields];
                      newFields[idx] = { ...field, ...allData };
                      handleUpdateSchema(selectedSchemaId, { fields: newFields });
                    }}
                    className="border-none shadow-none bg-transparent p-0"
                  />
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleRemoveField(selectedSchemaId, field.id)}
                  className="text-destructive/40 hover:text-destructive"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between border-b pb-6">
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase tracking-wider text-primary flex items-center gap-2">
            <FileJson size={16} /> DNA Registry
          </h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-60 font-bold">
            Structural definitions for agnostic materia
          </p>
        </div>
        <Button 
          onClick={() => {
            const id = `schema_${Date.now()}_def`;
            setSchemas([...schemas, { id, context: 'schema_definitions', data: { name: 'New Schema', fields: [] } }]);
            setSelectedSchemaId(id);
          }}
          variant="outline" size="sm" className="font-bold gap-2 text-[10px] uppercase h-8 px-4"
        >
          <Plus size={14} /> New DNA Blueprint
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schemas.map((schema) => (
          <div key={schema.id} className="group p-6 bg-muted/20 border rounded-2xl hover:border-primary/50 transition-all cursor-pointer" onClick={() => setSelectedSchemaId(schema.id)}>
            <div className="h-12 w-12 rounded-xl bg-background border flex items-center justify-center text-primary mb-4">
              <FileJson size={24} />
            </div>
            <h4 className="text-sm font-bold tracking-tight mb-1">{schema.data.name}</h4>
            <div className="flex items-center justify-between">
               <span className="text-[10px] font-bold uppercase opacity-40">{schema.data.fields?.length || 0} Atoms</span>
               <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-primary">
                 <Zap size={14} />
               </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
