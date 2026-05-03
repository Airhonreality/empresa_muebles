'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useAppState } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { SchemaDefinition, FieldDefinition } from '@/core/types';
import { AgnosticInput } from './AgnosticInput';
import { AgnosticModuleLoader } from './AgnosticModuleLoader';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Save, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  schemaId: string;
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
  className?: string;
  logicModule?: string;
}

export function AgnosticForm({ 
  schemaId, 
  initialData = {}, 
  onSubmit, 
  onCancel, 
  title, 
  description,
  className,
  logicModule
}: Props) {
  const { state } = useAppState();
  const { user } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const updateListeners = useRef<Record<string, ((val: any) => void)[]>>({});

  const schema = useMemo(() => 
    state.system.schemas.find(s => s.id === schemaId), 
    [state.system.schemas, schemaId]
  );

  const handleChange = useCallback((key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (updateListeners.current[key]) {
      updateListeners.current[key].forEach(cb => cb(value));
    }
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  }, [errors]);

  // --- Solution to Point 1: Expanded Business Logic API ---
  const formApi = useMemo(() => ({
    // Data Access
    getValue: (key: string) => formData[key],
    setValue: (key: string, val: any) => setFormData(prev => ({ ...prev, [key]: val })),
    onUpdate: (key: string, cb: (val: any) => void) => {
      if (!updateListeners.current[key]) updateListeners.current[key] = [];
      updateListeners.current[key].push(cb);
    },
    
    // Identity Awareness
    user: user,
    
    // Navigation & UX
    router: router,
    notify: {
      success: (msg: string) => toast.success(msg),
      error: (msg: string) => toast.error(msg),
      info: (msg: string) => toast.info(msg),
    },
    
    // Core State Access (Read-only for safety)
    getGlobalData: (context: string) => state.data[context] || []
  }), [formData, user, router, state.data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    schema?.fields.forEach(field => {
      if (field.required && !formData[field.key]) {
        newErrors[field.key] = `${field.label} is required`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix the errors in the form');
      return;
    }
    onSubmit(formData);
  };

  const renderForm = () => (
    <Card className={cn("border-border/40 shadow-2xl bg-background/50 backdrop-blur-sm rounded-3xl overflow-hidden animate-in zoom-in-95 duration-500", className)}>
      {(title || description) && (
        <CardHeader className="bg-muted/20 p-6 border-b border-border/10">
          {title && <CardTitle className="text-xl font-black">{title}</CardTitle>}
          {description && <CardDescription className="text-xs font-medium italic">{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {schema?.fields.map((field) => (
              <div key={field.key} className="space-y-2.5">
                <Label className={cn(
                  "text-[10px] font-black uppercase tracking-[0.2em] ml-1",
                  errors[field.key] ? "text-destructive" : "text-muted-foreground/60"
                )}>
                  {field.label}
                  {field.required && <span className="text-primary ml-1">*</span>}
                </Label>

                {field.type === 'select' ? (
                  <Select value={formData[field.key] || ''} onValueChange={(val) => handleChange(field.key, val)}>
                    <SelectTrigger className={cn("h-11 bg-muted/20 border-border/20 rounded-xl", errors[field.key] && "border-destructive/40")}>
                      <SelectValue placeholder={`Select ${field.label}...`} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-background/95 backdrop-blur-xl border-border/20 shadow-2xl">
                      {(field.options ?? []).map(opt => (
                        <SelectItem key={opt} value={opt} className="text-xs font-bold">{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <AgnosticInput
                    type={field.type === 'number' ? 'number' : 'text'}
                    value={formData[field.key] || ''}
                    onSync={(val) => handleChange(field.key, val)}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    className={cn("h-11 bg-muted/20 border-border/20 rounded-xl px-4 font-semibold", errors[field.key] && "border-destructive/40")}
                  />
                )}

                {errors[field.key] && (
                  <p className="text-[10px] text-destructive font-bold flex items-center gap-1.5 animate-in slide-in-from-top-1">
                    <AlertCircle size={10} /> {errors[field.key]}
                  </p>
                )}
              </div>
            ))}
          </div>
          <Separator className="bg-border/10" />
          <div className="flex items-center justify-end gap-3 pt-2">
            {onCancel && <Button type="button" variant="ghost" onClick={onCancel} className="rounded-xl px-6 font-bold">Cancel</Button>}
            <Button type="submit" className="rounded-xl px-10 font-bold bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"><Save size={16} className="mr-2" />Save Record</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  if (!schema) return <div className="p-8 border-2 border-dashed border-destructive/20 rounded-3xl text-destructive flex items-center gap-3 bg-destructive/5"><AlertCircle size={20} /> <span className="font-bold text-sm">Error: Schema '{schemaId}' not found.</span></div>;

  if (logicModule) {
    return (
      <AgnosticModuleLoader moduleName={logicModule} api={formApi}>
        {renderForm()}
      </AgnosticModuleLoader>
    );
  }

  return renderForm();
}
