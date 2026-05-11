/**
 * 🏥 ARTEFACTO: SystemHealth.tsx
 * ────────────
 * CAPA: Projection (Admin Blocks)
 * VERSIÓN: 1.0
 * 
 * 🎯 FUNCTIONAL_SCOPE:
 * - Proyección visual del reporte de integridad del sistema.
 * - Categorización de errores y advertencias de configuración.
 * - Guía de reparación in-situ para el administrador.
 */
'use client';

import React from 'react';
import { useSystemStore } from '@/lib/agnostic/store';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function SystemHealth() {
  const { integrity } = useSystemStore();

  if (!integrity) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
        <Info size={32} />
        <p className="text-xs font-bold uppercase tracking-widest">Escaneando integridad...</p>
      </div>
    );
  }

  if (integrity.isValid && integrity.issues.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-in zoom-in duration-500">
          <CheckCircle2 size={32} />
        </div>
        <div>
          <h4 className="text-sm font-black uppercase tracking-tight">Sistema Saludable</h4>
          <p className="text-[10px] text-muted-foreground uppercase font-bold opacity-50">Toda la configuración es coherente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-2 px-2">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Diagnóstico de Salud</h4>
        <span className={cn(
          "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
          integrity.isValid ? "bg-amber-500/10 text-amber-500" : "bg-destructive/10 text-destructive"
        )}>
          {integrity.isValid ? 'Precaución' : 'Estado Crítico'}
        </span>
      </div>

      <div className="space-y-3">
        {integrity.issues.map((issue: any, idx: number) => (
          <Alert key={idx} variant={issue.level === 'ERROR' ? 'destructive' : 'default'} className={cn(
            "border-none bg-card/40 backdrop-blur-md luxe-shadow",
            issue.level === 'WARNING' && "border-l-2 border-amber-500 bg-amber-500/5"
          )}>
            <div className="flex gap-3">
              {issue.level === 'ERROR' ? <AlertCircle className="w-4 h-4 mt-0.5" /> : <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-500" />}
              <div className="space-y-1">
                <AlertTitle className="text-[10px] font-black uppercase tracking-tight leading-none mb-1">
                  {issue.context}: {issue.level}
                </AlertTitle>
                <AlertDescription className="text-xs font-medium text-foreground/80">
                  {issue.message}
                </AlertDescription>
                {issue.fixSuggestion && (
                  <div className="mt-2 flex items-center gap-2 text-[9px] font-bold text-primary/60 uppercase group cursor-pointer hover:text-primary transition-colors">
                    <span>Sugerencia: {issue.fixSuggestion}</span>
                    <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </div>
            </div>
          </Alert>
        ))}
      </div>

      <p className="text-[8px] text-center font-bold text-muted-foreground opacity-30 uppercase pt-4 italic">
        Último escaneo: {new Date(integrity.timestamp).toLocaleTimeString()}
      </p>
    </div>
  );
}
