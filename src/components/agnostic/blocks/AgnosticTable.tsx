/**
 * 🛡️ ARTEFACTO: AgnosticTable.tsx
 * ────────────
 * CAPA: Projection (Decentralized Blocks)
 * VERSIÓN: 8.0
 * ADR: [adr_v8_0_deterministic_state.md]
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Proyección de matrices de datos (Tables) vía DNA/Schemas.
 * - Soporte para 'Switches' (columnas dinámicas) y acciones contextuales.
 * 
 * 🛡️ AXIOMATIC_CONTRACT:
 * - MUST: Renderizar celdas dinámicamente basadas en el tipo de campo (Badge, Currency, Text).
 * - MUST: Proyectar el icono canónico desde el Visual Registry.
 * - NEVER: Gestionar estado local de datos (consumir de useAppState/useDNAStore).
 */
'use client';

import React from 'react';
import { useAppState } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Eye, FileEdit, Trash2 } from 'lucide-react';
import { getModuleIcon } from '@/lib/agnostic/constants';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface Props {
  schemaId: string;
  context?: string;
  title?: string;
  switches?: string[];
  onAction?: (action: string, id: string) => void;
  className?: string;
}

export function AgnosticTable({ schemaId, context, title, switches, onAction, className }: Props) {
  const { state } = useAppState();
  const { user } = useAuth();
  
  // 🛰️ STRICT EXPLICIT CONTEXT (Spec v7.0)
  if (!schemaId || !context) return null;

  const schemas = (state.data['schema_definitions'] || []) as any[];
  const schemaRecord = schemas.find((s) => s.id === schemaId);
  const schema = schemaRecord?.data;
  const records = state.data[context] || [];

  if (!schema) return null;

  const columns = schema.fields.filter((f: any) => {
    const isVisible = !f.visibility_whitelist || (user && f.visibility_whitelist.includes(user.role));
    const isSwitched = !switches || switches.length === 0 || switches.includes(f.key);
    return isVisible && isSwitched;
  });

  const renderCellValue = (value: any, fieldKey: string) => {
    if (value === null || value === undefined) return <span className="opacity-20">—</span>;
    
    // Auto-Badge for Status
    if (fieldKey === 'status' || fieldKey.includes('state')) {
      const variants: Record<string, "secondary" | "default" | "outline" | "destructive"> = {
        'Proyección': 'secondary',
        'Enviado':    'default',
        'Producción': 'outline',
        'Finalizado': 'outline'
      };
      return <Badge variant={variants[value] || 'outline'} className="font-black uppercase text-[8px] tracking-widest">{value}</Badge>;
    }

    // Currency Formatting
    if (fieldKey.includes('price') || fieldKey.includes('budget') || fieldKey.includes('total')) {
      return <span className="font-mono font-bold">${Number(value).toLocaleString()}</span>;
    }

    return <span className="font-medium text-sm">{String(value)}</span>;
  };

  return (
    <Card className={cn("overflow-hidden border-border luxe-shadow animate-in fade-in duration-700", className)}>
      {(title || schema.name) && (
        <CardHeader className="bg-muted/30 border-b p-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-1.5 bg-primary/5 text-primary/40 rounded-lg">
                {React.createElement(getModuleIcon('table'), { size: 14 })}
             </div>
             <CardTitle className="text-[11px] font-black uppercase tracking-[0.4em] opacity-60">
               {title || schema.name}
             </CardTitle>
          </div>
          <div className="flex items-center gap-2 opacity-20">
             <Separator orientation="vertical" className="h-3" />
             <span className="text-[7px] font-black uppercase tracking-[0.2em]">{schema.name}</span>
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/10">
            <TableRow className="hover:bg-transparent">
              {columns.map((col: any) => (
                <TableHead key={col.key} className="text-[9px] font-black uppercase tracking-widest h-12 px-6">
                  {col.label}
                </TableHead>
              ))}
              <TableHead className="text-right px-6 text-[9px] font-black uppercase tracking-widest h-12">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="h-32 text-center text-[10px] font-bold opacity-30 italic">
                  No se han detectado registros en esta Bóveda.
                </TableCell>
              </TableRow>
            ) : (
              records.map((record: any) => (
                <TableRow key={record.id} className="group hover:bg-muted/50 transition-colors cursor-pointer border-border/50">
                  {columns.map((col: any) => (
                    <TableCell key={col.key} className="px-6 py-4">
                      {renderCellValue(record.data[col.key], col.key)}
                    </TableCell>
                  ))}
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         onClick={() => onAction?.('edit', record.id)}
                         className="h-8 w-8 hover:text-primary"
                       >
                          <FileEdit size={14} />
                       </Button>
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         onClick={() => onAction?.('delete', record.id)}
                         className="h-8 w-8 hover:text-destructive"
                       >
                          <Trash2 size={14} />
                       </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
