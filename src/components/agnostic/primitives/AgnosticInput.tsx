'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface Props {
  schema?: any;
  value: any;
  onSync: (val: any) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  ghost?: boolean;
  className?: string;
}

export function AgnosticInput({ 
  schema, 
  value, 
  onSync, 
  label, 
  placeholder, 
  disabled,
  ghost,
  className
}: Props) {
  const [localValue, setLocalValue] = useState(value ?? '');
  const fieldType = schema?.data?.type || 'string';

  useEffect(() => {
    setLocalValue(value ?? '');
  }, [value]);

  const handleSync = (val: any) => {
    let processedValue = val;
    if (fieldType === 'number') {
      processedValue = val === '' ? 0 : Number(val);
    }
    if (processedValue !== value) {
      onSync(processedValue);
    }
  };

  const onBlur = () => handleSync(localValue);
  
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && fieldType !== 'text') {
      handleSync(localValue);
      (e.target as HTMLElement).blur();
    }
  };

  const inputStyles = cn(
    "rounded-md border-border bg-secondary/10 font-medium text-sm focus:ring-0 transition-all",
    ghost && "border-none bg-transparent shadow-none px-0 h-auto",
    !ghost && "h-9 px-3",
    fieldType === 'text' && "min-h-[112px] p-3",
    className
  );

  return (
    <div className={cn("space-y-3 group", className)}>
      {label && (
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 group-focus-within:text-primary transition-colors px-1">
          {label}
        </Label>
      )}
      
      {fieldType === 'text' ? (
        <Textarea
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder || `Ingresar ${label || 'dato'}...`}
          disabled={disabled}
          className={inputStyles}
        />
      ) : (
        <Input
          type={fieldType === 'number' ? 'number' : fieldType === 'date' ? 'date' : 'text'}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          placeholder={placeholder || `Ingresar ${label || 'dato'}...`}
          disabled={disabled}
          className={inputStyles}
        />
      )}
    </div>
  );
}
