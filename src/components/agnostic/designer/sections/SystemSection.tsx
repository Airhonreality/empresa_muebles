'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Shield, Database, Palette, LogOut, RefreshCw } from 'lucide-react';
import { MasterPassport } from '@/types/sovereignty';
import { AgnosticConfigProjector } from '@/components/agnostic/modules/AgnosticConfigProjector';
import tokensSchema from '@/core/designer/dna/tokens.schema.json';

interface SystemSectionProps {
  config: Partial<MasterPassport>;
  setConfig: (newConfig: any) => Promise<void> | void;
}

export function SystemSection({ config, setConfig }: SystemSectionProps) {
  const router = useRouter();
  const [localTokens, setLocalTokens] = useState<any>(config);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalTokens(config);
  }, [config]);

  const isDirty = JSON.stringify(localTokens?.ui_tokens) !== JSON.stringify(config?.ui_tokens);

  const handleSaveTokens = async () => {
    setIsSaving(true);
    try {
      await setConfig(localTokens);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSiloRedirect = () => {
    if (confirm('¿Deseas salir al asistente de configuración para cambiar de Silo de datos? Tus configuraciones actuales se mantendrán a salvo.')) {
      router.push('/setup');
    }
  };

  return (
    <div className="space-y-6 py-2 animate-in fade-in duration-500">

      {/* FR1 & FR2 — Read-Only */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-1.5">
          <Shield size={14} className="text-primary" /> Soberanía y Núcleo
        </h3>
        <div className="bg-background border rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col gap-1">
            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Silo Activo</Label>
            <div className="h-9 px-3 border bg-muted/20 rounded-xl flex items-center justify-between text-xs font-mono font-bold text-foreground">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {config.project_identity || 'sin-silo'}
              </span>
              <span className="text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Conectado
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Estrategia del Adaptador</Label>
            <div className="h-9 px-3 border bg-muted/20 rounded-xl flex items-center text-xs font-bold text-foreground">
              <span className="flex items-center gap-2 text-primary">
                <Database size={13} />
                {config.storage_strategy === 'LocalStrategy' ? 'Local (Archivos JSON)' : config.storage_strategy || 'Local Strategy'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FR3 — Tokens con estado local + save explícito */}
      <div className="space-y-3 border-t pt-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-1.5">
            <Palette size={14} className="text-primary" /> Tokens Estéticos
          </h3>
          {isDirty && (
            <Button
              size="sm"
              onClick={handleSaveTokens}
              disabled={isSaving}
              className="h-7 text-[9px] font-black uppercase tracking-widest rounded-xl gap-1.5 px-3"
            >
              <RefreshCw size={10} className={isSaving ? 'animate-spin' : ''} />
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          )}
        </div>
        <div className="bg-background border rounded-2xl p-4 shadow-sm">
          <AgnosticConfigProjector
            schema={tokensSchema}
            data={localTokens}
            onUpdate={(patch) => setLocalTokens((prev: any) => ({
              ...prev,
              ...(patch.ui_tokens ? { ui_tokens: { ...(prev?.ui_tokens || {}), ...patch.ui_tokens } } : patch),
            }))}
          />
        </div>
      </div>

      {/* FR4 — Cambio de Silo */}
      <div className="border-t pt-5 space-y-2">
        <Button
          variant="outline"
          onClick={handleSiloRedirect}
          className="w-full h-9 border-dashed text-destructive hover:text-destructive hover:bg-destructive/5 font-bold uppercase text-[9px] tracking-widest gap-2 rounded-xl"
        >
          <LogOut size={12} /> Desconectar / Cambiar Silo
        </Button>
        <p className="text-[9px] text-muted-foreground text-center leading-relaxed">
          El cambio de silo requiere re-instanciar el motor físico y recargar los almacenes de datos.
        </p>
      </div>

    </div>
  );
}
