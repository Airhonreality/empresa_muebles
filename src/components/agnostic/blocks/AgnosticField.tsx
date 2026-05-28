'use client';

import React from 'react';
import { cn, getDeep } from '@/lib/utils';

export interface AgnosticFieldProps {
  field_key: string;
  record: any;
  schema?: any;
  context?: string;
}

export function AgnosticField({ field_key, record }: AgnosticFieldProps) {
  const value = getDeep(record?.data || {}, field_key);
  const label = field_key ? field_key.replace(/_/g, ' ') : 'Campo';

  return (
    <div className={cn('flex flex-col')}> 
      <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1">{label}</span>
      <div className="text-sm text-foreground truncate">{value === undefined || value === null ? '' : String(value)}</div>
    </div>
  );
}

export default AgnosticField;
